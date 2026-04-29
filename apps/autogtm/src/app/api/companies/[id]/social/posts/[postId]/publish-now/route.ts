import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id: companyId, postId } = await params;
    await inngest.send({
      name: 'autogtm/social.publish',
      data: { companyId, postId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error triggering social publish:', error);
    return NextResponse.json({ error: 'Failed to trigger social publish' }, { status: 500 });
  }
}
