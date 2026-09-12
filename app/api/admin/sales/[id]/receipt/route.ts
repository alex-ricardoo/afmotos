import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';
import { getSaleById } from '@/lib/queries/sales';
import { getSiteSettings } from '@/lib/queries/settings';
import { SaleReceiptPDF } from '@/lib/pdf/sale-receipt';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // 1. Verify Admin Authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse('Não autenticado', { status: 401 });
    }

    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('id, role, is_active')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .in('role', ['admin', 'super_admin'])
      .maybeSingle();

    if (!adminProfile) {
      return new NextResponse('Acesso restrito a administradores', { status: 403 });
    }

    // 2. Fetch sale details
    const sale = await getSaleById(id);
    if (!sale) {
      return new NextResponse('Venda não encontrada', { status: 404 });
    }

    // 3. Fetch store settings
    const settings = await getSiteSettings();

    // 4. Load official logo if exists
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
        }
      } catch (e) {
        console.warn('Could not load local logo.jpg:', e);
      }
    }

    // 5. Render PDF to Buffer
    const element = React.createElement(SaleReceiptPDF, {
      sale,
      settings,
      logoSrc: logoBase64,
    });

    const buffer = await renderToBuffer(element as any);

    const searchParams = request.nextUrl.searchParams;
    const isInline = searchParams.get('inline') === '1';
    const filename = `recibo-${sale.receipt_number || sale.id.substring(0, 8)}.pdf`;

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `${isInline ? 'inline' : 'attachment'}; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error generating PDF receipt:', error);
    return new NextResponse('Erro interno ao gerar o recibo', { status: 500 });
  }
}
