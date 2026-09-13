import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reconcileRefundByTransactionId } from '@/lib/mercadopago/refund-service';
import { logCheckoutProEvent } from '@/lib/mercadopago/observability';

interface RouteContext {
  params: Promise<{
    transactionId: string;
  }>;
}

const recentRefundReconcileRequests = new Map<string, number>();

export async function POST(request: NextRequest, { params }: RouteContext) {
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
        { success: false, error: 'Autenticação obrigatória.' },
        { status: 401 },
      );
    }

    // 2. Rate Limiting por Transação (3 segundos)
    const now = Date.now();
    const lastAttempt = recentRefundReconcileRequests.get(transactionId) || 0;
    if (now - lastAttempt < 3000) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Muitas tentativas consecutivas de reconciliação de estorno. Aguarde alguns segundos.',
        },
        { status: 429 },
      );
    }
    recentRefundReconcileRequests.set(transactionId, now);

    // Limpeza de cache de rate limiting
    if (recentRefundReconcileRequests.size > 1000) {
      for (const [key, time] of recentRefundReconcileRequests.entries()) {
        if (now - time > 10000) {
          recentRefundReconcileRequests.delete(key);
        }
      }
    }

    // 3. Busca a transação e valida titularidade
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .select('id, consultation_id, user_id, status, refund_status, mp_payment_id')
      .eq('id', transactionId)
      .maybeSingle();

    if (txError || !transaction) {
      return NextResponse.json(
        { success: false, error: 'Transação de pagamento não encontrada.' },
        { status: 404 },
      );
    }

    const isOwner = transaction.user_id === user.id;
    let isAdmin = false;

    if (!isOwner) {
      const { data: adminProfile } = await supabase
        .from('admin_profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (!adminProfile) {
        return NextResponse.json(
          { success: false, error: 'Acesso não autorizado para esta transação.' },
          { status: 403 },
        );
      }
      isAdmin = true;
    }

    logCheckoutProEvent('checkout_pro.transaction_updated', {
      transactionId: transaction.id,
      consultationId: transaction.consultation_id,
      errorMessage: `[PAYMENT_REFUND] Reconciliação manual de estorno disparada por ${isAdmin ? 'admin' : 'customer'}.`,
    });

    // 4. Executa a reconciliação autoritativa do estorno
    const result = await reconcileRefundByTransactionId(transaction.id);

    return NextResponse.json({
      success: result.success,
      transactionId: transaction.id,
      refundStatus: result.status,
      mpRefundId: result.mpRefundId || null,
      message: result.success
        ? `Status do estorno atualizado com sucesso: ${result.status}`
        : result.error || 'Falha ao reconciliar estorno junto ao gateway.',
      error: result.error,
    });
  } catch (error) {
    const errorMsg =
      error instanceof Error ? error.message : 'Erro interno na reconciliação de estorno';
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
