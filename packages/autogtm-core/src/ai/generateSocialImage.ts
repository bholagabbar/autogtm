import OpenAI from 'openai';
import { getSupabaseClient } from '../db/autogtmDbCalls';

const DEFAULT_BUCKET = 'social-images';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const OPENROUTER_VIDEO_POLL_INTERVAL_MS = 30000;
const OPENROUTER_VIDEO_TIMEOUT_MS = Number(process.env.OPENROUTER_VIDEO_TIMEOUT_MS || 20 * 60 * 1000);

export type SocialAssetMode = 'image' | 'video';
export type OpenRouterVideoModel = 'google/veo-3.1-fast' | 'bytedance/seedance-2.0-fast';

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is required');
  return new OpenAI({ apiKey });
}

function getOpenRouterApiKey(): string {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is required for video generation');
  }
  return apiKey;
}

function getVideoModel(model?: OpenRouterVideoModel): OpenRouterVideoModel {
  if (model) return model;
  const fromEnv = (process.env.OPENROUTER_VIDEO_MODEL || 'google/veo-3.1-fast') as OpenRouterVideoModel;
  if (fromEnv === 'google/veo-3.1-fast' || fromEnv === 'bytedance/seedance-2.0-fast') return fromEnv;
  return 'google/veo-3.1-fast';
}

async function startOpenRouterVideoGeneration(
  prompt: string,
  model: OpenRouterVideoModel
): Promise<{ id: string; pollingUrl?: string }> {
  const apiKey = getOpenRouterApiKey();
  const response = await fetch(`${OPENROUTER_BASE_URL}/videos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      prompt,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenRouter generation start failed: ${response.status} - ${text}`);
  }

  const data = await response.json() as { id?: string; polling_url?: string };
  if (!data.id) {
    throw new Error('OpenRouter generation did not return an id');
  }
  return { id: data.id, pollingUrl: data.polling_url };
}

async function pollOpenRouterVideoResult(
  generationId: string,
  pollingUrl?: string,
  timeoutMs = OPENROUTER_VIDEO_TIMEOUT_MS
): Promise<string> {
  const apiKey = getOpenRouterApiKey();
  const started = Date.now();

  while (Date.now() - started < timeoutMs) {
    let response: Response;
    try {
      response = await fetch(pollingUrl || `${OPENROUTER_BASE_URL}/videos/${generationId}`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      continue;
    }
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenRouter generation poll failed: ${response.status} - ${text}`);
    }

    const data = await response.json() as {
      status?: string;
      output?: Array<{ url?: string }>;
      unsigned_urls?: string[];
      video_url?: string;
      url?: string;
      error?: string;
    };

    const status = String(data.status || '').toLowerCase();
    const contentUrl = `${OPENROUTER_BASE_URL}/videos/${generationId}/content?index=0`;
    const maybeUrl = data.video_url || data.url || data.unsigned_urls?.[0] || data.output?.[0]?.url || contentUrl;

    if ((status === 'completed' || status === 'succeeded' || status === 'success') && maybeUrl) {
      return maybeUrl;
    }
    if (status === 'failed' || status === 'error' || status === 'cancelled' || status === 'expired') {
      throw new Error(`OpenRouter generation failed with status: ${status}${data.error ? ` - ${data.error}` : ''}`);
    }

    await new Promise((resolve) => setTimeout(resolve, OPENROUTER_VIDEO_POLL_INTERVAL_MS));
  }

  throw new Error('OpenRouter generation timed out');
}

export async function ensureSocialImageBucket(bucketName = process.env.SUPABASE_STORAGE_BUCKET_SOCIAL || DEFAULT_BUCKET): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) throw listError;

  if ((buckets || []).some((bucket) => bucket.name === bucketName)) {
    return;
  }

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
    fileSizeLimit: '10MB',
  });
  if (createError) throw createError;
}

export async function generateSocialImage(params: {
  prompt: string;
  companyId: string;
  postId: string;
  mode?: SocialAssetMode;
  videoModel?: OpenRouterVideoModel;
  bucketName?: string;
}): Promise<{ imageUrl: string; storagePath: string }> {
  const mode = params.mode || (process.env.SOCIAL_MEDIA_ASSET_MODE === 'video' ? 'video' : 'image');
  const bucketName = params.bucketName || process.env.SUPABASE_STORAGE_BUCKET_SOCIAL || DEFAULT_BUCKET;
  const supabase = getSupabaseClient();

  await ensureSocialImageBucket(bucketName);

  let buffer: Buffer;
  let contentType: string;
  let extension: string;

  if (mode === 'video') {
    const model = getVideoModel(params.videoModel);
    const apiKey = getOpenRouterApiKey();
    const generation = await startOpenRouterVideoGeneration(params.prompt, model);
    const videoUrl = await pollOpenRouterVideoResult(generation.id, generation.pollingUrl);
    let mediaRes = await fetch(videoUrl);
    if (!mediaRes.ok) {
      mediaRes = await fetch(videoUrl, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
    }
    if (!mediaRes.ok) throw new Error(`Failed downloading generated video: ${mediaRes.status}`);
    const arr = await mediaRes.arrayBuffer();
    buffer = Buffer.from(arr);
    contentType = mediaRes.headers.get('content-type') || 'video/mp4';
    extension = 'mp4';
  } else {
    const openai = getOpenAIClient();
    const image = await openai.images.generate({
      model: 'gpt-image-1',
      prompt: params.prompt,
      size: '1024x1024',
    });

    const b64 = image.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error('OpenAI did not return image data');
    }
    buffer = Buffer.from(b64, 'base64');
    contentType = 'image/png';
    extension = 'png';
  }

  const storagePath = `${params.companyId}/${params.postId}-${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
    });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
  return { imageUrl: data.publicUrl, storagePath };
}
