import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { CustomerNav } from '@/components/customer/customer-nav';
import { getCustomerProfile } from '@/lib/customer/queries';

export const metadata = {
  title: 'Área do Cliente | AF Motos',
  description: 'Painel do cliente para consulta veicular, histórico e perfil.',
};

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If unauthenticated (e.g. login or cadastro), render children cleanly without customer sidebar
  if (!user) {
    return <div className="min-h-screen bg-[#070709] text-zinc-100">{children}</div>;
  }

  const profile = await getCustomerProfile();
  const metadata = user.user_metadata || {};
  const fullName =
    profile?.full_name ||
    metadata.full_name ||
    metadata.name ||
    user.email?.split('@')[0] ||
    'Cliente';
  const email = user.email || '';
  const avatarUrl = profile?.avatar_url || metadata.avatar_url || metadata.picture || null;

  const isGoogleAccount = Boolean(
    user.app_metadata?.provider === 'google' ||
    (Array.isArray(user.app_metadata?.providers) && user.app_metadata.providers.includes('google')) ||
    user.identities?.some((id) => id.provider === 'google') ||
    metadata.iss?.includes('google.com') ||
    (typeof metadata.picture === 'string' && metadata.picture.includes('googleusercontent.com'))
  );

  return (
    <div className="min-h-screen bg-[#070709] text-zinc-100 flex flex-col lg:flex-row selection:bg-[#c9a44c]/30 selection:text-white">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed -top-40 -left-40 w-96 h-96 bg-[#c9a44c]/5 rounded-full blur-3xl z-0" />
      <div className="pointer-events-none fixed -bottom-40 -right-40 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl z-0" />

      <CustomerNav
        user={{
          fullName,
          email,
          avatarUrl,
          isGoogleAccount,
        }}
      />

      <main className="flex-1 lg:pl-64 pt-16 lg:pt-0 min-h-screen relative z-10">
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
