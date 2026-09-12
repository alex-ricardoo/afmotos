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
  ShieldAlert,
} from 'lucide-react';
import { logoutCustomer } from '@/lib/customer/actions';
import { Button } from '@/components/ui/button';

interface CustomerNavProps {
  user: {
    fullName: string;
    email: string;
    avatarUrl?: string | null;
  };
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
    },
    {
      name: 'Minhas Consultas',
      href: '/cliente/consultas',
      icon: Search,
      exact: false,
    },
    {
      name: 'Meu Perfil',
      href: '/cliente/perfil',
      icon: User,
      exact: false,
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
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 z-40 px-4 flex items-center justify-between">
        <Link href="/cliente" className="flex items-center gap-2.5">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-[#c9a44c]/30">
            <Image src="/logo.jpg" alt="AF Motos" fill className="object-cover" />
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight block leading-tight">AF Motos</span>
            <span className="text-[10px] text-[#c9a44c] font-medium tracking-wide">Área do Cliente</span>
          </div>
        </Link>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800"
          aria-label="Abrir menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Backdrop & Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col bg-zinc-950/95 backdrop-blur-2xl p-6 pt-20 animate-in fade-in duration-200">
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="absolute top-4 right-4 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 p-3 bg-zinc-900/60 rounded-2xl border border-zinc-800/80 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a44c] to-[#997628] flex items-center justify-center text-zinc-950 font-bold overflow-hidden shrink-0">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={user.fullName} width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                userInitial
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{user.fullName}</p>
              <p className="text-xs text-zinc-400 truncate">{user.email}</p>
            </div>
          </div>

          <div className="space-y-1 flex-1">
            {navLinks.map((item) => {
              const active = isActive(item.href, item.exact);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#c9a44c]/10 text-[#c9a44c] border border-[#c9a44c]/30 font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <Link
              href="/historico-veicular"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-zinc-200 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 mt-4"
            >
              <PlusCircle className="w-5 h-5 text-[#c9a44c] shrink-0" />
              <span>Nova Consulta Veicular</span>
            </Link>
          </div>

          <div className="pt-6 border-t border-zinc-800/80">
            <form action={logoutCustomer}>
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
              >
                <LogOut className="w-4 h-4 mr-2.5" />
                <span>Sair da conta</span>
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 bg-zinc-950 border-r border-zinc-800/80 z-30">
        {/* Brand Header */}
        <div className="p-6 border-b border-zinc-800/80">
          <Link href="/cliente" className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-[#c9a44c]/30 shadow-md shadow-[#c9a44c]/10 bg-zinc-900">
              <Image src="/logo.jpg" alt="AF Motos" fill className="object-cover" />
            </div>
            <div>
              <span className="text-base font-bold text-white tracking-tight block">AF Motos</span>
              <span className="text-[11px] text-[#c9a44c] font-semibold tracking-wide">ÁREA DO CLIENTE</span>
            </div>
          </Link>
        </div>

        {/* User Card */}
        <div className="px-4 py-4 border-b border-zinc-800/60 bg-zinc-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#c9a44c] to-[#997628] flex items-center justify-center text-zinc-950 font-bold overflow-hidden shrink-0 shadow-sm">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={user.fullName} width={40} height={40} className="object-cover w-full h-full" />
              ) : (
                userInitial
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user.fullName}</p>
              <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navLinks.map((item) => {
            const active = isActive(item.href, item.exact);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  active
                    ? 'bg-[#c9a44c]/15 text-[#c9a44c] border border-[#c9a44c]/30 font-semibold shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          <div className="pt-4">
            <Link
              href="/historico-veicular"
              className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-100 bg-gradient-to-r from-zinc-900 to-zinc-900/80 hover:from-zinc-800 hover:to-zinc-800 border border-[#c9a44c]/30 shadow-sm group transition-all"
            >
              <PlusCircle className="w-4 h-4 text-[#c9a44c] group-hover:rotate-90 transition-transform duration-300 shrink-0" />
              <span>Nova Consulta</span>
            </Link>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-zinc-800/80 space-y-2">
          <Link
            href="/"
            className="flex items-center justify-between px-3 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40 rounded-lg transition-colors"
          >
            <span>Voltar ao site público</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <form action={logoutCustomer}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da conta</span>
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
