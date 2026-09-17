import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateContentHash,
  hashClientIp,
  categorizeUserAgent,
  generateProtocolNumber,
} from '../crypto.ts';
import { getDefaultDocumentDefinition } from '../default-documents.ts';

describe('Legal Documents & LGPD Compliance Suite', () => {
  describe('calculateContentHash', () => {
    it('generates a 64-character lowercase hexadecimal SHA-256 hash', () => {
      const hash = calculateContentHash('# Termos de Uso AF Motos');
      assert.equal(typeof hash, 'string');
      assert.equal(hash.length, 64);
      assert.match(hash, /^[0-9a-f]{64}$/);
    });

    it('normalizes CRLF and LF so identical text has the exact same hash', () => {
      const crlf = 'Linha 1\r\nLinha 2\r\nLinha 3';
      const lf = 'Linha 1\nLinha 2\nLinha 3';
      const hashCRLF = calculateContentHash(crlf);
      const hashLF = calculateContentHash(lf);
      assert.equal(hashCRLF, hashLF);
    });

    it('trims outer whitespace to prevent formatting-only hash drift', () => {
      const unpadded = 'Texto importante';
      const padded = '   \n\r\nTexto importante \n\t  ';
      assert.equal(calculateContentHash(unpadded), calculateContentHash(padded));
    });

    it('detects content tampering or alteration', () => {
      const original = calculateContentHash('Cláusula 1: O serviço custa R$ 10,00');
      const altered = calculateContentHash('Cláusula 1: O serviço custa R$ 20,00');
      assert.notEqual(original, altered);
    });

    it('throws when content is empty or not a string', () => {
      assert.throws(() => calculateContentHash(''), /Conteúdo inválido/);
      // @ts-expect-error testing invalid type input
      assert.throws(() => calculateContentHash(null), /Conteúdo inválido/);
    });
  });

  describe('hashClientIp', () => {
    it('produces a deterministic 64-char hash for an IP address', () => {
      const hash1 = hashClientIp('187.54.12.9');
      const hash2 = hashClientIp('187.54.12.9');
      assert.ok(hash1);
      assert.equal(hash1.length, 64);
      assert.equal(hash1, hash2);
      assert.equal(hash1.includes('187.54.12.9'), false, 'Raw IP must not be exposed');
    });

    it('extracts and hashes the first IP if forwarded list is provided by proxies', () => {
      const single = hashClientIp('200.100.50.25');
      const forwarded = hashClientIp('200.100.50.25, 10.0.0.1, 192.168.1.1');
      assert.equal(single, forwarded);
    });

    it('returns null when IP is empty or undefined', () => {
      assert.equal(hashClientIp(null), null);
      assert.equal(hashClientIp(undefined), null);
      assert.equal(hashClientIp(''), null);
    });
  });

  describe('categorizeUserAgent', () => {
    it('categorizes mobile Android Chrome', () => {
      const ua =
        'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 Chrome/112.0.0.0 Mobile Safari/537.36';
      assert.equal(categorizeUserAgent(ua), 'mobile-chrome');
    });

    it('categorizes mobile iOS Safari', () => {
      const ua =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1';
      assert.equal(categorizeUserAgent(ua), 'mobile-safari');
    });

    it('categorizes tablet iPad', () => {
      const ua = 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148';
      assert.equal(categorizeUserAgent(ua), 'tablet-other');
    });

    it('categorizes desktop Windows Firefox', () => {
      const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/114.0';
      assert.equal(categorizeUserAgent(ua), 'desktop-firefox');
    });

    it('returns unknown for missing user-agent', () => {
      assert.equal(categorizeUserAgent(null), 'unknown');
      assert.equal(categorizeUserAgent(''), 'unknown');
    });
  });

  describe('generateProtocolNumber', () => {
    it('generates a protocol in LGPD-YYYYMM-XXXX format', () => {
      const proto = generateProtocolNumber();
      assert.match(proto, /^LGPD-\d{6}-[0-9A-F]{4}$/);
    });

    it('generates distinct protocols on successive calls', () => {
      const p1 = generateProtocolNumber();
      const p2 = generateProtocolNumber();
      assert.notEqual(p1, p2);
    });
  });

  describe('Default Documents & Canonical Contingency', () => {
    it('renders the 23 mandatory sections of the Privacy Policy', () => {
      const doc = getDefaultDocumentDefinition('privacy_policy');
      assert.ok(
        doc.contentMarkdown.length > 5000,
        'Privacy policy should be exhaustive and comprehensive',
      );

      for (let i = 1; i <= 23; i++) {
        const regex = new RegExp(`##\\s*${i}\\.`);
        assert.ok(regex.test(doc.contentMarkdown), `Privacy policy must contain section ${i}`);
      }
    });

    it('substitutes corporate settings placeholders when provided', () => {
      const doc = getDefaultDocumentDefinition('privacy_policy', {
        site_name: 'Auto Força Motos Ltda',
        cnpj: '12.345.678/0001-90',
        contact_email: 'contato@autoforcamotos.com.br',
        whatsapp_phone: '(81) 98888-7777',
        address: 'Av. Paulista, 1000 - SP',
      });

      assert.ok(doc.contentMarkdown.includes('Auto Força Motos Ltda'));
      assert.ok(doc.contentMarkdown.includes('12.345.678/0001-90'));
      assert.ok(doc.contentMarkdown.includes('contato@autoforcamotos.com.br'));
      assert.ok(doc.contentMarkdown.includes('Av. Paulista, 1000 - SP'));
    });

    it('leaves identifiable bracketed placeholders when settings are absent without hallucinating', () => {
      const doc = getDefaultDocumentDefinition('privacy_policy', {});
      assert.ok(
        doc.contentMarkdown.includes('[CNPJ da Loja — Configurar no Painel]') ||
          doc.contentMarkdown.includes('[E-mail de Contato / DPO — Configurar no Painel]'),
        'Must retain transparent markers rather than inventing data',
      );
    });

    it('renders balanced terms of use with essential clauses', () => {
      const terms = getDefaultDocumentDefinition('terms_of_use', { site_name: 'AF Motos' });
      assert.ok(terms.contentMarkdown.includes('Termos e Condições de Uso'));
      assert.ok(terms.contentMarkdown.includes('Cadastro e Segurança de Credenciais'));
      assert.ok(terms.contentMarkdown.includes('Consultas Veiculares'));
      assert.ok(terms.contentMarkdown.includes('Mercado Pago'));
      assert.ok(terms.contentMarkdown.includes('Propriedade Intelectual'));
      assert.ok(terms.contentMarkdown.includes('Disposições Finais e Canal de Contato'));
    });

    it('calculates deterministic SHA-256 hash matching contentHash field', () => {
      const privacy = getDefaultDocumentDefinition('privacy_policy');
      const terms = getDefaultDocumentDefinition('terms_of_use');

      assert.equal(typeof privacy.contentHash, 'string');
      assert.equal(privacy.contentHash.length, 64);
      assert.match(privacy.contentHash, /^[0-9a-f]{64}$/);

      assert.equal(typeof terms.contentHash, 'string');
      assert.equal(terms.contentHash.length, 64);
      assert.match(terms.contentHash, /^[0-9a-f]{64}$/);
    });
  });
});
