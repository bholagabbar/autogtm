import { NextRequest, NextResponse } from 'next/server';
import { getSocialSchedule, upsertSocialSchedule } from '@autogtm/core/db/socialsDbCalls';
import { materializeSchedulePreset, type SocialSchedulePreset, type SocialScheduleSlot } from '@autogtm/core/socials/schedulePresets';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const schedule = await getSocialSchedule(companyId);
    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error fetching social schedule:', error);
    return NextResponse.json({ error: 'Failed to fetch social schedule' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const body = await request.json() as {
      preset?: SocialSchedulePreset;
      timezone?: string;
      slots?: SocialScheduleSlot[];
    };

    const preset = body.preset || 'creator_mwf';
    const materialized = materializeSchedulePreset({
      preset,
      timezone: body.timezone || 'America/New_York',
      customSlots: body.slots || [],
    });

    const schedule = await upsertSocialSchedule(companyId, {
      preset: materialized.preset,
      timezone: materialized.timezone,
      slots: materialized.slots,
    });

    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Error upserting social schedule:', error);
    return NextResponse.json({ error: 'Failed to update social schedule' }, { status: 500 });
  }
}
