'use client';

import React from 'react';
import Link from 'next/link';
import { CustomerFullDetails } from '@/lib/queries/customers';
import { CustomerEmptyRelations } from './customer-empty-relations';
import { maskCpf, formatPhone, formatCep } from '@/lib/utils/customer-normalizers';
import { formatDate, formatCurrency } from '@/lib/utils/formatters';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  MapPin,
  FileText,
  Receipt,
  Tag,
  MessageSquare,
  KeyRound,
  History,
  ExternalLink,
  Calendar,
  Bike,
  Sparkles,
} from 'lucide-react';

import { sourceConfig } from './customer-source-badge';

const statusDisplayLabels: Record<string, string> = {
  PENDING: 'Pendente',
  APPROVED: 'Aprovada',
  REJECTED: 'Recusada',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
  ACTIVE: 'Ativo',
  INACTIVE: 'Inativo',
  pending: 'Pendente',
  approved: 'Aprovada',
  rejected: 'Recusada',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  active: 'Ativo',
  inactive: 'Inativo',
  open: 'Aberto',
  contacted: 'Contatado',
  closed: 'Encerrado',
};

const getStatusLabel = (status?: string | null) => {
  if (!status) return 'Pendente';
  return statusDisplayLabels[status] || status;
};

interface CustomerRelationsTabsProps {
  customer: CustomerFullDetails;
}

export function CustomerRelationsTabs({ customer }: CustomerRelationsTabsProps) {
  const sales = customer.sales || [];
  const sellRequests = customer.sell_requests || [];
  const leads = customer.leads || [];
  const rentals = customer.rentals || [];
  const rentalRequests = customer.rental_requests || [];

  const hasAnyRelations =
    sales.length > 0 ||
    sellRequests.length > 0 ||
    leads.length > 0 ||
    rentals.length > 0 ||
    rentalRequests.length > 0;

  interface TimelineItem {
    type: string;
    title: string;
    description: string;
    date: string;
    href?: string;
    icon: React.ComponentType<{ className?: string }>;
    colorClass: string;
  }

  // Timeline unificada ordenada por data desc
  const timelineEvents: TimelineItem[] = [
    {
      type: 'CUSTOMER_CREATED',
      title: 'Cliente Cadastrado no Sistema',
      description: `Origem: ${sourceConfig[customer.source]?.label || 'Manual'}`,
      date: customer.created_at,
      icon: User,
      colorClass: 'text-amber-400 bg-amber-950/30 border-amber-800/40',
    },
    ...sales.map((s) => ({
      type: 'SALE',
      title: `Venda Concluída — ${s.motorcycle?.brand || ''} ${s.motorcycle?.model || 'Motocicleta'}`,
      description: `Valor: ${formatCurrency(Number(s.sale_price))} • Recibo: ${s.receipt_number || 'S/N'}`,
      date: s.sale_date || s.created_at,
      href: `/admin/vendas/${s.id}`,
      icon: Receipt,
      colorClass: 'text-emerald-400 bg-emerald-950/30 border-emerald-800/40',
    })),
    ...sellRequests.map((sr) => ({
      type: 'SELL_REQUEST',
      title: `Solicitação de Venda — ${sr.brand || ''} ${sr.model || 'Moto'}`,
      description: `Preço desejado: ${sr.desired_price ? formatCurrency(Number(sr.desired_price)) : 'A combinar'} • Status: ${getStatusLabel(sr.status)}`,
      date: sr.created_at,
      href: `/admin/propostas?sellRequestId=${sr.id}`,
      icon: Tag,
      colorClass: 'text-amber-400 bg-amber-950/30 border-amber-800/40',
    })),
    ...leads.map((l) => ({
      type: 'LEAD',
      title: `Contato Recebido — ${l.type || 'Interesse Comercial'}`,
      description: l.message || 'Mensagem enviada pelo site.',
      date: l.created_at,
      href: `/admin/propostas?id=${l.id}`,
      icon: MessageSquare,
      colorClass: 'text-sky-400 bg-sky-950/30 border-sky-800/40',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      {/* Tab Navigation - Luxury Floating Scrollable Pills */}
      <div className="w-full overflow-x-auto pb-1 scrollbar-none">
        <TabsList className="bg-zinc-950/80 backdrop-blur-md border border-zinc-800/90 p-1.5 rounded-2xl inline-flex w-auto min-w-full sm:min-w-0 gap-1 sm:gap-1.5 h-auto shadow-lg">
          <TabsTrigger
            value="overview"
            className="group text-xs data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#e3c56c] data-[state=checked]:via-[#c9a44c] data-[state=checked]:to-[#b48d3c] data-[state=checked]:text-zinc-950 font-bold rounded-xl px-3.5 py-2 transition-all cursor-pointer flex items-center gap-2 text-zinc-400 hover:text-white"
          >
            <User className="w-3.5 h-3.5" />
            <span>Visão Geral</span>
          </TabsTrigger>

          <TabsTrigger
            value="sales"
            className="group text-xs data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#e3c56c] data-[state=checked]:via-[#c9a44c] data-[state=checked]:to-[#b48d3c] data-[state=checked]:text-zinc-950 font-bold rounded-xl px-3.5 py-2 transition-all cursor-pointer flex items-center gap-2 text-zinc-400 hover:text-white"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Vendas</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black bg-zinc-800/80 text-zinc-300 group-data-[state=checked]:bg-zinc-950/30 group-data-[state=checked]:text-zinc-950">
              {sales.length}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="proposals"
            className="group text-xs data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#e3c56c] data-[state=checked]:via-[#c9a44c] data-[state=checked]:to-[#b48d3c] data-[state=checked]:text-zinc-950 font-bold rounded-xl px-3.5 py-2 transition-all cursor-pointer flex items-center gap-2 text-zinc-400 hover:text-white"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Anúncios & Propostas</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black bg-zinc-800/80 text-zinc-300 group-data-[state=checked]:bg-zinc-950/30 group-data-[state=checked]:text-zinc-950">
              {sellRequests.length + leads.length}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="rentals"
            className="group text-xs data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#e3c56c] data-[state=checked]:via-[#c9a44c] data-[state=checked]:to-[#b48d3c] data-[state=checked]:text-zinc-950 font-bold rounded-xl px-3.5 py-2 transition-all cursor-pointer flex items-center gap-2 text-zinc-400 hover:text-white"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Locações</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black bg-zinc-800/80 text-zinc-300 group-data-[state=checked]:bg-zinc-950/30 group-data-[state=checked]:text-zinc-950">
              {rentals.length + rentalRequests.length}
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="timeline"
            className="group text-xs data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-[#e3c56c] data-[state=checked]:via-[#c9a44c] data-[state=checked]:to-[#b48d3c] data-[state=checked]:text-zinc-950 font-bold rounded-xl px-3.5 py-2 transition-all cursor-pointer flex items-center gap-2 text-zinc-400 hover:text-white"
          >
            <History className="w-3.5 h-3.5" />
            <span>Linha do Tempo</span>
            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black bg-zinc-800/80 text-zinc-300 group-data-[state=checked]:bg-zinc-950/30 group-data-[state=checked]:text-zinc-950">
              {timelineEvents.length}
            </span>
          </TabsTrigger>
        </TabsList>
      </div>

      {/* 1. ABA: VISÃO GERAL */}
      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Dados Pessoais & Documentos */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 text-zinc-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#e3c56c] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Identificação & Documentos</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-zinc-900">
                <span className="text-zinc-400">Nome Completo:</span>
                <span className="font-semibold text-white">{customer.full_name}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-zinc-900">
                <span className="text-zinc-400">CPF:</span>
                <span className="font-mono text-zinc-200">{maskCpf(customer.cpf)}</span>
              </div>
              {customer.rg && (
                <div className="flex justify-between py-1.5 border-b border-zinc-900">
                  <span className="text-zinc-400">RG / Órgão:</span>
                  <span className="text-zinc-200">{customer.rg}</span>
                </div>
              )}
              {customer.birth_date && (
                <div className="flex justify-between py-1.5 border-b border-zinc-900">
                  <span className="text-zinc-400">Data de Nascimento:</span>
                  <span className="text-zinc-200">{formatDate(customer.birth_date)}</span>
                </div>
              )}
              {customer.gender && (
                <div className="flex justify-between py-1.5 border-b border-zinc-900">
                  <span className="text-zinc-400">Sexo:</span>
                  <span className="text-zinc-200">
                    {customer.gender === 'male'
                      ? 'Masculino'
                      : customer.gender === 'female'
                      ? 'Feminino'
                      : customer.gender === 'other'
                      ? 'Outro'
                      : 'Não informado'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Endereço Cadastrado */}
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 text-zinc-100 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#e3c56c] flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-white">Endereço Cadastrado</h3>
            </div>
            <div className="space-y-3 text-xs">
              {customer.street ? (
                <>
                  <div className="flex justify-between py-1.5 border-b border-zinc-900">
                    <span className="text-zinc-400">Logradouro:</span>
                    <span className="font-semibold text-white">
                      {customer.street} {customer.number && `, nº ${customer.number}`}
                    </span>
                  </div>
                  {customer.complement && (
                    <div className="flex justify-between py-1.5 border-b border-zinc-900">
                      <span className="text-zinc-400">Complemento:</span>
                      <span className="text-zinc-200">{customer.complement}</span>
                    </div>
                  )}
                  {customer.neighborhood && (
                    <div className="flex justify-between py-1.5 border-b border-zinc-900">
                      <span className="text-zinc-400">Bairro:</span>
                      <span className="text-zinc-200">{customer.neighborhood}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5 border-b border-zinc-900">
                    <span className="text-zinc-400">Cidade / UF:</span>
                    <span className="text-zinc-200">
                      {customer.city || '-'}{customer.state ? `/${customer.state}` : ''}
                    </span>
                  </div>
                  {customer.cep && (
                    <div className="flex justify-between py-1.5 border-b border-zinc-900">
                      <span className="text-zinc-400">CEP:</span>
                      <span className="font-mono text-zinc-200">{formatCep(customer.cep)}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-zinc-500 italic py-4">Nenhum endereço cadastrado para este cliente.</p>
              )}
            </div>
          </div>
        </div>

        {/* Notas Internas da Loja */}
        {customer.notes && (
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 sm:p-6 text-zinc-100 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/90 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              Notas Comerciais & Histórico Interno
            </h3>
            <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {customer.notes}
            </p>
          </div>
        )}
      </TabsContent>

      {/* 2. ABA: VENDAS */}
      <TabsContent value="sales" className="space-y-4">
        {sales.length > 0 ? (
          <div className="space-y-3">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700/90 rounded-2xl p-4 sm:p-5 transition-all text-white shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 flex items-center justify-center shrink-0">
                      <Bike className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        {sale.motorcycle?.brand} {sale.motorcycle?.model} ({sale.motorcycle?.year_model || 'Ano N/I'})
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-0.5">
                        <span className="font-bold text-emerald-400 font-mono">
                          {formatCurrency(Number(sale.sale_price))}
                        </span>
                        <span>•</span>
                        <span>{formatDate(sale.sale_date)}</span>
                        {sale.receipt_number && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded text-[11px]">{sale.receipt_number}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/admin/vendas/${sale.id}`}
                    className="inline-flex items-center justify-center h-9 px-3.5 rounded-xl border border-zinc-800 bg-zinc-900/90 text-xs text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors gap-1.5 font-bold cursor-pointer shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#e3c56c]" />
                    Ver Venda
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CustomerEmptyRelations
            title="Nenhuma venda associada"
            description="Este cliente ainda não adquiriu nenhuma motocicleta na AF Motos."
            actionText="Registrar Nova Venda"
            actionHref="/admin/vendas/nova"
          />
        )}
      </TabsContent>

      {/* 3. ABA: ANÚNCIOS & PROPOSTAS */}
      <TabsContent value="proposals" className="space-y-4">
        {sellRequests.length > 0 || leads.length > 0 ? (
          <div className="space-y-3">
            {sellRequests.map((sr) => (
              <div
                key={sr.id}
                className="bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700/90 rounded-2xl p-4 sm:p-5 transition-all text-white shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-amber-950/40 border border-amber-800/40 text-amber-400 flex items-center justify-center shrink-0">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">
                          Venda Direta / Anúncio: {sr.brand} {sr.model}
                        </h4>
                        <Badge variant="outline" className="text-[10px] bg-zinc-900 border-zinc-800 text-zinc-300">
                          {getStatusLabel(sr.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        Desejado: <strong className="text-zinc-200">{sr.desired_price ? formatCurrency(Number(sr.desired_price)) : 'A combinar'}</strong> • Recebido em {formatDate(sr.created_at)}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/admin/propostas?sellRequestId=${sr.id}`}
                    className="inline-flex items-center justify-center h-9 px-3.5 rounded-xl border border-zinc-800 bg-zinc-900/90 text-xs text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors font-bold gap-1.5 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#e3c56c]" />
                    Ver Detalhes
                  </Link>
                </div>
              </div>
            ))}

            {leads.map((lead) => (
              <div
                key={lead.id}
                className="bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700/90 rounded-2xl p-4 sm:p-5 transition-all text-white shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-sky-950/40 border border-sky-800/40 text-sky-400 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">
                          Interesse Comercial: {lead.type}
                        </h4>
                        <Badge variant="outline" className="text-[10px] bg-zinc-900 border-zinc-800 text-zinc-300">
                          {getStatusLabel(lead.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">
                        {lead.message || 'Contato enviado pelo site.'}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/admin/propostas?id=${lead.id}`}
                    className="inline-flex items-center justify-center h-9 px-3.5 rounded-xl border border-zinc-800 bg-zinc-900/90 text-xs text-zinc-200 hover:text-white hover:bg-zinc-800 transition-colors font-bold gap-1.5 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#e3c56c]" />
                    Ver Detalhes
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CustomerEmptyRelations
            title="Nenhum anúncio ou proposta"
            description="Este cliente ainda não enviou propostas de venda, anúncios ou mensagens pelo site."
            actionText="Ver Balcão de Propostas"
            actionHref="/admin/propostas"
          />
        )}
      </TabsContent>

      {/* 4. ABA: LOCAÇÕES */}
      <TabsContent value="rentals" className="space-y-4">
        {rentals.length > 0 || rentalRequests.length > 0 ? (
          <div className="space-y-3">
            {rentals.map((r) => (
              <div
                key={r.id}
                className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-4 sm:p-5 text-white shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-blue-950/40 border border-blue-800/40 text-blue-400 flex items-center justify-center shrink-0">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white">
                        Aluguel de Moto: {r.motorcycle?.brand} {r.motorcycle?.model}
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Período: {formatDate(r.start_date)} a {formatDate(r.end_date)} • Status: {getStatusLabel(r.status)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <CustomerEmptyRelations
            title="Nenhum contrato de aluguel"
            description="Este cliente não possui histórico de locação de motocicletas."
            actionText="Registrar Venda"
            actionHref="/admin/vendas/nova"
          />
        )}
      </TabsContent>

      {/* 5. ABA: LINHA DO TEMPO */}
      <TabsContent value="timeline" className="space-y-4">
        <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 sm:p-7 shadow-sm">
          <div className="relative pl-6 border-l-2 border-zinc-800/90 space-y-7 my-1">
            {timelineEvents.map((evt, idx) => {
              const Icon = evt.icon;
              return (
                <div key={idx} className="relative group">
                  {/* Marker */}
                  <div className="absolute -left-[31px] top-0.5 w-6 h-6 rounded-full bg-zinc-950 border-2 border-[#c9a44c] flex items-center justify-center text-[#c9a44c] shadow-[0_0_10px_rgba(201,164,76,0.3)]">
                    <Icon className="w-3 h-3" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-white">{evt.title}</span>
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {formatDate(evt.date)}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400">{evt.description}</p>
                    {evt.href && (
                      <Link
                        href={evt.href}
                        className="inline-flex items-center text-[11px] text-[#e3c56c] hover:underline font-semibold gap-1 mt-1 cursor-pointer"
                      >
                        Acessar registro →
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
