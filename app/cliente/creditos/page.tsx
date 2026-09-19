import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPublicSiteSettings } from '@/lib/settings/server-queries';
import { getVehicleHistorySettings } from '@/lib/site-settings';
import { getUserCreditBalance } from '@/lib/credits/credit-service';
import { getActiveCreditOffers } from '@/lib/credits/offers-service';
import { CustomerCreditsView, type LedgerItem } from '@/components/customer/customer-credits-view';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Pacotes de Créditos B2B | AF Veículos PE',
  description:
    'Adquira créditos pré-pagos para consultas veiculares com descontos progressivos e liberação imediata via WhatsApp ou Mercado Pago.',
};

export default async function CustomerCreditsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/cliente/login?returnUrl=/cliente/creditos');
  }

  // 1. Carrega saldo, configurações oficiais do banco e ofertas ativas de pacotes (igual a /historico-veicular)
  const [balance, publicSettings, offers] = await Promise.all([
    getUserCreditBalance(user.id),
    getPublicSiteSettings(),
    getActiveCreditOffers(),
  ]);

  // Resolve a precificação do banco da mesma forma exata que /historico-veicular
  const vehicleHistory = publicSettings?.vehicleHistory || getVehicleHistorySettings(null);
  const consultationPrice = vehicleHistory.price;

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

  const rawPhone = publicSettings?.phone || '81999999999';
  const userName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Cliente';

  return (
    <CustomerCreditsView
      balance={balance}
      regularConsultationPrice={consultationPrice}
      userEmail={user.email || ''}
      userName={userName}
      whatsappPhone={rawPhone}
      ledgerHistory={ledgerHistory}
      offers={offers}
    />
  );
}
