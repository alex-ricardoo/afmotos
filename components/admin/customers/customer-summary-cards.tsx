'use client';

import React from 'react';
import { CustomerRelationshipCounts } from '@/types/customer';
import { Card, CardContent } from '@/components/ui/card';
import { Receipt, Tag, MessageSquare, KeyRound, Sparkles } from 'lucide-react';

interface CustomerSummaryCardsProps {
  relationships?: CustomerRelationshipCounts;
}

export function CustomerSummaryCards({ relationships }: CustomerSummaryCardsProps) {
  const rel = relationships || {
    sales_count: 0,
    sell_requests_count: 0,
    leads_count: 0,
    consignments_count: 0,
    rentals_count: 0,
    rental_requests_count: 0,
    total_relationships: 0,
  };

  const cards = [
    {
      title: 'Vendas / Compras',
      count: rel.sales_count,
      description: 'Motos adquiridas na loja',
      icon: Receipt,
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-950/20 border-emerald-900/40',
    },
    {
      title: 'Anúncios & Venda',
      count: rel.sell_requests_count,
      description: 'Solicitações de venda direta',
      icon: Tag,
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-950/20 border-amber-900/40',
    },
    {
      title: 'Propostas & Contatos',
      count: rel.leads_count,
      description: 'Mensagens e interesses',
      icon: MessageSquare,
      colorClass: 'text-sky-400',
      bgClass: 'bg-sky-950/20 border-sky-900/40',
    },
    {
      title: 'Aluguel de Motos',
      count: rel.rentals_count + rel.rental_requests_count,
      description: 'Contratos e solicitações',
      icon: KeyRound,
      colorClass: 'text-blue-400',
      bgClass: 'bg-blue-950/20 border-blue-900/40',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl sm:rounded-3xl text-zinc-100 shadow-sm hover:border-zinc-700/90 transition-all p-4 sm:p-5 flex items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <span className="text-xs text-zinc-400 font-semibold block">
                {card.title}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {card.count}
              </span>
              <span className="text-[11px] text-zinc-500 block truncate">
                {card.description}
              </span>
            </div>
            <div className={`p-3 rounded-2xl border shrink-0 ${card.bgClass}`}>
              <Icon className={`w-5 h-5 ${card.colorClass}`} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
