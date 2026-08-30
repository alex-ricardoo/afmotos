'use client';

import React, { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Erro na Central de Relatórios:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center space-y-5 p-6 animate-in fade-in duration-200">
      <div className="w-14 h-14 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-lg">
        <AlertCircle className="w-7 h-7" />
      </div>

      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-white">Falha ao Carregar Relatórios</h2>
        <p className="text-xs text-zinc-400">
          Ocorreu um erro ao consultar os dados consolidados do período. Verifique sua conexão e
          permissões administrativas.
        </p>
      </div>

      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#c9a44c] hover:bg-[#d8b35a] text-black font-extrabold text-xs shadow-md transition-all cursor-pointer"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Tentar Novamente</span>
      </button>
    </div>
  );
}
