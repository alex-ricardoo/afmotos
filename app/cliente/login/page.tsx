import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { AuthForm } from '@/components/customer/auth-form';
import {
  ArrowLeft,
  ShieldCheck,
  FileCheck2,
  Lock,
  Sparkles,
  Zap,
  CheckCircle2,
  FileText,
  BadgeCheck,
} from 'lucide-react';

interface LoginPageProps {
  searchParams: Promise<{
    returnUrl?: string;
    error?: string;
  }>;
}

export const metadata = {
  title: 'Entrar | Portal do Cliente | AF Veículos PE',
  description: 'Acesse sua conta para consultar histórico veicular, acompanhar pedidos e baixar laudos oficiais em PDF.',
};

export default async function CustomerLoginPage({ searchParams }: LoginPageProps) {
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
          <span>Voltar ao site da AF Veículos PE</span>
        </Link>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Portal do Cliente
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
                  src="/logo.png"
                  alt="AF Veículos PE"
                  fill
                  sizes="44px"
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <span className="text-sm font-black text-white tracking-tight font-heading block">
                  AF Veículos PE
                </span>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                  Área do Cliente
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl lg:text-2xl font-black text-white leading-tight font-heading">
                Seus laudos oficiais e histórico veicular com total segurança.
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Consulte qualquer placa, acompanhe dados de leilão, gravame e débitos, e baixe o laudo oficial em PDF autenticado.
              </p>
            </div>

            {/* Stylized Miniature Mercosul Plate Preview Card */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/70 border border-zinc-800/90 shadow-xl space-y-2.5 backdrop-blur-sm">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                <div className="flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-bold text-zinc-200">Exemplo de Laudo Ativo</span>
                </div>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Liberado
                </span>
              </div>

              {/* Realistic Mini Plate Graphic */}
              <div className="w-full py-1.5 px-3 rounded-lg bg-white text-slate-950 border-2 border-slate-900 shadow-inner flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-1.5 bg-blue-700 rounded-xs" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-900">BRASIL</span>
                </div>
                <span className="font-mono font-black text-sm tracking-widest text-slate-950">
                  BRA-2E12
                </span>
                <span className="text-[9px] font-bold text-slate-500">BR</span>
              </div>

              {/* Mini Status Chips */}
              <div className="grid grid-cols-2 gap-1.5 text-[10px] font-medium text-zinc-300">
                <div className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>Sem Leilão / Sinistro</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span>Veículo Quitado</span>
                </div>
              </div>
            </div>

            {/* Benefit Highlights List */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Liberação Imediata</h4>
                  <p className="text-[11px] text-zinc-400 leading-snug">Pague via PIX e acesse os dados em tempo real no seu painel.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Download Oficial em PDF</h4>
                  <p className="text-[11px] text-zinc-400 leading-snug">Laudo timbrado com autenticidade para imprimir ou enviar.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="pt-6 border-t border-zinc-800/80 flex items-center gap-2 text-[11px] text-zinc-400 relative z-10">
            <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Ambiente seguro com criptografia 256-bit (LGPD)</span>
          </div>
        </div>

        {/* RIGHT COLUMN: Authentication Form (md:col-span-7) */}
        <div className="md:col-span-7 p-6 sm:p-9 lg:p-10 flex flex-col justify-center relative">
          {/* Mobile Header Accent Pill */}
          <div className="md:hidden flex items-center justify-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Portal do Cliente AF Veículos PE</span>
            </span>
          </div>

          {/* Header */}
          <div className="text-center md:text-left mb-6 space-y-1.5">
            <div className="flex items-center justify-center md:justify-start gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-xs shrink-0">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight font-heading">
                Acesse sua Conta
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-md">
              Entre para consultar histórico veicular, verificar pendências e emitir seus laudos oficiais.
            </p>
          </div>

          {/* Mobile Feature Perks Chips (visible only on mobile) */}
          <div className="md:hidden grid grid-cols-2 gap-2 mb-5 p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-[11px] text-zinc-300">
            <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Laudos Oficiais</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-400 font-medium">
              <Zap className="w-3.5 h-3.5 shrink-0" />
              <span>Acesso Imediato</span>
            </div>
          </div>

          {/* Auth Form Component */}
          <AuthForm mode="login" returnUrl={returnUrl} />
        </div>
      </div>
    </div>
  );
}

