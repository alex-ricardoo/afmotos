import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/queries/settings';
import { getVehicleConsultationPrice } from '@/lib/settings/server-queries';
import { getUserCreditBalance } from '@/lib/credits/credit-service';
import { CustomerCreditsView, type LedgerItem } from '@/components/customer/customer-credits-view';

export const metadata = {
  title: 'Pacotes de Créditos B2B | AF Motos',
  description: 'Adquira créditos pré-pagos para consultas veiculares com descontos progressivos e liberação imediata via WhatsApp.',
};

export default async function CustomerCreditsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/cliente/login?returnUrl=/cliente/creditos');
  }

  // 1. Carrega saldo, configurações e o PREÇO OFICIAL DINÂMICO da consulta no banco de dados
  const [balance, rawSettings, regularPrice] = await Promise.all([
    getUserCreditBalance(user.id),
    getSiteSettings(),
    getVehicleConsultationPrice(),
  ]);

  // 2. Carrega histórico do ledger (compatível com nova tabela customer_credit_ledger e fallback credit_ledger)
  let ledgerHistory: LedgerItem[] = [];
  try {
    const { data: newLedger, error: newLedgerErr } = await supabase
      .from('customer_credit_ledger')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!newLedgerErr && newLedger && newLedger.length > 0) {
      ledgerHistory = newLedger;
    } else {
      const { data: oldLedger } = await supabase
        .from('credit_ledger')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(30);

      ledgerHistory = (oldLedger as LedgerItem[]) || [];
    }
  } catch (err) {
    console.warn('[CustomerCreditsPage] Erro ao carregar ledger:', err);
  }

  const rawPhone = rawSettings?.whatsapp_phone || '81999999999';
  const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Cliente';

  return (
    <CustomerCreditsView
      balance={balance}
      regularConsultationPrice={regularPrice}
      userEmail={user.email || ''}
      userName={userName}
      whatsappPhone={rawPhone}
      ledgerHistory={ledgerHistory}
    />
  );
}
