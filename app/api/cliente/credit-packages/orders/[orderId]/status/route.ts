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

    // Se o pedido ainda está pendente no banco, verifica se a transação financeira vinculada foi aprovada
    if (order.payment_transaction_id) {
      const { data: tx } = await adminDb
        .from('payment_transactions')
        .select('*')
        .eq('id', order.payment_transaction_id)
        .maybeSingle();

      if (tx && tx.status === 'approved') {
        // Dispara a RPC atômica caso o webhook ainda não tenha finalizado
        await adminDb
          .from('credit_package_orders')
          .update({
            status: 'paid',
            mp_payment_id: tx.mp_payment_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', order.id);

        await adminDb.rpc('grant_credit_package_from_paid_order', {
          p_order_id: order.id,
        });

        const updatedBalance = await getUserCreditBalance(user.id);

        return NextResponse.json({
          success: true,
          orderId: order.id,
          status: 'paid',
          isPaid: true,
          isGranted: true,
          creditsQuantity: order.credits_quantity,
          newAvailableBalance: updatedBalance,
          amountFormatted,
          grantedAt: new Date().toISOString(),
          message: `Pagamento aprovado! ${order.credits_quantity} créditos foram adicionados ao seu saldo com sucesso.`,
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
