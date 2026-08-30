import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
import { createClient } from '@/lib/supabase/server';
import { resolveDateRange } from '@/lib/reports/date-range';
import {
  getOverviewReportData,
  getSalesReportData,
  getFinancialReportData,
  getInventoryReportData,
  getCustomersReportData,
  getAnnualAccountantReportData,
} from '@/lib/reports/queries';
import {
  generateSalesCSV,
  generateExpensesCSV,
  generateInventoryCSV,
  generateStockMovementCSV,
  generateConsignmentsCSV,
  generateConsolidatedCSV,
} from '@/lib/reports/export-csv';
import { generateExcelWorkbookXML } from '@/lib/reports/export-xlsx';
import { ExecutiveReportPDF } from '@/lib/reports/pdf/executive-report';
import { getSiteSettings } from '@/lib/queries/settings';
import { ReportPeriodPreset } from '@/lib/reports/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate Admin Session
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse('Não autorizado', { status: 401 });
    }

    // 2. Parse Query Params
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const type = searchParams.get('type') || 'consolidado';
    const yearParam = searchParams.get('year');
    const preset = (searchParams.get('preset') || (yearParam ? 'custom' : 'this_month')) as ReportPeriodPreset;

    let customStart = searchParams.get('startDate');
    let customEnd = searchParams.get('endDate');

    if (yearParam && /^\d{4}$/.test(yearParam)) {
      customStart = `${yearParam}-01-01`;
      customEnd = `${yearParam}-12-31`;
    }

    const includePII = searchParams.get('includePII') === 'true';
    const dateRange = resolveDateRange(yearParam ? 'custom' : preset, customStart, customEnd);

    // 3. Fetch Data based on export needs
    const [annualData, settings] = await Promise.all([
      getAnnualAccountantReportData(dateRange),
      getSiteSettings(),
    ]);

    const { overview, sales, financial, inventory, customers, stockMovement, consignments, vehicleResults, dataQualityIssues } = annualData;
    const baseYear = yearParam || dateRange.startDate.substring(0, 4);
    const datePrefix = yearParam ? `${yearParam}` : `${dateRange.startDate}_a_${dateRange.endDate}`;

    // 4. Handle PDF Export
    if (format === 'pdf') {
      let logoBase64: string | undefined;
      const customLogoUrl = (settings?.settings as any)?.branding?.logoUrl || (settings?.settings as any)?.logo_path;
      if (customLogoUrl && (customLogoUrl.startsWith('http://') || customLogoUrl.startsWith('https://'))) {
        logoBase64 = customLogoUrl;
      } else {
        try {
          const logoPath = path.join(process.cwd(), 'public', 'logo.jpg');
          if (fs.existsSync(logoPath)) {
            const fileBuffer = fs.readFileSync(logoPath);
            logoBase64 = `data:image/jpeg;base64,${fileBuffer.toString('base64')}`;
          } else {
            const pngPath = path.join(process.cwd(), 'public', 'logo.png');
            if (fs.existsSync(pngPath)) {
              const fileBuffer = fs.readFileSync(pngPath);
              logoBase64 = `data:image/png;base64,${fileBuffer.toString('base64')}`;
            }
          }
        } catch (e) {
          console.warn('Could not load local logo for report:', e);
        }
      }

      const reportTitle =
        type === 'informe-anual' || yearParam
          ? `RELATÓRIO GERENCIAL ANUAL DE APOIO CONTÁBIL`
          : `RELATÓRIO GERENCIAL CONSOLIDADO`;

      const element = React.createElement(ExecutiveReportPDF, {
        overview,
        sales,
        financial,
        inventory,
        stockMovement,
        consignments,
        vehicleResults,
        dataQualityIssues,
        settings,
        logoSrc: logoBase64,
        reportTitle,
        yearLabel: baseYear,
      });

      const pdfBuffer = await renderToBuffer(element as any);
      const filename =
        type === 'informe-anual' || yearParam
          ? `af-motos-resumo-gerencial_${baseYear}.pdf`
          : `af-motos-relatorio-executivo_${datePrefix}.pdf`;

      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': pdfBuffer.length.toString(),
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // 5. Handle XLSX Export
    if (format === 'xlsx') {
      const xmlWorkbook = generateExcelWorkbookXML(
        sales,
        financial,
        inventory,
        customers,
        stockMovement,
        consignments,
        includePII,
      );
      const filename = `af-motos-relatorio-contabil_${datePrefix}.xls`;

      return new NextResponse(xmlWorkbook, {
        headers: {
          'Content-Type': 'application/vnd.ms-excel; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });
    }

    // 6. Handle CSV Exports
    let csvData = '';
    let filename = `af-motos-relatorio_${datePrefix}.csv`;

    if (type === 'vendas') {
      csvData = generateSalesCSV(sales, includePII);
      filename = `af-motos-vendas_${datePrefix}.csv`;
    } else if (type === 'despesas') {
      csvData = generateExpensesCSV(financial);
      filename = `af-motos-despesas_${datePrefix}.csv`;
    } else if (type === 'estoque') {
      csvData = generateInventoryCSV(inventory);
      filename = `af-motos-estoque_${dateRange.endDate}.csv`;
    } else if (type === 'movimentacao-estoque') {
      csvData = generateStockMovementCSV(stockMovement, dateRange);
      filename = `af-motos-movimentacao-estoque_${datePrefix}.csv`;
    } else if (type === 'comissoes') {
      csvData = generateConsignmentsCSV(consignments);
      filename = `af-motos-comissoes_${datePrefix}.csv`;
    } else {
      csvData = generateConsolidatedCSV(sales, financial, inventory);
      filename = `af-motos-consolidado-gerencial_${datePrefix}.csv`;
    }

    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating report export:', error);
    return new NextResponse('Erro interno ao processar exportação', { status: 500 });
  }
}
