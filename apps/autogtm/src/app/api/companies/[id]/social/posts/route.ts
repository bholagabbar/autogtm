import { NextRequest, NextResponse } from 'next/server';
import { listSocialPosts } from '@autogtm/core/db/socialsDbCalls';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const status = request.nextUrl.searchParams.get('status') as
      | 'planned'
      | 'pending_review'
      | 'approved'
      | 'image_ready'
      | 'published'
      | 'failed'
      | 'cancelled'
      | null;
    const weekPlanId = request.nextUrl.searchParams.get('week_plan_id');

    const posts = await listSocialPosts(companyId, {
      status: status || undefined,
      weekPlanId: weekPlanId || undefined,
    });
    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching social posts:', error);
    return NextResponse.json({ error: 'Failed to fetch social posts' }, { status: 500 });
  }
}
