import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createManualSendEvent, markLeadDraftSent, getLeadDraft } from '@autogtm/core/db/autogtmDbCalls';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const body = await request.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Resolve the draft for this lead (prefer the one named in the request).
    const draftId: string | undefined = body.draftId;
    let draft = draftId ? await getLeadDraft(draftId) : null;
    if (!draft) {
      const { data: fallback } = await supabase
        .from('lead_outreach_drafts')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      draft = (fallback as any) || null;
    }
    if (!draft) {
      return NextResponse.json({ error: 'No draft found for this lead' }, { status: 404 });
    }

    const event = await createManualSendEvent({
      lead_id: leadId,
      draft_id: draft.id,
      mailbox_label: body.mailboxLabel || null,
      notes: body.notes || null,
    });

    await markLeadDraftSent(draft.id);

    return NextResponse.json(event);
  } catch (error) {
    console.error('Error recording manual send:', error);
    return NextResponse.json(
      { error: 'Failed to record manual send' },
      { status: 500 }
    );
  }
}
