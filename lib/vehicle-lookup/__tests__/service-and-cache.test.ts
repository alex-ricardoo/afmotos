import { describe, it } from 'node:test';
import assert from 'node:assert';
import { executeVehiclePlateLookup, findExistingConsultation } from '../service.ts';
import { normalizeBrazilianPlate } from '../plate.ts';
import type { VehicleConsultationRecord } from '../types.ts';

// Mock Supabase Client for isolated unit testing
function createMockSupabase(initialRecords: VehicleConsultationRecord[] = []) {
  const records = [...initialRecords];

  return {
    from: (tableName: string) => {
      return {
        select: (fields?: string) => {
          let filtered = [...records];
          const queryBuilder: any = {
            eq: (col: string, val: any) => {
              filtered = filtered.filter((r: any) => r[col] === val);
              return queryBuilder;
            },
            in: (col: string, vals: any[]) => {
              filtered = filtered.filter((r: any) => vals.includes(r[col]));
              return queryBuilder;
            },
            order: (col: string, opts?: { ascending?: boolean }) => {
              return queryBuilder;
            },
            limit: (n: number) => {
              filtered = filtered.slice(0, n);
              return queryBuilder;
            },
            maybeSingle: async () => {
              return { data: filtered[0] || null, error: null };
            },
            single: async () => {
              return { data: filtered[0] || null, error: null };
            },
            range: (from: number, to: number) => {
              return { data: filtered.slice(from, to + 1), count: filtered.length, error: null };
            },
          };
          return queryBuilder;
        },
        insert: (payload: any) => {
          const newRecord = {
            ...payload,
            id: 'generated-uuid-' + Math.random().toString(36).substring(7),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          records.push(newRecord);
          return {
            select: () => ({
              single: async () => ({ data: newRecord, error: null }),
            }),
          };
        },
      };
    },
  } as any;
}

describe('Vehicle Lookup Service & Cache Engine', () => {
  it('rejects invalid plates before any execution', async () => {
    const supabase = createMockSupabase();
    await assert.rejects(
      async () => {
        await executeVehiclePlateLookup(
          {
            plate: 'INVALID123',
            userId: 'user-1',
            confirmedPlate: 'INVALID123',
          },
          supabase
        );
      },
      {
        name: 'Error',
        message: /Placa inválida/,
      }
    );
  });

  it('executes mock lookup successfully and persists with is_mock=true', async () => {
    const supabase = createMockSupabase();
    const result = await executeVehiclePlateLookup(
      {
        plate: 'BRA-2E19',
        userId: 'user-1',
        confirmedPlate: 'BRA-2E19',
      },
      supabase
    );

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.isCacheHit, false);
    assert.strictEqual(result.record.is_mock, true);
    assert.strictEqual(result.record.charged_amount, 0);
    assert.strictEqual(result.record.plate_normalized, 'BRA2E19');
    assert.strictEqual(result.record.brand, 'MARCA FICTICIA');
    assert.strictEqual(result.record.status, 'COMPLETED');
  });

  it('returns cached consultation on repeated lookups without new insert', async () => {
    const existingLiveRecord: VehicleConsultationRecord = {
      id: 'existing-id-1',
      plate_normalized: 'BRA2E19',
      plate_display: 'BRA-2E19',
      consultation_type: 'veiculos-total',
      provider: 'apibrasil',
      raw_response: { error: false, dados: { placa: 'BRA2E19', marca: 'HONDA', modelo: 'CB 600F' } },
      response_schema_version: '1.0',
      status: 'COMPLETED',
      provider_status_code: 200,
      provider_error: false,
      provider_message: null,
      mode: 'mock',
      is_mock: true,
      is_chargeable: false,
      charged_amount: 0,
      provider_balance_before: null,
      provider_balance_after: null,
      provider_tax: null,
      vehicle_type: 'MOTOCICLO',
      brand: 'HONDA',
      model: 'CB 600F HORNET',
      vehicle_description: 'CB 600F',
      year_manufacture: 2021,
      year_model: 2022,
      color: 'PRETA',
      state: 'SP',
      city: 'SAO PAULO',
      chassis_masked: '9BW******3456',
      renavam_masked: '*******4321',
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
      confirmation_at: new Date().toISOString(),
      confirmed_by: 'user-1',
      confirmation_plate: 'BRA-2E19',
      confirmation_message_version: 'v1.0',
      motorcycle_id: null,
      sell_request_id: null,
      consignment_id: null,
      lead_id: null,
      consulted_at: new Date().toISOString(),
      consulted_by: 'user-1',
      pdf_generated_at: null,
      pdf_generation_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const supabase = createMockSupabase([existingLiveRecord]);

    const result = await executeVehiclePlateLookup(
      {
        plate: 'BRA2E19',
        userId: 'user-1',
        confirmedPlate: 'BRA2E19',
      },
      supabase
    );

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.isCacheHit, true);
    assert.strictEqual(result.record.id, 'existing-id-1');
  });
});
