import type { SupabaseClient } from '@supabase/supabase-js';
import {
  generateShareToken,
  hashShareToken,
  isValidShareToken,
  hashClientIp,
} from './share-token.ts';
import { toPublicVehicleReportDto } from './adapters/public-report-dto.ts';
import { toInternalVehicleConsultationDto } from './adapters/vehicle-summary.ts';
import type {
  ShareCreationResult,
  VehicleReportShareRecord,
  PublicVehicleReportDto,
  AdminVehicleShareDetailsDto,
} from './share-types.ts';
import { getBaseSiteUrl } from '../seo/config.ts';

async function resolveSupabaseClient(explicitClient?: SupabaseClient): Promise<SupabaseClient> {
  if (explicitClient) return explicitClient;
  const { createClient } = await import('../supabase/server.ts');
  return createClient();
}

async function resolveAdminSupabaseClient(explicitClient?: SupabaseClient): Promise<SupabaseClient> {
  if (explicitClient) return explicitClient;
  try {
    const { createAdminClient } = await import('../supabase/admin.ts');
    return createAdminClient();
  } catch {
    const { createClient } = await import('../supabase/server.ts');
    return createClient();
  }
}

// In-memory sliding window rate limiter for suspicious / invalid share token attempts
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_INVALID_ATTEMPTS_PER_IP = 15;

/**
 * Validates rate limit for a client IP.
 * Returns true if request is permitted, false if blocked (429).
 */
export function checkInvalidAttemptRateLimit(clientIp: string | null | undefined): boolean {
  if (!clientIp) return true;
  // Never rate-limit localhost in development
  if (
    process.env.NODE_ENV === 'development' ||
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp === 'localhost'
  ) {
    return true;
  }

  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);

  if (!entry || now > entry.resetAt) {
    return true;
  }

  return entry.count < MAX_INVALID_ATTEMPTS_PER_IP;
}

/**
 * Registers an invalid attempt against a client IP.
 */
export function registerInvalidAttempt(clientIp: string | null | undefined): void {
  if (!clientIp) return;
  if (
    process.env.NODE_ENV === 'development' ||
    clientIp === '127.0.0.1' ||
    clientIp === '::1' ||
    clientIp === 'localhost'
  ) {
    return;
  }

  const now = Date.now();
  const entry = rateLimitMap.get(clientIp);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

/**
 * Categorizes User-Agent string for privacy-compliant device analytics
 */
function categorizeUserAgent(userAgent?: string): 'MOBILE' | 'DESKTOP' | 'BOT' | 'OTHER' {
  if (!userAgent) return 'OTHER';
  if (/bot|crawl|spider|slurp|google|bing/i.test(userAgent)) return 'BOT';
  if (/mobi|android|iphone|ipad|ipod/i.test(userAgent)) return 'MOBILE';
  return 'DESKTOP';
}

/**
 * Creates a secure public share token and record for an existing vehicle consultation.
 */
export async function createShareRecord(
  params: {
    consultationId: string;
    adminUserId: string;
    forceRevokeExisting?: boolean;
  },
  client?: SupabaseClient
): Promise<ShareCreationResult> {
  const supabase = await resolveSupabaseClient(client);

  // 1. Verify consultation existence and status
  const { data: consultation, error: consultError } = await supabase
    .from('vehicle_plate_consultations')
    .select('id, status, is_mock, plate_display')
    .eq('id', params.consultationId)
    .single();

  if (consultError || !consultation) {
    throw new Error('Consulta veicular não encontrada.');
  }

  if (consultation.status !== 'COMPLETED') {
    throw new Error('Apenas consultas veiculares concluídas com sucesso podem ser compartilhadas.');
  }

  // 2. Check for active share records
  const { data: activeShares } = await supabase
    .from('vehicle_report_shares')
    .select('id')
    .eq('consultation_id', params.consultationId)
    .eq('status', 'active');

  if (activeShares && activeShares.length > 0) {
    if (!params.forceRevokeExisting) {
      throw new Error('Esta consulta já possui um link público ativo. Deseja revogar o anterior e gerar um novo?');
    }

    // Revoke previous active shares
    await supabase
      .from('vehicle_report_shares')
      .update({
        status: 'revoked',
        revoked_at: new Date().toISOString(),
        revoked_by: params.adminUserId,
        revoke_reason: 'Substituído por novo link',
      })
      .eq('consultation_id', params.consultationId)
      .eq('status', 'active');
  }

  // 3. Generate token & hash
  const shareToken = generateShareToken();
  const tokenHash = hashShareToken(shareToken);

  // 4. Persist only token_hash with 30-day (1 month) validity
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data: newShare, error: insertError } = await supabase
    .from('vehicle_report_shares')
    .insert({
      consultation_id: params.consultationId,
      token_hash: tokenHash,
      status: 'active',
      created_by: params.adminUserId,
      expires_at: expiresAt,
    })
    .select('id, created_at, expires_at')
    .single();

  if (insertError || !newShare) {
    console.error('Error inserting vehicle report share:', insertError);
    throw new Error('Falha ao gerar o link de compartilhamento.');
  }

  // 5. Log audit event
  try {
    await supabase.from('vehicle_report_share_events').insert({
      share_id: newShare.id,
      consultation_id: params.consultationId,
      event_type: 'SHARE_CREATED',
      is_success: true,
      event_data: { created_by: params.adminUserId },
    });
  } catch (auditErr) {
    console.warn('Failed to insert share audit event:', auditErr);
  }

  const baseUrl = getBaseSiteUrl();
  const shareUrl = `${baseUrl}/laudos/veicular/${shareToken}`;

  return {
    share_id: newShare.id,
    consultation_id: params.consultationId,
    share_token: shareToken,
    share_url: shareUrl,
    created_at: newShare.created_at,
  };
}

/**
 * Retrieves sanitized public vehicle report using a public share token.
 */
export async function getPublicReportByShareToken(
  params: {
    shareToken: string;
    clientIp?: string;
    userAgent?: string;
  },
  client?: SupabaseClient
): Promise<{
  publicDto: PublicVehicleReportDto;
  share: VehicleReportShareRecord;
} | null> {
  const { shareToken, clientIp, userAgent } = params;

  // 1. Validate token format
  if (!isValidShareToken(shareToken)) {
    registerInvalidAttempt(clientIp);
    return null;
  }

  // 2. Compute hash and search
  const tokenHash = hashShareToken(shareToken);
  const supabase = await resolveAdminSupabaseClient(client);

  const { data: share, error: shareError } = await supabase
    .from('vehicle_report_shares')
    .select('*')
    .eq('token_hash', tokenHash)
    .eq('status', 'active')
    .single();

  if (shareError || !share) {
    console.warn('[ShareService] Active share not found for token hash:', {
      error: shareError?.message || 'No matching row',
      tokenHashPrefix: tokenHash.substring(0, 8),
    });
    registerInvalidAttempt(clientIp);
    return null;
  }

  // 3. Check expiration if present
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    console.warn('[ShareService] Share token has expired:', share.id);
    await supabase
      .from('vehicle_report_shares')
      .update({ status: 'expired' })
      .eq('id', share.id);
    return null;
  }

  // 4. Fetch linked consultation snapshot
  const { data: consultation, error: consultError } = await supabase
    .from('vehicle_plate_consultations')
    .select('*')
    .eq('id', share.consultation_id)
    .single();

  if (consultError || !consultation || consultation.status !== 'COMPLETED') {
    console.warn('[ShareService] Consultation not found or not completed:', {
      consultationId: share.consultation_id,
      error: consultError?.message,
      status: consultation?.status,
    });
    return null;
  }

  // 5. Update metrics & audit log (non-blocking)
  const ipHash = hashClientIp(clientIp);
  const userAgentCategory = categorizeUserAgent(userAgent);

  void (async () => {
    try {
      await supabase
        .from('vehicle_report_shares')
        .update({
          access_count: (share.access_count || 0) + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', share.id);

      await supabase.from('vehicle_report_share_events').insert({
        share_id: share.id,
        consultation_id: consultation.id,
        event_type: 'SHARE_OPENED',
        ip_hash: ipHash,
        user_agent_category: userAgentCategory,
        is_success: true,
      });
    } catch (err: unknown) {
      console.warn('Could not update share access audit:', err);
    }
  })();

  // 6. Build and return sanitized public DTO with dynamic site settings
  const { data: settings } = await supabase
    .from('site_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  const internalDto = toInternalVehicleConsultationDto(consultation);
  const publicDto = toPublicVehicleReportDto(internalDto, { shareId: share.id, settings });

  return {
    publicDto,
    share: share as VehicleReportShareRecord,
  };
}

/**
 * Revokes a shared link, preventing any subsequent access or downloads.
 */
export async function revokeShareRecord(
  params: {
    shareId: string;
    adminUserId: string;
    reason?: string;
  },
  client?: SupabaseClient
): Promise<void> {
  const supabase = await resolveSupabaseClient(client);

  const { data: share, error: fetchError } = await supabase
    .from('vehicle_report_shares')
    .select('id, consultation_id')
    .eq('id', params.shareId)
    .single();

  if (fetchError || !share) {
    throw new Error('Registro de compartilhamento não encontrado.');
  }

  const { error: updateError } = await supabase
    .from('vehicle_report_shares')
    .update({
      status: 'revoked',
      revoked_at: new Date().toISOString(),
      revoked_by: params.adminUserId,
      revoke_reason: params.reason || 'Revogado manualmente pelo administrador',
    })
    .eq('id', params.shareId);

  if (updateError) {
    console.error('Error revoking vehicle report share:', updateError);
    throw new Error('Falha ao revogar o link de compartilhamento.');
  }

  // Audit event
  try {
    await supabase.from('vehicle_report_share_events').insert({
      share_id: params.shareId,
      consultation_id: share.consultation_id,
      event_type: 'SHARE_REVOKED',
      is_success: true,
      event_data: {
        revoked_by: params.adminUserId,
        reason: params.reason || 'Revogado pelo admin',
      },
    });
  } catch (auditErr) {
    console.warn('Failed to insert revocation audit event:', auditErr);
  }
}

/**
 * Increments the download counter for a share record.
 */
export async function incrementPdfDownloadCount(
  params: {
    shareId: string;
    consultationId: string;
    clientIp?: string;
    userAgent?: string;
  },
  client?: SupabaseClient
): Promise<void> {
  const supabase = await resolveAdminSupabaseClient(client);
  const ipHash = hashClientIp(params.clientIp);
  const userAgentCategory = categorizeUserAgent(params.userAgent);

  const { data: share } = await supabase
    .from('vehicle_report_shares')
    .select('pdf_download_count')
    .eq('id', params.shareId)
    .single();

  const currentCount = share?.pdf_download_count || 0;

  await Promise.allSettled([
    supabase
      .from('vehicle_report_shares')
      .update({
        pdf_download_count: currentCount + 1,
        last_pdf_download_at: new Date().toISOString(),
      })
      .eq('id', params.shareId),
    supabase.from('vehicle_report_share_events').insert({
      share_id: params.shareId,
      consultation_id: params.consultationId,
      event_type: 'SHARE_PDF_REQUESTED',
      ip_hash: ipHash,
      user_agent_category: userAgentCategory,
      is_success: true,
    }),
  ]);
}

/**
 * Retrieves the current sharing details and audit state for the admin detail view.
 */
export async function getAdminShareDetailsByConsultationId(
  consultationId: string,
  client?: SupabaseClient
): Promise<AdminVehicleShareDetailsDto> {
  const supabase = await resolveSupabaseClient(client);

  const { data: shares, error } = await supabase
    .from('vehicle_report_shares')
    .select(`
      id,
      status,
      created_at,
      created_by,
      revoked_at,
      revoked_by,
      revoke_reason,
      last_accessed_at,
      access_count,
      last_pdf_download_at,
      pdf_download_count,
      last_print_at,
      print_count
    `)
    .eq('consultation_id', consultationId)
    .order('created_at', { ascending: false });

  if (error || !shares || shares.length === 0) {
    return { hasActiveShare: false };
  }

  const activeShare = shares.find((s) => s.status === 'active');
  const latestRevocation = shares.find((s) => s.status === 'revoked' && s.revoked_at);

  return {
    hasActiveShare: Boolean(activeShare),
    activeShare: activeShare
      ? {
          id: activeShare.id,
          status: activeShare.status as any,
          createdAt: activeShare.created_at,
          lastAccessedAt: activeShare.last_accessed_at,
          accessCount: activeShare.access_count,
          lastPdfDownloadAt: activeShare.last_pdf_download_at,
          pdfDownloadCount: activeShare.pdf_download_count,
          lastPrintAt: activeShare.last_print_at,
          printCount: activeShare.print_count,
        }
      : undefined,
    latestRevocation: latestRevocation
      ? {
          revokedAt: latestRevocation.revoked_at!,
          reason: latestRevocation.revoke_reason,
        }
      : undefined,
  };
}
