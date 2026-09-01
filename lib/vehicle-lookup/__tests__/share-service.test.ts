import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  checkInvalidAttemptRateLimit,
  registerInvalidAttempt,
} from '../share-service.ts';

describe('Share Service & Rate Limiting Engine', () => {
  it('should allow initial requests from a client IP', () => {
    const ip = '10.0.0.1';
    assert.strictEqual(checkInvalidAttemptRateLimit(ip), true);
  });

  it('should block client IP after exceeding maximum invalid attempt threshold', () => {
    const abusiveIp = '203.0.113.199';

    for (let i = 0; i < 14; i++) {
      registerInvalidAttempt(abusiveIp);
      assert.strictEqual(checkInvalidAttemptRateLimit(abusiveIp), true);
    }

    // 15th invalid attempt reaches limit
    registerInvalidAttempt(abusiveIp);
    assert.strictEqual(checkInvalidAttemptRateLimit(abusiveIp), false);
  });

  it('should not block other IPs when one is rate limited', () => {
    const innocentIp = '198.51.100.45';
    assert.strictEqual(checkInvalidAttemptRateLimit(innocentIp), true);
  });
});
