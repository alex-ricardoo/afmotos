'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Bike,
  MessageSquare,
  Settings,
  LogOut,
  Globe,
  ExternalLink,
  Scale,
  Receipt,
  Wallet,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { getSiteLogo, getSiteName } from '@/lib/site-settings';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Motos', href: '/admin/motos', icon: Bike },
  { name: 'Vendas', href: '/admin/vendas', icon: Receipt },
  { name: 'Contatos & Propostas', href: '/admin/propostas', icon: MessageSquare },
  { name: 'Gastos', href: '/admin/gastos', icon: Wallet },
  { name: 'Tabela FIPE', href: '/admin/fipe', icon: Scale },
  { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
];

export function AdminSidebar({ settings }: { settings?: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const logoInfo = getSiteLogo(settings);
  const siteName = getSiteName(settings);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <aside className="flex flex-1 h-full w-full flex-col bg-[#0c0c0f] text-zinc-100 border-r border-zinc-900/60 select-none">
      {/* Brand Header */}
      <div className="flex h-20 shrink-0 items-center justify-between px-6 pt-2">
        <Link href="/admin" className="flex items-center gap-3.5 group">
          <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[#c9a44c]/50 shadow-[0_0_15px_rgba(201,164,76,0.15)] bg-black/60 group-hover:border-[#c9a44c] group-hover:shadow-[0_0_20px_rgba(201,164,76,0.3)] transition-all">
            <Image
              src={logoInfo.src}
              alt={siteName}
              fill
              sizes="40px"
              className="object-cover"
              priority
              unoptimized={logoInfo.isCustom}
            />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white">
                {siteName}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/40">
                Admin
              </span>
            </div>
            <span className="text-[10px] text-zinc-500 font-medium">Gestão & Operação</span>
          </div>
        </Link>
      </div>

      {/* Navigation list */}
      <div className="flex flex-1 flex-col overflow-y-auto px-3.5 py-4">
        <div className="px-3 mb-2">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            Menu Principal
          </span>
        </div>

        <nav className="space-y-1.5 flex-1">
          {navigation.map((item) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname === item.href || pathname.startsWith(item.href + '/');

            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150',
                  isActive
                    ? 'bg-gradient-to-r from-[#c9a44c]/20 via-[#c9a44c]/10 to-transparent text-white font-bold border-l-2 border-[#c9a44c] shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50',
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    className={cn(
                      'h-4.5 w-4.5 shrink-0 transition-colors',
                      isActive ? 'text-[#e3c56c]' : 'text-zinc-500 group-hover:text-zinc-300',
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c9a44c] shadow-[0_0_8px_#c9a44c]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="pt-4 pb-2 px-1 space-y-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50 transition-all border border-zinc-900/80"
          >
            <div className="flex items-center gap-2.5">
              <Globe className="h-4 w-4 text-[#c9a44c]" />
              <span>Ver Loja Pública</span>
            </div>
            <ExternalLink className="h-3 w-3 opacity-50" />
          </Link>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-400/90 hover:text-rose-300 hover:bg-rose-950/20 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Encerrar Sessão</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
