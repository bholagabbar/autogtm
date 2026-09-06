/**
 * AI-powered lead enrichment using an OpenAI-compatible provider
 * Takes raw lead data and company context, returns structured persona
 * (web search available via OpenRouter `:online` model suffix)
 */
import type { EnrichedLeadData } from '../types';
export declare function enrichLead(leadData: Record<string, unknown>, companyContext: {
    name: string;
    description: string;
    targetAudience: string;
}): Promise<EnrichedLeadData>;
