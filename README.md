<p align="center">
  <img src="apps/autogtm/src/app/icon.svg" width="64" height="64" alt="autogtm logo" />
</p>

<h1 align="center">autogtm</h1>

<p align="center">
  <strong>Cold outbound on autopilot.</strong><br/>
  Open-source go-to-market engine powered by AI.
</p>

<p align="center">
  Describe your target audience in plain English. AutoGTM discovers leads daily, enriches them with AI, creates tailored email campaigns, and sends via Instantly. System on, autopilot on, you sleep.
</p>

<p align="center"><sub>Licensed under <a href="LICENSE">AGPL-3.0</a></sub></p>

---

## How it works

```
┌─────────────┐     ┌──────────────┐     ┌────────────────┐     ┌──────────────┐
│  You add     │     │  AI generates │     │  Exa.ai finds  │     │  AI enriches │
│  context     │ ──▶ │  search       │ ──▶ │  matching      │ ──▶ │  bio, score, │
│  (plain      │     │  queries      │     │  leads daily   │     │  email, fit  │
│  English)    │     │  (8:30 AM)    │     │  (9:00 AM)     │     │              │
└─────────────┘     └──────────────┘     └────────────────┘     └──────┬───────┘
                                                                       │
                                                                       ▼
┌─────────────┐     ┌──────────────┐     ┌────────────────┐     ┌──────────────┐
│  Analytics   │     │  Instantly    │     │  You approve   │     │  AI writes   │
│  sync hourly │ ◀── │  sends on    │ ◀── │  or autopilot  │ ◀── │  personalized│
│  + digest    │     │  schedule    │     │  auto-adds     │     │  email copy  │
│  at 6 PM     │     │              │     │                │     │              │
└─────────────┘     └──────────────┘     └────────────────┘     └──────────────┘
```

### Controls

| Toggle | What it does |
|---|---|
| **System ON/OFF** | Master switch. When OFF, nothing runs. No searches, no enrichment, no campaigns. |
| **Autopilot ON/OFF** | When ON, high-fit leads (score 7+) are auto-added to campaigns. When OFF, you review manually. |

### Daily schedule

| Time | What happens |
|---|---|
| 8:30 AM | Generate search queries from your instructions |
| 9:00 AM | Run searches, discover and enrich leads |
| Hourly | Sync campaign analytics from Instantly |
| 6:00 PM | Send daily digest email |

---

## Features

- **AI lead discovery** — Exa.ai websets find people matching your natural-language description
- **AI enrichment** — Bio, social links, audience size, expertise tags, and a 1-10 fit score with reasoning
- **AI email copywriting** — Personalized multi-step sequences generated per campaign persona
- **Campaign management** — Creates and manages campaigns in Instantly.ai, tracks performance
- **System + Autopilot toggles** — Master switch for the pipeline, separate toggle for auto-routing
- **Exploration mode** — When no new instructions exist, AI generates creative queries to keep the pipeline fresh
- **Daily digest** — Summary email with leads found, emails sent, opens, and replies
- **Multi-company** — Manage multiple company profiles from a single dashboard

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org) (App Router) |
| Frontend | React 19, [Tailwind CSS](https://tailwindcss.com), [Radix UI](https://radix-ui.com) |
| Database + Auth | [Supabase](https://supabase.com) (PostgreSQL + Auth) |
| Background Jobs | [Inngest](https://inngest.com) |
| Lead Discovery | [Exa.ai](https://exa.ai) (Websets API) |
| Email Sending | [Instantly.ai](https://instantly.ai) |
| AI | [OpenAI](https://openai.com) (GPT-4.1 / GPT-5-mini) |
| Digest Emails | [Resend](https://resend.com) |

<details>
<summary><strong>Project Structure</strong></summary>

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

</details>

<details>
<summary><strong>Database Schema</strong></summary>

The [`schema.sql`](./schema.sql) file creates these tables:

| Table | Purpose |
|---|---|
| `companies` | Company profiles with targeting config, system/autopilot flags |
| `company_updates` | Natural-language instructions that drive query generation |
| `exa_queries` | AI-generated search queries linked to instructions |
| `webset_runs` | Tracks Exa webset execution and results |
| `leads` | Discovered leads with enrichment data, fit scores, and campaign routing |
| `campaigns` | Email campaigns synced with Instantly.ai |
| `campaign_emails` | Email copy (subject + body) for each campaign step |
| `daily_digests` | Daily performance summaries |
| `allowed_users` | Email whitelist for signup access |

</details>

---

## Getting Started

### Prerequisites

Accounts needed:

- [Supabase](https://supabase.com) — database and authentication
- [Exa.ai](https://exa.ai) — lead discovery via Websets API
- [Instantly.ai](https://instantly.ai) — email campaign sending
- [OpenAI](https://platform.openai.com) — AI enrichment and generation
- [Inngest](https://inngest.com) — background job scheduling
- [Resend](https://resend.com) — daily digest emails (optional)

Locally: Node.js 18+ and npm.

### Setup

```bash
# Clone and install
git clone https://github.com/your-org/autogtm.git
cd autogtm
npm install

# Configure environment
cp apps/autogtm/.env.example apps/autogtm/.env.local
# Fill in your API keys (see table below)

# Run
npm run dev
```

The app runs at [http://localhost:3200](http://localhost:3200).

For background jobs, run the Inngest dev server in a separate terminal:

```bash
npx inngest-cli@latest dev
```

<details>
<summary><strong>Environment Variables</strong></summary>

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
| `CONTACT_FORM_TO` | No | Email address to receive "Request cloud access" form submissions (falls back to first `DIGEST_RECIPIENTS` if unset) |
| `INVITE_CODES` | No | Comma-separated codes users need to sign up (default: `AUTOGTM`) |
| `NEXT_PUBLIC_APP_URL` | No | Your app URL (default: `http://localhost:3200`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | No | Google Cloud Console, for Google OAuth login |
| `REDIS_URL` | No | Redis connection string, for rate limiting |

</details>

<details>
<summary><strong>Supabase Setup</strong></summary>

Create a new Supabase project at [supabase.com](https://supabase.com), then:

1. Open your project dashboard
2. Go to **SQL Editor**
3. Paste the contents of [`schema.sql`](./schema.sql) and run it

This creates all required tables, indexes, RLS policies, and helper functions.

</details>

## Deployment

autogtm is a standard Next.js app. Deploy to any platform that supports it:

- **Vercel** — recommended, zero-config Next.js deployment
- **Netlify**, **Railway**, **Fly.io** — all work with Next.js

Make sure to:
1. Set all environment variables in your hosting platform
2. Connect your Inngest app to receive webhooks at `/api/inngest`
3. Ensure your Supabase project is on a paid plan if you need higher limits

## License

MIT
