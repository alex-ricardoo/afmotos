import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import fs from 'node:fs/promises';
import path from 'node:path';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { agreementGenerateSchema } from '@/lib/agreements/schema';
import { getSiteSettings } from '@/lib/queries/settings';
import { AgreementSalePDF } from '@/lib/agreements/pdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getSiteLogo } from '@/lib/site-settings';
import { SiteSettingsRecord } from '@/types/site-settings';
import { formatCnpj } from '@/lib/utils/cnpj';

export const dynamic = 'force-dynamic';

async function getCurrentLogoDataUri(
  settings: Awaited<ReturnType<typeof getSiteSettings>>,
  requestId: string,
) {
  const logo = getSiteLogo(settings as SiteSettingsRecord | null);

  try {
    if (logo.provider === 'local' || logo.src.startsWith('/')) {
      const file = await fs.readFile(path.join(process.cwd(), 'public', logo.src.replace(/^\//, '')));
      return `data:image/jpeg;base64,${file.toString('base64')}`;
    }

    const response = await fetch(logo.src, { cache: 'no-store' });
    if (!response.ok) return undefined;
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const file = Buffer.from(await response.arrayBuffer());
    return `data:${contentType};base64,${file.toString('base64')}`;
  } catch (error) {
    console.warn('[agreements.generate] could not load store logo', { requestId, error });
    return undefined;
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    console.info('[agreements.generate] request started', { requestId });
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.warn('[agreements.generate] authentication failed', {
        requestId,
        hasUser: Boolean(user),
        authError: authError?.message || null,
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json({ success: false, error: 'Você precisa estar autenticado.' }, { status: 401 });
    }

    console.info('[agreements.generate] authenticated user', {
      requestId,
      userId: user.id,
    });

    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('admin_profiles')
      .select('role, is_active')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    const authorizationReason = !adminProfile
      ? 'profile_not_found'
      : adminProfile.is_active === false
        ? 'profile_inactive'
        : adminProfile.role === 'user'
          ? 'role_user'
          : null;

    console.info('[agreements.generate] admin profile lookup', {
      requestId,
      userId: user.id,
      profileFound: Boolean(adminProfile),
      role: adminProfile?.role || null,
      isActive: adminProfile?.is_active ?? null,
      queryError: adminProfileError?.message || null,
      authorizationReason,
    });

    if (adminProfileError || authorizationReason) {
      console.warn('[agreements.generate] authorization denied', {
        requestId,
        userId: user.id,
        reason: adminProfileError ? 'profile_query_error' : authorizationReason,
        durationMs: Date.now() - startedAt,
      });
      return NextResponse.json({ success: false, error: 'Acesso restrito a administradores.' }, { status: 403 });
    }

    const body = await request.json();
    console.info('[agreements.generate] payload received', {
      requestId,
      keys: Object.keys(body || {}),
      hasOwnerCpf: Boolean(body?.owner_cpf),
      hasOwnerRg: Boolean(body?.owner_rg),
      hasOwnerAddress: Boolean(body?.owner_address),
      hasOwnerPhone: Boolean(body?.owner_phone),
    });
    const parsed = agreementGenerateSchema.safeParse(body);

    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      console.warn('[agreements.generate] invalid payload', {
        requestId,
        field: issue?.path.join('.') || null,
        code: issue?.code || null,
        message: issue?.message || null,
      });
      return NextResponse.json(
        {
          success: false,
          error: issue?.message || 'Dados do acordo inválidos.',
          field: issue?.path.join('.') || null,
        },
        { status: 400 },
      );
    }

    const { sell_request_id, owner_cpf, owner_rg, commission_percentage, expected_sale_value } = parsed.data;
    const commissionValue = Number((expected_sale_value * (commission_percentage / 100)).toFixed(2));

    let { data: sellRequest, error: sellRequestError } = await supabase
      .from('sell_requests')
      .select('*')
      .eq('id', sell_request_id)
      .maybeSingle();

    if (!sellRequest) {
      const { data: leadRecord } = await supabase
        .from('leads')
        .select('*')
        .eq('id', sell_request_id)
        .maybeSingle();

      if (leadRecord) {
        const metaSellReqId = (leadRecord.metadata as Record<string, unknown> | null)?.sell_request_id as string | undefined;
        if (metaSellReqId) {
          const { data: linkedSellReq } = await supabase
            .from('sell_requests')
            .select('*')
            .eq('id', metaSellReqId)
            .maybeSingle();
          if (linkedSellReq) {
            sellRequest = linkedSellReq;
            sellRequestError = null;
          }
        }
      }
    }

    if (sellRequestError || !sellRequest) {
      return NextResponse.json({ success: false, error: 'Solicitação de venda ou anúncio não encontrada.' }, { status: 404 });
    }

    const settings = await getSiteSettings();
    const storeName = settings?.site_name || 'AF Motos';
    const address = settings?.address || 'Endereço a confirmar';
    const phone = settings?.whatsapp_phone || '(81) 0000-0000';
    const email = settings?.contact_email || null;
    const cnpj = formatCnpj(settings?.cnpj);
    const logoDataUri = await getCurrentLogoDataUri(settings, requestId);
    const sellerName = sellRequest.name || 'Proprietário';
    const sellerAddress = [
      sellRequest.address_street,
      sellRequest.address_number,
      sellRequest.address_neighborhood,
      sellRequest.city,
      sellRequest.state,
      sellRequest.postal_code ? `CEP ${sellRequest.postal_code}` : null,
    ].filter(Boolean).join(', ');

    const agreementDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    const pdfBuffer = await renderToBuffer(
      React.createElement(AgreementSalePDF, {
        saleId: sellRequest.id,
        storeName,
        logoSrc: logoDataUri,
        address,
        phone,
        email,
        cnpj,
        sellerName,
        sellerDocument: owner_cpf,
        sellerRg: owner_rg,
        sellerAddress: sellerAddress || 'Endereço não informado',
        sellerPhone: sellRequest.phone,
        vehicleBrand: sellRequest.brand,
        vehicleModel: sellRequest.model,
        vehicleYear: sellRequest.year_model ?? sellRequest.year_manufacture,
        vehicleManufactureYear: sellRequest.year_manufacture,
        vehicleModelYear: sellRequest.year_model,
        vehicleVersion: sellRequest.motorcycle_data?.version || sellRequest.fipe_model_name,
        vehicleColor: sellRequest.color,
        vehiclePlate: sellRequest.license_plate,
        vehicleChassi: sellRequest.motorcycle_data?.chassi || null,
        vehicleRenavam: sellRequest.motorcycle_data?.renavam || null,
        vehicleMileage: sellRequest.mileage,
        vehicleFuel: sellRequest.fipe_fuel_name || sellRequest.motorcycle_data?.fuel_name || null,
        vehicleFipeCode: sellRequest.fipe_code,
        vehicleFipeReference: sellRequest.fipe_reference_period,
        expectedSaleValue: Number(expected_sale_value),
        commissionPercentage: Number(commission_percentage),
        commissionValue,
        agreementDate,
      }) as Parameters<typeof renderToBuffer>[0],
    );

    const fileName = `acordo_venda_${sellRequest.id}_${format(new Date(), 'yyyyMMdd')}.pdf`;
    const storagePath = `agreements/${fileName}`;
    const uploadResult = await supabase.storage.from('agreements').upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

    if (uploadResult.error) {
      throw new Error(uploadResult.error.message);
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('agreements')
      .createSignedUrl(storagePath, 60 * 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      throw new Error(signedUrlError?.message || 'Não foi possível criar o link do acordo.');
    }

    const { data: agreementRecord, error: agreementError } = await supabase
      .from('sale_agreements')
      .insert({
        sell_request_id: sellRequest.id,
        owner_cpf,
        owner_rg,
        owner_address: sellerAddress,
        owner_phone: sellRequest.phone,
        commission_percentage: Number(commission_percentage),
        commission_value: commissionValue,
        expected_sale_value: Number(expected_sale_value),
        pdf_url: storagePath,
        created_by: user.id,
        status: 'generated',
      })
      .select('id')
      .single();

    if (agreementError) {
      throw new Error(agreementError.message);
    }

    return NextResponse.json({
      success: true,
      pdf_url: signedUrlData.signedUrl,
      agreement_id: agreementRecord.id,
    });
  } catch (error: unknown) {
    console.error('[agreements.generate] unexpected error', {
      requestId,
      durationMs: Date.now() - startedAt,
      error,
    });
    return NextResponse.json(
      { success: false, error: (error as Error)?.message || 'Não foi possível gerar o acordo.' },
      { status: 500 },
    );
  }
}
