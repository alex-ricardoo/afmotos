'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  ChevronRight,
  Home,
  Bike,
  CheckCircle2,
  Sparkles,
  Handshake,
  FileSearch,
  Store,
  UserCircle,
  LogOut,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { CONSTANTS } from '@/lib/utils/constants';
import { getSiteLogo, getSiteInitials } from '@/lib/site-settings';

interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
  isHighlight?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

export function Header({ settings }: { settings?: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const [customerUser, setCustomerUser] = useState<{
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string | null;
  } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    async function checkAuth() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const metadata = user.user_metadata || {};
        setCustomerUser({
          id: user.id,
          email: user.email || '',
          fullName:
            metadata.full_name ||
            metadata.name ||
            user.email?.split('@')[0] ||
            'Cliente',
          avatarUrl: metadata.avatar_url || metadata.picture || null,
        });
      } else {
        setCustomerUser(null);
      }
    }
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const metadata = session.user.user_metadata || {};
        setCustomerUser({
          id: session.user.id,
          email: session.user.email || '',
          fullName:
            metadata.full_name ||
            metadata.name ||
            session.user.email?.split('@')[0] ||
            'Cliente',
          avatarUrl: metadata.avatar_url || metadata.picture || null,
        });
      } else {
        setCustomerUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setCustomerUser(null);
    setIsOpen(false);
    router.push('/');
    router.refresh();
  };

  const siteName = settings?.site_name || CONSTANTS.STORE_NAME;
  const slogan = settings?.settings?.slogan || 'Compra e Venda de Motos';
  const logoInfo = getSiteLogo(settings);
  const initials = getSiteInitials(
    siteName,
    settings?.settings?.shortName || settings?.settings?.short_name,
  );

  const isAboutPublished = settings?.settings?.about?.isPublished === true;
  const isVehicleHistoryPublished =
    settings?.settings?.vehicleHistory?.isEnabled !== false &&
    settings?.settings?.vehicleHistory?.isPublishedInNav !== false;

  // Grupos estruturados para Mobile Drawer
  const navGroups: NavGroup[] = [
    {
      title: 'Estoque & Catálogo',
      items: [
        {
          href: '/',
          label: 'Início',
          icon: Home,
          description: 'Página inicial da loja',
        },
        {
          href: '/motos',
          label: 'Motos Disponíveis',
          shortLabel: 'Estoque',
          icon: Bike,
          description: 'Confira nosso estoque revisado',
        },
        {
          href: '/motos-vendidas',
          label: 'Motos Vendidas',
          shortLabel: 'Vendidas',
          icon: CheckCircle2,
          description: 'Histórico de entregas realizadas',
        },
      ],
    },
    {
      title: 'Serviços & Negociação',
      items: [
        ...(isVehicleHistoryPublished
          ? [
              {
                href: '/historico-veicular',
                label: 'Histórico Veicular',
                shortLabel: 'Histórico',
                icon: FileSearch,
                description: 'Consulta e procedência em todas as motos',
              },
            ]
          : []),
        {
          href: '/vender-minha-moto',
          label: 'Venda sua Moto',
          shortLabel: 'Vender',
          icon: Handshake,
          description: 'Compramos ou avaliamos na troca',
        },
        {
          href: '/anunciar-sua-moto',
          label: 'Anuncie sua Moto',
          shortLabel: 'Anunciar',
          icon: Sparkles,
          description: 'Venda rápida por consignação',
        },
      ],
    },
    {
      title: 'Área do Cliente',
      items: customerUser
        ? [
            {
              href: '/cliente',
              label: `Painel (${customerUser.fullName.split(' ')[0]})`,
              icon: UserCircle,
              description: 'Resumo e consultas ativas',
            },
            {
              href: '/cliente/consultas',
              label: 'Minhas Consultas',
              icon: FileSearch,
              description: 'Histórico de laudos veiculares',
            },
            {
              href: '/cliente/perfil',
              label: 'Meu Perfil',
              icon: UserCircle,
              description: 'Meus dados cadastrais',
            },
          ]
        : [
            {
              href: '/cliente/login',
              label: 'Entrar na Conta',
              icon: UserCircle,
              description: 'Acesse suas consultas e laudos',
            },
            {
              href: '/cliente/cadastro',
              label: 'Cadastre-se Grátis',
              icon: Sparkles,
              description: 'Crie sua conta para consultar placas',
            },
          ],
    },
    ...(isAboutPublished
      ? [
          {
            title: 'Institucional',
            items: [
              {
                href: '/sobre',
                label: 'Sobre a AF Motos',
                shortLabel: 'Sobre',
                icon: Store,
                description: 'Nossa história e compromisso',
              },
            ],
          },
        ]
      : []),
  ];

  // Lista plana para desktop
  const desktopLinks: NavItem[] = [
    { href: '/', label: 'Início', icon: Home, description: '' },
    { href: '/motos', label: 'Motos Disponíveis', icon: Bike, description: '' },
    { href: '/motos-vendidas', label: 'Motos Vendidas', icon: CheckCircle2, description: '' },
    { href: '/vender-minha-moto', label: 'Vender Moto', icon: Handshake, description: '' },
    { href: '/anunciar-sua-moto', label: 'Anunciar', icon: Sparkles, description: '' },
    ...(isVehicleHistoryPublished
      ? [
          {
            href: '/historico-veicular',
            label: 'Histórico Veicular',
            icon: FileSearch,
            description: '',
          },
        ]
      : []),
    ...(isAboutPublished
      ? [{ href: '/sobre', label: 'Sobre', icon: Store, description: '' }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-zinc-950/85 border-b border-white/5 transition-all shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3.5 group py-1 shrink-0">
          {!logoError ? (
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-amber-500/30 group-hover:border-amber-400/80 shadow-[0_0_15px_rgba(201,164,76,0.18)] group-hover:shadow-[0_0_22px_rgba(201,164,76,0.35)] transition-all bg-zinc-950 shrink-0">
              <Image
                src={logoInfo.src}
                alt={logoInfo.alt || siteName}
                fill
                sizes="(max-width: 768px) 44px, 48px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                priority
                unoptimized={logoInfo.isCustom}
                onError={() => setLogoError(true)}
              />
            </div>
          ) : (
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-zinc-900 border border-amber-500/40 flex items-center justify-center font-black text-lg text-amber-400 shadow-[0_0_12px_rgba(201,164,76,0.2)]">
              {initials}
            </div>
          )}

          <div className="flex flex-col">
            <span className="font-black text-base sm:text-lg tracking-tight leading-none text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5 font-heading">
              {siteName}
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            </span>
            <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-widest text-zinc-400 mt-1 line-clamp-1 max-w-[180px] sm:max-w-none">
              {slogan}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Pill */}
        <nav
          aria-label="Navegação principal"
          className="hidden lg:flex items-center gap-1 xl:gap-1.5 p-1.5 rounded-full bg-zinc-900/70 border border-zinc-800/80 backdrop-blur-md shadow-[0_2px_15px_rgba(0,0,0,0.4)] shrink-0"
        >
          {desktopLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-zinc-800 text-amber-400 font-bold border border-zinc-700/60 shadow-xs'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Customer Area Button */}
        <div className="hidden lg:flex items-center gap-2 shrink-0">
          {customerUser ? (
            <div className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-zinc-900/80 border border-[#c9a44c]/30 shadow-sm">
              <Link
                href="/cliente"
                className="flex items-center gap-2 text-xs font-semibold text-zinc-200 hover:text-[#c9a44c] transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#c9a44c] to-[#997628] flex items-center justify-center text-zinc-950 font-bold text-[11px] overflow-hidden">
                  {customerUser.avatarUrl ? (
                    <Image
                      src={customerUser.avatarUrl}
                      alt="Perfil"
                      width={24}
                      height={24}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    customerUser.fullName.charAt(0).toUpperCase()
                  )}
                </div>
                <span className="max-w-[100px] truncate">{customerUser.fullName.split(' ')[0]}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-2 py-1 rounded-full text-[11px] text-zinc-400 hover:text-red-400 hover:bg-zinc-800 transition-colors"
                title="Sair da conta"
              >
                Sair
              </button>
            </div>
          ) : (
            <Link href="/cliente/login">
              <Button
                size="sm"
                className="h-9 px-4 rounded-full bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 hover:border-[#c9a44c]/50 text-zinc-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <UserCircle className="w-4 h-4 text-[#c9a44c]" />
                <span>Área do Cliente</span>
              </Button>
            </Link>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="lg:hidden shrink-0">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden h-10 w-10 rounded-xl border-zinc-800 bg-zinc-900/90 text-zinc-200 hover:text-white hover:border-amber-500/40 hover:bg-zinc-800 transition-all cursor-pointer shadow-xs"
                  aria-label="Abrir menu de navegação"
                >
                  <Menu className="w-5 h-5 text-amber-400" />
                </Button>
              }
            />

            <SheetContent
              side="right"
              showCloseButton={false}
              className="w-[320px] xs:w-[350px] sm:w-[380px] p-0 bg-gradient-to-b from-[#111114] via-[#0b0b0d] to-[#050505] border-none border-l-0 shadow-[-10px_0_50px_rgba(0,0,0,0.85)] flex flex-col justify-between h-full overflow-hidden text-zinc-200"
            >
              {/* Drawer Top Header */}
              <div className="p-5 border-b border-zinc-800/80 bg-gradient-to-r from-zinc-950 via-[#14120e] to-zinc-950 flex items-center justify-between shrink-0">
                <SheetHeader className="p-0 text-left">
                  <SheetTitle className="flex items-center gap-3">
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-amber-500/40 bg-zinc-900 shrink-0 shadow-[0_0_12px_rgba(201,164,76,0.2)]">
                      <Image
                        src={logoInfo.src}
                        alt={logoInfo.alt || siteName}
                        fill
                        sizes="44px"
                        className="object-cover"
                        unoptimized={logoInfo.isCustom}
                      />
                    </div>
                    <div className="flex flex-col text-left min-w-0">
                      <span className="font-black text-base text-white tracking-tight leading-tight truncate font-heading">
                        {siteName}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-amber-400/90 tracking-wider mt-0.5 truncate">
                        {slogan}
                      </span>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                {/* Styled Close Button */}
                <SheetClose
                  render={
                    <button
                      className="w-9 h-9 rounded-xl bg-zinc-900/90 border border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-xs active:scale-95"
                      aria-label="Fechar menu"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  }
                />
              </div>

              {/* Scrollable Navigation Groups */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                {navGroups.map((group, gIdx) => (
                  <div key={gIdx} className="space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 px-3 block">
                      {group.title}
                    </span>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const isActive =
                          item.href === '/'
                            ? pathname === '/'
                            : pathname === item.href || pathname.startsWith(`${item.href}/`);

                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={cn(
                              'group flex items-center justify-between p-2.5 sm:p-3 rounded-xl transition-all duration-200 cursor-pointer',
                              isActive
                                ? 'bg-zinc-900 text-amber-400 border border-amber-500/30 shadow-xs'
                                : 'text-zinc-300 hover:text-white hover:bg-zinc-900/70 border border-transparent hover:border-zinc-800/80',
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={cn(
                                  'w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                                  isActive
                                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                    : 'bg-zinc-900/90 border-zinc-800 text-zinc-400 group-hover:text-amber-400 group-hover:border-amber-500/30 group-hover:bg-amber-500/10',
                                )}
                              >
                                <item.icon className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col text-left min-w-0">
                                <span
                                  className={cn(
                                    'text-sm font-semibold tracking-tight leading-tight',
                                    isActive
                                      ? 'text-amber-400 font-bold'
                                      : 'text-zinc-200 group-hover:text-white',
                                  )}
                                >
                                  {item.label}
                                </span>
                                <span className="text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors truncate mt-0.5">
                                  {item.description}
                                </span>
                              </div>
                            </div>
                            <ChevronRight
                              className={cn(
                                'w-4 h-4 shrink-0 transition-transform group-hover:translate-x-1',
                                isActive
                                  ? 'text-amber-400'
                                  : 'text-zinc-600 group-hover:text-amber-400',
                              )}
                            />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {customerUser && (
                <div className="p-4 border-t border-zinc-800/80 bg-zinc-950/60 shrink-0">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair da minha conta</span>
                  </button>
                </div>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
