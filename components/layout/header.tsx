'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, ChevronRight } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { Button, buttonVariants } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { CONSTANTS } from '@/lib/utils/constants';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';
import { getSiteLogo, getSiteInitials } from '@/lib/site-settings';

const baseNavLinks = [
  { href: '/', label: 'Início' },
  { href: '/motos', label: 'Motos disponíveis' },
  { href: '/motos-vendidas', label: 'Motos vendidas' },
  { href: '/anunciar-sua-moto', label: 'Anuncie sua moto' },
  { href: '/vender-minha-moto', label: 'Venda sua moto' },
];

export function Header({ settings }: { settings?: any }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const contactPhone = settings?.whatsapp_phone || CONSTANTS.CONTACT_PHONE;
  const siteName = settings?.site_name || CONSTANTS.STORE_NAME;
  const slogan = settings?.settings?.slogan || 'Compra e Venda de Motos';
  const logoInfo = getSiteLogo(settings);
  const initials = getSiteInitials(siteName, settings?.settings?.shortName || settings?.settings?.short_name);
  const isAboutPublished = settings?.settings?.about?.isPublished === true;
  const isVehicleHistoryPublished =
    settings?.settings?.vehicleHistory?.isEnabled !== false &&
    settings?.settings?.vehicleHistory?.isPublishedInNav !== false;

  const navLinks = [...baseNavLinks];
  if (isVehicleHistoryPublished) {
    navLinks.push({ href: '/historico-veicular', label: 'Histórico Veicular' });
  }
  if (isAboutPublished) {
    navLinks.push({ href: '/sobre', label: 'Sobre nós' }); // Inserir no final
  }

  const whatsappUrl = generateWhatsAppLink(
    contactPhone,
    `Olá! Gostaria de falar com a equipe da ${siteName}.`,
  );

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-zinc-950/80 border-b border-white/5 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3.5 group py-1">
          {!logoError ? (
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-amber-500/30 group-hover:border-amber-400/80 shadow-[0_0_12px_rgba(201,164,76,0.15)] group-hover:shadow-[0_0_18px_rgba(201,164,76,0.3)] transition-all bg-zinc-950 shrink-0">
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
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-zinc-900 border border-amber-500/40 flex items-center justify-center font-black text-lg text-amber-400">
              {initials}
            </div>
          )}

          <div className="flex flex-col">
            <span className="font-black text-base sm:text-lg tracking-tight leading-none text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5 font-heading">
              {siteName}
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            </span>
            <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-widest text-zinc-400 mt-1 line-clamp-1 max-w-[200px] sm:max-w-none">
              {slogan}
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1">
          {navLinks.map((link) => {
            const isActive =
              link.href === '/'
                ? pathname === '/'
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3.5 py-2 text-sm font-medium transition-colors relative',
                  isActive
                    ? 'text-amber-400 font-semibold after:absolute after:bottom-0 after:left-3.5 after:right-3.5 after:h-[2px] after:bg-amber-400 after:rounded-full'
                    : 'text-zinc-300 hover:text-amber-400',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions (WhatsApp CTA + Mobile Menu Trigger) */}
        <div className="flex items-center gap-3">


          {/* Mobile Sheet Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden h-10 w-10 border-zinc-800 bg-zinc-900/80 text-zinc-200 hover:text-white hover:bg-zinc-800"
                  aria-label="Abrir menu de navegação"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              }
            />
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[360px] p-6 bg-zinc-950 border-l border-zinc-800/80 flex flex-col justify-between"
            >
              <div>
                <SheetHeader className="text-left pb-4 border-b border-zinc-800">
                  <SheetTitle className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-amber-500/40 bg-zinc-900 shrink-0">
                      <Image
                        src={logoInfo.src}
                        alt={logoInfo.alt || siteName}
                        fill
                        sizes="40px"
                        className="object-cover"
                        unoptimized={logoInfo.isCustom}
                      />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-extrabold text-sm text-white tracking-tight leading-none">
                        {siteName}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mt-0.5">
                        {slogan}
                      </span>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-1.5 mt-6">
                  {navLinks.map((link) => {
                    const isActive =
                      link.href === '/'
                        ? pathname === '/'
                        : pathname === link.href || pathname.startsWith(`${link.href}/`);
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                          isActive
                            ? 'bg-zinc-900 text-amber-400 border border-amber-500/30'
                            : 'text-zinc-300 hover:text-white hover:bg-zinc-900/60',
                        )}
                      >
                        <span>{link.label}</span>
                        <ChevronRight className="w-4 h-4 text-amber-400/60" />
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-6 border-t border-zinc-800 space-y-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'w-full bg-emerald-950/60 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 font-bold rounded-xl h-12 flex items-center justify-center gap-2 transition-all',
                  )}
                >
                  <WhatsAppIcon className="w-5 h-5 fill-current" />
                  <span>Fale Conosco no WhatsApp</span>
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
