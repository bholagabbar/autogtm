import { getSupabaseClient } from './autogtmDbCalls';
import type { SocialSchedulePreset, SocialScheduleSlot } from '../socials/schedulePresets';

export interface SocialTheme {
  id: string;
  company_id: string;
  name: string;
  purpose: string;
  caption_prompt: string;
  image_prompt_template: string;
  brand_voice: string;
  priority: number;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocialSchedule {
  id: string;
  company_id: string;
  preset: SocialSchedulePreset;
  slots: SocialScheduleSlot[];
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SocialDataDump {
  id: string;
  company_id: string;
  raw_content: string;
  source: 'csv' | 'paste' | 'url';
  parse_status: 'pending' | 'processing' | 'completed' | 'failed';
  items_extracted: number;
  error: string | null;
  created_at: string;
}

export interface SocialDataItem {
  id: string;
  company_id: string;
  dump_id: string;
  raw_text: string;
  structured: Record<string, unknown>;
  suggested_theme_id: string | null;
  theme_id: string | null;
  classification_confidence: number | null;
  classification_reason: string | null;
  used_for_post_id: string | null;
  status: 'pending_classification' | 'classified' | 'reserved' | 'used' | 'archived';
  created_at: string;
}

export interface SocialWeekPlan {
  id: string;
  company_id: string;
  week_start_date: string;
  status: 'draft' | 'approved' | 'completed';
  generated_at: string;
  approved_at: string | null;
  planner_summary: Record<string, unknown>;
}

export interface SocialPost {
  id: string;
  company_id: string;
  theme_id: string | null;
  data_item_id: string | null;
  week_plan_id: string | null;
  slot_index: number | null;
  caption: string | null;
  hashtags: string[];
  image_prompt: string | null;
  image_url: string | null;
  image_status: 'not_generated' | 'generating' | 'generated' | 'failed';
  scheduled_for: string;
  status: 'planned' | 'pending_review' | 'approved' | 'image_ready' | 'published' | 'failed' | 'cancelled';
  postiz_post_id: string | null;
  postiz_release_id: string | null;
  error: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export async function listSocialThemes(companyId: string): Promise<SocialTheme[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('social_themes')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_archived', false)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as SocialTheme[];
}

export async function createSocialTheme(
  companyId: string,
  payload: Omit<SocialTheme, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'is_archived'>
): Promise<SocialTheme> {
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
  if (error) throw error;
  return data as SocialTheme;
}

export async function updateSocialTheme(
  companyId: string,
  themeId: string,
  updates: Partial<Omit<SocialTheme, 'id' | 'company_id' | 'created_at'>>
): Promise<SocialTheme> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('social_themes')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('company_id', companyId)
    .eq('id', themeId)
    .select('*')
    .single();
  if (error) throw error;
  return data as SocialTheme;
}

export async function archiveSocialTheme(companyId: string, themeId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('social_themes')
    .update({ is_archived: true, is_active: false, updated_at: new Date().toISOString() })
    .eq('company_id', companyId)
    .eq('id', themeId);
  if (error) throw error;
}

export async function getSocialSchedule(companyId: string): Promise<SocialSchedule | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('social_schedules')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();
  if (error) throw error;
  return (data as SocialSchedule | null) || null;
}

export async function upsertSocialSchedule(
  companyId: string,
  payload: { preset: SocialSchedulePreset; slots: SocialScheduleSlot[]; timezone: string; is_active?: boolean }
): Promise<SocialSchedule> {
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
  if (error) throw error;
  return data as SocialSchedule;
}

export async function createSocialDataDump(
  companyId: string,
  payload: { raw_content: string; source: 'csv' | 'paste' | 'url' }
): Promise<SocialDataDump> {
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
  if (error) throw error;
  return data as SocialDataDump;
}

export async function updateSocialDataDump(
  dumpId: string,
  updates: Partial<Pick<SocialDataDump, 'parse_status' | 'items_extracted' | 'error'>>
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('social_data_dumps')
    .update(updates)
    .eq('id', dumpId);
  if (error) throw error;
}

export async function createSocialDataItems(
  companyId: string,
  dumpId: string,
  items: Array<{
    raw_text: string;
    structured?: Record<string, unknown>;
    suggested_theme_id?: string | null;
    theme_id?: string | null;
    classification_confidence?: number | null;
    classification_reason?: string | null;
    status?: SocialDataItem['status'];
  }>
): Promise<SocialDataItem[]> {
  if (items.length === 0) return [];
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
  if (error) throw error;
  return (data || []) as SocialDataItem[];
}

export async function listSocialDataItems(
  companyId: string,
  options?: { status?: SocialDataItem['status']; themeId?: string | null; limit?: number }
): Promise<SocialDataItem[]> {
  const supabase = getSupabaseClient();
  let query = supabase.from('social_data_items').select('*').eq('company_id', companyId);
  if (options?.status) query = query.eq('status', options.status);
  if (options?.themeId) query = query.eq('theme_id', options.themeId);
  query = query.order('created_at', { ascending: false });
  if (options?.limit) query = query.limit(options.limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as SocialDataItem[];
}

export async function updateSocialDataItem(
  companyId: string,
  itemId: string,
  updates: Partial<Pick<SocialDataItem, 'theme_id' | 'structured' | 'status' | 'classification_confidence' | 'classification_reason' | 'used_for_post_id'>>
): Promise<SocialDataItem> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('social_data_items')
    .update(updates)
    .eq('company_id', companyId)
    .eq('id', itemId)
    .select('*')
    .single();
  if (error) throw error;
  return data as SocialDataItem;
}

export async function upsertSocialWeekPlan(
  companyId: string,
  weekStartDate: string,
  payload: { status: SocialWeekPlan['status']; planner_summary?: Record<string, unknown>; approved_at?: string | null }
): Promise<SocialWeekPlan> {
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
  if (error) throw error;
  return data as SocialWeekPlan;
}

export async function getSocialWeekPlan(companyId: string, weekStartDate: string): Promise<SocialWeekPlan | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('social_week_plans')
    .select('*')
    .eq('company_id', companyId)
    .eq('week_start_date', weekStartDate)
    .maybeSingle();
  if (error) throw error;
  return (data as SocialWeekPlan | null) || null;
}

export async function listSocialWeekPlans(companyId: string, limit = 8): Promise<SocialWeekPlan[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('social_week_plans')
    .select('*')
    .eq('company_id', companyId)
    .order('week_start_date', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as SocialWeekPlan[];
}

export async function createSocialPosts(
  posts: Array<{
    company_id: string;
    theme_id: string | null;
    data_item_id: string | null;
    week_plan_id: string | null;
    slot_index: number | null;
    scheduled_for: string;
    status?: SocialPost['status'];
  }>
): Promise<SocialPost[]> {
  if (posts.length === 0) return [];
  const supabase = getSupabaseClient();
  const rows = posts.map((post) => ({
    ...post,
    status: post.status || 'planned',
  }));
  const { data, error } = await supabase.from('social_posts').insert(rows).select('*');
  if (error) throw error;
  return (data || []) as SocialPost[];
}

export async function listSocialPosts(
  companyId: string,
  options?: { status?: SocialPost['status']; weekPlanId?: string; limit?: number }
): Promise<SocialPost[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('social_posts')
    .select('*')
    .eq('company_id', companyId)
    .order('scheduled_for', { ascending: true });
  if (options?.status) query = query.eq('status', options.status);
  if (options?.weekPlanId) query = query.eq('week_plan_id', options.weekPlanId);
  if (options?.limit) query = query.limit(options.limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as SocialPost[];
}

export async function getSocialPostById(companyId: string, postId: string): Promise<SocialPost | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('social_posts')
    .select('*')
    .eq('company_id', companyId)
    .eq('id', postId)
    .maybeSingle();
  if (error) throw error;
  return (data as SocialPost | null) || null;
}

export async function updateSocialPost(
  companyId: string,
  postId: string,
  updates: Partial<SocialPost>
): Promise<SocialPost> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('social_posts')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('company_id', companyId)
    .eq('id', postId)
    .select('*')
    .single();
  if (error) throw error;
  return data as SocialPost;
}

export async function deletePlannedPostsForWeekPlan(companyId: string, weekPlanId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('social_posts')
    .delete()
    .eq('company_id', companyId)
    .eq('week_plan_id', weekPlanId)
    .eq('status', 'planned');
  if (error) throw error;
}

export async function createSocialPublishRun(payload: {
  company_id: string;
  social_post_id?: string | null;
  trigger?: 'cron' | 'manual';
}): Promise<{ id: string }> {
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
  if (error) throw error;
  return data as { id: string };
}

export async function completeSocialPublishRun(
  runId: string,
  updates: { status: 'completed' | 'failed'; postiz_post_id?: string | null; postiz_release_id?: string | null; error?: string | null }
): Promise<void> {
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
  if (error) throw error;
}
