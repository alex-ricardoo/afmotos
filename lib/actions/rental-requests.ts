'use server';

import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { findOrCreateCustomer } from '@/lib/domain/customer-dedup';

const rentalRequestSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  phone: z.string().min(10, 'Telefone é obrigatório'),
  age: z.coerce.number().min(18, 'É necessário ter pelo menos 18 anos'),
  has_cnh_a: z.enum(['Sim', 'Provisória', 'Não']),
  purpose_of_use: z.string().min(1, 'Finalidade de uso é obrigatória'),
  motorcycle_id: z.string().uuid().optional().or(z.literal('')),
  desired_plan: z.string().min(1, 'Plano desejado é obrigatório'),
  expected_start_date: z.string().min(1, 'Data prevista de início é obrigatória'),
});

type RentalRequestValues = z.infer<typeof rentalRequestSchema>;

export async function createRentalRequestAction(data: RentalRequestValues) {
  try {
    const validatedData = rentalRequestSchema.parse(data);

    const supabase = await createClient();

    // 0. Vincular ou criar cliente central
    let customerId: string | null = null;
    try {
      const custRes = await findOrCreateCustomer(
        supabase,
        {
          full_name: validatedData.name,
          phone: validatedData.phone,
        },
        'rental_registration',
      );
      if (custRes.customer) {
        customerId = custRes.customer.id;
      }
    } catch (custErr) {
      console.warn('Aviso: falha ao vincular cliente na locação:', custErr);
    }

    const { data: result, error } = await supabase
      .from('rental_requests')
      .insert({
        customer_id: customerId,
        name: validatedData.name,
        phone: validatedData.phone,
        age: validatedData.age,
        has_cnh_a: validatedData.has_cnh_a,
        purpose_of_use: validatedData.purpose_of_use,
        motorcycle_id: validatedData.motorcycle_id || null,
        desired_plan: validatedData.desired_plan,
        expected_start_date: validatedData.expected_start_date,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating rental request:', error);
      return { error: 'Ocorreu um erro ao enviar sua solicitação. Tente novamente.' };
    }

    revalidatePath('/admin/propostas');
    return { success: true, id: result.id, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues?.[0];
      return { error: firstIssue?.message || 'Dados de formulário inválidos.' };
    }
    return { error: 'Erro inesperado ao enviar solicitação.' };
  }
}
