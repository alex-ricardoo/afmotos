import React from 'react';
import fs from 'node:fs/promises';
import path from 'node:path';
import { renderToBuffer } from '@react-pdf/renderer';
import { createClient } from '@/lib/supabase/server';
import { getSiteSettings } from '@/lib/queries/settings';
import { getSiteLogo } from '@/lib/site-settings';
import { SiteSettingsRecord } from '@/types/site-settings';
import { formatCnpj } from '@/lib/utils/cnpj';
import { MotorcyclePurchaseAgreementPDF } from '@/lib/pdf/purchase-agreement';
import { purchaseAgreementGenerateSchema, PurchaseAgreementGenerateInput } from './schema';
import { formatAgreementNumber } from './formatters';
import { PurchaseAgreementSnapshot } from '@/types/purchase-agreement';

export async function getCurrentLogoDataUri(
  settings: Awaited<ReturnType<typeof getSiteSettings>>,
  requestId: string,
): Promise<string | undefined> {
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
    console.warn('[purchase-agreements.service] could not load store logo', { requestId, error });
    return undefined;
  }
}

export async function generatePurchaseAgreementService(
  rawInput: PurchaseAgreementGenerateInput,
  userId: string,
  requestId: string = crypto.randomUUID(),
) {
  const parsed = purchaseAgreementGenerateSchema.safeParse(rawInput);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    throw new Error(firstIssue?.message || 'Dados inválidos para geração do contrato de compra.');
  }

  const input = parsed.data;
  const supabase = await createClient();
  const settings = await getSiteSettings();

  const storeName = settings?.site_name || 'AF Motos';
  const storeAddress = settings?.address || 'Carpina, PE';
  const storePhone = settings?.whatsapp_phone || '(81) 98888-7777';
  const storeEmail = settings?.contact_email || null;
  const storeCnpj = formatCnpj(settings?.cnpj);
  const logoDataUri = await getCurrentLogoDataUri(settings, requestId);

  // Consulta de laudo veicular vinculado (se fornecido)
  let vehicleConsultationSnapshot = null;
  if (input.vehicle_consultation_id) {
    const { data: consultation } = await supabase
      .from('vehicle_plate_consultations')
      .select('id, created_at, risk_level')
      .eq('id', input.vehicle_consultation_id)
      .maybeSingle();

    if (consultation) {
      vehicleConsultationSnapshot = {
        consultation_id: consultation.id,
        consulted_at: consultation.created_at,
        risk_level: consultation.risk_level,
        summary_notes: 'Histórico veicular oficial vinculado.',
      };
    }
  }

  const agreementNumber = formatAgreementNumber();
  const generatedAt = new Date().toISOString();

  const isFullDischarge = input.payment_status === 'PAID_FULL' && input.is_full_discharge_confirmed;
  const dischargeStatement = isFullDischarge
    ? `A AF Motos declara ter pago ao vendedor o valor total de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(input.purchase_amount)} pela aquisição da motocicleta, dando-se o vendedor por integralmente quitado quanto ao preço de compra, ressalvadas as responsabilidades por débitos, restrições e infrações anteriores à entrega.`
    : `O pagamento encontra-se em status ${input.payment_status}, restando pendente a quitação total de acordo com os termos pactuados entre as partes.`;

  const snapshot: PurchaseAgreementSnapshot = {
    schema_version: '1.0',
    generated_at: generatedAt,
    generated_by: {
      user_id: userId,
      name: 'Administrador AF Motos',
    },
    store: {
      name: storeName,
      cnpj: storeCnpj,
      address: storeAddress,
      city: 'Carpina',
      state: 'PE',
      phone: storePhone,
      email: storeEmail,
      legal_representative: storeName,
    },
    seller: {
      customer_id: input.seller_customer_id || null,
      person_type: input.seller_document.replace(/\D/g, '').length > 11 ? 'PJ' : 'PF',
      full_name: input.seller_name,
      document: input.seller_document,
      rg: input.seller_rg || null,
      phone: input.seller_phone,
      email: input.seller_email || null,
      address: input.seller_address,
    },
    motorcycle: {
      id: input.motorcycle_id || null,
      brand: input.brand,
      model: input.model,
      version: input.version || null,
      year_manufacture: input.year_manufacture,
      year_model: input.year_model,
      color: input.color || null,
      fuel: input.fuel || null,
      engine_capacity: input.engine_capacity || null,
      license_plate: input.license_plate,
      renavam: input.renavam || null,
      chassi: input.chassi || null,
      engine_number: input.engine_number || null,
      mileage_at_delivery: input.delivery_km ?? input.mileage,
      fipe_code: input.fipe_code || null,
      fipe_price: input.fipe_price || null,
    },
    commercial_terms: {
      purchase_amount: input.purchase_amount,
      paid_amount: input.paid_amount,
      payment_status: input.payment_status,
      payment_status_label:
        input.payment_status === 'PAID_FULL'
          ? 'Quitado Integralmente'
          : input.payment_status === 'PAID_PARTIAL'
            ? 'Pago Parcialmente'
            : 'Pendente',
      payment_method: input.payment_method,
      payment_date: input.payment_date,
      is_full_discharge: isFullDischarge,
      discharge_statement: dischargeStatement,
    },
    delivery_and_possession: {
      delivery_datetime: input.delivery_datetime,
      delivery_location: storeAddress,
      delivery_km: input.delivery_km,
      keys_count: input.keys_count,
      has_manual: input.has_manual,
      has_spare_key: input.has_spare_key,
      documents_delivered: input.documents_delivered || [],
      accessories_delivered: input.accessories_delivered || [],
      apparent_condition_notes: input.apparent_condition_notes || null,
    },
    transfer_and_compliance: {
      transfer_status: 'PENDING',
      transfer_deadline_date: input.transfer_deadline_date,
      transfer_deadline_days: 30,
      legal_provisions: 'Conforme Art. 123 e 134 do CTB e Resoluções CONTRAN.',
    },
    seller_declarations: {
      legitimate_ownership_confirmed: true,
      civil_capacity_confirmed: true,
      no_undisclosed_debts_confirmed: true,
      no_judicial_or_financial_restrictions_confirmed: true,
      no_theft_sinister_auction_record_confirmed: true,
      engine_and_chassis_integrity_confirmed: true,
      cooperation_for_transfer_confirmed: true,
    },
    vehicle_lookup_reference: vehicleConsultationSnapshot,
    signatures: {
      seller_name: input.seller_name,
      seller_document: input.seller_document,
      seller_role: 'Vendedor / Proprietário',
      buyer_name: storeName,
      buyer_document: storeCnpj,
      buyer_role: 'AF Motos • Compradora / Representante Legal',
      witness_1_name: null,
      witness_1_document: null,
      witness_2_name: null,
      witness_2_document: null,
    },
  };

  // Renderização do PDF com @react-pdf/renderer
  const pdfBuffer = await renderToBuffer(
    React.createElement(MotorcyclePurchaseAgreementPDF, {
      snapshot,
      agreementNumber,
      logoSrc: logoDataUri,
    }) as Parameters<typeof renderToBuffer>[0],
  );

  // Upload no bucket privado agreements
  const storageFolder = input.motorcycle_id || 'unlinked';
  const fileName = `${agreementNumber}.pdf`;
  const storagePath = `agreements/purchases/${storageFolder}/${fileName}`;

  const uploadResult = await supabase.storage.from('agreements').upload(storagePath, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: true,
  });

  if (uploadResult.error) {
    console.error('[purchase-agreements.service] storage upload error', uploadResult.error);
    throw new Error(`Falha ao salvar o PDF: ${uploadResult.error.message}`);
  }

  // Geração de URL assinada temporária (1 hora)
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('agreements')
    .createSignedUrl(storagePath, 3600);

  if (signedUrlError || !signedUrlData?.signedUrl) {
    throw new Error('Falha ao gerar link seguro do contrato.');
  }

  // Persistência no banco de dados com snapshot
  const { data: agreementRecord, error: dbError } = await supabase
    .from('motorcycle_purchase_agreements')
    .insert({
      motorcycle_id: input.motorcycle_id || null,
      seller_customer_id: input.seller_customer_id || null,
      sell_request_id: input.sell_request_id || null,
      vehicle_consultation_id: input.vehicle_consultation_id || null,
      agreement_number: agreementNumber,
      agreement_version: 1,
      purchase_amount: input.purchase_amount,
      paid_amount: input.paid_amount,
      payment_status: input.payment_status,
      payment_method: input.payment_method,
      payment_date: input.payment_date,
      delivery_datetime: input.delivery_datetime,
      delivery_km: input.delivery_km,
      keys_count: input.keys_count,
      has_manual: input.has_manual,
      has_spare_key: input.has_spare_key,
      documents_delivered: input.documents_delivered || [],
      accessories_delivered: input.accessories_delivered || [],
      apparent_condition_notes: input.apparent_condition_notes || null,
      transfer_status: 'PENDING',
      transfer_deadline_date: input.transfer_deadline_date,
      transfer_notes: input.transfer_notes || null,
      vehicle_condition_summary: snapshot.delivery_and_possession as any,
      seller_declarations: snapshot.seller_declarations as any,
      contract_snapshot: snapshot as any,
      pdf_storage_path: storagePath,
      status: 'generated',
      created_by: userId,
    })
    .select('id')
    .single();

  if (dbError || !agreementRecord) {
    console.error('[purchase-agreements.service] db insert error', dbError);
    throw new Error(`Falha ao registrar contrato: ${dbError?.message}`);
  }

  // Se houver moto vinculada, atualiza dados de custo e aquisição no estoque
  if (input.motorcycle_id) {
    await supabase
      .from('motorcycles')
      .update({
        purchase_amount: input.purchase_amount,
        purchase_date: input.payment_date,
        seller_customer_id: input.seller_customer_id || null,
        acquisition_agreement_id: agreementRecord.id,
      })
      .eq('id', input.motorcycle_id);
  }

  return {
    success: true,
    agreement_id: agreementRecord.id,
    agreement_number: agreementNumber,
    pdf_url: signedUrlData.signedUrl,
    expires_in: 3600,
  };
}

export async function getPurchaseAgreementPdfUrlService(agreementId: string, requestId: string = crypto.randomUUID()) {
  const supabase = await createClient();
  const { data: agreement, error } = await supabase
    .from('motorcycle_purchase_agreements')
    .select('*')
    .eq('id', agreementId)
    .maybeSingle();

  if (error || !agreement) {
    throw new Error('Contrato de compra não encontrado.');
  }

  // Se já tiver arquivo no storage, tenta criar signedUrl
  if (agreement.pdf_storage_path) {
    const { data: signedData, error: signError } = await supabase.storage
      .from('agreements')
      .createSignedUrl(agreement.pdf_storage_path, 3600);

    if (!signError && signedData?.signedUrl) {
      return {
        success: true,
        agreement_id: agreement.id,
        agreement_number: agreement.agreement_number,
        pdf_url: signedData.signedUrl,
        is_cached: true,
        expires_in: 3600,
      };
    }
  }

  // Se o arquivo não existir ou expirar, regenera a partir do snapshot imutável
  const snapshot = agreement.contract_snapshot as PurchaseAgreementSnapshot;
  const settings = await getSiteSettings();
  const logoDataUri = await getCurrentLogoDataUri(settings, requestId);

  const pdfBuffer = await renderToBuffer(
    React.createElement(MotorcyclePurchaseAgreementPDF, {
      snapshot,
      agreementNumber: agreement.agreement_number,
      logoSrc: logoDataUri,
    }) as Parameters<typeof renderToBuffer>[0],
  );

  const storageFolder = agreement.motorcycle_id || 'unlinked';
  const fileName = `${agreement.agreement_number}.pdf`;
  const storagePath = `agreements/purchases/${storageFolder}/${fileName}`;

  await supabase.storage.from('agreements').upload(storagePath, pdfBuffer, {
    contentType: 'application/pdf',
    upsert: true,
  });

  const { data: newSignedData } = await supabase.storage.from('agreements').createSignedUrl(storagePath, 3600);

  return {
    success: true,
    agreement_id: agreement.id,
    agreement_number: agreement.agreement_number,
    pdf_url: newSignedData?.signedUrl || '',
    is_cached: false,
    expires_in: 3600,
  };
}
