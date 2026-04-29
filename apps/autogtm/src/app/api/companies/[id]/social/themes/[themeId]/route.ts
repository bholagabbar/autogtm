import { NextRequest, NextResponse } from 'next/server';
import { archiveSocialTheme, updateSocialTheme } from '@autogtm/core/db/socialsDbCalls';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; themeId: string }> }
) {
  try {
    const { id: companyId, themeId } = await params;
    const body = await request.json() as Record<string, unknown>;

    const updates: Record<string, unknown> = {};
    if (typeof body.name === 'string') updates.name = body.name.trim();
    if (typeof body.purpose === 'string') updates.purpose = body.purpose;
    if (typeof body.caption_prompt === 'string') updates.caption_prompt = body.caption_prompt;
    if (typeof body.image_prompt_template === 'string') updates.image_prompt_template = body.image_prompt_template;
    if (typeof body.brand_voice === 'string') updates.brand_voice = body.brand_voice;
    if (typeof body.priority === 'number') updates.priority = Math.max(1, Math.min(10, body.priority));
    if (typeof body.is_active === 'boolean') updates.is_active = body.is_active;

    const theme = await updateSocialTheme(companyId, themeId, updates);
    return NextResponse.json({ theme });
  } catch (error) {
    console.error('Error updating social theme:', error);
    return NextResponse.json({ error: 'Failed to update social theme' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; themeId: string }> }
) {
  try {
    const { id: companyId, themeId } = await params;
    await archiveSocialTheme(companyId, themeId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting social theme:', error);
    return NextResponse.json({ error: 'Failed to delete social theme' }, { status: 500 });
  }
}
