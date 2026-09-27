import React from 'react';
import Link from 'next/link';
import { ShieldCheck, FileText, Download, Printer, ExternalLink } from 'lucide-react';
import { Sale } from '@/types/database';
import { getWarrantyInfo } from '@/lib/warranty/calculator';
import { formatDate } from '@/lib/utils/formatters';
import { buttonVariants } from '@/components/ui/button';

interface MotorcycleWarrantyCardProps {
  sale: Sale;
}

export function MotorcycleWarrantyCard({ sale }: MotorcycleWarrantyCardProps) {
  if (sale.is_repasse) {
    return null;
  }

  const warranty = getWarrantyInfo(sale);

  return (
    <div className="bg-zinc-950/70 border border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-[#c9a44c]/10 border border-[#c9a44c]/30 flex items-center justify-center text-[#e3c56c]">
            <ShieldCheck className="w-5 h-5 text-[#e3c56c]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Garantia Comercial
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${warranty.badgeClass}`}
              >
                {warranty.label}
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Controle de cobertura de 3 meses-calendário da venda
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/vendas/${sale.id}/recibo`}
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'h-8 rounded-xl text-xs font-bold border-[#c9a44c]/30 text-[#e3c56c] hover:bg-[#c9a44c]/10 gap-1.5',
            })}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Recibo A4</span>
          </Link>

          <a
            href={`/api/admin/sales/${sale.id}/receipt`}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'h-8 rounded-xl text-xs text-zinc-300 hover:text-white border-zinc-800 gap-1.5',
            })}
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </a>
        </div>
      </div>

      {warranty.status === 'AWAITING_ISSUANCE' ? (
        <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-4 text-xs space-y-2">
          <div className="text-zinc-300 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-zinc-500 animate-pulse" />
            Garantia será definida na primeira emissão do contrato
          </div>
          <p className="text-zinc-400 leading-relaxed text-[11px]">
            A criação da venda e a pré-visualização HTML não iniciam a garantia. O prazo de 3 meses-calendário é fixado automaticamente no momento em que o PDF do contrato/recibo é emitido pela primeira vez.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-zinc-900/50 border border-zinc-800/70 rounded-2xl p-3.5">
            <span className="text-[11px] font-semibold text-zinc-400 block uppercase tracking-wider">
              Início / 1ª Emissão
            </span>
            <span className="text-sm font-bold text-white font-mono mt-0.5 block">
              {warranty.formattedIssuedAt || '-'}
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">Data do contrato</span>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/70 rounded-2xl p-3.5">
            <span className="text-[11px] font-semibold text-zinc-400 block uppercase tracking-wider">
              Válida Até (inclusive)
            </span>
            <span className="text-sm font-bold text-[#e3c56c] font-mono mt-0.5 block">
              {warranty.formattedEndsAt || '-'}
            </span>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Último dia coberto
            </span>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/70 rounded-2xl p-3.5">
            <span className="text-[11px] font-semibold text-zinc-400 block uppercase tracking-wider">
              Situação Atual
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-sm font-bold text-white">
                {warranty.status === 'UNDER_WARRANTY' && 'Ativa'}
                {warranty.status === 'EXPIRING_SOON' && 'Vencendo logo'}
                {warranty.status === 'EXPIRED' && 'Encerrada'}
              </span>
              {warranty.daysRemaining !== null && warranty.daysRemaining >= 0 && (
                <span className="text-xs font-mono font-bold text-[#e3c56c]">
                  ({warranty.daysRemaining} {warranty.daysRemaining === 1 ? 'dia' : 'dias'})
                </span>
              )}
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Comprador: {sale.buyer_name || 'Não informado'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
