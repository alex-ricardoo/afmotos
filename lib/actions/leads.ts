'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { uploadImage, UPLOAD_LIMITS } from '@/lib/uploads';
import { UploadedImage } from '@/lib/uploads/types';
import { fipexFetch } from '@/lib/fipex/client';
import { RawApiResponse, RawExpandedPriceData, RawModelDetail } from '@/lib/fipex/types';
import { mapModelDetail } from '@/lib/fipex/mappers';
import {
  ProposalViewModel,
  mapLeadToProposal,
  mapRentalRequestToProposal,
} from '../admin/proposal-view-model';
import { findOrCreateCustomer } from '@/lib/domain/customer-dedup';

export interface CreateLeadPayload {
  type:
    | 'MOTORCYCLE_INTEREST'
    | 'SELL_MOTORCYCLE'
    | 'CONSIGNMENT'
    | 'RENTAL'
    | 'MOTORCYCLE_REQUEST'
    | 'GENERAL_CONTACT';
  name: string;
  phone: string;
  email?: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export async function createLeadAction(data: CreateLeadPayload) {
  const supabase = await createClient();

  // 1. Vincular ou criar cliente central
  let customerId: string | null = null;
  try {
    const custRes = await findOrCreateCustomer(
      supabase,
      {
        full_name: data.name,
        phone: data.phone,
        email: data.email || null,
      },
      'website_contact',
    );
    if (custRes.customer) {
      customerId = custRes.customer.id;
    }
  } catch (custErr) {
    console.warn('Aviso: falha ao vincular cliente no lead:', custErr);
  }

  const payload = {
    ...data,
    customer_id: customerId,
    source: (data as { source?: string }).source || 'WEBSITE',
    message: data.message || 'Contato enviado pelo site',
  };

  const { error } = await supabase.from('leads').insert(payload);

  if (error) {
    console.error('Error creating lead:', error);
    return { error: 'Não foi possível salvar o contato. Tente novamente.' };
  }

  return { success: true };
}

export interface SellRequestImageItem {
  url: string;
  provider?: string;
  storage_path?: string | null;
  delete_url?: string | null;
}

export interface SellRequestPayload {
  request_kind?: 'ANNOUNCEMENT' | 'DIRECT_SALE';
  name: string;
  phone: string;
  email?: string | null;
  license_plate?: string | null;
  color?: string | null;
  brand: string;
  brand_id?: string | null;
  model: string;
  model_id?: string | null;
  year_manufacture: number;
  year_model: number;
  year_id?: string | null;
  fuel_id?: string | null;
  fuel_name?: string | null;
  mileage?: number | null;
  desired_price?: number | null;
  offer_percentage?: number | null;
  estimated_offer?: number | null;
  fipe_code?: string | null;
  fipe_price?: number | null;
  fipe_reference_period?: string | null;
  fipe_snapshot?: Record<string, unknown> | null;
  state?: string;
  postal_code?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_neighborhood?: string | null;
  address_complement?: string | null;
  city: string;
  notes?: string | null;
  images?: SellRequestImageItem[];
}

/**
 * Server action to upload an image from public announcement/sell form.
 * Uses centralized uploadImage orchestrator (Supabase Storage with ImgBB fallback).
 */
export async function uploadPublicSellRequestImageAction(
  formData: FormData,
): Promise<{ success: boolean; image?: UploadedImage; url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File | null;
    const uploadRequestId = (formData.get('uploadRequestId') as string) || undefined;

    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: 'Nenhum arquivo de imagem válido enviado.' };
    }

    if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
      const maxMb = Math.round(UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES / (1024 * 1024));
      return { success: false, error: `O tamanho da foto não pode ultrapassar ${maxMb}MB.` };
    }

    const uploaded = await uploadImage({
      file,
      context: 'sell_request',
      uploadRequestId,
    });

    return {
      success: true,
      image: uploaded,
      url: uploaded.publicUrl,
    };
  } catch (err: unknown) {
    console.error('Error uploading public sell request image:', err);
    return {
      success: false,
      error: (err as Error).message || 'Falha ao processar upload da foto.',
    };
  }
}

/**
 * Helper interno para consultar fipeX em segundo plano sem bloquear a submissão se falhar.
 */
async function queryFipeInBackground(payload: SellRequestPayload) {
  if (!payload.model_id) return null;

  try {
    const isZero = payload.year_id === 'zero' || payload.year_model === 0;
    const yearParam = isZero ? 'zero' : String(payload.year_model);

    let fuelId = payload.fuel_id;
    let fuelName = payload.fuel_name;

    // Se fuel_id não estiver definido, buscar detalhe do modelo
    if (!fuelId) {
      try {
        const detailRaw = await fipexFetch<RawApiResponse<RawModelDetail>>(
          `/v1/models/${payload.model_id}`,
          undefined,
          { timeoutMs: 3000, retries: 0 },
        );
        if (detailRaw?.data) {
          const mappedDetail = mapModelDetail(detailRaw.data);
          const yf = mappedDetail.yearFuels.find((y) =>
            isZero ? y.isZeroKm : y.year === payload.year_model,
          );
          if (yf && yf.fuels.length > 0) {
            fuelId = yf.fuels[0].id;
            fuelName = yf.fuels[0].name;
          }
        }
      } catch (detailErr) {
        console.warn('Não foi possível carregar fuel_id do modelo:', detailErr);
      }
    }

    const raw = await fipexFetch<RawApiResponse<RawExpandedPriceData>>(
      '/v1/prices/expanded',
      {
        model_id: payload.model_id,
        year: yearParam,
        fuel_id: fuelId || undefined,
      },
      { timeoutMs: 5000, retries: 0 },
    );

    if (raw && raw.data && raw.data.price) {
      const p = raw.data.price;
      const ref = p.reference;
      const refPeriod = ref ? `${ref.month_name} de ${ref.year}` : null;
      const priceReais = p.price_cents ? Number((p.price_cents / 100).toFixed(2)) : null;

      // Snapshot sanitizado (sem tokens, sem dados sensíveis)
      const sanitizedSnapshot = {
        fipe_code: p.fipe_code || null,
        formatted_price: p.formatted_price || null,
        price_cents: p.price_cents || null,
        price_reais: priceReais,
        model_year: p.model_year ?? null,
        brand: p.make?.name || payload.brand,
        model: p.model?.name || payload.model,
        fuel: p.fuel?.name || fuelName || payload.fuel_name || null,
        reference_period: refPeriod,
        queried_at: new Date().toISOString(),
      };

      return {
        fipeCode: p.fipe_code || null,
        priceReais,
        referencePeriod: refPeriod,
        snapshot: sanitizedSnapshot,
      };
    }
  } catch (err) {
    console.warn(
      'Consulta fipeX em segundo plano não pôde ser concluída:',
      (err as Error)?.message || err,
    );
  }

  return null;
}

export async function createSellRequestAction(data: SellRequestPayload) {
  const supabase = await createClient();
  const requestKind = data.request_kind || 'DIRECT_SALE';
  const isAnnouncement = requestKind === 'ANNOUNCEMENT';

  // Limite rígido de no máximo 5 imagens
  const imagesToSave = (data.images || []).slice(0, 5);

  // Consulta FIPE se não vier provida diretamente pelo formulário
  let effectiveFipePrice = data.fipe_price ?? null;
  let effectiveFipeCode = data.fipe_code ?? null;
  let effectiveFipeRef = data.fipe_reference_period ?? null;
  let effectiveFipeSnapshot = data.fipe_snapshot ?? null;

  if (effectiveFipePrice == null && data.model_id) {
    const fipeResult = await queryFipeInBackground(data);
    if (fipeResult) {
      effectiveFipePrice = fipeResult.priceReais;
      effectiveFipeCode = fipeResult.fipeCode;
      effectiveFipeRef = fipeResult.referencePeriod;
      effectiveFipeSnapshot = fipeResult.snapshot;
    }
  }

  // Recalcular no servidor de forma segura: estimated_offer = fipe_price * offer_percentage / 100
  let calculatedEstimatedOffer: number | null = null;
  if (effectiveFipePrice != null && data.offer_percentage != null) {
    const clampedPercentage = Math.min(Math.max(Number(data.offer_percentage), 0), 100);
    calculatedEstimatedOffer = Number(((effectiveFipePrice * clampedPercentage) / 100).toFixed(2));
  }

  // 0. Resolução/Criação do Cliente Central (CRM)
  let customerId: string | null = null;
  try {
    const custRes = await findOrCreateCustomer(
      supabase,
      {
        full_name: data.name,
        phone: data.phone,
        email: data.email || null,
        cep: data.postal_code || null,
        street: data.address_street || null,
        number: data.address_number || null,
        neighborhood: data.address_neighborhood || null,
        complement: data.address_complement || null,
        city: data.city || null,
        state: 'PE',
      },
      isAnnouncement ? 'website_consignment_request' : 'website_sell_request',
    );
    if (custRes.customer) {
      customerId = custRes.customer.id;
    }
  } catch (custErr) {
    console.warn('Aviso: falha ao vincular cliente no sell_request:', custErr);
  }

  // 1. Gravar em public.sell_requests
  const sellRequestInsertPayload = {
    customer_id: customerId,
    request_kind: requestKind,
    name: data.name.trim(),
    phone: data.phone.replace(/\D/g, ''),
    email: data.email ? data.email.trim() : null,
    license_plate: data.license_plate ? data.license_plate.trim().toUpperCase() : null,
    brand: data.brand.trim(),
    model: data.model.trim(),
    year_manufacture: data.year_manufacture,
    year_model: data.year_model,
    color: data.color ? data.color.trim() : null,
    mileage: data.mileage != null ? data.mileage : null,
    desired_price: data.desired_price != null ? data.desired_price : null,
    offer_percentage: data.offer_percentage != null ? data.offer_percentage : null,
    estimated_offer: calculatedEstimatedOffer,
    status: 'NEW',
    state: 'PE',
    postal_code: data.postal_code?.replace(/\D/g, '') || null,
    address_street: data.address_street?.trim() || null,
    address_number: data.address_number?.trim() || null,
    address_neighborhood: data.address_neighborhood?.trim() || null,
    address_complement: data.address_complement?.trim() || null,
    city: data.city.trim(),
    notes: data.notes ? data.notes.trim() : null,
    motorcycle_data: {
      brand: data.brand,
      brand_id: data.brand_id || null,
      model: data.model,
      model_id: data.model_id || null,
      year_manufacture: data.year_manufacture,
      year_model: data.year_model,
      year_id: data.year_id || null,
      fuel_id: data.fuel_id || null,
      fuel_name: data.fuel_name || null,
      color: data.color || null,
      offer_simulation:
        effectiveFipePrice && data.offer_percentage
          ? {
              fipe_price: effectiveFipePrice,
              percentage: data.offer_percentage,
              estimated_offer: calculatedEstimatedOffer,
              currency: 'BRL',
              calculated_at: new Date().toISOString(),
            }
          : null,
    },
    fipe_provider: effectiveFipePrice != null ? 'fipex' : null,
    fipe_vehicle_type_id: 'motocicletas',
    fipe_brand_id: data.brand_id || null,
    fipe_brand_name: data.brand || null,
    fipe_model_id: data.model_id || null,
    fipe_model_name: data.model || null,
    fipe_year_id: data.year_id || null,
    fipe_year_label: String(data.year_model),
    fipe_fuel_id: data.fuel_id || null,
    fipe_fuel_name: data.fuel_name || null,
    fipe_code: effectiveFipeCode,
    fipe_price: effectiveFipePrice,
    fipe_reference_period: effectiveFipeRef,
    fipe_queried_at: effectiveFipePrice != null ? new Date().toISOString() : null,
    fipe_snapshot: effectiveFipeSnapshot,
  };

  const { data: sellRecord, error: sellError } = await supabase
    .from('sell_requests')
    .insert(sellRequestInsertPayload)
    .select('id')
    .single();

  const sellRequestId = sellRecord?.id;

  if (sellError) {
    console.error('Error saving sell request to sell_requests:', sellError);
  }

  // 2. Gravar imagens em sell_request_images se sell_request_id existir
  if (sellRequestId && imagesToSave.length > 0) {
    const imagesPayload = imagesToSave.map((img, index) => ({
      sell_request_id: sellRequestId,
      public_url: img.url,
      provider: img.provider || 'supabase',
      storage_path: img.storage_path || null,
      delete_url: img.delete_url || null,
      sort_order: index,
    }));

    const { error: imgError } = await supabase.from('sell_request_images').insert(imagesPayload);

    if (imgError) {
      console.warn('Aviso: falha ao persistir imagens em sell_request_images:', imgError);
    }
  }

  // 3. Gravar em leads para visibilidade comercial centralizada
  const leadPayload = {
    customer_id: customerId,
    type: isAnnouncement ? 'CONSIGNMENT' : 'SELL_MOTORCYCLE',
    source: 'WEBSITE',
    name: data.name.trim(),
    phone: data.phone.replace(/\D/g, ''),
    email: data.email ? data.email.trim() : null,
    message:
      data.notes?.trim() ||
      `${isAnnouncement ? 'Solicitação de anúncio' : 'Proposta de venda direta'} da moto ${data.brand} ${data.model} (${data.year_manufacture}/${data.year_model}) enviada pelo site.`,
    metadata: {
      sell_request_id: sellRequestId || null,
      request_kind: requestKind,
      brand: data.brand,
      model: data.model,
      year_manufacture: data.year_manufacture,
      year_model: data.year_model,
      color: data.color || null,
      mileage: data.mileage,
      desired_price: data.desired_price,
      offer_percentage: data.offer_percentage,
      estimated_offer: calculatedEstimatedOffer,
      state: 'PE',
      city: data.city,
      fipe_code: effectiveFipeCode,
      fipe_price: effectiveFipePrice,
      fipe_reference_period: effectiveFipeRef,
      images_count: imagesToSave.length,
      images: imagesToSave.map((i) => i.url),
    },
  };

  const { error: leadError } = await supabase.from('leads').insert(leadPayload);
  if (leadError) {
    console.error('Error creating sell request lead:', leadError);
  }

  if (sellError && leadError) {
    return {
      error: 'Não foi possível enviar os dados agora. Verifique as informações e tente novamente.',
    };
  }

  revalidatePath('/admin/propostas');

  return { success: true, id: sellRequestId };
}

export async function getLeads(): Promise<ProposalViewModel[]> {
  const supabase = await createClient();

  const [leadsRes, rentalRes] = await Promise.all([
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    supabase
      .from('rental_requests')
      .select(
        `
        *,
        motorcycle:motorcycles (
          id,
          slug,
          brand,
          model,
          version,
          year_manufacture,
          year_model,
          mileage,
          color,
          price,
          status,
          motorcycle_images (
            id,
            storage_path,
            is_primary
          )
        )
      `,
      )
      .order('created_at', { ascending: false }),
  ]);

  if (leadsRes.error) {
    console.error('Error fetching leads:', leadsRes.error);
  }

  if (rentalRes.error) {
    console.error('Error fetching rental requests:', rentalRes.error);
  }

  const mappedLeads = (leadsRes.data || []).map(mapLeadToProposal);
  const mappedRentals = (rentalRes.data || []).map(mapRentalRequestToProposal);

  const combined = [...mappedLeads, ...mappedRentals];

  combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return combined;
}

export async function updateLeadStatus(
  id: string,
  status: string,
  source: string = 'lead',
  sourceId: string = '',
) {
  const supabase = await createClient();

  if (source === 'rental_request') {
    let dbStatus = 'PENDING';
    const s = status.toUpperCase();
    if (s === 'CONTACTED') dbStatus = 'CONTACTED';
    else if (s === 'APPROVED' || s === 'CONVERTED' || s === 'QUALIFIED') dbStatus = 'APPROVED';
    else if (s === 'REJECTED' || s === 'LOST' || s === 'CLOSED') dbStatus = 'REJECTED';
    else if (s === 'NEW' || s === 'PENDING') dbStatus = 'PENDING';
    else dbStatus = status;

    const targetId = sourceId || id;
    const { error } = await supabase
      .from('rental_requests')
      .update({ status: dbStatus, updated_at: new Date().toISOString() })
      .eq('id', targetId);

    if (error) {
      console.error('Error updating rental request status:', error);
      return { error: error.message };
    }
  } else {
    // Atualiza sempre a tabela leads como hub central para leads, sell_requests, etc.
    const { error } = await supabase.from('leads').update({ status }).eq('id', id);

    if (error) {
      console.error('Error updating lead status:', error);
      return { error: error.message };
    }

    // Se houver tabelas relacionadas, atualiza o status também
    if (sourceId) {
      if (source === 'sell_request') {
        await supabase.from('sell_requests').update({ status }).eq('id', sourceId);
      } else if (source === 'consignment_request') {
        await supabase.from('consignment_requests').update({ status }).eq('id', sourceId);
      }
    }
  }

  try {
    revalidatePath('/admin/propostas');
  } catch {
    // Ignore in non-rendering contexts
  }

  return { success: true };
}

export interface CreateManualProposalPayload {
  type:
    | 'MOTORCYCLE_INTEREST'
    | 'SELL_MOTORCYCLE'
    | 'CONSIGNMENT'
    | 'RENTAL'
    | 'MOTORCYCLE_REQUEST'
    | 'GENERAL_CONTACT';
  status?: string;
  source?: string;
  name: string;
  phone: string;
  email?: string | null;
  // Full address
  postal_code?: string | null;
  address_street?: string | null;
  address_number?: string | null;
  address_neighborhood?: string | null;
  address_complement?: string | null;
  city?: string | null;
  state?: string | null;
  message?: string | null;
  notes?: string | null;
  // Motorcycle & FIPE details
  brand?: string | null;
  brand_id?: string | null;
  model?: string | null;
  model_id?: string | null;
  version?: string | null;
  year_manufacture?: number | null;
  year_model?: number | null;
  year_id?: string | null;
  fuel_id?: string | null;
  fuel_name?: string | null;
  color?: string | null;
  mileage?: number | null;
  license_plate?: string | null;
  desired_price?: number | null;
  fipe_price?: number | null;
  fipe_code?: string | null;
  fipe_reference_period?: string | null;
  fipe_snapshot?: Record<string, unknown> | null;
  // Rental details
  rental_desired_plan?: string | null;
  rental_expected_start_date?: string | null;
  rental_has_cnh_a?: string | null;
  rental_age?: number | null;
  // Images
  images?: Array<{
    url: string;
    provider?: string;
    altText?: string;
    storage_path?: string | null;
    delete_url?: string | null;
    isPrimary?: boolean;
  }>;
}

export async function createManualProposalAction(data: CreateManualProposalPayload) {
  const supabase = await createClient();

  if (!data.name || !data.name.trim()) {
    return { error: 'O nome do cliente é obrigatório.' };
  }

  if (!data.phone || !data.phone.trim()) {
    return { error: 'O telefone/WhatsApp do cliente é obrigatório.' };
  }

  const rawPhone = data.phone.replace(/\D/g, '');
  if (rawPhone.length < 10) {
    return { error: 'Informe um telefone/WhatsApp válido com DDD (mínimo 10 dígitos).' };
  }

  const cleanSource = data.source || 'MANUAL';
  const cleanStatus = data.status || 'NEW';
  const isSellOrConsignment = data.type === 'SELL_MOTORCYCLE' || data.type === 'CONSIGNMENT';
  const isAnnouncement = data.type === 'CONSIGNMENT';

  // Tratar imagens: se nenhuma foto foi enviada, injetar a logo padrão da loja como fallback
  let imagesToSave = (data.images || []).filter((img) => Boolean(img && img.url));
  if (imagesToSave.length === 0) {
    imagesToSave = [
      {
        url: '/logo.png',
        altText: 'Logo AF Motos (Imagem Padrão)',
        provider: 'system',
        storage_path: null,
        delete_url: null,
        isPrimary: true,
      },
    ];
  }

  // 1. Vincular ou criar cliente no CRM central com endereço completo
  let customerId: string | null = null;
  try {
    const custRes = await findOrCreateCustomer(
      supabase,
      {
        full_name: data.name.trim(),
        phone: rawPhone,
        email: data.email ? data.email.trim() : null,
        cep: data.postal_code?.replace(/\D/g, '') || null,
        street: data.address_street?.trim() || null,
        number: data.address_number?.trim() || null,
        neighborhood: data.address_neighborhood?.trim() || null,
        complement: data.address_complement?.trim() || null,
        city: data.city ? data.city.trim() : null,
        state: data.state ? data.state.trim() : 'PE',
      },
      'admin_proposal',
    );
    if (custRes?.customer) {
      customerId = custRes.customer.id;
    }
  } catch (custErr) {
    console.warn('Aviso: falha ao vincular cliente central na proposta manual:', custErr);
  }

  // 2. Se for venda ou consignação, criar registro em sell_requests para suporte a contratos e comissões
  let sellRequestId: string | null = null;
  if (isSellOrConsignment) {
    try {
      const sellRequestPayload = {
        customer_id: customerId,
        request_kind: isAnnouncement ? 'ANNOUNCEMENT' : 'DIRECT_SALE',
        name: data.name.trim(),
        phone: rawPhone,
        email: data.email ? data.email.trim() : null,
        license_plate: data.license_plate ? data.license_plate.trim().toUpperCase() : null,
        brand: data.brand ? data.brand.trim() : 'Não informada',
        model: data.model ? data.model.trim() : 'Não informado',
        year_manufacture: data.year_manufacture || null,
        year_model: data.year_model || data.year_manufacture || null,
        color: data.color ? data.color.trim() : null,
        mileage: data.mileage != null ? Number(data.mileage) : null,
        desired_price: data.desired_price != null ? Number(data.desired_price) : null,
        fipe_price: data.fipe_price != null ? Number(data.fipe_price) : null,
        fipe_code: data.fipe_code || null,
        fipe_reference_period: data.fipe_reference_period || null,
        fipe_snapshot: data.fipe_snapshot || null,
        status: cleanStatus,
        postal_code: data.postal_code?.replace(/\D/g, '') || null,
        address_street: data.address_street?.trim() || null,
        address_number: data.address_number?.trim() || null,
        address_neighborhood: data.address_neighborhood?.trim() || null,
        address_complement: data.address_complement?.trim() || null,
        state: data.state ? data.state.trim() : 'PE',
        city: data.city ? data.city.trim() : 'Recife',
        notes: data.notes ? data.notes.trim() : data.message ? data.message.trim() : null,
        motorcycle_data: {
          brand: data.brand || null,
          brand_id: data.brand_id || null,
          model: data.model || null,
          model_id: data.model_id || null,
          version: data.version || null,
          year_manufacture: data.year_manufacture || null,
          year_model: data.year_model || null,
          year_id: data.year_id || null,
          fuel_id: data.fuel_id || null,
          fuel_name: data.fuel_name || null,
          color: data.color || null,
          license_plate: data.license_plate || null,
        },
      };

      const { data: sellRecord, error: sellError } = await supabase
        .from('sell_requests')
        .insert(sellRequestPayload)
        .select('id')
        .single();

      if (!sellError && sellRecord) {
        sellRequestId = sellRecord.id;

        // Salvar imagens na tabela sell_request_images se houver
        if (imagesToSave.length > 0) {
          const imagesInsert = imagesToSave.map((img, idx) => ({
            sell_request_id: sellRecord.id,
            public_url: img.url,
            provider: img.provider || 'supabase',
            storage_path: img.storage_path || null,
            delete_url: img.delete_url || null,
            sort_order: idx,
          }));
          await supabase.from('sell_request_images').insert(imagesInsert);
        }
      } else {
        console.warn('Aviso ao gravar sell_request para proposta manual:', sellError);
      }
    } catch (sellErr) {
      console.warn('Erro ao processar sell_request na proposta manual:', sellErr);
    }
  }

  // 3. Persistir na tabela leads
  const mappedImages = imagesToSave.map((img, idx) => ({
    id: String(idx),
    url: img.url,
    thumbnailUrl: img.url,
    altText: img.altText || `Foto ${idx + 1}`,
    provider: img.provider || 'supabase',
    sortOrder: idx,
    isPrimary: img.isPrimary ?? idx === 0,
  }));

  const leadMetadata = {
    sell_request_id: sellRequestId,
    source: cleanSource,
    brand: data.brand ? data.brand.trim() : null,
    brand_id: data.brand_id || null,
    model: data.model ? data.model.trim() : null,
    model_id: data.model_id || null,
    version: data.version ? data.version.trim() : null,
    year_manufacture: data.year_manufacture || null,
    year_model: data.year_model || null,
    year_id: data.year_id || null,
    fuel_id: data.fuel_id || null,
    fuel_name: data.fuel_name || null,
    year: data.year_model || data.year_manufacture || null,
    color: data.color ? data.color.trim() : null,
    mileage: data.mileage != null ? Number(data.mileage) : null,
    license_plate: data.license_plate ? data.license_plate.trim().toUpperCase() : null,
    desired_price: data.desired_price != null ? Number(data.desired_price) : null,
    fipe_price: data.fipe_price != null ? Number(data.fipe_price) : null,
    fipe_code: data.fipe_code || null,
    fipe_reference_period: data.fipe_reference_period || null,
    fipe_snapshot: data.fipe_snapshot || null,
    postal_code: data.postal_code?.replace(/\D/g, '') || null,
    address_street: data.address_street?.trim() || null,
    address_number: data.address_number?.trim() || null,
    address_neighborhood: data.address_neighborhood?.trim() || null,
    address_complement: data.address_complement?.trim() || null,
    city: data.city ? data.city.trim() : null,
    state: data.state ? data.state.trim() : 'PE',
    notes: data.notes ? data.notes.trim() : null,
    images: mappedImages,
    photos: mappedImages.map((i) => i.url),
    // Rental fields
    desired_plan: data.rental_desired_plan || null,
    expected_start_date: data.rental_expected_start_date || null,
    has_cnh_a: data.rental_has_cnh_a || null,
    age: data.rental_age || null,
  };

  const defaultMsg =
    data.message?.trim() ||
    (data.brand && data.model
      ? `Proposta manual de ${data.type === 'SELL_MOTORCYCLE' ? 'venda' : data.type === 'CONSIGNMENT' ? 'anúncio' : 'interesse'} para ${data.brand} ${data.model} (Origem: ${cleanSource}).`
      : `Contato manual registrado via ${cleanSource}.`);

  const leadInsertPayload = {
    customer_id: customerId,
    type: data.type,
    source: cleanSource,
    status: cleanStatus,
    name: data.name.trim(),
    phone: rawPhone,
    email: data.email ? data.email.trim() : null,
    message: defaultMsg,
    metadata: leadMetadata,
  };

  const { data: leadRecord, error: leadError } = await supabase
    .from('leads')
    .insert(leadInsertPayload)
    .select('id')
    .single();

  if (leadError) {
    console.error('Error inserting manual proposal lead:', leadError);
    return { error: 'Não foi possível cadastrar a proposta. Tente novamente.' };
  }

  try {
    revalidatePath('/admin/propostas');
    revalidatePath('/admin/clientes');
    revalidatePath('/admin');
  } catch (revalErr) {
    console.warn('Revalidation notice:', revalErr);
  }

  return {
    success: true,
    id: leadRecord?.id,
    sellRequestId,
  };
}
