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
export declare function classifySocialItems(rawItems: string[], themes: ThemeClassificationInput[]): Promise<SocialClassificationResult[]>;
