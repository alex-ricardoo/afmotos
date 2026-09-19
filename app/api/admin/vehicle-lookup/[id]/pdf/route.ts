import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { getVehicleConsultationById } from '@/lib/queries/vehicle-lookup';
import { getSiteSettings } from '@/lib/queries/settings';
import { toCustomerVehicleReportDto } from '@/lib/vehicle-lookup/adapters/vehicle-pdf';
import { VehicleReportPDF } from '@/lib/vehicle-lookup/pdf/vehicle-report-pdf';
import { resolvePdfLogo } from '@/lib/pdf/assets';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // 1. Authenticate Admin User
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Acesso não autenticado. Faça login.' },
        { status: 401 }
      );
    }

    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('id, role, is_active')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    if (!adminProfile) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas administradores podem acessar este laudo interno.' },
        { status: 403 }
      );
    }

    // 2. Fetch Consultation Record & Site Settings
    const [dto, settings] = await Promise.all([
      getVehicleConsultationById(id),
      getSiteSettings(),
    ]);

    if (!dto) {
      return NextResponse.json(
        { error: 'Consulta veicular não encontrada.' },
        { status: 404 }
      );
    }

    // 3. Prepare Logo (Prioritize database base64, then remote with timeout, then local fallback)
    const logoBase64 = (await resolvePdfLogo(settings)) || undefined;

    // 4. Prepare Safe Customer DTO
    const customerDto = toCustomerVehicleReportDto(dto);

    // 5. Render PDF to Buffer
    const pdfBuffer = await renderToBuffer(
      React.createElement(VehicleReportPDF, {
        report: customerDto,
        settings,
        logoSrc: logoBase64,
      }) as any
    );

    // 6. Update Audit Generation Counter in background
    await supabase
      .from('vehicle_plate_consultations')
      .update({
        pdf_generated_at: new Date().toISOString(),
        pdf_generation_count: (dto.pdf_generation_count || 0) + 1,
      })
      .eq('id', id);

    // 7. Return response with proper headers
    const filename = `historico-veicular_${dto.plate_normalized}_${dto.id.slice(0, 8)}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('Error generating vehicle report PDF:', err);
    return NextResponse.json(
      { error: err?.message || 'Falha na geração do laudo PDF.' },
      { status: 500 }
    );
  }
}
