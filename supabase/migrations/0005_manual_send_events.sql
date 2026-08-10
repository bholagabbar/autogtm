-- Manual send events: record when the operator sends a generated draft from
-- their own mailbox (webmail today; SMTP automation later). Keeps a timestamp,
-- the mailbox used, and free-text notes for auditing the manual warmup phase.
create table if not exists manual_send_events (
  id uuid primary key default uuid_generate_v4(),
  lead_id uuid not null references leads(id) on delete cascade,
  draft_id uuid not null references lead_outreach_drafts(id) on delete cascade,
  mailbox_label text,
  notes text,
  sent_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists manual_send_events_lead_idx on manual_send_events(lead_id);
