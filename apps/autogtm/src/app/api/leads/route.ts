import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get leads through their queries which are linked to companies
    // Sort by fit score (highest first), then by created_at
    let query = supabase
      .from('leads')
      .select(`
        *,
        exa_queries!inner(id, query, company_id, source_instruction_id, generation_rationale)
      `)
      .order('promotion_fit_score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (companyId) {
      query = query.eq('exa_queries.company_id', companyId);
    }

    const { data: leads, error } = await query;

    if (error) throw error;

    // Attach instruction content for leads that came from instructions
    const instructionIds = [...new Set((leads || []).map((l: any) => l.exa_queries?.source_instruction_id).filter(Boolean))];
    let instructionMap: Record<string, string> = {};
    if (instructionIds.length > 0) {
      const { data: instructions } = await supabase
        .from('company_updates')
        .select('id, content')
        .in('id', instructionIds);
      instructionMap = Object.fromEntries((instructions || []).map((i: any) => [i.id, i.content]));
    }

    const enrichedLeads = (leads || []).map((lead: any) => ({
      ...lead,
      exa_queries: lead.exa_queries ? {
        ...lead.exa_queries,
        instruction_content: lead.exa_queries.source_instruction_id ? instructionMap[lead.exa_queries.source_instruction_id] || null : null,
      } : lead.exa_queries,
    }));

    return NextResponse.json({ leads: enrichedLeads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}
