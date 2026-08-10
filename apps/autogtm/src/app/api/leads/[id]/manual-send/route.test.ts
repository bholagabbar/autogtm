import { describe, expect, it, vi } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'draft-1', lead_id: 'lead-1', status: 'draft' }, error: null }),
              single: vi.fn().mockResolvedValue({ data: { id: 'draft-1', lead_id: 'lead-1', status: 'draft' }, error: null }),
            })),
          })),
        })),
      })),
    })),
  })),
}));

vi.mock('@autogtm/core/db/autogtmDbCalls', () => ({
  getLeadDraft: vi.fn().mockResolvedValue(null),
  createManualSendEvent: vi.fn().mockResolvedValue({
    id: 'evt-1',
    lead_id: 'lead-1',
    draft_id: 'draft-1',
    mailbox_label: 'Zoho outreach',
    notes: 'Sent after edit',
    sent_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }),
  markLeadDraftSent: vi.fn().mockResolvedValue({ id: 'draft-1', status: 'sent_manual' }),
}));

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
