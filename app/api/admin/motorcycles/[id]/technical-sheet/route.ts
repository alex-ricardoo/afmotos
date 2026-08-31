import React from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/queries/settings';
import { motorcycleTechnicalSheetSchema } from '@/lib/technical-sheet/schema';
import { TechnicalSheetPDF } from '@/lib/pdf/technical-sheet';
import { loadLocalPdfImage, loadPdfImage } from '@/lib/pdf/assets';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return new NextResponse('Não autorizado', { status: 401 });
  const { id } = await params;
  const { data, error } = await (supabase as SupabaseClient)
    .from('motorcycle_technical_sheets')
    .select('id, motorcycle_id, sheet_data, status, pdf_version')
    .eq('motorcycle_id', id)
    .eq('status', 'APPROVED')
    .order('approved_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data)
    return new NextResponse('A ficha técnica precisa ser aprovada antes do PDF.', { status: 409 });
  const parsed = motorcycleTechnicalSheetSchema.safeParse(data.sheet_data);
  if (!parsed.success || parsed.data.review.status !== 'APPROVED')
    return new NextResponse('Ficha técnica inválida.', { status: 422 });
  try {
    const settings = await getSiteSettings();
    const settingsValue = settings?.settings;
    const branding =
      settingsValue && typeof settingsValue === 'object' && !Array.isArray(settingsValue)
        ? settingsValue.branding
        : null;
    const configuredLogo =
      branding && typeof branding === 'object' && !Array.isArray(branding)
        ? branding.logoUrl
        : null;
    const configuredLogoPath =
      settingsValue && typeof settingsValue === 'object' && !Array.isArray(settingsValue)
        ? settingsValue.logo_path
        : null;
    const logoUrl =
      typeof configuredLogo === 'string'
        ? configuredLogo
        : typeof configuredLogoPath === 'string'
          ? configuredLogoPath
          : null;
    const [imageSrc, logoSrc] = await Promise.all([
      loadPdfImage(parsed.data.unitData.imageUrl),
      (logoUrl ? loadPdfImage(logoUrl) : Promise.resolve(null))
        .then((logo) => logo || loadLocalPdfImage('logo.png'))
        .then((logo) => logo || loadLocalPdfImage('logo.jpg')),
    ]);
    console.info('[TechnicalSheetPDF] Assets resolvidos', {
      motorcycleId: id,
      imageAvailable: Boolean(imageSrc),
      logoAvailable: Boolean(logoSrc),
    });

    const { data: moto } = await (supabase as SupabaseClient)
      .from('motorcycles')
      .select('license_plate')
      .eq('id', id)
      .maybeSingle();

    const resolvedPlate = parsed.data.unitData.licensePlate || moto?.license_plate || null;

    const buffer = await renderToBuffer(
      React.createElement(TechnicalSheetPDF, {
        sheet: {
          ...parsed.data,
          unitData: { ...parsed.data.unitData, imageUrl: imageSrc, licensePlate: resolvedPlate },
          pdfVersion: data.pdf_version,
        },
        settings,
        logoSrc,
      }) as unknown as React.ReactElement<DocumentProps>,
    );
    const slug =
      `${parsed.data.identity.brand}-${parsed.data.identity.model}-${parsed.data.identity.yearModel}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
    const inline = request.nextUrl.searchParams.get('inline') === '1';
    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename="ficha-tecnica-${slug}.pdf"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Error generating technical sheet PDF:', error);
    return new NextResponse('Não foi possível gerar o PDF agora. Tente novamente.', {
      status: 500,
    });
  }
}
