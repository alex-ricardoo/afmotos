'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ClientesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Clientes module error:', error);
  }, [error]);

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-5">
      <div className="w-14 h-14 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-400 flex items-center justify-center mx-auto">
        <AlertTriangle className="w-7 h-7" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white tracking-tight">
          Ocorreu um erro ao carregar os clientes
        </h2>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Não foi possível sincronizar os registros do CRM de clientes com o banco de dados.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button
          onClick={() => reset()}
          className="bg-[#c9a44c] hover:bg-[#b5923f] text-zinc-950 font-bold text-xs gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Tentar Novamente
        </Button>

        <Link
          href="/admin"
          className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-zinc-800 text-zinc-300 hover:text-white text-xs gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Início
        </Link>
      </div>
    </div>
  );
}
