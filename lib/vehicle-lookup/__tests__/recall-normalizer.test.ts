import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  normalizeRecallSummary,
  resolveRecallItemSituation,
  formatRecallDate,
  sanitizeRecallText,
  type RecallItem,
} from '../normalizers/recall-normalizer.ts';
import { toCustomerVehicleReportDto } from '../adapters/vehicle-pdf.ts';
import { toVehicleHistorySummary } from '../adapters/vehicle-history.ts';
import type { InternalVehicleConsultationDto } from '../types.ts';

// Payload autêntico reportado para a placa PFX3G38
const pfx3g38Payload = {
  data: {
    placa: 'PFX3G38',
    marcaModelo: 'HONDA/CIVIC LXR',
    dadosBasicosDoVeiculo: {
      marca: 'HONDA',
      modelo: 'CIVIC LXR',
      anoFabricacao: '2015',
      anoModelo: '2016',
      cor: 'CINZA',
    },
    recall: {
      descricaoRetorno: 'Veículo encontrado com Recall',
      detalhes: [
        {
          defeito: 'Sistema de combustível',
          dataInicioCampanha: '2015-05-12T00:00:00',
          descricaoCompleta: 'Possível falha no módulo da bomba de combustível.',
          risco: 'Risco de desligamento inesperado do motor em movimento.',
        },
        {
          defeito: 'Sistema de airbag',
          dataInicioCampanha: '2016-02-02T00:00:00',
          descricaoCompleta: 'Falha no insuflador do airbag do passageiro.',
          risco: 'Projeção de fragmentos metálicos em caso de colisão.',
        },
        {
          defeito: 'Sistema de airbag',
          dataInicioCampanha: '2018-01-21T00:00:00',
          descricaoCompleta: 'Insuflador do airbag do motorista pode apresentar defeito.',
          risco: 'Risco de ferimentos graves ou fatais aos ocupantes.',
        },
      ],
      recallsPendente: [],
    },
  },
};

import { toInternalVehicleConsultationDto } from '../adapters/vehicle-summary.ts';
import type { VehicleConsultationRecord } from '../types.ts';

function createMockInternalDto(rawResponse: Record<string, unknown>): ReturnType<typeof toInternalVehicleConsultationDto> {
  const fakeRecord: VehicleConsultationRecord = {
    id: 'test-consultation-uuid',
    plate_normalized: 'PFX3G38',
    plate_display: 'PFX-3G38',
    consultation_type: 'VEICULOS_TOTAL',
    provider: 'apibrasil',
    raw_response: rawResponse,
    response_schema_version: '2.0',
    status: 'COMPLETED',
    provider_status_code: 200,
    provider_error: false,
    provider_message: null,
    mode: 'live',
    is_mock: false,
    is_chargeable: true,
    charged_amount: 19.9,
    provider_balance_before: null,
    provider_balance_after: null,
    provider_tax: 0,
    vehicle_type: 'AUTOMOVEL',
    brand: 'HONDA',
    model: 'CIVIC LXR',
    vehicle_description: 'HONDA CIVIC LXR',
    year_manufacture: 2015,
    year_model: 2016,
    color: 'CINZA',
    state: 'PE',
    city: 'RECIFE',
    chassis_masked: '93H******1234',
    renavam_masked: '010*****678',
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
    confirmed_by: 'system',
    confirmation_plate: 'PFX3G38',
    confirmation_message_version: '1.0',
    motorcycle_id: null,
    sell_request_id: null,
    consignment_id: null,
    lead_id: null,
    consulted_at: new Date().toISOString(),
    consulted_by: 'system',
    pdf_generated_at: null,
    pdf_generation_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return toInternalVehicleConsultationDto(fakeRecord);
}

describe('Recall Normalizer Suite', () => {
  it('1. Histórico com 3 itens e recallsPendente: [] (Cenário PFX3G38)', () => {
    const summary = normalizeRecallSummary(pfx3g38Payload);

    assert.strictEqual(summary.historyCount, 3);
    assert.strictEqual(summary.pendingCount, 0);
    assert.strictEqual(summary.hasRecallHistory, true);
    assert.strictEqual(summary.status, 'HISTORY_ONLY');
    assert.strictEqual(summary.diagnosticLabel, 'Nenhuma pendência');
    assert.strictEqual(summary.diagnosticTone, 'success');
    assert.strictEqual(summary.completedCount, null);
    assert.strictEqual(summary.sourceDescription, 'Veículo encontrado com Recall');

    // Verifica que cada uma das campanhas é identificada sem pendência
    summary.historyItems.forEach((item) => {
      const resolution = resolveRecallItemSituation(item, summary.pendingItems, 'HONDA');
      assert.strictEqual(resolution.isPending, false);
      assert.strictEqual(resolution.situation, 'Campanha identificada — sem pendência informada');
      assert.strictEqual(
        resolution.action,
        'Nenhuma ação indicada pela resposta. Confirme com a montadora caso necessite de comprovante.',
      );
    });
  });

  it('2. Histórico com 3 itens e 1 item em recallsPendente', () => {
    const payloadWithPending = {
      data: {
        recall: {
          descricaoRetorno: 'Veículo com recall pendente',
          detalhes: [
            {
              defeito: 'Sistema de combustível',
              dataInicioCampanha: '2015-05-12T00:00:00',
              descricaoCompleta: 'Bomba de combustível',
            },
            {
              defeito: 'Sistema de airbag',
              dataInicioCampanha: '2016-02-02T00:00:00',
              descricaoCompleta: 'Airbag frontal',
            },
            {
              defeito: 'Freio ABS',
              dataInicioCampanha: '2020-04-10T00:00:00',
              descricaoCompleta: 'Sensor ABS',
            },
          ],
          recallsPendente: [
            {
              defeito: 'Sistema de airbag',
              dataInicioCampanha: '2016-02-02T00:00:00',
              descricaoCompleta: 'Airbag frontal não substituído',
            },
          ],
        },
      },
    };

    const summary = normalizeRecallSummary(payloadWithPending);

    assert.strictEqual(summary.historyCount, 3);
    assert.strictEqual(summary.pendingCount, 1);
    assert.strictEqual(summary.status, 'PENDING');
    assert.strictEqual(summary.diagnosticLabel, '1 pendência de recall');
    assert.strictEqual(summary.diagnosticTone, 'danger');

    // O item de airbag deve ser resolvido como Pendente
    const airbagItem = summary.historyItems.find((i) => i.defeito === 'Sistema de airbag');
    assert.ok(airbagItem);
    const airbagResolution = resolveRecallItemSituation(airbagItem, summary.pendingItems, 'HONDA');
    assert.strictEqual(airbagResolution.isPending, true);
    assert.strictEqual(airbagResolution.situation, 'Pendente');
    assert.ok(airbagResolution.action.includes('concessionária autorizada HONDA'));
  });

  it('3. Sem detalhes e sem recallsPendente (Payload vazio ou incompleto)', () => {
    const summaryNull = normalizeRecallSummary(null);
    assert.strictEqual(summaryNull.status, 'UNKNOWN');
    assert.strictEqual(summaryNull.diagnosticLabel, 'Não foi possível confirmar');
    assert.strictEqual(summaryNull.diagnosticTone, 'neutral');
    assert.strictEqual(summaryNull.pendingCount, 0);
    assert.strictEqual(summaryNull.historyCount, 0);

    const summaryEmpty = normalizeRecallSummary({});
    assert.strictEqual(summaryEmpty.status, 'UNKNOWN');
    assert.strictEqual(summaryEmpty.diagnosticLabel, 'Não foi possível confirmar');
  });

  it('4. detalhes: [] e recallsPendente: []', () => {
    const payloadNone = {
      data: {
        recall: {
          descricaoRetorno: 'Nada consta',
          detalhes: [],
          recallsPendente: [],
        },
      },
    };

    const summary = normalizeRecallSummary(payloadNone);
    assert.strictEqual(summary.status, 'NONE');
    assert.strictEqual(summary.historyCount, 0);
    assert.strictEqual(summary.pendingCount, 0);
    assert.strictEqual(summary.diagnosticLabel, 'Nenhuma campanha identificada');
    assert.strictEqual(summary.diagnosticTone, 'neutral');
  });

  it('5. recallsPendente inválido (string ou objeto inesperado)', () => {
    const payloadInvalidPendingString = {
      data: {
        recall: {
          detalhes: [{ defeito: 'Freio' }],
          recallsPendente: 'nenhum',
        },
      },
    };

    const summaryString = normalizeRecallSummary(payloadInvalidPendingString);
    assert.strictEqual(summaryString.status, 'UNKNOWN');
    assert.strictEqual(summaryString.diagnosticLabel, 'Não foi possível confirmar');

    const payloadInvalidPendingObj = {
      data: {
        recall: {
          detalhes: [{ defeito: 'Freio' }],
          recallsPendente: { pendente: false },
        },
      },
    };

    const summaryObj = normalizeRecallSummary(payloadInvalidPendingObj);
    assert.strictEqual(summaryObj.status, 'UNKNOWN');
    assert.strictEqual(summaryObj.diagnosticLabel, 'Não foi possível confirmar');
  });

  it('6. Datas inválidas, texto longo, nulos e sanitização para PDF', () => {
    assert.strictEqual(formatRecallDate('2015-05-12T00:00:00'), '12/05/2015');
    assert.strictEqual(formatRecallDate('2018-01-21'), '21/01/2018');
    assert.strictEqual(formatRecallDate('21/01/2018'), '21/01/2018');
    assert.strictEqual(formatRecallDate('data-invalida-muito-longa-para-parsear'), 'N/I');
    assert.strictEqual(formatRecallDate(null), 'N/I');
    assert.strictEqual(formatRecallDate(undefined), 'N/I');

    assert.strictEqual(sanitizeRecallText(null), '-');
    assert.strictEqual(sanitizeRecallText(undefined), '-');
    const longText = 'A'.repeat(300);
    const sanitized = sanitizeRecallText(longText, 50);
    assert.strictEqual(sanitized.length, 53); // 50 chars + '...'
    assert.ok(sanitized.endsWith('...'));

    const itemWithNulls: RecallItem = {
      codigoProcon: null,
      dataInicioCampanha: null,
      defeito: null,
      descricaoCompleta: null,
      risco: null,
      status: null,
    };
    const resolution = resolveRecallItemSituation(itemWithNulls, []);
    assert.strictEqual(resolution.situation, 'Campanha identificada — sem pendência informada');
  });

  it('7. DTO de Laudo PDF: assegura que "3 Pendência(s)" não aparece para PFX3G38 e dados estão normalizados', () => {
    const internalDto = createMockInternalDto(pfx3g38Payload);
    const customerDto = toCustomerVehicleReportDto(internalDto);

    // Validações no DTO gerado para o cliente
    assert.strictEqual(customerDto.risk_summary.recall_clear, true);
    assert.strictEqual(customerDto.recalls_summary?.pending_count, 0);
    assert.strictEqual(customerDto.recalls_summary?.history_count, 3);
    assert.strictEqual(customerDto.recalls_summary?.status_label, 'Nenhuma pendência');
    assert.strictEqual(customerDto.recalls_summary?.diagnostic_label, 'Nenhuma pendência');
    assert.strictEqual(customerDto.recall_summary?.status, 'HISTORY_ONLY');
    assert.strictEqual(customerDto.recall_summary?.pendingCount, 0);
    assert.strictEqual(customerDto.recall_summary?.historyCount, 3);

    // Garante que o status_label NÃO contém "3 Pendência(s)"
    assert.strictEqual(
      customerDto.recalls_summary?.status_label.includes('3 Pendência(s)'),
      false,
      'Não deve conter "3 Pendência(s)" em status_label',
    );

    // Garante que os veredictos bullets NÃO acusam pendência de recall
    const bullets = customerDto.verdict_bullets || [];
    const hasRecallBullet = bullets.some((b) =>
      b.toLowerCase().includes('recall de fábrica pendente'),
    );
    assert.strictEqual(hasRecallBullet, false, 'Não deve conter bullet de recall pendente no laudo');

    // Garante que nenhum item na lista de recalls possui status 'PENDENTE'
    const pendingInList = customerDto.recalls?.filter((r) => r.status === 'PENDENTE') || [];
    assert.strictEqual(pendingInList.length, 0, 'Nenhum item da lista de recalls deve estar marcado como PENDENTE');

    // Garante que todos os 3 itens possuem situation_label de campanha identificada
    assert.strictEqual(customerDto.recalls?.length, 3);
    customerDto.recalls?.forEach((r) => {
      assert.strictEqual(r.situation_label, 'Campanha identificada — sem pendência informada');
    });
  });
});
