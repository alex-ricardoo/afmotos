'use server';

import { createClient } from '@/lib/supabase/server';
import { uploadImage } from '@/lib/uploads';
import { UploadedImage } from '@/lib/uploads/types';
import { fipexFetch } from '@/lib/fipex/client';
import { RawApiResponse, RawExpandedPriceData, RawModelDetail } from '@/lib/fipex/types';
import { mapModelDetail } from '@/lib/fipex/mappers';

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

  const payload = {
    ...data,
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
  name: string;
  phone: string;
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
  state?: string;
  city: string;
  notes?: string | null;
  images?: SellRequestImageItem[];
}

/**
 * Server action to upload an image from public announcement/sell form.
 * Uses centralized uploadImage orchestrator (ImgBB with Supabase Storage fallback).
 */
export async function uploadPublicSellRequestImageAction(
  formData: FormData,
): Promise<{ success: boolean; image?: UploadedImage; url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File | null;
    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: 'Nenhum arquivo de imagem válido enviado.' };
    }

    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'O tamanho da foto não pode ultrapassar 5MB.' };
    }

    const uploaded = await uploadImage({
      file,
      context: 'sell_request',
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

  // Limite rígido de no máximo 5 imagens
  const imagesToSave = (data.images || []).slice(0, 5);

  // Consulta FIPE em segundo plano (se houver dados suficientes)
  const fipeResult = await queryFipeInBackground(data);

  // 1. Gravar em public.sell_requests
  const sellRequestInsertPayload = {
    name: data.name.trim(),
    phone: data.phone.replace(/\D/g, ''),
    license_plate: null,
    brand: data.brand.trim(),
    model: data.model.trim(),
    year_manufacture: data.year_manufacture,
    year_model: data.year_model,
    mileage: data.mileage != null ? data.mileage : null,
    desired_price: data.desired_price != null ? data.desired_price : null,
    state: 'PE',
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
    },
    fipe_provider: fipeResult ? 'fipex' : null,
    fipe_vehicle_type_id: 'motocicletas',
    fipe_brand_id: data.brand_id || null,
    fipe_brand_name: data.brand || null,
    fipe_model_id: data.model_id || null,
    fipe_model_name: data.model || null,
    fipe_year_id: data.year_id || null,
    fipe_year_label: String(data.year_model),
    fipe_fuel_id: data.fuel_id || null,
    fipe_fuel_name: data.fuel_name || null,
    fipe_code: fipeResult?.fipeCode || null,
    fipe_price: fipeResult?.priceReais || null,
    fipe_reference_period: fipeResult?.referencePeriod || null,
    fipe_queried_at: fipeResult ? new Date().toISOString() : null,
    fipe_snapshot: fipeResult?.snapshot || null,
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
    type: 'SELL_MOTORCYCLE',
    source: 'WEBSITE',
    name: data.name.trim(),
    phone: data.phone.replace(/\D/g, ''),
    message:
      data.notes?.trim() ||
      `Proposta de anúncio da moto ${data.brand} ${data.model} (${data.year_manufacture}/${data.year_model}) enviada pelo site.`,
    metadata: {
      sell_request_id: sellRequestId || null,
      brand: data.brand,
      model: data.model,
      year_manufacture: data.year_manufacture,
      year_model: data.year_model,
      mileage: data.mileage,
      desired_price: data.desired_price,
      state: 'PE',
      city: data.city,
      fipe_code: fipeResult?.fipeCode || null,
      fipe_price: fipeResult?.priceReais || null,
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

  return { success: true, id: sellRequestId };
}

export async function getLeads() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching leads:', error);
    return [];
  }

  return data;
}

export async function updateLeadStatus(id: string, status: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('leads').update({ status }).eq('id', id);

  if (error) {
    console.error('Error updating lead status:', error);
    return { error: error.message };
  }

  return { success: true };
}
