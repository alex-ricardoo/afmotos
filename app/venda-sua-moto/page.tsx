import React from 'react';
import { SellForm } from '@/components/forms/sell-form';
import {
  Banknote,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Clock,
  Sparkles,
  FileCheck,
  SearchCheck,
  CreditCard,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: 'Venda Sua Moto | AF Locações e Vendas',
  description:
    'Venda sua moto com pagamento imediato via PIX, avaliação justa por placa e transferência rápida sem burocracia na AF Locações e Vendas.',
};

export default function VendaSuaMotoPage() {
  return (
    <div className="bg-[#050505] min-h-screen pb-16 text-[#f4f4f2]">
      {/* Header Hero */}
      <div className="bg-[#0d0d0d] text-white py-12 md:py-16 border-b border-[#c9a44c]/20">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151515] border border-[#c9a44c]/30 text-xs font-bold text-[#e3c56c]">
            <Zap className="w-4 h-4 text-[#e3c56c]" />
            <span>Avaliação Rápida & Pagamento à Vista via PIX</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-heading">
            Venda Sua Moto com Segurança
          </h1>

          <p className="text-base md:text-lg text-[#a6a6a1] leading-relaxed">
            Compramos sua moto com avaliação transparente baseada no mercado real. Sem intermediários, sem riscos e com PIX na conta no mesmo dia.
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
            <h3 className="font-extrabold text-lg text-white">Preencha a Placa</h3>
            <p className="text-sm text-[#a6a6a1] leading-relaxed">
              Informe a placa da sua moto para preenchimento automático das informações de marca, modelo e ano.
            </p>
          </div>

          <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-xs space-y-3 relative hover:border-[#c9a44c]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#202020] border border-[#c9a44c]/30 text-[#e3c56c] flex items-center justify-center font-black text-sm">
              02
            </div>
            <h3 className="font-extrabold text-lg text-white">Receba a Proposta</h3>
            <p className="text-sm text-[#a6a6a1] leading-relaxed">
              Nossa equipe de consultores analisa o mercado e envia uma proposta justa diretamente pelo WhatsApp.
            </p>
          </div>

          <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-xs space-y-3 relative hover:border-[#c9a44c]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
              03
            </div>
            <h3 className="font-extrabold text-lg text-white">PIX na Conta</h3>
            <p className="text-sm text-[#a6a6a1] leading-relaxed">
              Após vistoria rápida presencial ou por vídeo, o pagamento é transferido e cuidamos de toda a documentação.
            </p>
          </div>
        </div>

        {/* Lead Capture Form Card */}
        <div className="bg-[#151515] rounded-3xl border border-[#c9a44c]/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] overflow-hidden max-w-3xl mx-auto">
          <div className="p-6 sm:p-8 bg-[#0d0d0d] border-b border-[#c9a44c]/20 space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight text-white font-heading">
              Formulário de Avaliação Gratuita
            </h2>
            <p className="text-sm text-[#a6a6a1]">
              Preencha os campos abaixo. Não cobramos nenhuma taxa para avaliar seu veículo.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <SellForm />
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 text-center">
          <div className="space-y-2">
            <ShieldCheck className="w-8 h-8 text-[#e3c56c] mx-auto" />
            <h4 className="font-bold text-sm text-white">Segurança Jurídica</h4>
            <p className="text-xs text-[#a6a6a1]">
              Contrato formal e transferência imediata de responsabilidade
            </p>
          </div>
          <div className="space-y-2">
            <CreditCard className="w-8 h-8 text-[#e3c56c] mx-auto" />
            <h4 className="font-bold text-sm text-white">Pagamento Instantâneo</h4>
            <p className="text-xs text-[#a6a6a1]">
              Receba via PIX na sua conta assim que aprovada a vistoria
            </p>
          </div>
          <div className="space-y-2">
            <FileCheck className="w-8 h-8 text-[#e3c56c] mx-auto" />
            <h4 className="font-bold text-sm text-white">Zero Burocracia</h4>
            <p className="text-xs text-[#a6a6a1]">
              Nossa equipe cuida de todo o processo de despachante e cartório
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
