import { AlertCircle, ExternalLink } from 'lucide-react';

export function FipeSourceNotice() {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-200/90 shadow-xs space-y-2">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="h-4 w-4 text-[#c9a44c] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-slate-200">Aviso importante sobre valores de referência</p>
          <p className="text-slate-400 leading-relaxed">
            O valor exibido é apenas uma referência média de mercado obtida pela tabela FIPE e não
            substitui a avaliação presencial. O preço real de negociação pode variar de acordo com o
            estado de conservação, quilometragem, acessórios, documentação e demanda regional.
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-amber-500/10 flex items-center justify-between text-[11px] text-slate-400">
        <span>
          Fonte de referência: <strong className="text-slate-300">fipeX</strong> (API independente
          sem vínculo oficial com a Fundação Instituto de Pesquisas Econômicas - FIPE).
        </span>
        <a
          href="https://fipex.com.br"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#e3c56c] hover:underline"
        >
          <span>fipex.com.br</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
