import { NextRequest, NextResponse } from 'next/server';
import { updateSocialPost } from '@autogtm/core/db/socialsDbCalls';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; planId: string; postId: string }> }
) {
  try {
    const { id: companyId, postId } = await params;
    const body = await request.json() as {
      theme_id?: string | null;
      data_item_id?: string | null;
      scheduled_for?: string;
    };

    const post = await updateSocialPost(companyId, postId, {
      theme_id: body.theme_id,
      data_item_id: body.data_item_id,
      scheduled_for: body.scheduled_for,
    });
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error updating social week-plan post:', error);
    return NextResponse.json({ error: 'Failed to update social week-plan post' }, { status: 500 });
  }
}
