/**
 * AI-powered lead enrichment using OpenAI with web search
 * Takes raw lead data and company context, returns structured persona
 */
import type { EnrichedLeadData } from '../types';
export declare function enrichLead(leadData: Record<string, unknown>, companyContext: {
    name: string;
    description: string;
    targetAudience: string;
}): Promise<EnrichedLeadData>;
