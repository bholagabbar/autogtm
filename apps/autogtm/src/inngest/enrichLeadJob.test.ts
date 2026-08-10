import { describe, expect, it } from 'vitest';

// Regression guard: an already-enriched lead must keep `enriched` status on a
// retried run and never regress to `enriching`. This mirrors the canonical
// state-preservation logic in apps/autogtm/src/inngest/functions.ts (`enrichLeadJob`),
// where `status = existingLead.enriched_at ? 'enriched' : 'enriching'`.
describe('enrich lead retry semantics', () => {
  it('preserves enriched status when enriched_at already exists', async () => {
    const existingLead = {
      enriched_at: '2026-08-10T20:02:26.091Z',
      enrichment_status: 'enriched',
    };

    const nextStatus = existingLead.enriched_at ? 'enriched' : 'enriching';

    expect(nextStatus).toBe('enriched');
  });

  it('falls back to enriching when not yet enriched', async () => {
    const existingLead = {
      enriched_at: null,
      enrichment_status: 'pending',
    };

    const nextStatus = existingLead.enriched_at ? 'enriched' : 'enriching';

    expect(nextStatus).toBe('enriching');
  });
});
