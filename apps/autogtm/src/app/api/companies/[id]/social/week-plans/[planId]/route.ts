import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '../../_lib';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; planId: string }> }
) {
  try {
    const { id: companyId, planId } = await params;
    const supabase = getServiceSupabase();

    const { data: plan, error: planError } = await supabase
      .from('social_week_plans')
      .select('*')
      .eq('id', planId)
      .eq('company_id', companyId)
      .single();
    if (planError) throw planError;

    const { data: posts, error: postsError } = await supabase
      .from('social_posts')
      .select('*')
      .eq('company_id', companyId)
      .eq('week_plan_id', planId)
      .order('scheduled_for', { ascending: true });
    if (postsError) throw postsError;

    return NextResponse.json({ plan, posts: posts || [] });
  } catch (error) {
    console.error('Error fetching social week plan:', error);
    return NextResponse.json({ error: 'Failed to fetch social week plan' }, { status: 500 });
  }
}
