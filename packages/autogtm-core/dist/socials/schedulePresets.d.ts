export type SocialSchedulePreset = 'creator_daily' | 'creator_mwf' | 'brand_weekday' | 'brand_heavy' | 'weekly_pulse' | 'custom';
export interface SocialScheduleSlot {
    day_of_week: number;
    hour_utc: number;
    theme_id?: string | null;
}
export interface MaterializePresetInput {
    preset: SocialSchedulePreset;
    timezone?: string;
    customSlots?: SocialScheduleSlot[];
}
export interface MaterializedPreset {
    preset: SocialSchedulePreset;
    timezone: string;
    slots: SocialScheduleSlot[];
}
export declare const SOCIAL_SCHEDULE_PRESETS: Record<Exclude<SocialSchedulePreset, 'custom'>, SocialScheduleSlot[]>;
export declare function materializeSchedulePreset(input: MaterializePresetInput): MaterializedPreset;
export declare function getPresetLabel(preset: SocialSchedulePreset): string;
