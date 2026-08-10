#!/usr/bin/env node
// Local verification sweep for the overnight v1 foundation.
// Safe-only: it never mutates DNS, mailboxes, or sends mail. It checks the
// auth/dashboard boot, runs the unit/route test suite, and verifies the
// migration files exist. HTTP checks degrade gracefully if no local server
// is running.

import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const checks = [];

function record(label, ok, detail) {
  checks.push({ label, ok, detail: detail ?? '' });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${label}${detail ? ` — ${detail}` : ''}`);
}

// 1) Vitest suite — authoritative pass/fail
try {
  execFileSync('npm', ['run', 'test'], { stdio: 'pipe', cwd: ROOT });
  record('unit + route test suite', true, 'all vitest specs green');
} catch (e) {
  record('unit + route test suite', false, 'vitest exited non-zero; see npm run test');
}

// 2) Type check
try {
  execFileSync('npm', ['run', 'check-types'], { stdio: 'pipe', cwd: ROOT });
  record('type check (tsc)', true);
} catch (e) {
  record('type check (tsc)', false, 'tsc exited non-zero; run npm run check-types');
}

// 3) Migrations present (offline)
const migrations = [
  'supabase/migrations/0001_autogtm_init.sql',
  'supabase/migrations/0004_lead_outreach_drafts.sql',
  'supabase/migrations/0005_manual_send_events.sql',
  'supabase/migrations/0006_domain_mailbox_warmup.sql',
  'supabase/migrations/0007_workspaces.sql',
];
const missing = migrations.filter((m) => !existsSync(join(ROOT, m)));
record(
  'overnight migrations present',
  missing.length === 0,
  missing.length ? `missing: ${missing.join(', ')}` : '0001,0004-0007 all present'
);

// 4) Auth/dashboard boot (optional live check)
async function httpCheck(label, url) {
  try {
    const res = await fetch(url, { redirect: 'manual' });
    record(label, res.ok || res.status === 307 || res.status === 302, `HTTP ${res.status}`);
  } catch (e) {
    record(label, false, `no server (${e.message}) — start 'npm run dev' to live-check`);
  }
}

await httpCheck('login page', 'http://localhost:3200/login');
await httpCheck('app dashboard', 'http://localhost:3200/app');

// 5) Fail the run if any hard check failed
const hardFailed = checks.filter((c) => !c.ok && !c.detail.includes('no server'));
if (hardFailed.length) {
  console.error(`\n${hardFailed.length} hard check(s) failed.`);
  process.exit(1);
}
console.log('\nAll hard checks passed. (HTTP checks are best-effort against a live dev server.)');
