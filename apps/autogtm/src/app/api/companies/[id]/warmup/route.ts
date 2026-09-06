import { NextRequest, NextResponse } from 'next/server';
import { updateCompanyMailbox, getCompanyMailboxes } from '@autogtm/core/db/autogtmDbCalls';

// Dev-safe warmup state update. No external warmup provider is contacted;
// this only mutates the local warmup_state / warmup_day / daily_cap columns.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const body = await request.json();

    const mailboxes = await getCompanyMailboxes(companyId);
    const target = body.mailboxId
      ? mailboxes.find((m) => m.id === body.mailboxId)
      : mailboxes[0];

    if (!target) {
      return NextResponse.json({ error: 'No mailbox found for this company' }, { status: 404 });
    }

    const updated = await updateCompanyMailbox(target.id, {
      warmup_state: body.warmup_state ?? target.warmup_state,
      warmup_day: body.warmup_day ?? target.warmup_day,
      daily_cap: body.daily_cap ?? target.daily_cap,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating warmup state:', error);
    return NextResponse.json(
      { error: 'Failed to update warmup state' },
      { status: 500 }
    );
  }
}
