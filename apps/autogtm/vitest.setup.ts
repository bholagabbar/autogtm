// Test setup for vitest (jsdom environment).
// No global mocks here; individual route tests mock their own DB/AI layers
// so the suite stays infra-free (no real Supabase / OpenAI / DNS calls).
export {};
