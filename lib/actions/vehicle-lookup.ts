'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { executeVehiclePlateLookup } from '@/lib/vehicle-lookup/service';
import { checkCacheForPlate } from '@/lib/queries/vehicle-lookup';
import { normalizeBrazilianPlate, isValidBrazilianPlate } from '@/lib/vehicle-lookup/plate';
import {
  createManualReprocessAuditRecord,
  checkAmbiguousProviderAttempt,
} from '@/lib/vehicle-lookup/lock-service';

export interface ExecuteLookupActionInput {
  plate: string;
  confirmedPlate: string;
  confirmationMessageVersion?: string;
  motorcycleId?: string | null;
  sellRequestId?: string | null;
  forceRefresh?: boolean;
  isManualReprocess?: boolean;
  confirmedManualReprocess?: boolean;
  manualReprocessReason?: string;
}

export async function checkPlateCacheAction(plate: string) {
  try {
    const normalized = normalizeBrazilianPlate(plate);
    console.log(`[VEHICLE_LOOKUP] [checkPlateCacheAction] Checando cache para a placa: "${plate}" (normalizada: "${normalized}")`);
    if (!isValidBrazilianPlate(normalized)) {
      console.warn(`[VEHICLE_LOOKUP] [checkPlateCacheAction] Placa inválida: "${plate}"`);
      return { data: null, error: 'Placa inválida.' };
    }
    const cached = await checkCacheForPlate(normalized);
    if (cached) {
      console.log(`[VEHICLE_LOOKUP] [checkPlateCacheAction] ✅ Placa "${normalized}" encontrada no cache (ID: ${cached.id}, Status: ${cached.status})`);
    } else {
      console.log(`[VEHICLE_LOOKUP] [checkPlateCacheAction] ℹ️ Placa "${normalized}" não encontrada no cache local.`);
    }
    return { data: cached, error: null };
  } catch (err: any) {
    console.error(`[VEHICLE_LOOKUP] [checkPlateCacheAction] ❌ Erro ao checar cache da placa "${plate}":`, err);
    return { data: null, error: err?.message || 'Erro ao verificar cache da placa.' };
  }
}

export async function syncConsultationStatusAction(plate: string) {
  try {
    const normalized = normalizeBrazilianPlate(plate);
    if (!isValidBrazilianPlate(normalized)) {
      return { status: 'invalid_plate' as const };
    }

    const supabase = await createClient();

    // 1. Checa se já existe consulta concluída
    const cached = await checkCacheForPlate(normalized);
    if (cached && cached.status === 'COMPLETED') {
      return {
        status: 'completed' as const,
        consultationId: cached.id,
        isMock: cached.is_mock,
      };
    }

    // 2. Checa se o lock distribuído ainda está ativo
    const lockKey = `apibrasil:veiculos-total:${normalized}`;
    const { data: lockRow } = await supabase
      .from('vehicle_provider_locks')
      .select('locked_at, lock_expires_at, locked_by')
      .eq('lock_key', lockKey)
      .gt('lock_expires_at', new Date().toISOString())
      .maybeSingle();

    if (lockRow) {
      return {
        status: 'processing' as const,
        startedAt: lockRow.locked_at,
        expiresAt: lockRow.lock_expires_at,
      };
    }

    // 3. Checa se existe tentativa ambígua recente
    const { data: attemptRow } = await supabase
      .from('vehicle_provider_attempts')
      .select('id, status, charge_status, created_at')
      .eq('provider', 'apibrasil')
      .eq('operation', 'veiculos-total')
      .eq('plate_normalized', normalized)
      .in('status', ['charge_status_unknown', 'manual_review', 'response_persistence_failed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (attemptRow) {
      return {
        status: 'charge_status_unknown' as const,
        attemptId: attemptRow.id,
        attemptStatus: attemptRow.status,
        canManualReprocess: true,
      };
    }

    return { status: 'not_found' as const };
  } catch (err: any) {
    console.error('[VEHICLE_LOOKUP] [syncConsultationStatusAction] Erro ao sincronizar status:', err);
    return { status: 'error' as const, message: err?.message };
  }
}

export async function executeVehiclePlateLookupAction(input: ExecuteLookupActionInput) {
  console.log(`[VEHICLE_LOOKUP] [executeAction] 🚀 Recebida solicitação de consulta veicular para a placa: "${input.plate}"`);
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[VEHICLE_LOOKUP] [executeAction] ❌ Erro de autenticação: usuário não logado ou sessão expirada.', authError?.message);
      return { error: 'Usuário não autenticado ou sessão expirada.' };
    }

    // =========================================================================
    // BLOQUEADOR 7: Validar permissão administrativa no backend
    // Não confiar apenas em flags do frontend.
    // =========================================================================
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('id, is_active')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!adminProfile) {
      console.error(`[VEHICLE_LOOKUP] [executeAction] ❌ Usuário ${user.id} não é admin ativo.`);
      return { error: 'Acesso negado. Apenas administradores ativos podem consultar veículos.' };
    }

    const normalized = normalizeBrazilianPlate(input.plate);
    console.log(`[VEHICLE_LOOKUP] [executeAction] Usuário admin: ${user.id} (${user.email || 'sem email'}) | Placa normalizada: "${normalized}"`);

    if (!isValidBrazilianPlate(normalized)) {
      console.warn(`[VEHICLE_LOOKUP] [executeAction] ❌ Placa com formato inválido: "${input.plate}"`);
      return { error: `A placa "${input.plate}" não possui formato válido (antigo ou Mercosul).` };
    }

    const { logProviderEvent } = await import('@/lib/vehicle-lookup/provider-logger');
    const logicalRequestId = `req_admin_${crypto.randomUUID()}`;

    // =========================================================================
    // BLOQUEADOR 7: Reprocessamento manual com auditoria backend
    // =========================================================================
    if (input.isManualReprocess && input.confirmedManualReprocess) {
      // Validar que reason foi fornecido
      if (!input.manualReprocessReason || input.manualReprocessReason.trim().length < 5) {
        logProviderEvent({
          event: 'provider_manual_reprocess_denied',
          provider: 'apibrasil',
          operation: 'veiculos-total',
          placa_normalizada: normalized,
          logical_request_id: logicalRequestId,
          physical_request_id: 'pending',
          attempt_number: 1,
          timeout_ms: 120000,
          duration_ms: 0,
          status: 'blocked',
          charge_status: 'not_sent',
          origem: 'admin_panel',
          extra: { reason: 'missing_or_short_reason', actor_id: user.id },
        });

        return {
          error: 'Para reprocessar manualmente, é obrigatório fornecer o motivo (mínimo 5 caracteres).',
          isManualReprocessDenied: true,
        };
      }

      // Verificar se existe tentativa ambígua para esta placa
      const ambiguousCheck = await checkAmbiguousProviderAttempt(
        'apibrasil',
        'veiculos-total',
        normalized,
        supabase,
      );

      // Registrar auditoria de reprocessamento manual ANTES de executar
      const auditId = await createManualReprocessAuditRecord(
        {
          actorId: user.id,
          actorType: 'admin',
          previousAttemptId: ambiguousCheck.attemptId || null,
          provider: 'apibrasil',
          operation: 'veiculos-total',
          plateNormalized: normalized,
          reason: input.manualReprocessReason.trim(),
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
          audit_id: auditId,
          has_ambiguous_attempt: ambiguousCheck.hasAmbiguousAttempt,
          previous_attempt_id: ambiguousCheck.attemptId,
          reason: input.manualReprocessReason.trim(),
        },
      });
    } else if (input.isManualReprocess) {
      logProviderEvent({
        event: 'provider_manual_reprocess_requested',
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
      });
    }

    console.log(`[VEHICLE_LOOKUP] [executeAction] Chamando executeVehiclePlateLookup...`);
    const result = await executeVehiclePlateLookup(
      {
        plate: normalized,
        userId: user.id,
        confirmedPlate: input.confirmedPlate || input.plate,
        confirmationMessageVersion: input.confirmationMessageVersion || 'v1.0',
        motorcycleId: input.motorcycleId,
        sellRequestId: input.sellRequestId,
        forceRefresh: Boolean(input.forceRefresh && input.confirmedManualReprocess),
        logicalRequestId,
        source: 'admin_panel',
        isManualReprocess: input.isManualReprocess,
        confirmedManualReprocess: input.confirmedManualReprocess,
        manualReprocessReason: input.manualReprocessReason,
      },
      supabase
    );

    console.log(`[VEHICLE_LOOKUP] [executeAction] ✅ Consulta processada com sucesso! ID: ${result.record.id} | CacheHit: ${result.isCacheHit} | isMock: ${result.record.is_mock}`);
    revalidatePath('/admin/consulta-placa');

    return {
      success: true,
      consultationId: result.record.id,
      isCacheHit: result.isCacheHit,
      message: result.message,
      isMock: result.record.is_mock,
    };
  } catch (err: any) {
    console.error('[VEHICLE_LOOKUP] [executeAction] ❌ Erro durante a execução da consulta veicular:', err);

    if (
      err?.name === 'ConsultationInProgressError' ||
      err?.code === 'CONSULTATION_IN_PROGRESS' ||
      err?.statusCode === 409
    ) {
      return {
        error:
          'Já existe uma consulta em andamento para esta placa. Para evitar cobrança duplicada, aguarde a conclusão.',
        isConsultationInProgress: true,
        statusCode: 409,
      };
    }

    if (err?.name === 'ChargeStatusUnknownError' || err?.code === 'CHARGE_STATUS_UNKNOWN') {
      return {
        error: err.message,
        isChargeStatusUnknown: true,
        statusCode: 504,
        canManualReprocess: true,
      };
    }

    if (
      err?.name === 'ProviderLockUnavailableError' ||
      err?.code === 'LOCK_UNAVAILABLE'
    ) {
      return {
        error: err.message,
        isLockUnavailable: true,
        statusCode: 503,
      };
    }

    if (
      err?.name === 'ProviderPersistenceAfterSuccessError' ||
      err?.code === 'DATABASE_PERSISTENCE_FAILED_AFTER_PROVIDER_SUCCESS'
    ) {
      return {
        error: err.message,
        isPersistenceError: true,
        statusCode: 503,
        canManualReprocess: false,
      };
    }

    if (
      err?.name === 'AmbiguousAttemptGuardError' ||
      err?.code === 'CHARGE_STATUS_UNKNOWN_RECONCILIATION_REQUIRED'
    ) {
      return {
        error: err.message,
        isAmbiguousAttempt: true,
        statusCode: 409,
        canManualReprocess: true,
        previousAttemptId: err?.previousAttemptId,
      };
    }

    if (err?.name === 'InsufficientBalanceError') {
      console.warn(`[VEHICLE_LOOKUP] [executeAction] ⚠️ Saldo insuficiente na API Brasil: ${err.balance}`);
      return {
        error: err.message,
        isInsufficientBalance: true,
        rechargeUrl: err.rechargeUrl || 'https://app.apibrasil.io/dashboard?modal=recharge',
        balance: err.balance || 'R$ 0,00',
      };
    }

    if (err?.name === 'InvalidTokenError') {
      console.error(`[VEHICLE_LOOKUP] [executeAction] ❌ Token inválido ou expirado da API Brasil`);
      return {
        error: err.message,
        isTokenError: true,
      };
    }

    if (err?.name === 'ProviderUnavailableError' || err?.isProviderUnavailable) {
      console.warn(`[VEHICLE_LOOKUP] [executeAction] ⚠️ Bases oficiais ou API Brasil temporariamente indisponíveis.`);
      return {
        error: err.message,
        isProviderUnavailable: true,
        attempts: 1,
        lastStatusCode: err.lastStatusCode,
        userGuidance:
          'Não foi possível consultar as bases oficiais no momento por instabilidade temporária no SENATRAN / DETRAN ou na API Brasil. Retentativas automáticas foram desligadas para sua segurança financeira.',
      };
    }

    return {
      error: err?.message || 'Ocorreu um erro interno ao processar a consulta veicular na API Brasil.',
    };
  }
}

export async function linkVehicleConsultationAction(params: {
  consultationId: string;
  motorcycleId?: string | null;
  sellRequestId?: string | null;
  consignmentId?: string | null;
  leadId?: string | null;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: 'Usuário não autenticado.' };
    }

    const updatePayload: Record<string, any> = {};
    if (params.motorcycleId !== undefined) updatePayload.motorcycle_id = params.motorcycleId;
    if (params.sellRequestId !== undefined) updatePayload.sell_request_id = params.sellRequestId;
    if (params.consignmentId !== undefined) updatePayload.consignment_id = params.consignmentId;
    if (params.leadId !== undefined) updatePayload.lead_id = params.leadId;

    const { error: updateError } = await supabase
      .from('vehicle_plate_consultations')
      .update(updatePayload)
      .eq('id', params.consultationId);

    if (updateError) {
      return { error: `Erro ao vincular consulta: ${updateError.message}` };
    }

    revalidatePath('/admin/consulta-placa');
    revalidatePath(`/admin/consulta-placa/${params.consultationId}`);

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Erro ao vincular consulta.' };
  }
}
