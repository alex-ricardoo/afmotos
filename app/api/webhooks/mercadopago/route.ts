import { NextRequest, NextResponse } from 'next/server';
import { handleMercadoPagoWebhook } from '@/lib/mercadopago/payment-service';

export async function POST(req: NextRequest) {
  try {
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');

    // Mercado Pago often sends data.id and type in URL searchParams (e.g. ?data.id=123&type=payment)
    const { searchParams } = new URL(req.url);
    const dataId = searchParams.get('data.id') || searchParams.get('id');
    const type = searchParams.get('type') || searchParams.get('topic');

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty on some test ping notifications
      body = {};
    }

    // Collect headers for debugging audit
    const headersMap: Record<string, string> = {};
    req.headers.forEach((value, key) => {
      headersMap[key] = value;
    });

    const result = await handleMercadoPagoWebhook({
      xSignature,
      xRequestId,
      dataId: dataId || (body.data as any)?.id,
      type: type || (body.type as any),
      action: (body.action as any),
      payload: body,
      headers: headersMap,
    });

    return NextResponse.json(
      { message: result.message },
      { status: result.status }
    );
  } catch (err: any) {
    console.error('[MercadoPago Webhook Error]:', err);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Allow Mercado Pago to test endpoint with GET / HEAD
export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'AF Motos Mercado Pago Webhook',
  });
}
