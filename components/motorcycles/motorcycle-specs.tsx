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
    'Documentação em dia',
    'Revisada quando necessário',
    'Pronta para transferência',
    'Visitação com agendamento',
  ];

  const highlights =
    motorcycle.differentials && motorcycle.differentials.length > 0
      ? motorcycle.differentials
      : defaultDifferentials;

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

      {/* 2. Technical Specs Grid */}
      <div className="bg-[#151515] rounded-2xl p-5 sm:p-6 border border-[#c9a44c]/20 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#c9a44c]/20">
          <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#e3c56c]" />
            Ficha Técnica
          </h3>
          <span className="text-xs text-[#a6a6a1] font-medium">Informações do veículo</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
          {specItems.map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl bg-[#0d0d0d] border border-[#c9a44c]/15 space-y-1"
            >
              <div className="flex items-center gap-1.5 text-xs text-[#a6a6a1] font-medium">
                {item.icon}
                <span>{item.label}</span>
              </div>
              <div className="text-sm font-extrabold text-[#f4f4f2] tabular-nums">{item.value}</div>
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
