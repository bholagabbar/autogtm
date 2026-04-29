-- ============================================================
-- Socials module schema
-- Safe to run multiple times.
-- ============================================================

create table if not exists social_themes (
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
create index if not exists social_themes_company_idx on social_themes(company_id, created_at desc);

create table if not exists social_schedules (
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
create unique index if not exists social_schedules_company_unique on social_schedules(company_id);

create table if not exists social_week_plans (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  week_start_date date not null,
  status text not null default 'draft' check (status in ('draft', 'approved', 'completed')),
  generated_at timestamptz not null default now(),
  approved_at timestamptz,
  planner_summary jsonb not null default '{}'::jsonb
);
create unique index if not exists social_week_plans_company_week_unique on social_week_plans(company_id, week_start_date);

create table if not exists social_data_dumps (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  raw_content text not null,
  source text not null default 'paste' check (source in ('csv', 'paste', 'url')),
  parse_status text not null default 'pending' check (parse_status in ('pending', 'processing', 'completed', 'failed')),
  items_extracted integer not null default 0,
  error text,
  created_at timestamptz not null default now()
);
create index if not exists social_data_dumps_company_idx on social_data_dumps(company_id, created_at desc);

create table if not exists social_data_items (
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
create index if not exists social_data_items_company_status_idx on social_data_items(company_id, status, created_at);

create table if not exists social_posts (
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
create index if not exists social_posts_company_schedule_idx on social_posts(company_id, scheduled_for);
create index if not exists social_posts_status_schedule_idx on social_posts(status, scheduled_for);

create table if not exists social_publish_runs (
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
create index if not exists social_publish_runs_company_started_idx on social_publish_runs(company_id, run_started_at desc);

alter table social_themes enable row level security;
alter table social_schedules enable row level security;
alter table social_week_plans enable row level security;
alter table social_data_dumps enable row level security;
alter table social_data_items enable row level security;
alter table social_posts enable row level security;
alter table social_publish_runs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'social_themes' and policyname = 'Authenticated users can manage social_themes'
  ) then
    create policy "Authenticated users can manage social_themes"
      on social_themes for all using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'social_schedules' and policyname = 'Authenticated users can manage social_schedules'
  ) then
    create policy "Authenticated users can manage social_schedules"
      on social_schedules for all using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'social_week_plans' and policyname = 'Authenticated users can manage social_week_plans'
  ) then
    create policy "Authenticated users can manage social_week_plans"
      on social_week_plans for all using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'social_data_dumps' and policyname = 'Authenticated users can manage social_data_dumps'
  ) then
    create policy "Authenticated users can manage social_data_dumps"
      on social_data_dumps for all using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'social_data_items' and policyname = 'Authenticated users can manage social_data_items'
  ) then
    create policy "Authenticated users can manage social_data_items"
      on social_data_items for all using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'social_posts' and policyname = 'Authenticated users can manage social_posts'
  ) then
    create policy "Authenticated users can manage social_posts"
      on social_posts for all using (auth.role() = 'authenticated');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'social_publish_runs' and policyname = 'Authenticated users can manage social_publish_runs'
  ) then
    create policy "Authenticated users can manage social_publish_runs"
      on social_publish_runs for all using (auth.role() = 'authenticated');
  end if;
end$$;
