'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  saveCommissionSchema,
  confirmCommissionSchema,
  receiveCommissionSchema,
  cancelCommissionSchema,
  SaveCommissionInput,
  ConfirmCommissionInput,
  ReceiveCommissionInput,
  CancelCommissionInput,
} from '@/lib/validations/commission';
import {
  calculateCommission,
  canTransitionCommissionStatus,
  isProposalSuccessful,
  isProposalCancelled,
} from '@/lib/domain/commission-rules';
import {
  CommissionStatus,
  ProposalCommissionRecord,
  ProposalCommissionAuditLogRecord,
} from '@/types/commission';

async function checkAdminUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Acesso não autorizado. Faça login novamente.');
  }

  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('role, is_active')
    .eq('auth_user_id', user.id)
    .maybeSingle();

  if (adminProfile && adminProfile.is_active === false) {
    throw new Error('Usuário inativo. Contate o administrador do sistema.');
  }

  return user;
}

export async function getCommissionByProposalId(
  proposalId: string,
): Promise<{
  success: boolean;
  commission?: ProposalCommissionRecord | null;
  agreementUrl?: string | null;
  agreementOwnerData?: { owner_cpf?: string; owner_rg?: string } | null;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('proposal_commissions')
      .select('*')
      .eq('proposal_id', proposalId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching commission for proposal:', error);
      return { success: false, error: 'Erro ao buscar comissão da proposta.' };
    }

    let agreementUrl: string | null = null;
    let agreementOwnerData: { owner_cpf?: string; owner_rg?: string } | null = null;

    if (data?.sale_agreement_id) {
      const { data: agreement } = await supabase
        .from('sale_agreements')
        .select('pdf_url, owner_cpf, owner_rg')
        .eq('id', data.sale_agreement_id)
        .maybeSingle();

      if (agreement) {
        agreementOwnerData = {
          owner_cpf: agreement.owner_cpf,
          owner_rg: agreement.owner_rg,
        };
        if (agreement.pdf_url) {
          const { data: signed } = await supabase.storage
            .from('agreements')
            .createSignedUrl(agreement.pdf_url, 60 * 60);
          agreementUrl = signed?.signedUrl || null;
        }
      }
    } else if (data?.sell_request_id) {
      const { data: agreement } = await supabase
        .from('sale_agreements')
        .select('id, pdf_url, owner_cpf, owner_rg')
        .eq('sell_request_id', data.sell_request_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (agreement) {
        agreementOwnerData = {
          owner_cpf: agreement.owner_cpf,
          owner_rg: agreement.owner_rg,
        };
        if (agreement.pdf_url) {
          const { data: signed } = await supabase.storage
            .from('agreements')
            .createSignedUrl(agreement.pdf_url, 60 * 60);
          agreementUrl = signed?.signedUrl || null;
        }
      }
    }

    return {
      success: true,
      commission: data,
      agreementUrl,
      agreementOwnerData,
    };
  } catch (err: unknown) {
    console.error('Unexpected error fetching commission:', err);
    return { success: false, error: (err as Error)?.message || 'Erro inesperado.' };
  }
}

export async function getCommissionAuditLogsAction(
  commissionId: string,
): Promise<{ success: boolean; logs?: ProposalCommissionAuditLogRecord[]; error?: string }> {
  try {
    const supabase = await createClient();
    await checkAdminUser(supabase);

    const { data, error } = await supabase
      .from('proposal_commission_audit_logs')
      .select('*')
      .eq('commission_id', commissionId)
      .order('changed_at', { ascending: false });

    if (error) {
      console.error('Error fetching commission audit logs:', error);
      return { success: false, error: 'Erro ao buscar histórico de alterações.' };
    }

    return { success: true, logs: data || [] };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Erro ao carregar auditoria.' };
  }
}

export async function saveOrUpdateCommissionAction(
  rawData: SaveCommissionInput,
): Promise<{ success: boolean; commission?: ProposalCommissionRecord; error?: string }> {
  try {
    const supabase = await createClient();
    const user = await checkAdminUser(supabase);

    const parsed = saveCommissionSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(', ') };
    }

    const data = parsed.data;
    const expectedValue = calculateCommission(
      data.commission_type,
      data.commission_percentage,
      data.commission_fixed_value,
      data.expected_sale_value,
    );

    // Buscar comissão existente se houver
    let existingCommission: ProposalCommissionRecord | null = null;
    if (data.id) {
      const { data: found } = await supabase
        .from('proposal_commissions')
        .select('*')
        .eq('id', data.id)
        .maybeSingle();
      existingCommission = found;
    } else {
      const { data: foundByProposal } = await supabase
        .from('proposal_commissions')
        .select('*')
        .eq('proposal_id', data.proposal_id)
        .maybeSingle();
      existingCommission = foundByProposal;
    }

    // Se já estiver recebida, bloquear alteração direta sem estorno
    if (existingCommission?.status === 'received') {
      return {
        success: false,
        error: 'Esta comissão já foi recebida e baixada. Não é permitido alterar valores diretamente.',
      };
    }

    const targetStatus = data.status || existingCommission?.status || 'draft';
    if (existingCommission && !canTransitionCommissionStatus(existingCommission.status, targetStatus)) {
      return {
        success: false,
        error: `Transição inválida de status de "${existingCommission.status}" para "${targetStatus}".`,
      };
    }

    // Verificar se proposta está convertida para ativar elegibilidade
    const { data: lead } = await supabase
      .from('leads')
      .select('status')
      .eq('id', data.proposal_id)
      .maybeSingle();

    const isProposalSuccess = isProposalSuccessful(lead?.status);
    const isCancelled = isProposalCancelled(lead?.status);

    const eligibleForReports =
      !isCancelled &&
      (targetStatus === 'confirmed' || targetStatus === 'receivable' || targetStatus === 'received') &&
      isProposalSuccess;

    const payload: Record<string, any> = {
      proposal_id: data.proposal_id,
      sell_request_id: data.sell_request_id || existingCommission?.sell_request_id || null,
      sale_agreement_id: data.sale_agreement_id || existingCommission?.sale_agreement_id || null,
      sale_id: data.sale_id || existingCommission?.sale_id || null,
      motorcycle_id: data.motorcycle_id || existingCommission?.motorcycle_id || null,
      owner_customer_id: data.owner_customer_id || existingCommission?.owner_customer_id || null,
      buyer_customer_id: data.buyer_customer_id || existingCommission?.buyer_customer_id || null,
      commission_type: data.commission_type,
      commission_percentage: data.commission_type === 'percentage' ? data.commission_percentage : null,
      commission_fixed_value: data.commission_type === 'fixed' ? data.commission_fixed_value : null,
      expected_sale_value: data.expected_sale_value,
      final_sale_value: data.final_sale_value ?? existingCommission?.final_sale_value ?? null,
      commission_expected_value: expectedValue,
      status: targetStatus,
      eligible_for_reports: eligibleForReports,
      notes: data.notes ?? existingCommission?.notes ?? null,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    if (eligibleForReports && !existingCommission?.eligible_at) {
      payload.eligible_at = new Date().toISOString();
    }

    let resultCommission: ProposalCommissionRecord;

    if (existingCommission) {
      const { data: updated, error } = await supabase
        .from('proposal_commissions')
        .update(payload)
        .eq('id', existingCommission.id)
        .select('*')
        .single();

      if (error || !updated) {
        console.error('Error updating commission:', error);
        return { success: false, error: 'Erro ao atualizar dados da comissão.' };
      }

      resultCommission = updated;

      // Registrar log de auditoria
      await supabase.from('proposal_commission_audit_logs').insert({
        commission_id: updated.id,
        action: 'updated',
        previous_snapshot: existingCommission,
        new_snapshot: updated,
        reason: data.reason || 'Atualização de valores ou parâmetros de comissão',
        changed_by: user.id,
      });
    } else {
      payload.created_at = new Date().toISOString();
      payload.created_by = user.id;

      const { data: inserted, error } = await supabase
        .from('proposal_commissions')
        .insert(payload)
        .select('*')
        .single();

      if (error || !inserted) {
        console.error('Error creating commission:', error);
        return { success: false, error: 'Erro ao criar comissão para a proposta.' };
      }

      resultCommission = inserted;

      // Registrar log de criação
      await supabase.from('proposal_commission_audit_logs').insert({
        commission_id: inserted.id,
        action: 'created',
        previous_snapshot: null,
        new_snapshot: inserted,
        reason: data.reason || 'Criação inicial da comissão',
        changed_by: user.id,
      });
    }

    revalidatePath('/admin/propostas');
    revalidatePath('/admin/relatorios');
    revalidatePath('/admin/vendas');

    return { success: true, commission: resultCommission };
  } catch (err: unknown) {
    console.error('Unexpected error saving commission:', err);
    return { success: false, error: (err as Error)?.message || 'Falha ao processar comissão.' };
  }
}

export async function confirmCommissionAction(
  rawData: ConfirmCommissionInput,
): Promise<{ success: boolean; commission?: ProposalCommissionRecord; error?: string }> {
  try {
    const supabase = await createClient();
    const user = await checkAdminUser(supabase);

    const parsed = confirmCommissionSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(', ') };
    }

    const { id, final_sale_value, confirmed_value, sale_id, reason } = parsed.data;

    const { data: existing, error: findError } = await supabase
      .from('proposal_commissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findError || !existing) {
      return { success: false, error: 'Comissão não encontrada.' };
    }

    const effectiveConfirmedValue =
      confirmed_value !== undefined && confirmed_value !== null
        ? confirmed_value
        : calculateCommission(
            existing.commission_type,
            existing.commission_percentage,
            existing.commission_fixed_value,
            final_sale_value,
          );

    const updatePayload: Record<string, any> = {
      final_sale_value,
      commission_confirmed_value: effectiveConfirmedValue,
      status: 'confirmed',
      eligible_for_reports: true,
      eligible_at: existing.eligible_at || new Date().toISOString(),
      confirmed_at: new Date().toISOString(),
      confirmed_by: user.id,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    if (sale_id) {
      updatePayload.sale_id = sale_id;
    }

    const { data: updated, error: updError } = await supabase
      .from('proposal_commissions')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (updError || !updated) {
      console.error('Error confirming commission:', updError);
      return { success: false, error: 'Não foi possível confirmar a comissão.' };
    }

    // Gravar log de auditoria
    await supabase.from('proposal_commission_audit_logs').insert({
      commission_id: id,
      action: 'confirmed',
      previous_snapshot: existing,
      new_snapshot: updated,
      reason: reason || 'Confirmação de comissão por venda concretizada',
      changed_by: user.id,
    });

    revalidatePath('/admin/propostas');
    revalidatePath('/admin/relatorios');
    revalidatePath('/admin/vendas');

    return { success: true, commission: updated };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Erro ao confirmar comissão.' };
  }
}

export async function receiveCommissionAction(
  rawData: ReceiveCommissionInput,
): Promise<{ success: boolean; commission?: ProposalCommissionRecord; error?: string }> {
  try {
    const supabase = await createClient();
    const user = await checkAdminUser(supabase);

    const parsed = receiveCommissionSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(', ') };
    }

    const { id, received_value, received_at, received_payment_method, received_reference, notes } = parsed.data;

    const { data: existing, error: findError } = await supabase
      .from('proposal_commissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findError || !existing) {
      return { success: false, error: 'Comissão não encontrada.' };
    }

    const updatePayload: Record<string, any> = {
      commission_received_value: received_value,
      commission_confirmed_value: existing.commission_confirmed_value || received_value,
      status: 'received',
      eligible_for_reports: true,
      eligible_at: existing.eligible_at || new Date().toISOString(),
      received_at: new Date(received_at).toISOString(),
      received_by: user.id,
      received_payment_method,
      received_reference: received_reference || null,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    if (notes) {
      updatePayload.notes = existing.notes ? `${existing.notes}\n[Recebimento]: ${notes}` : notes;
    }

    const { data: updated, error: updError } = await supabase
      .from('proposal_commissions')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (updError || !updated) {
      console.error('Error receiving commission:', updError);
      return { success: false, error: 'Erro ao registrar recebimento da comissão.' };
    }

    // Gravar log de auditoria
    await supabase.from('proposal_commission_audit_logs').insert({
      commission_id: id,
      action: 'received',
      previous_snapshot: existing,
      new_snapshot: updated,
      reason: `Recebimento de R$ ${received_value.toFixed(2)} via ${received_payment_method}`,
      changed_by: user.id,
    });

    revalidatePath('/admin/propostas');
    revalidatePath('/admin/relatorios');
    revalidatePath('/admin/vendas');

    return { success: true, commission: updated };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Erro ao registrar baixa.' };
  }
}

export async function cancelCommissionAction(
  rawData: CancelCommissionInput,
): Promise<{ success: boolean; commission?: ProposalCommissionRecord; error?: string }> {
  try {
    const supabase = await createClient();
    const user = await checkAdminUser(supabase);

    const parsed = cancelCommissionSchema.safeParse(rawData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(', ') };
    }

    const { id, reason } = parsed.data;

    const { data: existing, error: findError } = await supabase
      .from('proposal_commissions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (findError || !existing) {
      return { success: false, error: 'Comissão não encontrada.' };
    }

    if (existing.status === 'received') {
      return {
        success: false,
        error:
          'Esta comissão já foi baixada como recebida. Para cancelar um recebimento, realize um fluxo de anulação/estorno formal.',
      };
    }

    const updatePayload = {
      status: 'cancelled' as CommissionStatus,
      eligible_for_reports: false,
      cancelled_at: new Date().toISOString(),
      cancelled_by: user.id,
      cancellation_reason: reason,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    const { data: updated, error: updError } = await supabase
      .from('proposal_commissions')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (updError || !updated) {
      console.error('Error cancelling commission:', updError);
      return { success: false, error: 'Erro ao cancelar comissão.' };
    }

    // Gravar log de auditoria
    await supabase.from('proposal_commission_audit_logs').insert({
      commission_id: id,
      action: 'cancelled',
      previous_snapshot: existing,
      new_snapshot: updated,
      reason,
      changed_by: user.id,
    });

    revalidatePath('/admin/propostas');
    revalidatePath('/admin/relatorios');
    revalidatePath('/admin/vendas');

    return { success: true, commission: updated };
  } catch (err: unknown) {
    return { success: false, error: (err as Error)?.message || 'Erro ao cancelar comissão.' };
  }
}
