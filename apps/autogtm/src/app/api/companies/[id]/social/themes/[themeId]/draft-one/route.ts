import { NextRequest, NextResponse } from 'next/server';
import { createSocialPosts, listSocialDataItems, listSocialThemes } from '@autogtm/core/db/socialsDbCalls';
import { inngest } from '@/inngest/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; themeId: string }> }
) {
  try {
    const { id: companyId, themeId } = await params;
    const body = await request.json().catch(() => ({})) as { scheduled_for?: string };

    const themes = await listSocialThemes(companyId);
    const theme = themes.find((entry) => entry.id === themeId);
    if (!theme) {
      return NextResponse.json({ error: 'Theme not found' }, { status: 404 });
    }

    const items = await listSocialDataItems(companyId, {
      status: 'classified',
      themeId,
      limit: 1,
    });
    const item = items[0];
    if (!item) {
      return NextResponse.json({ error: 'No ready ideas available for this theme' }, { status: 400 });
    }

    const scheduledFor = body.scheduled_for || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const posts = await createSocialPosts([
      {
        company_id: companyId,
        theme_id: themeId,
        data_item_id: item.id,
        week_plan_id: null,
        slot_index: null,
        scheduled_for: scheduledFor,
        status: 'pending_review',
      },
    ]);

    const post = posts[0];
    if (!post) {
      return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
    }

    await inngest.send({
      name: 'autogtm/social.draft-post',
      data: { companyId, postId: post.id },
    });

    return NextResponse.json({
      success: true,
      post_id: post.id,
      data_item_id: item.id,
      scheduled_for: scheduledFor,
    });
  } catch (error) {
    console.error('Error generating one draft from theme:', error);
    return NextResponse.json({ error: 'Failed to generate draft from theme' }, { status: 500 });
  }
}
