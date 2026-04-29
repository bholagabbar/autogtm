import { NextRequest, NextResponse } from 'next/server';
import { updateSocialDataItem } from '@autogtm/core/db/socialsDbCalls';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: companyId, itemId } = await params;
    const item = await updateSocialDataItem(companyId, itemId, { status: 'archived' });
    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error archiving social item:', error);
    return NextResponse.json({ error: 'Failed to archive social item' }, { status: 500 });
  }
}
