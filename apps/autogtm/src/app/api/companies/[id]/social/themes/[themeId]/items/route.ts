import { NextRequest, NextResponse } from 'next/server';
import { createSocialDataDump, createSocialDataItems, updateSocialDataDump } from '@autogtm/core/db/socialsDbCalls';

function splitRawInput(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; themeId: string }> }
) {
  try {
    const { id: companyId, themeId } = await params;
    const body = await request.json() as { raw_content?: string; source?: 'csv' | 'paste' | 'url' };

    if (!body.raw_content || !body.raw_content.trim()) {
      return NextResponse.json({ error: 'raw_content is required' }, { status: 400 });
    }

    const items = splitRawInput(body.raw_content);
    if (items.length === 0) {
      return NextResponse.json({ error: 'No valid lines found' }, { status: 400 });
    }

    const dump = await createSocialDataDump(companyId, {
      raw_content: body.raw_content,
      source: body.source || 'paste',
    });

    await createSocialDataItems(
      companyId,
      dump.id,
      items.map((rawText) => ({
        raw_text: rawText,
        suggested_theme_id: themeId,
        theme_id: themeId,
        classification_confidence: 1,
        classification_reason: 'Manually added to theme',
        status: 'classified',
      }))
    );

    await updateSocialDataDump(dump.id, {
      parse_status: 'completed',
      items_extracted: items.length,
      error: null,
    });

    return NextResponse.json({ success: true, items_added: items.length, theme_id: themeId });
  } catch (error) {
    console.error('Error adding items to social theme:', error);
    return NextResponse.json({ error: 'Failed to add data to theme' }, { status: 500 });
  }
}
