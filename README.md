# autogtm

**Automated email outbound on autopilot.**

Describe your target audience in plain English. autogtm uses AI to find leads across the web, enrich them with fit scores, write personalized email sequences, and run campaigns -- all on autopilot, every day.

---

## What It Does

autogtm is an open-source go-to-market engine that automates the entire cold outbound pipeline:

1. You describe your ideal customers (e.g. "acting coaches with 5-20k followers on Instagram")
2. AI generates targeted search queries from your instructions
3. [Exa.ai](https://exa.ai) discovers matching leads across the web
4. Each lead is AI-enriched with bio, social profiles, audience size, and a 1-10 fit score
5. AI writes personalized email sequences tailored to each persona
6. Campaigns are created and sent through [Instantly.ai](https://instantly.ai)
7. Analytics (opens, replies) are synced back automatically

The entire pipeline runs daily on a schedule. New instructions you add are picked up the next morning. High-fit leads can be auto-added to campaigns without manual review.

## How It Works

```
Instructions              Search Queries             Lead Discovery
"Find acting        -->   AI generates Exa     -->   Exa Websets find
 coaches in LA"           search queries              matching people
                                |
                                v
Campaign Analytics  <--   Email Campaigns      <--   AI Enrichment
Opens, replies            Instantly.ai sends         Bio, fit score,
synced hourly             personalized emails        email extraction
```

**Daily schedule (all automated via Inngest):**
- 8:30 AM -- Generate new search queries from your latest instructions
- 9:00 AM -- Run searches and discover leads
- Ongoing -- Enrich leads as they arrive, route to campaigns
- Every hour -- Sync campaign analytics from Instantly
- 6:00 PM -- Send daily digest email with summary

## Features

- **AI lead discovery** -- Exa.ai websets find people matching your natural-language description
- **AI enrichment** -- Each lead gets a bio, social links, audience size, expertise tags, and a 1-10 fit score with reasoning
- **AI email copywriting** -- Personalized multi-step email sequences generated per campaign persona
- **Campaign management** -- Creates and manages campaigns in Instantly.ai, tracks performance
- **Auto-add mode** -- Automatically routes high-fit leads (above your threshold) to campaigns without manual review
- **Instruction-driven** -- Add new targeting instructions anytime; queries are generated from them automatically
- **Exploration mode** -- When no new instructions exist, AI generates creative queries to keep the pipeline fresh
- **Daily digest** -- Summary email with leads found, emails sent, opens, and replies
- **Multi-company** -- Manage multiple company profiles from a single dashboard

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Frontend | React 19, [Tailwind CSS](https://tailwindcss.com), [Radix UI](https://radix-ui.com) |
| Database + Auth | [Supabase](https://supabase.com) (PostgreSQL + Auth) |
| Background Jobs | [Inngest](https://inngest.com) |
| Lead Discovery | [Exa.ai](https://exa.ai) (Websets API) |
| Email Sending | [Instantly.ai](https://instantly.ai) |
| AI | [OpenAI](https://openai.com) (GPT-4.1) |
| Digest Emails | [Resend](https://resend.com) |

## Project Structure

```
apps/autogtm/              Next.js app (frontend + API routes)
  src/
    app/                   Pages and API routes
    components/            React components (Dashboard, CompanySetup, etc.)
    inngest/               Background job definitions
    lib/                   Supabase clients, utilities

packages/autogtm-core/     Core logic (shared, framework-agnostic)
  src/
    ai/                    AI agents (enrichLead, generateQueries, determineCampaign, generateEmailCopy)
    clients/               Exa and Instantly API clients
    campaigns/             Campaign creation orchestration
    db/                    Supabase database operations
    types/                 TypeScript types and Zod schemas
```

## Prerequisites

You will need accounts with:

- [Supabase](https://supabase.com) -- database and authentication
- [Exa.ai](https://exa.ai) -- lead discovery via Websets API
- [Instantly.ai](https://instantly.ai) -- email campaign sending
- [OpenAI](https://platform.openai.com) -- AI enrichment and generation
- [Inngest](https://inngest.com) -- background job scheduling
- [Resend](https://resend.com) -- daily digest emails (optional)

And locally:

- Node.js 18+
- npm

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-org/autogtm.git
cd autogtm
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up Supabase

Create a new Supabase project at [supabase.com](https://supabase.com). Then run the schema in the SQL Editor:

- Open your project dashboard
- Go to **SQL Editor**
- Paste the contents of [`schema.sql`](./schema.sql) and run it

This creates all required tables, indexes, RLS policies, and helper functions.

### 4. Configure environment variables

```bash
cp apps/autogtm/.env.example apps/autogtm/.env.local
```

Fill in your keys:

| Variable | Required | Where to get it |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase project settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase project settings > API (keep secret) |
| `EXA_API_KEY` | Yes | [exa.ai](https://exa.ai) dashboard |
| `INSTANTLY_API_KEY` | Yes | [instantly.ai](https://instantly.ai) settings > Integrations |
| `OPENAI_API_KEY` | Yes | [platform.openai.com](https://platform.openai.com) API keys |
| `INNGEST_SIGNING_KEY` | Yes | [inngest.com](https://inngest.com) > your app > signing key |
| `INNGEST_EVENT_KEY` | Yes | [inngest.com](https://inngest.com) > your app > event key |
| `RESEND_API_KEY` | No | [resend.com](https://resend.com) for daily digest emails |
| `DIGEST_FROM_EMAIL` | No | Sender address for digest emails |
| `DIGEST_RECIPIENTS` | No | Comma-separated recipient emails for daily digest |
| `INVITE_CODES` | No | Comma-separated codes users need to sign up (default: `AUTOGTM`) |
| `NEXT_PUBLIC_APP_URL` | No | Your app URL (default: `http://localhost:3200`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Google Cloud Console, for Google OAuth login |
| `REDIS_URL` | No | Redis connection string, for rate limiting |

### 5. Run the dev server

```bash
npm run dev
```

The app runs at [http://localhost:3200](http://localhost:3200).

### 6. Set up Inngest

For local development, run the [Inngest Dev Server](https://www.inngest.com/docs/local-development):

```bash
npx inngest-cli@latest dev
```

This gives you a local dashboard at `http://localhost:8288` where you can see and trigger background jobs.

For production, deploy to [Inngest Cloud](https://inngest.com) and set `INNGEST_SIGNING_KEY` and `INNGEST_EVENT_KEY` from your Inngest app.

## Database Schema

The [`schema.sql`](./schema.sql) file creates these tables:

| Table | Purpose |
|---|---|
| `companies` | Company profiles with targeting config and auto-add settings |
| `company_updates` | Natural-language instructions that drive query generation |
| `exa_queries` | AI-generated search queries linked to instructions |
| `webset_runs` | Tracks Exa webset execution and results |
| `leads` | Discovered leads with enrichment data, fit scores, and campaign routing |
| `campaigns` | Email campaigns synced with Instantly.ai |
| `campaign_emails` | Email copy (subject + body) for each campaign step |
| `daily_digests` | Daily performance summaries |
| `allowed_users` | Email whitelist for signup access |

## Deployment

autogtm is a standard Next.js app. Deploy to any platform that supports it:

- **Vercel** -- recommended, zero-config Next.js deployment
- **Netlify**, **Railway**, **Fly.io** -- all work with Next.js

Make sure to:
1. Set all environment variables in your hosting platform
2. Connect your Inngest app to receive webhooks at `/api/inngest`
3. Ensure your Supabase project is on a paid plan if you need higher limits

## License

MIT
