import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
import { createClient } from '@/lib/supabase/server';
import { getVehicleConsultationById } from '@/lib/queries/vehicle-lookup';
import { getSiteSettings } from '@/lib/queries/settings';
import { toCustomerVehicleReportDto } from '@/lib/vehicle-lookup/adapters/vehicle-pdf';
import { VehicleReportPDF } from '@/lib/vehicle-lookup/pdf/vehicle-report-pdf';

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
        { error: 'Acesso não autorizado. Faça login como administrador.' },
        { status: 401 }
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

    // 3. Prepare Logo Base64
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
        console.warn('Could not load local logo for vehicle report:', e);
      }
    }

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
