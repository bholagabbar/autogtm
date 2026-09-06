import { NextRequest, NextResponse } from 'next/server';
import { createCompanyMailbox, getCompanyMailboxes } from '@autogtm/core/db/autogtmDbCalls';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const body = await request.json();

    if (!body.label || typeof body.label !== 'string') {
      return NextResponse.json({ error: 'label is required' }, { status: 400 });
    }

    const record = await createCompanyMailbox({
      company_id: companyId,
      label: body.label,
      provider: body.provider,
      connection_status: body.connection_status,
      warmup_state: body.warmup_state,
      warmup_day: body.warmup_day,
      daily_cap: body.daily_cap,
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error creating company mailbox:', error);
    return NextResponse.json(
      { error: 'Failed to create mailbox' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const mailboxes = await getCompanyMailboxes(companyId);
    return NextResponse.json({ mailboxes });
  } catch (error) {
    console.error('Error fetching company mailboxes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mailboxes' },
      { status: 500 }
    );
  }
}
