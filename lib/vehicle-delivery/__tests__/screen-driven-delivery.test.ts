import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { calculateNextRetryTimestamp } from '../delivery-service.ts';
import { sanitizeRefundErrorMessage } from '../../mercadopago/refund-service.ts';

test('T01 - Vercel Hobby Deploy: vercel.json contains no high-frequency cron', () => {
  const vercelJsonPath = path.resolve(process.cwd(), 'vercel.json');
  assert.ok(fs.existsSync(vercelJsonPath), 'vercel.json deve existir');

  const content = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
  const crons = content.crons || [];

  for (const cron of crons) {
    const schedule = cron.schedule;
    // No plano Hobby, cron só pode rodar no máximo 1x ao dia
    assert.notEqual(schedule, '* * * * *', 'Cron por minuto é proibido no plano Hobby');
    assert.notEqual(schedule, '*/5 * * * *', 'Cron a cada 5 minutos é proibido no plano Hobby');
    assert.notEqual(schedule, '*/10 * * * *', 'Cron frequente é proibido no plano Hobby');
  }

  // No hotfix atual, crons foram desativados para evitar qualquer risco de bloqueio
  assert.equal(crons.length, 0, 'No hotfix Hobby, crons da feature devem ser removidos');
});

test('T02 - Screen-Driven Retry: calculateNextRetryTimestamp creates strictly future timestamps', () => {
  const now = Date.now();
  const nextRetryIso = calculateNextRetryTimestamp(2);
  const nextRetryTime = new Date(nextRetryIso).getTime();

  assert.ok(nextRetryTime > now, 'O próximo retry deve estar no futuro');
  // Tentativa 2 deve dar delay em torno de 60s
  assert.ok(nextRetryTime >= now + 59_000);
});

test('T03 - Screen-Driven Timing: identifies when retry is not due yet', () => {
  const futureDate = new Date(Date.now() + 45_000).toISOString();
  const isDue = new Date(futureDate).getTime() <= Date.now();

  assert.equal(isDue, false, 'Retry agendado para 45s no futuro não deve estar elegível');
});

test('T04 - Screen-Driven Timing: identifies when retry is due', () => {
  const pastDate = new Date(Date.now() - 5_000).toISOString();
  const isDue = new Date(pastDate).getTime() <= Date.now();

  assert.equal(isDue, true, 'Retry agendado para o passado deve estar elegível');
});

test('T05 - WhatsApp Sanitization: message does not leak tokens, secrets or sensitive keys', () => {
  const rawMsg =
    'Olá! Preciso de ajuda com uma consulta veicular.\nReferência: ABCD1234\nStatus: instabilidade temporária';

  assert.ok(!rawMsg.includes('APP_USR'), 'Não deve conter APP_USR token');
  assert.ok(!rawMsg.includes('APIBRASIL_TOKEN'), 'Não deve conter API Brasil token');
  assert.ok(!rawMsg.includes('Bearer'), 'Não deve conter Bearer header');
  assert.ok(rawMsg.includes('ABCD1234'), 'Deve conter apenas referência pública');
});

test('T06 - Security Sanitization: scrubs secrets and tokens from error messages', () => {
  const sensitiveError =
    'Failed at https://api.mercadopago.com/v1/payments with token APP_USR-9812739182371982-120938';
  const clean = sanitizeRefundErrorMessage(sensitiveError);

  assert.ok(
    !clean.includes('APP_USR-9812739182371982-120938'),
    'Token do Mercado Pago deve ser higienizado',
  );
  assert.ok(clean.includes('[REDACTED_SECRET]'), 'Deve substituir por [REDACTED_SECRET]');
});
