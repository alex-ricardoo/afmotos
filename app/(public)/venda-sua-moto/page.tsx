import React from 'react';
import { SellForm } from '@/components/forms/sell-form';
import { ShieldCheck, FileCheck, Info } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';

export const metadata = {
  title: 'Venda sua Moto | AF Motos',
  description:
    'Quer vender sua moto? Envie as informações e fotos da sua moto para a AF Motos e conversamos diretamente pelo WhatsApp sobre os próximos passos.',
};

export default function VendaSuaMotoPage() {
  return (
    <div className="bg-[#050505] min-h-screen pb-16 text-[#f4f4f2]">
      {/* Header Hero */}
      <div className="bg-[#0d0d0d] text-white py-12 md:py-16 border-b border-[#c9a44c]/20">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151515] border border-[#c9a44c]/30 text-xs font-bold text-[#e3c56c]">
            <WhatsAppIcon className="w-4 h-4 text-[#25D366] fill-current" />
            <span>Negociação Direta pelo WhatsApp</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-heading">
            Quer vender sua moto?
          </h1>

          <p className="text-base md:text-lg text-[#a6a6a1] leading-relaxed">
            Envie os dados e fotos da sua moto. A gente analisa as informações e entra em contato
            com você pelo WhatsApp para conversar e combinar os próximos passos.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 max-w-5xl space-y-12">
        {/* Step-by-Step Process */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-xs space-y-3 relative hover:border-[#c9a44c]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#c9a44c] text-[#050505] flex items-center justify-center font-black text-sm shadow-sm">
              01
            </div>
            <h3 className="font-extrabold text-lg text-white">Envie os Dados</h3>
            <p className="text-sm text-[#a6a6a1] leading-relaxed">
              Preencha a marca, modelo, ano, quilometragem e detalhes da moto no formulário abaixo.
            </p>
          </div>

          <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-xs space-y-3 relative hover:border-[#c9a44c]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#c9a44c]/30 text-[#e3c56c] flex items-center justify-center font-black text-sm">
              02
            </div>
            <h3 className="font-extrabold text-lg text-white">Vamos Analisar</h3>
            <p className="text-sm text-[#a6a6a1] leading-relaxed">
              Verificamos as informações enviadas e o estado geral do veículo para entender a melhor
              proposta.
            </p>
          </div>

          <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-xs space-y-3 relative hover:border-[#c9a44c]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#c9a44c]/30 text-[#e3c56c] flex items-center justify-center font-black text-sm">
              03
            </div>
            <h3 className="font-extrabold text-lg text-white">Conversamos no WhatsApp</h3>
            <p className="text-sm text-[#a6a6a1] leading-relaxed">
              Entramos em contato para conversar com você e combinar os valores e as condições de
              forma transparente.
            </p>
          </div>
        </div>

        {/* Lead Capture Form Card */}
        <div className="bg-[#151515] rounded-3xl border border-[#c9a44c]/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden max-w-3xl mx-auto">
          <div className="p-6 sm:p-8 bg-[#0d0d0d] border-b border-[#c9a44c]/20 space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-white font-heading">
              Envie as informações da sua moto
            </h2>
            <p className="text-sm text-[#a6a6a1]">
              Preencha os campos abaixo para entrarmos em contato com você pelo WhatsApp.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <SellForm />
          </div>

          {/* Transparent Notice Footer */}
          <div className="px-6 py-4 bg-[#0a0a0a] border-t border-[#c9a44c]/15 flex items-start gap-2.5 text-xs text-[#a6a6a1]">
            <Info className="w-4 h-4 text-[#e3c56c] shrink-0 mt-0.5" />
            <p>
              O envio das informações não garante venda imediata nem compra automática. Valores e
              condições são combinados diretamente entre você e a AF Motos.
            </p>
          </div>
        </div>

        {/* Trust Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-center">
          <div className="space-y-2">
            <ShieldCheck className="w-8 h-8 text-[#e3c56c] mx-auto" />
            <h4 className="font-bold text-sm text-white">Negociação Transparente</h4>
            <p className="text-xs text-[#a6a6a1]">
              Sem promessas irreais. Conversamos abertamente sobre o valor da moto.
            </p>
          </div>
          <div className="space-y-2">
            <WhatsAppIcon className="w-8 h-8 text-[#25D366] fill-current mx-auto" />
            <h4 className="font-bold text-sm text-white">Atendimento Direto</h4>
            <p className="text-xs text-[#a6a6a1]">
              Contato direto e rápido pelo WhatsApp para tirar todas as dúvidas.
            </p>
          </div>
          <div className="space-y-2">
            <FileCheck className="w-8 h-8 text-[#e3c56c] mx-auto" />
            <h4 className="font-bold text-sm text-white">Documentação Clara</h4>
            <p className="text-xs text-[#a6a6a1]">
              Orientação passo a passo para a transferência do veículo com tranquilidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
