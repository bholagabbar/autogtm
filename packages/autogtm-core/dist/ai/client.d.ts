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
export declare function getOpenAIClient(): OpenAI;
export declare function resolveModel(defaultModel: string): string;
