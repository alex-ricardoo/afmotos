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

const navLinks = [
  { href: '/motos', label: 'Motos disponíveis' },
  { href: '/consignar-moto', label: 'Anuncie sua moto' },
  { href: '/venda-sua-moto', label: 'Venda sua moto' },
  { href: '/aluguel', label: 'Aluguel' },
  { href: '/motos-vendidas', label: 'Motos vendidas' },
];

export function Header({ settings }: { settings?: any }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const contactPhone = settings?.whatsapp_phone || CONSTANTS.CONTACT_PHONE;
  const siteName = settings?.site_name || 'AF Motos';

  const whatsappUrl = generateWhatsAppLink(
    contactPhone,
    `Olá! Gostaria de falar com a ${siteName}.`,
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#c9a44c]/20 bg-[#050505]/95 backdrop-blur-md transition-all">
      <div className="container mx-auto px-4 md:px-6 h-20 md:h-24 flex items-center justify-between">
        {/* Official Brand Logo */}
        <Link href="/" className="flex items-center gap-3.5 group py-1">
          {!logoError ? (
            <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border border-[#c9a44c]/40 group-hover:border-[#e3c56c] shadow-[0_0_15px_rgba(201,164,76,0.15)] group-hover:shadow-[0_0_20px_rgba(201,164,76,0.3)] transition-all bg-[#050505] shrink-0">
              <Image
                src="/logo.jpg"
                alt={siteName}
                fill
                sizes="(max-width: 768px) 48px, 56px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                priority
                onError={() => setLogoError(true)}
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#151515] border border-[#c9a44c]/40 flex items-center justify-center font-black text-lg text-[#e3c56c]">
              AF
            </div>
          )}

          <div className="flex flex-col">
            <span className="font-black text-base sm:text-lg md:text-xl tracking-tight leading-none text-white group-hover:text-[#e3c56c] transition-colors flex items-center gap-1.5 font-heading">
              {siteName}
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#c9a44c] shadow-[0_0_8px_#c9a44c]" />
            </span>
            <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-widest text-[#b8bcc2] mt-1">
              Compra, Venda e Locação
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center space-x-1 font-medium text-sm">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3.5 py-2 rounded-lg transition-all duration-200 text-sm font-semibold tracking-wide',
                  isActive
                    ? 'bg-[#151515] text-[#e3c56c] border border-[#c9a44c]/30 shadow-xs'
                    : 'text-[#a6a6a1] hover:text-white hover:bg-[#151515]/60',
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Actions (WhatsApp CTA + Mobile Menu Trigger) */}
        <div className="flex items-center gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: 'sm' }),
              'hidden sm:inline-flex bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-xl px-4 h-10 shadow-[0_0_15px_rgba(37,211,102,0.2)] transition-all flex items-center gap-2',
            )}
          >
            <WhatsAppIcon className="w-4 h-4 fill-current" />
            <span>Falar no WhatsApp</span>
          </a>

          {/* Mobile Sheet Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden h-10 w-10 border-border text-foreground hover:bg-muted"
                  aria-label="Abrir menu de navegação"
                >
                  <Menu className="w-5 h-5" />
                </Button>
              }
            />
            <SheetContent
              side="right"
              className="w-[300px] sm:w-[360px] p-6 bg-[#0d0d0d] border-l border-[#c9a44c]/20 flex flex-col justify-between"
            >
              <div>
                <SheetHeader className="text-left pb-4 border-b border-[#c9a44c]/20">
                  <SheetTitle className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#c9a44c]/40 bg-[#050505] shrink-0">
                      <Image
                        src="/logo.jpg"
                        alt="AF Locações e Vendas"
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="font-extrabold text-sm text-white tracking-tight leading-none">
                        {siteName}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-[#b8bcc2] tracking-wider mt-0.5">
                        Compra, Venda e Locação
                      </span>
                    </div>
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-1.5 mt-6">
                  {navLinks.map((link) => {
                    const isActive =
                      pathname === link.href ||
                      (link.href !== '/' && pathname.startsWith(link.href));
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          'flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all',
                          isActive
                            ? 'bg-[#151515] text-[#e3c56c] border border-[#c9a44c]/30 shadow-xs'
                            : 'text-[#a6a6a1] hover:text-white hover:bg-[#151515]/60',
                        )}
                      >
                        <span>{link.label}</span>
                        <ChevronRight className="w-4 h-4 text-[#c9a44c]/60" />
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-6 border-t border-[#c9a44c]/20 space-y-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ size: 'lg' }),
                    'w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-xl h-12 shadow-[0_0_15px_rgba(37,211,102,0.2)] flex items-center justify-center gap-2',
                  )}
                >
                  <WhatsAppIcon className="w-5 h-5 fill-current" />
                  <span>Falar no WhatsApp</span>
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
