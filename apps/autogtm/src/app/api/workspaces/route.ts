import { NextRequest, NextResponse } from 'next/server';
import { createWorkspace } from '@autogtm/core/db/autogtmDbCalls';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const workspace = await createWorkspace({
      name: body.name,
      ownerUserId: body.ownerUserId ?? null,
    });

    return NextResponse.json(workspace);
  } catch (error) {
    console.error('Error creating workspace:', error);
    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 }
    );
  }
}
