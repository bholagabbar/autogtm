import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { backfillCompanyWorkspace } from '@autogtm/core/db/autogtmDbCalls';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Dev-safe backfill: ensure every company has a workspace assignment so
    // the multi-tenant boundary is always populated without breaking the
    // existing local operator flow.
    try {
      await backfillCompanyWorkspace();
    } catch (e) {
      console.error('Workspace backfill skipped:', e);
    }

    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, system_enabled, workspace_id')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ companies: companies || [] });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}
