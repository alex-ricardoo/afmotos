import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getPackageOrderById } from '@/lib/credits/orders-service';
import { getUserCreditBalance } from '@/lib/credits/credit-service';

export async function GET(request: NextRequest, context: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await context.params;
    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Identificador do pedido inválido.' },
        { status: 422 },
      );
    }

    // 1. Autenticação de sessão do cliente
    const supabase = await createClient();
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

    // 2. Busca do pedido com verificação estrita de titularidade
    const order = await getPackageOrderById(orderId, user.id);
    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Pedido não localizado ou não pertencente a este usuário.' },
        { status: 404 },
      );
    }

    const adminDb = createAdminClient();
    const isPaid = order.status === 'paid';
    const isGranted = Boolean(order.granted_at) || isPaid;

    const amountFormatted = (order.price_cents / 100).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });

    if (isPaid && isGranted) {
      const currentBalance = await getUserCreditBalance(user.id);

      return NextResponse.json({
        success: true,
        orderId: order.id,
        status: order.status,
        isPaid: true,
        isGranted: true,
        creditsQuantity: order.credits_quantity,
        newAvailableBalance: currentBalance,
        amountFormatted,
        grantedAt: order.granted_at || order.paid_at || order.updated_at,
        message: `Pagamento aprovado! ${order.credits_quantity} créditos foram adicionados ao seu saldo com sucesso.`,
      });
    }

    // Se o pedido ainda está pendente no banco, tenta reconciliar ativamente com o Mercado Pago
    if (order.payment_transaction_id) {
      try {
        const { reconcilePaymentTransaction } = await import(
          '@/lib/mercadopago/reconciliation-service'
        );
        await reconcilePaymentTransaction(order.payment_transaction_id, user.id, 'customer');
      } catch (recErr) {
        console.warn('[GET /orders/[orderId]/status] Falha transitória na reconciliação:', recErr);
      }

      // Recarrega o estado atualizado do pedido após a tentativa de reconciliação
      const freshOrder = await getPackageOrderById(orderId, user.id);
      if (freshOrder && (freshOrder.status === 'paid' || freshOrder.granted_at)) {
        const updatedBalance = await getUserCreditBalance(user.id);
        return NextResponse.json({
          success: true,
          orderId: freshOrder.id,
          status: freshOrder.status,
          isPaid: true,
          isGranted: true,
          creditsQuantity: freshOrder.credits_quantity,
          newAvailableBalance: updatedBalance,
          amountFormatted,
          grantedAt: freshOrder.granted_at || freshOrder.paid_at || new Date().toISOString(),
          message: `Pagamento aprovado! ${freshOrder.credits_quantity} créditos foram adicionados ao seu saldo com sucesso.`,
        });
      }
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      status: order.status,
      isPaid: false,
      isGranted: false,
      creditsQuantity: order.credits_quantity,
      amountFormatted,
      message:
        order.status === 'rejected'
          ? 'O pagamento do pacote não foi autorizado pelo Mercado Pago.'
          : order.status === 'cancelled'
            ? 'O pedido foi cancelado.'
            : 'Aguardando confirmação do pagamento pelo Mercado Pago.',
    });
  } catch (error: unknown) {
    console.error('[GET /api/cliente/credit-packages/orders/[orderId]/status] Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao consultar status do pedido.' },
      { status: 500 },
    );
  }
}
