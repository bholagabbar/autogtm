import type { SupabaseClient } from '@supabase/supabase-js';
import { searchPlainResults } from '@autogtm/core/clients/exa';
import type { ExaWebsetItem } from '@autogtm/core/types';
import { inngest } from '@/inngest/client';

type StartQueryRunResult = {
  websetId: string;
  status: 'running' | 'completed';
  message: string;
};

function platformFromUrl(url: string): string {
  if (url.includes('tiktok.com')) return 'tiktok';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('youtube.com')) return 'youtube';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('linkedin.com')) return 'linkedin';
  return 'other';
}

function itemName(item: ExaWebsetItem): string {
  const title = item.properties?.title;
  return typeof title === 'string' && title.trim() ? title : 'Unknown';
}

export async function startQueryRun(
  supabase: SupabaseClient,
  queryId: string
): Promise<StartQueryRunResult> {
  const { data: query, error: queryError } = await supabase
    .from('exa_queries')
    .select('id, company_id, query, criteria')
    .eq('id', queryId)
    .single();

  if (queryError || !query) {
    throw new Error('Query not found');
  }

  const startedAt = new Date().toISOString();

  await supabase
    .from('exa_queries')
    .update({ status: 'running', last_run_at: startedAt })
    .eq('id', queryId);

  try {
    const result = await searchPlainResults({
      query: query.query,
      count: 25,
      criteria: query.criteria,
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
    });

    const finishedAt = new Date().toISOString();

    const { data: websetRun, error: runError } = await supabase
      .from('webset_runs')
      .insert({
        query_id: queryId,
        webset_id: '',
        status: 'completed',
        items_found: result.totalItems,
        started_at: startedAt,
        completed_at: finishedAt,
      })
      .select('id')
      .single();

    if (runError) {
      console.error('Error creating search run audit row:', runError);
    }

    const leadsToInsert: Array<{
      query_id: string;
      webset_run_id: string | null;
      name: string;
      email: null;
      url: string;
      platform: string;
      follower_count: null;
      enrichment_data: Record<string, unknown>;
      enrichment_status: 'pending';
      campaign_status: 'pending';
    }> = [];

    for (const item of result.items) {
      const sourceUrl = item.properties.url;
      if (!sourceUrl) continue;

      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('url', sourceUrl)
        .single();
      if (existing) continue;

      leadsToInsert.push({
        query_id: queryId,
        webset_run_id: websetRun?.id ?? null,
        name: itemName(item),
        email: null,
        url: sourceUrl,
        platform: platformFromUrl(sourceUrl),
        follower_count: null,
        enrichment_data: item as unknown as Record<string, unknown>,
        enrichment_status: 'pending',
        campaign_status: 'pending',
      });
    }

    let insertedLeads: Array<{ id: string; url: string; email: string | null; name: string | null }> = [];
    if (leadsToInsert.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('leads')
        .insert(leadsToInsert)
        .select('id, url, email, name');
      if (insertError) throw insertError;
      insertedLeads = inserted || [];
    }

    await supabase
      .from('exa_queries')
      .update({ status: 'completed', last_run_at: finishedAt })
      .eq('id', queryId);

    if (insertedLeads.length > 0) {
      try {
        const enrichmentEvents = insertedLeads.map((lead) => ({
          name: 'autogtm/lead.created' as const,
          data: {
            leadId: lead.id,
            leadUrl: lead.url,
            leadEmail: lead.email,
            leadName: lead.name,
            companyId: query.company_id,
          },
        }));
        await inngest.send(enrichmentEvents);
      } catch (error) {
        console.error('Lead enrichment dispatch skipped:', error);
      }
    }

    return {
      websetId: result.requestId,
      status: 'completed',
      message: `Search completed. ${insertedLeads.length} leads created.`,
    };
  } catch (error) {
    await supabase
      .from('exa_queries')
      .update({ status: 'failed', last_run_at: new Date().toISOString() })
      .eq('id', queryId);
    throw error;
  }
}
