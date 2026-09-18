'use client';

import { useMemo, useState } from 'react';
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
  Users,
  BarChart3,
  FileSearch,
  CircleDollarSign,
  Coins,
  ShieldCheck,
  Package,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { getSiteLogo, getSiteName } from '@/lib/site-settings';
import type { SiteSettingsRecord } from '@/types/site-settings';

type NavLink = {
  type: 'link';
  name: string;
  href: string;
  icon: LucideIcon;
};

type NavGroup = {
  type: 'group';
  name: string;
  icon: LucideIcon;
  children: {
    name: string;
    href: string;
    icon: LucideIcon;
  }[];
};

type NavItem = NavLink | NavGroup;

const navigation: NavItem[] = [
  { type: 'link', name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { type: 'link', name: 'Motos', href: '/admin/motos', icon: Bike },
  { type: 'link', name: 'Vendas', href: '/admin/vendas', icon: Receipt },
  { type: 'link', name: 'Clientes', href: '/admin/clientes', icon: Users },
  { type: 'link', name: 'Contatos & Propostas', href: '/admin/propostas', icon: MessageSquare },
  { type: 'link', name: 'Gastos', href: '/admin/gastos', icon: Wallet },
  { type: 'link', name: 'Relatórios', href: '/admin/relatorios', icon: BarChart3 },
  {
    type: 'group',
    name: 'Histórico Veicular',
    icon: FileSearch,
    children: [
      { name: 'Consultas de Placas', href: '/admin/consulta-placa', icon: FileSearch },
      {
        name: 'Pagamentos & Estornos',
        href: '/admin/pagamentos-consultas',
        icon: CircleDollarSign,
      },
      { name: 'Créditos B2B', href: '/admin/credits', icon: Coins },
      { name: 'Pacotes B2B', href: '/admin/configuracoes/pacotes-consultas', icon: Package },
      {
        name: 'Configuração & Preço',
        href: '/admin/historico-veicular/configuracoes',
        icon: Settings,
      },
    ],
  },
  { type: 'link', name: 'Tabela FIPE', href: '/admin/fipe', icon: Scale },
  {
    type: 'link',
    name: 'Documentos Legais & LGPD',
    href: '/admin/configuracoes/documentos-legais',
    icon: ShieldCheck,
  },
  { type: 'link', name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
];

export function AdminSidebar({ settings }: { settings?: SiteSettingsRecord | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  // Mapeia todas as rotas para resolver correspondência mais específica
  const allHrefs = useMemo(() => {
    const list: { href: string; name: string }[] = [];
    for (const item of navigation) {
      if (item.type === 'link') {
        list.push({ href: item.href, name: item.name });
      } else {
        for (const child of item.children) {
          list.push({ href: child.href, name: child.name });
        }
      }
    }
    return list;
  }, []);

  const activeHref = useMemo(() => {
    const matching = allHrefs.filter((item) => {
      if (item.href === '/admin') {
        return pathname === '/admin';
      }
      return pathname === item.href || pathname.startsWith(item.href + '/');
    });

    if (matching.length === 0) return null;

    return matching.reduce((best, current) =>
      current.href.length > best.href.length ? current : best,
    ).href;
  }, [pathname, allHrefs]);

  // Controle de abertura manual de grupos retráteis
  const [openOverrides, setOpenOverrides] = useState<Record<string, boolean>>({});

  const toggleGroup = (name: string, currentlyOpen: boolean) => {
    setOpenOverrides((prev) => ({
      ...prev,
      [name]: !currentlyOpen,
    }));
  };

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
              <span className="text-base font-black tracking-tight text-white">{siteName}</span>
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
            if (item.type === 'group') {
              const isGroupActive = item.children.some((child) => activeHref === child.href);
              const isOpen = openOverrides[item.name] ?? true;

              return (
                <div key={item.name} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.name, isOpen)}
                    className={cn(
                      'group flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer',
                      isGroupActive
                        ? 'text-white font-bold bg-zinc-900/60 border border-zinc-800/80 shadow-xs'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/50',
                    )}
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon
                        className={cn(
                          'h-4.5 w-4.5 shrink-0 transition-colors',
                          isGroupActive
                            ? 'text-[#e3c56c]'
                            : 'text-zinc-500 group-hover:text-zinc-300',
                        )}
                      />
                      <span>{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isGroupActive && !isOpen && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#c9a44c] shadow-[0_0_8px_#c9a44c]" />
                      )}
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-zinc-500 transition-transform duration-200 group-hover:text-zinc-300',
                          isOpen && 'rotate-180 text-zinc-300',
                        )}
                      />
                    </div>
                  </button>

                  {isOpen && (
                    <div className="pl-3.5 pr-1 py-1 space-y-1 ml-4 border-l border-zinc-800/80 transition-all">
                      {item.children.map((child) => {
                        const isChildActive = activeHref === child.href;

                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              'group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150',
                              isChildActive
                                ? 'bg-gradient-to-r from-[#c9a44c]/20 via-[#c9a44c]/10 to-transparent text-white font-bold border-l-2 border-[#c9a44c] shadow-xs'
                                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/40',
                            )}
                          >
                            <div className="flex items-center gap-2.5">
                              <child.icon
                                className={cn(
                                  'h-3.5 w-3.5 shrink-0 transition-colors',
                                  isChildActive
                                    ? 'text-[#e3c56c]'
                                    : 'text-zinc-500 group-hover:text-zinc-300',
                                )}
                              />
                              <span>{child.name}</span>
                            </div>
                            {isChildActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#c9a44c] shadow-[0_0_8px_#c9a44c]" />
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = activeHref === item.href;

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
