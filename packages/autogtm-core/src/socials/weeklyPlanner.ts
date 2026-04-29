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

function weightedPick(
  candidates: Array<{ theme: PlannerTheme; weight: number }>
): PlannerTheme | null {
  if (candidates.length === 0) return null;
  const totalWeight = candidates.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return candidates[0].theme;

  let needle = Math.random() * totalWeight;
  for (const candidate of candidates) {
    needle -= candidate.weight;
    if (needle <= 0) {
      return candidate.theme;
    }
  }
  return candidates[candidates.length - 1].theme;
}

export function allocateWeek(input: AllocateWeekInput): AllocateWeekResult {
  const activeThemes = input.themes.filter((theme) => theme.is_active !== false);
  const remainingInventory: Record<string, number> = { ...input.inventoryByThemeId };
  const sortedSlots = [...input.slots].sort((a, b) => a.scheduled_for.localeCompare(b.scheduled_for));
  const slotAssignments: Array<PlannerAssignment | PlannerSkippedSlot> = [];
  const summary: PlannerSummary = {
    slots_total: sortedSlots.length,
    slots_filled: 0,
    slots_skipped: 0,
    themes_used: {},
    skip_reasons: {},
  };

  let previousThemeId: string | null = null;

  for (const slot of sortedSlots) {
    const pinnedThemeId = slot.theme_id || null;

    if (pinnedThemeId) {
      if ((remainingInventory[pinnedThemeId] || 0) > 0) {
        remainingInventory[pinnedThemeId] -= 1;
        slotAssignments.push({
          slot_index: slot.slot_index,
          scheduled_for: slot.scheduled_for,
          theme_id: pinnedThemeId,
        });
        summary.slots_filled += 1;
        summary.themes_used[pinnedThemeId] = (summary.themes_used[pinnedThemeId] || 0) + 1;
        previousThemeId = pinnedThemeId;
      } else {
        slotAssignments.push({
          slot_index: slot.slot_index,
          scheduled_for: slot.scheduled_for,
          skipped: true,
          reason: 'pinned_theme_empty',
        });
        summary.slots_skipped += 1;
        summary.skip_reasons.pinned_theme_empty = (summary.skip_reasons.pinned_theme_empty || 0) + 1;
      }
      continue;
    }

    const withInventory = activeThemes.filter((theme) => (remainingInventory[theme.id] || 0) > 0);
    if (withInventory.length === 0) {
      slotAssignments.push({
        slot_index: slot.slot_index,
        scheduled_for: slot.scheduled_for,
        skipped: true,
        reason: 'no_inventory',
      });
      summary.slots_skipped += 1;
      summary.skip_reasons.no_inventory = (summary.skip_reasons.no_inventory || 0) + 1;
      continue;
    }

    const preferred = withInventory
      .filter((theme) => theme.id !== previousThemeId)
      .map((theme) => ({ theme, weight: Math.max(1, theme.priority || 1) }));
    const fallback = withInventory.map((theme) => ({ theme, weight: Math.max(1, theme.priority || 1) }));
    const chosen = weightedPick(preferred.length > 0 ? preferred : fallback);

    if (!chosen) {
      slotAssignments.push({
        slot_index: slot.slot_index,
        scheduled_for: slot.scheduled_for,
        skipped: true,
        reason: 'no_inventory',
      });
      summary.slots_skipped += 1;
      summary.skip_reasons.no_inventory = (summary.skip_reasons.no_inventory || 0) + 1;
      continue;
    }

    remainingInventory[chosen.id] -= 1;
    slotAssignments.push({
      slot_index: slot.slot_index,
      scheduled_for: slot.scheduled_for,
      theme_id: chosen.id,
    });
    summary.slots_filled += 1;
    summary.themes_used[chosen.id] = (summary.themes_used[chosen.id] || 0) + 1;
    previousThemeId = chosen.id;
  }

  return { slotAssignments, summary };
}
