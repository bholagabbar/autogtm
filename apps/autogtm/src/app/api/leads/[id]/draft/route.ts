import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateEmailSequence } from '@autogtm/core/ai/generateEmailCopy';
import { getLeadDraft, createLeadDraft, getDraftsForLead, updateLeadDraft } from '@autogtm/core/db/autogtmDbCalls';

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

    // Reuse an existing draft if one already exists for this lead.
    const existing = await getDraftsForLead(leadId);
    if (existing.length > 0) {
      return NextResponse.json(existing[0]);
    }

    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, full_name, name, bio, category, company_id')
      .eq('id', leadId)
      .single();
    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, description, target_audience')
      .eq('id', lead.company_id)
      .single();
    if (companyError || !company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    const sequence = await generateEmailSequence({
      companyName: company.name,
      companyDescription: company.description,
      valueProposition: company.description,
      targetPersona: [lead.bio, lead.category, lead.full_name].filter(Boolean).join(' ') || company.target_audience,
    });

    const draft = await createLeadDraft({
      lead_id: leadId,
      subject: sequence.initial.subject,
      body: sequence.initial.body,
    });

    return NextResponse.json(draft);
  } catch (error) {
    console.error('Error generating lead draft:', error);
    return NextResponse.json(
      { error: 'Failed to generate draft' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const drafts = await getDraftsForLead(leadId);
    return NextResponse.json({ drafts });
  } catch (error) {
    console.error('Error fetching lead drafts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch drafts' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const body = await request.json();

    const drafts = await getDraftsForLead(leadId);
    const existing = drafts[0];
    if (!existing) {
      return NextResponse.json({ error: 'No draft to update' }, { status: 404 });
    }

    const updated = await updateLeadDraft(existing.id, {
      subject: body.subject,
      body: body.body,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating lead draft:', error);
    return NextResponse.json(
      { error: 'Failed to update draft' },
      { status: 500 }
    );
  }
}
