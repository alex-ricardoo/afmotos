import { NextRequest, NextResponse } from 'next/server';
import { claimAndProcessDeliveryJobs } from '@/lib/vehicle-delivery/delivery-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // 60 segundos permitidos na Vercel

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
    const result = await claimAndProcessDeliveryJobs({
      batchSize: 10,
      lockDurationSeconds: 300,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[POST /api/cron/process-delivery-jobs] Erro:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erro ao processar jobs de entrega' },
      { status: 500 },
    );
  }
}

// Suporte a GET caso a Vercel execute o cron via GET
export async function GET(request: NextRequest) {
  return POST(request);
}
