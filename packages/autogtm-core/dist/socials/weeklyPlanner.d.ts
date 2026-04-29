import type { SocialScheduleSlot } from './schedulePresets';
export interface PlannerTheme {
    id: string;
    name: string;
    priority: number;
    is_active?: boolean;
}
export interface PlannerSlot extends SocialScheduleSlot {
    slot_index: number;
    scheduled_for: string;
}
export interface PlannerAssignment {
    slot_index: number;
    scheduled_for: string;
    theme_id: string;
    skipped?: false;
}
export interface PlannerSkippedSlot {
    slot_index: number;
    scheduled_for: string;
    skipped: true;
    reason: 'no_inventory' | 'pinned_theme_empty';
}
export interface PlannerSummary {
    slots_total: number;
    slots_filled: number;
    slots_skipped: number;
    themes_used: Record<string, number>;
    skip_reasons: Record<string, number>;
}
export interface AllocateWeekInput {
    slots: PlannerSlot[];
    themes: PlannerTheme[];
    inventoryByThemeId: Record<string, number>;
}
export interface AllocateWeekResult {
    slotAssignments: Array<PlannerAssignment | PlannerSkippedSlot>;
    summary: PlannerSummary;
}
export declare function allocateWeek(input: AllocateWeekInput): AllocateWeekResult;
