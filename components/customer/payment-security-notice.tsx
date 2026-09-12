'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface PaymentSecurityNoticeProps {
  className?: string;
}

export function PaymentSecurityNotice({ className = '' }: PaymentSecurityNoticeProps) {
  return (
    <div
      className={`flex items-start gap-3 py-3 px-1 text-xs text-zinc-400 ${className}`}
      aria-label="Informações de segurança do pagamento processado pelo Mercado Pago"
    >
      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#009EE3]/15 text-[#009EE3]">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
      </div>

      <div className="space-y-0.5">
        <p className="text-xs font-semibold text-zinc-200">
          Pagamento processado pelo <span className="text-[#009EE3] font-bold">Mercado Pago</span>
        </p>
        <p className="text-[11px] leading-relaxed text-zinc-400">
          A AF Motos não armazena os dados do seu cartão. Suas informações são preenchidas e
          processadas diretamente no ambiente seguro do Mercado Pago.
        </p>
      </div>
    </div>
  );
}
