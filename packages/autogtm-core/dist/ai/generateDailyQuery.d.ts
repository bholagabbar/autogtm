/**
 * AI Agent for daily query generation
 * Two modes:
 * 1. FOCUSED: Generate query specifically for a new instruction
 * 2. EXPLORATION: No new instructions, creatively explore new angles
 */
import type { GeneratedQuery } from '../types';
export interface GenerateFocusedQueryParams {
    company: {
        name: string;
        website: string;
        description: string;
        targetAudience: string;
    };
    instruction: string;
}
export interface GenerateExplorationQueryParams {
    company: {
        name: string;
        website: string;
        description: string;
        targetAudience: string;
        agentNotes?: string | null;
    };
    pastQueries: Array<{
        query: string;
        criteria: string[];
        leads_found?: number;
    }>;
}
/**
 * Generate a query SPECIFICALLY for a given instruction
 * Uses web search to research the company and target audience
 */
export declare function generateFocusedQuery(params: GenerateFocusedQueryParams): Promise<GeneratedQuery>;
/**
 * Generate a creative exploration query when no new instructions exist
 * Uses web search to discover new angles and segments
 */
export declare function generateExplorationQuery(params: GenerateExplorationQueryParams): Promise<GeneratedQuery>;
export interface GenerateDailyQueryParams {
    company: {
        name: string;
        website: string;
        description: string;
        targetAudience: string;
        agentNotes?: string | null;
    };
    recentUpdates: Array<{
        content: string;
        created_at: string;
    }>;
    pastQueries: Array<{
        query: string;
        criteria: string[];
        leads_found?: number;
    }>;
}
/** @deprecated Use generateFocusedQuery or generateExplorationQuery instead */
export declare function generateDailyQuery(params: GenerateDailyQueryParams): Promise<GeneratedQuery>;
