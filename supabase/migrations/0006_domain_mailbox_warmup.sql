-- Dev-safe domain, mailbox, and warmup state models.
-- These rows only represent intended/local state. No real DNS mutation,
-- mailbox provisioning, or SMTP sending is performed by the app.

create table if not exists company_domains (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  domain text not null,
  verification_status text not null default 'verification_pending' check (verification_status in ('unverified','verification_pending','verified','dns_error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists company_mailboxes (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid not null references companies(id) on delete cascade,
  provider text not null default 'smtp',
  label text not null,
  connection_status text not null default 'credentials_saved' check (connection_status in ('unconnected','credentials_saved','verified','connection_error')),
  warmup_state text not null default 'not_started' check (warmup_state in ('not_started','warming','ready','paused')),
  warmup_day integer not null default 0,
  daily_cap integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists company_domains_company_idx on company_domains(company_id);
create index if not exists company_mailboxes_company_idx on company_mailboxes(company_id);
