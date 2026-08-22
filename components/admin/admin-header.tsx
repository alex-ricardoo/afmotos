'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AdminSidebar } from './admin-sidebar';

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center gap-x-4 border-b bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center gap-x-4">
          <Sheet>
            <SheetTrigger className="inline-flex shrink-0 items-center justify-center rounded-[min(var(--radius-md),10px)] text-sm font-medium transition-all outline-none select-none hover:bg-muted hover:text-foreground size-8 lg:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menu</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <AdminSidebar />
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-x-4 lg:hidden">
            <span className="text-xl font-bold tracking-tight">AF Motos</span>
          </div>
        </div>
      </div>
    </header>
  );
}
