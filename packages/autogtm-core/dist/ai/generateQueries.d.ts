/**
 * AI-powered Exa query generation
 * Generates search queries and criteria based on company profile
 */
import type { GeneratedQuery } from '../types';
export interface GenerateQueriesParams {
    companyName: string;
    companyWebsite: string;
    companyDescription: string;
    targetAudience: string;
    numberOfQueries?: number;
}
/**
 * Generate Exa search queries based on company profile
 */
export declare function generateExaQueries(params: GenerateQueriesParams): Promise<GeneratedQuery[]>;
/**
 * Refine a query based on feedback or results
 */
export declare function refineQuery(params: {
    originalQuery: string;
    originalCriteria: string[];
    feedback: string;
    resultsQuality?: 'good' | 'too_broad' | 'too_narrow' | 'off_target';
}): Promise<GeneratedQuery>;
