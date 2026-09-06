import OpenAI from 'openai';

/**
 * Shared OpenAI-compatible client for all AI calls.
 *
 * Works with any provider that speaks the OpenAI API:
 * - OpenAI (default): no extra config
 * - DeepSeek:  OPENAI_BASE_URL=https://api.deepseek.com  OPENAI_MODEL=deepseek-chat
 * - OpenRouter: OPENAI_BASE_URL=https://openrouter.ai/api/v1  OPENAI_MODEL=deepseek/deepseek-chat
 *   (or any model id; use the `:online` suffix e.g. openai/gpt-4.1-mini:online
 *   to restore the web search that the legacy Responses API provided)
 *
 * OPENAI_MODEL overrides every model name in the codebase.
 */
export function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is required');
  }
  return new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });
}

export function resolveModel(defaultModel: string): string {
  return process.env.OPENAI_MODEL || defaultModel;
}
