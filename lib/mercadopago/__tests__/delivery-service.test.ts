import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateNextRetryTimestamp } from '../../vehicle-delivery/delivery-service.ts'

test('calculateNextRetryTimestamp respects retryAfterSeconds with jitter', () => {
  const before = Date.now()
  const timestampIso = calculateNextRetryTimestamp(2, 45)
  const after = Date.now()

  const targetDate = new Date(timestampIso).getTime()
  // 45 segundos + até 10s de jitter
  assert.ok(targetDate >= before + 45_000, 'timestamp deve ser pelo menos 45 segundos no futuro')
  assert.ok(targetDate <= after + 60_000, 'timestamp não deve ultrapassar 45s + 10s jitter')
})

test('calculateNextRetryTimestamp computes exponential backoff for attempt 2 (1 min base)', () => {
  const before = Date.now()
  const timestampIso = calculateNextRetryTimestamp(2)
  const targetDate = new Date(timestampIso).getTime()

  // Base 60s + jitter até 15s
  assert.ok(targetDate >= before + 59_000)
  assert.ok(targetDate <= before + 80_000)
})

test('calculateNextRetryTimestamp computes exponential backoff for attempt 3 (5 min base)', () => {
  const before = Date.now()
  const timestampIso = calculateNextRetryTimestamp(3)
  const targetDate = new Date(timestampIso).getTime()

  // Base 300s (5m) + jitter até 30s
  assert.ok(targetDate >= before + 295_000)
  assert.ok(targetDate <= before + 340_000)
})

test('calculateNextRetryTimestamp computes exponential backoff for attempt 4 (15 min base)', () => {
  const before = Date.now()
  const timestampIso = calculateNextRetryTimestamp(4)
  const targetDate = new Date(timestampIso).getTime()

  // Base 900s (15m) + jitter até 60s
  assert.ok(targetDate >= before + 890_000)
  assert.ok(targetDate <= before + 970_000)
})

test('calculateNextRetryTimestamp computes backoff for attempt 5+ (30 min base)', () => {
  const before = Date.now()
  const timestampIso = calculateNextRetryTimestamp(5)
  const targetDate = new Date(timestampIso).getTime()

  // Base 1800s (30m) + jitter até 60s
  assert.ok(targetDate >= before + 1790_000)
  assert.ok(targetDate <= before + 1870_000)
})
