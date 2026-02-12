import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getExaClient } from '@autogtm/core/clients/exa';
import { inngest } from '@/inngest/client';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: queryId } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get the query
    const { data: query, error: queryError } = await supabase
      .from('exa_queries')
      .select('*')
      .eq('id', queryId)
      .single();

    if (queryError || !query) {
      return NextResponse.json({ error: 'Query not found' }, { status: 404 });
    }

    // Update status to running
    await supabase
      .from('exa_queries')
      .update({ status: 'running' })
      .eq('id', queryId);

    // Create webset via Exa API
    const exa = getExaClient();

    const websetParams: any = {
      search: {
        query: query.query,
        count: 25,
      },
      enrichments: [
        {
          description: 'Find the email address for this person or creator',
          format: 'email',
        },
        {
          description: 'Extract the follower or subscriber count if visible',
          format: 'number',
        },
      ],
    };

    if (query.criteria && query.criteria.length > 0) {
      websetParams.search.criteria = query.criteria.map((c: string) => ({ description: c }));
    }

    const webset = await exa.websets.create(websetParams);

    // Create webset run record
    const { data: websetRun, error: runError } = await supabase
      .from('webset_runs')
      .insert({
        query_id: queryId,
        webset_id: webset.id,
        status: 'running',
        items_found: 0,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (runError) {
      console.error('Error creating webset run:', runError);
    }

    // Trigger Inngest to process the webset in background
    await inngest.send({
      name: 'autogtm/webset.created',
      data: {
        queryId,
        websetId: webset.id,
        websetRunId: websetRun?.id,
      },
    });

    return NextResponse.json({
      success: true,
      websetId: webset.id,
      status: 'running',
      message: 'Search started. Lead extraction will happen in background.',
    });
  } catch (error) {
    console.error('Error running query:', error);
    return NextResponse.json(
      { error: 'Failed to run query' },
      { status: 500 }
    );
  }
}
