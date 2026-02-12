/**
 * Exa Websets API Client
 * Docs: https://docs.exa.ai/websets/api/overview
 */
import Exa from 'exa-js';
import type { ExaWebsetItem } from '../types';
export declare function getExaClient(): Exa;
export interface CreateWebsetParams {
    query: string;
    count?: number;
    criteria?: string[];
    enrichments?: Array<{
        description: string;
        format?: 'text' | 'email' | 'phone' | 'number' | 'date' | 'options';
    }>;
}
export interface WebsetSearchResult {
    websetId: string;
    items: ExaWebsetItem[];
    totalItems: number;
}
/**
 * Create a new Exa Webset with search and optional enrichments
 */
export declare function createWebset(params: CreateWebsetParams): Promise<string>;
/**
 * Wait for a webset to complete processing
 */
export declare function waitForWebset(websetId: string, timeoutMs?: number): Promise<void>;
/**
 * Get all items from a webset
 */
export declare function getWebsetItems(websetId: string): Promise<ExaWebsetItem[]>;
/**
 * Create a webset search for influencer/creator discovery with email enrichment
 */
export declare function searchInfluencers(params: {
    query: string;
    count?: number;
    criteria?: string[];
    includeEmail?: boolean;
}): Promise<WebsetSearchResult>;
/**
 * Refresh an existing webset with more results
 */
export declare function refreshWebset(websetId: string, query: string, additionalCount: number, criteria?: string[]): Promise<void>;
/**
 * Delete a webset
 */
export declare function deleteWebset(websetId: string): Promise<void>;
