import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCustomerProfile } from '@/lib/customer/queries';
import { ProfileForm } from '@/components/customer/profile-form';
import { CustomerPrivacySection } from '@/components/customer/customer-privacy-section';
import {
  getUserComplianceStatus,
  getPublishedDocument,
  getCustomerPrivacyRequests,
} from '@/lib/legal/queries';

export const metadata = {
  title: 'Meu Perfil | Área do Cliente | AF Veículos PE',
  description: 'Gerencie seus dados pessoais, endereço e privacidade na AF Veículos PE.',
};

export default async function CustomerProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/cliente/login?returnUrl=/cliente/perfil');
  }

  const [profile, compliance, termsDoc, privacyDoc, requests] = await Promise.all([
    getCustomerProfile(),
    getUserComplianceStatus(user.id),
    getPublishedDocument('terms_of_use'),
    getPublishedDocument('privacy_policy'),
    getCustomerPrivacyRequests(user.id),
  ]);

  if (!profile) {
    return (
      <div className="py-12 text-center text-zinc-400">
        Não foi possível carregar as informações do seu perfil.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Meu Perfil</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Atualize seus dados cadastrais, telefone, endereço e consulte sua governança de privacidade
        </p>
      </div>

      <ProfileForm profile={profile} />

      <CustomerPrivacySection
        compliance={compliance}
        termsDoc={termsDoc}
        privacyDoc={privacyDoc}
        requests={requests}
        userEmail={user.email || profile.email}
      />
    </div>
  );
}
