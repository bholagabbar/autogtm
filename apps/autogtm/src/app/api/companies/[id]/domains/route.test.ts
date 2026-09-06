import { describe, expect, it, vi } from 'vitest';

vi.mock('@autogtm/core/db/autogtmDbCalls', () => ({
  createCompanyDomain: vi.fn().mockResolvedValue({
    id: 'domain-1',
    company_id: 'company-1',
    domain: 'anchoreduniforms.co.za',
    verification_status: 'verification_pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  getCompanyDomains: vi.fn().mockResolvedValue([]),
}));

import { POST, GET } from './route';

describe('POST /api/companies/[id]/domains', () => {
  it('creates a domain record in verification_pending state', async () => {
    const request = new Request('http://localhost:3200/api/companies/company-1/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain: 'anchoreduniforms.co.za' }),
    });

    const response = await POST(request as any, { params: Promise.resolve({ id: 'company-1' }) });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ domain: 'anchoreduniforms.co.za', verification_status: 'verification_pending' });
  });

  it('rejects a missing domain with 400', async () => {
    const request = new Request('http://localhost:3200/api/companies/company-1/domains', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request as any, { params: Promise.resolve({ id: 'company-1' }) });
    expect(response.status).toBe(400);
  });
});

describe('GET /api/companies/[id]/domains', () => {
  it('returns the domain list', async () => {
    const response = await GET(
      new Request('http://localhost:3200/api/companies/company-1/domains') as any,
      { params: Promise.resolve({ id: 'company-1' }) }
    );
    const body = await response.json();
    expect(body).toMatchObject({ domains: [] });
  });
});
