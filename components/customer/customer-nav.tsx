'use client';

import React, { useState, useEffect } from 'react';
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
  Headphones,
  ChevronRight,
  Sparkles,
  Coins,
  ShieldAlert,
  ArrowUpRight,
  MoreHorizontal,
} from 'lucide-react';
import { logoutCustomer } from '@/lib/customer/actions';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';
import { CONSTANTS } from '@/lib/utils/constants';

interface CustomerNavProps {
  user: {
    fullName: string;
    email: string;
    avatarUrl?: string | null;
    isGoogleAccount?: boolean;
  };
  creditBalance?: number;
  isAdmin?: boolean;
  whatsappPhone?: string | null;
  siteName?: string | null;
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

export function CustomerNav({
  user,
  creditBalance = 0,
  isAdmin = false,
  whatsappPhone,
  siteName,
}: CustomerNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dynamic WhatsApp support URL from database settings with fallback
  const supportPhone = whatsappPhone || CONSTANTS.CONTACT_PHONE;
  const storeName = siteName || CONSTANTS.STORE_NAME;
  const supportMessage = `Olá! Sou ${user.fullName || 'Cliente'} e gostaria de suporte na Área do Cliente da ${storeName}.`;
  const supportHref = generateWhatsAppLink(supportPhone, supportMessage);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    {
      name: 'Início / Resumo',
      href: '/cliente',
      icon: LayoutDashboard,
      exact: true,
      badge: null,
      badgeHighlight: false,
      isExternal: false,
    },
    {
      name: 'Minhas Consultas',
      href: '/cliente/consultas',
      icon: Search,
      exact: false,
      badge: null,
      badgeHighlight: false,
      isExternal: false,
    },
    {
      name: 'Pacotes de Créditos',
      href: '/cliente/creditos',
      icon: Coins,
      exact: false,
      badge: creditBalance > 0 ? `${creditBalance} disp.` : 'Comprar',
      badgeHighlight: creditBalance > 0,
      isExternal: false,
    },
    {
      name: 'Meu Perfil',
      href: '/cliente/perfil',
      icon: User,
      exact: false,
      badge: null,
      badgeHighlight: false,
      isExternal: false,
    },
    ...(isAdmin
      ? [
          {
            name: 'Painel Administrativo',
            href: '/admin',
            icon: ShieldAlert,
            exact: false,
            badge: 'Admin',
            badgeHighlight: 'admin',
            isExternal: false,
          },
        ]
      : []),
    {
      name: 'Suporte',
      href: supportHref,
      icon: Headphones,
      exact: false,
      badge: 'Online',
      badgeHighlight: 'online',
      isExternal: true,
    },
  ];

  const isActive = (href: string, exact: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  const userInitial = user.fullName ? user.fullName.charAt(0).toUpperCase() : 'C';

  return (
    <>
      {/* ========================================================================= */}
      {/* 1. MOBILE TOP APP BAR (Compact, polished, high z-index)                     */}
      {/* ========================================================================= */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#090C14]/90 backdrop-blur-xl border-b border-zinc-800/80 z-40 px-4 flex items-center justify-between">
        <Link href="/cliente" className="flex items-center gap-2.5 group">
          <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-[#c9a44c]/40 shadow-sm shadow-[#c9a44c]/15 bg-zinc-900 group-hover:border-[#c9a44c] transition-colors">
            <Image src="/logo.png" alt="AF Veículos PE" fill sizes="32px" className="object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black text-white tracking-tight leading-none">
                AF Veículos PE
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a44c]" />
            </div>
            <span className="text-[10px] text-[#c9a44c] font-bold tracking-wider uppercase block mt-0.5">
              Área do Cliente
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {/* Mobile Admin Pill */}
          {isAdmin && (
            <Link
              href="/admin"
              title="Acessar Painel Administrativo"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 text-xs font-bold transition-all active:scale-95 shadow-xs"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] font-mono tracking-wide">ADMIN</span>
            </Link>
          )}

          {/* Mobile Credits Quick Pill */}
          <Link
            href="/cliente/creditos"
            title="Seus Créditos Disponíveis"
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 ${
              creditBalance > 0
                ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 border-amber-500/40 text-amber-300 shadow-sm shadow-[#c9a44c]/10'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Coins className={`w-3.5 h-3.5 ${creditBalance > 0 ? 'text-[#c9a44c]' : 'text-zinc-400'}`} />
            <span className="font-mono">{creditBalance}</span>
          </Link>

          {/* Drawer Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900/80 border border-zinc-800 transition-colors cursor-pointer"
            aria-label="Abrir menu de navegação"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE BOTTOM NAVIGATION (Ergonomic Thumb-Zone)                        */}
      {/* ========================================================================= */}
      <nav
        aria-label="Navegação rápida mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#080B12]/95 backdrop-blur-2xl border-t border-zinc-800/80 z-40 px-2 flex items-center justify-around"
      >
        {/* Item 1: Início */}
        {(() => {
          const active = isActive('/cliente', true);
          return (
            <Link
              href="/cliente"
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                active ? 'text-[#c9a44c]' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <LayoutDashboard className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`text-[10px] mt-1 ${active ? 'font-bold' : 'font-medium'}`}>Início</span>
            </Link>
          );
        })()}

        {/* Item 2: Consultas */}
        {(() => {
          const active = isActive('/cliente/consultas', false);
          return (
            <Link
              href="/cliente/consultas"
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                active ? 'text-[#c9a44c]' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Search className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`text-[10px] mt-1 ${active ? 'font-bold' : 'font-medium'}`}>Consultas</span>
            </Link>
          );
        })()}

        {/* Item 3: Nova Consulta (Center Elevated Action CTA) */}
        <Link
          href="/cliente/consultas/nova"
          className="relative -top-3 flex flex-col items-center justify-center group active:scale-95 transition-transform"
          aria-label="Nova Consulta"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#c9a44c] via-[#d4b35e] to-[#a8822d] p-0.5 shadow-lg shadow-[#c9a44c]/30 group-hover:shadow-[#c9a44c]/50 transition-all flex items-center justify-center">
            <div className="w-full h-full rounded-[14px] bg-[#0c0f17] flex items-center justify-center group-hover:bg-[#0c0f17]/80 transition-colors">
              <PlusCircle className="w-6 h-6 text-[#c9a44c]" />
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#c9a44c] mt-0.5">Novo</span>
        </Link>

        {/* Item 4: Créditos */}
        {(() => {
          const active = isActive('/cliente/creditos', false);
          return (
            <Link
              href="/cliente/creditos"
              className={`flex flex-col items-center justify-center flex-1 py-1 relative transition-all ${
                active ? 'text-[#c9a44c]' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Coins className={`w-5 h-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className={`text-[10px] mt-1 ${active ? 'font-bold' : 'font-medium'}`}>Créditos</span>
              {creditBalance > 0 && (
                <span className="absolute top-0.5 right-4 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#080B12]" />
              )}
            </Link>
          );
        })()}

        {/* Item 5: Mais / Menu */}
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
            mobileMenuOpen ? 'text-[#c9a44c]' : 'text-zinc-400 hover:text-zinc-200'
          }`}
          aria-label="Abrir menu completo"
        >
          <MoreHorizontal className="w-5 h-5 stroke-2" />
          <span className="text-[10px] font-medium mt-1">Mais</span>
        </button>
      </nav>

      {/* ========================================================================= */}
      {/* 3. MOBILE FULL SLIDE-OVER DRAWER (Complete Access)                         */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-[#07090F]/95 backdrop-blur-2xl animate-in fade-in duration-200">
          {/* Top Bar inside Drawer */}
          <div className="h-16 px-4 flex items-center justify-between border-b border-zinc-800/80">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-[#c9a44c]/40 bg-zinc-900">
                <Image src="/logo.png" alt="AF Veículos PE" fill sizes="32px" className="object-cover" />
              </div>
              <span className="text-sm font-black text-white">Menu do Cliente</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800 cursor-pointer"
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            {/* User Profile Card */}
            <div className="p-3.5 bg-zinc-900/80 rounded-2xl border border-zinc-800/80 shadow-lg shadow-black/40">
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[#c9a44c] to-[#997628] flex items-center justify-center text-zinc-950 font-bold overflow-hidden shrink-0 shadow-md">
                  {user.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt={user.fullName}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                      unoptimized
                    />
                  ) : (
                    <span className="text-lg">{userInitial}</span>
                  )}
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-zinc-900" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{user.fullName}</p>
                  <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {isAdmin && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Admin
                      </span>
                    )}
                    {user.isGoogleAccount && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-zinc-800/80 text-[10px] text-zinc-300 font-medium">
                        <GoogleIcon className="w-3 h-3" />
                        Google
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Credit Balance Card */}
            <div className="p-3.5 bg-gradient-to-br from-zinc-900/90 to-zinc-950 rounded-2xl border border-zinc-800/90 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                      creditBalance > 0
                        ? 'bg-[#c9a44c]/20 border-[#c9a44c]/40 text-[#e3c56c]'
                        : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-400'
                    }`}
                  >
                    <Coins className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block leading-tight">
                      Saldo de Créditos
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span
                        className={`text-lg font-black font-mono leading-none ${
                          creditBalance > 0 ? 'text-amber-300' : 'text-zinc-300'
                        }`}
                      >
                        {creditBalance}
                      </span>
                      <span className="text-xs text-zinc-400 font-medium">
                        {creditBalance === 1 ? 'disponível' : 'disponíveis'}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href="/cliente/creditos"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xs font-bold text-[#c9a44c] hover:text-[#e3c56c] bg-[#c9a44c]/10 hover:bg-[#c9a44c]/20 border border-[#c9a44c]/30 px-3 py-1.5 rounded-xl transition-all"
                >
                  {creditBalance > 0 ? '+ Adicionar' : 'Comprar'}
                </Link>
              </div>
            </div>

            {/* Primary Action Button */}
            <Link
              href="/cliente/consultas/nova"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-bold text-zinc-950 bg-gradient-to-r from-[#c9a44c] via-[#d4b35e] to-[#b38e3a] hover:brightness-105 shadow-md shadow-[#c9a44c]/20 transition-all active:scale-[0.99]"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Nova Consulta</span>
            </Link>

            {/* Navigation Links (including Admin if admin & Suporte) */}
            <div className="pt-2">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2 mb-2">
                Menu Principal
              </p>
              <div className="space-y-1">
                {navLinks.map((item) => {
                  const active = !item.isExternal && isActive(item.href, item.exact);
                  const Icon = item.icon;

                  if (item.isExternal) {
                    return (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900/60 transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4 text-[#c9a44c]" />
                          <span>{item.name}</span>
                          {item.badgeHighlight === 'online' && (
                            <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <ArrowUpRight className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-[#c9a44c]" />
                      </a>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                        active
                          ? 'bg-gradient-to-r from-[#c9a44c]/20 to-transparent text-[#c9a44c] border border-[#c9a44c]/40 font-bold'
                          : 'text-zinc-300 hover:text-white hover:bg-zinc-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${active ? 'text-[#c9a44c]' : 'text-zinc-400'}`} />
                        <span>{item.name}</span>
                        {item.badge && item.badgeHighlight !== 'online' && (
                          <span
                            className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${
                              item.badgeHighlight === 'admin'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                                : item.badgeHighlight
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-40" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Bottom Session Management (Logout & Redirect to public site) */}
            <div className="pt-4 pb-6 border-t border-zinc-800/80">
              <form action={logoutCustomer}>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-3 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/[0.08] hover:bg-red-500/[0.15] border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all cursor-pointer active:scale-[0.99] group shadow-xs"
                >
                  <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Desconectar</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. DESKTOP SIDEBAR (Permanent, 288px width, Luxury Theme)                 */}
      {/* ========================================================================= */}
      <aside className="hidden lg:flex w-72 flex-col fixed inset-y-0 left-0 bg-[#090C14] border-r border-zinc-800/70 z-30 select-none shadow-xl">
        {/* Ambient Warm Glow */}
        <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-[#c9a44c]/8 via-transparent to-transparent pointer-events-none" />

        {/* 4.1 Brand Header */}
        <div className="p-5 border-b border-zinc-800/60 relative z-10">
          <Link href="/cliente" className="flex items-center gap-3.5 group">
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-[#c9a44c]/40 shadow-lg shadow-[#c9a44c]/15 bg-zinc-900 group-hover:border-[#c9a44c] transition-colors">
              <Image src="/logo.png" alt="AF Veículos PE" fill sizes="44px" className="object-cover" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black text-white tracking-tight leading-tight">
                  AF Veículos PE
                </span>
                <Sparkles className="w-3.5 h-3.5 text-[#c9a44c] shrink-0" />
              </div>
              <span className="text-[10px] text-[#c9a44c] font-bold tracking-wider uppercase block mt-0.5">
                Área do Cliente
              </span>
            </div>
          </Link>
        </div>

        {/* 4.2 User Identity Card */}
        <div className="px-4 py-3.5 border-b border-zinc-800/50 bg-zinc-900/30 relative z-10">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a44c] via-[#b38e3a] to-[#80601e] p-0.5 shrink-0 shadow-md shadow-[#c9a44c]/10">
              <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center overflow-hidden">
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
                  <span className="text-xs font-black text-[#c9a44c]">{userInitial}</span>
                )}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#090C14]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate" title={user.fullName}>
                {user.fullName}
              </p>
              <p className="text-[11px] text-zinc-400 truncate" title={user.email}>
                {user.email}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                {isAdmin && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    Admin
                  </span>
                )}
                {user.isGoogleAccount && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-zinc-300 font-medium">
                    <GoogleIcon className="w-3 h-3 shrink-0" />
                    Google
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 4.3 Middle Scrollable Area */}
        <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto relative z-10 scrollbar-thin scrollbar-thumb-zinc-800">
          {/* Primary Action Button (CTA) */}
          <div>
            <Link
              href="/cliente/consultas/nova"
              className="flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-extrabold text-zinc-950 bg-gradient-to-r from-[#c9a44c] via-[#dfba5c] to-[#b38e3a] hover:brightness-105 shadow-md shadow-[#c9a44c]/20 group transition-all active:scale-[0.99]"
            >
              <div className="flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-zinc-950 group-hover:rotate-90 transition-transform duration-300" />
                <span className="tracking-wide">Nova Consulta</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Quick Credit Balance Card */}
          <div className="p-3 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700/80 transition-all shadow-sm group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 transition-colors ${
                    creditBalance > 0
                      ? 'bg-[#c9a44c]/15 border-[#c9a44c]/30 text-[#e3c56c]'
                      : 'bg-zinc-800/70 border-zinc-700/50 text-zinc-400'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block leading-tight">
                    Saldo de Créditos
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-base font-black font-mono leading-none ${
                        creditBalance > 0 ? 'text-amber-300' : 'text-zinc-300'
                      }`}
                    >
                      {creditBalance}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium">
                      {creditBalance === 1 ? 'disponível' : 'disponíveis'}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/cliente/creditos"
                className="text-[10px] font-bold text-[#c9a44c] hover:text-[#e3c56c] bg-[#c9a44c]/10 hover:bg-[#c9a44c]/20 border border-[#c9a44c]/30 px-2.5 py-1 rounded-lg transition-all"
              >
                {creditBalance > 0 ? '+ Adicionar' : 'Comprar'}
              </Link>
            </div>
          </div>

          {/* Navigation Links (including Admin if admin & Suporte) */}
          <div className="pt-1">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 mb-2">
              Menu Principal
            </p>
            <nav className="space-y-1" aria-label="Navegação do cliente">
              {navLinks.map((item) => {
                const active = !item.isExternal && isActive(item.href, item.exact);
                const Icon = item.icon;

                if (item.isExternal) {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4 shrink-0 text-[#c9a44c]" />
                        <span>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {item.badgeHighlight === 'online' && (
                          <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            {item.badge}
                          </span>
                        )}
                        <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-[#c9a44c] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                      </div>
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      active
                        ? 'bg-gradient-to-r from-[#c9a44c]/15 to-[#c9a44c]/5 text-white shadow-sm border border-[#c9a44c]/30 font-bold'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
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
                    {item.badge && item.badgeHighlight !== 'online' && (
                      <span
                        className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${
                          item.badgeHighlight === 'admin'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                            : item.badgeHighlight
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* 4.4 Session Management (Fixed Bottom - Disconnect and redirect to public site) */}
        <div className="p-3.5 border-t border-zinc-800/70 bg-[#07090F] relative z-10">
          <form action={logoutCustomer}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/[0.08] hover:bg-red-500/[0.15] border border-red-500/20 hover:border-red-500/40 rounded-xl transition-all cursor-pointer active:scale-[0.99] group shadow-xs"
            >
              <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Desconectar</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
