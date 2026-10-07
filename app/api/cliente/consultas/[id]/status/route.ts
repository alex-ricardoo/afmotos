import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const consultationId = params.id;

    if (!consultationId) {
      return NextResponse.json({ error: 'ID da consulta n\u00e3o fornecido.' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usu\u00e1rio n\u00e3o autenticado ou sess\u00e3o expirada.' },
        { status: 401 },
      );
    }

    // Busca a consulta do cliente (o RLS garante que o cliente s\u00f3 acesse a dele)
    const { data: consultation, error } = await supabase
      .from('customer_plate_consultations')
      .select('id, status, payment_status, processed_at, vehicle_data')
      .eq('id', consultationId)
      .maybeSingle();

    if (error) {
      console.error('[GET /api/cliente/consultas/[id]/status] Supabase error:', error);
      return NextResponse.json({ error: 'Erro ao buscar status da consulta.' }, { status: 500 });
    }

    if (!consultation) {
      return NextResponse.json({ error: 'Consulta n\u00e3o encontrada.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: consultation.id,
        status: consultation.status,
        payment_status: consultation.payment_status,
        processed_at: consultation.processed_at,
        isCompleted: consultation.status === 'completed',
        hasFailed: consultation.status === 'failed',
        vehicleDataExists: !!consultation.vehicle_data,
      },
    });
  } catch (err: any) {
    console.error('[GET /api/cliente/consultas/[id]/status] Exception:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
