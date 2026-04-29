import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; planId: string }> }
) {
  try {
    const { id: companyId, planId } = await params;
    await inngest.send({
      name: 'autogtm/social.plan-approved',
      data: {
        companyId,
        weekPlanId: planId,
        trigger: 'manual',
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving social week plan:', error);
    return NextResponse.json({ error: 'Failed to approve social week plan' }, { status: 500 });
  }
}
