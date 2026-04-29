import { NextRequest, NextResponse } from 'next/server';
import { updateSocialDataItem } from '@autogtm/core/db/socialsDbCalls';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: companyId, itemId } = await params;
    const body = await request.json() as {
      theme_id?: string | null;
      structured?: Record<string, unknown>;
      status?: 'pending_classification' | 'classified' | 'reserved' | 'used' | 'archived';
      classification_confidence?: number | null;
      classification_reason?: string | null;
    };

    const item = await updateSocialDataItem(companyId, itemId, {
      theme_id: body.theme_id,
      structured: body.structured,
      status: body.status,
      classification_confidence: body.classification_confidence,
      classification_reason: body.classification_reason,
    });
    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error updating social item:', error);
    return NextResponse.json({ error: 'Failed to update social item' }, { status: 500 });
  }
}
