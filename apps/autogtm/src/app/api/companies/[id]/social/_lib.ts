import { createClient } from '@supabase/supabase-js';

export function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function getCompanyIdFromParams(params: Promise<{ id: string }>): Promise<string> {
  const { id } = await params;
  return id;
}

export function badRequest(message: string, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
