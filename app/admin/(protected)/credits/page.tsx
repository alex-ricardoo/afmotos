import React from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  CreditManager,
  type AdminUserCreditItem,
  type AdminLedgerItem,
} from '@/components/admin/credits/credit-manager';

export const metadata = {
  title: 'Gestão de Créditos B2B | AF Motos Admin',
  description: 'Gerencie pacotes de créditos B2B de clientes para consultas veiculares.',
};

export const dynamic = 'force-dynamic';

export default async function CreditsPage() {
  const adminDb = createAdminClient();

  // 1. Buscar saldos e usuários em paralelo
  const [{ data: balances }, { data: authUsers }] = await Promise.all([
    adminDb.from('customer_credit_balances').select('*'),
    adminDb.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  // 2. Buscar ledger com fallback (customer_credit_ledger ou credit_ledger)
  let ledgerEntries: AdminLedgerItem[] = [];
  try {
    const { data: newLedger } = await adminDb
      .from('customer_credit_ledger')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (newLedger && newLedger.length > 0) {
      ledgerEntries = newLedger;
    } else {
      const { data: oldLedger } = await adminDb
        .from('credit_ledger')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      ledgerEntries = (oldLedger as AdminLedgerItem[]) || [];
    }
  } catch (err) {
    console.warn('[CreditsPage] Erro ao carregar ledger:', err);
  }

  const usersList = authUsers?.users || [];

  // Montar lista de usuários com saldos enriquecidos (nome, email, saldo, data)
  const usersWithBalances: AdminUserCreditItem[] = usersList
    .map((u) => {
      const balanceObj = balances?.find((b) => b.user_id === u.id);
      return {
        id: u.id,
        email: u.email || 'Sem e-mail',
        name: u.user_metadata?.full_name || u.user_metadata?.name || null,
        phone: u.user_metadata?.phone || u.phone || null,
        balance: balanceObj?.balance || 0,
        createdAt: u.created_at,
      };
    })
    .sort((a, b) => b.balance - a.balance);

  return <CreditManager users={usersWithBalances} initialLedger={ledgerEntries} />;
}
