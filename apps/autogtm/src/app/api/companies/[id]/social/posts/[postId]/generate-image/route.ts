import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id: companyId, postId } = await params;
    const body = await request.json().catch(() => ({})) as { mode?: 'image' | 'video' };
    const mode = body.mode === 'image' || body.mode === 'video' ? body.mode : undefined;
    await inngest.send({
      name: 'autogtm/social.image-gen',
      data: { companyId, postId, mode },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error triggering social image generation:', error);
    return NextResponse.json({ error: 'Failed to trigger image generation' }, { status: 500 });
  }
}
