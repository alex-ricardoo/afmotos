import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldX, Home, AlertCircle } from 'lucide-react';

export default function PublicVehicleReportNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-6">
      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
        <ShieldX className="h-12 w-12" />
      </div>

      <div className="space-y-2 max-w-md">
        <h2 className="text-2xl font-black text-white tracking-tight">
          Laudo Não Encontrado ou Indisponível
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Este link de histórico veicular é inválido, expirou ou foi revogado pela administração da AF Motos.
        </p>
      </div>

      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 max-w-sm flex items-start gap-2 text-left">
        <AlertCircle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
        <span>Se você recebeu este link recentemente, solicite à loja o reenvio de um novo link atualizado de compartilhamento.</span>
      </div>

      <Link href="/">
        <Button variant="outline" size="sm" className="gap-2 bg-slate-900 border-slate-700 text-slate-300 hover:text-white">
          <Home className="h-4 w-4" />
          <span>Ir para Página Inicial</span>
        </Button>
      </Link>
    </div>
  );
}
