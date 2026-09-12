import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateMercadoPagoEnvironment } from '@/lib/mercadopago/credentials';
import { getMercadoPagoClient, getPaymentClient } from '@/lib/mercadopago/client';

export const dynamic = 'force-dynamic';

async function isAuthorized(request: NextRequest): Promise<boolean> {
  // 1. Check dedicated server-only token (e.g. Cron/Ops)
  const authHeader = request.headers.get('authorization') || '';
  const internalSecretHeader = request.headers.get('x-internal-secret') || '';
  const expectedOpsToken = process.env.INTERNAL_OPS_TOKEN || process.env.CRON_SECRET;

  if (expectedOpsToken && expectedOpsToken.trim().length > 0) {
    if (authHeader === `Bearer ${expectedOpsToken}` || internalSecretHeader === expectedOpsToken) {
      return true;
    }
  }

  // 2. Check authenticated Supabase Admin user
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
    // If supabase fails, authorization fails
    return false;
  }

  return false;
}

export async function GET(request: NextRequest) {
  const authorized = await isAuthorized(request);
  if (!authorized) {
    return NextResponse.json(
      { error: 'Acesso negado. Rota restrita a administradores e ferramentas autorizadas.' },
      { status: 401 },
    );
  }

  const envValidation = validateMercadoPagoEnvironment();

  let localClientInstantiated = false;
  let clientInstantiationError: string | null = null;

  try {
    getMercadoPagoClient();
    getPaymentClient();
    localClientInstantiated = true;
  } catch (err: unknown) {
    localClientInstantiated = false;
    clientInstantiationError =
      err instanceof Error ? err.message : 'Falha ao inicializar SDK do Mercado Pago.';
  }

  const overallStatus =
    envValidation.isValid && localClientInstantiated
      ? 'healthy'
      : envValidation.providerCredentialMode !== 'missing'
        ? 'degraded'
        : 'unhealthy';

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: envValidation.nodeEnv,
      vercelEnv: envValidation.vercelEnv,
    },
    credentials: {
      mode: envValidation.providerCredentialMode,
      publicKey: envValidation.publicKeyFingerprint,
      accessToken: envValidation.accessTokenFingerprint,
      webhookSecret: envValidation.webhookSecretFingerprint,
      isValid: envValidation.isValid,
      issues: envValidation.issues,
    },
    sdk: {
      name: 'mercadopago',
      version: envValidation.sdkVersion,
      clientInstantiated: localClientInstantiated,
      instantiationError: clientInstantiationError,
    },
  });
}
