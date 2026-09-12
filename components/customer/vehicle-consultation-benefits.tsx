'use client';

import React from 'react';
import { Check, Clock, MessageSquare } from 'lucide-react';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';
import { CONSTANTS } from '@/lib/utils/constants';

interface VehicleConsultationBenefitsProps {
  supportPhone?: string | null;
  plate?: string;
  className?: string;
}

export function VehicleConsultationBenefits({
  supportPhone,
  plate,
  className = '',
}: VehicleConsultationBenefitsProps) {
  const phone = supportPhone || CONSTANTS.CONTACT_PHONE;
  const whatsappMsg = plate
    ? `Olá! Tenho dúvidas sobre a consulta do laudo veicular da placa ${plate} na ${CONSTANTS.STORE_NAME}.`
    : `Olá! Tenho dúvidas sobre a consulta veicular na ${CONSTANTS.STORE_NAME}.`;
  const whatsappUrl = phone ? generateWhatsAppLink(phone, whatsappMsg) : null;

  const benefits = [
    'Dados cadastrais e características do veículo',
    'Histórico de leilões e sinistros',
    'Restrições judiciais e Renajud',
    'Débitos, multas e IPVA',
    'Acesso ao laudo no seu painel',
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="rounded-2xl bg-zinc-900/40 p-5 sm:p-6 border border-zinc-800/40">
        <h3 className="text-sm font-bold tracking-tight text-white mb-3.5">Você receberá</h3>

        <ul className="space-y-2.5" role="list">
          {benefits.map((benefit, idx) => (
            <li key={idx} className="flex items-start gap-2.5 text-sm text-zinc-300">
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
                <Check className="h-3 w-3 stroke-[2.5]" aria-hidden="true" />
              </span>
              <span className="leading-snug">{benefit}</span>
            </li>
          ))}
        </ul>

        {/* Reassurance note */}
        <div className="mt-4 pt-3.5 border-t border-zinc-800/60 flex items-center gap-2 text-xs text-zinc-400">
          <Clock className="h-3.5 w-3.5 text-amber-400 shrink-0" aria-hidden="true" />
          <span>Liberação imediata após a confirmação do pagamento.</span>
        </div>
      </div>

      {/* Support link */}
      {whatsappUrl && (
        <div className="px-2 flex items-center justify-between text-xs text-zinc-400">
          <span>Dúvidas com o laudo?</span>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            Suporte via WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
