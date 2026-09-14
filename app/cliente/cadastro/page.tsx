import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { AuthForm } from '@/components/customer/auth-form';
import {
  ArrowLeft,
  UserPlus,
  ShieldCheck,
  Zap,
  Lock,
  Sparkles,
  FileCheck2,
  CheckCircle2,
  BadgeCheck,
  FileText,
} from 'lucide-react';

interface CadastroPageProps {
  searchParams: Promise<{
    returnUrl?: string;
  }>;
}

export const metadata = {
  title: 'Criar Conta | Portal do Cliente | AF Motos',
  description: 'Cadastre-se na AF Motos para consultar placas, emitir laudos oficiais e gerenciar seu histórico veicular.',
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
    <div className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between px-2 sm:px-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-all py-1.5 px-3 rounded-xl hover:bg-zinc-900/70 border border-transparent hover:border-zinc-800"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Voltar ao site da AF Motos</span>
        </Link>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Novo Cliente
          </span>
        </div>
      </div>

      {/* Main Glass Split Card */}
      <div className="relative rounded-3xl bg-zinc-950/80 border border-zinc-800/90 shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_50px_rgba(59,130,246,0.06)] backdrop-blur-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Subtle Top Accent Lighting Line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80 z-20" />

        {/* LEFT COLUMN: Customer Experience & Value Proposition (Visible on md+) */}
        <div className="hidden md:flex md:col-span-5 flex-col justify-between p-8 lg:p-9 bg-gradient-to-br from-[#0c1426] via-[#080d19] to-[#050912] border-r border-zinc-800/80 relative overflow-hidden">
          {/* Ambient Inner Glow */}
          <div className="pointer-events-none absolute -top-24 -left-24 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />

          {/* Top Brand Identity */}
          <div className="space-y-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-amber-500/40 shadow-md shadow-amber-500/10 bg-zinc-900 shrink-0">
                <Image
                  src="/logo.jpg"
                  alt="AF Motos"
                  fill
                  sizes="44px"
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <span className="text-sm font-black text-white tracking-tight font-heading block">
                  AF MOTOS
                </span>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                  Portal do Cliente
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl lg:text-2xl font-black text-white leading-tight font-heading">
                Cadastre-se grátis e tenha acesso a consultas veiculares completas.
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Em menos de 1 minuto você cria sua conta segura para consultar histórico de placas, checar restrições e emitir laudos certificados.
              </p>
            </div>

            {/* Benefit Highlights List */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Consulta Instantânea</h4>
                  <p className="text-[11px] text-zinc-400 leading-snug">Dados oficiais de Senatran, Detran e Renajud sem burocracia.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FileCheck2 className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Histórico Permanente</h4>
                  <p className="text-[11px] text-zinc-400 leading-snug">Seus laudos ficam salvos para download em PDF a qualquer momento.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Proteção Anti-Golpe</h4>
                  <p className="text-[11px] text-zinc-400 leading-snug">Evite prejuízos de milhares de reais antes de comprar ou vender.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="pt-6 border-t border-zinc-800/80 flex items-center gap-2 text-[11px] text-zinc-400 relative z-10">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Dados 100% protegidos com criptografia SSL 256-bit</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Authentication Form (md:col-span-7) */}
        <div className="md:col-span-7 p-6 sm:p-9 lg:p-10 flex flex-col justify-center relative">
          {/* Mobile Header Accent Pill */}
          <div className="md:hidden flex items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Portal do Cliente AF Motos</span>
            </span>
          </div>

          {/* Header */}
          <div className="text-center md:text-left mb-6 space-y-1.5">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-xs shrink-0">
                <UserPlus className="w-5 h-5 text-amber-400" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading">
                Criar Nova Conta
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md">
              Cadastre-se rapidamente para acessar laudos e proteger suas negociações.
            </p>
          </div>

          {/* Mobile Feature Perks Chips */}
          <div className="md:hidden grid grid-cols-2 gap-2 mb-5 p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-[11px] text-zinc-300">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Cadastro Gratuito</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>Acesso Imediato</span>
            </div>
          </div>

          {/* Auth Form Component */}
          <AuthForm mode="register" returnUrl={returnUrl} />
        </div>
      </div>
    </div>
  );
}

