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
import { getSiteLogo, getSiteName } from '@/lib/site-settings';
import { SiteSettingsRecord } from '@/types/site-settings';
import { formatCnpj } from '@/lib/utils/cnpj';

export const dynamic = 'force-dynamic';

async function getCurrentLogoDataUri(
  settings: Awaited<ReturnType<typeof getSiteSettings>>,
  requestId: string,
): Promise<string | undefined> {
  const customLogoUrl =
    (settings?.settings as Record<string, unknown> | null)?.branding &&
    typeof (settings?.settings as Record<string, unknown>).branding === 'object'
      ? ((settings?.settings as Record<string, unknown>).branding as Record<string, unknown>)?.logoUrl as string
      : ((settings?.settings as Record<string, unknown> | null)?.logo_path as string) ||
        ((settings as unknown as Record<string, unknown> | null)?.logo_url as string);

  const logo = getSiteLogo(settings as SiteSettingsRecord | null);
  const targetUrl = customLogoUrl || logo?.src;

  // 1. Se for URL remota (http/https), tentar converter para base64 com timeout
  if (targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
    try {
      const response = await fetch(targetUrl, {
        cache: 'no-store',
        signal: AbortSignal.timeout(1500),
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const file = Buffer.from(await response.arrayBuffer());
        return `data:${contentType};base64,${file.toString('base64')}`;
      }
    } catch (error) {
      console.warn('[agreements.generate] could not fetch remote logo via server fetch, using local fallback logo', { requestId, error });
    }
  }

  // 2. Se for arquivo local relativo
  if (targetUrl && targetUrl.startsWith('/')) {
    try {
      const filePath = path.join(process.cwd(), 'public', targetUrl.replace(/^\//, ''));
      const file = await fs.readFile(filePath);
      const mime = targetUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
      return `data:${mime};base64,${file.toString('base64')}`;
    } catch (error) {
      console.warn('[agreements.generate] could not load local logo file', { requestId, error });
    }
  }

  // 3. Fallback garantido para public/logo.jpg ou public/logo.png
  try {
    const jpgPath = path.join(process.cwd(), 'public', 'logo.jpg');
    const file = await fs.readFile(jpgPath);
    return `data:image/jpeg;base64,${file.toString('base64')}`;
  } catch {
    try {
      const pngPath = path.join(process.cwd(), 'public', 'logo.png');
      const file = await fs.readFile(pngPath);
      return `data:image/png;base64,${file.toString('base64')}`;
    } catch {
      return undefined;
    }
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

        // Se não houver sell_request vinculada, sintetizar a partir dos dados do lead
        if (!sellRequest) {
          const leadMeta = (leadRecord.metadata as Record<string, unknown> | null) || {};
          const motoData = (leadMeta.motorcycle as Record<string, unknown> | null) || {};

          sellRequest = {
            id: leadRecord.id,
            name: leadRecord.name || 'Proprietário',
            phone: leadRecord.phone || '',
            brand: (leadMeta.brand as string) || (motoData.brand as string) || null,
            model: (leadMeta.model as string) || (motoData.model as string) || null,
            year_manufacture: (leadMeta.year_manufacture as number) || (motoData.year_manufacture as number) || null,
            year_model: (leadMeta.year_model as number) || (motoData.year_model as number) || (leadMeta.year as number) || null,
            license_plate: (leadMeta.license_plate as string) || (leadMeta.plate as string) || (motoData.license_plate as string) || null,
            color: (leadMeta.color as string) || (motoData.color as string) || null,
            mileage: (leadMeta.mileage as number) || (motoData.mileage as number) || null,
            address_street: (leadMeta.address_street as string) || null,
            address_number: (leadMeta.address_number as string) || null,
            address_neighborhood: (leadMeta.address_neighborhood as string) || null,
            city: (leadMeta.city as string) || null,
            state: (leadMeta.state as string) || null,
            postal_code: (leadMeta.postal_code as string) || null,
            motorcycle_data: motoData,
            metadata: leadMeta,
          };
          sellRequestError = null;
        }
      }
    }

    if (sellRequestError || !sellRequest) {
      return NextResponse.json({ success: false, error: 'Solicitação de venda ou anúncio não encontrada.' }, { status: 404 });
    }

    const settings = await getSiteSettings();
    const storeName = getSiteName(settings);
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
        vehiclePlate:
          sellRequest.license_plate ||
          sellRequest.motorcycle_data?.license_plate ||
          sellRequest.motorcycle_data?.plate ||
          ((sellRequest.metadata as Record<string, unknown> | null)?.license_plate as string) ||
          ((sellRequest.metadata as Record<string, unknown> | null)?.plate as string) ||
          null,
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

    // Sincronizar / Criar registro na entidade financeira proposal_commissions
    try {
      const targetProposalId = sellRequest.lead_id || sellRequest.id;

      const { data: existingComm } = await supabase
        .from('proposal_commissions')
        .select('id, status')
        .or(`proposal_id.eq.${targetProposalId},sell_request_id.eq.${sellRequest.id}`)
        .maybeSingle();

      const commPayload: Record<string, any> = {
        proposal_id: targetProposalId,
        sell_request_id: sellRequest.id,
        sale_agreement_id: agreementRecord.id,
        owner_customer_id: sellRequest.customer_id || null,
        commission_type: 'percentage',
        commission_percentage: Number(commission_percentage),
        expected_sale_value: Number(expected_sale_value),
        commission_expected_value: commissionValue,
        status: existingComm?.status && existingComm.status !== 'draft' ? existingComm.status : 'proposed',
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      };

      if (existingComm) {
        await supabase
          .from('proposal_commissions')
          .update(commPayload)
          .eq('id', existingComm.id);

        await supabase.from('proposal_commission_audit_logs').insert({
          commission_id: existingComm.id,
          action: 'updated',
          previous_snapshot: existingComm,
          new_snapshot: commPayload,
          reason: `Vínculo com acordo de consignação gerado #${agreementRecord.id}`,
          changed_by: user.id,
        });
      } else {
        commPayload.created_at = new Date().toISOString();
        commPayload.created_by = user.id;
        const { data: createdComm } = await supabase
          .from('proposal_commissions')
          .insert(commPayload)
          .select('id')
          .single();

        if (createdComm) {
          await supabase.from('proposal_commission_audit_logs').insert({
            commission_id: createdComm.id,
            action: 'created',
            previous_snapshot: null,
            new_snapshot: commPayload,
            reason: `Criação via geração de acordo de consignação #${agreementRecord.id}`,
            changed_by: user.id,
          });
        }
      }
    } catch (commSyncErr) {
      console.warn('[agreements.generate] could not sync proposal_commissions:', commSyncErr);
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
