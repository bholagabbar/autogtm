/**
 * Exa Websets API Client
 * Docs: https://docs.exa.ai/websets/api/overview
 */

import Exa from 'exa-js';
import type { ExaWebsetItem, ExaWebsetResponse } from '../types';

let _exaClient: Exa | null = null;

export function getExaClient(): Exa {
  if (!_exaClient) {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
      throw new Error('EXA_API_KEY is required');
    }
    _exaClient = new Exa(apiKey);
  }
  return _exaClient;
}

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
export async function createWebset(params: CreateWebsetParams): Promise<string> {
  const exa = getExaClient();

  const searchParams: any = {
    query: params.query,
    count: params.count || 25,
  };

  if (params.criteria && params.criteria.length > 0) {
    searchParams.criteria = params.criteria.map((c) => ({ description: c }));
  }

  const websetParams: any = {
    search: searchParams,
  };

  if (params.enrichments && params.enrichments.length > 0) {
    websetParams.enrichments = params.enrichments;
  }

  const webset = await exa.websets.create(websetParams);
  return webset.id;
}

/**
 * Wait for a webset to complete processing
 */
export async function waitForWebset(websetId: string, timeoutMs = 300000): Promise<void> {
  const exa = getExaClient();
  await exa.websets.waitUntilIdle(websetId);
}

/**
 * Get all items from a webset
 */
export async function getWebsetItems(websetId: string): Promise<ExaWebsetItem[]> {
  const exa = getExaClient();
  const items = exa.websets.items.listAll(websetId);
  const result: ExaWebsetItem[] = [];
  for await (const item of items) {
    result.push(extractItemData(item));
  }
  return result;
}

/**
 * Extract and normalize data from a webset item
 */
function extractItemData(item: any): ExaWebsetItem {
  const data = item.model_dump ? item.model_dump() : item;

  // Ensure URLs are strings
  if (data.properties?.url) {
    data.properties.url = String(data.properties.url);
  }

  return {
    id: data.id,
    properties: data.properties || {},
    enrichments: data.enrichments || {},
  };
}

/**
 * Create a webset search for influencer/creator discovery with email enrichment
 */
export async function searchInfluencers(params: {
  query: string;
  count?: number;
  criteria?: string[];
  includeEmail?: boolean;
}): Promise<WebsetSearchResult> {
  const enrichments: CreateWebsetParams['enrichments'] = [];

  if (params.includeEmail !== false) {
    enrichments.push({
      description: 'Find the email address for this person or creator',
      format: 'email',
    });
  }

  // Also extract follower count if available
  enrichments.push({
    description: 'Extract the follower or subscriber count if visible',
    format: 'number',
  });

  const websetId = await createWebset({
    query: params.query,
    count: params.count || 25,
    criteria: params.criteria,
    enrichments,
  });

  // Wait for completion
  await waitForWebset(websetId);

  // Get results
  const items = await getWebsetItems(websetId);

  return {
    websetId,
    items,
    totalItems: items.length,
  };
}

/**
 * Refresh an existing webset with more results
 */
export async function refreshWebset(
  websetId: string,
  query: string,
  additionalCount: number,
  criteria?: string[]
): Promise<void> {
  const exa = getExaClient();

  // Get current item count
  const existingItems = await getWebsetItems(websetId);
  const newCount = existingItems.length + additionalCount;

  const searchParams: any = {
    query,
    count: newCount,
    behaviour: 'override',
  };

  if (criteria && criteria.length > 0) {
    searchParams.criteria = criteria.map((c) => ({ description: c }));
  }

  await exa.websets.searches.create(websetId, searchParams);
  await waitForWebset(websetId);
}

/**
 * Delete a webset
 */
export async function deleteWebset(websetId: string): Promise<void> {
  const exa = getExaClient();
  await exa.websets.delete(websetId);
}
