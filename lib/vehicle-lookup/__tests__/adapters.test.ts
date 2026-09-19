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
    assert.strictEqual(parsed.data?.placa, 'QYR8B57');
    assert.strictEqual(parsed.data?.dadosBasicosDoVeiculo?.marca, 'YAMAHA');
    assert.strictEqual(parsed.data?.marcaModelo, 'YAMAHA/FZ25 FAZER');
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
    assert.strictEqual(risk.has_active_gravamen, false); // Gravame baixado pelo agente financeiro
    assert.strictEqual(risk.has_debts, false);
    assert.strictEqual(risk.has_auction_record, false);
    assert.strictEqual(risk.has_accident_indication, false);
    assert.strictEqual(risk.risk_level, 'LOW');
  });

  it('consolidates debts and infractions from baseEstadual', () => {
    const parsed = parseApiBrasilVehicleResponse(mockPayload);
    const debts = toVehicleDebtsSummary(parsed);

    assert.strictEqual(debts.total_amount, 0);
    assert.strictEqual(debts.has_fines, false);
    assert.strictEqual(debts.has_ipva_debts, false);
    assert.strictEqual(debts.has_licensing_debts, false);
  });

  it('correctly classifies Pessoa Jurídica vs Pessoa Física and masks according to LGPD', () => {
    const parsed = parseApiBrasilVehicleResponse(mockPayload);
    const history = toVehicleHistorySummary(parsed);

    assert.strictEqual(history.previous_owners.length, 1);
    const owner1 = history.previous_owners[0];
    assert.strictEqual(owner1.state, 'PE');
    assert.strictEqual(owner1.masked_document?.length! > 0, true);
  });

  it('extracts database summary columns for PostgreSQL insert', () => {
    const parsed = parseApiBrasilVehicleResponse(mockPayload);
    const cols = extractDatabaseSummaryColumns(parsed, mockPayload);

    assert.strictEqual(cols.plate_normalized, 'QYR8B57');
    assert.strictEqual(cols.plate_display, 'QYR8B57');
    assert.strictEqual(cols.brand, 'YAMAHA');
    assert.strictEqual(cols.model, 'FZ25 FAZER');
    assert.strictEqual(cols.chassis_masked?.startsWith('9C6'), true);
    assert.strictEqual(cols.renavam_masked?.endsWith('6693'), true);
  });

  it('transforms database record into InternalVehicleConsultationDto and CustomerVehicleReportDto with enriched metadata', () => {
    const fakeRecord: VehicleConsultationRecord = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      plate_normalized: 'QYR8B57',
      plate_display: 'QYR-8B57',
      consultation_type: 'veiculos-total',
      provider: 'apibrasil',
      raw_response: mockPayload,
      response_schema_version: '1.0',
      status: 'COMPLETED',
      provider_status_code: 200,
      provider_error: false,
      provider_message: 'Dados validos!',
      mode: 'mock',
      is_mock: true,
      is_chargeable: false,
      charged_amount: 0,
      provider_balance_before: 46.06,
      provider_balance_after: 16.06,
      provider_tax: 30,
      vehicle_type: 'MOTOCICLETA',
      brand: 'YAMAHA',
      model: 'FZ25 FAZER',
      vehicle_description: 'FZ25 FAZER',
      year_manufacture: 2021,
      year_model: 2021,
      color: 'VERMELHA',
      state: 'PE',
      city: 'OLINDA',
      chassis_masked: '9C6******3711',
      renavam_masked: '*******6693',
      risk_level: 'LOW',
      risk_index: 10,
      has_active_theft_robbery: false,
      has_judicial_restriction: false,
      has_financial_restriction: false,
      has_active_gravamen: false,
      has_auction_record: false,
      has_accident_indication: false,
      has_debts: false,
      debts_total_amount: 0,
      confirmation_at: new Date().toISOString(),
      confirmed_by: '123e4567-e89b-12d3-a456-426614174001',
      confirmation_plate: 'QYR-8B57',
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
    assert.strictEqual(internalDto.summary.brand, 'YAMAHA');
    assert.strictEqual(internalDto.fipe.price, 18649);

    const summaryDto = toVehicleConsultationSummaryDto(fakeRecord);
    assert.strictEqual(summaryDto.id, fakeRecord.id);
    assert.strictEqual(summaryDto.brand, 'YAMAHA');

    const customerDto = toCustomerVehicleReportDto(internalDto);
    assert.strictEqual(customerDto.brand, 'YAMAHA');
    assert.strictEqual(customerDto.procedural_verdict, 'APPROVED');
    assert.strictEqual(customerDto.commercial_indicators?.has_sale_communication, false);
    assert.strictEqual(customerDto.disclaimer.includes('API Brasil'), true);
  });
});
