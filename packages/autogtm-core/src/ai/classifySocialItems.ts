import OpenAI from 'openai';
import { z } from 'zod';

const ClassificationSchema = z.object({
  raw_text: z.string(),
  suggested_theme_id: z.string().uuid().nullable().optional(),
  structured: z.record(z.unknown()).default({}),
  confidence: z.number().min(0).max(1).default(0),
  reason: z.string().default(''),
});

const ClassificationResponseSchema = z.object({
  items: z.array(ClassificationSchema),
});

export interface ThemeClassificationInput {
  id: string;
  name: string;
  purpose: string;
}

export interface SocialClassificationResult {
  raw_text: string;
  suggested_theme_id: string | null;
  structured: Record<string, unknown>;
  confidence: number;
  reason: string;
}

function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is required');
  return new OpenAI({ apiKey });
}

export async function classifySocialItems(rawItems: string[], themes: ThemeClassificationInput[]): Promise<SocialClassificationResult[]> {
  if (rawItems.length === 0) return [];

  const openai = getOpenAIClient();
  const themesForPrompt = themes.map((theme) => ({
    id: theme.id,
    name: theme.name,
    purpose: theme.purpose,
  }));

  const systemPrompt = `You classify unstructured social content items into predefined themes.
Return strict JSON only. Keep confidence conservative.
Use suggested_theme_id as null when no clear match.`;

  const userPrompt = `Themes:
${JSON.stringify(themesForPrompt, null, 2)}

Raw items:
${JSON.stringify(rawItems, null, 2)}

Return JSON shape:
{
  "items": [
    {
      "raw_text": "original item",
      "suggested_theme_id": "uuid or null",
      "structured": { "headline": "...", "entities": [], "signals": [] },
      "confidence": 0.0-1.0,
      "reason": "short reason"
    }
  ]
}

Rules:
- Preserve raw_text exactly.
- Each item must appear once.
- Never invent theme ids.
- If uncertain, use null and confidence < 0.5.`;

  const response = await openai.responses.create({
    model: 'gpt-4.1-mini',
    input: `${systemPrompt}\n\n${userPrompt}`,
  });

  const text = response.output_text || '';
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const jsonText = fenced ? fenced[1].trim() : text.trim();
  const parsed = ClassificationResponseSchema.parse(JSON.parse(jsonText));

  return parsed.items.map((item) => ({
    raw_text: item.raw_text,
    suggested_theme_id: item.suggested_theme_id || null,
    structured: item.structured,
    confidence: item.confidence,
    reason: item.reason,
  }));
}
