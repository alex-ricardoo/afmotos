/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { requireActiveAdmin } from '@/lib/admin/admin-auth';
import { createAdminClient } from '@/lib/supabase/admin';

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatCentsToBrl(cents: number | null | undefined): string {
  if (cents === null || cents === undefined || isNaN(cents)) return '0,00';
  return (cents / 100).toFixed(2).replace('.', ',');
}

function maskPaymentId(id: string | null | undefined): string {
  if (!id) return '';
  if (id.length <= 8) return '***';
  return `${id.slice(0, 4)}***${id.slice(-4)}`;
}

export async function GET(request: NextRequest) {
  try {
    const adminCtx = await requireActiveAdmin();

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const coverageTypeParam = searchParams.get('coverageType') || 'all';
    const includeMockParam = searchParams.get('includeMock') === 'true';

    let startIso: string;
    let endIso: string;

    if (yearParam && !isNaN(Number(yearParam))) {
      const yr = Number(yearParam);
      startIso = `${yr}-01-01T00:00:00.000Z`;
      endIso = `${yr}-12-31T23:59:59.999Z`;
    } else {
      const today = new Date().toISOString().slice(0, 10);
      const start = startDateParam || `${today.slice(0, 7)}-01`;
      const end = endDateParam || today;
      startIso = `${start}T00:00:00.000Z`;
      endIso = `${end}T23:59:59.999Z`;
    }

    const adminDb = createAdminClient();

    // 1. Tenta consultar a view unificada
    let rows: any[] | null = null;
    try {
      let q = adminDb
        .from('admin_vehicle_history_financial_view')
        .select('*')
        .gte('consultation_created_at', startIso)
        .lte('consultation_created_at', endIso)
        .order('consultation_created_at', { ascending: false });

      if (!includeMockParam) {
        q = q.eq('is_mock', false);
      }
      if (coverageTypeParam !== 'all') {
        q = q.eq('coverage_type', coverageTypeParam);
      }

      const res = await q;
      if (!res.error && res.data) {
        rows = res.data as Array<Record<string, unknown>>;
      }
    } catch {
      // Fallback abaixo
    }

    // 2. Fallback para tabelas base se a view não existir
    if (!rows) {
      let q = adminDb
        .from('customer_plate_consultations')
        .select(
          `
          *,
          customer_profiles:user_id (name, email),
          payment_transactions:payment_transaction_id (*),
          vehicle_lookup_provider_costs (*)
        `,
        )
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: false });

      if (!includeMockParam) {
        q = q.eq('is_mock', false);
      }
      if (coverageTypeParam !== 'all') {
        q = q.eq('coverage_type', coverageTypeParam);
      }

      const { data: baseData } = await q;

      rows = (baseData || []).map((c: any) => {
        const tx = c.payment_transactions || {};
        const profile = c.customer_profiles || {};
        const costs = c.vehicle_lookup_provider_costs || [];
        const actualCost = costs.reduce(
          (s: number, p: any) => s + Number(p.actual_cost_cents || 0),
          0,
        );
        const isCache =
          Boolean(c.is_cache_hit) ||
          Boolean(c.report_json && !c.pricing_version_id && actualCost === 0);

        return {
          consultation_id: c.id,
          consultation_created_at: c.created_at,
          plate: c.plate,
          customer_name: profile.name || 'Anônimo',
          customer_email: profile.email || 'Não informado',
          coverage_type: c.coverage_type || 'mercadopago',
          consultation_status: c.status,
          report_origin: c.is_mock ? 'mock' : isCache ? 'cache' : 'live',
          provider_http_status: costs[0]?.http_status_code || null,
          cost_snapshot_cents: c.provider_cost_snapshot_cents || 3000,
          actual_cost_cents: c.actual_cost_cents ?? actualCost,
          provider_cost_status:
            c.provider_cost_status || (actualCost > 0 ? 'incurred' : 'not_applicable'),
          public_price_snapshot_cents: c.public_price_snapshot_cents || 3990,
          mp_transaction_id: tx.id || null,
          mp_payment_id: tx.mp_payment_id || null,
          payment_status: tx.status || null,
          gross_amount_cents: Number(tx.gross_amount_cents || 0),
          refund_status: tx.refund_status || 'none',
          refund_amount_cents: Number(tx.refund_amount_cents || 0),
          net_amount_cents:
            Number(tx.gross_amount_cents || 0) - Number(tx.refund_amount_cents || 0),
          package_name: null,
          credits_deducted: c.coverage_type === 'platform_credit' ? 1 : 0,
          estimated_margin_cents:
            Number(tx.gross_amount_cents || 3990) -
            Number(tx.refund_amount_cents || 0) -
            Number(c.actual_cost_cents ?? actualCost),
          notes: c.status === 'failed' ? 'Falha na entrega da consulta' : 'Processamento concluído',
        };
      });
    }

    // Monta CSV
    const headers = [
      'data_hora',
      'ano',
      'mes',
      'consulta_id_curto',
      'placa',
      'cliente_nome',
      'cliente_email',
      'modalidade_cobertura',
      'status_consulta',
      'origem_laudo',
      'api_brasil_status_http',
      'api_brasil_custo_snapshot_reais',
      'api_brasil_custo_efetivo_reais',
      'api_brasil_status_custo',
      'preco_venda_snapshot_reais',
      'mp_transaction_id',
      'mp_payment_id_mascarado',
      'pagamento_status',
      'valor_pagamento_reais',
      'refund_status',
      'valor_estornado_reais',
      'receita_liquida_reais',
      'pacote_b2b_nome',
      'creditos_consumidos',
      'margem_bruta_estimada_reais',
      'observacao_operacional',
    ];

    const lines: string[] = [headers.join(';')];

    for (const r of rows || []) {
      const d = new Date(r.consultation_created_at);
      const dataHora = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }).format(d);

      const yr = d.getFullYear();
      const mo = d.getMonth() + 1;
      const shortId = (r.consultation_id || '').slice(0, 8);
      const maskedMp = maskPaymentId(r.mp_payment_id);

      const line = [
        escapeCsv(dataHora),
        escapeCsv(yr),
        escapeCsv(mo),
        escapeCsv(shortId),
        escapeCsv((r.plate || '').toUpperCase()),
        escapeCsv(r.customer_name || 'Anônimo'),
        escapeCsv(r.customer_email || ''),
        escapeCsv(r.coverage_type || 'mercadopago'),
        escapeCsv(r.consultation_status || ''),
        escapeCsv(r.report_origin || 'unknown'),
        escapeCsv(r.provider_http_status || ''),
        escapeCsv(formatCentsToBrl(r.cost_snapshot_cents)),
        escapeCsv(formatCentsToBrl(r.actual_cost_cents)),
        escapeCsv(r.provider_cost_status || ''),
        escapeCsv(formatCentsToBrl(r.public_price_snapshot_cents)),
        escapeCsv(r.mp_transaction_id ? String(r.mp_transaction_id).slice(0, 8) : ''),
        escapeCsv(maskedMp),
        escapeCsv(r.payment_status || ''),
        escapeCsv(formatCentsToBrl(r.gross_amount_cents)),
        escapeCsv(r.refund_status || 'none'),
        escapeCsv(formatCentsToBrl(r.refund_amount_cents)),
        escapeCsv(formatCentsToBrl(r.net_amount_cents)),
        escapeCsv(r.package_name || ''),
        escapeCsv(r.credits_deducted || 0),
        escapeCsv(formatCentsToBrl(r.estimated_margin_cents)),
        escapeCsv(r.notes || ''),
      ].join(';');

      lines.push(line);
    }

    // Registra evento de auditoria
    await adminDb
      .from('consultation_audit_logs')
      .insert({
        event_type: 'vehicle_history_report.exported_csv',
        action: 'export_csv',
        actor_role: 'admin',
        admin_id: adminCtx.adminProfileId,
        metadata: {
          admin_user_id: adminCtx.userId,
          admin_name: adminCtx.name || 'Administrador',
          period_start: startIso,
          period_end: endIso,
          coverage_type: coverageTypeParam,
          include_mock: includeMockParam,
          total_rows: lines.length - 1,
          exported_at: new Date().toISOString(),
        },
      })
      .select()
      .maybeSingle();

    // UTF-8 BOM (\uFEFF)
    const csvContent = '\uFEFF' + lines.join('\r\n');
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `relatorio-historico-veicular-afmotos-${dateStamp}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: unknown) {
    console.error('[CSV Export Error]:', error);
    const err = error as { message?: string };
    if (err?.message?.includes('Acesso negado') || err?.message?.includes('Não autenticado')) {
      return new NextResponse('Acesso restrito a administradores autorizados.', { status: 403 });
    }
    return new NextResponse('Erro interno ao processar exportação de relatório.', { status: 500 });
  }
}
