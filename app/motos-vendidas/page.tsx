import React from 'react';
import Link from 'next/link';
import {
  Award,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { getSoldMotorcycles } from '@/lib/queries/motorcycles';
import { MotorcycleGrid } from '@/components/motorcycles/motorcycle-grid';
import { buttonVariants } from '@/components/ui/button';
import { CONSTANTS } from '@/lib/utils/constants';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';
import { cn } from '@/lib/utils';

export const metadata = {
  title: 'Motos Vendidas | AF Locações e Vendas',
  description:
    'Confira o portfólio de motocicletas entregues pela AF Locações e Vendas. Histórico de transparência, excelência e clientes satisfeitos.',
};

export default async function MotosVendidasPage() {
  const motorcycles = await getSoldMotorcycles();

  const customOrderWhatsappUrl = generateWhatsAppLink(
    CONSTANTS.CONTACT_PHONE,
    'Olá! Vi um modelo na galeria de motos entregues da AF Locações e Vendas e gostaria de encomendar uma similar.'
  );

  return (
    <div className="bg-[#050505] min-h-screen pb-16 text-[#f4f4f2]">
      {/* Header Hero */}
      <div className="bg-[#0d0d0d] text-white py-12 md:py-16 border-b border-[#c9a44c]/20">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151515] border border-[#c9a44c]/30 text-xs font-bold text-[#e3c56c]">
            <Award className="w-4 h-4 text-[#e3c56c]" />
            <span>Portfólio de Entregas & Prova Social</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-heading">
            Motos Entregues aos Novos Donos
          </h1>

          <p className="text-base md:text-lg text-[#a6a6a1] leading-relaxed">
            Cada motocicleta abaixo representa uma história de conquista realizada com segurança jurídica, vistoria cautelar 100% aprovada e a garantia AF Locações e Vendas.
          </p>

          {/* Metrics bar */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#c9a44c]/20 max-w-md mx-auto text-center">
            <div>
              <p className="text-xl sm:text-2xl font-black text-white tabular-nums">
                +500
              </p>
              <p className="text-[11px] text-[#a6a6a1] font-medium">
                Entregas Realizadas
              </p>
            </div>
            <div className="border-x border-[#c9a44c]/20 px-2">
              <p className="text-xl sm:text-2xl font-black text-[#e3c56c] tabular-nums">
                100%
              </p>
              <p className="text-[11px] text-[#a6a6a1] font-medium">
                Procedência Limpa
              </p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-black text-white tabular-nums">
                98%
              </p>
              <p className="text-[11px] text-[#a6a6a1] font-medium">
                Satisfação Total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="container mx-auto px-4 md:px-6 py-12 space-y-12">
        <div className="flex items-center justify-between pb-4 border-b border-[#c9a44c]/20">
          <div>
            <h2 className="text-xl font-bold text-white font-heading">Histórico de Vendas</h2>
            <p className="text-xs text-[#a6a6a1]">
              {motorcycles.length}{' '}
              {motorcycles.length === 1
                ? 'motocicleta no histórico'
                : 'motocicletas no histórico recente'}
            </p>
          </div>

          <Link
            href="/motos"
            className={cn(
              buttonVariants({ variant: 'outline' }),
              'hidden sm:inline-flex rounded-xl font-bold text-xs h-10 px-4 bg-[#151515] border-[#c9a44c]/30 text-white hover:bg-[#c9a44c] hover:text-black transition-all'
            )}
          >
            <span>Ver Estoque Disponível</span>
            <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
          </Link>
        </div>

        <MotorcycleGrid
          motorcycles={motorcycles}
          emptyMessage="O histórico de motos vendidas está sendo atualizado pela equipe."
        />

        {/* Custom Order Callout Box */}
        <div className="bg-[#151515] text-white p-8 rounded-3xl border border-[#c9a44c]/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#e3c56c] flex items-center justify-center md:justify-start gap-1.5">
              <Sparkles className="w-4 h-4" />
              Encomenda Personalizada
            </span>
            <h3 className="text-2xl font-black tracking-tight text-white font-heading">
              Gostou de algum modelo que já foi vendido?
            </h3>
            <p className="text-xs sm:text-sm text-[#a6a6a1] leading-relaxed">
              Nossa equipe localiza a moto perfeita para você com laudo cautelar aprovado e garantia total AF Locações e Vendas.
            </p>
          </div>

          <a
            href={customOrderWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'w-full md:w-auto bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-2xl px-6 h-12 shadow-[0_0_15px_rgba(37,211,102,0.3)] flex items-center justify-center gap-2 shrink-0 transition-all'
            )}
          >
            <MessageCircle className="w-5 h-5 fill-white" />
            <span>Encomendar Modelo Similar</span>
          </a>
        </div>
      </div>
    </div>
  );
}
