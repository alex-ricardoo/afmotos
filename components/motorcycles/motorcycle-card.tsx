'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bike, Calendar, Gauge, Zap, ArrowUpRight, Share2, Sparkles, ShieldCheck } from 'lucide-react';
import { MotorcycleStatusBadge } from './motorcycle-status-badge';
import { formatCurrency } from '@/lib/utils/format';
import { cn } from '@/lib/utils';
import { MotorcycleShareDialog } from './motorcycle-share-dialog';
import { CONSTANTS } from '@/lib/utils/constants';
import { getSiteInitials } from '@/lib/site-settings';
import { PaymentMethods } from '@/components/ui/payment-methods';

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
  featured?: boolean | null;
  image_url?: string;
  differentials?: string[] | null;
}

export interface MotorcycleCardProps {
  motorcycle: MotorcycleCardData;
  whatsappPhone?: string;
  siteName?: string;
}

export function MotorcycleCard({ motorcycle, whatsappPhone, siteName }: MotorcycleCardProps) {
  const [shareOpen, setShareOpen] = useState(false);
  const isSold = motorcycle.status?.toUpperCase() === 'SOLD';
  const isFeatured = Boolean(motorcycle.featured) && !isSold;
  const storeName = siteName || CONSTANTS.STORE_NAME;
  const initials = getSiteInitials(storeName);

  return (
    <>
      <div
        className={cn(
          'relative flex flex-col overflow-hidden rounded-2xl bg-zinc-950 border shadow-sm w-full h-full transition-all duration-300',
          isSold
            ? 'border-zinc-800/80 hover:border-zinc-700/80'
            : isFeatured
              ? 'group border-amber-500/40 hover:border-amber-500/70 shadow-[0_0_20px_rgba(245,158,11,0.08)] active:scale-[0.98]'
              : 'group border-zinc-800/80 hover:border-zinc-700 hover:shadow-lg hover:shadow-black/50 active:scale-[0.98]',
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
                  alt={`${motorcycle.brand} ${motorcycle.model} ${motorcycle.year_model || ''} - ${storeName}`}
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
          <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-[#0a0a0a] overflow-hidden">
            <Link
              href={`/motos/${motorcycle.slug}`}
              className="block w-full h-full focus-visible:outline-none cursor-pointer"
              aria-label={`Ver detalhes de ${motorcycle.brand} ${motorcycle.model}`}
            >
              {motorcycle.image_url ? (
                <>
                  <div className="absolute inset-0 animate-pulse bg-zinc-800/50" />
                  <Image
                    src={motorcycle.image_url}
                    alt={`${motorcycle.brand} ${motorcycle.model} ${motorcycle.year_model || ''} à venda na ${storeName}`}
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
            </Link>

            {/* Top Floating Status + Featured Badge */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5 flex-wrap pointer-events-none">
              {isFeatured && (
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] text-zinc-950 font-black text-[10px] sm:text-[10.5px] uppercase tracking-wider shadow-lg shadow-amber-500/30 border border-amber-300/40">
                  <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-zinc-950 text-zinc-950 shrink-0" />
                  <span>Destaque</span>
                </div>
              )}
              {motorcycle.status && motorcycle.status.toUpperCase() !== 'AVAILABLE' && (
                <MotorcycleStatusBadge
                  status={motorcycle.status}
                  className="backdrop-blur-md bg-black/75 border-zinc-700/60 text-white shadow-lg"
                />
              )}
            </div>

            {/* Floating Share Button on Card Image */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShareOpen(true);
              }}
              title="Compartilhar esta moto"
              aria-label="Compartilhar esta moto"
              className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-white/10 flex items-center justify-center backdrop-blur-md transition-all shadow-md cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            {/* Gradiente escuro na base da imagem */}
            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#151515] to-transparent z-20 pointer-events-none" />
          </div>
        )}

        {/* Card Body */}
        <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between space-y-3">
          {/* Cabeçalho */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="block text-[11px] text-zinc-400 font-semibold tracking-wider uppercase">
                {motorcycle.brand}
              </span>
            </div>
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

          {/* Specs Linha Única */}
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
            {/* Mini badge de garantia e histórico harmonizados */}
            {!isSold && (
              <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                  <span>Histórico Verificado</span>
                </span>
                <span className="text-zinc-400">Garantia 90 dias</span>
              </div>
            )}
            {/* Preço */}
            {isSold ? (
              <div className="flex items-end gap-1.5">
                <span className="text-xl font-extrabold text-zinc-300 tracking-tight leading-none">
                  {motorcycle.price ? formatCurrency(motorcycle.price) : 'Vendido'}
                </span>
              </div>
            ) : (
              <Link href={`/motos/${motorcycle.slug}`} className="block cursor-pointer">
                <div className="flex items-end gap-1.5">
                  <span className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight leading-none">
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
              <>
                <PaymentMethods variant="compact" className="mb-0.5" />
                <div className="flex items-center gap-2 w-full pt-1">
                  {/* Botão Secundário: Compartilhar */}
                  <button
                    type="button"
                    onClick={() => setShareOpen(true)}
                    title="Compartilhar esta moto"
                    aria-label={`Compartilhar ${motorcycle.brand} ${motorcycle.model}`}
                    className="flex items-center justify-center w-10 h-10 flex-shrink-0 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 active:scale-[0.98] text-zinc-400 hover:text-white transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  {/* Botão Primário: Ver Detalhes */}
                  <Link
                    href={`/motos/${motorcycle.slug}`}
                    title="Ver detalhes da moto"
                    aria-label={`Ver detalhes de ${motorcycle.brand} ${motorcycle.model}`}
                    className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold text-sm transition-all duration-200 shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 cursor-pointer group/btn"
                  >
                    <span>Ver Detalhes</span>
                    <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Share Dialog */}
      <MotorcycleShareDialog
        motorcycle={motorcycle}
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        whatsappPhone={whatsappPhone}
      />
    </>
  );
}
