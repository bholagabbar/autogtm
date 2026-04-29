import { getSupabaseClient } from './autogtmDbCalls';
export async function listSocialThemes(companyId) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('social_themes')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_archived', false)
        .order('created_at', { ascending: false });
    if (error)
        throw error;
    return (data || []);
}
export async function createSocialTheme(companyId, payload) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('social_themes')
        .insert({
        company_id: companyId,
        ...payload,
        is_archived: false,
        updated_at: new Date().toISOString(),
    })
        .select('*')
        .single();
    if (error)
        throw error;
    return data;
}
export async function updateSocialTheme(companyId, themeId, updates) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('social_themes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('company_id', companyId)
        .eq('id', themeId)
        .select('*')
        .single();
    if (error)
        throw error;
    return data;
}
export async function archiveSocialTheme(companyId, themeId) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('social_themes')
        .update({ is_archived: true, is_active: false, updated_at: new Date().toISOString() })
        .eq('company_id', companyId)
        .eq('id', themeId);
    if (error)
        throw error;
}
export async function getSocialSchedule(companyId) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('social_schedules')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle();
    if (error)
        throw error;
    return data || null;
}
export async function upsertSocialSchedule(companyId, payload) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('social_schedules')
        .upsert({
        company_id: companyId,
        preset: payload.preset,
        slots: payload.slots,
        timezone: payload.timezone,
        is_active: payload.is_active ?? true,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id' })
        .select('*')
        .single();
    if (error)
        throw error;
    return data;
}
export async function createSocialDataDump(companyId, payload) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('social_data_dumps')
        .insert({
        company_id: companyId,
        raw_content: payload.raw_content,
        source: payload.source,
        parse_status: 'pending',
    })
        .select('*')
        .single();
    if (error)
        throw error;
    return data;
}
export async function updateSocialDataDump(dumpId, updates) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('social_data_dumps')
        .update(updates)
        .eq('id', dumpId);
    if (error)
        throw error;
}
export async function createSocialDataItems(companyId, dumpId, items) {
    if (items.length === 0)
        return [];
    const supabase = getSupabaseClient();
    const rows = items.map((item) => ({
        company_id: companyId,
        dump_id: dumpId,
        raw_text: item.raw_text,
        structured: item.structured || {},
        suggested_theme_id: item.suggested_theme_id || null,
        theme_id: item.theme_id || item.suggested_theme_id || null,
        classification_confidence: item.classification_confidence ?? null,
        classification_reason: item.classification_reason ?? null,
        status: item.status || 'classified',
    }));
    const { data, error } = await supabase.from('social_data_items').insert(rows).select('*');
    if (error)
        throw error;
    return (data || []);
}
export async function listSocialDataItems(companyId, options) {
    const supabase = getSupabaseClient();
    let query = supabase.from('social_data_items').select('*').eq('company_id', companyId);
    if (options?.status)
        query = query.eq('status', options.status);
    if (options?.themeId)
        query = query.eq('theme_id', options.themeId);
    query = query.order('created_at', { ascending: false });
    if (options?.limit)
        query = query.limit(options.limit);
    const { data, error } = await query;
    if (error)
        throw error;
    return (data || []);
}
export async function updateSocialDataItem(companyId, itemId, updates) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('social_data_items')
        .update(updates)
        .eq('company_id', companyId)
        .eq('id', itemId)
        .select('*')
        .single();
    if (error)
        throw error;
    return data;
}
export async function upsertSocialWeekPlan(companyId, weekStartDate, payload) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('social_week_plans')
        .upsert({
        company_id: companyId,
        week_start_date: weekStartDate,
        status: payload.status,
        planner_summary: payload.planner_summary || {},
        approved_at: payload.approved_at || null,
        generated_at: new Date().toISOString(),
    }, { onConflict: 'company_id,week_start_date' })
        .select('*')
        .single();
    if (error)
        throw error;
    return data;
}
export async function getSocialWeekPlan(companyId, weekStartDate) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('social_week_plans')
        .select('*')
        .eq('company_id', companyId)
        .eq('week_start_date', weekStartDate)
        .maybeSingle();
    if (error)
        throw error;
    return data || null;
}
export async function listSocialWeekPlans(companyId, limit = 8) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('social_week_plans')
        .select('*')
        .eq('company_id', companyId)
        .order('week_start_date', { ascending: false })
        .limit(limit);
    if (error)
        throw error;
    return (data || []);
}
export async function createSocialPosts(posts) {
    if (posts.length === 0)
        return [];
    const supabase = getSupabaseClient();
    const rows = posts.map((post) => ({
        ...post,
        status: post.status || 'planned',
    }));
    const { data, error } = await supabase.from('social_posts').insert(rows).select('*');
    if (error)
        throw error;
    return (data || []);
}
export async function listSocialPosts(companyId, options) {
    const supabase = getSupabaseClient();
    let query = supabase
        .from('social_posts')
        .select('*')
        .eq('company_id', companyId)
        .order('scheduled_for', { ascending: true });
    if (options?.status)
        query = query.eq('status', options.status);
    if (options?.weekPlanId)
        query = query.eq('week_plan_id', options.weekPlanId);
    if (options?.limit)
        query = query.limit(options.limit);
    const { data, error } = await query;
    if (error)
        throw error;
    return (data || []);
}
export async function getSocialPostById(companyId, postId) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('social_posts')
        .select('*')
        .eq('company_id', companyId)
        .eq('id', postId)
        .maybeSingle();
    if (error)
        throw error;
    return data || null;
}
export async function updateSocialPost(companyId, postId, updates) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('social_posts')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('company_id', companyId)
        .eq('id', postId)
        .select('*')
        .single();
    if (error)
        throw error;
    return data;
}
export async function deletePlannedPostsForWeekPlan(companyId, weekPlanId) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('social_posts')
        .delete()
        .eq('company_id', companyId)
        .eq('week_plan_id', weekPlanId)
        .eq('status', 'planned');
    if (error)
        throw error;
}
export async function createSocialPublishRun(payload) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('social_publish_runs')
        .insert({
        company_id: payload.company_id,
        social_post_id: payload.social_post_id || null,
        trigger: payload.trigger || 'cron',
    })
        .select('id')
        .single();
    if (error)
        throw error;
    return data;
}
export async function completeSocialPublishRun(runId, updates) {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('social_publish_runs')
        .update({
        status: updates.status,
        postiz_post_id: updates.postiz_post_id || null,
        postiz_release_id: updates.postiz_release_id || null,
        error: updates.error || null,
        run_completed_at: new Date().toISOString(),
    })
        .eq('id', runId);
    if (error)
        throw error;
}
//# sourceMappingURL=socialsDbCalls.js.map