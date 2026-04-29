-- AutoGTM Database Schema
-- Run this in your Supabase SQL Editor to set up the required tables.

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- Companies
-- ============================================================
create table companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  website text not null,
  description text not null default '',
  target_audience text not null default '',
  sending_emails text[] default '{}',
  default_sequence_length integer not null default 2 check (default_sequence_length between 1 and 3),
  email_prompt text,
  auto_add_enabled boolean not null default false,
  auto_add_min_fit_score integer not null default 7,
  auto_add_daily_limit integer not null default 5 check (auto_add_daily_limit between 0 and 500),
  auto_add_run_hour_utc integer not null default 14 check (auto_add_run_hour_utc between 0 and 23),
  auto_add_digest_email text,
  auto_add_regenerate_drafts boolean not null default false,
  agent_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Outreach Prompts (reusable prompt presets)
-- ============================================================
create table outreach_prompts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  content text not null,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Company Updates (instructions for query generation)
-- ============================================================
create table company_updates (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  content text not null,
  outreach_prompt_id uuid references outreach_prompts(id) on delete set null,
  outreach_prompt_snapshot text,
  query_generated boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Exa Queries
-- ============================================================
create table exa_queries (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  query text not null,
  criteria text[] default '{}',
  is_active boolean not null default true,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  last_run_at timestamptz,
  source_instruction_id uuid references company_updates(id) on delete set null,
  generation_rationale text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Webset Runs
-- ============================================================
create table webset_runs (
  id uuid primary key default uuid_generate_v4(),
  query_id uuid not null references exa_queries(id) on delete cascade,
  webset_id text not null,
  status text not null default 'pending' check (status in ('pending', 'running', 'completed', 'failed')),
  items_found integer not null default 0,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

-- ============================================================
-- Campaigns
-- ============================================================
create table campaigns (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  source_lead_id uuid,
  draft_type text not null default 'lead' check (draft_type in ('lead')),
  instantly_campaign_id text,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed')),
  persona text,
  target_criteria jsonb,
  leads_count integer not null default 0,
  emails_sent integer not null default 0,
  opens integer not null default 0,
  replies integer not null default 0,
  is_accepting_leads boolean not null default true,
  max_leads integer not null default 500,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Campaign Emails (email copy per step)
-- ============================================================
create table campaign_emails (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  step integer not null default 0,
  subject text not null,
  body text not null,
  delay_days integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index campaigns_source_lead_unique on campaigns(source_lead_id) where source_lead_id is not null;
create unique index campaign_emails_campaign_step_unique on campaign_emails(campaign_id, step);

create table campaign_email_versions (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references campaigns(id) on delete cascade,
  version_number integer not null,
  step integer not null default 0,
  subject text not null,
  body text not null,
  delay_days integer not null default 0,
  created_at timestamptz not null default now()
);
create unique index campaign_email_versions_unique_step on campaign_email_versions(campaign_id, version_number, step);
create index campaign_email_versions_campaign_version_idx on campaign_email_versions(campaign_id, version_number desc);

-- ============================================================
-- Leads
-- ============================================================
create table leads (
  id uuid primary key default uuid_generate_v4(),
  query_id uuid not null references exa_queries(id) on delete cascade,
  webset_run_id uuid references webset_runs(id) on delete set null,
  name text,
  email text,
  url text not null,
  platform text,
  follower_count integer,
  enrichment_data jsonb,
  -- Enriched fields
  category text check (category in ('influencer', 'coach', 'blog', 'agency', 'podcast', 'other')),
  full_name text,
  title text,
  bio text,
  expertise text[],
  social_links jsonb,
  total_audience integer,
  content_types text[],
  promotion_fit_score integer check (promotion_fit_score between 1 and 10),
  promotion_fit_reason text,
  enrichment_status text not null default 'pending' check (enrichment_status in ('pending', 'enriching', 'enriched', 'failed')),
  enriched_at timestamptz,
  -- Campaign routing
  suggested_campaign_id uuid references campaigns(id) on delete set null,
  suggested_campaign_reason text,
  campaign_id uuid references campaigns(id) on delete set null,
  campaign_status text not null default 'pending' check (campaign_status in ('pending', 'routed', 'skipped')),
  campaign_routed_at timestamptz,
  skip_reason text,
  created_at timestamptz not null default now()
);

-- Prevent duplicate leads by URL
create unique index leads_url_unique on leads(url);
alter table campaigns add constraint campaigns_source_lead_fkey
  foreign key (source_lead_id) references leads(id) on delete set null;

-- ============================================================
-- Daily Digests
-- ============================================================
create table daily_digests (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  date text not null,
  leads_found integer not null default 0,
  emails_sent integer not null default 0,
  opens integer not null default 0,
  replies integer not null default 0,
  sent_at timestamptz not null default now()
);

-- ============================================================
-- Auto Add Runs (daily autopilot sweep audit + digest history)
-- ============================================================
create table auto_add_runs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  run_started_at timestamptz not null default now(),
  run_completed_at timestamptz,
  leads_considered integer not null default 0,
  leads_added integer not null default 0,
  leads_skipped integer not null default 0,
  min_fit_score integer not null,
  daily_limit integer not null,
  breakdown jsonb not null default '[]'::jsonb,
  added_lead_ids uuid[] not null default '{}',
  skip_reasons jsonb not null default '{}'::jsonb,
  digest_sent boolean not null default false,
  digest_error text,
  error text,
  trigger text not null default 'cron'
);
create index auto_add_runs_company_started_idx on auto_add_runs(company_id, run_started_at desc);

-- ============================================================
-- Social Themes (creative DNA + priority)
-- ============================================================
create table social_themes (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  purpose text not null default '',
  caption_prompt text not null default '',
  image_prompt_template text not null default '',
  brand_voice text not null default '',
  priority integer not null default 1 check (priority between 1 and 10),
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index social_themes_company_idx on social_themes(company_id, created_at desc);

-- ============================================================
-- Social Schedules (company-level cadence presets + slots)
-- ============================================================
create table social_schedules (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  preset text not null default 'creator_mwf' check (
    preset in ('creator_daily', 'creator_mwf', 'brand_weekday', 'brand_heavy', 'weekly_pulse', 'custom')
  ),
  slots jsonb not null default '[]'::jsonb,
  timezone text not null default 'America/New_York',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index social_schedules_company_unique on social_schedules(company_id);

-- ============================================================
-- Social Week Plans
-- ============================================================
create table social_week_plans (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  week_start_date date not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'completed')),
  generated_at timestamptz not null default now(),
  approved_at timestamptz,
  planner_summary jsonb not null default '{}'::jsonb
);
create unique index social_week_plans_company_week_unique on social_week_plans(company_id, week_start_date);

-- ============================================================
-- Social Data Dumps
-- ============================================================
create table social_data_dumps (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  raw_content text not null,
  source text not null default 'paste' check (source in ('csv', 'paste', 'url')),
  parse_status text not null default 'pending' check (parse_status in ('pending', 'processing', 'completed', 'failed')),
  items_extracted integer not null default 0,
  error text,
  created_at timestamptz not null default now()
);
create index social_data_dumps_company_idx on social_data_dumps(company_id, created_at desc);

-- ============================================================
-- Social Data Items
-- ============================================================
create table social_data_items (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  dump_id uuid not null references social_data_dumps(id) on delete cascade,
  raw_text text not null,
  structured jsonb not null default '{}'::jsonb,
  suggested_theme_id uuid references social_themes(id) on delete set null,
  theme_id uuid references social_themes(id) on delete set null,
  classification_confidence numeric(4,3),
  classification_reason text,
  used_for_post_id uuid,
  status text not null default 'pending_classification' check (
    status in ('pending_classification', 'classified', 'reserved', 'used', 'archived')
  ),
  created_at timestamptz not null default now()
);
create index social_data_items_company_status_idx on social_data_items(company_id, status, created_at);

-- ============================================================
-- Social Posts
-- ============================================================
create table social_posts (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  theme_id uuid references social_themes(id) on delete set null,
  data_item_id uuid references social_data_items(id) on delete set null,
  week_plan_id uuid references social_week_plans(id) on delete set null,
  slot_index integer,
  caption text,
  hashtags text[] not null default '{}',
  image_prompt text,
  image_url text,
  image_status text not null default 'not_generated' check (image_status in ('not_generated', 'generating', 'generated', 'failed')),
  scheduled_for timestamptz not null,
  status text not null default 'planned' check (
    status in ('planned', 'pending_review', 'approved', 'image_ready', 'published', 'failed', 'cancelled')
  ),
  postiz_post_id text,
  postiz_release_id text,
  error text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index social_posts_company_schedule_idx on social_posts(company_id, scheduled_for);
create index social_posts_status_schedule_idx on social_posts(status, scheduled_for);

-- ============================================================
-- Social Publish Runs (audit)
-- ============================================================
create table social_publish_runs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  social_post_id uuid references social_posts(id) on delete set null,
  run_started_at timestamptz not null default now(),
  run_completed_at timestamptz,
  status text not null default 'running' check (status in ('running', 'completed', 'failed')),
  trigger text not null default 'cron' check (trigger in ('cron', 'manual')),
  postiz_post_id text,
  postiz_release_id text,
  error text
);
create index social_publish_runs_company_started_idx on social_publish_runs(company_id, run_started_at desc);

-- ============================================================
-- Allowed Users (invite whitelist)
-- ============================================================
create table allowed_users (
  id uuid primary key default uuid_generate_v4(),
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ============================================================
-- Helper function: increment campaign lead count
-- ============================================================
create or replace function increment_campaign_leads(campaign_id_input uuid)
returns void as $$
begin
  update campaigns
  set leads_count = leads_count + 1,
      updated_at = now()
  where id = campaign_id_input;
end;
$$ language plpgsql;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table companies enable row level security;
alter table company_updates enable row level security;
alter table outreach_prompts enable row level security;
alter table exa_queries enable row level security;
alter table webset_runs enable row level security;
alter table campaigns enable row level security;
alter table campaign_emails enable row level security;
alter table leads enable row level security;
alter table daily_digests enable row level security;
alter table auto_add_runs enable row level security;
alter table social_themes enable row level security;
alter table social_schedules enable row level security;
alter table social_week_plans enable row level security;
alter table social_data_dumps enable row level security;
alter table social_data_items enable row level security;
alter table social_posts enable row level security;
alter table social_publish_runs enable row level security;
alter table allowed_users enable row level security;

-- Allow authenticated users full access (adjust as needed for your use case)
create policy "Authenticated users can manage companies"
  on companies for all using (auth.role() = 'authenticated');

create policy "Authenticated users can manage company_updates"
  on company_updates for all using (auth.role() = 'authenticated');

create policy "Authenticated users can manage outreach_prompts"
  on outreach_prompts for all using (auth.role() = 'authenticated');

create policy "Authenticated users can manage exa_queries"
  on exa_queries for all using (auth.role() = 'authenticated');

create policy "Authenticated users can manage webset_runs"
  on webset_runs for all using (auth.role() = 'authenticated');

create policy "Authenticated users can manage campaigns"
  on campaigns for all using (auth.role() = 'authenticated');

create policy "Authenticated users can manage campaign_emails"
  on campaign_emails for all using (auth.role() = 'authenticated');

create policy "Authenticated users can manage leads"
  on leads for all using (auth.role() = 'authenticated');

create policy "Authenticated users can manage daily_digests"
  on daily_digests for all using (auth.role() = 'authenticated');

create policy "Authenticated users can manage auto_add_runs"
  on auto_add_runs for all using (auth.role() = 'authenticated');

create policy "Authenticated users can manage social_themes"
  on social_themes for all using (auth.role() = 'authenticated');

create policy "Authenticated users can manage social_schedules"
  on social_schedules for all using (auth.role() = 'authenticated');

create policy "Authenticated users can manage social_week_plans"
  on social_week_plans for all using (auth.role() = 'authenticated');

create policy "Authenticated users can manage social_data_dumps"
  on social_data_dumps for all using (auth.role() = 'authenticated');

create policy "Authenticated users can manage social_data_items"
  on social_data_items for all using (auth.role() = 'authenticated');

create policy "Authenticated users can manage social_posts"
  on social_posts for all using (auth.role() = 'authenticated');

create policy "Authenticated users can manage social_publish_runs"
  on social_publish_runs for all using (auth.role() = 'authenticated');

create policy "Authenticated users can read allowed_users"
  on allowed_users for select using (auth.role() = 'authenticated');
