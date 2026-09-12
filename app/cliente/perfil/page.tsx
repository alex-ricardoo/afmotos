import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCustomerProfile } from '@/lib/customer/queries';
import { ProfileForm } from '@/components/customer/profile-form';

export const metadata = {
  title: 'Meu Perfil | Área do Cliente | AF Motos',
  description: 'Gerencie seus dados pessoais e de contato na AF Motos.',
};

export default async function CustomerProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/cliente/login?returnUrl=/cliente/perfil');
  }

  const profile = await getCustomerProfile();

  if (!profile) {
    return (
      <div className="py-12 text-center text-zinc-400">
        Não foi possível carregar as informações do seu perfil.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Meu Perfil</h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Atualize seus dados cadastrais, telefone e endereço
        </p>
      </div>

      <ProfileForm profile={profile} />
    </div>
  );
}
