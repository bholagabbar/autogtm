export interface SocialThemeForDraft {
    id: string;
    name: string;
    purpose: string;
    caption_prompt: string;
    image_prompt_template: string;
    brand_voice: string;
}
export interface SocialDataItemForDraft {
    id: string;
    raw_text: string;
    structured: Record<string, unknown>;
}
export declare function draftSocialPost(theme: SocialThemeForDraft, dataItem: SocialDataItemForDraft): Promise<{
    caption: string;
    hashtags: string[];
    image_prompt: string;
}>;
