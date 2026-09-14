'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  User,
  LogOut,
  Menu,
  X,
  PlusCircle,
  ExternalLink,
  ShieldCheck,
  Headphones,
  ChevronRight,
  Sparkles,
  Globe,
  Coins,
} from 'lucide-react';
import { logoutCustomer } from '@/lib/customer/actions';
import { Button } from '@/components/ui/button';

interface CustomerNavProps {
  user: {
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    isGoogleAccount?: boolean;
  };
}

function GoogleIcon({ className = 'w-3 h-3' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 5c1.56 0 2.96.54 4.07 1.6l3.05-3.05C17.27 1.8 14.81 1 12 1 7.37 1 3.48 3.65 1.63 7.51l3.66 2.84C6.18 7.35 8.84 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.28 1.48-1.12 2.73-2.39 3.58l3.71 2.88c2.17-2 3.7-4.95 3.7-8.7z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.65c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.63 7.51C.59 9.58 0 11.95 0 14.43s.59 4.85 1.63 6.92l3.66-2.84z"
      />
      <path
        fill="#34A853"
        d="M12 23.86c3.24 0 5.96-1.08 7.95-2.92l-3.71-2.88c-1.08.72-2.45 1.16-4.24 1.16-3.16 0-5.82-2.35-6.71-5.35L1.63 16.7C3.48 20.57 7.37 23.86 12 23.86z"
      />
    </svg>
  );
}

export function CustomerNav({ user }: CustomerNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    {
      name: 'Início / Resumo',
      href: '/cliente',
      icon: LayoutDashboard,
      exact: true,
      badge: null,
    },
    {
      name: 'Minhas Consultas',
      href: '/cliente/consultas',
      icon: Search,
      exact: false,
      badge: null,
    },
    {
      name: 'Pacotes de Créditos',
      href: '/cliente/creditos',
      icon: Coins,
      exact: false,
      badge: 'B2B',
    },
    {
      name: 'Meu Perfil',
      href: '/cliente/perfil',
      icon: User,
      exact: false,
      badge: null,
    },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const userInitial = user.fullName ? user.fullName.charAt(0).toUpperCase() : 'C';

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#080B11]/90 backdrop-blur-xl border-b border-zinc-800/70 z-40 px-4 flex items-center justify-between">
        <Link href="/cliente" className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-[#c9a44c]/40 shadow-sm shadow-[#c9a44c]/10">
            <Image src="/logo.jpg" alt="AF Motos" fill className="object-cover" />
          </div>
          <div>
            <span className="text-sm font-black text-white tracking-tight block leading-tight">
              AF Motos
            </span>
            <span className="text-[10px] text-[#c9a44c] font-semibold tracking-wider uppercase">
              Área do Cliente
            </span>
          </div>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 transition-colors"
          aria-label="Abrir menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop & Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-[#080B11]/95 backdrop-blur-2xl p-6 pt-20 animate-in fade-in duration-200">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>

          {/* User Card */}
          <div className="flex items-center gap-3 p-3.5 bg-zinc-900/80 rounded-2xl border border-zinc-800/80 mb-6 shadow-lg shadow-black/40">
            <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-[#c9a44c] to-[#997628] flex items-center justify-center text-zinc-950 font-bold overflow-hidden shrink-0 shadow-md">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.fullName}
                  width={44}
                  height={44}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                userInitial
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-900" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {user.isGoogleAccount ? (
                  <>
                    <GoogleIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] text-zinc-300 font-medium">Conta Google</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[11px] text-emerald-400 font-medium">Conta Verificada</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5 flex-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 mb-2">
              Navegação
            </p>
            {navLinks.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[#c9a44c]/20 to-transparent text-[#c9a44c] border border-[#c9a44c]/40 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${active ? 'text-[#c9a44c]' : 'text-zinc-400'}`} />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/40">
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </Link>
              );
            })}

            <div className="pt-4">
              <Link
                href="/cliente/consultas/nova"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl text-sm font-bold text-zinc-950 bg-gradient-to-r from-[#c9a44c] to-[#b38e3a] hover:brightness-110 shadow-lg shadow-[#c9a44c]/20 transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nova Consulta Veicular</span>
              </Link>
            </div>
          </div>

          {/* Bottom Actions Cards */}
          <div className="pt-6 pb-6 border-t border-zinc-800/80 space-y-2.5">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800/90 hover:border-zinc-700 transition-all group shadow-sm active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-zinc-400 group-hover:text-[#c9a44c] transition-colors" />
                <span>Voltar ao site público</span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
            </Link>

            <form action={logoutCustomer}>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/[0.08] hover:bg-red-500/[0.15] border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all shadow-xs cursor-pointer active:scale-[0.99]"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da conta</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-[265px] flex-col fixed inset-y-0 left-0 bg-[#090C13] border-r border-zinc-800/70 z-30 select-none">
        {/* Subtle Ambient Background Gradient */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#c9a44c]/5 via-transparent to-transparent pointer-events-none" />

        {/* Brand Header */}
        <div className="p-6 border-b border-zinc-800/60 relative z-10">
          <Link href="/cliente" className="flex items-center gap-3.5 group">
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden border border-[#c9a44c]/40 shadow-lg shadow-[#c9a44c]/10 bg-zinc-900 group-hover:border-[#c9a44c] transition-colors">
              <Image src="/logo.jpg" alt="AF Motos" fill className="object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-white tracking-tight leading-tight">
                  AF Motos
                </span>
                <Sparkles className="w-3 h-3 text-[#c9a44c]" />
              </div>
              <span className="text-[10px] text-[#c9a44c] font-bold tracking-wider uppercase block mt-0.5">
                Área do Cliente
              </span>
            </div>
          </Link>
        </div>

        {/* User Card */}
        <div className="px-5 py-4 border-b border-zinc-800/50 bg-gradient-to-r from-zinc-900/60 to-zinc-950/60 relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a44c] via-[#b38e3a] to-[#80601e] flex items-center justify-center text-zinc-950 font-black text-sm overflow-hidden shrink-0 shadow-md shadow-[#c9a44c]/10">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.fullName}
                  width={40}
                  height={40}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                userInitial
              )}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#090C13]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {user.isGoogleAccount ? (
                  <>
                    <GoogleIcon className="w-3 h-3 shrink-0" />
                    <span className="text-[10px] text-zinc-300 font-medium">Conta Google</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-[10px] text-emerald-400 font-medium">Conta Verificada</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Sections */}
        <div className="flex-1 px-3.5 py-5 space-y-6 overflow-y-auto relative z-10 scrollbar-none">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 mb-2">
              Menu Principal
            </p>
            {navLinks.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[#c9a44c]/15 to-[#c9a44c]/5 text-white shadow-sm border border-[#c9a44c]/30'
                      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50'
                  }`}
                >
                  {active && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 bg-[#c9a44c] rounded-r-full" />
                  )}
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        active ? 'text-[#c9a44c]' : 'text-zinc-400'
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/40">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Quick Action Button */}
          <div className="pt-2">
            <Link
              href="/cliente/consultas/nova"
              className="flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold text-zinc-950 bg-gradient-to-r from-[#c9a44c] via-[#d4b35e] to-[#b38e3a] hover:brightness-105 shadow-md shadow-[#c9a44c]/15 group transition-all"
            >
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                <span>Nova Consulta</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Support Banner Card */}
          <div className="rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-900/50 to-zinc-950/80 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-zinc-300 text-xs font-bold">
              <Headphones className="w-3.5 h-3.5 text-[#c9a44c]" />
              <span>Suporte Dedicado</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Dúvidas sobre seu laudo ou pagamento? Fale com nossos consultores.
            </p>
            <a
              href="https://wa.me/5581999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#c9a44c] hover:underline pt-1"
            >
              <span>Chamar no WhatsApp</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-zinc-800/70 bg-[#07090F] space-y-2 relative z-10">
          <Link
            href="/"
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-300 bg-zinc-900/60 hover:bg-zinc-900 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-all group shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#c9a44c] transition-colors" />
              <span>Voltar ao site público</span>
            </div>
            <ExternalLink className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
          </Link>

          <form action={logoutCustomer}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/[0.08] hover:bg-red-500/[0.15] border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all cursor-pointer active:scale-[0.99]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Encerrar Sessão</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
