import { NextRequest, NextResponse } from 'next/server';
import { updateSocialPost } from '@autogtm/core/db/socialsDbCalls';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id: companyId, postId } = await params;
    const post = await updateSocialPost(companyId, postId, { status: 'approved' });
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error approving social post:', error);
    return NextResponse.json({ error: 'Failed to approve social post' }, { status: 500 });
  }
}
