import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function mapConsultationStatus(status: string) {
  switch (status) {
    case 'pending':
      return {
        isProcessing: true,
        isCompleted: false,
        isTerminal: false,
        isFailed: false,
        requiresManualReview: false,
        isChargeStatusUnknown: false,
        message: 'Consulta pendente de processamento',
      };
    case 'processing':
      return {
        isProcessing: true,
        isCompleted: false,
        isTerminal: false,
        isFailed: false,
        requiresManualReview: false,
        isChargeStatusUnknown: false,
        message: 'Consulta em andamento',
      };
    case 'delivering':
      return {
        isProcessing: true,
        isCompleted: false,
        isTerminal: false,
        isFailed: false,
        requiresManualReview: false,
        isChargeStatusUnknown: false,
        message: 'Entrega do laudo em andamento',
      };
    case 'retry_scheduled':
      return {
        isProcessing: true,
        isCompleted: false,
        isTerminal: false,
        isFailed: false,
        requiresManualReview: false,
        isChargeStatusUnknown: false,
        message: 'Aguardando retentativa de entrega',
      };
    case 'completed':
      return {
        isProcessing: false,
        isCompleted: true,
        isTerminal: true,
        isFailed: false,
        requiresManualReview: false,
        isChargeStatusUnknown: false,
        message: 'Consulta concluída com sucesso',
      };
    case 'failed':
      return {
        isProcessing: false,
        isCompleted: false,
        isTerminal: true,
        isFailed: true,
        requiresManualReview: false,
        isChargeStatusUnknown: false,
        message: 'Não foi possível concluir a consulta',
      };
    case 'failed_permanent':
      return {
        isProcessing: false,
        isCompleted: false,
        isTerminal: true,
        isFailed: true,
        requiresManualReview: false,
        isChargeStatusUnknown: false,
        message: 'Falha permanente na consulta',
      };
    case 'manual_review':
      return {
        isProcessing: false,
        isCompleted: false,
        isTerminal: true,
        isFailed: false,
        requiresManualReview: true,
        isChargeStatusUnknown: false,
        message: 'Consulta em análise manual pela equipe',
      };
    case 'charge_status_unknown':
      return {
        isProcessing: false,
        isCompleted: false,
        isTerminal: true,
        isFailed: false,
        requiresManualReview: true,
        isChargeStatusUnknown: true,
        message: 'Tempo limite excedido; retorno em verificação',
      };
    case 'refund_pending':
      return {
        isProcessing: false,
        isCompleted: false,
        isTerminal: true,
        isFailed: true,
        requiresManualReview: false,
        isChargeStatusUnknown: false,
        message: 'Reembolso em processamento',
      };
    case 'refunded':
      return {
        isProcessing: false,
        isCompleted: false,
        isTerminal: true,
        isFailed: true,
        requiresManualReview: false,
        isChargeStatusUnknown: false,
        message: 'Consulta reembolsada',
      };
    default:
      return {
        isProcessing: false,
        isCompleted: false,
        isTerminal: true,
        isFailed: false,
        requiresManualReview: false,
        isChargeStatusUnknown: false,
        message: 'Status da consulta atualizado',
      };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: consultationId } = await params;

    if (!consultationId) {
      return NextResponse.json({ error: 'ID da consulta não fornecido.' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuário não autenticado ou sessão expirada.' },
        { status: 401 },
      );
    }

    // Busca a consulta no banco local (estritamente read-only)
    const { data: consultation, error } = await supabase
      .from('customer_plate_consultations')
      .select('id, user_id, status, payment_status, created_at, updated_at, processed_at')
      .eq('id', consultationId)
      .maybeSingle();

    if (error) {
      console.error('[GET /api/cliente/consultas/[id]/status] Supabase error:', error);
      return NextResponse.json({ error: 'Erro ao buscar status da consulta.' }, { status: 500 });
    }

    if (!consultation) {
      return NextResponse.json({ error: 'Consulta não encontrada.' }, { status: 404 });
    }

    // Validação explícita de permissão: usuário dono ou administrador
    if (consultation.user_id !== user.id) {
      const { data: adminProfile } = await supabase
        .from('admin_profiles')
        .select('id, is_active')
        .eq('auth_user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!adminProfile) {
        return NextResponse.json(
          { error: 'Consulta não encontrada ou acesso negado.' },
          { status: 404 },
        );
      }
    }

    const meta = mapConsultationStatus(consultation.status);
    // Autoridade estrita: nunca inferir sucesso pela presença de dados parciais; usar status autoritativo
    const canViewResult = consultation.status === 'completed';

    return NextResponse.json({
      success: true,
      data: {
        id: consultation.id,
        status: consultation.status,
        paymentStatus: consultation.payment_status,
        startedAt: consultation.created_at,
        updatedAt: consultation.updated_at,
        processedAt: consultation.processed_at || null,
        isProcessing: meta.isProcessing,
        isCompleted: meta.isCompleted,
        isTerminal: meta.isTerminal,
        isFailed: meta.isFailed,
        requiresManualReview: meta.requiresManualReview,
        isChargeStatusUnknown: meta.isChargeStatusUnknown,
        canViewResult,
        message: meta.message,
      },
    });
  } catch (err: unknown) {
    console.error('[GET /api/cliente/consultas/[id]/status] Exception:', err);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 },
    );
  }
}
