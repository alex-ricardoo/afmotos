import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { AuthForm } from '@/components/customer/auth-form';
import { ArrowLeft, UserPlus } from 'lucide-react';

interface CadastroPageProps {
  searchParams: Promise<{
    returnUrl?: string;
  }>;
}

export const metadata = {
  title: 'Criar Conta | Área do Cliente | AF Motos',
  description: 'Cadastre-se na AF Motos para consultar placas, acompanhar laudos e gerenciar seu perfil.',
};

export default async function CustomerCadastroPage({ searchParams }: CadastroPageProps) {
  const resolvedParams = await searchParams;
  const returnUrl = resolvedParams.returnUrl || '/cliente';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(returnUrl);
  }

  return (
    <div className="w-full max-w-[480px] mx-auto space-y-6">
      {/* Top action: Link to public site */}
      <div className="flex items-center justify-between px-1">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors py-1.5 px-3 rounded-lg hover:bg-zinc-900/60 border border-transparent hover:border-zinc-800/60"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao site</span>
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-[#c9a44c] font-semibold">
          <UserPlus className="w-4 h-4" />
          <span>Novo Cadastro</span>
        </div>
      </div>

      {/* Main Glass Card */}
      <div className="relative rounded-3xl bg-zinc-950/70 border border-zinc-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_40px_rgba(201,164,76,0.06)] backdrop-blur-2xl p-7 sm:p-9 overflow-hidden">
        {/* Top Gold Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent opacity-80" />

        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-14 h-14 rounded-2xl overflow-hidden mb-3 border border-[#c9a44c]/30 shadow-lg shadow-[#c9a44c]/10 bg-zinc-900">
            <Image
              src="/logo.jpg"
              alt="AF Motos"
              fill
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Crie sua conta</h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-[320px]">
            Tenha acesso instantâneo a consultas veiculares completas e histórico seguro
          </p>
        </div>

        {/* Auth Form */}
        <AuthForm mode="register" returnUrl={returnUrl} />
      </div>
    </div>
  );
}
