'use server';

import {
  createPaymentPreference as createPreferenceInternal,
  processBrickPayment as processBrickPaymentInternal,
} from './payment-service';
import {
  type BrickSubmitFormData,
  type ProcessBrickPaymentResult,
  type BrickPayerAddress,
} from './types';
import { brickPayerAddressSchema } from './schemas';
import { createClient } from '@/lib/supabase/server';

import {
  paymentLogInfo,
  paymentLogError,
  maskEmail,
  extractSafeError,
} from '@/lib/observability/payment-logger';

export async function createPaymentPreferenceAction(consultationId: string) {
  return await createPreferenceInternal(consultationId);
}

export async function processBrickPaymentAction(
  consultationId: string,
  formData: BrickSubmitFormData,
  clientFlowId?: string,
): Promise<ProcessBrickPaymentResult> {
  const startTime = Date.now();
  const flowId = clientFlowId || crypto.randomUUID();

  paymentLogInfo('payment.action_started', {
    flowId,
    consultationId,
    paymentMethodId: formData?.payment_method_id,
    tokenPresent: Boolean(formData?.token),
    issuerProvided: Boolean(formData?.issuer_id),
    installments: formData?.installments || 1,
    cpfPresent: Boolean(formData?.payer?.identification?.number),
    cpfLength: formData?.payer?.identification?.number?.replace(/\D/g, '')?.length || 0,
    addressPresent: Boolean(formData?.payer?.address),
    userEmailMasked: maskEmail(formData?.payer?.email),
  });

  try {
    const result = await processBrickPaymentInternal(consultationId, formData, flowId);

    paymentLogInfo('payment.action_completed', {
      flowId,
      consultationId,
      status: result.status,
      success: result.success,
      mercadoPagoPaymentId: result.paymentId,
      durationMs: Date.now() - startTime,
    });

    return result;
  } catch (err: unknown) {
    const safeErr = extractSafeError(err);
    paymentLogError('payment.action_failed', {
      flowId,
      consultationId,
      ...safeErr,
      durationMs: Date.now() - startTime,
    });
    throw err;
  }
}

/**
 * Server Action to lookup address data by Brazilian CEP (ViaCEP fallback).
 * Runs securely server-side to avoid client CORS or network issues.
 */
export async function lookupCepAction(cep: string): Promise<{
  success: boolean;
  data?: {
    street: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  error?: string;
}> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) {
    return { success: false, error: 'O CEP deve conter exatamente 8 dígitos.' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return {
        success: false,
        error: 'Serviço de CEP temporariamente indisponível. Preencha os campos manualmente.',
      };
    }

    const data = await res.json();
    if (data.erro) {
      return {
        success: false,
        error: 'CEP não localizado. Por favor, verifique ou preencha manualmente.',
      };
    }

    return {
      success: true,
      data: {
        street: data.logradouro || '',
        neighborhood: data.bairro || '',
        city: data.localidade || '',
        state: (data.uf || '').toUpperCase(),
      },
    };
  } catch (err: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[lookupCepAction] Erro na consulta de CEP:',
        err instanceof Error ? err.message : err,
      );
    }
    return {
      success: false,
      error: 'Não foi possível buscar o endereço automaticamente. Preencha os campos abaixo.',
    };
  }
}

/**
 * Persists validated customer address to their profile under RLS (auth.uid()).
 */
export async function saveCustomerAddressAction(
  address: BrickPayerAddress,
): Promise<{ success: boolean; error?: string }> {
  const parse = brickPayerAddressSchema.safeParse(address);
  if (!parse.success) {
    return { success: false, error: parse.error.issues[0]?.message || 'Endereço inválido.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuário não autenticado.' };
  }

  const valid = parse.data;
  const { error } = await supabase
    .from('customer_profiles')
    .update({
      address_zip: valid.zip_code,
      address_street: valid.street_name,
      address_number: valid.street_number,
      address_neighborhood: valid.neighborhood,
      address_city: valid.city,
      address_state: valid.federal_unit,
      address_complement: valid.complement || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    return { success: false, error: 'Falha ao atualizar endereço no perfil.' };
  }

  return { success: true };
}
