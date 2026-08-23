'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bike, Receipt, MessageSquare, Menu, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AdminSidebar } from './admin-sidebar';

const mainMobileItems = [
  { name: 'Início', href: '/admin', icon: LayoutDashboard },
  { name: 'Motos', href: '/admin/motos', icon: Bike },
  { name: 'Vendas', href: '/admin/vendas', icon: Receipt },
  { name: 'Propostas', href: '/admin/propostas', icon: MessageSquare },
];

export function AdminBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegação rápida mobile"
      className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-zinc-950/85 backdrop-blur-xl border border-zinc-800/80 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.6)] px-2 py-1.5 flex items-center justify-around"
    >
      {mainMobileItems.map((item) => {
        const isActive =
          item.href === '/admin'
            ? pathname === '/admin'
            : pathname === item.href || pathname.startsWith(item.href + '/');

        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              'flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative select-none',
              isActive ? 'text-[#e3c56c] font-bold' : 'text-zinc-400 hover:text-zinc-200',
            )}
          >
            <div
              className={cn(
                'relative p-1 rounded-lg transition-all',
                isActive && 'bg-[#c9a44c]/15 text-[#e3c56c]',
              )}
            >
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">{item.name}</span>
            {isActive && (
              <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-[#c9a44c]" />
            )}
          </Link>
        );
      })}

      {/* More / Menu Drawer Trigger */}
      <Sheet>
        <SheetTrigger className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer">
          <div className="p-1 rounded-lg">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[10px] tracking-tight mt-0.5">Mais</span>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 border-r-0 w-72 bg-[#0c0c0e]">
          <AdminSidebar />
        </SheetContent>
      </Sheet>
    </nav>
  );
}
