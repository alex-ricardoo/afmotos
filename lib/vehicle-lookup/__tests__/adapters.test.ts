import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseApiBrasilVehicleResponse } from '../adapters/apibrasil-vehicle-total.ts';
import { toVehicleRiskSummary } from '../adapters/vehicle-risk.ts';
import { toVehicleDebtsSummary } from '../adapters/vehicle-debts.ts';
import { toVehicleHistorySummary } from '../adapters/vehicle-history.ts';
import {
  extractDatabaseSummaryColumns,
  toInternalVehicleConsultationDto,
  toVehicleConsultationSummaryDto,
} from '../adapters/vehicle-summary.ts';
import { toCustomerVehicleReportDto } from '../adapters/vehicle-pdf.ts';
import type { VehicleConsultationRecord } from '../types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockFixturePath = path.resolve(__dirname, '../fixtures/vehicle-total.mock.json');
const mockPayload = JSON.parse(fs.readFileSync(mockFixturePath, 'utf-8'));

describe('Vehicle Lookup Adapters with Authentic API Brasil Payload', () => {
  it('parses complete authentic mock payload without errors', () => {
    const parsed = parseApiBrasilVehicleResponse(mockPayload);
    assert.strictEqual(parsed.error, false);
    assert.strictEqual(parsed.data?.placa, 'ABC1234');
    assert.strictEqual(parsed.data?.dadosBasicosDoVeiculo?.marca, 'MARCA FICTICIA');
  });

  it('tolerantly parses null or empty payloads without throwing', () => {
    const parsedNull = parseApiBrasilVehicleResponse(null);
    assert.strictEqual(parsedNull.error, true);
    assert.strictEqual(parsedNull.data, null);

    const parsedEmpty = parseApiBrasilVehicleResponse({});
    assert.strictEqual(parsedEmpty.error, false);
    assert.strictEqual(parsedEmpty.data, null);
  });

  it('calculates risk matrix and flags correctly for API Brasil structure', () => {
    const parsed = parseApiBrasilVehicleResponse(mockPayload);
    const risk = toVehicleRiskSummary(parsed);

    assert.strictEqual(risk.has_active_theft_robbery, false);
    assert.strictEqual(risk.has_judicial_restriction, false);
    assert.strictEqual(risk.has_active_gravamen, true); // Active gravamen in fintech
    assert.strictEqual(risk.has_debts, false);
    assert.strictEqual(risk.risk_level, 'MEDIUM');
  });

  it('consolidates debts and infractions from baseEstadual', () => {
    const parsed = parseApiBrasilVehicleResponse(mockPayload);
    const debts = toVehicleDebtsSummary(parsed);

    assert.strictEqual(debts.total_amount, 0);
    assert.strictEqual(debts.has_fines, false);
  });

  it('correctly classifies Pessoa Jurídica vs Pessoa Física and masks according to LGPD', () => {
    const parsed = parseApiBrasilVehicleResponse(mockPayload);
    const history = toVehicleHistorySummary(parsed);

    assert.strictEqual(history.previous_owners.length, 3);

    // 1. EMPRESA FICTICIA LTDA -> PJ
    const owner1 = history.previous_owners[0];
    assert.strictEqual(owner1.document_type, 'PJ');
    assert.strictEqual(owner1.masked_document?.includes('/'), true);

    // 2. LOCADORA DEMO SA -> PJ
    const owner2 = history.previous_owners[1];
    assert.strictEqual(owner2.document_type, 'PJ');
    assert.strictEqual(owner2.masked_document?.includes('/'), true);

    // 3. PESSOA FISICA TREINAMENTO -> PF
    const owner3 = history.previous_owners[2];
    assert.strictEqual(owner3.document_type, 'PF');
    assert.strictEqual(owner3.masked_document?.includes('-'), true);
  });

  it('extracts database summary columns for PostgreSQL insert', () => {
    const parsed = parseApiBrasilVehicleResponse(mockPayload);
    const cols = extractDatabaseSummaryColumns(parsed, mockPayload);

    assert.strictEqual(cols.plate_normalized, 'ABC1234');
    assert.strictEqual(cols.plate_display, 'ABC-1234');
    assert.strictEqual(cols.brand, 'MARCA FICTICIA');
    assert.strictEqual(cols.chassis_masked?.startsWith('8AJ'), true);
    assert.strictEqual(cols.renavam_masked?.endsWith('1222'), true);
  });

  it('transforms database record into InternalVehicleConsultationDto and CustomerVehicleReportDto with enriched metadata', () => {
    const fakeRecord: VehicleConsultationRecord = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      plate_normalized: 'ABC1234',
      plate_display: 'ABC-1234',
      consultation_type: 'veiculos-total',
      provider: 'apibrasil',
      raw_response: mockPayload,
      response_schema_version: '1.0',
      status: 'COMPLETED',
      provider_status_code: 200,
      provider_error: false,
      provider_message: 'Dados validos em homologacao!',
      mode: 'mock',
      is_mock: true,
      is_chargeable: false,
      charged_amount: 0,
      provider_balance_before: 105.66,
      provider_balance_after: 105.66,
      provider_tax: 0,
      vehicle_type: 'AUTOMOVEL',
      brand: 'MARCA FICTICIA',
      model: 'SUV CONCEITO FLEX',
      vehicle_description: 'SUV CONCEITO FLEX',
      year_manufacture: 2021,
      year_model: 2022,
      color: 'AZUL',
      state: 'SP',
      city: 'CIDADE INVENTADA',
      chassis_masked: '8AJ******3456',
      renavam_masked: '*******1222',
      risk_level: 'MEDIUM',
      risk_index: 35,
      has_active_theft_robbery: false,
      has_judicial_restriction: false,
      has_financial_restriction: true,
      has_active_gravamen: true,
      has_auction_record: false,
      has_accident_indication: false,
      has_debts: false,
      debts_total_amount: 0,
      confirmation_at: new Date().toISOString(),
      confirmed_by: '123e4567-e89b-12d3-a456-426614174001',
      confirmation_plate: 'ABC-1234',
      confirmation_message_version: 'v1.0',
      motorcycle_id: null,
      sell_request_id: null,
      consignment_id: null,
      lead_id: null,
      consulted_at: new Date().toISOString(),
      consulted_by: '123e4567-e89b-12d3-a456-426614174001',
      pdf_generated_at: null,
      pdf_generation_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const internalDto = toInternalVehicleConsultationDto(fakeRecord);
    assert.strictEqual(internalDto.id, fakeRecord.id);
    assert.strictEqual(internalDto.summary.brand, 'MARCA FICTICIA');
    assert.strictEqual(internalDto.fipe.price, 158900);

    const summaryDto = toVehicleConsultationSummaryDto(fakeRecord);
    assert.strictEqual(summaryDto.id, fakeRecord.id);
    assert.strictEqual(summaryDto.brand, 'MARCA FICTICIA');

    const customerDto = toCustomerVehicleReportDto(internalDto);
    assert.strictEqual(customerDto.brand, 'MARCA FICTICIA');
    assert.strictEqual(customerDto.procedural_verdict, 'ATTENTION');
    assert.strictEqual(customerDto.recalls_summary?.pending_count, 0);
    assert.strictEqual(customerDto.latest_km_record?.mileage, 12850);
    assert.strictEqual(customerDto.commercial_indicators?.has_rental_record, true);
    assert.strictEqual(customerDto.commercial_indicators?.has_sale_communication, false);
    assert.strictEqual(customerDto.disclaimer.includes('API Brasil'), true);
  });
});
