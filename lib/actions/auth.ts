'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !authData.user) {
    return { error: error?.message || 'Falha na autenticação' };
  }

  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('id, role, is_active')
    .eq('auth_user_id', authData.user.id)
    .eq('is_active', true)
    .in('role', ['admin', 'super_admin'])
    .maybeSingle();

  if (!adminProfile) {
    await supabase.auth.signOut();
    return { error: 'Acesso negado: Esta conta não possui privilégios de administrador.' };
  }

  redirect('/admin');
}
