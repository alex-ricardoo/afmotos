'use server';

import { createClient } from '@/lib/supabase/server';
import { uploadImage } from '@/lib/uploads';

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
  metadata?: any;
}

export async function createLeadAction(data: CreateLeadPayload) {
  const supabase = await createClient();

  const { error } = await supabase.from('leads').insert(data);

  if (error) {
    console.error('Error creating lead:', error);
    return { error: 'Não foi possível salvar o contato. Tente novamente.' };
  }

  return { success: true };
}

export interface SellRequestPayload {
  name: string;
  phone: string;
  email?: string;
  brand: string;
  model: string;
  year_manufacture: number;
  year_model: number;
  mileage?: number;
  desired_price?: number;
  notes?: string;
  images?: string[];
}

/**
 * Server action to upload an image from public announcement/sell form.
 * Uses centralized uploadImage orchestrator (ImgBB with Supabase Storage fallback).
 */
export async function uploadPublicSellRequestImageAction(
  formData: FormData,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const file = formData.get('file') as File | null;
    if (!file || !(file instanceof File) || file.size === 0) {
      return { success: false, error: 'Nenhum arquivo de imagem válido enviado.' };
    }

    const uploaded = await uploadImage({
      file,
      context: 'sell_request',
    });

    return {
      success: true,
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

export async function createSellRequestAction(data: SellRequestPayload) {
  const supabase = await createClient();

  // 1. Gravar em leads para visibilidade comercial centralizada
  const leadPayload = {
    type: 'SELL_MOTORCYCLE',
    name: data.name,
    phone: data.phone,
    email: data.email,
    message: data.notes,
    metadata: {
      brand: data.brand,
      model: data.model,
      year_manufacture: data.year_manufacture,
      year_model: data.year_model,
      mileage: data.mileage,
      desired_price: data.desired_price,
      images_count: data.images?.length || 0,
      images: data.images || [],
    },
  };

  const { error: leadError } = await supabase.from('leads').insert(leadPayload);
  if (leadError) {
    console.error('Error creating sell request lead:', leadError);
  }

  // 2. Gravar em sell_requests se a tabela aceitar
  const { error: sellError } = await supabase.from('sell_requests').insert({
    name: data.name,
    phone: data.phone,
    email: data.email,
    brand: data.brand,
    model: data.model,
    year_manufacture: data.year_manufacture,
    year_model: data.year_model,
    mileage: data.mileage,
    desired_price: data.desired_price,
    notes: data.notes,
  });

  if (sellError && leadError) {
    console.error('Error saving sell request:', sellError);
    return { error: 'Não foi possível enviar os dados agora. Tente novamente.' };
  }

  return { success: true };
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
