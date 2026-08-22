import Image from 'next/image';
import Link from 'next/link';
import { Zap, ArrowUpRight, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { MotorcycleStatusBadge, MotorcycleStatus } from './motorcycle-status-badge';
import { formatCurrency } from '@/lib/utils/format';

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
}

export function MotorcycleCard({ motorcycle }: MotorcycleCardProps) {
  return (
    <Link
      href={`/motos/${motorcycle.slug}`}
      className="block h-full group focus-visible:outline-none"
    >
      <Card className="overflow-hidden rounded-2xl bg-[#151515] border-[#c9a44c]/20 group-hover:border-[#e3c56c]/60 group-hover:shadow-[0_0_25px_rgba(201,164,76,0.18)] transition-all duration-300 h-full flex flex-col justify-between">
        {/* Image Container with 16:10 aspect ratio */}
        <div className="relative aspect-[16/10] overflow-hidden bg-[#050505]">
          {motorcycle.image_url ? (
            <Image
              src={motorcycle.image_url}
              alt={`${motorcycle.brand} ${motorcycle.model} ${motorcycle.year_model}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#0d0d0d] text-[#71717a] gap-1">
              <Zap className="w-8 h-8 opacity-40 text-[#c9a44c]" />
              <span className="text-xs font-medium">Foto em preparação</span>
            </div>
          )}

          {/* Top Floating Badges */}
          <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between gap-1 pointer-events-none z-10">
            {/* Origin badge if available */}
            {motorcycle.differentials && motorcycle.differentials.length > 0 ? (
              <span className="px-2 py-0.5 rounded-md bg-[#050505]/85 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider border border-white/10 shadow-xs">
                {motorcycle.differentials[0]}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-md bg-[#050505]/85 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider border border-[#c9a44c]/30 shadow-xs flex items-center gap-1">
                <Shield className="w-3 h-3 text-[#e3c56c]" />
                Laudo Aprovado
              </span>
            )}

            <MotorcycleStatusBadge
              status={motorcycle.status as MotorcycleStatus}
            />
          </div>

          {/* Gradient Overlay for card contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>

        {/* Card Body */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
          <div>
            {/* Brand Header */}
            <div className="text-[11px] uppercase tracking-wider font-extrabold text-[#c9a44c] mb-0.5">
              {motorcycle.brand}
            </div>

            {/* Model & Version */}
            <h3 className="font-extrabold text-base sm:text-lg leading-snug text-white group-hover:text-[#e3c56c] transition-colors line-clamp-1">
              {motorcycle.model}
            </h3>
            <p className="text-xs text-[#a6a6a1] line-clamp-1 mt-0.5 font-medium">
              {motorcycle.version || 'Edição Especial'}
            </p>
          </div>

          {/* Specs Row / Chips */}
          <div className="grid grid-cols-3 gap-1.5 py-2.5 px-3 bg-[#0d0d0d] rounded-xl text-center text-xs font-semibold text-[#f4f4f2] border border-[#c9a44c]/15">
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-[#a6a6a1] uppercase font-medium">
                Ano
              </span>
              <span className="tabular-nums">
                {motorcycle.year_manufacture}/{motorcycle.year_model}
              </span>
            </div>
            <div className="flex flex-col items-center border-x border-[#c9a44c]/15 px-1">
              <span className="text-[10px] text-[#a6a6a1] uppercase font-medium">
                KM
              </span>
              <span className="tabular-nums">
                {motorcycle.mileage !== null && motorcycle.mileage !== undefined
                  ? `${motorcycle.mileage.toLocaleString('pt-BR')} km`
                  : '0 km'}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-[#a6a6a1] uppercase font-medium">
                Motor
              </span>
              <span className="tabular-nums">
                {motorcycle.engine_capacity
                  ? `${motorcycle.engine_capacity}cc`
                  : 'Flex'}
              </span>
            </div>
          </div>

          {/* Price & Action Footer */}
          <div className="pt-2 border-t border-[#c9a44c]/20 flex items-end justify-between">
            <div>
              {motorcycle.previous_price && (
                <span className="text-xs line-through text-[#71717a] block font-medium tabular-nums">
                  {formatCurrency(motorcycle.previous_price)}
                </span>
              )}
              <div className="text-lg sm:text-xl font-black text-[#e3c56c] tabular-nums tracking-tight">
                {motorcycle.price
                  ? formatCurrency(motorcycle.price)
                  : 'Consulte'}
              </div>
            </div>

            <div className="w-8 h-8 rounded-full bg-[#202020] border border-[#c9a44c]/30 group-hover:bg-[#c9a44c] group-hover:text-black flex items-center justify-center text-[#e3c56c] transition-all duration-300 shadow-xs">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
