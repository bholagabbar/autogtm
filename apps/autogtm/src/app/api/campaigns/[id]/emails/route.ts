import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: emails, error } = await supabase
      .from('campaign_emails')
      .select('*')
      .eq('campaign_id', id)
      .order('step', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ emails: emails || [] });
  } catch (error) {
    console.error('Error fetching campaign emails:', error);
    return NextResponse.json({ error: 'Failed to fetch campaign emails' }, { status: 500 });
  }
}
