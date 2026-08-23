'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { saleSchema, SaleFormValues } from '@/lib/validations/sale';
import { getNextSequentialReceiptNumber } from '@/lib/queries/sales';

export async function createSaleAction(rawData: SaleFormValues) {
  const supabase = await createClient();

  const parsed = saleSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      error: parsed.error.issues.map((i) => i.message).join(', '),
    };
  }

  const data = parsed.data;
  // Use sequential receipt number
  const receiptNumber = data.receipt_number?.trim() || (await getNextSequentialReceiptNumber());

  const salePayload = {
    motorcycle_id: data.motorcycle_id,
    sale_price: data.sale_price,
    sale_date: data.sale_date,
    buyer_name: data.buyer_name?.trim() || null,
    buyer_phone: data.buyer_phone?.trim() || null,
    buyer_email: data.buyer_email?.trim() || null,
    buyer_document: data.buyer_document?.trim() || null,
    buyer_address: data.buyer_address?.trim() || null,
    payment_method: data.payment_method,
    payment_status: data.payment_status,
    amount_paid: data.amount_paid ?? data.sale_price,
    receipt_number: receiptNumber,
    receipt_notes: data.receipt_notes?.trim() || null,
    notes: data.notes?.trim() || null,
  };

  // 1. Insert sale record
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

  // 2. Update motorcycle status to SOLD
  const { error: motoError } = await supabase
    .from('motorcycles')
    .update({ status: 'SOLD' })
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

  const { data: updatedSale, error } = await supabase
    .from('sales')
    .update({
      ...rawData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id, motorcycle_id')
    .single();

  if (error) {
    console.error('Error updating sale:', error);
    return { error: 'Não foi possível atualizar os dados da venda.' };
  }

  revalidatePath('/admin/vendas');
  revalidatePath('/admin');
  if (updatedSale?.motorcycle_id) {
    revalidatePath(`/admin/motos/${updatedSale.motorcycle_id}/editar`);
  }

  return { success: true, id };
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
