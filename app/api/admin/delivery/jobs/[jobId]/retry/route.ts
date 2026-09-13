import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RouteContext {
  params: Promise<{
    jobId: string;
  }>;
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { jobId } = await params;
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

    const adminDb = createAdminClient();

    // 1. Carrega o job
    const { data: job, error: jobError } = await adminDb
      .from('consultation_delivery_jobs')
      .select('*')
      .eq('id', jobId)
      .maybeSingle();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job de entrega não encontrado.' }, { status: 404 });
    }

    // 2. Valida se a transação já possui estorno iniciado ou confirmado
    const { data: refund } = await adminDb
      .from('payment_refunds')
      .select('id, status')
      .eq('transaction_id', job.transaction_id)
      .in('status', ['requested', 'pending', 'confirmed'])
      .maybeSingle();

    if (refund) {
      return NextResponse.json(
        {
          error:
            'Não é permitido reprocessar entrega para uma transação com estorno em andamento ou confirmado.',
        },
        { status: 400 },
      );
    }

    // 3. Reseta o job para pending imediato
    const nowIso = new Date().toISOString();

    await adminDb
      .from('consultation_delivery_jobs')
      .update({
        status: 'pending',
        attempt_count: 0,
        next_retry_at: nowIso,
        locked_at: null,
        locked_by: null,
        lock_expires_at: null,
        last_error_code: null,
        last_error_message_safe: null,
        updated_at: nowIso,
      })
      .eq('id', job.id);

    await adminDb
      .from('customer_plate_consultations')
      .update({
        status: 'paid',
        updated_at: nowIso,
      })
      .eq('id', job.consultation_id);

    await adminDb.from('consultation_audit_logs').insert({
      consultation_id: job.consultation_id,
      transaction_id: job.transaction_id,
      actor_id: user.id,
      actor_type: 'admin',
      event: 'admin_manual_job_retry_triggered',
      details: {
        job_id: job.id,
        admin_id: user.id,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Job reagendado para execução imediata.',
    });
  } catch (err: any) {
    console.error('[POST /api/admin/delivery/jobs/[jobId]/retry] Erro:', err);
    return NextResponse.json({ error: err?.message || 'Erro interno' }, { status: 500 });
  }
}
