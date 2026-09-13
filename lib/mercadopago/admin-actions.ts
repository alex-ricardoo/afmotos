'use server';

import { createClient } from '@/lib/supabase/server';
import { reconcilePaymentTransaction, type ReconciliationResult } from './reconciliation-service';
import { revalidatePath } from 'next/cache';

/**
 * Server Action administrativa para disparar a reconciliação segura de uma transação.
 */
export async function triggerPaymentReconciliation(
  transactionId: string,
): Promise<{ success: boolean; message: string; result?: ReconciliationResult }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: 'Usuário não autenticado.' };
    }

    // Valida se o usuário é administrador ativo
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('id, is_active')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!adminProfile) {
      return { success: false, message: 'Acesso negado: privilégios administrativos requeridos.' };
    }

    const outcome = await reconcilePaymentTransaction(transactionId, user.id);

    revalidatePath(`/admin/consulta-placa`);
    revalidatePath(`/cliente/pagamento/retorno/${transactionId}`);

    return {
      success: outcome.success,
      message: outcome.message,
      result: outcome,
    };
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Erro interno';
    return { success: false, message: `Falha na reconciliação: ${errMsg}` };
  }
}
