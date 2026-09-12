import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processPaymentRouteSchema } from '@/lib/mercadopago/schemas';
import { processCardPaymentService } from '@/lib/mercadopago/payment-processing-service';
import { paymentLogError, extractSafeError } from '@/lib/observability/payment-logger';

export async function POST(request: NextRequest) {
  const flowId = request.headers.get('x-flow-id') || crypto.randomUUID();

  try {
    // 1. Authenticate user session
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Sessão não encontrada ou expirada. Faça login para continuar.',
        },
        { status: 401 },
      );
    }

    // 2. Parse and validate request body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Payload JSON inválido ou malformado.' },
        { status: 400 },
      );
    }

    const parseResult = processPaymentRouteSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const issue = parseResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: issue
            ? `${issue.path.join('.')}: ${issue.message}`
            : 'Dados de pagamento inválidos.',
        },
        { status: 422 },
      );
    }

    // 3. Delegate to payment processing domain service
    const result = await processCardPaymentService({
      userId: user.id,
      userEmail: user.email || '',
      input: parseResult.data,
      flowId,
    });

    if (result.success) {
      return NextResponse.json(
        {
          success: true,
          transactionId: result.transactionId,
          paymentId: result.paymentId,
          status: result.status,
          statusDetail: result.statusDetail,
          consultationStatus: result.consultationStatus,
        },
        { status: 200 },
      );
    }

    if (result.pending) {
      return NextResponse.json(
        {
          success: false,
          pending: true,
          transactionId: result.transactionId,
          paymentId: result.paymentId,
          status: result.status,
          message: result.message,
        },
        { status: 200 },
      );
    }

    if (result.status === 'not_found') {
      return NextResponse.json({ success: false, error: result.message }, { status: 404 });
    }

    if (result.status === 'forbidden') {
      return NextResponse.json({ success: false, error: result.message }, { status: 403 });
    }

    if (result.status === 'rejected') {
      return NextResponse.json(
        {
          success: false,
          retryable: true,
          transactionId: result.transactionId,
          status: 'rejected',
          statusDetail: result.statusDetail,
          message: result.message,
        },
        { status: 400 },
      );
    }

    // Provider error or technical failures
    return NextResponse.json(
      {
        success: false,
        retryable: true,
        transactionId: result.transactionId,
        status: 'provider_error',
        message: result.message || 'Falha ao processar pagamento com o provedor.',
      },
      { status: 502 },
    );
  } catch (err: unknown) {
    const safeErr = extractSafeError(err);
    paymentLogError('payment.route_unhandled_exception', {
      flowId,
      errorName: safeErr.errorName,
      errorMessage: safeErr.errorMessageSanitized,
    });

    return NextResponse.json(
      {
        success: false,
        retryable: true,
        status: 'provider_error',
        message:
          'Ocorreu um erro inesperado ao processar o pagamento. Tente novamente em alguns minutos.',
      },
      { status: 500 },
    );
  }
}
