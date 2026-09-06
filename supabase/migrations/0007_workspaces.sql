-- Minimal multi-tenant workspace boundary. v1 keeps a single operator
-- workspace; this migration only introduces the tables/columns so future
-- tenant work is safe and existing companies get a default owner workspace.

create table if not exists workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  owner_user_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists workspace_members (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'owner' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now()
);

alter table companies add column if not exists workspace_id uuid references workspaces(id);
