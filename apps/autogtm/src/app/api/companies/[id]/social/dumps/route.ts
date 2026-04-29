import { NextRequest, NextResponse } from 'next/server';
import { createSocialDataDump } from '@autogtm/core/db/socialsDbCalls';
import { inngest } from '@/inngest/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const body = await request.json() as {
      raw_content?: string;
      source?: 'csv' | 'paste' | 'url';
    };

    if (!body.raw_content || !body.raw_content.trim()) {
      return NextResponse.json({ error: 'raw_content is required' }, { status: 400 });
    }

    const dump = await createSocialDataDump(companyId, {
      raw_content: body.raw_content,
      source: body.source || 'paste',
    });

    await inngest.send({
      name: 'autogtm/social.dump-created',
      data: {
        companyId,
        dumpId: dump.id,
      },
    });

    return NextResponse.json({ dump });
  } catch (error) {
    console.error('Error creating social dump:', error);
    return NextResponse.json({ error: 'Failed to create social dump' }, { status: 500 });
  }
}
