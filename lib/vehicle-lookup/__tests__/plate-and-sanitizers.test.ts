import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  normalizeBrazilianPlate,
  isValidBrazilianPlate,
  formatBrazilianPlate,
  getPlateType,
} from '../plate.ts';
import {
  maskCpf,
  maskCnpj,
  maskChassis,
  maskRenavam,
  maskEngine,
} from '../sanitizers/index.ts';

describe('Brazilian Plate Normalizer and Validator', () => {
  it('normalizes plates by removing spaces, hyphens and lowercasing', () => {
    assert.strictEqual(normalizeBrazilianPlate('abc-1234'), 'ABC1234');
    assert.strictEqual(normalizeBrazilianPlate('bra2e19'), 'BRA2E19');
    assert.strictEqual(normalizeBrazilianPlate(' BRA-2E19 '), 'BRA2E19');
    assert.strictEqual(normalizeBrazilianPlate(''), '');
    assert.strictEqual(normalizeBrazilianPlate(null), '');
  });

  it('validates legacy and mercosul format correctly', () => {
    assert.strictEqual(isValidBrazilianPlate('ABC-1234'), true);
    assert.strictEqual(isValidBrazilianPlate('ABC1234'), true);
    assert.strictEqual(isValidBrazilianPlate('BRA2E19'), true);
    assert.strictEqual(isValidBrazilianPlate('BRA-2E19'), true);
    assert.strictEqual(isValidBrazilianPlate('RIO2A18'), true);

    // Invalid plates
    assert.strictEqual(isValidBrazilianPlate('ABC123'), false);
    assert.strictEqual(isValidBrazilianPlate('ABCD1234'), false);
    assert.strictEqual(isValidBrazilianPlate('1234ABC'), false);
    assert.strictEqual(isValidBrazilianPlate(''), false);
    assert.strictEqual(isValidBrazilianPlate(null), false);
  });

  it('formats plates for display', () => {
    assert.strictEqual(formatBrazilianPlate('ABC1234'), 'ABC-1234');
    assert.strictEqual(formatBrazilianPlate('BRA2E19'), 'BRA-2E19');
    assert.strictEqual(formatBrazilianPlate('abc1234'), 'ABC-1234');
  });

  it('identifies plate format type', () => {
    assert.strictEqual(getPlateType('ABC1234'), 'legacy');
    assert.strictEqual(getPlateType('BRA2E19'), 'mercosul');
    assert.strictEqual(getPlateType('INVALID'), 'invalid');
  });
});

describe('LGPD Privacy Sanitizers', () => {
  it('masks CPF correctly', () => {
    assert.strictEqual(maskCpf('12345678900'), '***.456.789-**');
    assert.strictEqual(maskCpf('123.456.789-00'), '***.456.789-**');
    assert.strictEqual(maskCpf(''), '***.***.***-**');
    assert.strictEqual(maskCpf(null), '***.***.***-**');
  });

  it('masks CNPJ correctly', () => {
    assert.strictEqual(maskCnpj('12345678000195'), '**.***.678/0001-**');
    assert.strictEqual(maskCnpj('12.345.678/0001-95'), '**.***.678/0001-**');
    assert.strictEqual(maskCnpj(''), '**.***.***/****-**');
  });

  it('masks Chassis correctly', () => {
    assert.strictEqual(maskChassis('9BWCA05Z4BP123456'), '9BW******3456');
    assert.strictEqual(maskChassis(''), '***');
    assert.strictEqual(maskChassis(null), '***');
  });

  it('masks Renavam correctly', () => {
    assert.strictEqual(maskRenavam('00123456789'), '*******6789');
    assert.strictEqual(maskRenavam(''), '***');
  });

  it('masks Engine correctly', () => {
    assert.strictEqual(maskEngine('NC23E1005678'), 'NC2****678');
    assert.strictEqual(maskEngine(''), '***');
  });
});
