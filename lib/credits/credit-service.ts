import { createAdminClient } from '../supabase/admin.ts';

export interface GrantRevokeParams {
  userId: string;
  amount: number;
  adminId: string;
  description?: string;
  packageName?: string;
  paymentChannel?: string;
  idempotencyKey?: string;
  dbClient?: unknown;
}

export interface CreditOperationResult {
  success: boolean;
  code?: string;
  message?: string;
  error?: string;
  packageId?: string;
  reservationId?: string;
  availableCredits?: number;
  reservedCredits?: number;
  consumedCredits?: number;
}

interface RpcResponse {
  success?: boolean;
  code?: string;
  message_safe?: string;
  package_id?: string;
  reservation_id?: string;
  available_credits?: number;
  reserved_credits?: number;
  consumed_credits?: number;
}

/**
 * Grants credits to a user (B2B) via secure atomic RPC `grant_credit_package`.
 */
export async function grantCreditsToUser({
  userId,
  amount,
  adminId,
  description = 'Créditos adicionados administrativamente',
  packageName = 'Pacote Administrativo B2B',
  paymentChannel = 'whatsapp',
  idempotencyKey,
  dbClient,
}: GrantRevokeParams): Promise<CreditOperationResult> {
  void adminId;
  if (amount <= 0) {
    return { success: false, error: 'O valor deve ser maior que zero.' };
  }

  const adminDb = (dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();

  const generatedKey =
    idempotencyKey || `grant_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  try {
    const { data, error } = await adminDb.rpc('grant_credit_package', {
      p_user_id: userId,
      p_package_name: packageName,
      p_package_type: 'manual_negotiated',
      p_credits_granted: amount,
      p_payment_channel: paymentChannel,
      p_idempotency_key: generatedKey,
      p_admin_note: description,
    });

    if (error) {
      console.error('[grantCreditsToUser] RPC error:', error);
      return { success: false, error: error.message };
    }

    const res = data as RpcResponse | null;
    if (!res || !res.success) {
      return {
        success: false,
        code: res?.code,
        error: res?.message_safe || 'Falha ao conceder pacote de créditos.',
      };
    }

    return {
      success: true,
      code: res.code,
      message: res.message_safe,
      packageId: res.package_id,
      availableCredits: res.available_credits,
      reservedCredits: res.reserved_credits,
      consumedCredits: res.consumed_credits,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[grantCreditsToUser] Unexpected error:', err);
    return { success: false, error: message };
  }
}

/**
 * Revokes / adjusts credits from a user (B2B) via secure atomic RPC `adjust_credit_package`.
 */
export async function revokeCreditsFromUser({
  userId,
  amount,
  adminId,
  description = 'Créditos removidos administrativamente',
  idempotencyKey,
  dbClient,
}: GrantRevokeParams): Promise<CreditOperationResult> {
  void adminId;
  if (amount <= 0) {
    return { success: false, error: 'O valor deve ser maior que zero.' };
  }

  const adminDb = (dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();

  try {
    // Locate the active package for this user with remaining credits
    const { data: pkg, error: pkgError } = await adminDb
      .from('customer_credit_packages')
      .select('id, credits_remaining')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('credits_remaining', 0)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (pkgError || !pkg) {
      return {
        success: false,
        error: 'Nenhum pacote ativo com créditos remanescentes encontrado para ajuste.',
      };
    }

    const generatedKey =
      idempotencyKey ||
      `adjust_${pkg.id}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const { data, error } = await adminDb.rpc('adjust_credit_package', {
      p_package_id: pkg.id,
      p_adjustment_type: 'remove',
      p_quantity: amount,
      p_reason_code: 'ADMIN_MANUAL_REMOVAL',
      p_admin_note: description,
      p_idempotency_key: generatedKey,
    });

    if (error) {
      console.error('[revokeCreditsFromUser] RPC error:', error);
      return { success: false, error: error.message };
    }

    const res = data as RpcResponse | null;
    if (!res || !res.success) {
      return {
        success: false,
        code: res?.code,
        error: res?.message_safe || 'Falha ao remover créditos.',
      };
    }

    return {
      success: true,
      code: res.code,
      message: res.message_safe,
      packageId: res.package_id,
      availableCredits: res.available_credits,
      reservedCredits: res.reserved_credits,
      consumedCredits: res.consumed_credits,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[revokeCreditsFromUser] Unexpected error:', err);
    return { success: false, error: message };
  }
}

/**
 * Fetches current available credit balance for a user.
 */
export async function getUserCreditBalance(userId: string, dbClient?: unknown): Promise<number> {
  const adminDb = (dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();
  const { data } = await adminDb
    .from('customer_credit_balances')
    .select('available_credits')
    .eq('user_id', userId)
    .maybeSingle();

  return data?.available_credits || 0;
}

function maskId(id?: string): string {
  if (!id) return 'unknown';
  if (id.length <= 8) return '***';
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}

/**
 * Calls the RPC to atomically reserve 1 credit.
 */
export async function reserveConsultationCredit(
  userId: string,
  consultationId: string,
  dbClient?: unknown,
): Promise<CreditOperationResult> {
  const adminDb = (dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();
  const idempotencyKey = `res_${consultationId}`;

  try {
    const { data, error } = await adminDb.rpc('reserve_credit_for_consultation', {
      p_consultation_id: consultationId,
      p_idempotency_key: idempotencyKey,
      p_override_user_id: userId,
    });

    if (error) {
      console.error('[CREDIT_CONSUMPTION] credit_consumption.reservation_failed', {
        consultationIdMasked: maskId(consultationId),
        userIdMasked: maskId(userId),
        databaseErrorCode: error.code || 'UNKNOWN',
        operation: 'reserve_credit_for_consultation',
        rollbackExpected: true,
        timestamp: new Date().toISOString(),
      });

      return {
        success: false,
        code: 'CREDIT_RESERVATION_FAILED',
        error:
          'Não foi possível reservar seu crédito agora. Nenhum crédito foi consumido. Tente novamente em alguns instantes.',
      };
    }

    const res = data as RpcResponse | null;
    if (!res || !res.success) {
      console.warn(
        '[reserveConsultationCredit] Reservation declined:',
        res?.code,
        res?.message_safe,
      );
      return {
        success: false,
        code: res?.code || 'CREDIT_RESERVATION_FAILED',
        error: res?.message_safe || 'Saldo de créditos insuficiente ou erro ao reservar crédito.',
      };
    }

    return {
      success: true,
      code: res.code,
      message: res.message_safe,
      reservationId: res.reservation_id,
      packageId: res.package_id,
      availableCredits: res.available_credits,
      reservedCredits: res.reserved_credits,
      consumedCredits: res.consumed_credits,
    };
  } catch (err: unknown) {
    const errorCode =
      err && typeof err === 'object' && 'code' in err
        ? String((err as { code: unknown }).code)
        : 'UNEXPECTED_ERROR';
    console.error('[CREDIT_CONSUMPTION] credit_consumption.reservation_failed', {
      consultationIdMasked: maskId(consultationId),
      userIdMasked: maskId(userId),
      databaseErrorCode: errorCode,
      operation: 'reserve_credit_for_consultation',
      rollbackExpected: true,
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      code: 'CREDIT_RESERVATION_FAILED',
      error:
        'Não foi possível reservar seu crédito agora. Nenhum crédito foi consumido. Tente novamente em alguns instantes.',
    };
  }
}

/**
 * Calls the RPC to atomically consume 1 reserved credit after successful live report delivery.
 */
export async function consumeConsultationCredit(
  consultationId: string,
  isMock: boolean = false,
  environment: string = process.env.NODE_ENV || 'development',
  dbClient?: unknown,
): Promise<boolean> {
  const adminDb = (dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();

  const { data, error } = await adminDb.rpc('consume_reserved_credit', {
    p_consultation_id: consultationId,
    p_is_mock_delivery: isMock,
    p_environment: environment,
  });

  if (error) {
    console.error('[consumeConsultationCredit] RPC error:', error);
    return false;
  }

  const res = data as RpcResponse | null;
  if (!res || !res.success) {
    console.warn('[consumeConsultationCredit] Consumption declined:', res?.code, res?.message_safe);
    return false;
  }

  return true;
}

/**
 * Calls the RPC to atomically release 1 reserved credit back.
 */
export async function releaseConsultationCredit(
  userId: string,
  consultationId: string,
  dbClient?: unknown,
): Promise<boolean> {
  void userId;
  const adminDb = (dbClient as ReturnType<typeof createAdminClient>) || createAdminClient();

  const { data, error } = await adminDb.rpc('release_reserved_credit', {
    p_consultation_id: consultationId,
    p_reason_code: 'DELIVERY_FAILED_PERMANENT',
    p_reason_note: 'Falha definitiva na entrega do laudo ou cancelamento',
  });

  if (error) {
    console.error('[releaseConsultationCredit] RPC error:', error);
    return false;
  }

  const res = data as RpcResponse | null;
  if (!res || !res.success) {
    console.warn('[releaseConsultationCredit] Release declined:', res?.code, res?.message_safe);
    return false;
  }

  return true;
}
