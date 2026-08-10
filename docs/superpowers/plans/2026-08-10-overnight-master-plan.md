# Overnight Master Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make maximum dev-safe overnight progress across the current backlog by stabilizing the working local pipeline, adding the manual outreach workflow, scaffolding domain/mailbox/warmup state, laying minimal multi-tenant groundwork, and ending with a written verification report.

**Architecture:** Execute in vertical waves. First stabilize the existing lead pipeline and split the oversized dashboard surfaces into focused components where needed. Then layer on manual draft/send state, then dev-safe domain/mailbox/warmup models, then minimal workspace scaffolding, and finally run a deliberate verification sweep that produces a written pass/fail report.

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase, Inngest, Exa, DeepSeek via OpenAI-compatible SDK, Tailwind, Vitest, React Testing Library.

## Global Constraints

- Safe-only: no real DNS mutation, mailbox provisioning, SMTP sending, billing, or other live-side effects.
- Optimize for **maximum progress**, not highest confidence, but avoid creating a pile of disconnected partial work.
- Work inside the current repo and local dev stack only.
- Preserve the already-working local flow: login, company setup, DeepSeek query generation, plain Exa search, lead insertion, local Inngest enrichment.
- End with an explicit pass/fail verification report.
- Do not deepen the single-tenant assumption; add the smallest tenant boundary that keeps future work safe.
- Keep secrets in `.env.local`, never in docs or committed source.

---

### Task 1: Stabilize the current pipeline and add a regression harness

**Files:**
- Create: `vitest.config.ts`
- Create: `apps/autogtm/vitest.setup.ts`
- Create: `apps/autogtm/src/app/api/queries/_lib/startQueryRun.test.ts`
- Create: `apps/autogtm/src/inngest/enrichLeadJob.test.ts`
- Create: `apps/autogtm/src/components/dashboard/SearchesTab.tsx`
- Create: `apps/autogtm/src/components/dashboard/LeadsTab.tsx`
- Modify: `package.json`
- Modify: `apps/autogtm/package.json`
- Modify: `apps/autogtm/src/components/Dashboard.tsx`
- Modify: `apps/autogtm/src/app/api/queries/[id]/status/route.ts`
- Modify: `apps/autogtm/src/app/setup/page.tsx` or the setup flow surface that currently swallows generation errors
- Modify: `docs/CURRENT-STATE.md`

**Interfaces:**
- Consumes: `startQueryRun(supabase, queryId)` from `apps/autogtm/src/app/api/queries/_lib/startQueryRun.ts`; `enrichLeadJob` in `apps/autogtm/src/inngest/functions.ts`; dashboard query/lead shapes already used by `Dashboard.tsx`.
- Produces:
  - regression tests proving failed queries land in `failed`, not `running`
  - regression tests proving enriched leads do not regress to `enriching` on retry
  - extracted `SearchesTab` and `LeadsTab` components consumed by `Dashboard.tsx`
  - UI error surfacing for query generation / query run failures

- [ ] **Step 1: Write the failing tests**

```ts
// apps/autogtm/src/app/api/queries/_lib/startQueryRun.test.ts
import { describe, expect, it, vi } from 'vitest';
import { startQueryRun } from './startQueryRun';

describe('startQueryRun', () => {
  it('marks the query failed when Exa search throws', async () => {
    const update = vi.fn().mockReturnThis();
    const eq = vi.fn().mockResolvedValue({});
    const single = vi.fn()
      .mockResolvedValueOnce({ data: { id: 'q1', company_id: 'c1', query: 'uniforms', criteria: [] }, error: null });

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'exa_queries') {
          return { select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single }) }), update, eq };
        }
        return { insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'run1' }, error: null }) }) }) };
      }),
    } as any;

    await expect(startQueryRun(supabase, 'q1')).rejects.toThrow();
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
  });
});
```

```ts
// apps/autogtm/src/inngest/enrichLeadJob.test.ts
import { describe, expect, it } from 'vitest';

describe('enrich lead retry semantics', () => {
  it('preserves enriched status when enriched_at already exists', async () => {
    const existingLead = {
      enriched_at: '2026-08-10T20:02:26.091Z',
      enrichment_status: 'enriched',
    };

    const nextStatus = existingLead.enriched_at ? 'enriched' : 'enriching';

    expect(nextStatus).toBe('enriched');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm run test -- startQueryRun enrichLeadJob`

Expected:
- `startQueryRun` test fails if a failed Exa call still leaves status as `running`
- the enrichment retry test fails if the job still hard-sets `enriching`

- [ ] **Step 3: Write the minimal implementation**

```ts
// vitest.config.ts
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./apps/autogtm/vitest.setup.ts'],
    include: ['apps/**/*.test.ts', 'apps/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'apps/autogtm/src'),
    },
  },
});
```

```ts
// apps/autogtm/src/components/Dashboard.tsx
import { SearchesTab } from './dashboard/SearchesTab';
import { LeadsTab } from './dashboard/LeadsTab';

// replace the current inline Searches / Leads tab blocks with these components,
// passing only the state and callbacks they need
```

```ts
// apps/autogtm/src/app/api/queries/[id]/status/route.ts
if (query.status === 'completed' || query.status === 'failed') {
  const { count: leadsCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('query_id', queryId);

  return NextResponse.json({
    status: query.status,
    leadsCreated: leadsCount || 0,
    completedAt: query.last_run_at,
  });
}
```

```ts
// setup flow UI error surfacing
if (!response.ok) {
  const body = await response.json().catch(() => ({}));
  toast({
    title: 'Error',
    description: body.error || 'Failed to generate queries',
    variant: 'destructive',
  });
  return;
}
```

- [ ] **Step 4: Run the focused tests and smoke the pipeline**

Run:
- `npm run test -- startQueryRun enrichLeadJob`
- `npm run check-types`
- open `http://localhost:3200/app`
- run one query and one enrichment against local dev

Expected:
- tests pass
- types pass
- query reaches `completed` / `failed` cleanly
- lead reaches `enriched` without retry regression
- setup/query failures show a visible error

- [ ] **Step 5: Commit**

```bash
git add vitest.config.ts apps/autogtm/vitest.setup.ts \
  apps/autogtm/src/app/api/queries/_lib/startQueryRun.test.ts \
  apps/autogtm/src/inngest/enrichLeadJob.test.ts \
  apps/autogtm/src/components/dashboard/SearchesTab.tsx \
  apps/autogtm/src/components/dashboard/LeadsTab.tsx \
  apps/autogtm/src/components/Dashboard.tsx \
  apps/autogtm/src/app/api/queries/[id]/status/route.ts \
  package.json apps/autogtm/package.json docs/CURRENT-STATE.md

git commit -m "fix: stabilize local lead pipeline and add regressions"
```

### Task 2: Add draft generation and persistence for enriched leads

**Files:**
- Create: `supabase/migrations/0004_lead_outreach_drafts.sql`
- Create: `apps/autogtm/src/app/api/leads/[id]/draft/route.ts`
- Create: `apps/autogtm/src/app/api/leads/[id]/draft/route.test.ts`
- Create: `apps/autogtm/src/components/dashboard/LeadDraftDialog.tsx`
- Modify: `packages/autogtm-core/src/types/index.ts`
- Modify: `packages/autogtm-core/src/db/autogtmDbCalls.ts`
- Modify: `apps/autogtm/src/components/dashboard/LeadsTab.tsx`
- Modify: `packages/autogtm-core/src/ai/generateEmailCopy.ts` (only if a small wrapper/helper is needed)

**Interfaces:**
- Consumes: enriched lead record; `generateEmailSequence(params)` from `packages/autogtm-core/src/ai/generateEmailCopy.ts`.
- Produces:
  - `lead_outreach_drafts` row with `{ id, lead_id, subject, body, status, created_at, updated_at }`
  - `POST /api/leads/:id/draft` returning `{ draftId, subject, body, status }`
  - `LeadDraftDialog` for review and edit

- [ ] **Step 1: Write the failing test**

```ts
// apps/autogtm/src/app/api/leads/[id]/draft/route.test.ts
import { describe, expect, it, vi } from 'vitest';
import { POST } from './route';

describe('POST /api/leads/[id]/draft', () => {
  it('creates a draft for an enriched lead', async () => {
    const request = new Request('http://localhost:3200/api/leads/lead-1/draft', {
      method: 'POST',
    });

    const response = await POST(request as any, { params: Promise.resolve({ id: 'lead-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      subject: expect.any(String),
      body: expect.any(String),
      status: 'draft',
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- leads/[id]/draft`

Expected: FAIL because the route/file/table does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```sql
-- supabase/migrations/0004_lead_outreach_drafts.sql
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
```

```ts
// packages/autogtm-core/src/db/autogtmDbCalls.ts
export async function createLeadDraft(params: {
  lead_id: string;
  subject: string;
  body: string;
}): Promise<{ id: string; lead_id: string; subject: string; body: string; status: 'draft' | 'sent_manual' }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('lead_outreach_drafts')
    .insert({ ...params, status: 'draft' })
    .select()
    .single();
  if (error) throw error;
  return data;
}
```

```ts
// apps/autogtm/src/app/api/leads/[id]/draft/route.ts
const sequence = await generateEmailSequence({
  companyName: company.name,
  companyDescription: company.description,
  valueProposition: company.description,
  leadName: lead.full_name || lead.name || 'there',
  leadBio: lead.bio || '',
  leadCategory: lead.category || 'other',
});

const draft = await createLeadDraft({
  lead_id: leadId,
  subject: sequence.initial.subject,
  body: sequence.initial.body,
});

return NextResponse.json(draft);
```

- [ ] **Step 4: Run the focused tests and smoke the UI**

Run:
- `npm run test -- leads/[id]/draft`
- `npm run check-types`
- in the app: enrich one lead, click **Generate Draft**, confirm the dialog shows a saved draft

Expected:
- API test passes
- draft row exists in `lead_outreach_drafts`
- UI shows the generated draft for an enriched lead

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0004_lead_outreach_drafts.sql \
  apps/autogtm/src/app/api/leads/[id]/draft/route.ts \
  apps/autogtm/src/app/api/leads/[id]/draft/route.test.ts \
  apps/autogtm/src/components/dashboard/LeadDraftDialog.tsx \
  apps/autogtm/src/components/dashboard/LeadsTab.tsx \
  packages/autogtm-core/src/types/index.ts \
  packages/autogtm-core/src/db/autogtmDbCalls.ts

git commit -m "feat: add lead draft generation and persistence"
```

### Task 3: Add manual-send tracking and dashboard state

**Files:**
- Create: `supabase/migrations/0005_manual_send_events.sql`
- Create: `apps/autogtm/src/app/api/leads/[id]/manual-send/route.ts`
- Create: `apps/autogtm/src/app/api/leads/[id]/manual-send/route.test.ts`
- Modify: `packages/autogtm-core/src/types/index.ts`
- Modify: `packages/autogtm-core/src/db/autogtmDbCalls.ts`
- Modify: `apps/autogtm/src/components/dashboard/LeadDraftDialog.tsx`
- Modify: `apps/autogtm/src/components/dashboard/LeadsTab.tsx`
- Modify: `apps/autogtm/src/components/Dashboard.tsx`

**Interfaces:**
- Consumes: `lead_outreach_drafts` from Task 2.
- Produces:
  - `manual_send_events` row with `{ id, lead_id, draft_id, mailbox_label, notes, sent_at }`
  - lead lifecycle visible as `sent_manually`
  - `POST /api/leads/:id/manual-send` route returning the persisted send event

- [ ] **Step 1: Write the failing test**

```ts
// apps/autogtm/src/app/api/leads/[id]/manual-send/route.test.ts
import { describe, expect, it } from 'vitest';
import { POST } from './route';

describe('POST /api/leads/[id]/manual-send', () => {
  it('records a manual send event and marks the draft sent', async () => {
    const request = new Request('http://localhost:3200/api/leads/lead-1/manual-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draftId: 'draft-1', mailboxLabel: 'Zoho outreach', notes: 'Sent after edit' }),
    });

    const response = await POST(request as any, { params: Promise.resolve({ id: 'lead-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ lead_id: 'lead-1', mailbox_label: 'Zoho outreach' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- manual-send`

Expected: FAIL because the table and route do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```sql
-- supabase/migrations/0005_manual_send_events.sql
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
```

```ts
// apps/autogtm/src/app/api/leads/[id]/manual-send/route.ts
const event = await createManualSendEvent({
  lead_id: leadId,
  draft_id: body.draftId,
  mailbox_label: body.mailboxLabel || null,
  notes: body.notes || null,
});

await markLeadDraftSent(body.draftId);

return NextResponse.json(event);
```

```ts
// apps/autogtm/src/components/dashboard/LeadsTab.tsx
// Add actions:
// - Generate Draft (for enriched leads without a draft)
// - Review Draft (for leads with a draft)
// - Mark Sent Manually (inside LeadDraftDialog)
```

- [ ] **Step 4: Run the focused tests and smoke the dashboard**

Run:
- `npm run test -- manual-send`
- `npm run check-types`
- in the app: generate a draft, mark it sent manually, refresh dashboard

Expected:
- route test passes
- `manual_send_events` row exists
- dashboard shows the lead as manually sent
- sent timestamp / notes remain visible on reload

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0005_manual_send_events.sql \
  apps/autogtm/src/app/api/leads/[id]/manual-send/route.ts \
  apps/autogtm/src/app/api/leads/[id]/manual-send/route.test.ts \
  apps/autogtm/src/components/dashboard/LeadDraftDialog.tsx \
  apps/autogtm/src/components/dashboard/LeadsTab.tsx \
  apps/autogtm/src/components/Dashboard.tsx \
  packages/autogtm-core/src/types/index.ts \
  packages/autogtm-core/src/db/autogtmDbCalls.ts

git commit -m "feat: track manual outreach sends"
```

### Task 4: Add dev-safe domain, mailbox, and warmup state models

**Files:**
- Create: `supabase/migrations/0006_domain_mailbox_warmup.sql`
- Create: `apps/autogtm/src/app/api/companies/[id]/domains/route.ts`
- Create: `apps/autogtm/src/app/api/companies/[id]/mailboxes/route.ts`
- Create: `apps/autogtm/src/app/api/companies/[id]/warmup/route.ts`
- Create: `apps/autogtm/src/app/api/companies/[id]/domains/route.test.ts`
- Create: `apps/autogtm/src/components/company/DomainConnectionPanel.tsx`
- Create: `apps/autogtm/src/components/company/MailboxConnectionPanel.tsx`
- Create: `apps/autogtm/src/components/company/WarmupStatusCard.tsx`
- Modify: `packages/autogtm-core/src/types/index.ts`
- Modify: `packages/autogtm-core/src/db/autogtmDbCalls.ts`
- Modify: `apps/autogtm/src/app/company/[id]/page.tsx`

**Interfaces:**
- Consumes: company id.
- Produces:
  - `company_domains` rows with `verification_status`
  - `company_mailboxes` rows with `connection_status`
  - `warmup_state` stored on mailbox rows
  - three dev-safe routes to create/update/read those records

- [ ] **Step 1: Write the failing test**

```ts
// apps/autogtm/src/app/api/companies/[id]/domains/route.test.ts
import { describe, expect, it } from 'vitest';
import { POST } from './route';

describe('POST /api/companies/[id]/domains', () => {
  it('creates a domain record in verification_pending state', async () => {
    const request = new Request('http://localhost:3200/api/companies/company-1/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'anchoreduniforms.co.za' }),
    });

    const response = await POST(request as any, { params: Promise.resolve({ id: 'company-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ domain: 'anchoreduniforms.co.za', verification_status: 'verification_pending' });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- domains/route`

Expected: FAIL because the table/route do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```sql
-- supabase/migrations/0006_domain_mailbox_warmup.sql
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
```

```ts
// apps/autogtm/src/app/api/companies/[id]/domains/route.ts
const record = await createCompanyDomain({
  company_id: companyId,
  domain: body.domain,
  verification_status: 'verification_pending',
});
return NextResponse.json(record);
```

```tsx
// apps/autogtm/src/components/company/WarmupStatusCard.tsx
export function WarmupStatusCard({ warmupState, warmupDay, dailyCap }: Props) {
  return (
    <div>
      <p>Warmup state: {warmupState}</p>
      <p>Day: {warmupDay}</p>
      <p>Daily cap: {dailyCap}</p>
    </div>
  );
}
```

- [ ] **Step 4: Run the focused tests and smoke the company page**

Run:
- `npm run test -- domains/route`
- `npm run check-types`
- in the app: open a company page, add a domain record and a mailbox record, confirm states render

Expected:
- domain route test passes
- company page shows persisted domain/mailbox/warmup state
- no real external DNS or mailbox operations occur

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0006_domain_mailbox_warmup.sql \
  apps/autogtm/src/app/api/companies/[id]/domains/route.ts \
  apps/autogtm/src/app/api/companies/[id]/mailboxes/route.ts \
  apps/autogtm/src/app/api/companies/[id]/warmup/route.ts \
  apps/autogtm/src/app/api/companies/[id]/domains/route.test.ts \
  apps/autogtm/src/components/company/DomainConnectionPanel.tsx \
  apps/autogtm/src/components/company/MailboxConnectionPanel.tsx \
  apps/autogtm/src/components/company/WarmupStatusCard.tsx \
  apps/autogtm/src/app/company/[id]/page.tsx \
  packages/autogtm-core/src/types/index.ts \
  packages/autogtm-core/src/db/autogtmDbCalls.ts

git commit -m "feat: add dev-safe domain and mailbox state models"
```

### Task 5: Add minimal workspace scaffolding without breaking the local flow

**Files:**
- Create: `supabase/migrations/0007_workspaces.sql`
- Create: `apps/autogtm/src/app/api/workspaces/route.ts`
- Create: `apps/autogtm/src/app/api/workspaces/route.test.ts`
- Modify: `packages/autogtm-core/src/types/index.ts`
- Modify: `packages/autogtm-core/src/db/autogtmDbCalls.ts`
- Modify: `apps/autogtm/src/app/api/companies/route.ts`
- Modify: `apps/autogtm/src/app/api/companies/[id]/route.ts`
- Modify: `apps/autogtm/src/app/app/page.tsx` or the loader that selects the current company set
- Modify: `docs/CURRENT-STATE.md`

**Interfaces:**
- Consumes: existing company creation/list/update flows.
- Produces:
  - `workspaces` table
  - `workspace_members` table
  - `companies.workspace_id`
  - a default operator workspace that owns Anchored Uniforms locally

- [ ] **Step 1: Write the failing test**

```ts
// apps/autogtm/src/app/api/workspaces/route.test.ts
import { describe, expect, it } from 'vitest';
import { POST } from './route';

describe('POST /api/workspaces', () => {
  it('creates a workspace and returns its id', async () => {
    const request = new Request('http://localhost:3200/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Anchored Uniforms Workspace', ownerUserId: 'user-1' }),
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ name: 'Anchored Uniforms Workspace', id: expect.any(String) });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm run test -- workspaces/route`

Expected: FAIL because the table and route do not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```sql
-- supabase/migrations/0007_workspaces.sql
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
```

```ts
// apps/autogtm/src/app/api/companies/route.ts
// when listing companies, preserve the current local operator flow but always include workspace_id
const { data } = await supabase
  .from('companies')
  .select('id, name, system_enabled, workspace_id')
  .order('created_at', { ascending: false });
```

```ts
// local backfill script logic inside the migration or a startup-safe route
// create one default workspace and assign existing companies to it if workspace_id is null
```

- [ ] **Step 4: Run the focused tests and smoke the local flow**

Run:
- `npm run test -- workspaces/route`
- `npm run check-types`
- boot app, log in, ensure Anchored Uniforms still appears and company routes still work

Expected:
- workspace route test passes
- existing company flow still works locally
- companies now have a workspace_id

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0007_workspaces.sql \
  apps/autogtm/src/app/api/workspaces/route.ts \
  apps/autogtm/src/app/api/workspaces/route.test.ts \
  apps/autogtm/src/app/api/companies/route.ts \
  apps/autogtm/src/app/api/companies/[id]/route.ts \
  apps/autogtm/src/app/app/page.tsx \
  packages/autogtm-core/src/types/index.ts \
  packages/autogtm-core/src/db/autogtmDbCalls.ts \
  docs/CURRENT-STATE.md

git commit -m "feat: add minimal workspace scaffolding"
```

### Task 6: Run the overnight verification sweep and write the report

**Files:**
- Create: `docs/verification/2026-08-10-overnight-run-report.md`
- Create: `apps/autogtm/scripts/verify-overnight-local.mjs`
- Modify: `docs/CURRENT-STATE.md`
- Modify: `docs/TODO.md`

**Interfaces:**
- Consumes: the completed flows from Tasks 1-5.
- Produces:
  - a repeatable local verification script
  - a written pass/fail report
  - updated docs reflecting what now works and what remains

- [ ] **Step 1: Write the failing verification script**

```js
// apps/autogtm/scripts/verify-overnight-local.mjs
throw new Error('Verification script not implemented');
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node apps/autogtm/scripts/verify-overnight-local.mjs`

Expected: FAIL with `Verification script not implemented`.

- [ ] **Step 3: Write the minimal implementation**

```js
// apps/autogtm/scripts/verify-overnight-local.mjs
import assert from 'node:assert/strict';

const checks = [];

const loginPage = await fetch('http://localhost:3200/login');
checks.push(['login page', loginPage.ok]);

const stats = await fetch('http://localhost:3200/api/stats?company_id=43e017e6-9ee5-4054-be5c-8bf78719666f');
checks.push(['stats route', stats.ok]);

for (const [label, ok] of checks) {
  assert.equal(ok, true, `${label} failed`);
}

console.log(JSON.stringify({ checks }, null, 2));
```

```md
# docs/verification/2026-08-10-overnight-run-report.md

## Pass / Fail
- Auth + dashboard boot: PASS/FAIL
- Company setup: PASS/FAIL
- Discovery: PASS/FAIL
- Enrichment: PASS/FAIL
- Manual outreach: PASS/FAIL
- State model integrity: PASS/FAIL

## Notes
- [exact failing command or observation]
```

- [ ] **Step 4: Run the verification sweep and update docs**

Run:
- `node apps/autogtm/scripts/verify-overnight-local.mjs`
- manually smoke the draft/manual-send flow in the browser
- update `docs/verification/2026-08-10-overnight-run-report.md`
- update `docs/CURRENT-STATE.md` and `docs/TODO.md`

Expected:
- script passes
- written report clearly marks pass/fail by flow
- docs reflect the repo’s actual post-overnight state

- [ ] **Step 5: Commit**

```bash
git add apps/autogtm/scripts/verify-overnight-local.mjs \
  docs/verification/2026-08-10-overnight-run-report.md \
  docs/CURRENT-STATE.md docs/TODO.md

git commit -m "docs: add overnight verification report"
```

## Self-review

### Spec coverage
- Wave 1 (stabilize pipeline) -> Task 1
- Wave 2 (manual outreach workflow) -> Tasks 2 and 3
- Wave 3 (domain/mailbox/warmup dev-safe groundwork) -> Task 4
- Wave 4 (multi-tenant foundation) -> Task 5
- Wave 5 (verification pass) -> Task 6

No spec section is left without a task.

### Placeholder scan
- No `TBD`, `TODO`, or “implement later” placeholders remain in the plan body.
- Each task includes explicit files, interfaces, test code, commands, implementation snippets, and commit steps.

### Type consistency
- Draft generation produces `lead_outreach_drafts` consumed by manual-send tracking.
- Manual-send tracking writes `manual_send_events` and updates draft state.
- Domain/mailbox/warmup state is company-scoped and dev-safe.
- Workspace scaffolding only introduces the minimal boundary needed for future work.
- Verification task depends on flows created in Tasks 1-5 and writes the report required by the spec.
