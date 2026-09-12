'use client';

import Link from 'next/link';
import { AlertCircle, RefreshCw, MessageSquare, ArrowLeft } from 'lucide-react';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';
import { CONSTANTS } from '@/lib/utils/constants';

interface AutoRefundNoticeProps {
  plate: string;
  consultationId: string;
  errorMessage?: string | null;
  supportPhone?: string | null;
}

export function AutoRefundNotice({
  plate,
  consultationId,
  errorMessage,
  supportPhone,
}: AutoRefundNoticeProps) {
  const phone = supportPhone || CONSTANTS.CONTACT_PHONE;
  const whatsappMessage = `Olá! Realizei uma consulta veicular da placa ${plate} (ID: ${consultationId}) no site da ${CONSTANTS.STORE_NAME}, mas o sistema indicou instabilidade temporária nas bases oficiais e acionou o estorno. Gostaria de assistência com a minha consulta.`;
  const whatsappUrl = generateWhatsAppLink(phone, whatsappMessage);

  return (
    <div className="w-full max-w-xl mx-auto rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 sm:p-8 backdrop-blur-md text-zinc-100 shadow-2xl">
      <div className="flex items-center gap-3 text-amber-400 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30">
          <RefreshCw className="h-5 w-5 animate-pulse text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">
            Estorno Automático Acionado
          </h2>
          <p className="text-xs text-amber-300/80">
            Transação segura garantida pelo Mercado Pago
          </p>
        </div>
      </div>

      <div className="space-y-3 text-sm text-zinc-300 leading-relaxed border-t border-amber-500/20 pt-4">
        <p>
          Identificamos uma <strong className="text-white">instabilidade temporária</strong> de comunicação junto às bases oficiais de dados do Detran para a placa <span className="font-mono font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">{plate}</span>.
        </p>
        <p>
          Em respeito à sua confiança e conforme nossa garantia, <strong className="text-emerald-400">o valor integral do seu pagamento foi estornado automaticamente</strong>.
        </p>

        <div className="rounded-xl bg-black/40 border border-zinc-800 p-3.5 text-xs space-y-1.5 text-zinc-400">
          <p className="text-zinc-200 font-medium">Informações de estorno:</p>
          <p>• <strong>Pix:</strong> O saldo é devolvido imediatamente na mesma conta bancária utilizada.</p>
          <p>• <strong>Cartão de Crédito/Débito:</strong> O crédito é processado diretamente pelo Mercado Pago na fatura da sua instituição emissora.</p>
          {errorMessage && (
            <p className="text-zinc-500 text-[11px] pt-1">
              Motivo técnico registrado: {errorMessage}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition-colors shadow-lg shadow-emerald-950/40"
        >
          <MessageSquare className="h-4 w-4" />
          Falar com Suporte no WhatsApp
        </a>

        <Link
          href="/cliente/consultas"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800/80 hover:bg-zinc-700 px-4 py-3 text-sm font-medium text-zinc-300 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Painel
        </Link>
      </div>
    </div>
  );
}
