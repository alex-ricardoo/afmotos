import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildVehicleHistoryWhatsAppUrl, buildVehicleHistoryB2BWhatsAppUrl } from '../whatsapp.ts';
import { formatBrazilianPlate, isValidBrazilianPlate, normalizeBrazilianPlate } from '../../vehicle-lookup/plate.ts';

describe('Vehicle History WhatsApp helper and plate validation', () => {
  it('should validate and normalize legacy plates', () => {
    assert.strictEqual(isValidBrazilianPlate('abc-1234'), true);
    assert.strictEqual(normalizeBrazilianPlate('abc-1234'), 'ABC1234');
    assert.strictEqual(formatBrazilianPlate('abc-1234'), 'ABC-1234');
  });

  it('should validate and normalize mercosul plates', () => {
    assert.strictEqual(isValidBrazilianPlate('bra2e19'), true);
    assert.strictEqual(normalizeBrazilianPlate('bra-2e19'), 'BRA2E19');
    assert.strictEqual(formatBrazilianPlate('bra2e19'), 'BRA2E19');
  });

  it('should reject invalid plates', () => {
    assert.strictEqual(isValidBrazilianPlate('123'), false);
    assert.strictEqual(isValidBrazilianPlate('ABCD-1234'), false);
    assert.strictEqual(isValidBrazilianPlate(''), false);
    assert.strictEqual(isValidBrazilianPlate(null), false);
  });

  it('should build WhatsApp link with plate and dynamic price', () => {
    const url = buildVehicleHistoryWhatsAppUrl({
      phone: '81985901175',
      plate: 'BRA2E19',
      price: 39.99,
      siteName: 'AF Motos',
    });

    assert.ok(url.includes('https://wa.me/5581985901175'));
    assert.ok(url.includes('BRA2E19'));
    assert.ok(url.includes('39%2C99')); // URL encoded R$ 39,99
  });

  it('should build WhatsApp link for general questions when plate is absent', () => {
    const url = buildVehicleHistoryWhatsAppUrl({
      phone: '5581985901175',
      plate: '',
      price: 39.99,
      siteName: 'AF Motos',
    });

    assert.ok(url.includes('https://wa.me/5581985901175'));
    assert.ok(url.includes('d%C3%BAvidas')); // "dúvidas" URL encoded
  });

  it('should support custom message templates with tags', () => {
    const url = buildVehicleHistoryWhatsAppUrl({
      phone: '81985901175',
      plate: 'ABC1234',
      price: 49.90,
      template: 'Placa {PLATE} na loja {SITE_NAME} por {PRICE}',
      siteName: 'AF Motos',
    });

    const decoded = decodeURIComponent(url);
    assert.ok(decoded.includes('Placa ABC-1234 na loja AF Motos por'));
  });

  it('should build packages WhatsApp link with pre-formatted message', () => {
    const url = buildVehicleHistoryB2BWhatsAppUrl('81985901175');
    assert.ok(url.includes('https://wa.me/5581985901175'));
    const decoded = decodeURIComponent(url);
    assert.ok(decoded.includes('tabela de preços e pacotes de consultas com desconto'));
  });
});
