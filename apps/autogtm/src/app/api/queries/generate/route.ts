import { NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';

export async function POST(request: NextRequest) {
  try {
    const { companyId } = await request.json();

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    await inngest.send({
      name: 'autogtm/queries.generate',
      data: { companyId },
    });

    return NextResponse.json({ success: true, message: 'Query generation started' });
  } catch (error) {
    console.error('Error triggering query generation:', error);
    return NextResponse.json({ error: 'Failed to trigger query generation' }, { status: 500 });
  }
}
