import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  detectMunicipioDivergence,
  normalizeLocationForComparison,
  detectAllDivergences,
} from '../normalizers/source-consistency.ts';
import {
  normalizePower,
  normalizeDisplacement,
  maskDocument,
  maskFinancialIdentifier,
  maskChassis,
  maskRenavam,
  maskEngineNumber,
  formatNoOccurrence,
  formatNotInformed,
} from '../sanitizers/index.ts';
import { normalizeGravame } from '../normalizers/gravame-normalizer.ts';
import { normalizeDebts } from '../normalizers/debts-normalizer.ts';
import { normalizeOwners } from '../normalizers/owner-normalizer.ts';
import { normalizeFipeReferences } from '../normalizers/fipe-normalizer.ts';
import { toCustomerVehicleReportDto } from '../adapters/vehicle-pdf.ts';
import type { InternalVehicleConsultationDto } from '../types.ts';

// Helper mock internal DTO for integration tests
function createBaseInternalDto(
  overrides?: Partial<InternalVehicleConsultationDto>,
): InternalVehicleConsultationDto {
  return {
    id: 'consultation-test-uuid',
    plate_display: 'BRA-2E19',
    plate_normalized: 'BRA2E19',
    status: 'COMPLETED',
    mode: 'mock',
    is_mock: true,
    charged_amount: 0,
    consulted_at: '2026-09-18T20:00:00.000Z',
    consulted_by: 'system-user',
    pdf_generated_at: null,
    pdf_generation_count: 0,
    motorcycle_id: null,
    sell_request_id: null,
    consignment_id: null,
    lead_id: null,
    summary: {
      brand: 'YAMAHA',
      model: 'FZ25 FAZER',
      version: 'Fazer 250cc Flex ABS',
      year_fab_mod: '2021/2021',
      color: 'VERMELHA',
      city_state: 'Olinda / PE',
      risk_level: 'LOW',
      risk_index: 1,
      has_active_theft_robbery: false,
      has_judicial_restriction: false,
      has_financial_restriction: false,
      has_active_gravamen: false,
      has_auction_record: false,
      has_accident_indication: false,
      has_debts: false,
      debts_total_amount: 0,
    },
    vehicle_data: {
      plate: 'BRA-2E19',
      chassis: '9C6RG5010M0073711',
      chassis_masked: '9C6******3711',
      renavam: '01253906693',
      renavam_masked: '0125****693',
      engine_number: 'G3K1E073709',
      engine_masked: 'G3K****709',
      brand: 'YAMAHA',
      model: 'FZ25 FAZER',
      vehicle_type: 'MOTOCICLETA',
      species: 'PASSAGEIRO',
      fuel: 'ALCOOL/GASOLINA',
      power: 'Não informada pela fonte',
      displacement: '249 cc',
      color: 'VERMELHA',
      year_manufacture: 2021,
      year_model: 2021,
      state: 'PE',
      city: 'Olinda',
      origin: 'NACIONAL',
      seat_capacity: 2,
    },
    debts: {
      total_amount: 0,
      ipva_amount: 0,
      licensing_amount: 0,
      fines_amount: 0,
      fines_count: 0,
      has_ipva_debts: false,
      has_licensing_debts: false,
      has_fines: false,
      fines_list: [],
      ipva_list: [],
    },
    history: {
      owners_count: 1,
      previous_owners: [],
      has_auction: false,
      auction_records: [],
      has_claims: false,
      claims_records: [],
      recalls: [],
    },
    fipe: {
      price: 18649,
      reference_month: 'Setembro de 2026',
      code: '8271070',
      model_name: 'Fazer 250 250cc Flex ABS',
      currency: 'BRL',
      variations: [],
      price_history: [],
    },
    restrictions: {
      has_financial_restriction: false,
      financial_restriction_type: 'NADA CONSTA',
      has_active_gravamen: false,
      gravamen_status: 'Desalienado',
      financial_institution: 'Nenhum agente ativo',
      contract_number: 'N/A',
      inclusion_date: 'N/A',
      has_judicial_restriction: false,
      judicial_restriction_type: 'NADA CONSTA',
      judicial_court: 'N/A',
      has_administrative_restriction: false,
      administrative_restriction_details: 'NADA CONSTA',
      has_theft_robbery_alert: false,
      theft_robbery_details: 'NADA CONSTA',
    },
    ads_mileage: {
      mileage_records: [],
      ads_records: [],
    },
    technical_specs: {
      gearbox: 'MANUAL',
      traction: 'TRASEIRA',
      axles: 2,
      gross_weight: '300kg',
      max_traction_capacity: 'N/A',
      body_type: 'MOTOCICLETA',
      category: 'PARTICULAR',
    },
    raw_response: {},
    ...overrides,
  };
}

describe('Vehicle Report Enhancements Suite (20 Mandatory Requirements)', () => {
  // 1. Município divergente entre base de emplacamento, estadual e nacional
  it('1. should detect municipality divergence across emplacamento, estadual, and nacional bases', () => {
    const rawData = {
      cidade: 'Olinda',
      uf: 'PE',
      baseEstadual: { municipio: 'Recife', uf: 'PE' },
      baseNacional: { municipio: 'Cabo de Santo Agostinho', uf: 'PE' },
    };

    const divergence = detectMunicipioDivergence(rawData);
    assert.notStrictEqual(divergence, null);
    assert.strictEqual(divergence?.field, 'Município');
    assert.strictEqual(divergence?.sources.length, 3);
    assert.strictEqual(divergence?.sources[0].source, 'Município de emplacamento');
    assert.strictEqual(divergence?.sources[0].value, 'Olinda/PE');
    assert.strictEqual(divergence?.sources[1].source, 'Município informado na base estadual');
    assert.strictEqual(divergence?.sources[1].value, 'Recife/PE');
    assert.strictEqual(divergence?.sources[2].source, 'Município informado na base nacional');
    assert.strictEqual(divergence?.sources[2].value, 'Cabo de Santo Agostinho/PE');

    // Also assert detectAllDivergences finds this entry
    const allDivs = detectAllDivergences(rawData);
    assert.strictEqual(
      allDivs.some((d) => d.field === 'Município'),
      true,
    );
    assert.strictEqual(
      divergence?.recommendation.includes('A divergência entre fontes não confirma irregularidade'),
      true,
    );
  });

  // 2. Município único sem divergência
  it('2. should not detect divergence when municipalities match after normalization', () => {
    const rawData = {
      cidade: 'Recife',
      uf: 'PE',
      baseEstadual: { municipio: 'RECIFE ', uf: 'PE' },
      baseNacional: { municipio: '  recife', uf: 'PE' },
    };

    const divergence = detectMunicipioDivergence(rawData);
    assert.strictEqual(divergence, null);

    // Also test filler word normalization (e.g. "São José do Egito" vs "São José Egito")
    assert.strictEqual(
      normalizeLocationForComparison('Cabo de Santo Agostinho'),
      normalizeLocationForComparison('Cabo Santo Agostinho'),
    );
  });

  // 3. Potência igual a "0" renderizando como "Não informada pela fonte"
  it('3. should normalize power of "0", 0, or null as "Não informada pela fonte" without hiding valid displacement', () => {
    assert.strictEqual(normalizePower('0'), 'Não informada pela fonte');
    assert.strictEqual(normalizePower(0), 'Não informada pela fonte');
    assert.strictEqual(normalizePower('0 CV'), 'Não informada pela fonte');
    assert.strictEqual(normalizePower(''), 'Não informada pela fonte');
    assert.strictEqual(normalizePower(null), 'Não informada pela fonte');
    assert.strictEqual(normalizePower(undefined), 'Não informada pela fonte');

    // Valid power remains intact
    assert.strictEqual(normalizePower('21.3'), '21.3 CV');
    assert.strictEqual(normalizePower('21.3 CV'), '21.3 CV');

    // Valid displacement is preserved
    assert.strictEqual(normalizeDisplacement('249'), '249 cc');
    assert.strictEqual(normalizeDisplacement(249), '249 cc');
  });

  // 4. Gravame ativo
  it('4. should correctly identify active gravame and exclude contracts/IDs from client view', () => {
    const rawGravame = [
      {
        agente: 'BANCO SANTANDER BRASIL SA',
        situacao: 'ALIENACAO FIDUCIARIA',
        dataInclusao: '15/03/2023',
        contrato: 'CTR-9988776655',
        documentoFinanciado: '12345678901',
      },
    ];

    const norm = normalizeGravame(rawGravame);
    assert.strictEqual(norm.current.status, 'active');
    assert.strictEqual(norm.current.agent, 'BANCO SANTANDER BRASIL SA');
    assert.strictEqual(norm.current.inclusionDate, '15/03/2023');
    // Ensure no sensitive contract data is in current
    const currentRec = norm.current as unknown as Record<string, unknown>;
    assert.strictEqual(currentRec.contrato, undefined);
    assert.strictEqual(currentRec.documentoFinanciado, undefined);
  });

  // 5. Gravame baixado histórico
  it('5. should correctly classify cleared gravame as historical without active restriction', () => {
    const rawGravame = [
      {
        agente: 'BANCO YAMAHA MOTOR DO BRASIL SA',
        situacao: 'VEÍCULO TEVE GRAVAME BAIXADO PELO AGENTE FINANCEIRO',
        dataInclusao: '28/01/2021',
        observacoes: 'Histórico',
      },
    ];

    const norm = normalizeGravame(rawGravame);
    assert.strictEqual(norm.current.status, 'cleared');
    assert.strictEqual(
      norm.current.label,
      'Nenhum gravame ativo identificado nas bases consultadas',
    );
    assert.strictEqual(norm.historicalRecords.length, 1);
    assert.strictEqual(norm.historicalRecords[0].agent, 'BANCO YAMAHA MOTOR DO BRASIL SA');
    assert.strictEqual(norm.historicalRecords[0].inclusionDate, '28/01/2021');
  });

  // 6. Múltiplos gravames baixados
  it('6. should format multiple historical cleared gravames with proper count', () => {
    const rawGravame = [
      {
        agente: 'BANCO BRADESCO FINANCIAMENTOS SA',
        situacao: 'GRAVAME BAIXADO',
        dataInclusao: '11/01/2024',
      },
      {
        agente: 'BANCO YAMAHA MOTOR DO BRASIL SA',
        situacao: 'GRAVAME BAIXADO PELO AGENTE FINANCEIRO',
        dataInclusao: '28/01/2021',
      },
    ];

    const norm = normalizeGravame(rawGravame);
    assert.strictEqual(norm.current.status, 'cleared');
    assert.strictEqual(norm.historicalRecords.length, 2);
    assert.strictEqual(norm.totalRecordsFound, 2);
  });

  // 7. Nenhum gravame retornado
  it('7. should handle empty or null gravame gracefully with neutral label', () => {
    const norm = normalizeGravame([]);
    assert.strictEqual(norm.current.status, 'not_informed');
    assert.strictEqual(norm.historicalRecords.length, 0);

    const normNull = normalizeGravame(null);
    assert.strictEqual(normNull.current.status, 'not_informed');
  });

  // 8. Débitos zerados com data de atualização antiga (> 90 dias)
  it('8. should flag debts as stale with source date when reference date is older than threshold', () => {
    const rawData = {
      baseEstadual: {
        debitoMultas: '0,00',
        debitoIpva: '0,00',
        debitoLicenciamento: '0,00',
        debitoDpvat: '0,00',
        debitoMunicipais: '0,00',
        licdata: '29/01/2024',
        exercicioLicenciamento: '2024',
      },
    };

    const norm = normalizeDebts(rawData);
    assert.strictEqual(norm.totalDebts, 0);
    assert.strictEqual(norm.sourceInfo.lastUpdateDate, '29/01/2024');
    assert.strictEqual(norm.sourceInfo.licensingYear, '2024');
    assert.strictEqual(norm.sourceInfo.isStale, true);
    assert.notStrictEqual(norm.sourceInfo.staleWarning, undefined);
    assert.strictEqual(norm.contextualLabel.includes('Sem débitos informados'), true);
  });

  // 9. Débitos zerados com base recente (< 90 dias)
  it('9. should recognize debts as fresh when updated within threshold', () => {
    // Generate a recent Brazilian date (today)
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const recentDate = `${day}/${month}/${now.getFullYear()}`;

    const rawData = {
      baseEstadual: {
        debitoMultas: '0,00',
        debitoIpva: '0,00',
        debitoLicenciamento: '0,00',
        licdata: recentDate,
        exercicioLicenciamento: String(now.getFullYear()),
      },
    };

    const norm = normalizeDebts(rawData);
    assert.strictEqual(norm.totalDebts, 0);
    assert.strictEqual(norm.sourceInfo.isStale, false);
    assert.strictEqual(norm.sourceInfo.staleWarning, undefined);
  });

  // 10. Leilão/sinistro/recall explicitamente negativos
  it('10. should use standardized neutral labels for negative occurrences', () => {
    assert.strictEqual(
      formatNoOccurrence('leilao'),
      'Nenhum registro identificado nas bases consultadas',
    );
    assert.strictEqual(
      formatNoOccurrence('sinistro'),
      'Nenhuma ocorrência identificada nas bases consultadas',
    );
    assert.strictEqual(
      formatNoOccurrence('recall'),
      'Nenhuma ocorrência informada nas bases consultadas',
    );
    assert.strictEqual(
      formatNoOccurrence('roubo'),
      'Nenhuma ocorrência ativa identificada nas bases consultadas',
    );
    assert.strictEqual(
      formatNoOccurrence('renajud'),
      'Nenhum apontamento identificado na base consultada',
    );
    assert.strictEqual(
      formatNoOccurrence('gravame'),
      'Nenhum gravame ativo identificado nas bases consultadas',
    );
    assert.strictEqual(
      formatNoOccurrence('debito'),
      'Sem débitos financeiros informados na base consultada',
    );
    assert.strictEqual(formatNoOccurrence('locadora'), 'Não consta nas bases consultadas');
    assert.strictEqual(formatNoOccurrence('venda'), 'Não consta na base estadual consultada');
  });

  // 11. Leilão/sinistro/recall null ou não informados
  it('11. should display "Não informado pela fonte" and not convert null into "nada consta"', () => {
    assert.strictEqual(formatNotInformed(), 'Não informado pela fonte');
    assert.strictEqual(formatNotInformed('leilao'), 'Não informado pela fonte');
  });

  // 12. FIPE com uma única referência
  it('12. should handle single FIPE reference without generating spurious alternatives', () => {
    const rawData = {
      decodificadorPrecificador: {
        codigoFipe: '8271070',
        modelo: 'Fazer 250 250cc Flex ABS',
        preco: 18649,
      },
    };

    const norm = normalizeFipeReferences(rawData);
    assert.notStrictEqual(norm.primary, null);
    assert.strictEqual(norm.primary?.code, '8271070');
    assert.strictEqual(norm.alternatives.length, 0);
  });

  // 13. FIPE com múltiplas referências
  it('13. should handle multiple FIPE references, selecting best match and providing alternatives', () => {
    const rawData = {
      revisao: {
        veiculosFipe: [
          { codigoFipe: '8271178', modelo: 'Fazer 250 Pantera Negra 250cc Flex ABS', preco: 20952 },
          { codigoFipe: '8271070', modelo: 'Fazer 250 250cc Flex ABS', preco: 18649 },
        ],
      },
      dadosBasicosDoVeiculo: {
        codigoFipe: '8271178',
        descricao: 'Fazer 250 Pantera Negra',
      },
    };

    const norm = normalizeFipeReferences(rawData);
    assert.strictEqual(norm.hasMultipleReferences, true);
    assert.strictEqual(norm.primary?.code, '8271178');
    assert.strictEqual(norm.alternatives.length, 1);
    assert.strictEqual(norm.alternatives[0].code, '8271070');
  });

  // 14. Proprietário sem tipo/documento
  it('14. should handle owner without explicit document or type without inferring PF/PJ', () => {
    const rawOwners = [
      {
        uf: 'PE',
        anoExercicio: '2026',
        cpfCnpj: '00000000000',
        tipoDocumento: null,
      },
    ];

    const norm = normalizeOwners(rawOwners);
    assert.strictEqual(norm.length, 1);
    assert.strictEqual(norm[0].documentType, 'unknown');
    assert.strictEqual(norm[0].maskedDocument, 'Não disponibilizado');
    assert.strictEqual(norm[0].hasInsufficientData, true);
  });

  // 15. Proprietário com dados mascarados (LGPD)
  it('15. should properly mask real CPF and CNPJ documents with LGPD compliance', () => {
    const maskedCpf = maskDocument('12345678901', 'PF');
    assert.strictEqual(maskedCpf, '***.456.789-**');

    const maskedCnpj = maskDocument('12345678000195', 'PJ');
    assert.strictEqual(maskedCnpj, '**.***.678/0001-**');

    // Dummy/placeholder document is never converted to a valid mask
    const placeholderMask = maskDocument('00000000000', 'PF');
    assert.strictEqual(placeholderMask, 'Não disponibilizado');
  });

  // 16. Campos sensíveis ausentes do ViewModel do cliente
  it('16. should verify sensitive fields are completely absent from CustomerVehicleReportDto', () => {
    const internalDto = createBaseInternalDto({
      raw_response: {
        data: {
          chassi: '9C6RG5010M0073711',
          renavam: '01253906693',
          numMotor: 'G3K1E073709',
          gravame: [
            {
              contrato: 'CTR-SECRET-1234',
              documentoFinanciado: '09073790441',
              numero: '04569351',
            },
          ],
        },
      },
    });

    const customerDto = toCustomerVehicleReportDto(internalDto);

    // Ensure raw response is stripped
    const custRecord = customerDto as unknown as Record<string, unknown>;
    assert.strictEqual(custRecord.raw_response, undefined);
    assert.strictEqual(custRecord.charged_amount, undefined);
    assert.strictEqual(custRecord.consulted_by, undefined);

    // Ensure gravamen details do not leak contract or unmasked financiado
    const gravDetails = customerDto.gravamen_details as unknown as
      Record<string, unknown> | undefined;
    assert.strictEqual(gravDetails?.contract, undefined);
    assert.strictEqual(gravDetails?.documentoFinanciado, undefined);
    const gravCur = customerDto.gravame_current as unknown as Record<string, unknown> | undefined;
    assert.strictEqual(gravCur?.contract, undefined);

    // Ensure masked values are properly present
    assert.strictEqual(customerDto.chassis_masked.includes('*'), true);
    assert.strictEqual(customerDto.renavam_masked.includes('*'), true);
    assert.strictEqual(customerDto.engine_masked.includes('*'), true);
  });

  // 17. Campos sensíveis ausentes do HTML/PDF gerado
  it('17. should ensure sanitizers prevent leakage of sensitive financial identifiers', () => {
    assert.strictEqual(maskFinancialIdentifier('CTR-123456789'), 'CT******89');
    assert.strictEqual(maskFinancialIdentifier(null), 'Dado não informado');
    assert.strictEqual(maskFinancialIdentifier('0'), 'Dado não informado');
    assert.strictEqual(maskChassis('9C6RG5010M0073711'), '9C6******3711');
    assert.strictEqual(maskRenavam('01253906693'), '*******6693');
    assert.strictEqual(maskEngineNumber('G3K1E073709'), 'G3K****709');
  });

  // 18. Rodapé com datas de referência
  it('18. should include state and national reference dates in report metadata', () => {
    const internalDto = createBaseInternalDto({
      raw_response: {
        data: {
          baseEstadual: { licdata: '29/01/2024' },
          baseNacional: { dtUltimaAtualizacao: '29/01/2024' },
        },
      },
    });

    const customerDto = toCustomerVehicleReportDto(internalDto);
    assert.notStrictEqual(customerDto.report_metadata, undefined);
    assert.strictEqual(customerDto.report_metadata?.source_update_dates?.length, 2);
    assert.strictEqual(customerDto.report_metadata?.source_update_dates[0].source, 'Base estadual');
    assert.strictEqual(customerDto.report_metadata?.source_update_dates[0].date, '29/01/2024');
    assert.strictEqual(customerDto.report_metadata?.source_update_dates[1].source, 'Base nacional');
    assert.strictEqual(customerDto.report_metadata?.source_update_dates[1].date, '29/01/2024');
  });

  // 19. Resumo para negociação condicionado aos achados
  it('19. should build dynamic verdict bullets reflecting cleared gravames and divergences', () => {
    const internalDto = createBaseInternalDto({
      raw_response: {
        data: {
          cidade: 'Olinda',
          baseEstadual: { municipio: 'Recife', uf: 'PE' },
          gravame: [
            {
              agente: 'BANCO YAMAHA MOTOR DO BRASIL SA',
              situacao: 'GRAVAME BAIXADO',
            },
          ],
        },
      },
    });

    const customerDto = toCustomerVehicleReportDto(internalDto);
    assert.strictEqual(customerDto.procedural_verdict, 'APPROVED');
    assert.strictEqual(
      customerDto.verdict_label,
      'Sem restrições ativas identificadas nas bases consultadas',
    );

    const bullets = customerDto.verdict_bullets || [];
    assert.strictEqual(
      bullets.some((b) => b.includes('gravame(s) já baixado(s)')),
      true,
    );
    assert.strictEqual(
      bullets.some((b) => b.includes('divergência cadastral entre fontes')),
      true,
    );
  });

  // 20. Nenhum QR Code, URL pública ou token de validação criado
  it('20. should verify no public validation tokens, endpoints, or QR codes exist in CustomerVehicleReportDto', () => {
    const internalDto = createBaseInternalDto();
    const customerDto = toCustomerVehicleReportDto(internalDto);
    const custRecord = customerDto as unknown as Record<string, unknown>;

    assert.strictEqual(custRecord.qr_code, undefined);
    assert.strictEqual(custRecord.qr_code_url, undefined);
    assert.strictEqual(custRecord.validation_url, undefined);
    assert.strictEqual(custRecord.validation_token, undefined);
    assert.strictEqual(custRecord.public_validation_url, undefined);
  });
});
