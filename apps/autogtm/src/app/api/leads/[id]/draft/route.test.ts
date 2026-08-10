import { describe, expect, it, vi } from 'vitest';

// Infra-free: mock the Supabase client, the AI sequence generator, and the DB
// layer so the route can be exercised without network/keys.
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
            .mockResolvedValueOnce({ data: { id: 'lead-1', full_name: 'Jane', name: 'Jane Doe', bio: 'coach', category: 'coach', company_id: 'c1' }, error: null })
            .mockResolvedValueOnce({ data: { name: 'Acme', description: 'Uniforms', target_audience: 'schools' }, error: null }),
        })),
      })),
    })),
  })),
}));

vi.mock('@autogtm/core/ai/generateEmailCopy', () => ({
  generateEmailSequence: vi.fn().mockResolvedValue({
    initial: { subject: 'Quick idea for your actors', body: 'Hey Jane, came across your work...' },
  }),
}));

vi.mock('@autogtm/core/db/autogtmDbCalls', () => ({
  getDraftsForLead: vi.fn().mockResolvedValue([]),
  createLeadDraft: vi.fn().mockResolvedValue({
    id: 'draft-1',
    lead_id: 'lead-1',
    subject: 'Quick idea for your actors',
    body: 'Hey Jane, came across your work...',
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
}));

import { POST } from './route';

describe('POST /api/leads/[id]/draft', () => {
  it('creates a draft for an enriched lead', async () => {
    const request = new Request('http://localhost:3200/api/leads/lead-1/draft', {
      method: 'POST',
    });

    const response = await POST(request as any, { params: Promise.resolve({ id: 'lead-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      subject: expect.any(String),
      body: expect.any(String),
      status: 'draft',
    });
  });
});
