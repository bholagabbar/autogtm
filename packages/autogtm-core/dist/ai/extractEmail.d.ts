/**
 * Quick AI-powered email extractor from arbitrary Exa enrichment data
 * Uses a fast model to parse unstructured enrichment objects and pull out an email
 */
export declare function extractEmailFromEnrichmentData(enrichmentData: unknown): Promise<string | null>;
