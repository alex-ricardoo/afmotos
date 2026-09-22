import crypto from 'crypto';
import { getPaymentClient } from './client.ts';
import { timingSafeCompareHexBuffers, isValidSha256Hex, truncateHash } from './security.ts';
import { type WebhookVerificationResult } from './types.ts';

/**
 * Extrai e normaliza os atributos ts e v1 do cabeçalho x-signature do Mercado Pago.
 * Suporta tolerância a:
 * - Ordens arbitrárias (ts=...,v1=... ou v1=...,ts=...)
 * - Espaços opcionais antes/depois de vírgulas e ao redor do sinal de igual
 * - Parâmetros extras desconhecidos
 */
export function parseSignatureHeader(signatureHeader: string | null | undefined): {
  ts?: string;
  v1?: string;
  otherParams: Record<string, string>;
} {
  const result: { ts?: string; v1?: string; otherParams: Record<string, string> } = {
    otherParams: {},
  };

  if (!signatureHeader || typeof signatureHeader !== 'string') {
    return result;
  }

  const parts = signatureHeader.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*=\s*(.+)$/);
    if (!match) continue;

    const key = match[1].trim();
    const val = match[2].trim();

    if (key === 'ts') {
      result.ts = val;
    } else if (key === 'v1') {
      result.v1 = val;
    } else {
      result.otherParams[key] = val;
    }
  }

  return result;
}

/**
 * Função pura para resolução determinística do identificador de recurso (resourceId)
 * em notificações de Webhook do Mercado Pago.
 *
 * Ordem estrita de resolução:
 * 1. payload.data.id (se for string ou número válido, converte para string e remove espaços externos).
 * 2. Parâmetro data.id da URL (query string). Se for alfanumérico, aplica lowercase conforme especificação.
 * 3. Parâmetro id da URL (query string).
 * 4. Caso contrário, retorna null.
 *
 * Nota: external_reference NUNCA é usado como identificador de recurso criptográfico.
 */
export function resolveMercadoPagoWebhookResourceId(
  request: Request,
  payload: unknown,
): string | null {
  // 1. Tenta extrair do payload JSON: payload.data.id
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const dataObj = (payload as { data?: unknown }).data;
    if (dataObj && typeof dataObj === 'object' && 'id' in dataObj) {
      const rawId = (dataObj as { id?: unknown }).id;
      if (typeof rawId === 'string' && rawId.trim().length > 0) {
        return rawId.trim();
      }
      if (typeof rawId === 'number' && !Number.isNaN(rawId)) {
        return String(rawId).trim();
      }
    }
  }

  // 2 e 3. Tenta extrair da query string da URL da requisição
  try {
    const parsedUrl = new URL(request.url);
    const queryDataId = parsedUrl.searchParams.get('data.id');
    if (queryDataId && queryDataId.trim().length > 0) {
      const trimmed = queryDataId.trim();
      // Se contiver letras, normaliza para lowercase conforme padrão de URLs do MP
      return /[a-zA-Z]/.test(trimmed) ? trimmed.toLowerCase() : trimmed;
    }

    const queryId = parsedUrl.searchParams.get('id');
    if (queryId && queryId.trim().length > 0) {
      const trimmed = queryId.trim();
      return /[a-zA-Z]/.test(trimmed) ? trimmed.toLowerCase() : trimmed;
    }
  } catch {
    // Falha silenciosa no parse de URL malformada
  }

  return null;
}

/**
 * Valida a assinatura HMAC-SHA256 de uma notificação de webhook do Mercado Pago.
 * Implementa estritamente o algoritmo oficial:
 * manifest = `id:${resourceId};request-id:${xRequestId};ts:${ts};`
 */
export function validateWebhookSignature(
  headers: Headers,
  resourceId: string | null | undefined,
): WebhookVerificationResult {
  const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  if (!secret || secret.trim().length === 0) {
    return {
      isValid: false,
      reasonCode: 'missing_webhook_secret',
      reason: 'MERCADO_PAGO_WEBHOOK_SECRET não configurado no servidor.',
    };
  }

  const signatureHeader = headers.get('x-signature');
  if (!signatureHeader || signatureHeader.trim().length === 0) {
    return {
      isValid: false,
      reasonCode: 'missing_signature',
      reason: 'Cabeçalho x-signature ausente.',
    };
  }

  const requestId = headers.get('x-request-id');
  if (!requestId || requestId.trim().length === 0) {
    return {
      isValid: false,
      reasonCode: 'missing_request_id',
      reason: 'Cabeçalho x-request-id ausente.',
    };
  }

  const cleanResourceId = resourceId ? String(resourceId).trim() : '';
  if (!cleanResourceId) {
    return {
      isValid: false,
      reasonCode: 'missing_resource_id',
      reason: 'ID do recurso não identificado na notificação.',
    };
  }

  // Parse resiliente de ts e v1
  const parsedSig = parseSignatureHeader(signatureHeader);
  const ts = parsedSig.ts;
  const v1 = parsedSig.v1;

  if (!ts) {
    return {
      isValid: false,
      reasonCode: 'missing_signature_timestamp',
      reason: 'Timestamp (ts) ausente no cabeçalho x-signature.',
    };
  }

  if (!v1) {
    return {
      isValid: false,
      reasonCode: 'missing_signature_digest',
      reason: 'Digest (v1) ausente no cabeçalho x-signature.',
    };
  }

  // Validação de formato hexadecimal e comprimento de 64 caracteres
  if (!isValidSha256Hex(v1)) {
    const isHexLength = /^[0-9a-fA-F]+$/.test(v1.trim());
    return {
      isValid: false,
      reasonCode: isHexLength ? 'digest_length_mismatch' : 'invalid_digest_format',
      reason: 'Formato ou comprimento do hash v1 recebido é inválido.',
      receivedDigestLength: v1.trim().length,
      expectedDigestLength: 64,
    };
  }

  // Monta o manifesto oficial com os separadores e ponto e vírgula final
  const manifest = `id:${cleanResourceId};request-id:${requestId.trim()};ts:${ts.trim()};`;
  const manifestHash = truncateHash(manifest);
  const manifestLength = manifest.length;

  // Calcula o digest esperado via HMAC-SHA256
  const expectedHash = crypto
    .createHmac('sha256', secret.trim())
    .update(manifest, 'utf8')
    .digest('hex');

  // Comparação timing-safe em buffers decodificados em bytes
  const isValid = timingSafeCompareHexBuffers(expectedHash, v1);

  if (!isValid) {
    return {
      isValid: false,
      reasonCode: 'signature_mismatch',
      reason: 'Assinatura criptográfica não confere.',
      timestamp: ts,
      resourceId: cleanResourceId,
      manifestHash,
      manifestLength,
      receivedDigestLength: v1.trim().length,
      expectedDigestLength: 64,
    };
  }

  return {
    isValid: true,
    timestamp: ts,
    resourceId: cleanResourceId,
    manifestHash,
    manifestLength,
    receivedDigestLength: 64,
    expectedDigestLength: 64,
  };
}

/**
 * Busca os dados definitivos e autoritativos de um pagamento diretamente na API do Mercado Pago.
 */
export async function fetchAuthoritativePayment(paymentId: string | number) {
  const paymentClient = getPaymentClient();
  const payment = await paymentClient.get({ id: String(paymentId) });

  if (!payment || !payment.id) {
    throw new Error(`Pagamento ${paymentId} não encontrado no Mercado Pago.`);
  }

  const rawPayment = payment as unknown as Record<string, unknown>;
  const orderObj = rawPayment.order as Record<string, unknown> | undefined;
  const metadataObj = rawPayment.metadata as Record<string, unknown> | undefined;

  const preferenceId =
    (typeof rawPayment.preference_id === 'string' && rawPayment.preference_id) ||
    (typeof orderObj?.id === 'string' && orderObj.id) ||
    null;

  return {
    id: String(payment.id),
    status: payment.status || 'pending',
    statusDetail: payment.status_detail || null,
    externalReference: payment.external_reference || null,
    preferenceId,
    metadata: metadataObj || null,
    transactionAmount: payment.transaction_amount || 0,
    paymentMethodId: payment.payment_method_id || null,
    paymentTypeId: payment.payment_type_id || null,
    payerEmail: payment.payer?.email || null,
    rawResponse: rawPayment,
  };
}
