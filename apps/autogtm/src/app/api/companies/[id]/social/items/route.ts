import { NextRequest, NextResponse } from 'next/server';
import { listSocialDataItems } from '@autogtm/core/db/socialsDbCalls';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const status = request.nextUrl.searchParams.get('status') as
      | 'pending_classification'
      | 'classified'
      | 'reserved'
      | 'used'
      | 'archived'
      | null;
    const themeId = request.nextUrl.searchParams.get('theme_id');

    const items = await listSocialDataItems(companyId, {
      status: status || undefined,
      themeId: themeId || undefined,
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error listing social items:', error);
    return NextResponse.json({ error: 'Failed to fetch social items' }, { status: 500 });
  }
}
