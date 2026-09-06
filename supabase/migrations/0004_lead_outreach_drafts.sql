-- Lead outreach drafts: AI-generated cold-email copy persisted per lead so the
-- operator can review, edit, and (later) mark as manually sent from the mailbox.
create table if not exists lead_outreach_drafts (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  subject text not null,
  body text not null,
  status text not null default 'draft' check (status in ('draft', 'sent_manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lead_outreach_drafts_lead_idx on lead_outreach_drafts(lead_id);
