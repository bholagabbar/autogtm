import { describe, expect, it, vi } from 'vitest';

// Mock the Exa search layer so the test is infra-free: the search throws, which
// must drive the catch block in startQueryRun to flip status -> 'failed'.
vi.mock('@autogtm/core/clients/exa', () => ({
  searchPlainResults: vi.fn().mockRejectedValue(new Error('Exa down')),
}));

// startQueryRun notifies Inngest only on the success path, but mock it so the
// import graph stays isolated from the real Inngest client.
vi.mock('@/inngest/client', () => ({
  inngest: { send: vi.fn().mockResolvedValue(undefined) },
}));

import { startQueryRun } from './startQueryRun';

describe('startQueryRun', () => {
  it('marks the query failed when Exa search throws', async () => {
    const update = vi.fn().mockReturnThis();
    const eq = vi.fn().mockResolvedValue({});
    const single = vi
      .fn()
      .mockResolvedValueOnce({ data: { id: 'q1', company_id: 'c1', query: 'uniforms', criteria: [] }, error: null });

    const supabase = {
      from: vi.fn((table: string) => {
        if (table === 'exa_queries') {
          return {
            select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single }) }),
            update,
            eq,
          };
        }
        return {
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'run1' }, error: null }) }),
          }),
        };
      }),
    } as any;

    await expect(startQueryRun(supabase, 'q1')).rejects.toThrow();
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'failed' }));
  });
});
