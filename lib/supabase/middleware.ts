import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (
    request.nextUrl.pathname.startsWith('/admin') &&
    !request.nextUrl.pathname.startsWith('/admin/login')
  ) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    // Valida se o usuário tem privilégios de admin ativo
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('id, role, is_active')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    if (!adminProfile) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
  }

  if (
    request.nextUrl.pathname.startsWith('/cliente') &&
    !request.nextUrl.pathname.startsWith('/cliente/login') &&
    !request.nextUrl.pathname.startsWith('/cliente/cadastro')
  ) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/cliente/login';
      url.searchParams.set('returnUrl', request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
