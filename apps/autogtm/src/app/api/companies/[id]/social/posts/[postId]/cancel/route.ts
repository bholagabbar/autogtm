import { NextRequest, NextResponse } from 'next/server';
import { updateSocialPost } from '@autogtm/core/db/socialsDbCalls';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id: companyId, postId } = await params;
    const post = await updateSocialPost(companyId, postId, { status: 'cancelled' });
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error cancelling social post:', error);
    return NextResponse.json({ error: 'Failed to cancel social post' }, { status: 500 });
  }
}
