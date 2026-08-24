import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bike, Calendar, Gauge, Zap, ArrowUpRight } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { MotorcycleStatusBadge } from './motorcycle-status-badge';
import { formatCurrency } from '@/lib/utils/format';
import { CONSTANTS } from '@/lib/utils/constants';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';

import { cn } from '@/lib/utils';

export interface MotorcycleCardData {
  id: string;
  slug: string;
  brand: string;
  model: string;
  version?: string | null;
  year_manufacture: number;
  year_model: number;
  price: number | null;
  previous_price?: number | null;
  mileage: number | null;
  engine_capacity: number | null;
  status: string;
  image_url?: string;
  differentials?: string[] | null;
}

export interface MotorcycleCardProps {
  motorcycle: MotorcycleCardData;
  whatsappPhone?: string;
}

export function MotorcycleCard({ motorcycle, whatsappPhone }: MotorcycleCardProps) {
  const isSold = motorcycle.status?.toUpperCase() === 'SOLD';

  const whatsappMessage = `Olá! Tenho interesse na ${motorcycle.brand} ${motorcycle.model} ${motorcycle.year_model}${motorcycle.price ? ` (R$ ${motorcycle.price.toLocaleString('pt-BR')})` : ''} anunciada no site da AF Motos. Poderia me passar mais detalhes?`;

  const whatsappUrl = generateWhatsAppLink(whatsappPhone, whatsappMessage);

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl bg-[#151515] border shadow-sm w-full h-full transition-all duration-200',
        isSold
          ? 'border-zinc-800/80 hover:border-zinc-700/80'
          : 'group border-[#c9a44c]/20 hover:border-[#e3c56c]/60 hover:shadow-[0_0_25px_rgba(201,164,76,0.15)] active:scale-[0.98] sm:duration-300',
      )}
    >
      {/* Top Image Container */}
      {isSold ? (
        <div className="block relative w-full aspect-[16/10] sm:aspect-[16/9] bg-[#0a0a0a] overflow-hidden">
          {motorcycle.image_url ? (
            <>
              <div className="absolute inset-0 animate-pulse bg-zinc-800/50" />
              <Image
                src={motorcycle.image_url}
                alt={`${motorcycle.brand} ${motorcycle.model}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover relative z-10"
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d0d] text-[#a6a6a1] gap-2 p-4 z-10">
              <Bike className="w-8 h-8 opacity-40 text-zinc-600" />
              <span className="text-xs font-medium">Foto indisponível</span>
            </div>
          )}

          {/* Top Floating Status Badge */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none">
            <MotorcycleStatusBadge
              status={motorcycle.status}
              className="backdrop-blur-md bg-black/70 border-zinc-700/50 text-white shadow-lg"
            />
          </div>

          {/* Gradiente escuro na base da imagem */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#151515] to-transparent z-20 pointer-events-none" />
        </div>
      ) : (
        <Link
          href={`/motos/${motorcycle.slug}`}
          className="block relative w-full aspect-[16/10] sm:aspect-[16/9] bg-[#0a0a0a] overflow-hidden focus-visible:outline-none cursor-pointer"
          aria-label={`Ver detalhes de ${motorcycle.brand} ${motorcycle.model}`}
        >
          {motorcycle.image_url ? (
            <>
              {/* Placeholder esqueleto para loading progressivo */}
              <div className="absolute inset-0 animate-pulse bg-zinc-800/50" />
              <Image
                src={motorcycle.image_url}
                alt={`${motorcycle.brand} ${motorcycle.model}`}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover relative z-10 transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d0d] text-[#a6a6a1] gap-2 p-4 z-10">
              <Bike className="w-8 h-8 opacity-40 text-[#c9a44c]" />
              <span className="text-xs font-medium">Foto indisponível</span>
            </div>
          )}

          {/* Top Floating Status Badge */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none">
            <MotorcycleStatusBadge
              status={motorcycle.status}
              className="backdrop-blur-md bg-black/70 border-zinc-700/50 text-white shadow-lg"
            />
          </div>

          {/* Gradiente escuro na base da imagem */}
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#151515] to-transparent z-20 pointer-events-none" />
        </Link>
      )}

      {/* Card Body */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
        {/* Cabeçalho */}
        <div>
          <span className="block text-[11px] text-zinc-400 font-semibold tracking-wider uppercase mb-0.5">
            {motorcycle.brand}
          </span>
          {isSold ? (
            <h3 className="text-base font-bold text-white line-clamp-1 leading-tight flex items-center gap-1.5 flex-wrap">
              {motorcycle.model}
              {motorcycle.version ? (
                <span className="font-normal text-zinc-400 text-sm whitespace-nowrap">
                  {motorcycle.version}
                </span>
              ) : null}
            </h3>
          ) : (
            <Link
              href={`/motos/${motorcycle.slug}`}
              className="block focus-visible:outline-none group/title cursor-pointer"
              aria-label={`Ver detalhes de ${motorcycle.brand} ${motorcycle.model}`}
            >
              <h3 className="text-base font-bold text-white group-hover/title:text-[#e3c56c] group-hover:text-[#e3c56c] transition-colors line-clamp-1 leading-tight flex items-center gap-1.5 flex-wrap">
                {motorcycle.model}
                {motorcycle.version ? (
                  <span className="font-normal text-zinc-300 text-sm whitespace-nowrap">
                    {motorcycle.version}
                  </span>
                ) : null}
              </h3>
            </Link>
          )}
        </div>

        {/* Specs Linha Única Minimalista */}
        {isSold ? (
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[13px] text-zinc-400 font-medium">
            <div className="flex items-center gap-1.5" title="Ano">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>
                {motorcycle.year_manufacture}/{motorcycle.year_model}
              </span>
            </div>
            <span className="text-zinc-700 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5" title="Quilometragem">
              <Gauge className="w-3.5 h-3.5 text-zinc-500" />
              <span>
                {motorcycle.mileage != null
                  ? `${motorcycle.mileage.toLocaleString('pt-BR')} km`
                  : '0 km'}
              </span>
            </div>
            <span className="text-zinc-700 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5" title="Motor">
              <Zap className="w-3.5 h-3.5 text-zinc-500" />
              <span>{motorcycle.engine_capacity ? `${motorcycle.engine_capacity}cc` : 'Flex'}</span>
            </div>
          </div>
        ) : (
          <Link
            href={`/motos/${motorcycle.slug}`}
            className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[13px] text-zinc-300 font-medium cursor-pointer focus-visible:outline-none"
          >
            <div className="flex items-center gap-1.5" title="Ano">
              <Calendar className="w-3.5 h-3.5 text-zinc-500" />
              <span>
                {motorcycle.year_manufacture}/{motorcycle.year_model}
              </span>
            </div>
            <span className="text-zinc-700 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5" title="Quilometragem">
              <Gauge className="w-3.5 h-3.5 text-zinc-500" />
              <span>
                {motorcycle.mileage != null
                  ? `${motorcycle.mileage.toLocaleString('pt-BR')} km`
                  : '0 km'}
              </span>
            </div>
            <span className="text-zinc-700 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5" title="Motor">
              <Zap className="w-3.5 h-3.5 text-zinc-500" />
              <span>{motorcycle.engine_capacity ? `${motorcycle.engine_capacity}cc` : 'Flex'}</span>
            </div>
          </Link>
        )}

        {/* Preço e Call To Action */}
        <div className="pt-2 mt-auto flex flex-col gap-3">
          {/* Preço */}
          {isSold ? (
            <div className="flex items-end gap-1.5">
              <span className="text-lg font-extrabold text-zinc-300 tracking-tight leading-none">
                {motorcycle.price ? formatCurrency(motorcycle.price) : 'Vendido'}
              </span>
            </div>
          ) : (
            <Link href={`/motos/${motorcycle.slug}`} className="block cursor-pointer">
              <div className="flex items-end gap-1.5">
                <span className="text-lg font-extrabold text-amber-400 tracking-tight leading-none">
                  {motorcycle.price ? formatCurrency(motorcycle.price) : 'Consulte'}
                </span>
                {motorcycle.price && motorcycle.price < 500 && motorcycle.status === 'RENTED' && (
                  <span className="text-xs text-zinc-400 font-medium pb-0.5">/dia</span>
                )}
              </div>
            </Link>
          )}

          {isSold ? (
            <div className="w-full py-2.5 px-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-center text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-center gap-2 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" />
              <span>Venda Concluída</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full">
              {/* Botão Secundário: Detalhes */}
              <Link
                href={`/motos/${motorcycle.slug}`}
                title="Ver detalhes da moto"
                aria-label={`Ver detalhes de ${motorcycle.brand} ${motorcycle.model}`}
                className="flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-xl bg-[#202020] border border-[#c9a44c]/20 hover:bg-[#c9a44c] hover:text-black active:scale-[0.98] text-[#e3c56c] transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3c56c] cursor-pointer"
              >
                <ArrowUpRight className="w-5 h-5" />
              </Link>

              {/* Botão Primário: WhatsApp */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm transition-all duration-100 sm:duration-200 shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#151515] cursor-pointer"
              >
                <WhatsAppIcon className="w-5 h-5 fill-current" />
                <span className="truncate">WhatsApp</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
