/**
 * BLOQUEADOR 6: Route Handler dedicada para execução da consulta paga.
 * Garante que maxDuration, runtime='nodejs' e dynamic='force-dynamic'
 * são aplicados no executor real da chamada à API Brasil.
 *
 * O frontend pode optar por chamar esta rota em vez da Server Action
 * para ter controle explícito sobre o timeout do Vercel.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { executeVehiclePlateLookup } from '@/lib/vehicle-lookup/service';
import { normalizeBrazilianPlate, isValidBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import {
  createManualReprocessAuditRecord,
  checkAmbiguousProviderAttempt,
} from '@/lib/vehicle-lookup/lock-service';
import { logProviderEvent } from '@/lib/vehicle-lookup/provider-logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 150;

interface LookupRequestBody {
  plate: string;
  confirmedPlate?: string;
  confirmationMessageVersion?: string;
  motorcycleId?: string | null;
  sellRequestId?: string | null;
  forceRefresh?: boolean;
  isManualReprocess?: boolean;
  confirmedManualReprocess?: boolean;
  manualReprocessReason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado ou sessão expirada.' },
        { status: 401 },
      );
    }

    // BLOQUEADOR 7: Verificar admin no backend
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('id, is_active')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!adminProfile) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores ativos podem consultar veículos.' },
        { status: 403 },
      );
    }

    const body = (await request.json()) as LookupRequestBody;
    const normalized = normalizeBrazilianPlate(body.plate);

    if (!isValidBrazilianPlate(normalized)) {
      return NextResponse.json(
        { error: `A placa "${body.plate}" não possui formato válido.` },
        { status: 400 },
      );
    }

    const logicalRequestId = `req_admin_${crypto.randomUUID()}`;

    // BLOQUEADOR 7: Auditoria de reprocessamento manual
    if (body.isManualReprocess && body.confirmedManualReprocess) {
      if (!body.manualReprocessReason || body.manualReprocessReason.trim().length < 5) {
        return NextResponse.json(
          {
            error: 'Para reprocessar manualmente, é obrigatório fornecer o motivo (mínimo 5 caracteres).',
            isManualReprocessDenied: true,
          },
          { status: 400 },
        );
      }

      const ambiguousCheck = await checkAmbiguousProviderAttempt(
        'apibrasil', 'veiculos-total', normalized, supabase,
      );

      await createManualReprocessAuditRecord(
        {
          actorId: user.id,
          actorType: 'admin',
          previousAttemptId: ambiguousCheck.attemptId || null,
          provider: 'apibrasil',
          operation: 'veiculos-total',
          plateNormalized: normalized,
          reason: body.manualReprocessReason.trim(),
          estimatedCostCents: 3000,
          acknowledgedRisk: true,
          logicalRequestId,
        },
        supabase,
      );

      logProviderEvent({
        event: 'provider_manual_reprocess_authorized',
        provider: 'apibrasil',
        operation: 'veiculos-total',
        placa_normalizada: normalized,
        logical_request_id: logicalRequestId,
        physical_request_id: 'pending',
        attempt_number: 1,
        timeout_ms: 120000,
        duration_ms: 0,
        status: 'created',
        charge_status: 'not_sent',
        origem: 'admin_panel',
        extra: {
          actor_id: user.id,
          has_ambiguous: ambiguousCheck.hasAmbiguousAttempt,
          previous_attempt_id: ambiguousCheck.attemptId,
        },
      });
    }

    const result = await executeVehiclePlateLookup(
      {
        plate: normalized,
        userId: user.id,
        confirmedPlate: body.confirmedPlate || body.plate,
        confirmationMessageVersion: body.confirmationMessageVersion || 'v1.0',
        motorcycleId: body.motorcycleId,
        sellRequestId: body.sellRequestId,
        forceRefresh: Boolean(body.forceRefresh && body.confirmedManualReprocess),
        logicalRequestId,
        source: 'admin_panel',
        isManualReprocess: body.isManualReprocess,
        confirmedManualReprocess: body.confirmedManualReprocess,
        manualReprocessReason: body.manualReprocessReason,
      },
      supabase,
    );

    return NextResponse.json({
      success: true,
      consultationId: result.record.id,
      isCacheHit: result.isCacheHit,
      message: result.message,
      isMock: result.record.is_mock,
    });
  } catch (err: any) {
    console.error('[POST /api/admin/vehicle-lookup] ❌ Erro:', err);

    const statusMap: Record<string, number> = {
      ConsultationInProgressError: 409,
      AmbiguousAttemptGuardError: 409,
      ChargeStatusUnknownError: 504,
      ProviderLockUnavailableError: 503,
      ProviderPersistenceAfterSuccessError: 503,
      InsufficientBalanceError: 402,
      InvalidTokenError: 401,
      ProviderUnavailableError: 502,
    };

    const statusCode = statusMap[err?.name] || err?.statusCode || 500;

    return NextResponse.json(
      {
        error: err?.message || 'Erro interno ao processar consulta veicular.',
        code: err?.code || 'UNKNOWN',
        canManualReprocess: err?.code === 'CHARGE_STATUS_UNKNOWN' || err?.code === 'CHARGE_STATUS_UNKNOWN_RECONCILIATION_REQUIRED',
      },
      { status: statusCode },
    );
  }
}
