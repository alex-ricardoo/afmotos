import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { toPublicVehicleReportDto } from '../adapters/public-report-dto.ts';
import { toInternalVehicleConsultationDto } from '../adapters/vehicle-summary.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockFixturePath = path.resolve(__dirname, '../fixtures/vehicle-total.mock.json');
const mockPayload = JSON.parse(fs.readFileSync(mockFixturePath, 'utf-8'));

describe('Public Vehicle Report DTO Sanitization (LGPD & Security)', () => {
  const baseInternalDto = toInternalVehicleConsultationDto({
    id: '11111111-1111-1111-1111-111111111111',
    plate_normalized: 'PCQ5897',
    plate_display: 'PCQ-5897',
    consultation_type: 'veiculos-total',
    provider: 'apibrasil',
    raw_response: mockPayload,
    response_schema_version: '1.0',
    status: 'COMPLETED',
    provider_status_code: 200,
    provider_error: false,
    provider_message: 'Consulta realizada com sucesso',
    mode: 'mock',
    is_mock: true,
    is_chargeable: false,
    charged_amount: 12.5,
    provider_balance_before: null,
    provider_balance_after: null,
    provider_tax: null,
    vehicle_type: 'MOTO',
    brand: 'HONDA',
    model: 'CG 160 TITAN',
    vehicle_description: 'HONDA CG 160 TITAN',
    year_manufacture: 2022,
    year_model: 2022,
    color: 'AZUL',
    state: 'PE',
    city: 'RECIFE',
    chassis_masked: '9C2KC******1234',
    renavam_masked: '******5678',
    risk_level: 'LOW',
    risk_index: 0,
    has_active_theft_robbery: false,
    has_judicial_restriction: false,
    has_financial_restriction: false,
    has_active_gravamen: false,
    has_auction_record: false,
    has_accident_indication: false,
    has_debts: false,
    debts_total_amount: 0,
    confirmation_at: null,
    confirmed_by: null,
    confirmation_plate: null,
    confirmation_message_version: null,
    motorcycle_id: null,
    sell_request_id: null,
    consignment_id: null,
    lead_id: null,
    consulted_at: '2026-08-30T10:00:00Z',
    consulted_by: 'admin-user-id',
    pdf_generated_at: null,
    pdf_generation_count: 0,
    created_at: '2026-08-30T10:00:00Z',
    updated_at: '2026-08-30T10:00:00Z',
  });

  it('should generate a sanitized PublicVehicleReportDto without sensitive internal data', () => {
    const publicDto = toPublicVehicleReportDto(baseInternalDto, { shareId: 'share-uuid-123' });

    assert.strictEqual(publicDto.plate_display, 'PCQ-5897');
    assert.strictEqual(publicDto.share_id, 'share-uuid-123');
    assert.strictEqual(publicDto.is_mock, true);

    // Chassi and Renavam masked
    assert.strictEqual(publicDto.chassis_masked.includes('*'), true);
    assert.strictEqual(publicDto.renavam_masked.includes('*'), true);
    assert.strictEqual(publicDto.engine_masked.includes('*'), true);

    // Assure internal fields are not present on public DTO
    assert.strictEqual((publicDto as any).raw_response, undefined);
    assert.strictEqual((publicDto as any).charged_amount, undefined);
    assert.strictEqual((publicDto as any).provider_balance_before, undefined);
    assert.strictEqual((publicDto as any).provider_balance_after, undefined);
    assert.strictEqual((publicDto as any).consulted_by, undefined);
  });

  it('should properly mask owner CPF/CNPJ documents in owners history', () => {
    const modifiedDto = {
      ...baseInternalDto,
      history: {
        ...baseInternalDto.history,
        previous_owners: [
          {
            state: 'PE',
            period: '2021 a 2023',
            document_type: 'PF' as const,
            masked_document: '12345678900',
          },
        ],
      },
    };

    const publicDto = toPublicVehicleReportDto(modifiedDto as any);
    const owner = publicDto.owners_history?.records?.[0];
    assert.strictEqual(owner?.masked_document, '***.456.789-**');
  });

  it('should include institutional disclaimer and issuer information', () => {
    const publicDto = toPublicVehicleReportDto(baseInternalDto);
    assert.strictEqual(publicDto.issuer.company_name, 'AF Motos Comércio e Locação Ltda');
    assert.strictEqual(publicDto.issuer.trade_name, 'AF Motos');
    assert.strictEqual(publicDto.issuer.cnpj, '58.742.981/0001-08');
    assert.strictEqual(typeof publicDto.disclaimer, 'string');
  });
});
