import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { toVehicleHistorySummary } from '../adapters/vehicle-history.ts';
import { toCustomerVehicleReportDto } from '../adapters/vehicle-pdf.ts';
import { toPublicVehicleReportDto } from '../adapters/public-report-dto.ts';
import type { ApiBrasilVehicleResponse } from '../schema.ts';

describe('Auction Data Adapter & Multi-Payload Behavior', () => {
  test('Behavior 1: Should correctly parse Payload 1 with embedded photos, score, and rich record metadata', () => {
    const payload1: ApiBrasilVehicleResponse = {
      error: false,
      data: {
        placa: 'ABC1234',
        leilao: {
          descricao: 'Consta registro de leilao para o veiculo informado',
          registros: [
            {
              leiloeiro: 'NOME DO LEILOEIRO OFICIAL',
              dataLeilao: '15/08/2021',
              lote: '0123',
              comitente: 'BANCO BRADESCO FINANCIAMENTOS',
              condicaoGeral: 'RECUPERADO DE FINANCIAMENTO',
              tipoSinistro: 'PEQUENA MONTA / SEM SINISTRO',
              patio: 'OSASCO / SP',
              chassi: '9ZZZL00AA00012345',
              placa: 'ABC1234',
              marcaModelo: 'CHEVROLET/ONIX',
              fotos: [
                'https://link-da-foto.com/foto-frente.jpg',
                'https://link-da-foto.com/foto-traseira.jpg',
              ],
            },
          ],
          score: {
            aceitacao: 'Baixa',
            exigenciaVistoriaEspecial: 'Sim',
            percentualSobreRef: '-30%',
            pontuacao: '3',
            score: 'Risco Alto',
          },
        },
      },
    };

    const history = toVehicleHistorySummary(payload1);

    // 1. Validation of auction presence flag (prioritizes records.length > 0)
    assert.equal(history.has_auction, true);
    assert.equal(history.auction_records.length, 1);

    // 2. Validation of record fields
    const rec = history.auction_records[0];
    assert.equal(rec.auctioneer, 'NOME DO LEILOEIRO OFICIAL');
    assert.equal(rec.auction_date, '15/08/2021');
    assert.equal(rec.lot, '0123');
    assert.equal(rec.bidder, 'BANCO BRADESCO FINANCIAMENTOS');
    assert.equal(rec.condition, 'RECUPERADO DE FINANCIAMENTO');
    assert.equal(rec.claim_type, 'PEQUENA MONTA / SEM SINISTRO');
    assert.equal(rec.yard, 'OSASCO / SP');
    assert.equal(rec.chassis, '9ZZZL00AA00012345');
    assert.equal(rec.plate, 'ABC1234');
    assert.equal(rec.make_model, 'CHEVROLET/ONIX');
    assert.deepEqual(rec.photos, [
      'https://link-da-foto.com/foto-frente.jpg',
      'https://link-da-foto.com/foto-traseira.jpg',
    ]);

    // 3. Validation of score fields
    assert.ok(history.auction_score);
    assert.equal(history.auction_score?.acceptance, 'Baixa');
    assert.equal(history.auction_score?.special_inspection_required, 'Sim');
    assert.equal(history.auction_score?.reference_percentage, '-30%');
    assert.equal(history.auction_score?.points, '3');
    assert.equal(history.auction_score?.score_label, 'Risco Alto');

    // 4. Validation of consolidated photos list
    assert.ok(history.auction_photos);
    assert.equal(history.auction_photos?.length, 2);
    assert.equal(history.auction_photos?.[0].preview_src, 'https://link-da-foto.com/foto-frente.jpg');
    assert.equal(history.auction_photos?.[1].preview_src, 'https://link-da-foto.com/foto-traseira.jpg');
  });

  test('Behavior 2: Should correctly parse Payload 2 with fotosLoteVeiculo (URL + base64) and root fotos', () => {
    const payload2: ApiBrasilVehicleResponse = {
      error: false,
      data: {
        placa: 'ABC1234',
        leilao: {
          descricao: 'Consta registro de leilão para o veículo informado',
          registros: [
            {
              leiloeiro: 'FREITAS LEILOEIRO OFICIAL',
              dataLeilao: '15/08/2021',
              lote: '1234',
              comitente: 'PORTO SEGURO CIA DE SEGUROS GERAIS',
              condicaoGeral: 'RECUPERAVEL / SUCATA',
              patio: 'SAO PAULO / SP',
              chassi: '9ZZZL00AA00012345',
              placa: 'ABC1234',
              tipoSinistro: 'COLISAO / PEQUENA MONTA',
            },
          ],
          score: {
            aceitacao: 'RESTRITA',
            exigenciaVistoriaEspecial: 'SIM',
            percentualSobreRef: '70',
            pontuacao: '4',
            score: 'ALTO RISCO',
          },
        },
        fotosLoteVeiculo: {
          conteudo: [
            {
              url: 'https://cdn.apibrasil.com.br/fotos/leilao/frente-123.jpg',
              descricao: 'FRENTE DO VEÍCULO',
              base64: null,
            },
            {
              url: null,
              descricao: 'TRASEIRA',
              base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            },
          ],
        },
        fotos: [
          'https://cdn.apibrasil.com.br/fotos/leilao/frente-123.jpg', // Duplicate of url above -> should deduplicate
          'https://cdn.apibrasil.com.br/fotos/leilao/traseira-123.jpg',
        ],
      },
    };

    const history = toVehicleHistorySummary(payload2);

    assert.equal(history.has_auction, true);
    assert.equal(history.auction_records.length, 1);

    const rec = history.auction_records[0];
    assert.equal(rec.auctioneer, 'FREITAS LEILOEIRO OFICIAL');
    assert.equal(rec.bidder, 'PORTO SEGURO CIA DE SEGUROS GERAIS');
    assert.equal(rec.condition, 'RECUPERAVEL / SUCATA');
    assert.equal(rec.claim_type, 'COLISAO / PEQUENA MONTA');
    assert.equal(rec.yard, 'SAO PAULO / SP');

    assert.ok(history.auction_score);
    assert.equal(history.auction_score?.acceptance, 'RESTRITA');
    assert.equal(history.auction_score?.special_inspection_required, 'SIM');
    assert.equal(history.auction_score?.reference_percentage, '70');
    assert.equal(history.auction_score?.points, '4');
    assert.equal(history.auction_score?.score_label, 'ALTO RISCO');

    // Consolidated photos: 2 from conteudo + 1 new from fotos root array (deduplicating the duplicate frente-123.jpg)
    assert.ok(history.auction_photos);
    assert.equal(history.auction_photos?.length, 3);

    // First photo: URL
    assert.equal(history.auction_photos?.[0].url, 'https://cdn.apibrasil.com.br/fotos/leilao/frente-123.jpg');
    assert.equal(history.auction_photos?.[0].description, 'FRENTE DO VEÍCULO');
    assert.equal(history.auction_photos?.[0].preview_src, 'https://cdn.apibrasil.com.br/fotos/leilao/frente-123.jpg');

    // Second photo: base64 properly prefixed with data:image/jpeg;base64,
    assert.equal(history.auction_photos?.[1].url, null);
    assert.equal(history.auction_photos?.[1].description, 'TRASEIRA');
    assert.ok(history.auction_photos?.[1].preview_src.startsWith('data:image/jpeg;base64,'));

    // Third photo: unique URL from fotos array
    assert.equal(history.auction_photos?.[2].url, 'https://cdn.apibrasil.com.br/fotos/leilao/traseira-123.jpg');
  });

  test('Multi-passages: Should handle multiple auction records if vehicle was auctioned multiple times', () => {
    const multiPayload: ApiBrasilVehicleResponse = {
      error: false,
      data: {
        leilao: {
          descricao: 'Consta registro de leilao para o veiculo informado',
          registros: [
            {
              leiloeiro: 'LEILOEIRO A',
              dataLeilao: '10/01/2020',
              comitente: 'BANCO SANTANDER',
              condicaoGeral: 'FINANCIAMENTO',
            },
            {
              leiloeiro: 'LEILOEIRO B',
              dataLeilao: '15/05/2022',
              comitente: 'BRADESCO SEGUROS',
              condicaoGeral: 'MEDIA MONTA',
            },
          ],
        },
      },
    };

    const history = toVehicleHistorySummary(multiPayload);
    assert.equal(history.has_auction, true);
    assert.equal(history.auction_records.length, 2);
    assert.equal(history.auction_records[0].bidder, 'BANCO SANTANDER');
    assert.equal(history.auction_records[1].bidder, 'BRADESCO SEGUROS');
  });

  test('DTO propagation: Should pass records, score, and photos to CustomerVehicleReportDto and PublicVehicleReportDto', () => {
    const mockInternalDto: any = {
      id: 'test-consultation-uuid',
      plate_display: 'ABC-1234',
      plate_normalized: 'abc1234',
      status: 'COMPLETED',
      mode: 'TOTAL',
      is_mock: false,
      charged_amount: 34.9,
      consulted_at: '2026-09-12T10:00:00Z',
      summary: {
        brand: 'CHEVROLET',
        model: 'ONIX',
        version: '1.0 TURBO',
        year_fab_mod: '2021/2022',
        color: 'BRANCO',
        city_state: 'RECIFE/PE',
        risk_level: 'HIGH',
        risk_index: 70,
        has_active_theft_robbery: false,
        has_judicial_restriction: false,
        has_financial_restriction: false,
        has_active_gravamen: false,
        has_auction_record: true,
        has_accident_indication: false,
        has_debts: false,
        debts_total_amount: 0,
      },
      vehicle_data: {
        plate: 'ABC1234',
        chassis: '9ZZZL00AA00012345',
        chassis_masked: '9ZZZL00******2345',
        renavam: '12345678901',
        renavam_masked: '123456*****',
        engine_number: 'ENG12345',
        engine_masked: 'ENG****',
        brand: 'CHEVROLET',
        model: 'ONIX',
        vehicle_type: 'AUTOMOVEL',
        color: 'BRANCO',
        year_manufacture: 2021,
        year_model: 2022,
        state: 'PE',
        city: 'RECIFE',
        fuel: 'FLEX',
        origin: 'NACIONAL',
        seat_capacity: 5,
      },
      debts: {
        total_amount: 0,
        has_ipva_debts: false,
        ipva_amount: 0,
        has_licensing_debts: false,
        licensing_amount: 0,
        has_fines: false,
        fines_amount: 0,
        fines_count: 0,
        fines_list: [],
        ipva_list: [],
      },
      restrictions: {
        has_financial_restriction: false,
        financial_restriction_type: 'Nenhuma',
        has_active_gravamen: false,
        gravamen_status: 'DESALIENADO',
        financial_institution: '',
        contract_number: '',
        inclusion_date: '',
        has_judicial_restriction: false,
        judicial_restriction_type: 'Nenhuma',
        judicial_court: '',
        has_administrative_restriction: false,
        administrative_restriction_details: 'Nenhuma',
        has_theft_robbery_alert: false,
        theft_robbery_details: 'Nada Consta',
      },
      history: {
        owners_count: 1,
        previous_owners: [],
        has_auction: true,
        auction_records: [
          {
            auctioneer: 'FREITAS LEILOEIRO OFICIAL',
            auction_date: '15/08/2021',
            lot: '1234',
            bidder: 'PORTO SEGURO CIA DE SEGUROS GERAIS',
            condition: 'RECUPERAVEL / SUCATA',
            claim_type: 'COLISAO / PEQUENA MONTA',
            yard: 'SAO PAULO / SP',
          },
        ],
        auction_score: {
          acceptance: 'RESTRITA',
          special_inspection_required: 'SIM',
          reference_percentage: '70',
          points: '4',
          score_label: 'ALTO RISCO',
        },
        auction_photos: [
          {
            url: 'https://cdn.apibrasil.com.br/fotos/leilao/frente-123.jpg',
            description: 'FRENTE DO VEÍCULO',
            preview_src: 'https://cdn.apibrasil.com.br/fotos/leilao/frente-123.jpg',
          },
        ],
        has_claims: false,
        claims_records: [],
        recalls: [],
      },
      fipe: {
        code: '004485-7',
        model_name: 'ONIX HATCH 1.0',
        price: 65000,
        reference_month: 'Setembro/2026',
        currency: 'R$',
        variations: [],
        price_history: [],
      },
      technical_specs: {},
      commercial_ads: { ads_records: [], mileage_records: [] },
    };

    const customerDto = toCustomerVehicleReportDto(mockInternalDto);
    assert.equal(customerDto.auction_details?.has_auction, true);
    assert.equal(customerDto.auction_details?.records.length, 1);
    assert.equal(customerDto.auction_details?.records[0].bidder, 'PORTO SEGURO CIA DE SEGUROS GERAIS');
    assert.equal(customerDto.auction_details?.score?.acceptance, 'RESTRITA');
    assert.equal(customerDto.auction_details?.photos?.length, 1);

    const publicDto = toPublicVehicleReportDto(mockInternalDto);
    assert.equal(publicDto.auction_details?.has_auction, true);
    assert.equal(publicDto.auction_details?.records[0].bidder, 'PORTO SEGURO CIA DE SEGUROS GERAIS');
    assert.equal(publicDto.auction_details?.score?.score_label, 'ALTO RISCO');
    assert.equal(publicDto.auction_details?.photos?.[0].description, 'FRENTE DO VEÍCULO');
  });
});
