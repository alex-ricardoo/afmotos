'use client';

import React from 'react';
import {
  CarFront,
  History,
  Scale,
  Receipt,
  CheckCircle2,
  Clock,
  MessageSquare,
} from 'lucide-react';
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
    {
      icon: CarFront,
      title: 'Dados cadastrais e características do veículo',
      desc: 'Marca, modelo, ano, cor, cilindradas e numerações de identificação.',
    },
    {
      icon: History,
      title: 'Histórico de leilões e sinistros',
      desc: 'Verificação em bases leiloeiras e registros de ocorrências.',
    },
    {
      icon: Scale,
      title: 'Restrições judiciais e Renajud',
      desc: 'Bloqueios civis, trabalhistas, gravames e alienação fiduciária.',
    },
    {
      icon: Receipt,
      title: 'Débitos, multas e IPVA',
      desc: 'Infrações autuadas, débitos em aberto e situação tributária.',
    },
    {
      icon: CheckCircle2,
      title: 'Acesso ao laudo no seu painel',
      desc: 'Histórico salvo com download em PDF e visualização quando quiser.',
    },
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Benefits list card */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-300 mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-400" aria-hidden="true" />
          Você receberá
        </h2>

        <ul className="space-y-3.5" role="list">
          {benefits.map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <li key={idx} className="flex items-start gap-3 text-left">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 mt-0.5">
                  <IconComponent className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200 leading-snug">{item.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </li>
            );
          })}
        </ul>

        {/* Post-payment Reassurance */}
        <div className="mt-5 rounded-xl border border-zinc-800/90 bg-zinc-950/80 p-3.5 text-xs text-zinc-300 flex items-start gap-2.5">
          <Clock className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="leading-relaxed">
            Após a confirmação do pagamento, sua consulta será processada e ficará disponível no seu
            painel.
          </p>
        </div>
      </div>

      {/* Support Link */}
      {whatsappUrl && (
        <div className="flex items-center justify-between rounded-xl border border-zinc-800/60 bg-zinc-900/30 px-4 py-3 text-xs text-zinc-400">
          <span>Precisa de ajuda?</span>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
            Fale com nosso suporte no WhatsApp
          </a>
        </div>
      )}
    </div>
  );
}
