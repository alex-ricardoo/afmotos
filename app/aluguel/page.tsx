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
  Sparkles,
} from 'lucide-react';

export const metadata = {
  title: 'Aluguel de Motocicletas | AF Locações e Vendas',
  description:
    'Alugue motos revisadas com planos diários, semanais e mensais. Manutenção inclusa, seguro e contratação descomplicada na AF Locações e Vendas.',
};

export default function AluguelPage() {
  return (
    <div className="bg-[#050505] min-h-screen pb-16 text-[#f4f4f2]">
      {/* Header Hero */}
      <div className="bg-[#0d0d0d] text-white py-12 md:py-16 border-b border-[#c9a44c]/20">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151515] border border-[#c9a44c]/30 text-xs font-bold text-[#e3c56c]">
            <Bike className="w-4 h-4 text-[#e3c56c]" />
            <span>Planos Flexíveis com Manutenção e Suporte Inclusos</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-heading">
            Aluguel de Motocicletas
          </h1>

          <p className="text-base md:text-lg text-[#a6a6a1] leading-relaxed">
            Motos revisadas e prontas para rodar na cidade, estrada ou trabalho. Liberdade sobre duas rodas com o respaldo da AF Locações e Vendas.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 max-w-5xl space-y-12">
        {/* Rental Plans Grid */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
              Escolha o Plano Ideal
            </h2>
            <p className="text-[#a6a6a1] text-sm mt-1">
              Condições transparentes adaptadas para o seu objetivo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plan 1 */}
            <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-xs space-y-4 flex flex-col justify-between hover:border-[#c9a44c]/40 transition-colors">
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#c9a44c]/30 text-white flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5 text-[#e3c56c]" />
                </div>
                <h3 className="font-extrabold text-xl text-white">Diário / Weekend</h3>
                <p className="text-xs text-[#a6a6a1] leading-relaxed">
                  Perfeito para viagens curtas, fins de semana ou testar um modelo antes de comprar.
                </p>
                <ul className="space-y-2 text-xs font-semibold text-[#f4f4f2] pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#e3c56c] shrink-0" />
                    <span>Quilometragem flexível</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#e3c56c] shrink-0" />
                    <span>Capacete e trava de segurança inclusos</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Plan 2 */}
            <div className="bg-[#151515] p-6 rounded-2xl border-2 border-[#c9a44c] shadow-[0_0_20px_rgba(201,164,76,0.15)] space-y-4 flex flex-col justify-between relative">
              <div className="absolute -top-3 right-4 px-2.5 py-0.5 bg-[#c9a44c] text-black text-[10px] font-extrabold uppercase tracking-wider rounded-full">
                Popular
              </div>
              <div className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-[#c9a44c] text-black flex items-center justify-center font-bold">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-xl text-white">Plano Semanal</h3>
                <p className="text-xs text-[#a6a6a1] leading-relaxed">
                  Flexibilidade máxima para compromissos temporários ou mobilidade urbana inteligente.
                </p>
                <ul className="space-y-2 text-xs font-semibold text-[#f4f4f2] pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#e3c56c] shrink-0" />
                    <span>Revisões preventivas inclusas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#e3c56c] shrink-0" />
                    <span>Suporte e assistência dedicada</span>
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
                <h3 className="font-extrabold text-xl text-white">Plano Mensal</h3>
                <p className="text-xs text-[#a6a6a1] leading-relaxed">
                  A melhor tarifa diária para quem precisa de um veículo para trabalho ou dia a dia contínuo.
                </p>
                <ul className="space-y-2 text-xs font-semibold text-[#f4f4f2] pt-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#e3c56c] shrink-0" />
                    <span>Troca de óleo e pneus inclusos</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#e3c56c] shrink-0" />
                    <span>Substituição de moto em manutenção</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Requirements & Guarantee Bar */}
        <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <ShieldCheck className="w-6 h-6 text-[#e3c56c] shrink-0" />
            <div>
              <h4 className="font-bold text-xs text-white">CNH Categoria A</h4>
              <p className="text-[11px] text-[#a6a6a1]">Válida e sem impedimentos</p>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <CreditCard className="w-6 h-6 text-[#e3c56c] shrink-0" />
            <div>
              <h4 className="font-bold text-xs text-white">Caução Facilitado</h4>
              <p className="text-[11px] text-[#a6a6a1]">Cartão de crédito ou PIX garantia</p>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-center sm:justify-start">
            <Wrench className="w-6 h-6 text-[#e3c56c] shrink-0" />
            <div>
              <h4 className="font-bold text-xs text-white">Motos 100% Revisadas</h4>
              <p className="text-[11px] text-[#a6a6a1]">Segurança mecânica certificada</p>
            </div>
          </div>
        </div>

        {/* Lead Capture Form Card */}
        <div className="bg-[#151515] rounded-3xl border border-[#c9a44c]/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden max-w-3xl mx-auto">
          <div className="p-6 sm:p-8 bg-[#0d0d0d] border-b border-[#c9a44c]/20 space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-white font-heading">
              Solicitar Orçamento de Locação
            </h2>
            <p className="text-sm text-[#a6a6a1]">
              Informe suas preferências de período e modelo para recebermos o contato.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <RentalForm />
          </div>
        </div>
      </div>
    </div>
  );
}
