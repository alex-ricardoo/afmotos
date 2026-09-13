import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { reconcilePaymentTransaction } from '@/lib/mercadopago/reconciliation-service';
import { logCheckoutProEvent } from '@/lib/mercadopago/observability';
import { type ReconciliationResponse } from '@/lib/mercadopago/types';

interface RouteContext {
  params: Promise<{
    transactionId: string;
  }>;
}

// Controle de taxa simples em memória (máximo 1 execução ativa a cada 3 segundos por transação)
const recentReconcileRequests = new Map<string, number>();

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

    // 2. Rate Limiting por Transação
    const now = Date.now();
    const lastAttempt = recentReconcileRequests.get(transactionId) || 0;
    if (now - lastAttempt < 3000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Muitas verificações consecutivas. Aguarde alguns segundos antes de tentar novamente.',
        },
        { status: 429 },
      );
    }
    recentReconcileRequests.set(transactionId, now);

    // Limpeza periódica do mapa de rate limiting
    if (recentReconcileRequests.size > 1000) {
      for (const [key, time] of recentReconcileRequests.entries()) {
        if (now - time > 10000) {
          recentReconcileRequests.delete(key);
        }
      }
    }

    // 3. Busca a transação e valida titularidade
    const { data: transaction, error: txError } = await supabase
      .from('payment_transactions')
      .select('id, consultation_id, user_id, status, status_detail')
      .eq('id', transactionId)
      .maybeSingle();

    if (txError || !transaction) {
      return NextResponse.json(
        { success: false, error: 'Transação não encontrada.' },
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
          { success: false, error: 'Transação não encontrada.' },
          { status: 404 },
        );
      }
      isAdmin = true;
    }

    logCheckoutProEvent('checkout_pro.reconcile_requested', {
      transactionId: transaction.id,
      consultationId: transaction.consultation_id,
    });

    // 4. Executa a reconciliação autoritativa
    const actorType = isAdmin ? 'admin' : 'customer';
    const result = await reconcilePaymentTransaction(transaction.id, user.id, actorType);

    logCheckoutProEvent('checkout_pro.reconcile_completed', {
      transactionId: transaction.id,
      consultationId: transaction.consultation_id,
      status: result.currentStatus,
    });

    const responsePayload: ReconciliationResponse = {
      success: result.success,
      transactionId: transaction.id,
      status: result.currentStatus,
      statusDetail: transaction.status_detail || null,
      reportUnlocked: Boolean(result.reportUnlocked),
      reportUrl: `/cliente/consultas/${transaction.consultation_id}`,
      message: result.message,
    };

    return NextResponse.json(responsePayload, { status: 200 });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erro interno na reconciliação';
    return NextResponse.json(
      { success: false, error: errorMsg },
      { status: 500 },
    );
  }
}
