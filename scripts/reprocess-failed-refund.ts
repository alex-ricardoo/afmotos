import fs from 'fs';
import path from 'path';

// Carrega variáveis de ambiente de .env.local
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

async function run() {
  const { createAdminClient } = await import('../lib/supabase/admin.ts');
  const { getPaymentClient, getMercadoPagoConfig } = await import('../lib/mercadopago/client.ts');
  const { PaymentRefund } = await import('mercadopago');
  const { initiateRefundForFailedDelivery, reconcileSingleRefund } =
    await import('../lib/mercadopago/refund-service.ts');
  const { serializeMercadoPagoError } = await import('../lib/mercadopago/error-serializer.ts');

  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  let targetTxId = '4c8e1227-293b-41a7-a3f4-f3f0437f8e46';
  const txArgIdx = args.indexOf('--transaction');
  if (txArgIdx !== -1 && args[txArgIdx + 1]) {
    targetTxId = args[txArgIdx + 1];
  }

  console.log('================================================================');
  console.log(`[RECUPERAÇÃO DE REFUND] Iniciando para Transaction: ${targetTxId}`);
  console.log(`Modo: ${dryRun ? 'DRY-RUN (Apenas Leitura)' : 'EXECUÇÃO REAL'}`);
  console.log('================================================================');

  const adminDb = createAdminClient();

  // 1. Localiza a transação
  const { data: tx, error: txErr } = await adminDb
    .from('payment_transactions')
    .select('*')
    .eq('id', targetTxId)
    .maybeSingle();

  if (txErr || !tx) {
    console.error(`[ERRO] Transação ${targetTxId} não encontrada:`, txErr?.message);
    process.exit(1);
  }

  console.log(`Transação localizada:`);
  console.log(`- Status Atual: ${tx.status}`);
  console.log(`- Status Detalhe: ${tx.status_detail}`);
  console.log(`- MP Payment ID: ${tx.mp_payment_id}`);
  console.log(`- Valor: R$ ${tx.transaction_amount}`);
  console.log(`- Refund Status no DB: ${tx.refund_status}`);

  if (!tx.mp_payment_id) {
    console.error('[ERRO] Transação não possui mp_payment_id. Estorno via API impossível.');
    process.exit(1);
  }

  // 2. Localiza a consulta vinculada
  const { data: consultation } = await adminDb
    .from('customer_plate_consultations')
    .select('id, status, payment_status, vehicle_data')
    .eq('id', tx.consultation_id)
    .maybeSingle();

  console.log(`Consulta vinculada:`);
  console.log(`- Consultation ID: ${consultation?.id}`);
  console.log(`- Status Consulta: ${consultation?.status}`);
  console.log(`- Possui laudo entregue: ${Boolean(consultation?.vehicle_data)}`);

  // 3. Localiza histórico de refunds no banco
  const { data: existingRefunds } = await adminDb
    .from('payment_refunds')
    .select('*')
    .eq('transaction_id', tx.id);

  console.log(`Refunds registrados no banco: ${existingRefunds?.length || 0}`);
  for (const rf of existingRefunds || []) {
    console.log(
      `- ID: ${rf.id} | Status: ${rf.status} | Provider Refund ID: ${rf.provider_refund_id} | Motivo: ${rf.reason_code}`,
    );
  }

  // 4. Consulta autoritativa no Mercado Pago (Leitura)
  console.log('\n--- Consultando Mercado Pago ---');
  let mpPaymentStatus: string | null = null;
  let remoteRefundList: Array<{ id?: string | number; status?: string }> = [];

  try {
    const paymentClient = getPaymentClient();
    const mpPayment = await paymentClient.get({ id: String(tx.mp_payment_id).trim() });
    mpPaymentStatus = mpPayment.status || null;
    console.log(
      `[Mercado Pago] Status do pagamento: ${mpPayment.status} (${mpPayment.status_detail})`,
    );

    const refundClient = new PaymentRefund(getMercadoPagoConfig());
    const listRes = await refundClient.list({ payment_id: String(tx.mp_payment_id).trim() });
    if (Array.isArray(listRes)) {
      remoteRefundList = listRes as Array<{ id?: string | number; status?: string }>;
    }
    console.log(`[Mercado Pago] Refunds existentes vinculados: ${remoteRefundList.length}`);
    for (const r of remoteRefundList) {
      console.log(`  * Refund MP ID: ${r.id} | Status: ${r.status}`);
    }
  } catch (mpErr: unknown) {
    const safeError = serializeMercadoPagoError(mpErr);
    console.warn(
      `[Mercado Pago Consulta] Atenção: ${safeError.errorMessage} (HTTP ${safeError.httpStatus}, Código: ${safeError.apiCode})`,
    );
  }

  const hasConfirmedRemoteRefund =
    mpPaymentStatus === 'refunded' ||
    remoteRefundList.some((r) => r.status === 'approved' || r.status === 'refunded');

  if (hasConfirmedRemoteRefund) {
    console.log('\n[DIAGNÓSTICO] O Mercado Pago já possui estorno confirmado para este pagamento!');
    const confirmedRemoteId = remoteRefundList.find(
      (r) => r.status === 'approved' || r.status === 'refunded',
    )?.id;

    if (dryRun) {
      console.log(
        '[DRY-RUN] Em execução real, reconciliaremos o banco de dados para "refunded" com MP Refund ID:',
        confirmedRemoteId,
      );
      return;
    }

    const targetRefund = existingRefunds?.[0];
    if (targetRefund) {
      console.log('[AÇÃO] Reconciliando refund no banco de dados...');
      const rec = await reconcileSingleRefund(targetRefund.id, adminDb);
      console.log('[RESULTADO]', rec);
    } else {
      console.log('[AÇÃO] Atualizando transação e consulta para refunded...');
      const nowIso = new Date().toISOString();
      await adminDb
        .from('payment_transactions')
        .update({
          status: 'refunded',
          refund_status: 'refunded',
          mp_refund_id: confirmedRemoteId ? String(confirmedRemoteId) : null,
          refunded_at: nowIso,
          updated_at: nowIso,
        })
        .eq('id', tx.id);

      await adminDb
        .from('customer_plate_consultations')
        .update({
          status: 'refunded',
          payment_status: 'refunded',
          updated_at: nowIso,
        })
        .eq('id', tx.consultation_id);
    }

    console.log('[SUCESSO] Transação e consulta atualizadas para estornadas.');
    return;
  }

  // 5. Se não existe refund remoto confirmado, precisamos disparar ou reconciliar
  console.log('\n[DIAGNÓSTICO] Nenhum estorno confirmado no Mercado Pago atualmente.');
  if (dryRun) {
    console.log(
      '[DRY-RUN] Em execução real, executaremos initiateRefundForFailedDelivery com chave de idempotência.',
    );
    return;
  }

  console.log('[AÇÃO] Disparando initiateRefundForFailedDelivery...');
  const outcome = await initiateRefundForFailedDelivery({
    transactionId: tx.id,
    consultationId: tx.consultation_id,
    reasonCode: 'APIBRASIL_INSUFFICIENT_CREDITS',
    reasonSafe: 'Saldo ou crédito insuficiente na conta corporativa do provedor.',
    dbClient: adminDb,
  });

  console.log('[RESULTADO DO DISPARO]:', outcome);

  if (outcome.success) {
    console.log('[SUCESSO] Operação de estorno processada com status:', outcome.status);
  } else {
    console.error('[FALHA] Falha na operação de estorno:', outcome.error);
    if (outcome.safeProviderError) {
      console.error('[DETALHES DO PROVEDOR]:', outcome.safeProviderError);
    }
  }
}

run().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
