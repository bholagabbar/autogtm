import { NextRequest, NextResponse } from 'next/server';
import { createSocialTheme, listSocialThemes } from '@autogtm/core/db/socialsDbCalls';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const themes = await listSocialThemes(companyId);
    return NextResponse.json({ themes });
  } catch (error) {
    console.error('Error fetching social themes:', error);
    return NextResponse.json({ error: 'Failed to fetch social themes' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const body = await request.json() as {
      name?: string;
      purpose?: string;
      caption_prompt?: string;
      image_prompt_template?: string;
      brand_voice?: string;
      priority?: number;
      is_active?: boolean;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: 'Theme name is required' }, { status: 400 });
    }

    const theme = await createSocialTheme(companyId, {
      name: body.name.trim(),
      purpose: body.purpose?.trim() || '',
      caption_prompt: body.caption_prompt?.trim() || '',
      image_prompt_template: body.image_prompt_template?.trim() || '',
      brand_voice: body.brand_voice?.trim() || '',
      priority: Math.max(1, Math.min(10, body.priority || 1)),
      is_active: body.is_active ?? true,
    });

    return NextResponse.json({ theme });
  } catch (error) {
    console.error('Error creating social theme:', error);
    return NextResponse.json({ error: 'Failed to create social theme' }, { status: 500 });
  }
}
