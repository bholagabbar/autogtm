import type { SocialSchedulePreset, SocialScheduleSlot } from '../socials/schedulePresets';
export interface SocialTheme {
    id: string;
    company_id: string;
    name: string;
    purpose: string;
    caption_prompt: string;
    image_prompt_template: string;
    brand_voice: string;
    priority: number;
    is_active: boolean;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
}
export interface SocialSchedule {
    id: string;
    company_id: string;
    preset: SocialSchedulePreset;
    slots: SocialScheduleSlot[];
    timezone: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}
export interface SocialDataDump {
    id: string;
    company_id: string;
    raw_content: string;
    source: 'csv' | 'paste' | 'url';
    parse_status: 'pending' | 'processing' | 'completed' | 'failed';
    items_extracted: number;
    error: string | null;
    created_at: string;
}
export interface SocialDataItem {
    id: string;
    company_id: string;
    dump_id: string;
    raw_text: string;
    structured: Record<string, unknown>;
    suggested_theme_id: string | null;
    theme_id: string | null;
    classification_confidence: number | null;
    classification_reason: string | null;
    used_for_post_id: string | null;
    status: 'pending_classification' | 'classified' | 'reserved' | 'used' | 'archived';
    created_at: string;
}
export interface SocialWeekPlan {
    id: string;
    company_id: string;
    week_start_date: string;
    status: 'draft' | 'approved' | 'completed';
    generated_at: string;
    approved_at: string | null;
    planner_summary: Record<string, unknown>;
}
export interface SocialPost {
    id: string;
    company_id: string;
    theme_id: string | null;
    data_item_id: string | null;
    week_plan_id: string | null;
    slot_index: number | null;
    caption: string | null;
    hashtags: string[];
    image_prompt: string | null;
    image_url: string | null;
    image_status: 'not_generated' | 'generating' | 'generated' | 'failed';
    scheduled_for: string;
    status: 'planned' | 'pending_review' | 'approved' | 'image_ready' | 'published' | 'failed' | 'cancelled';
    postiz_post_id: string | null;
    postiz_release_id: string | null;
    error: string | null;
    published_at: string | null;
    created_at: string;
    updated_at: string;
}
export declare function listSocialThemes(companyId: string): Promise<SocialTheme[]>;
export declare function createSocialTheme(companyId: string, payload: Omit<SocialTheme, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'is_archived'>): Promise<SocialTheme>;
export declare function updateSocialTheme(companyId: string, themeId: string, updates: Partial<Omit<SocialTheme, 'id' | 'company_id' | 'created_at'>>): Promise<SocialTheme>;
export declare function archiveSocialTheme(companyId: string, themeId: string): Promise<void>;
export declare function getSocialSchedule(companyId: string): Promise<SocialSchedule | null>;
export declare function upsertSocialSchedule(companyId: string, payload: {
    preset: SocialSchedulePreset;
    slots: SocialScheduleSlot[];
    timezone: string;
    is_active?: boolean;
}): Promise<SocialSchedule>;
export declare function createSocialDataDump(companyId: string, payload: {
    raw_content: string;
    source: 'csv' | 'paste' | 'url';
}): Promise<SocialDataDump>;
export declare function updateSocialDataDump(dumpId: string, updates: Partial<Pick<SocialDataDump, 'parse_status' | 'items_extracted' | 'error'>>): Promise<void>;
export declare function createSocialDataItems(companyId: string, dumpId: string, items: Array<{
    raw_text: string;
    structured?: Record<string, unknown>;
    suggested_theme_id?: string | null;
    theme_id?: string | null;
    classification_confidence?: number | null;
    classification_reason?: string | null;
    status?: SocialDataItem['status'];
}>): Promise<SocialDataItem[]>;
export declare function listSocialDataItems(companyId: string, options?: {
    status?: SocialDataItem['status'];
    themeId?: string | null;
    limit?: number;
}): Promise<SocialDataItem[]>;
export declare function updateSocialDataItem(companyId: string, itemId: string, updates: Partial<Pick<SocialDataItem, 'theme_id' | 'structured' | 'status' | 'classification_confidence' | 'classification_reason' | 'used_for_post_id'>>): Promise<SocialDataItem>;
export declare function upsertSocialWeekPlan(companyId: string, weekStartDate: string, payload: {
    status: SocialWeekPlan['status'];
    planner_summary?: Record<string, unknown>;
    approved_at?: string | null;
}): Promise<SocialWeekPlan>;
export declare function getSocialWeekPlan(companyId: string, weekStartDate: string): Promise<SocialWeekPlan | null>;
export declare function listSocialWeekPlans(companyId: string, limit?: number): Promise<SocialWeekPlan[]>;
export declare function createSocialPosts(posts: Array<{
    company_id: string;
    theme_id: string | null;
    data_item_id: string | null;
    week_plan_id: string | null;
    slot_index: number | null;
    scheduled_for: string;
    status?: SocialPost['status'];
}>): Promise<SocialPost[]>;
export declare function listSocialPosts(companyId: string, options?: {
    status?: SocialPost['status'];
    weekPlanId?: string;
    limit?: number;
}): Promise<SocialPost[]>;
export declare function getSocialPostById(companyId: string, postId: string): Promise<SocialPost | null>;
export declare function updateSocialPost(companyId: string, postId: string, updates: Partial<SocialPost>): Promise<SocialPost>;
export declare function deletePlannedPostsForWeekPlan(companyId: string, weekPlanId: string): Promise<void>;
export declare function createSocialPublishRun(payload: {
    company_id: string;
    social_post_id?: string | null;
    trigger?: 'cron' | 'manual';
}): Promise<{
    id: string;
}>;
export declare function completeSocialPublishRun(runId: string, updates: {
    status: 'completed' | 'failed';
    postiz_post_id?: string | null;
    postiz_release_id?: string | null;
    error?: string | null;
}): Promise<void>;
