# PLANNING — AutoGTM-as-a-Product

> Seed type: **Application** (multi-tenant B2B SaaS)
> Repo: `/home/theo/dev/autogtm` (fork of the open-source autogtm AI GTM engine)
> Status: Ideation complete — ready for graduate

---

## 1. Vision

**A multi-tenant AutoGTM platform: companies connect their own domain and mailboxes, describe their ICP in plain English, and the platform runs the whole pipeline — lead discovery, AI enrichment, personalized copywriting, sending, reply handling, autopilot — with per-tenant budgets, suppress lists, and analytics. Pay-as-you-go, per email.**

The product replicates the *experience* of Explee's AutoGTM (the current incumbent the operator pays for) while removing its biggest constraint: **tenants keep their own domain, their own reputation, and their own deliverability** — instead of renting Explee's pre-warmed shared domains.

Operator's own company (anchoreduniforms.co.za) is the first tenant; Speccon is the named second.

## 2. Problem & Opportunity

| | Explee (incumbent) | This product |
|---|---|---|
| Sending identity | Their pre-warmed domains, rented | **Tenant's own domain + mailbox** |
| Setup | Type a domain, done | Connect domain (Cloudflare auto-DNS) + mailbox creds |
| Control | Budgets/autopilot only, no access to infra | Full: mailbox, DNS, warming, suppression |
| Cost | $0.03/email + credits | Mailbox cost only (~$0) + platform fee |
| Data | Proprietary 105M/536M DB | Exa.ai (fork's existing engine) |

Differentiator: **ownership**. A tenant's outreach reputation is *their* asset, not the platform's.

## 3. Locked Scope Decisions (from ideation)

1. **Sending domain**: anchoreduniforms.co.za (operator's primary domain — risk accepted; mitigated by low volume + ramp; separate sending domain is a scale lever, not v1)
2. **DNS host**: Cloudflare — enables auto-DNS provisioning via Cloudflare API (product feature)
3. **Mailbox (v1)**: Zoho Mail free tier (`outreach@anchoreduniforms.co.za`) — generic IMAP/SMTP; no Gmail OAuth in v1
4. **Sending model (v1)**: **manual while warming** — app generates leads + copy; human reviews and sends from Zoho webmail; app enforces the warming ramp (5→30/day) and gates automation
5. **Tenancy**: multi-tenant product; v1 ships operator-only workspace, schema is tenant-ready from day one
6. **License**: repo is AGPL-3.0 — acceptable for v1; licensing review before commercial launch (open question)
7. **Volume**: a few emails/day — no scaling concerns in v1

## 4. Personas

- **Operator** (the user): runs the platform, onboards tenants, is tenant #1 (anchoreduniforms)
- **Tenant admin** (e.g. Speccon's MD): connects domain/mailbox, sets ICP + budgets, reviews leads
- **Tenant sender** (future): approves/sends campaigns, reads inbox
- **Prospect**: the lead receiving outreach

v1 has exactly one real user: the operator, wearing the tenant #1 hat.

## 5. Core Journey (v1)

```
1. Add company profile (exists: name, website, description, target audience)
2. Connect domain  → Cloudflare API auto-DNS (SPF/DKIM/DMARC) → verify
3. Connect mailbox → IMAP/SMTP creds (Zoho) → test send + fetch → verified
4. Warmup tracker starts (day 1, ramp 5→30/day, per-mailbox daily cap default 30)
5. Add Lead Briefs (exists: "acting coaches on TikTok 10k+ followers")
6. Discovery runs (exists: Exa websets → leads)
7. AI enrichment (exists: bio, fit score 1-10, reasoning)
8. AI copy per lead (exists: personalized multi-step sequence)
9. Human reviews Ready-to-Add leads → sends manually from Zoho webmail
10. Human handles replies in Zoho webmail (inbox automation = phase 2)
11. Daily digests (exists) + warmup status in dashboard
12. Warmup complete (~4 weeks) → SMTP automation unlocks (phase 2)
```

## 6. Architecture

Fork stack: Next.js 15 (App Router) + React 19/Tailwind + Supabase (Postgres+Auth) + Inngest + Exa.ai + OpenAI + Resend.

### Deltas from fork

- **Tenant shell**: `workspaces` + `workspace_members` (role); every table gains `workspace_id`; RLS scoped per workspace (fork today: flat "authenticated can do all")
- **Mailbox registry**: new `mailboxes` table (tenant_id, domain, provider, IMAP/SMTP host/port/user/encrypted pass, warmup_state, daily_cap, verified_at)
- **Warmup module**: Inngest cron — day-N ramp schedule per mailbox, per-mailbox daily cap (default 30, range 1–50), gates SMTP automation until complete
- **SendingProvider interface** (phase 2): `smtp` (Zoho) | `instantly` (client exists, dormant) | `gmail` (later) — v1 has no sender, webmail is the sender
- **Cloudflare auto-DNS**: Cloudflare API client — creates TXT (SPF/DKIM/DMARC) + verification records on tenant's zone; records validated live (green/red)
- **Inbox** (phase 2): IMAP poll → threads → hot-lead scoring → per-lead replies
- **Budgets + suppress lists** (phase 2): per-tenant daily budget, people/company suppression (mirror Explee's)
- **Analytics** (exists, extend): cost/lead, reply rate, per-campaign

### Data model additions

```
workspaces (id, name, owner_user_id, created_at)
workspace_members (workspace_id, user_id, role)
mailboxes (id, workspace_id, domain, provider, imap_*, smtp_*, encrypted_password,
           warmup_state, warmup_day, daily_cap, verified_at, created_at)
workspace_id columns on: companies, campaigns, leads, exa_queries, ... (migration)
```

Existing tables (companies, leads, campaigns, campaign_emails, auto_add_runs, daily_digests, allowed_users) reused as-is where possible.

## 7. Feature Scope

### MVP (v1) — "manual outreach while warming"
- [ ] Workspace shell (single workspace, operator as owner; multi-workspace data model in place)
- [ ] Domain connect: Cloudflare API auto-DNS + verification
- [ ] Mailbox connect: generic IMAP/SMTP creds + test send/fetch
- [ ] Warmup tracker: ramp schedule, daily cap enforcement, dashboard status
- [ ] Engine (ported from fork, workspace-scoped): briefs → Exa discovery → AI enrichment → AI copy
- [ ] Lead review UI: Ready-to-Add queue, fit score, draft sequences, "mark sent manually"
- [ ] Daily digests (existing)
- [ ] AGPL note in README; no billing in v1

### Phase 2 — "automation"
- [ ] SMTP sender (Zoho) + IMAP inbox: threads, hot-lead scoring, per-lead replies
- [ ] Per-tenant budgets + suppress lists (people/companies)
- [ ] Campaign analytics: cost/lead, reply rate, per-campaign trends
- [ ] SendingProvider interface with `instantly` adapter (client exists)
- [ ] Autopilot sweep (exists) now sends automatically post-warmup

### Phase 3 — "platform"
- [ ] Self-serve signup + onboarding for tenants
- [ ] Billing: prepaid credits (Stripe top-up), $0.03/email + per-search/enrichment metering
- [ ] Gmail OAuth adapter (Google Workspace path for tenants who want it)
- [ ] Research-agent suite (Explee's 19 agents equivalent: legal entity, revenue, hiring signals, compliance certs, competitor analysis…)
- [ ] Cloudflare Email Routing catch-all → tenant inbox (reply fallback path)
- [ ] License review (AGPL vs commercial)

### Out of scope (v1 & likely phase 2)
- Multi-domain rotation, meeting booking automation (Calendly auto-book)
- Phone/LinkedIn outreach channels
- Explee-API bridge (the operator's own Explee account stays independent)

## 8. Risks

| Risk | Severity | Mitigation |
|---|---|---|
| Deliverability on primary domain (.co.za) | High | Ramp + 30/day cap; monitor spam rate; pivot to dedicated domain before scaling |
| Zoho policy (no bulk; dynamic limits) | Medium | Manual low volume in v1; multi-mailbox before volume; Instantly adapter as escape hatch |
| AGPL-3.0 (must offer source if sold as service) | Medium | Acceptable for v1; licensing review before commercial launch |
| Exa/OpenAI cost creep | Low (few emails/day) | Meter per tenant in phase 3 billing |
| Fork drift / upstream merge | Low | Repo forked; own it from here |

## 9. Milestones

| Milestone | Exit criteria |
|---|---|
| M1: Tenant shell + domain/mailbox connect | Workspace created; anchoreduniforms.co.za verified on Cloudflare; Zoho mailbox connected + test send OK; warmup tracker day 1 |
| M2: Pipeline ported (workspace-scoped) | Briefs → discovery → enrichment → copy works under workspace RLS; review queue live |
| M3: v1 live (manual) | Operator sending real outreach manually on ramp; digests + warmup status reporting |
| M4: Phase 2 automation | SMTP send + IMAP inbox + budgets + suppress lists; autopilot sends post-warmup |
| M5: Phase 3 platform | Tenant self-serve + billing live; second tenant (Speccon) onboarded |

## 10. Open Questions

1. Billing model for tenants: prepaid credits (Explee-style) vs subscription + usage cap? (decide at M5)
2. AGPL: relicense, dual-license, or ship AGPL with source offering? (before M5)
3. Does tenant onboarding stay operator-led beyond v1? (Speccon = managed or self-serve?)
4. Product name / branding (repo/README still "autogtm")
