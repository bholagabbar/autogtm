import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    
    // IMPORTANT: Force read cookies before creating Supabase client
    // Next.js cookies() is lazy - this forces it to actually read them
    const allCookies = cookieStore.getAll();
    console.log('Available cookies:', allCookies.map(c => c.name));
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {
              // Ignore errors from Server Components
            }
          },
        },
      }
    );

    // Force read cookies again before exchange (per Next.js 14 workaround)
    cookieStore.getAll();
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    // Read cookies again after exchange
    cookieStore.getAll();
    
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
    
    console.error('Auth callback error:', error);
  }

  // Return to login with error
  return NextResponse.redirect(new URL('/login?error=auth', origin));
}
