import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  generateShareToken,
  hashShareToken,
  isValidShareToken,
  hashClientIp,
  SHARE_TOKEN_PREFIX,
} from '../share-token.ts';

describe('Share Token Cryptographic Utilities', () => {
  it('should generate a token with 256 bits of entropy and correct prefix', () => {
    const token = generateShareToken();
    assert.strictEqual(token.startsWith(SHARE_TOKEN_PREFIX), true);
    assert.strictEqual(token.length >= 45, true);
    assert.strictEqual(isValidShareToken(token), true);
  });

  it('should generate unique tokens on successive calls', () => {
    const token1 = generateShareToken();
    const token2 = generateShareToken();
    assert.notStrictEqual(token1, token2);
  });

  it('should deterministically compute SHA-256 hash', () => {
    const token = 'vt_abc1234567890abcdefghijklmnopqrstuvwxyz_12345';
    const hash1 = hashShareToken(token);
    const hash2 = hashShareToken(token);
    assert.strictEqual(hash1, hash2);
    assert.strictEqual(hash1.length, 64);
    assert.strictEqual(/^[0-9a-f]{64}$/.test(hash1), true);
  });

  it('should reject invalid or malformed tokens', () => {
    assert.strictEqual(isValidShareToken(''), false);
    assert.strictEqual(isValidShareToken(null), false);
    assert.strictEqual(isValidShareToken(undefined), false);
    assert.strictEqual(isValidShareToken('12345'), false);
    assert.strictEqual(isValidShareToken('vt_curto'), false);
    assert.strictEqual(isValidShareToken('token_sem_prefixo_longo_123456789012345678901234567890'), false);
    assert.strictEqual(isValidShareToken('vt_com#caracteres$invalidos*12345678901234567890123456'), false);
  });

  it('should anonymize IP with consistent salt hashing', () => {
    const ip = '192.168.1.100';
    const hashed = hashClientIp(ip);
    assert.strictEqual(typeof hashed, 'string');
    assert.strictEqual(hashed?.length, 64);
    assert.strictEqual(hashClientIp(null), null);
  });
});
