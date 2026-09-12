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
      '1': {
        alias: 'A',
        description:
          'Clone do request normal AF Motos (Mastercard, issuer dinâmico se retornado pelo Brick, external_reference, metadata, requestOptions com idempotência)',
        allowedInEnvironment: gate.allowed,
      },
      '2': {
        alias: 'C',
        description:
          'Mesmo request AF Motos, SEM issuer_id (isola estritamente a variável issuer_id para verificar erro 500)',
        allowedInEnvironment: gate.allowed,
      },
      '3': {
        alias: 'B',
        description:
          'Clone mínimo do exemplo funcional Moura’s Pizzas (sem description, sem notification_url, metadata com preference_id)',
        allowedInEnvironment: gate.allowed,
      },
    },
  });
}

/**
 * POST: Executa uma variação de teste (1, 2, 3 ou A, B, C) de forma estritamente isolada.
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
    variation?: '1' | '2' | '3' | 'A' | 'B' | 'C';
    token?: string;
    installments?: number;
    userEmail?: string;
    normalizedCpf?: string;
    brickIssuerId?: number | string | null;
    tokenCreatedAt?: number;
  } = {};

  try {
    bodyData = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido no corpo da requisição.' }, { status: 400 });
  }

  const {
    variation = '1',
    token,
    installments = 1,
    userEmail = 'cliente.teste@exemplo.com',
    normalizedCpf = '12345678909',
    brickIssuerId,
    tokenCreatedAt,
  } = bodyData;

  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    return NextResponse.json(
      { error: 'Token do cartão (gerado pelo Brick) é obrigatório para o teste.' },
      { status: 400 },
    );
  }

  const flowId = crypto.randomUUID();
  const params: DiagnosticVariationParams = {
    canonicalAmount: 49.99,
    token: token.trim(),
    installments,
    userEmail,
    normalizedCpf,
    flowId,
    consultationId: `diag-${crypto.randomUUID()}`,
    brickIssuerId,
    notificationUrl: getMercadoPagoWebhookUrl(),
    tokenCreatedAt,
  };

  let callData;
  const normVar = String(variation).toUpperCase();
  if (normVar === '1' || normVar === 'A') {
    callData = buildVariationAPayload(params);
  } else if (normVar === '2' || normVar === 'C') {
    callData = buildVariationCPayload(params);
  } else if (normVar === '3' || normVar === 'B') {
    callData = buildVariationBPayload(params);
  } else {
    return NextResponse.json(
      { error: 'Variação inválida. Use 1, 2, 3 (ou A, B, C).' },
      { status: 400 },
    );
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
      variation: normVar,
      snapshotId: callData.snapshot.snapshotId,
      snapshot: callData.snapshot,
      httpStatus: 200,
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

    const allowedHeaders: Record<string, string> = {};
    const anyErr = err as Record<string, unknown>;
    const resHeaders = (anyErr?.apiResponse as { headers?: Record<string, string> })?.headers;
    if (resHeaders && typeof resHeaders === 'object') {
      ['x-request-id', 'x-correlation-id', 'content-type', 'date'].forEach((h) => {
        if (resHeaders[h]) allowedHeaders[h] = String(resHeaders[h]);
      });
    }

    return NextResponse.json(
      {
        success: false,
        variation: normVar,
        snapshotId: callData.snapshot.snapshotId,
        snapshot: callData.snapshot,
        httpStatus: safeErr.providerStatus || 500,
        errorName: safeErr.errorName,
        providerMessage: safeErr.providerMessage,
        errorMessageSanitized: safeErr.errorMessageSanitized,
        providerError: safeErr.providerError,
        causeCount: safeErr.causeCount,
        causesSummary: safeErr.causesSummary || [],
        requestId: safeErr.requestId,
        allowedHeaders,
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
