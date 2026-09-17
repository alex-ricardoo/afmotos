'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface ComplianceBannerProps {
  isCompliant: boolean;
}

export function ComplianceBanner({ isCompliant }: ComplianceBannerProps) {
  const pathname = usePathname();

  // Do not show the banner if the user is already compliant OR if they are currently on the acceptance page
  if (isCompliant || pathname === '/cliente/aceite-documentos') {
    return null;
  }

  return (
    <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
      <div className="flex items-center gap-2.5">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <span className="font-bold text-white block">Atualização de Termos e Privacidade</span>
          <span className="text-[11px] text-zinc-300">
            Novas versões vigentes foram publicadas. Por favor, confirme seu aceite para manter sua
            conta em total conformidade.
          </span>
        </div>
      </div>
      <Link
        href="/cliente/aceite-documentos"
        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs shrink-0 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
      >
        <span>Revisar e Aceitar</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
