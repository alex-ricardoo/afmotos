'use client';

import React, { useState } from 'react';
import { ShieldCheck, Info, ChevronDown, ChevronUp } from 'lucide-react';

interface PaymentSecurityNoticeProps {
  className?: string;
  isTestMode?: boolean;
}

export function PaymentSecurityNotice({
  className = '',
  isTestMode = false,
}: PaymentSecurityNoticeProps) {
  const [showSandboxHelp, setShowSandboxHelp] = useState(false);

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        className="flex items-start gap-3 py-3 px-1 text-xs text-zinc-400"
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

      {isTestMode && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-300/90">
          <button
            type="button"
            onClick={() => setShowSandboxHelp((prev) => !prev)}
            className="flex w-full items-center justify-between font-semibold text-amber-400 hover:text-amber-300 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Info className="h-4 w-4" />
              Ambiente de Testes (Sandbox) — Cartão de Teste Recomendado
            </span>
            {showSandboxHelp ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showSandboxHelp && (
            <div className="mt-2.5 pt-2 border-t border-amber-500/20 space-y-1.5 text-[11px] font-mono text-zinc-300">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-zinc-500">Cartão:</span>{' '}
                  <span className="text-white font-bold">5480 8328 0103 3311</span> (Mastercard)
                </div>
                <div>
                  <span className="text-zinc-500">Validade:</span>{' '}
                  <span className="text-white font-bold">11/30</span>
                </div>
                <div>
                  <span className="text-zinc-500">CVV:</span>{' '}
                  <span className="text-white font-bold">123</span>
                </div>
                <div>
                  <span className="text-zinc-500">Titular:</span>{' '}
                  <span className="text-white font-bold">APRO</span>
                </div>
                <div>
                  <span className="text-zinc-500">Parcelas:</span>{' '}
                  <span className="text-white font-bold">1x</span>
                </div>
                <div>
                  <span className="text-zinc-500">CPF:</span>{' '}
                  <span className="text-white font-bold">12345678909</span>
                </div>
              </div>
              <p className="pt-1 text-[10px] text-amber-400/80 font-sans">
                Nota: No sandbox do Mercado Pago, não utilize o mesmo e-mail associado à conta
                vendedora para simular o pagamento.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
