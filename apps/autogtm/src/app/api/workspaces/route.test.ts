import { describe, expect, it, vi } from 'vitest';

vi.mock('@autogtm/core/db/autogtmDbCalls', () => ({
  createWorkspace: vi.fn().mockResolvedValue({
    id: 'ws-1',
    name: 'Anchored Uniforms Workspace',
    owner_user_id: 'user-1',
    created_at: new Date().toISOString(),
  }),
}));

import { POST } from './route';

describe('POST /api/workspaces', () => {
  it('creates a workspace and returns its id', async () => {
    const request = new Request('http://localhost:3200/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Anchored Uniforms Workspace', ownerUserId: 'user-1' }),
    });

    const response = await POST(request as any);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ name: 'Anchored Uniforms Workspace', id: expect.any(String) });
  });

  it('rejects a missing name with 400', async () => {
    const request = new Request('http://localhost:3200/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const response = await POST(request as any);
    expect(response.status).toBe(400);
  });
});
