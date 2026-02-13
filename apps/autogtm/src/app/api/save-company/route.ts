import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const { company, queries } = await request.json();

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create company
    const { data: newCompany, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: company.name,
        website: company.website,
        description: company.description,
        target_audience: company.targetAudience,
      })
      .select()
      .single();

    if (companyError) throw companyError;

    // Insert selected queries
    if (queries && queries.length > 0) {
      const queryRows = queries.map((q: { query: string; criteria: string[]; rationale: string }) => ({
        company_id: newCompany.id,
        query: q.query,
        criteria: q.criteria,
        generation_rationale: q.rationale,
        status: 'pending',
      }));

      const { error: queriesError } = await supabase
        .from('exa_queries')
        .insert(queryRows);

      if (queriesError) throw queriesError;
    }

    return NextResponse.json({ company: newCompany });
  } catch (error) {
    console.error('Error saving company:', error);
    return NextResponse.json(
      { error: 'Failed to save company' },
      { status: 500 }
    );
  }
}
