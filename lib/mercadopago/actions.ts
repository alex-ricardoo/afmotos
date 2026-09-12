'use server';

import {
  createPaymentPreference as createPreferenceInternal,
  processBrickPayment as processBrickPaymentInternal,
} from './payment-service';
import { type BrickSubmitFormData, type ProcessBrickPaymentResult } from './types';

export async function createPaymentPreferenceAction(consultationId: string) {
  return await createPreferenceInternal(consultationId);
}

export async function processBrickPaymentAction(
  consultationId: string,
  formData: BrickSubmitFormData
): Promise<ProcessBrickPaymentResult> {
  return await processBrickPaymentInternal(consultationId, formData);
}
