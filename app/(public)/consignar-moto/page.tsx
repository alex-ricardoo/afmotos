import React from 'react';
import { ConsignmentForm } from '@/components/forms/consignment-form';
import { KeyRound, ShieldCheck, Camera, Info } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';

export const metadata = {
  title: 'Anuncie sua Moto | AF Motos',
  description:
    'Anuncie sua moto com a AF Motos. Você envia as fotos e informações da moto, e a gente conversa diretamente pelo WhatsApp sobre como anunciar e encontrar um comprador.',
};

export default function ConsignarMotoPage() {
  return (
    <div className="bg-[#050505] min-h-screen pb-16 text-[#f4f4f2]">
      {/* Header Hero */}
      <div className="bg-[#0d0d0d] text-white py-12 md:py-16 border-b border-[#c9a44c]/20">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151515] border border-[#c9a44c]/30 text-xs font-bold text-[#e3c56c]">
            <KeyRound className="w-4 h-4 text-[#e3c56c]" />
            <span>Divulgação & Apoio na Venda</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-heading">
            Anuncie sua moto com a AF Motos
          </h1>

          <p className="text-base md:text-lg text-[#a6a6a1] leading-relaxed">
            Você envia as informações e fotos da moto, e a gente conversa com você pelo WhatsApp
            sobre como anunciar e encontrar um comprador.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 max-w-5xl space-y-12">
        {/* Step by step */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
              Como funciona o anúncio da sua moto
            </h2>
            <p className="text-[#a6a6a1] text-sm mt-1">
              Um processo transparente e direto para ajudar você a vender sua moto.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#151515] p-5 rounded-2xl border border-[#c9a44c]/20 space-y-2">
              <span className="w-8 h-8 rounded-lg bg-[#c9a44c] text-black font-extrabold flex items-center justify-center text-sm">
                1
              </span>
              <h3 className="font-bold text-white text-base">Envio dos Dados</h3>
              <p className="text-xs text-[#a6a6a1] leading-relaxed">
                Você envia os dados, ano, quilometragem e fotos da sua moto no formulário.
              </p>
            </div>

            <div className="bg-[#151515] p-5 rounded-2xl border border-[#c9a44c]/20 space-y-2">
              <span className="w-8 h-8 rounded-lg bg-[#202020] border border-[#c9a44c]/30 text-[#e3c56c] font-extrabold flex items-center justify-center text-sm">
                2
              </span>
              <h3 className="font-bold text-white text-base">Análise e Contato</h3>
              <p className="text-xs text-[#a6a6a1] leading-relaxed">
                Analisamos as informações e chamamos você no WhatsApp para conversar.
              </p>
            </div>

            <div className="bg-[#151515] p-5 rounded-2xl border border-[#c9a44c]/20 space-y-2">
              <span className="w-8 h-8 rounded-lg bg-[#202020] border border-[#c9a44c]/30 text-[#e3c56c] font-extrabold flex items-center justify-center text-sm">
                3
              </span>
              <h3 className="font-bold text-white text-base">Combinação de Condições</h3>
              <p className="text-xs text-[#a6a6a1] leading-relaxed">
                Combinamos juntos o valor de venda desejado e como será feito o anúncio.
              </p>
            </div>

            <div className="bg-[#151515] p-5 rounded-2xl border border-[#c9a44c]/20 space-y-2">
              <span className="w-8 h-8 rounded-lg bg-[#202020] border border-[#c9a44c]/30 text-[#e3c56c] font-extrabold flex items-center justify-center text-sm">
                4
              </span>
              <h3 className="font-bold text-white text-base">Publicação e Contato</h3>
              <p className="text-xs text-[#a6a6a1] leading-relaxed">
                A moto é anunciada e conectamos você a pessoas interessadas de forma segura.
              </p>
            </div>
          </div>
        </div>

        {/* Lead Capture Form Card */}
        <div className="bg-[#151515] rounded-3xl border border-[#c9a44c]/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden max-w-3xl mx-auto">
          <div className="p-6 sm:p-8 bg-[#0d0d0d] border-b border-[#c9a44c]/20 space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-white font-heading">
              Formulário para anunciar sua moto
            </h2>
            <p className="text-sm text-[#a6a6a1]">
              Preencha os campos abaixo. Entraremos em contato pelo WhatsApp para detalhar os
              próximos passos.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <ConsignmentForm />
          </div>

          {/* Transparent Notice Footer */}
          <div className="px-6 py-4 bg-[#0a0a0a] border-t border-[#c9a44c]/15 flex items-start gap-2.5 text-xs text-[#a6a6a1]">
            <Info className="w-4 h-4 text-[#e3c56c] shrink-0 mt-0.5" />
            <p>
              O envio não garante venda imediata nem comprador garantido. As condições, fotos e
              valores do anúncio serão combinados diretamente com você antes de qualquer divulgação.
            </p>
          </div>
        </div>

        {/* Trust Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-center">
          <div className="space-y-2">
            <ShieldCheck className="w-8 h-8 text-[#e3c56c] mx-auto" />
            <h4 className="font-bold text-sm text-white">Negociação Transparente</h4>
            <p className="text-xs text-[#a6a6a1]">
              Você sabe exatamente como a moto será anunciada e o valor combinado.
            </p>
          </div>
          <div className="space-y-2">
            <WhatsAppIcon className="w-8 h-8 text-[#25D366] fill-current mx-auto" />
            <h4 className="font-bold text-sm text-white">Atendimento Direto</h4>
            <p className="text-xs text-[#a6a6a1]">
              Conversa no WhatsApp direto com quem entende de moto e do mercado local.
            </p>
          </div>
          <div className="space-y-2">
            <Camera className="w-8 h-8 text-[#e3c56c] mx-auto" />
            <h4 className="font-bold text-sm text-white">Divulgação Eficiente</h4>
            <p className="text-xs text-[#a6a6a1]">
              Ajudamos a apresentar sua moto da melhor forma para encontrar um interessado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
