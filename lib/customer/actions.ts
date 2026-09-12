'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import {
  registerCustomerSchema,
  loginCustomerSchema,
  profileUpdateSchema,
  type RegisterCustomerInput,
  type LoginCustomerInput,
  type ProfileUpdateInput,
} from './schemas';
import type { ActionResult } from './types';

import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Register a new customer via email/password and create customer_profiles row.
 */
export async function registerCustomer(data: RegisterCustomerInput): Promise<ActionResult> {
  const parseResult = registerCustomerSchema.safeParse(data);
  if (!parseResult.success) {
    return { error: parseResult.error.issues[0]?.message || 'Dados inválidos' };
  }

  const { full_name, email, phone, date_of_birth, password } = parseResult.data;
  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name,
      },
    },
  });

  if (authError) {
    if (authError.message?.toLowerCase().includes('already registered')) {
      return { error: 'Este e-mail já está cadastrado. Tente fazer login.' };
    }
    return { error: authError.message || 'Erro ao realizar cadastro.' };
  }

  if (!authData.user) {
    return { error: 'Não foi possível criar a conta. Tente novamente.' };
  }

  // Insert customer profile using admin client to ensure RLS bypass during registration
  const phoneNormalized = phone.replace(/\D/g, '');
  const adminClient = createAdminClient();

  // Auto-confirm user email so they can immediately sign in without getting blocked
  try {
    await adminClient.auth.admin.updateUserById(authData.user.id, {
      email_confirm: true,
    });
  } catch (confirmErr) {
    console.warn('[registerCustomer] auto-confirm warning:', confirmErr);
  }

  const { error: profileError } = await adminClient.from('customer_profiles').upsert({
    id: authData.user.id,
    email,
    full_name,
    phone,
    phone_normalized: phoneNormalized,
    date_of_birth,
  }, { onConflict: 'id' });

  if (profileError) {
    console.error('[registerCustomer] profileError:', profileError);
    return { error: 'Erro ao salvar dados do perfil. Tente novamente.' };
  }

  return { success: true };
}

/**
 * Log in an existing customer using email/password.
 */
export async function loginCustomer(data: LoginCustomerInput): Promise<ActionResult> {
  const parseResult = loginCustomerSchema.safeParse(data);
  if (!parseResult.success) {
    return { error: parseResult.error.issues[0]?.message || 'Dados inválidos' };
  }

  const { email, password } = parseResult.data;
  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message?.toLowerCase().includes('invalid login credentials')) {
      return { error: 'E-mail ou senha incorretos.' };
    }
    if (error.message?.toLowerCase().includes('email not confirmed')) {
      // Auto-confirm via admin client and retry sign in
      try {
        const adminClient = createAdminClient();
        const { data: userData } = await adminClient.auth.admin.listUsers();
        const found = userData?.users.find(
          (u) => u.email?.toLowerCase() === email.toLowerCase().trim()
        );
        if (found) {
          await adminClient.auth.admin.updateUserById(found.id, { email_confirm: true });
          const retry = await supabase.auth.signInWithPassword({ email, password });
          if (!retry.error && retry.data.user) {
            return { success: true };
          }
        }
      } catch (confirmErr) {
        console.warn('[loginCustomer] auto-confirm on login error:', confirmErr);
      }
      return { error: 'Por favor, confirme seu e-mail para continuar ou tente novamente.' };
    }
    return { error: error.message || 'Erro ao fazer login.' };
  }

  // Ensure customer profile row exists
  if (authData?.user) {
    try {
      const adminClient = createAdminClient();
      await adminClient.from('customer_profiles').upsert(
        {
          id: authData.user.id,
          email: authData.user.email || email,
          full_name:
            authData.user.user_metadata?.full_name ||
            authData.user.user_metadata?.name ||
            email.split('@')[0],
        },
        { onConflict: 'id', ignoreDuplicates: true }
      );
    } catch (upsertErr) {
      console.warn('[loginCustomer] profile upsert warning:', upsertErr);
    }
  }

  return { success: true };
}

/**
 * Returns the OAuth URL for Google Sign-In.
 */
export async function loginWithGoogle(returnUrl = '/cliente'): Promise<ActionResult<{ url: string }>> {
  const headerList = await headers();
  const host = headerList.get('host') || 'localhost:3000';
  const proto = headerList.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const origin = `${proto}://${host}`;

  const supabase = await createClient();
  const redirectTo = `${origin}/api/auth/callback?next=${encodeURIComponent(returnUrl)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error || !data.url) {
    return { error: error?.message || 'Falha ao iniciar autenticação com Google.' };
  }

  return { success: true, data: { url: data.url } };
}

/**
 * Log out customer session and redirect to home page.
 */
export async function logoutCustomer(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

/**
 * Update authenticated customer profile.
 */
export async function updateCustomerProfile(data: ProfileUpdateInput): Promise<ActionResult> {
  const parseResult = profileUpdateSchema.safeParse(data);
  if (!parseResult.success) {
    return { error: parseResult.error.issues[0]?.message || 'Dados inválidos' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Usuário não autenticado.' };
  }

  const validated = parseResult.data;
  const updatePayload: Record<string, unknown> = {
    full_name: validated.full_name,
    phone: validated.phone || null,
    phone_normalized: validated.phone ? validated.phone.replace(/\D/g, '') : null,
    date_of_birth: validated.date_of_birth || null,
    avatar_url: validated.avatar_url || null,
    address_street: validated.address_street || null,
    address_number: validated.address_number || null,
    address_complement: validated.address_complement || null,
    address_neighborhood: validated.address_neighborhood || null,
    address_city: validated.address_city || null,
    address_state: validated.address_state ? validated.address_state.toUpperCase() : null,
    address_zip: validated.address_zip ? validated.address_zip.replace(/\D/g, '') : null,
  };

  const { error } = await supabase
    .from('customer_profiles')
    .update(updatePayload)
    .eq('id', user.id);

  if (error) {
    return { error: error.message || 'Erro ao atualizar perfil.' };
  }

  revalidatePath('/cliente');
  revalidatePath('/cliente/perfil');
  return { success: true };
}

/**
 * Upload customer avatar image using centralized storage/ImgBB fallback.
 */
export async function uploadCustomerAvatarAction(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Usuário não autenticado.' };
  }

  const file = formData.get('file') as File | null;
  if (!file || !(file instanceof File) || file.size === 0) {
    return { error: 'Nenhum arquivo válido foi selecionado.' };
  }

  try {
    const { uploadImage } = await import('@/lib/uploads');
    const result = await uploadImage({
      file,
      context: 'profile',
      entityId: user.id,
    });

    return { success: true, data: { url: result.publicUrl } };
  } catch (err) {
    console.error('[uploadCustomerAvatarAction] error:', err);
    return {
      error: err instanceof Error ? err.message : 'Falha no envio da imagem de perfil.',
    };
  }
}

