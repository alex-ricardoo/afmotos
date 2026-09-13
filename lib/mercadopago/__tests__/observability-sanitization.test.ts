import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  shortHash,
  maskId,
  sanitizeError,
  getRuntimeEnvironment,
  logCheckoutProEvent,
} from '../observability.ts';

describe('Observability & Log Sanitization (T15)', () => {
  it('shortHash gera digest SHA-256 de 8 caracteres para rastreamento sem expor o valor original', () => {
    const rawValue = 'id:177857907601;request-id:req-123;ts:1726227000;';
    const hash = shortHash(rawValue);

    assert.ok(hash);
    assert.equal(hash.length, 8);
    assert.match(hash, /^[0-9a-f]{8}$/);
    assert.equal(hash.includes('177857907601'), false);
    assert.equal(hash.includes('req-123'), false);
  });

  it('shortHash lida de forma segura com valores nulos ou vazios', () => {
    assert.equal(shortHash(null), null);
    assert.equal(shortHash(undefined), null);
    assert.equal(shortHash(''), null);
  });

  it('maskId mascara identificadores preservando apenas prefixo e sufixo mínimos', () => {
    const paymentId = '177857907601';
    const masked = maskId(paymentId);

    assert.equal(masked, '1778...7601');
    assert.equal(masked?.includes('5790'), false);
  });

  it('maskId lida com números e strings curtas de forma segura', () => {
    assert.equal(maskId(177857907601), '1778...7601');
    assert.equal(maskId('123'), '123');
    assert.equal(maskId(null), null);
    assert.equal(maskId(undefined), null);
  });

  it('sanitizeError remove tokens de acesso e segredos conhecidos de mensagens de erro', () => {
    const sensitiveError = new Error(
      'Request failed with APP_USR-1234567890-abcdef12345678 and Bearer secret_jwt_xyz',
    );
    const sanitized = sanitizeError(sensitiveError);

    assert.equal(sanitized.name, 'Error');
    assert.equal(sanitized.message.includes('APP_USR-1234567890-abcdef12345678'), false);
    assert.equal(sanitized.message.includes('secret_jwt_xyz'), false);
    assert.match(sanitized.message, /\[REDACTED_TOKEN\]/);
    assert.match(sanitized.message, /Bearer \[REDACTED\]/);
  });

  it('getRuntimeEnvironment detecta production a partir de VERCEL_ENV', () => {
    const originalVercelEnv = process.env.VERCEL_ENV;
    try {
      process.env.VERCEL_ENV = 'production';
      assert.equal(getRuntimeEnvironment(), 'production');

      process.env.VERCEL_ENV = 'preview';
      assert.equal(getRuntimeEnvironment(), 'preview');

      delete process.env.VERCEL_ENV;
      assert.equal(getRuntimeEnvironment(), 'local');
    } finally {
      if (originalVercelEnv !== undefined) {
        process.env.VERCEL_ENV = originalVercelEnv;
      } else {
        delete process.env.VERCEL_ENV;
      }
    }
  });

  it('logCheckoutProEvent formata evento estruturado com prefixo [CHECKOUT_PRO]', () => {
    const originalConsoleLog = console.log;
    let loggedOutput = '';

    console.log = (msg: string) => {
      loggedOutput = msg;
    };

    try {
      logCheckoutProEvent('checkout_pro.test_event' as any, {
        transactionId: '54b419a6-053e-48fc-8afc-9aa3eaed39ad',
        paymentId: '177857907601',
      });

      assert.match(loggedOutput, /^\[CHECKOUT_PRO\] \{.*\}$/);
      const parsed = JSON.parse(loggedOutput.replace('[CHECKOUT_PRO] ', ''));
      assert.equal(parsed.event, 'checkout_pro.test_event');
      assert.equal(parsed.transactionId, '54b419a6-053e-48fc-8afc-9aa3eaed39ad');
      assert.equal(parsed.paymentId, '1778...7601');
    } finally {
      console.log = originalConsoleLog;
    }
  });
});
