import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/cliente';

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Ensure customer profile exists (T024)
      const { data: profile } = await supabase
        .from('customer_profiles')
        .select('id')
        .eq('id', data.user.id)
        .maybeSingle();

      if (!profile) {
        const metadata = data.user.user_metadata || {};
        const fullName =
          metadata.full_name ||
          metadata.name ||
          data.user.email?.split('@')[0] ||
          'Cliente';

        await supabase.from('customer_profiles').insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          avatar_url: metadata.avatar_url || metadata.picture || null,
        });
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/cliente/login?error=auth_failed`);
}
