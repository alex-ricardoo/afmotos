import { NextRequest, NextResponse } from 'next/server';
import { reconcileAllPendingRefunds } from '@/lib/mercadopago/refund-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Não autorizado. Token de cron inválido ou ausente.' },
      { status: 401 },
    );
  }

  try {
    const startTime = Date.now();
    const result = await reconcileAllPendingRefunds();

    return NextResponse.json({
      success: true,
      ...result,
      durationMs: Date.now() - startTime,
    });
  } catch (error: any) {
    console.error('[POST /api/cron/reconcile-pending-refunds] Erro:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro ao reconciliar estornos pendentes' },
      { status: 500 },
    );
  }
}

// Suporte a GET caso a Vercel execute o cron via GET
export async function GET(request: NextRequest) {
  return POST(request);
}
