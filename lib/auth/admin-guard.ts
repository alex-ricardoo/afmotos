import { createClient } from '../supabase/server';
import { redirect } from 'next/navigation';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AdminProfile {
  id: string;
  auth_user_id: string;
  name: string;
  email: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
}

/**
 * Checks if a given Supabase auth user ID has an active admin profile.
 */
export async function validateAdminUser(supabase: SupabaseClient, authUserId: string): Promise<AdminProfile | null> {
  if (!authUserId) return null;

  const { data: adminProfile, error } = await supabase
    .from('admin_profiles')
    .select('id, auth_user_id, name, email, role, is_active')
    .eq('auth_user_id', authUserId)
    .eq('is_active', true)
    .in('role', ['admin', 'super_admin'])
    .maybeSingle();

  if (error || !adminProfile) {
    return null;
  }

  return adminProfile as AdminProfile;
}

/**
 * Validates the current server session and ensures the user is an active administrator.
 * Throws an error or returns null if not authenticated or not an admin.
 */
export async function getAuthenticatedAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { supabase, user: null, profile: null };
  }

  const profile = await validateAdminUser(supabase, user.id);
  if (!profile) {
    return { supabase, user, profile: null };
  }

  return { supabase, user, profile };
}

/**
 * Enforces admin access for Server Components and Server Actions.
 * Redirects to `/admin/login?error=unauthorized` if not authenticated or not an admin.
 */
export async function requireAdminUser() {
  const { supabase, user, profile } = await getAuthenticatedAdmin();

  if (!user) {
    redirect('/admin/login');
  }

  if (!profile) {
    redirect('/admin/login?error=unauthorized');
  }

  return { supabase, user, profile };
}
