import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRefundEligibility } from '../../mercadopago/refund-service.ts';
import { z } from 'zod';

const AdminRefundReasonEnum = z.enum([
  'APIBRASIL_INSUFFICIENT_CREDITS',
  'APIBRASIL_AUTH_ERROR',
  'APIBRASIL_CONFIGURATION_ERROR',
  'APIBRASIL_RETRIES_EXHAUSTED',
  'APIBRASIL_PROVIDER_UNAVAILABLE',
  'LAUDO_NAO_ENTREGAVEL',
  'DECISAO_MANUAL_SUPORTE',
  'OUTRO',
]);

const AdminRefundRequestSchema = z
  .object({
    reasonCode: AdminRefundReasonEnum,
    adminNote: z.string().trim().max(500).optional(),
    confirmationText: z.literal('ESTORNAR', {
      message: 'A confirmação deve ser exatamente a palavra ESTORNAR em maiúsculas.',
    }),
  })
  .refine(
    (data) => {
      if (data.reasonCode === 'OUTRO') {
        return Boolean(data.adminNote && data.adminNote.length >= 10);
      }
      return true;
    },
    {
      message:
        'A nota administrativa é obrigatória (mínimo 10 caracteres) quando o motivo for OUTRO.',
      path: ['adminNote'],
    },
  );

test('evaluateRefundEligibility aprova transação válida sem laudo entregue', () => {
  const result = evaluateRefundEligibility({
    transaction: {
      id: 'tx-001',
      status: 'approved',
      payment_status: 'approved',
      mp_payment_id: 'mp-123456789',
      transaction_amount: 49.9,
    },
    consultation: {
      id: 'cons-001',
      status: 'failed',
      report_data: null,
      vehicle_data: null,
    },
    existingRefund: null,
  });

  assert.equal(result.eligible, true);
  assert.equal(result.reason, null);
});

test('evaluateRefundEligibility sinaliza recarga de saldo para APIBRASIL_INSUFFICIENT_CREDITS', () => {
  const result = evaluateRefundEligibility({
    transaction: {
      id: 'tx-001',
      status: 'approved',
      payment_status: 'approved',
      mp_payment_id: 'mp-123456789',
      transaction_amount: 49.9,
    },
    consultation: {
      id: 'cons-001',
      status: 'failed',
      report_data: null,
      vehicle_data: null,
    },
    existingRefund: null,
    reasonCode: 'APIBRASIL_INSUFFICIENT_CREDITS',
  });

  assert.equal(result.eligible, true);
  assert.equal(result.supportActionRequired, 'RECHARGE_APIBRASIL');
});

test('evaluateRefundEligibility bloqueia se pagamento não estiver aprovado', () => {
  const result = evaluateRefundEligibility({
    transaction: {
      id: 'tx-001',
      status: 'pending',
      payment_status: 'pending',
      mp_payment_id: 'mp-123456789',
      transaction_amount: 49.9,
    },
    consultation: {
      id: 'cons-001',
      status: 'failed',
      report_data: null,
      vehicle_data: null,
    },
    existingRefund: null,
  });

  assert.equal(result.eligible, false);
  assert.match(result.reason || '', /não está aprovado/);
});

test('evaluateRefundEligibility bloqueia se mp_payment_id estiver ausente', () => {
  const result = evaluateRefundEligibility({
    transaction: {
      id: 'tx-001',
      status: 'approved',
      payment_status: 'approved',
      mp_payment_id: null,
      transaction_amount: 49.9,
    },
    consultation: {
      id: 'cons-001',
      status: 'failed',
      report_data: null,
      vehicle_data: null,
    },
    existingRefund: null,
  });

  assert.equal(result.eligible, false);
  assert.match(result.reason || '', /mp_payment_id/);
});

test('evaluateRefundEligibility bloqueia se laudo já foi entregue com sucesso', () => {
  const result = evaluateRefundEligibility({
    transaction: {
      id: 'tx-001',
      status: 'approved',
      payment_status: 'approved',
      mp_payment_id: 'mp-123456789',
      transaction_amount: 49.9,
    },
    consultation: {
      id: 'cons-001',
      status: 'completed',
      vehicle_data: { marca: 'Honda', modelo: 'CG 160' },
    },
    existingRefund: null,
  });

  assert.equal(result.eligible, false);
  assert.match(result.reason || '', /Laudo já foi entregue/);
});

test('evaluateRefundEligibility bloqueia se já existir estorno ativo ou confirmado', () => {
  const resPending = evaluateRefundEligibility({
    transaction: {
      id: 'tx-001',
      status: 'approved',
      payment_status: 'approved',
      mp_payment_id: 'mp-123456789',
      transaction_amount: 49.9,
    },
    consultation: {
      id: 'cons-001',
      status: 'failed',
      report_data: null,
      vehicle_data: null,
    },
    existingRefund: { id: 'ref-1', status: 'pending' },
  });

  assert.equal(resPending.eligible, false);
});

test('AdminRefundRequestSchema validação da confirmação ESTORNAR e motivo OUTRO', () => {
  // Válido
  const valid = AdminRefundRequestSchema.safeParse({
    reasonCode: 'APIBRASIL_INSUFFICIENT_CREDITS',
    confirmationText: 'ESTORNAR',
  });
  assert.equal(valid.success, true);

  // Palavra incorreta
  const invalidText = AdminRefundRequestSchema.safeParse({
    reasonCode: 'APIBRASIL_INSUFFICIENT_CREDITS',
    confirmationText: 'estornar',
  });
  assert.equal(invalidText.success, false);

  // Motivo OUTRO sem nota
  const invalidNote = AdminRefundRequestSchema.safeParse({
    reasonCode: 'OUTRO',
    adminNote: 'curto',
    confirmationText: 'ESTORNAR',
  });
  assert.equal(invalidNote.success, false);

  // Motivo OUTRO com nota suficiente
  const validOther = AdminRefundRequestSchema.safeParse({
    reasonCode: 'OUTRO',
    adminNote: 'Justificativa administrativa completa com mais de 10 caracteres',
    confirmationText: 'ESTORNAR',
  });
  assert.equal(validOther.success, true);
});
