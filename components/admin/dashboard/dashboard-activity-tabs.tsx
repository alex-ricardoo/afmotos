'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Receipt,
  MessageSquare,
  FileSearch,
  ArrowRight,
  Bike,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Phone,
} from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { SaleWithDetails } from '@/lib/queries/sales';
import { DashboardRecentLead, DashboardRecentConsultation } from '@/lib/queries/dashboard';
import { CONSTANTS } from '@/lib/utils/constants';

interface DashboardActivityTabsProps {
  sales: SaleWithDetails[];
  leads: DashboardRecentLead[];
  consultations: DashboardRecentConsultation[];
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  }
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTimeAgo = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d atrás`;
  if (diffHours > 0) return `${diffHours}h atrás`;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins > 0) return `${diffMins}m atrás`;
  return 'Agora há pouco';
};

const getLeadTypeLabel = (type: string) => {
  const map: Record<string, { label: string; color: string }> = {
    MOTORCYCLE_INTEREST: { label: 'Interesse em Moto', color: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
    SELL_MOTORCYCLE: { label: 'Venda de Moto', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    CONSIGNMENT: { label: 'Consignação', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
    RENTAL: { label: 'Aluguel', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
    MOTORCYCLE_REQUEST: { label: 'Busca Encomenda', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30' },
    GENERAL_CONTACT: { label: 'Dúvida Geral', color: 'bg-zinc-700/30 text-zinc-300 border-zinc-600/30' },
  };
  return map[type] || { label: 'Contato', color: 'bg-zinc-800 text-zinc-400 border-zinc-700' };
};

const getRiskBadge = (riskLevel: string) => {
  switch (riskLevel?.toUpperCase()) {
    case 'LOW':
      return {
        label: 'Aprovado',
        className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        icon: ShieldCheck,
      };
    case 'MEDIUM':
      return {
        label: 'Atenção',
        className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        icon: AlertTriangle,
      };
    case 'HIGH':
    case 'CRITICAL':
      return {
        label: 'Alto Risco',
        className: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        icon: AlertTriangle,
      };
    default:
      return {
        label: 'Consultado',
        className: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        icon: FileSearch,
      };
  }
};

export function DashboardActivityTabs({
  sales,
  leads,
  consultations,
}: DashboardActivityTabsProps) {
  const [activeTab, setActiveTab] = useState<'sales' | 'leads' | 'consultations'>('sales');

  return (
    <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-4 sm:p-6 shadow-sm space-y-5">
      {/* Header com Abas Rápidas e Botão de Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-zinc-900">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('sales')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sales'
                ? 'bg-gradient-to-r from-[#c9a44c] to-[#e3c56c] text-black shadow-md shadow-[#c9a44c]/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Últimas Vendas</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'sales' ? 'bg-black/20 text-black' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {sales.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'leads'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-black shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Propostas Recentes</span>
            {leads.filter((l) => l.status === 'NEW').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('consultations')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'consultations'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-black shadow-md shadow-emerald-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <FileSearch className="w-3.5 h-3.5" />
            <span>Consultas de Placa</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'consultations'
                  ? 'bg-black/20 text-black'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {consultations.length}
            </span>
          </button>
        </div>

        {/* Link para visualização completa de cada módulo */}
        <div className="shrink-0 flex items-center justify-end">
          {activeTab === 'sales' && (
            <Link
              href="/admin/vendas"
              className="text-xs font-bold text-[#e3c56c] hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Ver todas as vendas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {activeTab === 'leads' && (
            <Link
              href="/admin/propostas"
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
            >
              <span>Ver todas as propostas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {activeTab === 'consultations' && (
            <Link
              href="/admin/consulta-placa"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <span>Nova consulta de placa</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* ABA 1: ÚLTIMAS VENDAS */}
      {activeTab === 'sales' && (
        <div>
          {sales.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-3">
              <Bike className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-sm">Nenhuma venda registrada até o momento.</p>
              <Link
                href="/admin/vendas/nova"
                className={buttonVariants({
                  variant: 'outline',
                  size: 'sm',
                  className: 'border-[#c9a44c]/40 text-[#e3c56c] hover:bg-[#c9a44c]/10 rounded-xl',
                })}
              >
                + Registrar Primeira Venda
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {sales.map((sale) => {
                const moto = sale.motorcycle;
                const primaryImage =
                  moto?.images?.find((img) => img.is_primary)?.public_url ||
                  moto?.images?.find((img) => img.is_primary)?.display_url ||
                  moto?.images?.[0]?.public_url ||
                  moto?.images?.[0]?.display_url;

                const cleanPhone = sale.buyer_phone ? sale.buyer_phone.replace(/\D/g, '') : '';
                const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                const storeName = CONSTANTS.STORE_NAME;
                const whatsappUrl = cleanPhone
                  ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
                      `Olá ${sale.buyer_name || ''}, tudo bem? Falamos da ${storeName} a respeito da sua compra.`,
                    )}`
                  : null;

                return (
                  <div
                    key={sale.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 hover:border-[#c9a44c]/40 hover:bg-zinc-900/70 transition-all duration-200"
                  >
                    {/* Moto + Detalhes */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      {primaryImage ? (
                        <div className="relative w-14 h-12 rounded-xl overflow-hidden shrink-0 border border-zinc-800 bg-black/40 shadow-xs">
                          <Image
                            src={primaryImage}
                            alt={moto?.model || 'Moto'}
                            fill
                            unoptimized
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-12 rounded-xl border border-zinc-800 bg-zinc-900 flex items-center justify-center shrink-0">
                          <Bike className="w-5 h-5 text-zinc-600" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">
                          {moto?.brand} {moto?.model} {moto?.version || ''}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                          <span className="truncate">
                            Cliente:{' '}
                            <strong className="text-zinc-200">
                              {sale.buyer_name || 'Não informado'}
                            </strong>
                          </span>
                          <span>•</span>
                          <span className="shrink-0">{formatDate(sale.sale_date)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Preço e Ações Rápidas */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                      <div className="text-left sm:text-right">
                        <div className="text-sm sm:text-base font-extrabold text-[#e3c56c] font-mono">
                          {formatCurrency(Number(sale.sale_price))}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 sm:justify-end">
                          <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-semibold text-[10px]">
                            {sale.payment_method || 'PIX'}
                          </span>
                          {sale.receipt_number && (
                            <span className="font-mono text-[10px] text-zinc-500 font-bold">
                              {sale.receipt_number}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/admin/vendas/${sale.id}/recibo`}
                          className={buttonVariants({
                            variant: 'outline',
                            size: 'sm',
                            className:
                              'h-8 px-2.5 rounded-xl text-xs font-bold border-[#c9a44c]/30 text-[#e3c56c] hover:bg-[#c9a44c]/10 cursor-pointer flex items-center gap-1.5',
                          })}
                          title="Visualizar e Imprimir Recibo Oficial A4"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Recibo</span>
                        </Link>

                        {whatsappUrl && (
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={buttonVariants({
                              variant: 'ghost',
                              size: 'icon-sm',
                              className:
                                'rounded-xl text-emerald-400 hover:bg-emerald-500/10 cursor-pointer',
                            })}
                            title="Falar no WhatsApp"
                          >
                            <Phone className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA 2: PROPOSTAS & LEADS RECENTES */}
      {activeTab === 'leads' && (
        <div>
          {leads.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-3">
              <MessageSquare className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-sm">Nenhuma proposta ou lead recebido recentemente.</p>
              <Link
                href="/admin/propostas"
                className={buttonVariants({
                  variant: 'outline',
                  size: 'sm',
                  className: 'border-amber-500/40 text-amber-400 hover:bg-amber-500/10 rounded-xl',
                })}
              >
                Abrir Central de Propostas
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => {
                const typeConfig = getLeadTypeLabel(lead.type);
                const cleanPhone = lead.phone ? lead.phone.replace(/\D/g, '') : '';
                const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
                const storeName = CONSTANTS.STORE_NAME;
                const whatsappUrl = cleanPhone
                  ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(
                      `Olá ${lead.name || ''}, tudo bem? Falamos da ${storeName} a respeito do seu contato no site. Como podemos te ajudar?`,
                    )}`
                  : null;

                const isNew = lead.status === 'NEW';

                return (
                  <div
                    key={lead.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 ${
                      isNew
                        ? 'bg-gradient-to-r from-amber-500/10 via-zinc-900/60 to-zinc-900/40 border-amber-500/40 hover:border-amber-500/70'
                        : 'bg-zinc-900/40 border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/70'
                    }`}
                  >
                    <div className="min-w-0 flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 mt-0.5 ${typeConfig.color}`}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-sm text-white truncate">{lead.name}</h4>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${typeConfig.color}`}
                          >
                            {typeConfig.label}
                          </span>
                          {isNew && (
                            <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-amber-400 text-black">
                              Novo
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-zinc-400 truncate mt-0.5">
                          {lead.motorcycle
                            ? `Interesse: ${lead.motorcycle.brand} ${lead.motorcycle.model}`
                            : lead.message || 'Sem mensagem adicional'}
                        </p>

                        <div className="flex items-center gap-2 text-[11px] text-zinc-500 mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimeAgo(lead.created_at)}
                          </span>
                          <span>•</span>
                          <span>{lead.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                      {whatsappUrl && (
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={buttonVariants({
                            variant: 'default',
                            size: 'sm',
                            className:
                              'h-8 px-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer flex items-center gap-1.5',
                          })}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>Chamar no WhatsApp</span>
                        </a>
                      )}

                      <Link
                        href="/admin/propostas"
                        className={buttonVariants({
                          variant: 'outline',
                          size: 'sm',
                          className:
                            'h-8 px-2.5 rounded-xl text-xs font-bold border-zinc-700 text-zinc-300 hover:bg-zinc-800 cursor-pointer',
                        })}
                      >
                        Ver Detalhes
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ABA 3: CONSULTAS DE PLACA */}
      {activeTab === 'consultations' && (
        <div>
          {consultations.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 space-y-3">
              <FileSearch className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-sm">Nenhuma consulta de placa realizada recentemente.</p>
              <Link
                href="/admin/consulta-placa"
                className={buttonVariants({
                  variant: 'outline',
                  size: 'sm',
                  className: 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 rounded-xl',
                })}
              >
                + Fazer Primeira Consulta
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {consultations.map((item) => {
                const riskBadge = getRiskBadge(item.risk_level);
                const RiskIcon = riskBadge.icon;

                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 hover:border-emerald-500/40 hover:bg-zinc-900/70 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Mini Placa Mercosul */}
                      <div className="w-20 rounded-md overflow-hidden border border-zinc-700 bg-white shadow-xs shrink-0">
                        <div className="bg-[#003399] py-0.5 text-center text-[7px] font-black text-white tracking-widest">
                          BRASIL
                        </div>
                        <div className="text-center py-1 text-[11px] font-black text-zinc-900 font-mono tracking-wider">
                          {item.plate_display || 'PLACA'}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-white truncate">
                          {item.brand} {item.model}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                          {item.year_model && <span>Ano {item.year_model}</span>}
                          {item.year_model && <span>•</span>}
                          <span>{formatTimeAgo(item.consulted_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${riskBadge.className}`}
                      >
                        <RiskIcon className="w-3 h-3" />
                        {riskBadge.label}
                      </span>

                      <Link
                        href={`/admin/consulta-placa/${item.id}`}
                        className={buttonVariants({
                          variant: 'outline',
                          size: 'sm',
                          className:
                            'h-8 px-2.5 rounded-xl text-xs font-bold border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 cursor-pointer flex items-center gap-1',
                        })}
                      >
                        <span>Ver Laudo</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
