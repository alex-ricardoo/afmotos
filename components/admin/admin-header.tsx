'use client';

import { ShieldCheck, Globe, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export function AdminHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-16 flex-shrink-0 items-center justify-between bg-[#08080a]/80 backdrop-blur-xl px-4 sm:px-6 lg:px-8 border-b border-zinc-900/50 select-none">
      {/* Left side: Branding / Screen title */}
      <div className="flex items-center gap-3">
        {/* Mobile Logo Branding */}
        <Link href="/admin" className="flex items-center gap-2.5 lg:hidden">
          <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[#c9a44c]/50 shadow-xs bg-black/50">
            <Image src="/logo.png" alt="AF Motos" fill className="object-cover" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-black tracking-tight text-white">
              AF <span className="text-[#c9a44c]">Motos</span>
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/40">
              Admin
            </span>
          </div>
        </Link>

        {/* Desktop Title */}
        <div className="hidden lg:flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#c9a44c]/10 text-[#e3c56c] flex items-center justify-center border border-[#c9a44c]/25 shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-300">Painel Administrativo</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Operacional
            </span>
          </div>
        </div>
      </div>

      {/* Right Side: Quick Link to Public Store */}
      <div className="flex items-center gap-2.5">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-100 transition-all px-3 py-1.5 rounded-xl border border-zinc-800/80 hover:bg-zinc-900/60 shadow-xs"
          title="Abrir o site público da AF Motos em uma nova aba"
        >
          <Globe className="w-3.5 h-3.5 text-[#e3c56c]" />
          <span className="hidden sm:inline">Ver Site Público</span>
          <span className="sm:hidden text-[11px]">Site</span>
          <ExternalLink className="w-3 h-3 opacity-50" />
        </Link>
      </div>
    </header>
  );
}
