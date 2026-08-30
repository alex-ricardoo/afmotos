'use client';

import React from 'react';
import Link from 'next/link';
import { CustomerWithRelationshipCounts } from '@/types/customer';
import { CustomerStatusBadge } from './customer-status-badge';
import { CustomerSourceBadge } from './customer-source-badge';
import { maskCpf, formatPhone } from '@/lib/utils/customer-normalizers';
import { formatDate } from '@/lib/utils/formatters';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  Edit,
  Phone,
  MessageCircle,
  Receipt,
  Tag,
  KeyRound,
  User,
} from 'lucide-react';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';

interface CustomerListProps {
  customers: CustomerWithRelationshipCounts[];
}

export function CustomerList({ customers }: CustomerListProps) {
  return (
    <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-xs">
      <Table>
        <TableHeader className="bg-zinc-900/60 border-b border-zinc-800">
          <TableRow className="hover:bg-transparent border-zinc-800">
            <TableHead className="text-zinc-400 font-bold text-xs uppercase py-3.5 pl-6">Cliente</TableHead>
            <TableHead className="text-zinc-400 font-bold text-xs uppercase py-3.5">Contato</TableHead>
            <TableHead className="text-zinc-400 font-bold text-xs uppercase py-3.5">Origem</TableHead>
            <TableHead className="text-zinc-400 font-bold text-xs uppercase py-3.5">Relacionamentos</TableHead>
            <TableHead className="text-zinc-400 font-bold text-xs uppercase py-3.5">Cadastro</TableHead>
            <TableHead className="text-zinc-400 font-bold text-xs uppercase py-3.5">Status</TableHead>
            <TableHead className="text-right text-zinc-400 font-bold text-xs uppercase py-3.5 pr-6">
              Ações
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-zinc-800/60">
          {customers.map((customer) => {
            const rel = customer.relationships;
            const waLink = generateWhatsAppLink(
              customer.whatsapp || customer.phone,
              `Olá ${customer.full_name}, tudo bem? Aqui é da AF Motos.`,
            );

            return (
              <TableRow
                key={customer.id}
                className="hover:bg-zinc-900/40 transition-colors border-none group"
              >
                {/* 1. Nome & CPF */}
                <TableCell className="py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-[#e3c56c] font-bold text-xs shrink-0 shadow-xs">
                      {customer.full_name
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase() || 'CL'}
                    </div>
                    <div className="flex flex-col">
                      <Link
                        href={`/admin/clientes/${customer.id}`}
                        className="font-semibold text-sm text-zinc-100 hover:text-[#e3c56c] transition-colors"
                      >
                        {customer.full_name}
                      </Link>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {maskCpf(customer.cpf)}
                      </span>
                    </div>
                  </div>
                </TableCell>

                {/* 2. Contato */}
                <TableCell className="py-3.5">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-200">
                      <Phone className="w-3 h-3 text-zinc-500" />
                      <span>{formatPhone(customer.phone)}</span>
                    </div>
                    {customer.email && (
                      <span className="text-[11px] text-zinc-500 truncate max-w-[180px]">
                        {customer.email}
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* 3. Origem */}
                <TableCell className="py-3.5">
                  <CustomerSourceBadge source={customer.source} />
                </TableCell>

                {/* 4. Relacionamentos */}
                <TableCell className="py-3.5">
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {rel && rel.sales_count > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 text-[10px] gap-1 px-1.5 py-0.5"
                      >
                        <Receipt className="w-2.5 h-2.5" />
                        {rel.sales_count} {rel.sales_count === 1 ? 'venda' : 'vendas'}
                      </Badge>
                    )}
                    {rel && rel.sell_requests_count > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-amber-950/40 text-amber-300 border border-amber-800/40 text-[10px] gap-1 px-1.5 py-0.5"
                      >
                        <Tag className="w-2.5 h-2.5" />
                        {rel.sell_requests_count} {rel.sell_requests_count === 1 ? 'anúncio' : 'anúncios'}
                      </Badge>
                    )}
                    {rel && rel.rentals_count > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-blue-950/40 text-blue-300 border border-blue-800/40 text-[10px] gap-1 px-1.5 py-0.5"
                      >
                        <KeyRound className="w-2.5 h-2.5" />
                        {rel.rentals_count} {rel.rentals_count === 1 ? 'aluguel' : 'aluguéis'}
                      </Badge>
                    )}
                    {(!rel || rel.total_relationships === 0) && (
                      <span className="text-[11px] text-zinc-500 italic">Avulso (sem vínculos)</span>
                    )}
                  </div>
                </TableCell>

                {/* 5. Data de Cadastro */}
                <TableCell className="py-3.5 text-xs text-zinc-400">
                  {formatDate(customer.created_at)}
                </TableCell>

                {/* 6. Status */}
                <TableCell className="py-3.5">
                  <CustomerStatusBadge isActive={customer.is_active} />
                </TableCell>

                {/* 7. Ações */}
                <TableCell className="py-3.5 text-right pr-4">
                  <div className="flex items-center justify-end gap-1">
                    {waLink && (
                      <Link
                        href={waLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 transition-colors"
                        title="Abrir WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Link>
                    )}

                    <Link
                      href={`/admin/clientes/${customer.id}`}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    <Link
                      href={`/admin/clientes/${customer.id}/editar`}>
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors" title="Editar cliente">
                        <Edit className="w-4 h-4" />
                      </span>
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
