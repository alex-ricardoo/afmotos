import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { reconcileSingleRefund } from '@/lib/mercadopago/refund-service';
import {
  type TransactionStatusResponse,
  type PaymentTransactionStatus,
  type ConsultationPaymentStatus,
  type ConsultationLifecycleStatus,
} from '@/lib/mercadopago/types';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{
    transactionId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { transactionId } = await params;
    const supabase = await createClient();
    const adminDb = createAdminClient();

    // 1. Autenticação de Sessão
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Usuário não autenticado.' },
        { status: 401 },
      );
    }

    // 2. Busca a transação
    const { data: transaction, error: txError } = await adminDb
      .from('payment_transactions')
      .select('id, consultation_id, user_id, status, status_detail, failure_code')
      .eq('id', transactionId)
      .maybeSingle();

    if (txError || !transaction) {
      return NextResponse.json(
        { success: false, error: 'Transação de pagamento não encontrada.' },
        { status: 404 },
      );
    }

    // Validação de Propriedade da Transação
    const isOwner = transaction.user_id === user.id;
    if (!isOwner) {
      const { data: adminProfile } = await adminDb
        .from('admin_profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!adminProfile) {
        return NextResponse.json(
          { success: false, error: 'Transação de pagamento não encontrada.' },
          { status: 404 },
        );
      }
    }

    // 3. Busca a consulta correspondente
    const { data: consultation, error: consultationError } = await adminDb
      .from('customer_plate_consultations')
      .select('id, status, payment_status, vehicle_data')
      .eq('id', transaction.consultation_id)
      .maybeSingle();

    if (consultationError || !consultation) {
      return NextResponse.json(
        { success: false, error: 'Consulta veicular vinculada não encontrada.' },
        { status: 404 },
      );
    }

    // 4. Reconciliação sob demanda de Refund se houver estorno pendente (Parte 9)
    if (consultation.status === 'refund_pending') {
      const { data: activeRefund } = await adminDb
        .from('payment_refunds')
        .select('id, status')
        .eq('transaction_id', transaction.id)
        .in('status', ['requested', 'pending'])
        .maybeSingle();

      if (activeRefund) {
        try {
          const recResult = await reconcileSingleRefund(activeRefund.id, adminDb);
          if (recResult.status === 'confirmed') {
            consultation.status = 'refunded';
            consultation.payment_status = 'refunded';
            transaction.status = 'refunded';
          }
        } catch (e) {
          console.warn('[status route] Falha ao reconciliar refund sob demanda:', e);
        }
      }
    }

    // 5. Busca o job de entrega mais recente
    const { data: job } = await adminDb
      .from('consultation_delivery_jobs')
      .select('id, status, attempt_count, max_attempts, next_retry_at')
      .eq('consultation_id', consultation.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 6. Derivação de estados e mensagens oficiais (Parte 10)
    const status = transaction.status as PaymentTransactionStatus;
    const consultationStatus = consultation.status as ConsultationLifecycleStatus;
    const paymentStatus = consultation.payment_status as ConsultationPaymentStatus;
    const reportAvailable = status === 'approved' && consultationStatus === 'completed';

    let nextAction: 'view_report' | 'wait' | 'retry' | 'contact_support' = 'wait';
    let retryable = false;
    let customerTitle = 'Estamos aguardando a confirmação do seu pagamento.';
    let customerMessage = 'Estamos aguardando a confirmação do seu pagamento pelo Mercado Pago.';
    let nextRetryAt: string | null = null;
    let remainingRetrySeconds: number | undefined;
    let retryAttempt: number | undefined;
    let maxRetryAttempts: number | undefined;
    let canProcessDelivery = false;

    if (job) {
      retryAttempt = job.attempt_count;
      maxRetryAttempts = job.max_attempts;
      if (job.status === 'retry_scheduled' && job.next_retry_at) {
        nextRetryAt = job.next_retry_at;
        const diffMs = new Date(job.next_retry_at).getTime() - Date.now();
        remainingRetrySeconds = Math.max(0, Math.ceil(diffMs / 1000));
      }
    }

    if (reportAvailable) {
      nextAction = 'view_report';
      customerTitle = 'Seu laudo está disponível.';
      customerMessage =
        'Seu laudo veicular foi gerado com sucesso e já está liberado para visualização.';
    } else if (status === 'refunded' || consultationStatus === 'refunded') {
      nextAction = 'contact_support';
      customerTitle = 'Pagamento estornado';
      customerMessage =
        'Seu pagamento foi estornado integralmente. O prazo para o valor aparecer depende do método de pagamento e da instituição financeira.';
    } else if (
      consultationStatus === 'failed_permanent' ||
      consultationStatus === 'refund_pending'
    ) {
      nextAction = 'contact_support';
      customerTitle = 'Não foi possível concluir sua consulta';
      customerMessage =
        'Não foi possível concluir sua consulta neste momento. Solicitamos o estorno integral do seu pagamento e atualizaremos esta página quando ele for confirmado.';
    } else if (consultationStatus === 'retry_scheduled' || job?.status === 'retry_scheduled') {
      nextAction = 'wait';
      retryable = true;
      canProcessDelivery = true;
      customerTitle = 'Instabilidade temporária na consulta';
      customerMessage =
        'Estamos enfrentando uma instabilidade temporária para consultar a placa. Você não precisa pagar novamente; tentaremos novamente automaticamente enquanto esta página estiver aberta.';
    } else if (consultationStatus === 'manual_review') {
      nextAction = 'contact_support';
      customerTitle = 'Verificação necessária';
      customerMessage =
        'Sua consulta precisa de uma verificação adicional. Nossa equipe foi avisada e retornará pelo suporte.';
    } else if (status === 'approved') {
      nextAction = 'wait';
      canProcessDelivery = true;
      customerTitle = 'Pagamento confirmado. Estamos preparando seu laudo.';
      customerMessage = 'Pagamento confirmado. Estamos preparando seu laudo veicular.';
    } else if (status === 'rejected' || status === 'cancelled') {
      nextAction = 'retry';
      retryable = true;
      customerTitle = 'Pagamento não concluído';
      customerMessage = 'O pagamento não foi autorizado ou foi cancelado no Mercado Pago.';
    } else if (status === 'provider_error' || status === 'pending_reconciliation') {
      nextAction = 'contact_support';
      retryable = true;
      customerTitle = 'Verificação de pagamento';
      customerMessage = 'Estamos verificando a confirmação do seu pagamento junto à operadora.';
    }

    const response: TransactionStatusResponse = {
      success: true,
      transactionId: transaction.id,
      consultationId: consultation.id,
      status,
      statusDetail: transaction.status_detail,
      consultationStatus,
      paymentStatus,
      reportAvailable,
      reportUrl: reportAvailable ? `/cliente/consultas/${consultation.id}` : undefined,
      retryable,
      nextAction,
      customerTitle,
      customerMessage,
      nextRetryAt,
      remainingRetrySeconds,
      retryAttempt,
      maxRetryAttempts,
      canProcessDelivery,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[GET /api/mp/transactions/[transactionId]/status] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao consultar status da transação.' },
      { status: 500 },
    );
  }
}
