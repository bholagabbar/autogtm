import { NextRequest, NextResponse } from 'next/server';
import { updateSocialPost } from '@autogtm/core/db/socialsDbCalls';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; postId: string }> }
) {
  try {
    const { id: companyId, postId } = await params;
    const body = await request.json() as {
      caption?: string;
      hashtags?: string[];
      image_prompt?: string;
      scheduled_for?: string;
    };
    const post = await updateSocialPost(companyId, postId, {
      caption: body.caption,
      hashtags: body.hashtags,
      image_prompt: body.image_prompt,
      scheduled_for: body.scheduled_for,
    });
    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error updating social post:', error);
    return NextResponse.json({ error: 'Failed to update social post' }, { status: 500 });
  }
}
