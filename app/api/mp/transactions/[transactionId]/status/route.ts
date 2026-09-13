import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  type TransactionStatusResponse,
  type PaymentTransactionStatus,
  type ConsultationPaymentStatus,
  type ConsultationLifecycleStatus,
} from '@/lib/mercadopago/types';

interface RouteContext {
  params: Promise<{
    transactionId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { transactionId } = await params;
    const supabase = await createClient();

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
    const { data: transaction, error: txError } = await supabase
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
      const { data: adminProfile } = await supabase
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
    const { data: consultation, error: consultationError } = await supabase
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

    // 4. Derivação de estados higienizados
    const status = transaction.status as PaymentTransactionStatus;
    const consultationStatus = consultation.status as ConsultationLifecycleStatus;
    const paymentStatus = consultation.payment_status as ConsultationPaymentStatus;
    const reportAvailable = status === 'approved' && consultationStatus === 'completed';

    let nextAction: 'view_report' | 'wait' | 'retry' | 'contact_support' = 'wait';
    let retryable = false;
    let customerTitle = 'Aguardando Confirmação do Pagamento';
    let customerMessage = 'Estamos aguardando a confirmação do pagamento pelo Mercado Pago.';

    if (reportAvailable) {
      nextAction = 'view_report';
      customerTitle = 'Seu laudo está disponível';
      customerMessage = 'Seu laudo veicular foi gerado com sucesso e já está liberado para visualização.';
    } else if (status === 'refunded' || consultationStatus === 'refunded') {
      nextAction = 'contact_support';
      customerTitle = 'Pagamento Estornado';
      customerMessage =
        'Seu pagamento foi estornado integralmente. O prazo para o valor constar depende do método de pagamento e da instituição financeira.';
    } else if (consultationStatus === 'failed_permanent' || consultationStatus === 'refund_pending') {
      nextAction = 'contact_support';
      customerTitle = 'Consulta Indisponível';
      customerMessage =
        'Não foi possível concluir sua consulta neste momento devido a uma indisponibilidade nas bases oficiais. Solicitamos o estorno integral do seu pagamento.';
    } else if (consultationStatus === 'retry_scheduled') {
      nextAction = 'wait';
      retryable = true;
      customerTitle = 'Preparando seu Laudo';
      customerMessage =
        'Estamos enfrentando uma instabilidade temporária para preparar seu laudo. Nossa equipe já está acompanhando; tentaremos novamente automaticamente em instantes.';
    } else if (consultationStatus === 'manual_review') {
      nextAction = 'contact_support';
      customerTitle = 'Verificação Necessária';
      customerMessage =
        'Sua consulta precisa de uma verificação adicional. Nossa equipe foi avisada e retornará pelo canal de atendimento.';
    } else if (status === 'approved') {
      nextAction = 'wait';
      customerTitle = 'Pagamento Confirmado! Gerando Laudo...';
      customerMessage = 'Pagamento confirmado! Estamos consultando as bases oficiais de dados do veículo.';
    } else if (status === 'rejected' || status === 'cancelled') {
      nextAction = 'retry';
      retryable = true;
      customerTitle = 'Pagamento Não Concluído';
      customerMessage = 'O pagamento não foi autorizado ou foi cancelado no Mercado Pago.';
    } else if (status === 'provider_error' || status === 'pending_reconciliation') {
      nextAction = 'contact_support';
      retryable = true;
      customerTitle = 'Verificação de Pagamento';
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
