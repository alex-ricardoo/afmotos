import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
import { getSiteSettings } from '@/lib/queries/settings';
import {
  getPublicReportByShareToken,
  incrementPdfDownloadCount,
  checkInvalidAttemptRateLimit,
} from '@/lib/vehicle-lookup/share-service';
import { VehicleReportPDF } from '@/lib/vehicle-lookup/pdf/vehicle-report-pdf';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ shareToken: string }> }
) {
  try {
    const { shareToken } = await context.params;

    // 1. Rate Limit & IP Extraction
    const forwardedFor = request.headers.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : request.headers.get('x-real-ip') || '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || undefined;

    if (!checkInvalidAttemptRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Limite de requisições excedido. Tente novamente mais tarde.' },
        { status: 429 }
      );
    }

    // 2. Validate cryptographic token & fetch sanitized report
    const result = await getPublicReportByShareToken({
      shareToken,
      clientIp,
      userAgent,
    });

    if (!result || !result.publicDto) {
      return NextResponse.json(
        { error: 'Laudo indisponível ou link inválido.' },
        { status: 404 }
      );
    }

    const { publicDto, share } = result;

    // 3. Fetch Site Settings & Prepare Logo
    const settings = await getSiteSettings();
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
        console.warn('Could not load local logo for public vehicle report:', e);
      }
    }

    // 4. Render PDF to Buffer on-demand
    const pdfBuffer = await renderToBuffer(
      React.createElement(VehicleReportPDF, {
        report: publicDto as any,
        settings,
        logoSrc: logoBase64,
      }) as any
    );

    // 5. Update PDF download metric & audit asynchronously
    incrementPdfDownloadCount({
      shareId: share.id,
      consultationId: share.consultation_id,
      clientIp,
      userAgent,
    }).catch((err) => console.warn('Error updating pdf download count:', err));

    // 6. Return response with security & privacy headers
    const cleanPlate = publicDto.plate_display.replace(/[^a-zA-Z0-9]/g, '');
    const filename = `laudo-veicular_${cleanPlate}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err: any) {
    console.error('Error generating public vehicle report PDF:', err);
    return NextResponse.json(
      { error: 'Falha na geração do laudo em PDF.' },
      { status: 500 }
    );
  }
}
