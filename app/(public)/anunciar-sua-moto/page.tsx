import React from 'react';
import { AnunciarMotoForm } from '@/components/forms/anunciar-moto-form';
import { KeyRound, ShieldCheck, MessageCircle, FileCheck, Info } from 'lucide-react';
import { CONSTANTS } from '@/lib/utils/constants';

export const metadata = {
  title: 'Anuncie sua Moto | AF Motos',
  description:
    'Quer vender sua moto? Envie as informações e fotos para a AF Motos. Analisamos os dados e combinamos os próximos passos diretamente pelo WhatsApp.',
};

export default function AnunciarSuaMotoPage() {
  return (
    <div className="bg-[#050505] min-h-screen pb-16 text-[#f4f4f2]">
      {/* Header Hero */}
      <div className="bg-[#0d0d0d] text-white py-12 md:py-16 border-b border-[#c9a44c]/20">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151515] border border-[#c9a44c]/30 text-xs font-bold text-[#e3c56c]">
            <KeyRound className="w-4 h-4 text-[#e3c56c]" />
            <span>Divulgação e Negociação Transparente</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-heading">
            Anuncie sua moto com a AF Motos
          </h1>

          <p className="text-base md:text-lg text-[#a6a6a1] leading-relaxed">
            Envie as informações e algumas fotos da sua moto. Vamos analisar os dados e conversar
            com você sobre os próximos passos para anunciar ou encontrar um comprador.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 max-w-5xl space-y-12">
        {/* Step-by-Step Explanation */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
              Como funciona o processo
            </h2>
            <p className="text-[#a6a6a1] text-sm mt-1">
              Simples, transparente e direto, com atendimento humano pelo WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#151515] p-5 rounded-2xl border border-[#c9a44c]/20 space-y-2">
              <span className="w-8 h-8 rounded-lg bg-[#c9a44c] text-[#050505] font-extrabold flex items-center justify-center text-sm">
                1
              </span>
              <h3 className="font-bold text-white text-base">Envio dos Dados</h3>
              <p className="text-xs text-[#a6a6a1] leading-relaxed">
                Você preenche a marca, modelo, ano, quilometragem e envia fotos da moto.
              </p>
            </div>

            <div className="bg-[#151515] p-5 rounded-2xl border border-[#c9a44c]/20 space-y-2">
              <span className="w-8 h-8 rounded-lg bg-[#202020] border border-[#c9a44c]/30 text-[#e3c56c] font-extrabold flex items-center justify-center text-sm">
                2
              </span>
              <h3 className="font-bold text-white text-base">Análise da Equipe</h3>
              <p className="text-xs text-[#a6a6a1] leading-relaxed">
                Avaliamos os detalhes técnicos e o estado do veículo para entender o potencial de
                anúncio.
              </p>
            </div>

            <div className="bg-[#151515] p-5 rounded-2xl border border-[#c9a44c]/20 space-y-2">
              <span className="w-8 h-8 rounded-lg bg-[#202020] border border-[#c9a44c]/30 text-[#e3c56c] font-extrabold flex items-center justify-center text-sm">
                3
              </span>
              <h3 className="font-bold text-white text-base">Conversa no WhatsApp</h3>
              <p className="text-xs text-[#a6a6a1] leading-relaxed">
                Entramos em contato para alinhar os valores pretendidos e as condições com total
                clareza.
              </p>
            </div>

            <div className="bg-[#151515] p-5 rounded-2xl border border-[#c9a44c]/20 space-y-2">
              <span className="w-8 h-8 rounded-lg bg-[#202020] border border-[#c9a44c]/30 text-[#e3c56c] font-extrabold flex items-center justify-center text-sm">
                4
              </span>
              <h3 className="font-bold text-white text-base">Divulgação e Venda</h3>
              <p className="text-xs text-[#a6a6a1] leading-relaxed">
                A moto pode ser divulgada aos clientes interessados para concretizar o negócio.
              </p>
            </div>
          </div>
        </div>

        {/* Lead Capture Form Card */}
        <div className="bg-[#151515] rounded-3xl border border-[#c9a44c]/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden max-w-3xl mx-auto">
          <div className="p-6 sm:p-8 bg-[#0d0d0d] border-b border-[#c9a44c]/20 space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-white font-heading">
              Formulário para envio da sua moto
            </h2>
            <p className="text-sm text-[#a6a6a1]">
              Preencha os campos abaixo. Entraremos em contato pelo WhatsApp para detalhar os
              próximos passos.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <AnunciarMotoForm />
          </div>

          {/* Transparent Notice Footer */}
          <div className="px-6 py-4 bg-[#0a0a0a] border-t border-[#c9a44c]/15 flex items-start gap-2.5 text-xs text-[#a6a6a1]">
            <Info className="w-4 h-4 text-[#e3c56c] shrink-0 mt-0.5" />
            <p>
              O envio do formulário não garante venda automática nem pagamento imediato. Valores e
              condições são combinados diretamente entre você e a AF Motos.
            </p>
          </div>
        </div>

        {/* Trust Differentials */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-center max-w-3xl mx-auto">
          <div className="space-y-2">
            <ShieldCheck className="w-8 h-8 text-[#e3c56c] mx-auto" />
            <h4 className="font-bold text-sm text-white">Negociação Transparente</h4>
            <p className="text-xs text-[#a6a6a1]">
              Você sabe exatamente as condições e o valor antes de qualquer decisão.
            </p>
          </div>
          <div className="space-y-2">
            <MessageCircle className="w-8 h-8 text-[#e3c56c] mx-auto" />
            <h4 className="font-bold text-sm text-white">Atendimento Direto</h4>
            <p className="text-xs text-[#a6a6a1]">
              Conversa pessoal e sem intermediários pelo WhatsApp.
            </p>
          </div>
          <div className="space-y-2">
            <FileCheck className="w-8 h-8 text-[#e3c56c] mx-auto" />
            <h4 className="font-bold text-sm text-white">Documentação Segura</h4>
            <p className="text-xs text-[#a6a6a1]">
              Orientação completa sobre a transferência e documentação da moto.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
