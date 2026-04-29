import { NextRequest, NextResponse } from 'next/server';
import {
  createSocialPosts,
  deletePlannedPostsForWeekPlan,
  getSocialSchedule,
  getSocialWeekPlan,
  listSocialThemes,
  listSocialWeekPlans,
  updateSocialDataItem,
  upsertSocialWeekPlan,
  type SocialDataItem,
} from '@autogtm/core/db/socialsDbCalls';
import { allocateWeek } from '@autogtm/core/socials/weeklyPlanner';

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const weekStartDate = request.nextUrl.searchParams.get('week_start_date');
    if (weekStartDate) {
      const plan = await getSocialWeekPlan(companyId, weekStartDate);
      return NextResponse.json({ plan });
    }
    const plans = await listSocialWeekPlans(companyId, 12);
    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching social week plans:', error);
    return NextResponse.json({ error: 'Failed to fetch social week plans' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const body = await request.json().catch(() => ({})) as { week_start_date?: string };

    const weekStartDate = body.week_start_date || toDateOnly(new Date());
    const schedule = await getSocialSchedule(companyId);
    if (!schedule || !schedule.is_active || !Array.isArray(schedule.slots) || schedule.slots.length === 0) {
      return NextResponse.json({ error: 'Schedule is not configured' }, { status: 400 });
    }

    const themes = (await listSocialThemes(companyId)).filter((theme) => theme.is_active);
    if (themes.length === 0) {
      return NextResponse.json({ error: 'No active themes found' }, { status: 400 });
    }

    const supabase = (await import('@supabase/supabase-js')).createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: classifiedItems, error: itemsError } = await supabase
      .from('social_data_items')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'classified')
      .order('created_at', { ascending: true });
    if (itemsError) throw itemsError;
    const items = (classifiedItems || []) as SocialDataItem[];

    const weekStart = new Date(`${weekStartDate}T00:00:00.000Z`);
    const slots = (schedule.slots || []).flatMap((slot, idx) => {
      const out: Array<{ slot_index: number; day_of_week: number; hour_utc: number; theme_id?: string | null; scheduled_for: string }> = [];
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const dayDate = new Date(weekStart);
        dayDate.setUTCDate(weekStart.getUTCDate() + dayOffset);
        if (dayDate.getUTCDay() !== slot.day_of_week) continue;
        dayDate.setUTCHours(slot.hour_utc, 0, 0, 0);
        out.push({
          slot_index: idx + dayOffset * 100,
          day_of_week: slot.day_of_week,
          hour_utc: slot.hour_utc,
          theme_id: slot.theme_id || null,
          scheduled_for: dayDate.toISOString(),
        });
      }
      return out;
    }).sort((a, b) => a.scheduled_for.localeCompare(b.scheduled_for));

    const inventoryByThemeId: Record<string, number> = {};
    const itemsByThemeId: Record<string, SocialDataItem[]> = {};
    for (const theme of themes) {
      const matching = items.filter((item) => item.theme_id === theme.id);
      inventoryByThemeId[theme.id] = matching.length;
      itemsByThemeId[theme.id] = matching;
    }

    const allocation = allocateWeek({
      slots,
      themes: themes.map((theme) => ({
        id: theme.id,
        name: theme.name,
        priority: theme.priority,
        is_active: theme.is_active,
      })),
      inventoryByThemeId,
    });

    const plan = await upsertSocialWeekPlan(companyId, weekStartDate, {
      status: 'draft',
      planner_summary: allocation.summary as unknown as Record<string, unknown>,
    });

    await deletePlannedPostsForWeekPlan(companyId, plan.id);

    const postsToCreate: Array<{
      company_id: string;
      theme_id: string | null;
      data_item_id: string | null;
      week_plan_id: string;
      slot_index: number;
      scheduled_for: string;
      status: 'planned';
    }> = [];

    for (const assignment of allocation.slotAssignments) {
      if ('skipped' in assignment && assignment.skipped) continue;
      const pool = itemsByThemeId[assignment.theme_id] || [];
      const item = pool.shift();
      if (!item) continue;
      postsToCreate.push({
        company_id: companyId,
        theme_id: assignment.theme_id,
        data_item_id: item.id,
        week_plan_id: plan.id,
        slot_index: assignment.slot_index,
        scheduled_for: assignment.scheduled_for,
        status: 'planned',
      });
      await updateSocialDataItem(companyId, item.id, { status: 'reserved' });
    }

    const createdPosts = await createSocialPosts(postsToCreate);
    return NextResponse.json({ plan, postsCreated: createdPosts.length });
  } catch (error) {
    console.error('Error replanning social week:', error);
    return NextResponse.json({ error: 'Failed to replan social week' }, { status: 500 });
  }
}
