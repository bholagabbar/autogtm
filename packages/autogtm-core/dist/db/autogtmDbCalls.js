/**
 * Database operations for AutoGTM
 * Uses Supabase as the data store
 */
import { createClient } from '@supabase/supabase-js';
import { getCampaignAnalytics } from '../clients/instantly';
let _supabaseClient = null;
export function getSupabaseClient() {
    if (!_supabaseClient) {
        const url = process.env.AUTOGTM_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.AUTOGTM_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!url || !key) {
            throw new Error('Supabase credentials are required');
        }
        _supabaseClient = createClient(url, key);
    }
    return _supabaseClient;
}
// ============ Companies ============
export async function createCompany(company) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('companies')
        .insert(company)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
export async function getCompany(id) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('companies')
        .select()
        .eq('id', id)
        .single();
    if (error && error.code !== 'PGRST116')
        throw error;
    return data;
}
export async function listCompanies() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('companies')
        .select()
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
}
export async function updateCompany(id, updates) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('companies')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
// ============ Exa Queries ============
export async function createExaQuery(query) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('exa_queries')
        .insert(query)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
export async function getExaQueriesForCompany(companyId) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('exa_queries')
        .select()
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
}
export async function getActiveExaQueries() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('exa_queries')
        .select()
        .eq('is_active', true)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
}
export async function updateExaQuery(id, updates) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('exa_queries')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
export async function deleteExaQuery(id) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('exa_queries')
        .delete()
        .eq('id', id);
    if (error)
        throw error;
}
// ============ Webset Runs ============
export async function createWebsetRun(run) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('webset_runs')
        .insert(run)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
export async function updateWebsetRun(id, updates) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('webset_runs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
export async function getLatestWebsetRun(queryId) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('webset_runs')
        .select()
        .eq('query_id', queryId)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();
    if (error && error.code !== 'PGRST116')
        throw error;
    return data;
}
// ============ Leads ============
export async function createLead(lead) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('leads')
        .insert(lead)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
export async function createLeads(leads) {
    if (leads.length === 0)
        return [];
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('leads')
        .insert(leads)
        .select();
    if (error)
        throw error;
    return data || [];
}
export async function getLeadsForQuery(queryId) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('leads')
        .select()
        .eq('query_id', queryId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
}
export async function getLeadsWithEmails(queryId) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('leads')
        .select()
        .eq('query_id', queryId)
        .not('email', 'is', null)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
}
export async function checkLeadExists(url) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('leads')
        .select('id')
        .eq('url', url)
        .limit(1);
    if (error)
        throw error;
    return (data?.length || 0) > 0;
}
export async function getLeadsByDateRange(startDate, endDate) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('leads')
        .select()
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
}
// ============ Campaigns ============
export async function createCampaign(campaign) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('campaigns')
        .insert(campaign)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
export async function getCampaign(id) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('campaigns')
        .select()
        .eq('id', id)
        .single();
    if (error && error.code !== 'PGRST116')
        throw error;
    return data;
}
export async function listCampaigns(companyId) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('campaigns')
        .select()
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
}
export async function updateCampaignStats(id, stats) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('campaigns')
        .update({ ...stats, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
export async function getActiveCampaignsForCompany(companyId) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('campaigns')
        .select()
        .eq('company_id', companyId)
        .eq('status', 'active')
        .eq('is_accepting_leads', true)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
}
export async function getCampaignsWithStats(companyId) {
    const campaigns = await getActiveCampaignsForCompany(companyId);
    return Promise.all(campaigns.map(async (c) => {
        if (!c.instantly_campaign_id) {
            return { ...c, open_rate: 0, reply_rate: 0 };
        }
        try {
            const analytics = await getCampaignAnalytics(c.instantly_campaign_id);
            return {
                ...c,
                open_rate: analytics.sent > 0 ? analytics.opened / analytics.sent : 0,
                reply_rate: analytics.sent > 0 ? analytics.replied / analytics.sent : 0,
            };
        }
        catch {
            return { ...c, open_rate: 0, reply_rate: 0 };
        }
    }));
}
export async function incrementCampaignLeadCount(campaignId) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.rpc('increment_campaign_leads', { campaign_id_input: campaignId });
    if (error) {
        // Fallback: manual increment
        const campaign = await getCampaign(campaignId);
        if (campaign) {
            await supabase
                .from('campaigns')
                .update({ leads_count: (campaign.leads_count || 0) + 1, updated_at: new Date().toISOString() })
                .eq('id', campaignId);
        }
    }
}
export async function markLeadRouted(leadId, campaignId) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('leads')
        .update({
        campaign_id: campaignId,
        campaign_status: 'routed',
        campaign_routed_at: new Date().toISOString(),
    })
        .eq('id', leadId);
    if (error)
        throw error;
}
export async function setSuggestedCampaign(leadId, campaignId, reason) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('leads')
        .update({
        suggested_campaign_id: campaignId,
        suggested_campaign_reason: reason,
    })
        .eq('id', leadId);
    if (error)
        throw error;
}
export async function markLeadSkipped(leadId, reason) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('leads')
        .update({
        campaign_status: 'skipped',
        skip_reason: reason,
    })
        .eq('id', leadId);
    if (error)
        throw error;
}
// ============ Campaign Emails ============
export async function createCampaignEmails(emails) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('campaign_emails')
        .insert(emails)
        .select();
    if (error)
        throw error;
    return data || [];
}
export async function getCampaignEmails(campaignId) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('campaign_emails')
        .select()
        .eq('campaign_id', campaignId)
        .order('step', { ascending: true });
    if (error)
        throw error;
    return data || [];
}
export async function updateCampaign(id, updates) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('campaigns')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
export async function getCampaignBySourceLeadId(leadId) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('campaigns')
        .select()
        .eq('source_lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error)
        throw error;
    return data;
}
export async function replaceCampaignEmails(campaignId, emails) {
    const supabase = getSupabaseClient();
    const { error: deleteError } = await supabase
        .from('campaign_emails')
        .delete()
        .eq('campaign_id', campaignId);
    if (deleteError)
        throw deleteError;
    if (emails.length === 0) {
        return [];
    }
    const insertRows = emails.map((email) => ({
        campaign_id: campaignId,
        step: email.step,
        subject: email.subject,
        body: email.body,
        delay_days: email.delay_days,
    }));
    const { data, error } = await supabase
        .from('campaign_emails')
        .insert(insertRows)
        .select()
        .order('step', { ascending: true });
    if (error)
        throw error;
    return data || [];
}
// ============ Daily Digests ============
export async function createDailyDigest(digest) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('daily_digests')
        .insert(digest)
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
export async function getDigestsForCompany(companyId, limit = 30) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('daily_digests')
        .select()
        .eq('company_id', companyId)
        .order('date', { ascending: false })
        .limit(limit);
    if (error)
        throw error;
    return data || [];
}
// ============ Allowed Users ============
export async function isUserAllowed(email) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('allowed_users')
        .select('id')
        .eq('email', email.toLowerCase())
        .limit(1);
    if (error)
        throw error;
    return (data?.length || 0) > 0;
}
export async function addAllowedUser(email) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('allowed_users')
        .insert({ email: email.toLowerCase() })
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
export async function listAllowedUsers() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('allowed_users')
        .select()
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return data || [];
}
// ============ Aggregate Stats ============
export async function getCompanyStats(companyId) {
    const supabase = getSupabaseClient();
    // Get lead counts
    const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('query_id', (await getExaQueriesForCompany(companyId)).map(q => q.id));
    const { count: leadsWithEmails } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .not('email', 'is', null);
    // Get campaign stats
    const campaigns = await listCampaigns(companyId);
    const totalCampaigns = campaigns.length;
    const totalEmailsSent = campaigns.reduce((sum, c) => sum + c.emails_sent, 0);
    const totalOpens = campaigns.reduce((sum, c) => sum + c.opens, 0);
    const totalReplies = campaigns.reduce((sum, c) => sum + c.replies, 0);
    return {
        totalLeads: totalLeads || 0,
        leadsWithEmails: leadsWithEmails || 0,
        totalCampaigns,
        totalEmailsSent,
        totalOpens,
        totalReplies,
    };
}
/** All companies with autopilot enabled AND the master system enabled, returning
 *  only fields needed by the sweep. Gating on both makes Autopilot a strict
 *  subset of System — turning System off guarantees the sweep is a no-op. */
export async function listAutoEnabledCompanies() {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('companies')
        .select('id, name, auto_add_enabled, auto_add_min_fit_score, auto_add_daily_limit, auto_add_run_hour_utc, auto_add_digest_email')
        .eq('auto_add_enabled', true)
        .eq('system_enabled', true);
    if (error)
        throw error;
    return data || [];
}
/**
 * Return the set of campaign ids belonging to a company. Used to server-side
 * filter the `leads` table by company (leads have no direct company_id column —
 * they're attached to a company only through their suggested/routed campaign).
 */
async function getCompanyCampaignIds(companyId) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('campaigns')
        .select('id')
        .eq('company_id', companyId);
    if (error)
        throw error;
    return (data || []).map((r) => r.id);
}
/**
 * Fetch up to `limit` leads eligible for auto-add, sorted by fit score desc then recency.
 * A lead is eligible when it has a suggested campaign belonging to this company,
 * a valid email + name, a fit score at or above the configured threshold, and is
 * not yet routed/skipped.
 *
 * Two small queries beat one big one here: campaign ids first (indexed on company_id),
 * then `leads` filtered by `suggested_campaign_id IN (...)` — all filtering server-side,
 * no over-fetch, result count == `limit` at most.
 */
export async function getEligibleLeadsForAutoAdd(companyId, minFitScore, limit) {
    const campaignIds = await getCompanyCampaignIds(companyId);
    if (campaignIds.length === 0)
        return [];
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('leads')
        .select('id, email, full_name, promotion_fit_score, suggested_campaign_id, category, bio, suggested_campaign_reason')
        .in('suggested_campaign_id', campaignIds)
        .neq('campaign_status', 'routed')
        .neq('campaign_status', 'skipped')
        .gte('promotion_fit_score', minFitScore)
        .not('email', 'is', null)
        .neq('email', '')
        .not('full_name', 'is', null)
        .neq('full_name', '')
        .order('promotion_fit_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error)
        throw error;
    // Defensive: reject whitespace-only email/name that slipped past server filters.
    return (data || [])
        .filter((r) => r.email?.trim() && r.full_name?.trim());
}
/** Count of remaining Ready-to-Add leads at or above a fit threshold, used in digest footer. */
export async function countReadyToAddLeads(companyId, minFitScore) {
    const campaignIds = await getCompanyCampaignIds(companyId);
    if (campaignIds.length === 0)
        return 0;
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .in('suggested_campaign_id', campaignIds)
        .neq('campaign_status', 'routed')
        .neq('campaign_status', 'skipped')
        .gte('promotion_fit_score', minFitScore)
        .not('email', 'is', null)
        .neq('email', '')
        .not('full_name', 'is', null)
        .neq('full_name', '');
    if (error)
        throw error;
    return count || 0;
}
export async function createAutoAddRun(params) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('auto_add_runs')
        .insert({
        company_id: params.companyId,
        min_fit_score: params.minFitScore,
        daily_limit: params.dailyLimit,
        trigger: params.trigger,
    })
        .select()
        .single();
    if (error)
        throw error;
    return data;
}
export async function completeAutoAddRun(runId, updates) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('auto_add_runs')
        .update({ ...updates, run_completed_at: new Date().toISOString() })
        .eq('id', runId);
    if (error)
        throw error;
}
export async function getRecentAutoAddRuns(companyId, limit = 10) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('auto_add_runs')
        .select()
        .eq('company_id', companyId)
        .order('run_started_at', { ascending: false })
        .limit(limit);
    if (error)
        throw error;
    return data || [];
}
//# sourceMappingURL=autogtmDbCalls.js.map