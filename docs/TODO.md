# TODO

This is the prioritized work list for the repo.

## 1. Finish the manual-outreach MVP

### 1.1 Lead -> draft email
- [ ] Add a button/action to generate email copy for a selected enriched lead
- [ ] Show the generated draft in the UI
- [ ] Allow editing before send/export
- [ ] Persist the generated draft per lead/campaign

### 1.2 Manual send workflow
- [ ] Add "mark sent manually" action
- [ ] Store sent timestamp, mailbox used, and notes
- [ ] Distinguish `ready`, `sent manually`, `replied`, `skipped`
- [ ] Show manual-send status in the dashboard

### 1.3 Manual reply handling
- [ ] Add reply notes / outcome tracking in the lead detail view
- [ ] Track `interested`, `not now`, `not a fit`, `follow up later`

## 2. Stabilize what already works

### 2.1 Clean up the plain Exa search transition
- [ ] Remove leftover Webset-specific labels/assumptions in the UI where they no longer make sense
- [ ] Re-check `/api/queries/[id]/status` and the Searches tab wording for plain search semantics
- [ ] Confirm `webset_runs` is used consistently as a generic audit row and not treated like a live Exa Webset everywhere

### 2.2 Finish the enrichment path
- [ ] Re-verify auto campaign suggestion after enrichment on a clean lead
- [ ] Ensure lead status never falls back to `enriching` on retries
- [ ] Decide whether `bio` being null from DeepSeek responses needs a fallback/default before UI use

### 2.3 Fix UX rough edges
- [ ] Fix signup/login redirect so `/app` lands immediately without manual reload
- [ ] Make setup-page and query-run failures surface clearly in the UI
- [ ] Add clear empty/loading/error states around dashboard tabs

### 2.4 Consolidate local schema fixes
- [ ] Decide whether `schema.sql` itself should be updated to include the same assumptions as the app (`system_enabled`, local grants note), or whether migrations remain the source of truth
- [ ] Make README / setup docs match the actual local boot sequence used here

## 3. Domain + mailbox connection (core product differentiator)

### 3.1 Domain connect
- [ ] Add domain verification flow
- [ ] Add Cloudflare DNS integration for auto-provisioning verification/SPF/DKIM/DMARC records
- [ ] Show domain status: `unverified`, `verified`, `dns_error`, `ready`

### 3.2 Mailbox connect
- [ ] Add generic IMAP/SMTP mailbox connection flow (Zoho first)
- [ ] Test send / test fetch checks
- [ ] Store mailbox connection state safely
- [ ] Show mailbox status in the UI

### 3.3 Warmup tracker
- [ ] Add warmup schedule model (day 1 -> day N)
- [ ] Track per-mailbox daily cap
- [ ] Show warmup progress in the app
- [ ] Gate automation until warmup is complete

## 4. Multi-tenant foundation

### 4.1 Data model
- [ ] Add `workspaces`
- [ ] Add `workspace_members`
- [ ] Add `workspace_id` to company/query/lead/campaign tables
- [ ] Update RLS to scope by workspace

### 4.2 Product behavior
- [ ] Support operator-owned workspace + future tenant workspaces
- [ ] Keep Anchored Uniforms as tenant #1
- [ ] Prepare for Speccon as tenant #2

## 5. Automation after manual proof

### 5.1 Sending
- [ ] Add SMTP send path (Zoho first)
- [ ] Turn draft -> sent email into an app action
- [ ] Track send failures cleanly

### 5.2 Inbox / reply sync
- [ ] Pull replies from the connected mailbox
- [ ] Thread replies onto leads/campaigns
- [ ] Add human review tools around replies before any autopilot behavior

### 5.3 Autopilot
- [ ] Re-enable autopilot only after manual send flow is proven
- [ ] Add per-company daily budgets and suppress lists
- [ ] Make autopilot respect warmup state + mailbox capacity

## 6. Platform work later
- [ ] Billing / credit model
- [ ] Self-serve onboarding
- [ ] Gmail OAuth adapter (optional later)
- [ ] Additional research/enrichment agents
- [ ] Licensing review before commercial launch (AGPL)

## Recommended next task

If the goal is the **best possible v1 while warming the mailbox**, the next best task is:

> **Build the manual send workflow**

That is the shortest path from the current working lead pipeline to real outbound value.
