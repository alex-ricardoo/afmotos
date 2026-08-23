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
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Motos', href: '/admin/motos', icon: Bike },
  { name: 'Vendas', href: '/admin/vendas', icon: Receipt },
  { name: 'Contatos & Propostas', href: '/admin/propostas', icon: MessageSquare },
  { name: 'Tabela FIPE', href: '/admin/fipe', icon: Scale },
  { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="flex flex-1 h-full w-full flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-sidebar-border">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 rounded-full overflow-hidden shrink-0 border border-[#c9a44c]/40 shadow-xs bg-black/40 group-hover:border-[#c9a44c] transition-colors">
            <Image src="/logo.png" alt="AF Motos Logo" fill className="object-cover" priority />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-extrabold tracking-tight text-sidebar-foreground">
              AF <span className="text-[#c9a44c]">Motos</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/40 shadow-xs">
              Admin
            </span>
          </div>
        </Link>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1 px-4 py-4">
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
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-xs'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                )}
              >
                <item.icon
                  className={cn(
                    isActive
                      ? 'text-[#c9a44c]'
                      : 'text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80',
                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors',
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border space-y-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors border border-sidebar-border"
          >
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#c9a44c]" />
              <span>Ver Site Público</span>
            </div>
            <ExternalLink className="h-3.5 w-3.5 opacity-50" />
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
}
