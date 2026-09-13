import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('id, is_active')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (!adminProfile || !adminProfile.is_active) {
      return NextResponse.json({ error: 'Acesso restrito a administradores ativos.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const failureCode = searchParams.get('failure_code');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)));
    const offset = (page - 1) * pageSize;

    const adminDb = createAdminClient();

    let query = adminDb
      .from('consultation_delivery_jobs')
      .select('*, customer_plate_consultations(plate, status), payment_transactions(status, refund_status)', {
        count: 'exact',
      })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (failureCode) {
      query = query.eq('last_error_code', failureCode);
    }

    const { data: jobs, error: listError, count } = await query.range(offset, offset + pageSize - 1);

    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    // Alertas operacionais
    const [{ count: insufficientCreditsCount }, { count: staleLocksCount }, { count: pendingRefundsCount }] =
      await Promise.all([
        adminDb
          .from('consultation_delivery_jobs')
          .select('id', { count: 'exact', head: true })
          .eq('last_error_code', 'APIBRASIL_INSUFFICIENT_CREDITS')
          .eq('status', 'failed_permanent'),
        adminDb
          .from('consultation_delivery_jobs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'processing')
          .lt('lock_expires_at', new Date().toISOString()),
        adminDb
          .from('payment_refunds')
          .select('id', { count: 'exact', head: true })
          .in('status', ['requested', 'pending']),
      ]);

    const hasInsufficientCredits = (insufficientCreditsCount || 0) > 0;

    return NextResponse.json({
      success: true,
      alerts: {
        insufficientCredits: hasInsufficientCredits,
        insufficientCreditsMessage: hasInsufficientCredits
          ? 'Ação urgente necessária: Saldo insuficiente na API Brasil. Recarregar a conta do provedor.'
          : null,
        staleLocksCount: staleLocksCount || 0,
        pendingRefundsCount: pendingRefundsCount || 0,
      },
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      jobs: (jobs || []).map((j: any) => ({
        id: j.id,
        consultationId: j.consultation_id,
        transactionId: j.transaction_id,
        plate: j.customer_plate_consultations?.plate || null,
        status: j.status,
        attemptCount: j.attempt_count,
        maxAttempts: j.max_attempts,
        nextRetryAt: j.next_retry_at,
        lastErrorCode: j.last_error_code,
        lastErrorMessageSafe: j.last_error_message_safe,
        refundStatus: j.payment_transactions?.refund_status || null,
        createdAt: j.created_at,
      })),
    });
  } catch (err: any) {
    console.error('[GET /api/admin/delivery/jobs] Erro:', err);
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
