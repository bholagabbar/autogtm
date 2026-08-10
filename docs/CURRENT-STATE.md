# Current State

Last updated: 2026-08-10

## Working locally

### App + infra
- Next dev server runs at `http://localhost:3200`
- Local Supabase runs via Docker
- Local Inngest dev runs and receives events from `/api/inngest`

### Product flow that works now
1. Sign in locally
2. Create a company
3. Generate search queries with DeepSeek
4. Save the company + queries
5. Run a plain Exa search synchronously
6. Insert leads directly into `leads`
7. Show leads in the dashboard
8. Trigger enrichment through Inngest or the manual enrich endpoint

### Discovery path
- The repo no longer needs Exa Websets for manual v1 discovery
- Query runs now use plain Exa `searchAndContents()`
- `webset_runs` is currently reused only as a generic search-run audit row
- Queries now move directly to `completed` / `failed`

### Background enrichment
- Local Inngest wiring is working
- Enrichment can move a lead from `pending` -> `enriching` -> `enriched`
- DeepSeek enrichment is returning real structured data

## Key local fixes already made

### AI provider swap
- Added a shared OpenAI-compatible client in `packages/autogtm-core/src/ai/client.ts`
- DeepSeek works through:
  - `OPENAI_BASE_URL=https://api.deepseek.com`
  - `OPENAI_MODEL=deepseek-chat`
- The old OpenAI Responses API calls were ported to chat completions so OpenRouter / DeepSeek can work

### Exa discovery swap
- Replaced Websets-based search runs with synchronous plain Exa search for v1
- This avoids the Exa Pro Websets requirement

### Local schema drift fixes
- `supabase/migrations/0002_grants.sql` — grants local API roles access to tables
- `supabase/migrations/0003_system_enabled.sql` — adds `companies.system_enabled`, which the app already expected

## Known issues / rough edges

### UI / product issues
- The signup flow sometimes needs a reload before `/app` redirect is visible
- The setup page previously swallowed generation errors instead of showing a toast; error surfacing should still be reviewed after recent provider changes
- The dashboard still has Webset-shaped wording in places even though the backend now uses plain Exa search
- The app still assumes a single logical tenant in the data model

### Workflow gaps
- No domain connection flow yet
- No mailbox connection flow yet
- No warmup tracker yet
- No manual-send tracking yet
- No inbox / reply sync yet
- No billing / credits yet

### Things to verify again before shipping anything real
- Auto campaign suggestion after enrichment (it partially worked during local testing, but should be re-verified cleanly)
- Search status + leads counts after a fresh boot
- Error states when Exa / DeepSeek keys are missing or invalid

## Local dependencies still expected in `.env.local`
- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`
- `EXA_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Do not commit actual values into docs.
