import { type PaymentTransactionStatus } from './types.ts';

/**
 * Mapeia o status do pagamento retornado pela API do Mercado Pago
 * para o tipo normalizado interno de PaymentTransactionStatus.
 */
export function mapMercadoPagoStatus(
  rawStatus: string | null | undefined,
): PaymentTransactionStatus {
  if (!rawStatus) return 'pending';

  switch (rawStatus.toLowerCase()) {
    case 'approved':
      return 'approved';
    case 'authorized':
      return 'authorized';
    case 'pending':
      return 'pending';
    case 'in_process':
      return 'in_process';
    case 'in_mediation':
      return 'in_mediation';
    case 'rejected':
      return 'rejected';
    case 'cancelled':
      return 'cancelled';
    case 'refunded':
      return 'refunded';
    case 'charged_back':
      return 'charged_back';
    case 'provider_error':
      return 'provider_error';
    case 'pending_reconciliation':
      return 'pending_reconciliation';
    default:
      return 'pending';
  }
}

/**
 * Verifica se um status é terminal para fins de autorização e consulta veicular.
 */
export function isTerminalApprovalStatus(status: PaymentTransactionStatus): boolean {
  return status === 'approved' || status === 'refunded' || status === 'charged_back';
}

/**
 * Verifica se uma transição de status é permitida.
 * Impede que notificações atrasadas deem downgrade em status 'approved'.
 */
export function canTransitionStatus(
  currentStatus: PaymentTransactionStatus,
  newStatus: PaymentTransactionStatus,
): boolean {
  if (currentStatus === newStatus) return true;

  // Se já está aprovado, não pode sofrer downgrade para pending ou in_process
  if (currentStatus === 'approved') {
    return newStatus === 'refunded' || newStatus === 'charged_back';
  }

  // Se foi estornado ou sofrer chargeback, não pode voltar a nenhum outro
  if (currentStatus === 'refunded' || currentStatus === 'charged_back') {
    return false;
  }

  return true;
}

/**
 * Retorna mensagem amigável e segura para o cliente correspondente ao status_detail.
 */
export function getSafeStatusMessage(
  status: PaymentTransactionStatus,
  statusDetail?: string | null,
): string {
  switch (status) {
    case 'approved':
      return 'Pagamento aprovado com sucesso.';
    case 'in_process':
      return 'Seu pagamento está sendo processado pelo Mercado Pago. Aguarde alguns instantes.';
    case 'pending':
      return 'Aguardando confirmação do pagamento.';
    case 'rejected':
      if (statusDetail === 'cc_rejected_insufficient_amount') {
        return 'Pagamento não autorizado: saldo insuficiente.';
      }
      if (statusDetail === 'cc_rejected_bad_filled_security_code') {
        return 'Código de segurança inválido.';
      }
      return 'O pagamento não foi autorizado pela operadora ou meio selecionado.';
    case 'cancelled':
      return 'O pagamento foi cancelado ou expirou.';
    case 'refunded':
      return 'O pagamento foi estornado.';
    case 'provider_error':
    case 'pending_reconciliation':
      return 'Houve uma instabilidade temporária no provedor de pagamento. Nossa equipe está verificando.';
    default:
      return 'Processando transação.';
  }
}
