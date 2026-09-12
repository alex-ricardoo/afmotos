import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  isDiagnosticTestsAllowed,
  assertDiagnosticTestsAllowed,
  buildVariationAPayload,
  buildVariationBPayload,
  buildVariationCPayload,
  type DiagnosticVariationParams,
} from '@/lib/mercadopago/diagnostic';
import { getMercadoPagoWebhookUrl, getPaymentClient } from '@/lib/mercadopago/client';
import { extractSafeError } from '@/lib/observability/payment-logger';

export const dynamic = 'force-dynamic';

async function isAuthorized(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization') || '';
  const internalSecretHeader = request.headers.get('x-internal-secret') || '';
  const expectedOpsToken = process.env.INTERNAL_OPS_TOKEN || process.env.CRON_SECRET;

  if (expectedOpsToken && expectedOpsToken.trim().length > 0) {
    if (authHeader === `Bearer ${expectedOpsToken}` || internalSecretHeader === expectedOpsToken) {
      return true;
    }
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!authError && user) {
      const { data: adminProfile } = await supabase
        .from('admin_profiles')
        .select('id, role, is_active')
        .eq('auth_user_id', user.id)
        .eq('is_active', true)
        .in('role', ['admin', 'super_admin'])
        .maybeSingle();

      if (adminProfile) {
        return true;
      }
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * GET: Retorna o status de permissão das variações diagnósticas e os metadados das 3 variações.
 */
export async function GET(request: NextRequest) {
  const authorized = await isAuthorized(request);
  if (!authorized) {
    return NextResponse.json(
      { error: 'Acesso negado. Restrito a administradores autorizados.' },
      { status: 401 },
    );
  }

  const gate = isDiagnosticTestsAllowed();
  const webhookUrl = getMercadoPagoWebhookUrl();

  return NextResponse.json({
    allowed: gate.allowed,
    reason: gate.reason || null,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV || 'local',
      enableDiagnosticTests: process.env.ENABLE_MP_DIAGNOSTIC_TESTS || 'false',
    },
    webhookUrlConfigured: Boolean(webhookUrl),
    variations: {
      A: {
        description:
          'Payload normal completo (Mastercard, issuer dinâmico, external_reference, notification_url, requestOptions com idempotência)',
        allowedInEnvironment: gate.allowed,
      },
      B: {
        description:
          'Payload mínimo (Mastercard, sem issuer_id, sem external_reference, sem notification_url)',
        allowedInEnvironment: gate.allowed,
      },
      C: {
        description:
          'Payload completo sem issuer_id (com external_reference, notification_url, requestOptions com idempotência)',
        allowedInEnvironment: gate.allowed,
      },
    },
  });
}

/**
 * POST: Executa uma variação de teste (A, B ou C) de forma estritamente isolada.
 * NUNCA atualiza a consulta veicular para completada e NUNCA libera consulta.
 */
export async function POST(request: NextRequest) {
  const authorized = await isAuthorized(request);
  if (!authorized) {
    return NextResponse.json(
      { error: 'Acesso negado. Restrito a administradores autorizados.' },
      { status: 401 },
    );
  }

  try {
    assertDiagnosticTestsAllowed();
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Diagnóstico bloqueado no ambiente atual.' },
      { status: 403 },
    );
  }

  let bodyData: {
    variation?: 'A' | 'B' | 'C';
    token?: string;
    installments?: number;
    userEmail?: string;
    normalizedCpf?: string;
    brickIssuerId?: number | string | null;
  } = {};

  try {
    bodyData = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido no corpo da requisição.' }, { status: 400 });
  }

  const {
    variation = 'A',
    token,
    installments = 1,
    userEmail = 'teste@exemplo.com',
    normalizedCpf = '12345678909',
    brickIssuerId,
  } = bodyData;

  if (!token) {
    return NextResponse.json(
      { error: 'Token do cartão (gerado pelo Brick) é obrigatório para o teste.' },
      { status: 400 },
    );
  }

  const params: DiagnosticVariationParams = {
    canonicalAmount: 49.99,
    token,
    installments,
    userEmail,
    normalizedCpf,
    flowId: crypto.randomUUID(),
    consultationId: `diag-${crypto.randomUUID()}`,
    brickIssuerId,
    notificationUrl: getMercadoPagoWebhookUrl(),
  };

  let callData;
  if (variation === 'A') {
    callData = buildVariationAPayload(params);
  } else if (variation === 'B') {
    callData = buildVariationBPayload(params);
  } else if (variation === 'C') {
    callData = buildVariationCPayload(params);
  } else {
    return NextResponse.json({ error: 'Variação inválida. Use A, B ou C.' }, { status: 400 });
  }

  const startTime = Date.now();
  try {
    const paymentClient = getPaymentClient();
    const mpPayment = await paymentClient.create({
      body: callData.body as Parameters<typeof paymentClient.create>[0]['body'],
      requestOptions: callData.requestOptions,
    });

    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      variation,
      mpPaymentId: mpPayment?.id ? String(mpPayment.id) : null,
      status: mpPayment?.status,
      statusDetail: mpPayment?.status_detail,
      durationMs,
      idempotencyKeyPresent: Boolean(callData.idempotencyKey),
      idempotencyGenerated: true,
      idempotencyForwardingAttempted: true,
      idempotencyHeaderName: 'X-Idempotency-Key',
    });
  } catch (err: unknown) {
    const durationMs = Date.now() - startTime;
    const safeErr = extractSafeError(err);

    return NextResponse.json(
      {
        success: false,
        variation,
        errorName: safeErr.errorName,
        errorMessageSanitized: safeErr.errorMessageSanitized,
        providerStatus: safeErr.providerStatus,
        providerMessage: safeErr.providerMessage,
        providerError: safeErr.providerError,
        causeCount: safeErr.causeCount,
        causesSummary: safeErr.causesSummary,
        requestId: safeErr.requestId,
        durationMs,
        idempotencyKeyPresent: Boolean(callData.idempotencyKey),
        idempotencyGenerated: true,
        idempotencyForwardingAttempted: true,
        idempotencyHeaderName: 'X-Idempotency-Key',
      },
      { status: safeErr.providerStatus === 500 ? 500 : 422 },
    );
  }
}
