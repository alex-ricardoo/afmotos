'use client';

import { Menu, ShieldCheck, Globe, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AdminSidebar } from './admin-sidebar';

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center gap-x-4 border-b border-border bg-card/90 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 items-center justify-between">
        {/* Left Side: Mobile Menu + Title & Admin Badge */}
        <div className="flex items-center gap-x-3">
          <Sheet>
            <SheetTrigger className="inline-flex shrink-0 items-center justify-center rounded-lg text-sm font-medium transition-all outline-none hover:bg-muted hover:text-foreground size-9 lg:hidden border border-border">
              <Menu className="h-5 w-5 text-foreground" />
              <span className="sr-only">Abrir menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 border-r-0 w-72">
              <AdminSidebar />
            </SheetContent>
          </Sheet>

          {/* Mobile Title */}
          <Link href="/admin" className="flex items-center gap-2 lg:hidden">
            <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 border border-[#c9a44c]/40 shadow-xs bg-black/40">
              <Image src="/logo.png" alt="AF Motos" fill className="object-cover" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">
              AF <span className="text-[#c9a44c]">Motos</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/30">
              Admin
            </span>
          </Link>

          {/* Desktop Title & Status */}
          <div className="hidden lg:flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#c9a44c]/15 text-[#e3c56c] flex items-center justify-center border border-[#c9a44c]/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">Painel de Gestão</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/35">
                  Modo Admin
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Link to Public Site */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg border border-border hover:bg-muted/80"
            title="Abrir o site público da AF Motos em uma nova aba"
          >
            <Globe className="w-3.5 h-3.5 text-[#e3c56c]" />
            <span className="hidden sm:inline">Ver Site Público</span>
            <span className="sm:hidden">Site</span>
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>
        </div>
      </div>
    </header>
  );
}
