# Docs

This folder is the working source of truth for what to do next in this repo.

## Read order

1. [`CURRENT-STATE.md`](./CURRENT-STATE.md) — what works right now, what is broken, and what changed locally
2. [`TODO.md`](./TODO.md) — the actual prioritized work list
3. [`../PLANNING.md`](../PLANNING.md) — the bigger product/architecture plan

## What this repo can do today

- Local Supabase boots and the schema/migrations apply
- Next.js dashboard runs locally
- DeepSeek-backed query generation works
- Plain Exa search works (Websets removed from the critical path for manual v1)
- Leads appear in the dashboard
- Local Inngest dev runs and background enrichment can execute

## What this repo cannot do yet

- No domain connect flow in-app yet
- No mailbox connect flow in-app yet
- No warmup tracker yet
- No manual-send workflow yet
- No billing / multi-tenant workspace isolation yet

## Rule for future work

Do not put secrets, API keys, passwords, or local-only credentials in this folder.
Use `.env.local` for local credentials and keep docs high-signal, action-oriented, and safe to commit.
