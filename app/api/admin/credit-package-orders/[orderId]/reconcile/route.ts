import { NextRequest, NextResponse } from 'next/server';
import { requireActiveAdmin, AdminAuthorizationError } from '@/lib/admin/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchAuthoritativePayment } from '@/lib/mercadopago/webhook-service';
import { confirmAndProcessPaymentTransaction } from '@/lib/mercadopago/payment-processing-service';
import { getPaymentClient } from '@/lib/mercadopago/client';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ orderId: string }> },
) {
  let admin;
  try {
    admin = await requireActiveAdmin();
  } catch (err) {
    if (err instanceof AdminAuthorizationError) {
      return NextResponse.json(
        { success: false, error: err.message, code: err.code },
        { status: err.statusCode },
      );
    }
    return NextResponse.json(
      { success: false, error: 'Erro de autorização.', code: 'UNAUTHORIZED' },
      { status: 401 },
    );
  }

  try {
    const { orderId } = await context.params;
    const adminDb = createAdminClient();

    // 1. Localiza a ordem
    const { data: order, error: orderError } = await adminDb
      .from('credit_package_orders')
      .select('*')
      .eq('id', orderId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Pedido de pacote não localizado.' },
        { status: 404 },
      );
    }

    // 2. Localiza a transação associada
    const { data: transaction } = await adminDb
      .from('payment_transactions')
      .select('*')
      .eq('id', order.payment_transaction_id)
      .maybeSingle();

    if (!transaction) {
      return NextResponse.json(
        { success: false, error: 'Transação financeira vinculada não encontrada.' },
        { status: 404 },
      );
    }

    let mpPaymentId = order.mp_payment_id || transaction.mp_payment_id;

    // Se mpPaymentId for nulo, busca ativamente no Mercado Pago por referências externas
    if (!mpPaymentId) {
      try {
        const paymentClient = getPaymentClient();
        const searchRefs = [
          order.id,
          order.external_reference,
          transaction.id,
        ].filter(Boolean) as string[];

        for (const ref of searchRefs) {
          const searchResult = await paymentClient.search({
            options: {
              external_reference: ref,
            },
          });

          const firstResult = searchResult.results?.[0];
          if (firstResult && firstResult.id) {
            mpPaymentId = String(firstResult.id);
            break;
          }
        }
      } catch (searchErr) {
        console.warn(
          '[admin_package_reconcile] Falha ao consultar Mercado Pago por external_reference:',
          searchErr,
        );
      }
    }

    if (!mpPaymentId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Nenhum pagamento correspondente identificado no Mercado Pago para este pedido até o momento.',
        },
        { status: 404 },
      );
    }

    // 3. Busca autoritativa no Mercado Pago
    const paymentData = await fetchAuthoritativePayment(mpPaymentId);

    // 4. Confirmação e processamento centralizado
    const confirmation = await confirmAndProcessPaymentTransaction({
      transaction,
      paymentData,
      actorType: 'admin',
      actorId: admin.userId,
    });

    return NextResponse.json({
      success: confirmation.success,
      reconciled: confirmation.statusChanged,
      previousStatus: confirmation.previousStatus,
      currentStatus: confirmation.currentStatus,
      creditsGranted: order.credits_quantity,
      mpPaymentId: paymentData.id,
      message: confirmation.message,
    });
  } catch (error: unknown) {
    console.error('[POST /api/admin/credit-package-orders/[orderId]/reconcile] Erro:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Falha na reconciliação do pedido.',
      },
      { status: 500 },
    );
  }
}
