import React from 'react';
import { RentalForm } from '@/components/forms/rental-form';
import {
  Bike,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Wrench,
  CreditCard,
  Zap,
  Info,
} from 'lucide-react';

export const metadata = {
  title: 'Aluguel de Motos | AF Motos',
  description:
    'Aluguel de motos com a AF Motos. Planos para uso diário, semanal ou mensal com condições combinadas diretamente pelo WhatsApp.',
};

export default function AluguelPage() {
  return (
    <div className="bg-[#050505] min-h-screen pb-16 text-[#f4f4f2]">
      {/* Header Hero */}
      <div className="bg-[#0d0d0d] text-white py-12 md:py-16 border-b border-[#c9a44c]/20">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151515] border border-[#c9a44c]/30 text-xs font-bold text-[#e3c56c]">
            <Bike className="w-4 h-4 text-[#e3c56c]" />
            <span>Aluguel Simples e Direto</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-heading">
            Aluguel de Motos
          </h1>

          <p className="text-base md:text-lg text-[#a6a6a1] leading-relaxed">
            Motos para alugar para trabalho ou dia a dia. Converse diretamente com a AF Motos pelo
            WhatsApp para consultar os modelos e condições disponíveis.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 max-w-5xl space-y-12">
        {/* Rental Plans Grid */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
              Opções de Período
            </h2>
            <p className="text-[#a6a6a1] text-sm mt-1">
              Valores e disponibilidade combinados diretamente com você.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plan 1 */}
            <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-xs space-y-4 flex flex-col justify-between hover:border-[#c9a44c]/40 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#c9a44c]/30 text-white flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5 text-[#e3c56c]" />
                </div>
                <h3 className="font-extrabold text-xl text-white">Diária</h3>
                <p className="text-xs text-[#a6a6a1] leading-relaxed">
                  Para necessidades pontuais, compromissos rápidos ou viagens curtas.
                </p>
                <ul className="space-y-2 text-xs font-semibold text-[#f4f4f2] pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#e3c56c] shrink-0" />
                    <span>Retirada combinada</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#e3c56c] shrink-0" />
                    <span>Período flexível</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Plan 2 */}
            <div className="bg-[#151515] p-6 rounded-2xl border-2 border-[#c9a44c] shadow-[0_0_20px_rgba(201,164,76,0.15)] space-y-4 flex flex-col justify-between relative">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#c9a44c] text-black flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-xl text-white">Semanal</h3>
                <p className="text-xs text-[#a6a6a1] leading-relaxed">
                  Ideal para períodos de teste ou necessidades temporárias de locomoção.
                </p>
                <ul className="space-y-2 text-xs font-semibold text-[#f4f4f2] pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#e3c56c] shrink-0" />
                    <span>Condição combinada por semana</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#e3c56c] shrink-0" />
                    <span>Suporte direto no WhatsApp</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Plan 3 */}
            <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-xs space-y-4 flex flex-col justify-between hover:border-[#c9a44c]/40 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#c9a44c]/30 text-white flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5 text-[#e3c56c]" />
                </div>
                <h3 className="font-extrabold text-xl text-white">Mensal</h3>
                <p className="text-xs text-[#a6a6a1] leading-relaxed">
                  Para quem precisa de moto contínua para trabalho ou uso frequente no mês.
                </p>
                <ul className="space-y-2 text-xs font-semibold text-[#f4f4f2] pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#e3c56c] shrink-0" />
                    <span>Manutenção preventiva combinada</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#e3c56c] shrink-0" />
                    <span>Valores alinhados previamente</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements Bar */}
        <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          <div className="flex items-center gap-3 justify-start">
            <ShieldCheck className="w-6 h-6 text-[#e3c56c] shrink-0" />
            <div className="text-left">
              <h4 className="font-bold text-xs text-white">CNH Categoria A</h4>
              <p className="text-[11px] text-[#a6a6a1]">Habilitação válida para pilotar</p>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-start">
            <CreditCard className="w-6 h-6 text-[#e3c56c] shrink-0" />
            <div className="text-left">
              <h4 className="font-bold text-xs text-white">Caução Combinado</h4>
              <p className="text-[11px] text-[#a6a6a1]">Condições acordadas previamente</p>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-start">
            <Wrench className="w-6 h-6 text-[#e3c56c] shrink-0" />
            <div className="text-left">
              <h4 className="font-bold text-xs text-white">Motos Checadas</h4>
              <p className="text-[11px] text-[#a6a6a1]">Verificação prévia antes da entrega</p>
            </div>
          </div>
        </div>

        {/* Lead Capture Form Card */}
        <div className="bg-[#151515] rounded-3xl border border-[#c9a44c]/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden max-w-3xl mx-auto">
          <div className="p-6 sm:p-8 bg-[#0d0d0d] border-b border-[#c9a44c]/20 space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-white font-heading">
              Consultar Disponibilidade de Aluguel
            </h2>
            <p className="text-sm text-[#a6a6a1]">
              Informe o período e suas preferências. Entraremos em contato pelo WhatsApp para
              informar as opções ativas.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <RentalForm />
          </div>

          <div className="px-6 py-4 bg-[#0a0a0a] border-t border-[#c9a44c]/15 flex items-start gap-2.5 text-xs text-[#a6a6a1]">
            <Info className="w-4 h-4 text-[#e3c56c] shrink-0 mt-0.5" />
            <p>
              A disponibilidade de locação depende das motos ativas na loja no momento. Fale conosco
              para confirmar os modelos disponíveis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
