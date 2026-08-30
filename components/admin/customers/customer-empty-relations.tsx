import React from 'react';
import Link from 'next/link';
import { Sparkles, Receipt, MessageSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomerEmptyRelationsProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  secondaryActionText?: string;
  secondaryActionHref?: string;
}

export function CustomerEmptyRelations({
  title = 'Nenhum relacionamento registrado',
  description = 'Este cliente foi cadastrado como avulso e ainda não possui vínculos de vendas, anúncios ou propostas.',
  actionText = 'Registrar Venda para este Cliente',
  actionHref = '/admin/vendas/nova',
  secondaryActionText,
  secondaryActionHref,
}: CustomerEmptyRelationsProps) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-800 bg-[#0f0f13]/60 p-8 text-center space-y-4">
      <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto text-[#c9a44c]">
        <Sparkles className="w-6 h-6" />
      </div>
      <div className="space-y-1 max-w-md mx-auto">
        <h4 className="text-sm font-bold text-white">{title}</h4>
        <p className="text-xs text-zinc-400 leading-relaxed">{description}</p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
        {actionHref && actionText && (
          <Link
            href={actionHref}
            className="inline-flex items-center justify-center h-8 px-3 rounded-lg bg-[#c9a44c] hover:bg-[#b5923f] text-zinc-950 font-bold text-xs gap-1.5 shadow-sm transition-colors"
          >
            <Receipt className="w-3.5 h-3.5" />
            {actionText}
          </Link>
        )}

        {secondaryActionHref && secondaryActionText && (
          <Link
            href={secondaryActionHref}
            className="inline-flex items-center justify-center h-8 px-3 rounded-lg border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 text-xs gap-1.5 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            {secondaryActionText}
          </Link>
        )}
      </div>
    </div>
  );
}
