'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Customer } from '@/types/customer';
import { CustomerStatusBadge } from './customer-status-badge';
import { CustomerSourceBadge } from './customer-source-badge';
import { maskCpf, formatPhone } from '@/lib/utils/customer-normalizers';
import { formatDate } from '@/lib/utils/formatters';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';
import { setCustomerActiveStatusAction } from '@/lib/actions/customers';

import { Button } from '@/components/ui/button';
import {
  Phone,
  MessageCircle,
  Mail,
  Copy,
  Edit,
  Receipt,
  UserX,
  UserCheck,
  Calendar,
  Check,
} from 'lucide-react';

interface CustomerDetailsHeaderProps {
  customer: Customer;
  storeName?: string;
}

export function CustomerDetailsHeader({
  customer,
  storeName = 'AF Motos',
}: CustomerDetailsHeaderProps) {
  const router = useRouter();
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  const waLink = generateWhatsAppLink(
    customer.whatsapp || customer.phone,
    `Olá ${customer.full_name}, tudo bem? Aqui é da ${storeName}.`,
  );

  const handleCopy = (text: string, type: 'phone' | 'email') => {
    navigator.clipboard.writeText(text);
    if (type === 'phone') {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
      toast.success('Telefone copiado para a área de transferência!');
    } else {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
      toast.success('E-mail copiado para a área de transferência!');
    }
  };

  const handleToggleStatus = async () => {
    setTogglingStatus(true);
    try {
      const res = await setCustomerActiveStatusAction(customer.id, !customer.is_active);
      if (res?.success) {
        toast.success(
          customer.is_active
            ? 'Cliente inativado com sucesso.'
            : 'Cliente reativado com sucesso.',
        );
        router.refresh();
      } else {
        toast.error(res?.error || 'Não foi possível alterar o status.');
      }
    } catch {
      toast.error('Erro ao alterar status do cliente.');
    } finally {
      setTogglingStatus(false);
    }
  };

  return (
    <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-6 sm:p-7 shadow-sm space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left Side: Avatar + Main Info */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/90 border border-zinc-700/60 flex items-center justify-center text-[#e3c56c] font-black text-xl shrink-0 shadow-md">
            {customer.full_name
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map((n) => n[0])
              .join('')
              .toUpperCase() || 'CL'}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {customer.full_name}
              </h1>
              <CustomerStatusBadge isActive={customer.is_active} />
              <CustomerSourceBadge source={customer.source} />
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
              <span className="font-mono">{maskCpf(customer.cpf)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                Cadastrado em {formatDate(customer.created_at)}
              </span>
              {customer.city && (
                <>
                  <span>•</span>
                  <span>{customer.city}{customer.state ? `/${customer.state}` : ''}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {waLink && (
            <Link
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 px-3.5 rounded-xl gap-2 shadow-sm transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              Abrir WhatsApp
            </Link>
          )}

          <Link
            href="/admin/vendas/nova"
            className="inline-flex items-center justify-center bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-zinc-950 font-black text-xs h-10 px-4 rounded-xl gap-2 shadow-[0_0_15px_rgba(201,164,76,0.25)] transition-all cursor-pointer"
          >
            <Receipt className="w-4 h-4 stroke-[2.5]" />
            Registrar Venda
          </Link>

          <Link
            href={`/admin/clientes/${customer.id}/editar`}
            className="inline-flex items-center justify-center border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs h-10 px-3.5 rounded-xl gap-1.5 font-semibold transition-colors cursor-pointer"
          >
            <Edit className="w-4 h-4" />
            Editar
          </Link>

          <Button
            type="button"
            variant="ghost"
            onClick={handleToggleStatus}
            disabled={togglingStatus}
            className="text-xs h-9 text-zinc-400 hover:text-white hover:bg-zinc-900 gap-1.5"
          >
            {customer.is_active ? (
              <>
                <UserX className="w-4 h-4 text-zinc-500" />
                Inativar
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4 text-emerald-400" />
                Reativar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Quick Contact Bar */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-800/60 text-xs">
        {/* Phone Contact */}
        <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
          <Phone className="w-3.5 h-3.5 text-zinc-400" />
          <span className="font-semibold text-zinc-200">{formatPhone(customer.phone)}</span>
          <button
            onClick={() => handleCopy(customer.phone, 'phone')}
            className="text-zinc-500 hover:text-zinc-300 ml-1 p-0.5"
            title="Copiar telefone"
          >
            {copiedPhone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>

        {/* WhatsApp if distinct */}
        {customer.whatsapp && customer.whatsapp !== customer.phone && (
          <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-zinc-200">WhatsApp: {formatPhone(customer.whatsapp)}</span>
          </div>
        )}

        {/* Email Contact */}
        {customer.email && (
          <div className="flex items-center gap-1.5 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
            <Mail className="w-3.5 h-3.5 text-zinc-400" />
            <span className="text-zinc-300">{customer.email}</span>
            <button
              onClick={() => handleCopy(customer.email!, 'email')}
              className="text-zinc-500 hover:text-zinc-300 ml-1 p-0.5"
              title="Copiar e-mail"
            >
              {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
