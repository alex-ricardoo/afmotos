import { Loader2 } from 'lucide-react';

export default function NovaConsultaLoading() {
  return (
    <div className="min-h-[55vh] flex flex-col items-center justify-center space-y-4 text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-[#c9a44c]/10 border border-[#c9a44c]/20 flex items-center justify-center text-[#c9a44c] shadow-lg shadow-[#c9a44c]/5">
        <Loader2 className="w-7 h-7 animate-spin" />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-bold text-white tracking-tight">Preparando sua consulta...</h2>
        <p className="text-sm text-zinc-400 max-w-sm">
          Estamos verificando os dados da placa informada. Você será redirecionado em instantes.
        </p>
      </div>
    </div>
  );
}
