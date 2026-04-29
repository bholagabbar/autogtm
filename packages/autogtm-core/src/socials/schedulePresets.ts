export type SocialSchedulePreset =
  | 'creator_daily'
  | 'creator_mwf'
  | 'brand_weekday'
  | 'brand_heavy'
  | 'weekly_pulse'
  | 'custom';

export interface SocialScheduleSlot {
  day_of_week: number; // 0=Sun, 6=Sat
  hour_utc: number; // 0-23
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

export const SOCIAL_SCHEDULE_PRESETS: Record<Exclude<SocialSchedulePreset, 'custom'>, SocialScheduleSlot[]> = {
  creator_daily: [
    { day_of_week: 0, hour_utc: 14 },
    { day_of_week: 1, hour_utc: 14 },
    { day_of_week: 2, hour_utc: 14 },
    { day_of_week: 3, hour_utc: 14 },
    { day_of_week: 4, hour_utc: 14 },
    { day_of_week: 5, hour_utc: 14 },
    { day_of_week: 6, hour_utc: 14 },
  ],
  creator_mwf: [
    { day_of_week: 1, hour_utc: 14 },
    { day_of_week: 3, hour_utc: 14 },
    { day_of_week: 5, hour_utc: 14 },
  ],
  brand_weekday: [
    { day_of_week: 1, hour_utc: 14 },
    { day_of_week: 2, hour_utc: 14 },
    { day_of_week: 3, hour_utc: 14 },
    { day_of_week: 4, hour_utc: 14 },
    { day_of_week: 5, hour_utc: 14 },
  ],
  brand_heavy: [
    { day_of_week: 1, hour_utc: 14 },
    { day_of_week: 1, hour_utc: 22 },
    { day_of_week: 2, hour_utc: 14 },
    { day_of_week: 2, hour_utc: 22 },
    { day_of_week: 3, hour_utc: 14 },
    { day_of_week: 3, hour_utc: 22 },
    { day_of_week: 4, hour_utc: 14 },
    { day_of_week: 4, hour_utc: 22 },
    { day_of_week: 5, hour_utc: 14 },
    { day_of_week: 5, hour_utc: 22 },
  ],
  weekly_pulse: [{ day_of_week: 0, hour_utc: 16 }],
};

export function materializeSchedulePreset(input: MaterializePresetInput): MaterializedPreset {
  const timezone = input.timezone || 'America/New_York';

  if (input.preset === 'custom') {
    const customSlots = (input.customSlots || []).map((slot) => ({
      day_of_week: Math.max(0, Math.min(6, slot.day_of_week)),
      hour_utc: Math.max(0, Math.min(23, slot.hour_utc)),
      theme_id: slot.theme_id || null,
    }));
    return {
      preset: 'custom',
      timezone,
      slots: customSlots,
    };
  }

  return {
    preset: input.preset,
    timezone,
    slots: SOCIAL_SCHEDULE_PRESETS[input.preset].map((slot) => ({
      day_of_week: slot.day_of_week,
      hour_utc: slot.hour_utc,
      theme_id: null,
    })),
  };
}

export function getPresetLabel(preset: SocialSchedulePreset): string {
  switch (preset) {
    case 'creator_daily':
      return 'Creator Daily';
    case 'creator_mwf':
      return 'Creator MWF';
    case 'brand_weekday':
      return 'Brand Weekday';
    case 'brand_heavy':
      return 'Brand Heavy';
    case 'weekly_pulse':
      return 'Weekly Pulse';
    case 'custom':
      return 'Custom';
    default:
      return preset;
  }
}
