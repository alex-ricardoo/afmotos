import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSiteSettings } from '@/lib/queries/settings';
import { toInternalVehicleConsultationDto } from '@/lib/vehicle-lookup/adapters/vehicle-summary';
import { toCustomerVehicleReportDto } from '@/lib/vehicle-lookup/adapters/vehicle-pdf';
import { VehicleReportPDF } from '@/lib/vehicle-lookup/pdf/vehicle-report-pdf';
import type { VehicleConsultationRecord } from '@/lib/vehicle-lookup/types';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1. Authenticate Customer User
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Acesso não autorizado. Faça login na Área do Cliente.' },
        { status: 401 }
      );
    }

    // 2. Fetch Customer Consultation
    const { data: consultation, error: consultationError } = await supabase
      .from('customer_plate_consultations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (consultationError || !consultation) {
      return NextResponse.json(
        { error: 'Consulta veicular não encontrada.' },
        { status: 404 }
      );
    }

    if (consultation.status !== 'completed' || !consultation.vehicle_data) {
      return NextResponse.json(
        { error: 'O laudo desta consulta ainda não está disponível para download.' },
        { status: 400 }
      );
    }

    // 3. Resolve InternalVehicleConsultationDto
    let vpcRecord: VehicleConsultationRecord | null = null;
    const adminClient = createAdminClient();

    if (consultation.source_consultation_id) {
      const { data: sourceRecord } = await adminClient
        .from('vehicle_plate_consultations')
        .select('*')
        .eq('id', consultation.source_consultation_id)
        .maybeSingle();

      if (sourceRecord) {
        vpcRecord = sourceRecord as VehicleConsultationRecord;
      }
    }

    // Fallback if source_consultation_id was not populated
    if (!vpcRecord) {
      vpcRecord = {
        id: consultation.id,
        plate_normalized: consultation.plate_normalized,
        plate_display: consultation.plate,
        consultation_type: 'veiculos-total',
        provider: 'apibrasil',
        raw_response: consultation.vehicle_data,
        response_schema_version: '1.0',
        status: 'COMPLETED',
        provider_status_code: 200,
        provider_error: false,
        provider_message: null,
        mode: 'mock',
        is_mock: true,
        is_chargeable: false,
        charged_amount: 0,
        provider_balance_before: null,
        provider_balance_after: null,
        provider_tax: null,
        vehicle_type: 'AUTOMOVEL',
        brand: 'VEÍCULO',
        model: 'CONSULTADO',
        vehicle_description: null,
        year_manufacture: 2021,
        year_model: 2022,
        color: 'N/I',
        state: 'SP',
        city: 'São Paulo',
        chassis_masked: null,
        renavam_masked: null,
        risk_level: 'LOW',
        risk_index: 10,
        has_active_theft_robbery: false,
        has_judicial_restriction: false,
        has_financial_restriction: false,
        has_active_gravamen: false,
        has_auction_record: false,
        has_accident_indication: false,
        has_debts: false,
        debts_total_amount: 0,
        confirmation_at: consultation.created_at,
        confirmed_by: user.id,
        confirmation_plate: consultation.plate,
        confirmation_message_version: 'v1.0',
        motorcycle_id: null,
        sell_request_id: null,
        consignment_id: null,
        lead_id: null,
        consulted_at: consultation.processed_at || consultation.created_at,
        consulted_by: user.id,
        pdf_generated_at: null,
        pdf_generation_count: 0,
        created_at: consultation.created_at,
        updated_at: consultation.updated_at,
      };
    }

    const dto = toInternalVehicleConsultationDto(vpcRecord);
    const settings = await getSiteSettings();

    // 4. Prepare Logo Base64
    let logoBase64: string | undefined;
    const customLogoUrl =
      (settings?.settings as any)?.branding?.logoUrl ||
      (settings?.settings as any)?.logo_path;

    if (
      customLogoUrl &&
      (customLogoUrl.startsWith('http://') || customLogoUrl.startsWith('https://'))
    ) {
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
        console.warn('Could not load local logo for customer vehicle report:', e);
      }
    }

    // 5. Prepare Safe Customer DTO (Same standard as admin & public)
    const customerDto = toCustomerVehicleReportDto(dto);

    // 6. Render PDF to Buffer using the exact same VehicleReportPDF component
    const pdfBuffer = await renderToBuffer(
      React.createElement(VehicleReportPDF, {
        report: customerDto,
        settings,
        logoSrc: logoBase64,
      }) as any
    );

    // 7. Update counter
    await adminClient
      .from('customer_plate_consultations')
      .update({
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    const filename = `laudo-veicular_${dto.plate_normalized}_${consultation.id.slice(0, 8)}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('Error generating customer vehicle report PDF:', err);
    return NextResponse.json(
      { error: err?.message || 'Falha na geração do laudo PDF.' },
      { status: 500 }
    );
  }
}
