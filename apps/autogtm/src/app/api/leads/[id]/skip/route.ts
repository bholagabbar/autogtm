import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const { error } = await supabase
      .from('leads')
      .update({
        campaign_status: 'skipped',
        skip_reason: 'Manually skipped',
        suggested_campaign_id: null,
        suggested_campaign_reason: null,
      })
      .eq('id', leadId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error skipping lead:', error);
    return NextResponse.json({ error: 'Failed to skip lead' }, { status: 500 });
  }
}
