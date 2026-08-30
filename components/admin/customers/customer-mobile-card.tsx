'use client';

import React from 'react';
import Link from 'next/link';
import { CustomerWithRelationshipCounts } from '@/types/customer';
import { CustomerStatusBadge } from './customer-status-badge';
import { CustomerSourceBadge } from './customer-source-badge';
import { maskCpf, formatPhone } from '@/lib/utils/customer-normalizers';
import { formatDate } from '@/lib/utils/formatters';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Phone,
  MessageCircle,
  Eye,
  Edit,
  Receipt,
  Tag,
  KeyRound,
  Calendar,
} from 'lucide-react';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';

interface CustomerMobileCardProps {
  customer: CustomerWithRelationshipCounts;
}

export function CustomerMobileCard({ customer }: CustomerMobileCardProps) {
  const rel = customer.relationships;
  const waLink = generateWhatsAppLink(
    customer.whatsapp || customer.phone,
    `Olá ${customer.full_name}, tudo bem? Aqui é da AF Motos.`,
  );

  return (
    <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-4.5 shadow-sm space-y-3.5 hover:border-[#c9a44c]/40 transition-colors">
        {/* Top Header: Avatar + Name + Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center text-[#e3c56c] font-bold text-xs shrink-0 shadow-xs">
              {customer.full_name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase() || 'CL'}
            </div>
            <div>
              <Link
                href={`/admin/clientes/${customer.id}`}
                className="font-bold text-sm text-white hover:text-[#e3c56c] transition-colors leading-tight line-clamp-1"
              >
                {customer.full_name}
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-zinc-400 font-mono">
                  {maskCpf(customer.cpf)}
                </span>
                <span className="text-zinc-600 text-xs">•</span>
                <span className="text-[11px] text-zinc-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(customer.created_at)}
                </span>
              </div>
            </div>
          </div>
          <CustomerStatusBadge isActive={customer.is_active} />
        </div>

        {/* Contact Info & Source */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-900/60 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Phone className="w-3.5 h-3.5 text-zinc-500" />
            <span className="font-medium">{formatPhone(customer.phone)}</span>
          </div>
          <CustomerSourceBadge source={customer.source} />
        </div>

        {/* Relationships badges */}
        {rel && rel.total_relationships > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {rel.sales_count > 0 && (
              <Badge
                variant="secondary"
                className="bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 text-[10px] gap-1 px-1.5 py-0.5"
              >
                <Receipt className="w-2.5 h-2.5" />
                {rel.sales_count} {rel.sales_count === 1 ? 'venda' : 'vendas'}
              </Badge>
            )}
            {rel.sell_requests_count > 0 && (
              <Badge
                variant="secondary"
                className="bg-amber-950/40 text-amber-300 border border-amber-800/40 text-[10px] gap-1 px-1.5 py-0.5"
              >
                <Tag className="w-2.5 h-2.5" />
                {rel.sell_requests_count} {rel.sell_requests_count === 1 ? 'anúncio' : 'anúncios'}
              </Badge>
            )}
            {rel.rentals_count > 0 && (
              <Badge
                variant="secondary"
                className="bg-blue-950/40 text-blue-300 border border-blue-800/40 text-[10px] gap-1 px-1.5 py-0.5"
              >
                <KeyRound className="w-2.5 h-2.5" />
                {rel.rentals_count} {rel.rentals_count === 1 ? 'aluguel' : 'aluguéis'}
              </Badge>
            )}
          </div>
        ) : (
          <p className="text-[11px] text-zinc-500 italic">Cliente avulso (sem vínculos comerciais)</p>
        )}

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-900">
          {waLink ? (
            <Link
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center h-8 text-xs bg-emerald-950/20 text-emerald-300 border border-emerald-900/40 hover:bg-emerald-950/40 rounded-lg gap-1.5 font-medium transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </Link>
          ) : (
            <div />
          )}

          <Link
            href={`/admin/clientes/${customer.id}/editar`}
            className="inline-flex items-center justify-center h-8 text-xs bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg gap-1.5 font-medium transition-colors"
          >
            <Edit className="w-3.5 h-3.5" />
            Editar
          </Link>

          <Link
            href={`/admin/clientes/${customer.id}`}
            className="inline-flex items-center justify-center h-8 text-xs bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] text-zinc-950 font-black hover:opacity-95 rounded-lg gap-1.5 transition-all shadow-[0_0_12px_rgba(201,164,76,0.2)] cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            Detalhes
          </Link>
        </div>
    </div>
  );
}

