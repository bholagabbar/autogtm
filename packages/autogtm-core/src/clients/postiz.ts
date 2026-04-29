const DEFAULT_POSTIZ_BASE_URL = 'https://api.postiz.com/public/v1';

function getPostizApiKey(): string {
  const apiKey = process.env.POSTIZ_API_KEY;
  if (!apiKey) {
    throw new Error('POSTIZ_API_KEY is required');
  }
  return apiKey;
}

function getPostizBaseUrl(): string {
  return process.env.POSTIZ_BASE_URL || DEFAULT_POSTIZ_BASE_URL;
}

async function postizFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const apiKey = getPostizApiKey();
  const baseUrl = getPostizBaseUrl();

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      Authorization: apiKey,
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Postiz API error: ${response.status} - ${errorText}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export interface PostizUpload {
  id: string;
  path: string;
  [key: string]: unknown;
}

export interface PostizIntegration {
  id: string;
  name?: string;
  provider?: string;
  [key: string]: unknown;
}

export interface PostizCreatePostRequest {
  type: 'now' | 'schedule';
  date: string;
  shortLink?: boolean;
  tags?: string[];
  posts: Array<{
    integration: { id: string };
    value: Array<{ content: string; image?: Array<{ id: string; path: string }> }>;
    settings: Record<string, unknown>;
  }>;
}

export interface PostizCreatePostResponse {
  id: string;
  releaseId?: string;
  [key: string]: unknown;
}

export interface PostizPostAnalytics {
  [key: string]: unknown;
}

export async function uploadFile(fileBuffer: Buffer, filename: string, mimeType = 'application/octet-stream'): Promise<PostizUpload> {
  const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimeType });
  const formData = new FormData();
  formData.append('file', blob, filename);
  return postizFetch<PostizUpload>('/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function uploadFromUrl(url: string): Promise<PostizUpload> {
  return postizFetch<PostizUpload>('/upload-from-url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

export async function createPost(payload: PostizCreatePostRequest): Promise<PostizCreatePostResponse> {
  return postizFetch<PostizCreatePostResponse>('/posts', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deletePost(postId: string): Promise<void> {
  await postizFetch<void>(`/posts/${postId}`, { method: 'DELETE' });
}

export async function listIntegrations(): Promise<PostizIntegration[]> {
  const data = await postizFetch<{ integrations?: PostizIntegration[] } | PostizIntegration[]>('/integrations');
  if (Array.isArray(data)) return data;
  return data.integrations || [];
}

export async function getPostAnalytics(postId: string): Promise<PostizPostAnalytics> {
  return postizFetch<PostizPostAnalytics>(`/analytics/post/${postId}`);
}
