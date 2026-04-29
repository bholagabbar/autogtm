import { NextRequest, NextResponse } from 'next/server';
import { getSocialSchedule, upsertSocialSchedule } from '@autogtm/core/db/socialsDbCalls';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; slotIndex: string }> }
) {
  try {
    const { id: companyId, slotIndex } = await params;
    const index = Number(slotIndex);
    if (Number.isNaN(index)) {
      return NextResponse.json({ error: 'Invalid slot index' }, { status: 400 });
    }

    const body = await request.json() as { theme_id?: string | null };
    const schedule = await getSocialSchedule(companyId);
    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    if (!schedule.slots[index]) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }

    const slots = [...schedule.slots];
    slots[index] = {
      ...slots[index],
      theme_id: body.theme_id || null,
    };

    const updated = await upsertSocialSchedule(companyId, {
      preset: schedule.preset,
      timezone: schedule.timezone,
      slots,
      is_active: schedule.is_active,
    });

    return NextResponse.json({ schedule: updated });
  } catch (error) {
    console.error('Error patching social schedule slot:', error);
    return NextResponse.json({ error: 'Failed to patch social schedule slot' }, { status: 500 });
  }
}
