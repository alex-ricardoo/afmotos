import React from 'react';
import {
  Calendar,
  Gauge,
  Zap,
  Fuel,
  Settings2,
  Palette,
  Hash,
  ShieldCheck,
  CheckCircle2,
  FileText,
  FileCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MotorcycleSpecsProps {
  motorcycle: {
    brand: string;
    model: string;
    version?: string | null;
    year_manufacture: number;
    year_model: number;
    mileage?: number | null;
    engine_capacity?: number | null;
    fuel?: string | null;
    fuel_type?: string | null;
    transmission?: string | null;
    color?: string | null;
    plate_end?: string | null;
    license_plate?: string | null;
    differentials?: string[] | null;
    description?: string | null;
  };
}

export function MotorcycleSpecs({ motorcycle }: MotorcycleSpecsProps) {
  const plateEndDigit =
    motorcycle.plate_end || (motorcycle.license_plate ? motorcycle.license_plate.slice(-1) : null);
  const fuelValue = motorcycle.fuel || motorcycle.fuel_type || 'Gasolina / Flex';
  const transmissionValue = motorcycle.transmission || 'Manual 6 velocidades';

  const defaultDifferentials = [
    "Histórico Veicular 100% verificado",
    "Documentação 100% regularizada",
    "IPVA pago",
    "Totalmente revisada",
    "Óleo e filtros revisados",
    "Pneus em ótimo estado",
    "Motor e câmbio com garantia de 90 dias",
    "Moto pronta para rodar",
  ];

  const highlights = defaultDifferentials; // Override para padronizar os selos de valor

  const specItems = [
    {
      icon: <Calendar className="w-4 h-4 text-[#e3c56c]" />,
      label: 'Ano / Modelo',
      value: `${motorcycle.year_manufacture} / ${motorcycle.year_model}`,
    },
    {
      icon: <Gauge className="w-4 h-4 text-[#e3c56c]" />,
      label: 'Quilometragem',
      value:
        motorcycle.mileage !== null && motorcycle.mileage !== undefined
          ? `${motorcycle.mileage.toLocaleString('pt-BR')} km`
          : '0 km',
    },
    {
      icon: <Zap className="w-4 h-4 text-[#e3c56c]" />,
      label: 'Cilindrada',
      value: motorcycle.engine_capacity ? `${motorcycle.engine_capacity} cc` : 'Sob Consulta',
    },
    {
      icon: <Fuel className="w-4 h-4 text-[#e3c56c]" />,
      label: 'Combustível',
      value: fuelValue,
    },
    {
      icon: <Settings2 className="w-4 h-4 text-[#e3c56c]" />,
      label: 'Câmbio',
      value: transmissionValue,
    },
    {
      icon: <Palette className="w-4 h-4 text-[#e3c56c]" />,
      label: 'Cor Principal',
      value: motorcycle.color || 'Original',
    },
    {
      icon: <Hash className="w-4 h-4 text-[#e3c56c]" />,
      label: 'Final da Placa',
      value: plateEndDigit ? `Final ${plateEndDigit}` : 'Consultar',
    },
    {
      icon: <ShieldCheck className="w-4 h-4 text-[#e3c56c]" />,
      label: 'Documentação',
      value: 'Regularizada',
    },
  ];

  return (
    <div className="space-y-8">
      {/* 1. Differentials & Seals */}
      <div className="bg-[#151515] rounded-2xl p-5 sm:p-6 border border-[#c9a44c]/20 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#b8bcc2] flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[#e3c56c]" />
          Destaques Desta Moto
        </h3>

        <div className="flex flex-wrap gap-2 pt-1">
          {highlights.map((diff, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#202020] border border-[#c9a44c]/20 text-xs font-semibold text-[#f4f4f2]"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#e3c56c] shrink-0" />
              {diff}
            </span>
          ))}
        </div>
      </div>

      {/* Trust Banner: Histórico Veicular Garantido */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-[#151515] to-amber-500/10 border border-emerald-500/30 flex items-start sm:items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-sm font-bold text-white flex items-center gap-2 flex-wrap">
            <span>Procedência & Histórico Veicular Verificados</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wider">
              Padrão AF Motos
            </span>
          </h4>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Todas as motos da <strong>AF Motos</strong> passam por consulta oficial completa de histórico veicular (Nada Consta em Leilão, Roubo/Furto, Sinistro e Gravames). Compre com segurança e procedência garantida.
          </p>
        </div>
      </div>

      {/* 2. Technical Specs Grid */}
      <div className="bg-[#151515] rounded-2xl p-5 sm:p-6 border border-[#c9a44c]/20 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#c9a44c]/20">
          <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#e3c56c]" />
            Ficha Técnica
          </h3>
          <span className="text-xs text-[#a6a6a1] font-medium">Informações do veículo</span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 pt-1 divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/80 border border-zinc-800/80 rounded-xl overflow-hidden">
          {specItems.map((item, idx) => (
            <div
              key={idx}
              className={cn(
                "p-4 space-y-1 bg-[#101010]/50 hover:bg-[#151515] transition-colors",
                // Manually add horizontal dividers on mobile that isn't handled by divide-y (if using more than 1 col, divide-y only affects rows, but grid-cols-2 needs both)
                // Wait, divide-x and divide-y on a grid can be tricky. It's better to use explicit borders or just gap.
                // Or flex? No, let's just use borders on the items.
                "border-zinc-800/80",
                idx % 2 !== 0 ? "border-l" : "", // inner vertical line on mobile
                idx > 1 ? "border-t" : "", // inner horizontal line on mobile
                "lg:border-0 lg:border-r lg:last:border-r-0 lg:border-b-0" // override for desktop
              )}
            >
              <div className="flex items-center gap-2 text-xs text-[#a6a6a1] font-medium">
                {item.icon}
                <span>{item.label}</span>
              </div>
              <div className="text-sm font-bold text-[#f4f4f2] tabular-nums capitalize">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Description & Editorial text */}
      {motorcycle.description && (
        <div className="bg-[#151515] rounded-2xl p-5 sm:p-6 border border-[#c9a44c]/20 shadow-xs space-y-3">
          <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2 pb-3 border-b border-[#c9a44c]/20">
            <FileCheck className="w-4 h-4 text-[#e3c56c]" />
            Observações da Moto
          </h3>
          <div className="text-sm text-[#b8bcc2] leading-relaxed space-y-3 pt-1">
            {motorcycle.description
              .split('\n')
              .filter(Boolean)
              .map((paragraph: string, idx: number) => (
                <p key={idx}>{paragraph}</p>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
