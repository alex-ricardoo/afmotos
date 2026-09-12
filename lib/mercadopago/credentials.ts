import { createHash } from 'crypto';
import {
  getMercadoPagoAccessToken,
  getMercadoPagoPublicKey,
  getMercadoPagoWebhookSecret,
} from './client.ts';

export type CredentialMode = 'test' | 'production' | 'invalid' | 'missing';

export interface SafeCredentialFingerprint {
  present: boolean;
  prefix: string;
  length: number;
  fingerprint: string | null;
}

export interface MercadoPagoEnvValidationResult {
  providerCredentialMode: CredentialMode;
  publicKeyPresent: boolean;
  accessTokenPresent: boolean;
  webhookSecretPresent: boolean;
  publicKeyFingerprint: SafeCredentialFingerprint;
  accessTokenFingerprint: SafeCredentialFingerprint;
  webhookSecretFingerprint: SafeCredentialFingerprint;
  nodeEnv: string;
  vercelEnv: string | null;
  sdkVersion: string;
  isValid: boolean;
  issues: string[];
}

/**
 * Generates a safe credential fingerprint without exposing the secret.
 * Prefix is at most 5 characters, length is returned, and a truncated 12-char SHA-256 hash.
 */
export function getSafeCredentialFingerprint(
  secret: string | null | undefined,
): SafeCredentialFingerprint {
  if (!secret || typeof secret !== 'string' || secret.trim().length === 0) {
    return {
      present: false,
      prefix: '',
      length: 0,
      fingerprint: null,
    };
  }

  const trimmed = secret.trim();
  const prefix = trimmed.slice(0, 5);
  const hash = createHash('sha256').update(trimmed).digest('hex').slice(0, 12);

  return {
    present: true,
    prefix,
    length: trimmed.length,
    fingerprint: hash,
  };
}

/**
 * Determines the credential mode based strictly on prefix.
 * Mercado Pago test credentials start with "TEST-".
 * Production credentials typically start with "APP_USR-" or similar.
 */
export function determineCredentialMode(prefix: string): CredentialMode {
  if (!prefix) return 'missing';
  if (prefix.startsWith('TEST-') || prefix.startsWith('TEST')) return 'test';
  if (prefix.startsWith('APP_U') || prefix.startsWith('PROD')) return 'production';
  return 'invalid';
}

/**
 * Server-only validation of Mercado Pago credentials and environment consistency.
 * Validates pairing, white spaces, and environment mismatches without leaking secrets.
 */
export function validateMercadoPagoEnvironment(): MercadoPagoEnvValidationResult {
  const rawPublicKey = getMercadoPagoPublicKey();
  const rawAccessToken = getMercadoPagoAccessToken();
  const rawWebhookSecret = getMercadoPagoWebhookSecret();

  const issues: string[] = [];

  // Check for leading/trailing whitespaces
  if (rawPublicKey && rawPublicKey !== rawPublicKey.trim()) {
    issues.push('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY contém espaços em branco nas extremidades.');
  }
  if (rawAccessToken && rawAccessToken !== rawAccessToken.trim()) {
    issues.push('MERCADO_PAGO_ACCESS_TOKEN contém espaços em branco nas extremidades.');
  }
  if (rawWebhookSecret && rawWebhookSecret !== rawWebhookSecret.trim()) {
    issues.push('MERCADO_PAGO_WEBHOOK_SECRET contém espaços em branco nas extremidades.');
  }

  const pkFp = getSafeCredentialFingerprint(rawPublicKey);
  const atFp = getSafeCredentialFingerprint(rawAccessToken);
  const wsFp = getSafeCredentialFingerprint(rawWebhookSecret);

  if (!pkFp.present) {
    issues.push('NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY não está configurada.');
  }
  if (!atFp.present) {
    issues.push('MERCADO_PAGO_ACCESS_TOKEN não está configurada.');
  }

  const pkMode = determineCredentialMode(pkFp.prefix);
  const atMode = determineCredentialMode(atFp.prefix);

  let providerCredentialMode: CredentialMode = 'missing';

  if (!pkFp.present || !atFp.present) {
    providerCredentialMode = 'missing';
  } else if (pkMode === 'invalid' || atMode === 'invalid') {
    providerCredentialMode = 'invalid';
    issues.push(
      `Formato de credencial não reconhecido (Public Key: ${pkFp.prefix}, Access Token: ${atFp.prefix}).`,
    );
  } else if (pkMode !== atMode) {
    providerCredentialMode = 'invalid';
    issues.push(
      `Incompatibilidade de ambiente: Public Key é '${pkMode}' (${pkFp.prefix}) mas Access Token é '${atMode}' (${atFp.prefix}). Ambos devem ser do mesmo ambiente.`,
    );
  } else {
    providerCredentialMode = pkMode;
  }

  const nodeEnv = process.env.NODE_ENV || 'unknown';
  const vercelEnv = process.env.VERCEL_ENV || null;

  return {
    providerCredentialMode,
    publicKeyPresent: pkFp.present,
    accessTokenPresent: atFp.present,
    webhookSecretPresent: wsFp.present,
    publicKeyFingerprint: pkFp,
    accessTokenFingerprint: atFp,
    webhookSecretFingerprint: wsFp,
    nodeEnv,
    vercelEnv,
    sdkVersion: '^3.6.1',
    isValid: issues.length === 0,
    issues,
  };
}
