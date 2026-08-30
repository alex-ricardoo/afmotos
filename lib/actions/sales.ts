'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { saleSchema, SaleFormValues } from '@/lib/validations/sale';
import { getNextSequentialReceiptNumber } from '@/lib/queries/sales';
import { findOrCreateCustomer } from '@/lib/domain/customer-dedup';
import {
  normalizePhone,
  normalizeEmail,
  cleanNumeric,
} from '@/lib/utils/customer-normalizers';
import { formatCpf } from '@/lib/utils/formatters';

export async function createSaleAction(rawData: SaleFormValues) {
  const supabase = await createClient();

  const parsed = saleSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join(', '),
    };
  }

  const data = parsed.data;
  // Gerar número sequencial oficial
  const receiptNumber = data.receipt_number?.trim() || (await getNextSequentialReceiptNumber());

  // Formatar endereço completo unificado para compatibilidade
  const addressParts = [
    data.buyer_street?.trim(),
    data.buyer_number?.trim() ? `nº ${data.buyer_number.trim()}` : null,
    data.buyer_complement?.trim(),
    data.buyer_neighborhood?.trim(),
    data.buyer_city?.trim() ? `${data.buyer_city.trim()}${data.buyer_state ? `/${data.buyer_state.trim()}` : ''}` : null,
    data.buyer_cep?.trim() ? `CEP ${data.buyer_cep.trim()}` : null,
  ].filter(Boolean);

  const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : data.buyer_address?.trim() || null;

  // 0. Resolução/Criação do Cliente Central (CRM)
  let effectiveCustomerId = data.customer_id || null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!effectiveCustomerId && data.buyer_name && data.buyer_phone) {
    try {
      const custRes = await findOrCreateCustomer(
        supabase,
        {
          full_name: data.buyer_name,
          phone: data.buyer_phone,
          email: data.buyer_email || null,
          cpf: data.buyer_document || null,
          cep: data.buyer_cep || null,
          street: data.buyer_street || null,
          number: data.buyer_number || null,
          complement: data.buyer_complement || null,
          neighborhood: data.buyer_neighborhood || null,
          city: data.buyer_city || null,
          state: data.buyer_state || null,
        },
        'sale_registration',
        user?.id,
      );

      if (custRes.customer) {
        effectiveCustomerId = custRes.customer.id;
      }
    } catch (custErr) {
      console.warn('Não foi possível vincular cliente central na venda:', custErr);
    }
  } else if (effectiveCustomerId) {
    // Atualização e enriquecimento automático do cadastro do cliente a partir da venda
    try {
      const patchData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (user?.id) patchData.updated_by = user.id;

      if (data.buyer_name?.trim()) patchData.full_name = data.buyer_name.trim();
      if (data.buyer_phone?.trim()) {
        patchData.phone = data.buyer_phone.trim();
        patchData.phone_normalized = normalizePhone(data.buyer_phone);
      }
      if (data.buyer_email?.trim()) {
        patchData.email = data.buyer_email.trim();
        patchData.email_normalized = normalizeEmail(data.buyer_email);
      }
      if (data.buyer_document?.trim()) {
        const cpfDigits = cleanNumeric(data.buyer_document);
        patchData.cpf = formatCpf(cpfDigits);
        patchData.cpf_normalized = cpfDigits;
      }
      if (data.buyer_cep?.trim()) patchData.cep = data.buyer_cep.trim();
      if (data.buyer_street?.trim()) patchData.street = data.buyer_street.trim();
      if (data.buyer_number?.trim()) patchData.number = data.buyer_number.trim();
      if (data.buyer_complement?.trim()) patchData.complement = data.buyer_complement.trim();
      if (data.buyer_neighborhood?.trim()) patchData.neighborhood = data.buyer_neighborhood.trim();
      if (data.buyer_city?.trim()) patchData.city = data.buyer_city.trim();
      if (data.buyer_state?.trim()) patchData.state = data.buyer_state.trim().toUpperCase().slice(0, 2);

      const { error: custUpdError } = await supabase
        .from('customers')
        .update(patchData)
        .eq('id', effectiveCustomerId);

      if (custUpdError) {
        console.error('Erro ao atualizar cliente na venda:', custUpdError);
      } else {
        revalidatePath('/admin/clientes');
        revalidatePath(`/admin/clientes/${effectiveCustomerId}`);
        revalidatePath(`/admin/clientes/${effectiveCustomerId}/editar`);
      }
    } catch (updErr) {
      console.warn('Erro ao enriquecer perfil do cliente a partir da venda:', updErr);
    }
  }

  const salePayload = {
    customer_id: effectiveCustomerId,
    motorcycle_id: data.motorcycle_id,
    sale_price: data.sale_price,
    sale_date: data.sale_date,
    buyer_name: data.buyer_name?.trim() || null,
    buyer_phone: data.buyer_phone?.trim() || null,
    buyer_email: data.buyer_email?.trim() || null,
    buyer_document: data.buyer_document?.trim() || null,
    buyer_address: formattedAddress,
    buyer_cep: data.buyer_cep?.trim() || null,
    buyer_street: data.buyer_street?.trim() || null,
    buyer_number: data.buyer_number?.trim() || null,
    buyer_complement: data.buyer_complement?.trim() || null,
    buyer_neighborhood: data.buyer_neighborhood?.trim() || null,
    buyer_city: data.buyer_city?.trim() || null,
    buyer_state: data.buyer_state?.trim() ? data.buyer_state.trim().toUpperCase().slice(0, 2) : null,
    payment_method: data.payment_method,
    payment_status: data.payment_status,
    amount_paid: data.amount_paid ?? data.sale_price,
    entry_amount: data.entry_amount ?? 0,
    financed_amount: data.financed_amount ?? 0,
    trade_amount: data.trade_amount ?? 0,
    delivery_km: data.delivery_km ?? null,
    renavam: data.renavam?.trim() || null,
    chassi: data.chassi?.trim() ? data.chassi.trim().toUpperCase() : null,
    legal_terms_accepted: data.legal_terms_accepted ?? true,
    receipt_number: receiptNumber,
    receipt_notes: data.receipt_notes?.trim() || null,
    notes: data.notes?.trim() || null,
  };

  // 1. Inserir registro na tabela sales
  const { data: insertedSale, error: saleError } = await supabase
    .from('sales')
    .insert(salePayload)
    .select('id, receipt_number')
    .single();

  if (saleError || !insertedSale) {
    console.error('Error inserting sale:', saleError);
    return {
      error: 'Não foi possível registrar a venda. Verifique os dados e tente novamente.',
    };
  }

  // 2. Atualizar status e dados veiculares da motocicleta
  const motoUpdatePayload: Record<string, any> = { status: 'SOLD' };
  if (data.renavam?.trim()) {
    motoUpdatePayload.renavam = data.renavam.trim();
  }
  if (data.chassi?.trim()) {
    motoUpdatePayload.chassi = data.chassi.trim().toUpperCase();
  }
  if (data.delivery_km !== null && data.delivery_km !== undefined) {
    motoUpdatePayload.mileage = data.delivery_km;
  }

  const { error: motoError } = await supabase
    .from('motorcycles')
    .update(motoUpdatePayload)
    .eq('id', data.motorcycle_id);

  if (motoError) {
    console.error('Error updating motorcycle status to SOLD:', motoError);
  }

  revalidatePath('/admin/vendas');
  revalidatePath('/admin/motos');
  revalidatePath('/admin');
  revalidatePath('/motos');
  revalidatePath(`/admin/motos/${data.motorcycle_id}/editar`);

  return {
    success: true,
    id: insertedSale.id,
    receiptNumber: insertedSale.receipt_number,
  };
}

export async function updateSaleAction(id: string, rawData: Partial<SaleFormValues>) {
  const supabase = await createClient();

  const addressParts = [
    rawData.buyer_street?.trim(),
    rawData.buyer_number?.trim() ? `nº ${rawData.buyer_number.trim()}` : null,
    rawData.buyer_complement?.trim(),
    rawData.buyer_neighborhood?.trim(),
    rawData.buyer_city?.trim() ? `${rawData.buyer_city.trim()}${rawData.buyer_state ? `/${rawData.buyer_state.trim()}` : ''}` : null,
    rawData.buyer_cep?.trim() ? `CEP ${rawData.buyer_cep.trim()}` : null,
  ].filter(Boolean);

  const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : rawData.buyer_address?.trim() || null;

  const updateData: Record<string, any> = {
    ...rawData,
    buyer_address: formattedAddress,
    updated_at: new Date().toISOString(),
  };

  if (rawData.chassi) {
    updateData.chassi = rawData.chassi.trim().toUpperCase();
  }
  if (rawData.renavam) {
    updateData.renavam = rawData.renavam.trim();
  }

  const { data: updatedSale, error } = await supabase
    .from('sales')
    .update(updateData)
    .eq('id', id)
    .select('id, motorcycle_id, receipt_number')
    .single();

  if (error) {
    console.error('Error updating sale:', error);
    return { error: 'Não foi possível atualizar os dados da venda.' };
  }

  // Sincronizar dados cadastrais do cliente se vinculado
  if (rawData.customer_id) {
    try {
      const patchData: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (rawData.buyer_name?.trim()) patchData.full_name = rawData.buyer_name.trim();
      if (rawData.buyer_phone?.trim()) {
        patchData.phone = rawData.buyer_phone.trim();
        patchData.phone_normalized = normalizePhone(rawData.buyer_phone);
      }
      if (rawData.buyer_email?.trim()) {
        patchData.email = rawData.buyer_email.trim();
        patchData.email_normalized = normalizeEmail(rawData.buyer_email);
      }
      if (rawData.buyer_document?.trim()) {
        const cpfDigits = cleanNumeric(rawData.buyer_document);
        patchData.cpf = formatCpf(cpfDigits);
        patchData.cpf_normalized = cpfDigits;
      }
      if (rawData.buyer_cep?.trim()) patchData.cep = rawData.buyer_cep.trim();
      if (rawData.buyer_street?.trim()) patchData.street = rawData.buyer_street.trim();
      if (rawData.buyer_number?.trim()) patchData.number = rawData.buyer_number.trim();
      if (rawData.buyer_complement?.trim()) patchData.complement = rawData.buyer_complement.trim();
      if (rawData.buyer_neighborhood?.trim()) patchData.neighborhood = rawData.buyer_neighborhood.trim();
      if (rawData.buyer_city?.trim()) patchData.city = rawData.buyer_city.trim();
      if (rawData.buyer_state?.trim()) patchData.state = rawData.buyer_state.trim().toUpperCase().slice(0, 2);

      await supabase.from('customers').update(patchData).eq('id', rawData.customer_id);
      revalidatePath('/admin/clientes');
      revalidatePath(`/admin/clientes/${rawData.customer_id}`);
    } catch (custErr) {
      console.warn('Erro ao sincronizar cliente na atualização da venda:', custErr);
    }
  }

  // Sincronizar dados veiculares caso alterados
  if (updatedSale?.motorcycle_id) {
    const motoUpdate: Record<string, any> = {};
    if (rawData.renavam) motoUpdate.renavam = rawData.renavam.trim();
    if (rawData.chassi) motoUpdate.chassi = rawData.chassi.trim().toUpperCase();
    if (rawData.delivery_km !== undefined && rawData.delivery_km !== null) {
      motoUpdate.mileage = rawData.delivery_km;
    }

    if (Object.keys(motoUpdate).length > 0) {
      await supabase.from('motorcycles').update(motoUpdate).eq('id', updatedSale.motorcycle_id);
    }
    revalidatePath(`/admin/motos/${updatedSale.motorcycle_id}/editar`);
  }

  revalidatePath('/admin/vendas');
  revalidatePath(`/admin/vendas/${id}/recibo`);
  revalidatePath(`/admin/vendas/${id}/editar`);
  revalidatePath('/admin');
  revalidatePath('/admin/motos');

  return { success: true, id, receiptNumber: updatedSale.receipt_number };
}

export async function deleteSaleAction(id: string, motorcycleId?: string, revertMotoStatus = true) {
  const supabase = await createClient();

  const { error } = await supabase.from('sales').delete().eq('id', id);

  if (error) {
    console.error('Error deleting sale:', error);
    return { error: 'Não foi possível excluir o registro de venda.' };
  }

  if (motorcycleId && revertMotoStatus) {
    await supabase.from('motorcycles').update({ status: 'AVAILABLE' }).eq('id', motorcycleId);
  }

  revalidatePath('/admin/vendas');
  revalidatePath('/admin/motos');
  revalidatePath('/admin');
  revalidatePath('/motos');

  return { success: true };
}
