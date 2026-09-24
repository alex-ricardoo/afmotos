import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  calculateWarrantyEndDate,
  getSaoPauloCalendarParts,
  getWarrantyInfo,
  formatDateBR,
  calculateCalendarDaysDifference,
} from '../calculator.ts';

describe('Commercial Warranty Engine & Calculator Suite', () => {
  it('1. should calculate exactly 3 calendar-months for standard mid-month date', () => {
    // 24/09/2026 + 3 meses = 24/12/2026
    const end = calculateWarrantyEndDate('2026-09-24T12:00:00Z', 3);
    assert.strictEqual(end, '2026-12-24');
  });

  it('2. should clamp to last day of target month when day overflows (August 31 -> November 30)', () => {
    // 31/08/2026 + 3 meses = 30/11/2026 (novembro só tem 30 dias)
    const end = calculateWarrantyEndDate('2026-08-31T15:00:00-03:00', 3);
    assert.strictEqual(end, '2026-11-30');
  });

  it('3. should handle leap years correctly in February', () => {
    // Ano não bissexto: 30/11/2026 + 3 meses = 28/02/2027
    const endNonLeap = calculateWarrantyEndDate('2026-11-30T10:00:00-03:00', 3);
    assert.strictEqual(endNonLeap, '2027-02-28');

    // Ano bissexto: 30/11/2027 + 3 meses = 29/02/2028 (2028 é bissexto)
    const endLeap = calculateWarrantyEndDate('2027-11-30T10:00:00-03:00', 3);
    assert.strictEqual(endLeap, '2028-02-29');

    // 29 de fevereiro em bissexto + 3 meses: 29/02/2028 + 3 meses = 29/05/2028
    const fromLeap = calculateWarrantyEndDate('2028-02-29T10:00:00-03:00', 3);
    assert.strictEqual(fromLeap, '2028-05-29');
  });

  it('4. should handle year transitions seamlessly (October -> January, December -> March)', () => {
    // 31/10/2026 + 3 meses = 31/01/2027
    const octToEnd = calculateWarrantyEndDate('2026-10-31T12:00:00-03:00', 3);
    assert.strictEqual(octToEnd, '2027-01-31');

    // 15/12/2026 + 3 meses = 15/03/2027
    const decToEnd = calculateWarrantyEndDate('2026-12-15T12:00:00-03:00', 3);
    assert.strictEqual(decToEnd, '2027-03-15');
  });

  it('5. should support custom duration in months (e.g. 6 months or 12 months)', () => {
    // 10/01/2026 + 6 meses = 10/07/2026
    const sixMonths = calculateWarrantyEndDate('2026-01-10T12:00:00-03:00', 6);
    assert.strictEqual(sixMonths, '2026-07-10');

    // 10/01/2026 + 12 meses = 10/01/2027
    const twelveMonths = calculateWarrantyEndDate('2026-01-10T12:00:00-03:00', 12);
    assert.strictEqual(twelveMonths, '2027-01-10');
  });

  it('6. should reject invalid months range', () => {
    assert.throws(() => calculateWarrantyEndDate('2026-09-24', 0), /Prazo de garantia/);
    assert.throws(() => calculateWarrantyEndDate('2026-09-24', -3), /Prazo de garantia/);
    assert.throws(() => calculateWarrantyEndDate('2026-09-24', 61), /Prazo de garantia/);
  });

  it('7. should respect America/Sao_Paulo timezone even on late UTC night transitions', () => {
    // 24/09/2026 23:30 em Brasília (UTC-3) é 25/09/2026 02:30 UTC
    // Mas no Brasil a data da emissão é dia 24!
    const parts = getSaoPauloCalendarParts('2026-09-25T02:30:00Z');
    assert.strictEqual(parts.year, 2026);
    assert.strictEqual(parts.month, 9);
    assert.strictEqual(parts.day, 24);

    const end = calculateWarrantyEndDate('2026-09-25T02:30:00Z', 3);
    assert.strictEqual(end, '2026-12-24');
  });

  it('8. should format date string correctly to pt-BR (DD/MM/AAAA)', () => {
    assert.strictEqual(formatDateBR('2026-12-24'), '24/12/2026');
    assert.strictEqual(formatDateBR('2026-12-24T00:00:00.000Z'), '24/12/2026');
    assert.strictEqual(formatDateBR(''), '');
    assert.strictEqual(formatDateBR(null), '');
  });

  it('9. should correctly calculate calendar days difference', () => {
    assert.strictEqual(calculateCalendarDaysDifference('2026-09-24', '2026-09-24'), 0);
    assert.strictEqual(calculateCalendarDaysDifference('2026-09-24', '2026-09-25'), 1);
    assert.strictEqual(calculateCalendarDaysDifference('2026-09-24', '2026-10-04'), 10);
    assert.strictEqual(calculateCalendarDaysDifference('2026-09-24', '2026-09-23'), -1);
  });

  describe('getWarrantyInfo Status Transitions', () => {
    it('10. should return NO_WARRANTY when is_repasse is true', () => {
      const info = getWarrantyInfo({
        is_repasse: true,
        warranty_issued_at: '2026-09-24T12:00:00Z',
        warranty_ends_at: '2026-12-24',
      });

      assert.strictEqual(info.status, 'NO_WARRANTY');
      assert.strictEqual(info.isRepasse, true);
      assert.strictEqual(info.endsAt, null);
      assert.strictEqual(info.daysRemaining, null);
      assert.strictEqual(info.label, 'Sem garantia (Repasse)');
    });

    it('11. should return AWAITING_ISSUANCE when sale is not repasse and warranty dates are null', () => {
      const info = getWarrantyInfo({
        is_repasse: false,
        warranty_issued_at: null,
        warranty_ends_at: null,
      });

      assert.strictEqual(info.status, 'AWAITING_ISSUANCE');
      assert.strictEqual(info.isRepasse, false);
      assert.strictEqual(info.endsAt, null);
      assert.strictEqual(info.daysRemaining, null);
      assert.strictEqual(info.label, 'Aguardando emissão');
    });

    it('12. should return UNDER_WARRANTY when remaining days are greater than 15', () => {
      // Data final: 24/12/2026. Referência: 24/09/2026 (91 dias restantes)
      const info = getWarrantyInfo(
        {
          is_repasse: false,
          warranty_issued_at: '2026-09-24T12:00:00Z',
          warranty_ends_at: '2026-12-24',
        },
        '2026-09-24T12:00:00Z',
      );

      assert.strictEqual(info.status, 'UNDER_WARRANTY');
      assert.strictEqual(info.label, 'Em garantia');
      assert.strictEqual(info.daysRemaining, 91);
      assert.strictEqual(info.formattedEndsAt, '24/12/2026');
      assert.strictEqual(info.formattedIssuedAt, '24/09/2026');
    });

    it('13. should return EXPIRING_SOON when remaining days are between 0 and 15', () => {
      // Data final: 24/12/2026. Referência: 15/12/2026 (9 dias restantes)
      const info = getWarrantyInfo(
        {
          is_repasse: false,
          warranty_issued_at: '2026-09-24T12:00:00Z',
          warranty_ends_at: '2026-12-24',
        },
        '2026-12-15T12:00:00Z',
      );

      assert.strictEqual(info.status, 'EXPIRING_SOON');
      assert.strictEqual(info.label, 'Vence em breve');
      assert.strictEqual(info.daysRemaining, 9);

      // No último dia exato (0 dias restantes): ainda EXPIRING_SOON (dia inclusivo!)
      const lastDayInfo = getWarrantyInfo(
        {
          is_repasse: false,
          warranty_issued_at: '2026-09-24T12:00:00Z',
          warranty_ends_at: '2026-12-24',
        },
        '2026-12-24T12:00:00Z',
      );
      assert.strictEqual(lastDayInfo.status, 'EXPIRING_SOON');
      assert.strictEqual(lastDayInfo.daysRemaining, 0);
    });

    it('14. should return EXPIRED when reference date is past warranty_ends_at', () => {
      // Data final: 24/12/2026. Referência: 25/12/2026 (-1 dia)
      const info = getWarrantyInfo(
        {
          is_repasse: false,
          warranty_issued_at: '2026-09-24T12:00:00Z',
          warranty_ends_at: '2026-12-24',
        },
        '2026-12-25T12:00:00Z',
      );

      assert.strictEqual(info.status, 'EXPIRED');
      assert.strictEqual(info.label, 'Garantia encerrada');
      assert.strictEqual(info.daysRemaining, -1);
    });
  });
});
