import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { inngest } from '@/inngest/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get lead with query info
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        id, url, email, name,
        exa_queries!inner(company_id)
      `)
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Mark as enriching and reset campaign state
    await supabase
      .from('leads')
      .update({
        enrichment_status: 'enriching',
        campaign_status: 'pending',
        suggested_campaign_id: null,
        suggested_campaign_reason: null,
        skip_reason: null,
      })
      .eq('id', leadId);

    // Trigger enrichment
    await inngest.send({
      name: 'autogtm/lead.created',
      data: {
        leadId: lead.id,
        leadUrl: lead.url,
        leadEmail: lead.email,
        leadName: lead.name,
        companyId: (lead.exa_queries as any).company_id,
      },
    });

    return NextResponse.json({ success: true, message: 'Enrichment started' });
  } catch (error) {
    console.error('Error triggering enrichment:', error);
    return NextResponse.json(
      { error: 'Failed to trigger enrichment' },
      { status: 500 }
    );
  }
}
