# Overnight Master Plan Design

Date: 2026-08-10
Repo: `/home/theo/dev/autogtm`
Design type: dev-safe overnight execution design
Status: approved in conversation, awaiting user review of written spec

## Goal

Define a **dev-safe overnight run** that can make maximum progress across the current backlog **without touching live external systems** such as real Cloudflare DNS, Zoho mailboxes, or sending infrastructure.

The overnight run must end with a **verification pass**. “Done” means the repo wakes up in a more capable state with evidence, not just more changed files.

## Constraints

- Safe-only: no real DNS mutation, mailbox provisioning, SMTP sending, billing, or other live-side effects.
- Optimize for **maximum progress**, not highest confidence, but avoid creating a pile of disconnected partial work.
- Work inside the current repo and local dev stack only.
- Preserve the already-working local flow:
  - login
  - company setup
  - DeepSeek query generation
  - plain Exa search
  - lead insertion
  - local Inngest enrichment
- End with an explicit pass/fail verification report.

## Recommended planning approach

Use **vertical waves** instead of breadth-first or platform-first work.

### Why this approach

A breadth-first sweep would touch every backlog area but maximize partial work and integration drag. A platform-first foundation would be architecturally cleaner, but it would delay visible value. The vertical-wave approach gives the best balance for an overnight run: each wave leaves behind a coherent improvement, and later waves build on a more stable base.

## Overnight wave plan

### Wave 1 — stabilize the current pipeline

Purpose: make the existing local pipeline trustworthy before building new workflow on top.

Includes:
- finish the plain Exa search transition cleanup
- remove obvious UI/status drift left behind by the Websets removal
- tighten error surfacing where failures are currently silent or misleading
- re-verify enrichment/retry/status transitions

Exit criteria:
- company -> query generation -> search -> leads -> enrichment works locally without wedged states
- known silent failures are surfaced in the UI or logs clearly enough to debug

### Wave 2 — manual outreach workflow

Purpose: convert the existing lead pipeline into a real manual-outreach tool while the mailbox is still warming.

Includes:
- generate an email draft for an enriched lead
- show and edit the draft in the UI
- mark a lead as sent manually
- persist manual-send metadata such as sent timestamp, mailbox label, and notes
- show manual-send state in the dashboard

Exit criteria:
- one lead can move from enriched -> drafted -> sent manually entirely inside the app state model

### Wave 3 — dev-safe domain/mailbox groundwork

Purpose: build the product scaffolding for the differentiator without touching real external systems.

Includes:
- domain entity + state model
- mailbox entity + state model
- mock/testable connection flow
- warmup state representation and gating rules

Exit criteria:
- the app can represent domain connection, mailbox connection, and warmup status coherently using persistent local state

### Wave 4 — multi-tenant foundation

Purpose: stop deepening the single-tenant assumption while keeping the overnight scope reasonable.

Includes:
- workspace model
- membership model
- enough data-scoping groundwork to keep future work tenant-safe
- avoid a massive full-RLS rewrite unless correctness demands it for changed paths

Exit criteria:
- new work added after this point has a clear tenant boundary

### Wave 5 — verification pass

Purpose: end the night with evidence instead of hope.

Includes:
- rerun the local pipeline
- verify auth, setup, discovery, enrichment, manual-send flow, and state-model integrity
- write a written pass/fail summary

Exit criteria:
- a human can read the verification summary and understand exactly what works, what failed, and where to pick up next

## Architecture boundaries for the overnight run

Treat the repo as four bounded layers.

### 1. Pipeline core

Owns:
- query generation
- search execution
- lead ingestion
- enrichment
- campaign suggestion
- manual-send state transitions

Rule: this layer should encode workflow and durable state transitions, not UI behavior.

### 2. Product state layer

Owns the data model shared by pipeline and UI.

Existing state already includes:
- companies
- exa_queries
- leads
- campaigns
- campaign_emails
- webset_runs (already repurposed into a generic search-run audit row)

Overnight additions should remain here:
- manual-send metadata
- domain status model
- mailbox status model
- warmup state
- workspace scaffolding

### 3. UI workflow layer

Owns:
- review screens
- draft editing
- manual-send actions
- setup/connect flows
- visibility into system state and verification

Rule: UI should expose and transition durable state, not invent parallel client-only workflow logic.

### 4. Integration layer

Owns:
- DeepSeek / OpenAI-compatible client use
- Exa calls
- local Supabase
- Inngest
- future Cloudflare / IMAP / SMTP integrations

Rule for this overnight run: keep this layer dev-safe. Real DeepSeek and Exa usage is acceptable. Real external mutations are not.

## State model for the overnight run

### Lead lifecycle

User-visible lifecycle target:
- `discovered`
- `enriching`
- `enriched`
- `drafted`
- `sent_manually`
- `replied`
- `skipped`
- `failed`

This does **not** require collapsing everything into a single DB enum overnight. The repo can continue using split status fields internally, but the overnight run must leave the **visible lifecycle** unambiguous.

Required transitions:
- discovered -> enriching -> enriched
- enriched -> drafted
- drafted -> sent_manually
- any state -> skipped
- failed steps -> explicit retry path

### Query / search lifecycle

Keep the current explicit states:
- `pending`
- `running`
- `completed`
- `failed`

For plain Exa v1 behavior:
- query starts
- synchronous search executes
- leads insert immediately
- audit row is written
- query lands in completed or failed directly

No fake long-running Webset semantics should remain in behavior or labels where they mislead the user.

### Manual-send record

Minimum data shape:
- `lead_id`
- `draft content used`
- `sent_at`
- `mailbox_label` or free-text source
- `notes`

A dedicated record is preferred if the system is likely to need audit history, retries, or multiple sends per lead.

### Domain state

Required states:
- `unverified`
- `verification_pending`
- `verified`
- `dns_error`

### Mailbox state

Required states:
- `unconnected`
- `credentials_saved`
- `verified`
- `connection_error`

### Warmup state

Required states:
- `not_started`
- `warming`
- `ready`
- `paused`

Even if some transitions remain mocked for now, the states should be persisted and coherent.

### Workspace scaffolding

Minimum requirement:
- workspace
- membership
- company belongs to workspace

The overnight run should avoid an unnecessarily huge platform rewrite, but it should stop new work from deepening the single-tenant hole.

## Execution strategy

Each overnight wave should follow the same four-stage discipline.

### 1. Implement
Make the smallest coherent set of changes that produces a meaningful capability.

### 2. Run targeted checks
Boot the app and exercise only the flows changed in that wave. Check DB state where relevant.

### 3. Stabilize
Fix regressions or wedged state before expanding into the next wave.

### 4. Checkpoint
Update docs or working notes so the next wave starts from facts, not memory.

This means the overnight run should **not**:
- code everything first and verify only at the end
- accept accumulating failures as temporary debt
- move to the next wave on a knowingly unstable base

## Verification contract

The overnight run is only complete if it ends with a written pass/fail report for the following flows.

### Flow 1 — auth + dashboard boot
- login works
- dashboard renders
- no known stuck loading state in the primary path

### Flow 2 — company setup
- create/edit company works
- query generation works
- queries save correctly

### Flow 3 — discovery
- run a search
- query reaches the correct terminal status
- leads appear
- no wedged running state

### Flow 4 — enrichment
- trigger enrichment
- lead reaches a clean terminal state
- no retry regressions
- expected fields populate

### Flow 5 — manual outreach
- generate draft
- review/edit draft
- mark sent manually
- manual-send state persists and is visible in the UI

### Flow 6 — state model integrity
- domain/mailbox/warmup entities persist coherently
- workspace relations do not break the existing local flow
- no silent schema drift is introduced

## Failure policy

If a wave cannot pass its own verification:
- stop expanding scope
- fix or reduce that wave
- do **not** move to the next wave with a knowingly broken base

That is how this overnight run preserves maximum progress without turning into maximum churn.

## Out of scope for the overnight run

- real Cloudflare DNS mutation
- real mailbox provisioning
- real SMTP sending
- real inbox sync
- billing / credits
- full commercial multi-tenant rollout

## Decisions captured from brainstorming

- The run is **safe-only** and must stay inside repo-local/dev-safe boundaries.
- The run should optimize for **maximum progress**.
- The plan should cover the full backlog at a high level, but execution should still happen in ordered waves.
- The overnight run must end with an explicit verification pass.

## Immediate next step after user review

Once this written spec is approved, the next action is to invoke the **writing-plans** skill and turn this design into a detailed implementation plan for the overnight run.
