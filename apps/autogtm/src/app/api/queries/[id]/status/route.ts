import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getExaClient } from '@autogtm/core/clients/exa';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: queryId } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the query status
    const { data: query, error: queryError } = await supabase
      .from('exa_queries')
      .select('status, last_run_at')
      .eq('id', queryId)
      .single();

    if (queryError || !query) {
      return NextResponse.json({ status: 'not_found' }, { status: 404 });
    }

    // If query is completed or failed, return that
    if (query.status === 'completed' || query.status === 'failed') {
      // Get lead count for this query
      const { count: leadsCount } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('query_id', queryId);

      return NextResponse.json({
        status: query.status,
        leadsCreated: leadsCount || 0,
        completedAt: query.last_run_at,
      });
    }

    // If still running, get progress from latest webset run
    const { data: websetRun } = await supabase
      .from('webset_runs')
      .select('*')
      .eq('query_id', queryId)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    if (!websetRun || !websetRun.webset_id) {
      return NextResponse.json({
        status: 'running',
        progress: { found: 0, completion: 0 },
      });
    }

    // Get progress from Exa
    try {
      const exa = getExaClient();
      const webset = await exa.websets.get(websetRun.webset_id);
      const search = webset.searches?.[0];
      const progress = search?.progress || { found: 0, analyzed: 0, completion: 0 };

      return NextResponse.json({
        status: 'running',
        websetStatus: webset.status,
        progress: {
          found: progress.found || websetRun.items_found || 0,
          analyzed: progress.analyzed || 0,
          completion: progress.completion || 0,
        },
      });
    } catch (error) {
      // Exa error, just return what we have
      return NextResponse.json({
        status: 'running',
        progress: { found: websetRun.items_found || 0, completion: 0 },
      });
    }
  } catch (error) {
    console.error('Error checking status:', error);
    return NextResponse.json(
      { error: 'Failed to check status', status: 'error' },
      { status: 500 }
    );
  }
}
