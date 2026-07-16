import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Start of "today" in Eastern Time (the weekly outbound workflow runs on Thursdays ET),
// returned as a UTC ISO string so it can be compared against campaign_routed_at.
function startOfTodayET(): string {
  const now = new Date();
  const etWall = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  etWall.setHours(0, 0, 0, 0);
  const utcWall = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const etNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const offsetMs = utcWall.getTime() - etNow.getTime();
  return new Date(etWall.getTime() + offsetMs).toISOString();
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const companyId = searchParams.get('company_id');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let queriesCount = 0;
    let leadsCount = 0;
    let campaignsCount = 0;
    let outboundsToday = 0;

    if (companyId) {
      const [queriesRes, leadsRes, campaignsRes, outboundsRes] = await Promise.all([
        supabase
          .from('exa_queries')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId)
          .eq('is_active', true),
        supabase
          .from('leads')
          .select('id, exa_queries!inner(company_id)', { count: 'exact', head: true })
          .eq('exa_queries.company_id', companyId),
        supabase
          .from('campaigns')
          .select('id', { count: 'exact', head: true })
          .eq('company_id', companyId),
        supabase
          .from('leads')
          .select('id, exa_queries!inner(company_id)', { count: 'exact', head: true })
          .eq('exa_queries.company_id', companyId)
          .eq('campaign_status', 'routed')
          .gte('campaign_routed_at', startOfTodayET()),
      ]);

      queriesCount = queriesRes.count || 0;
      leadsCount = leadsRes.count || 0;
      campaignsCount = campaignsRes.count || 0;
      outboundsToday = outboundsRes.count || 0;
    }

    return NextResponse.json({
      queries: queriesCount,
      leads: leadsCount,
      campaigns: campaignsCount,
      outboundsToday,
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
