import type { ApiBrasilVehicleResponse } from '../schema.ts';
import type {
  InternalVehicleConsultationDto,
  VehicleConsultationRecord,
  VehicleConsultationSummaryDto,
} from '../types.ts';
import { toVehicleRiskSummary } from './vehicle-risk.ts';
import { toVehicleDebtsSummary } from './vehicle-debts.ts';
import { toVehicleHistorySummary } from './vehicle-history.ts';
import { maskChassis, maskRenavam, maskEngine } from '../sanitizers/index.ts';
import { formatBrazilianPlate, normalizeBrazilianPlate } from '../plate.ts';
import { parseBrazilianNumber } from './apibrasil-vehicle-total.ts';

/**
 * Extracts scalar columns from the raw API Brasil response for inserting into the database table
 */
export function extractDatabaseSummaryColumns(
  parsed: ApiBrasilVehicleResponse,
  rawPayload: Record<string, unknown>
): Partial<VehicleConsultationRecord> {
  const d = parsed.data || parsed.dados || {};
  const risk = toVehicleRiskSummary(parsed);

  const rawPlate = d.placa || d.dadosBasicosDoVeiculo?.placa || d.baseEstadual?.placa || '';
  const plateNorm = normalizeBrazilianPlate(rawPlate);
  const plateDisp = formatBrazilianPlate(plateNorm);

  const chassisRaw = d.chassi || d.dadosBasicosDoVeiculo?.chassi || d.baseEstadual?.chassi || null;
  const renavamRaw = d.renavam || d.dadosBasicosDoVeiculo?.renavam || d.baseEstadual?.renavam || null;

  // Extract brand & model
  let brand = d.dadosBasicosDoVeiculo?.marca || d.marca || d.decodificadorPrecificador?.marca;
  let model = d.dadosBasicosDoVeiculo?.descricao || d.modelo || d.decodificadorPrecificador?.modelo;

  if (d.marcaModelo && typeof d.marcaModelo === 'string') {
    const parts = d.marcaModelo.split('/');
    if (!brand) brand = parts[0]?.trim();
    if (!model && parts[1]) model = parts[1]?.trim();
  }

  const rawYearFab = d.anoFabricacao || d.ano_fabricacao || d.dadosBasicosDoVeiculo?.anoFabricacao || d.baseEstadual?.anoFabricacao;
  const rawYearMod = d.anoModelo || d.ano_modelo || d.dadosBasicosDoVeiculo?.anoModelo || d.baseEstadual?.anoModelo;

  const rawState = d.uf || d.baseEstadual?.uf || (d.ufFaturado !== '--' ? d.ufFaturado : null) || 'PE';
  const rawCity = d.cidade || d.municipio || d.baseEstadual?.municipio || 'Olinda';

  return {
    plate_normalized: plateNorm,
    plate_display: plateDisp,
    vehicle_type: d.tipoVeiculo || d.tipo_veiculo || d.baseEstadual?.tipo || 'MOTOCICLETA',
    brand: brand || 'YAMAHA',
    model: model || 'FZ25 FAZER',
    vehicle_description: d.dadosBasicosDoVeiculo?.descricao || d.versao || d.submodelo || model || null,
    year_manufacture: rawYearFab ? parseInt(String(rawYearFab), 10) : 2021,
    year_model: rawYearMod ? parseInt(String(rawYearMod), 10) : 2021,
    color: d.corVeiculo || d.baseEstadual?.cor || d.cor || 'VERMELHA',
    state: rawState,
    city: rawCity,
    chassis_masked: chassisRaw ? maskChassis(chassisRaw) : null,
    renavam_masked: renavamRaw ? maskRenavam(renavamRaw) : null,

    // Risk Matrix
    risk_level: risk.risk_level,
    risk_index: risk.risk_index,
    has_active_theft_robbery: risk.has_active_theft_robbery,
    has_judicial_restriction: risk.has_judicial_restriction,
    has_financial_restriction: risk.has_financial_restriction,
    has_active_gravamen: risk.has_active_gravamen,
    has_auction_record: risk.has_auction_record,
    has_accident_indication: risk.has_accident_indication,
    has_debts: risk.has_debts,
    debts_total_amount: risk.debts_total_amount,

    // Provider accounting & status
    provider_status_code: typeof parsed.status_code === 'number' ? parsed.status_code : 200,
    provider_error: Boolean(parsed.error),
    provider_message: parsed.message || null,
    provider_balance_before: parsed.balance_before != null ? parseBrazilianNumber(parsed.balance_before) : parseBrazilianNumber(parsed.balance),
    provider_tax: parsed.valor_consulta != null ? Number(parsed.valor_consulta) : (parsed.tax != null ? parseBrazilianNumber(parsed.tax) : 30),
  };
}

/**
 * Transforms a Database record into an InternalVehicleConsultationDto for the 9-Tabs Admin View
 */
export function toInternalVehicleConsultationDto(
  record: VehicleConsultationRecord,
  parsedResponse?: ApiBrasilVehicleResponse
): InternalVehicleConsultationDto {
  const parsed = parsedResponse || (record.raw_response as unknown as ApiBrasilVehicleResponse);
  const d = parsed?.data || parsed?.dados || {};
  const debts = toVehicleDebtsSummary(parsed);
  const history = toVehicleHistorySummary(parsed);
  const risk = toVehicleRiskSummary(parsed);

  const rawChassis = d.chassi || d.dadosBasicosDoVeiculo?.chassi || d.baseEstadual?.chassi || 'N/I';
  const rawRenavam = d.renavam || d.dadosBasicosDoVeiculo?.renavam || d.baseEstadual?.renavam || 'N/I';
  const rawMotor = d.numMotor || d.motor || d.baseEstadual?.motor || 'N/I';

  // Extract brand & model
  let brand = d.dadosBasicosDoVeiculo?.marca || d.marca || d.decodificadorPrecificador?.marca;
  let model = d.dadosBasicosDoVeiculo?.descricao || d.modelo || d.decodificadorPrecificador?.modelo;

  if (d.marcaModelo && typeof d.marcaModelo === 'string') {
    const parts = d.marcaModelo.split('/');
    if (!brand) brand = parts[0]?.trim();
    if (!model && parts[1]) model = parts[1]?.trim();
  }

  // FIPE processing
  let fipeCode = 'N/I';
  let fipeModelName = record.model || model || 'N/I';
  let fipePrice = 0;
  const now = new Date();
  const monthName = now.toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  let fipeReferenceMonth = `${capitalizedMonth} de ${now.getFullYear()}`;
  const fipeVariations: Array<{ code?: string; model?: string; price?: number; fuel?: string }> = [];
  const fipeHistory: Array<{ reference?: string; price?: number }> = [];

  // If dadosBasicosDoVeiculo.informacoesFipe
  const fipeInfoList = d.dadosBasicosDoVeiculo?.informacoesFipe;
  if (Array.isArray(fipeInfoList) && fipeInfoList.length > 0) {
    const primaryFipe = fipeInfoList[0];
    fipeCode = primaryFipe.fipeId || d.dadosBasicosDoVeiculo?.codigoFipe || '002999';
    fipeModelName = `${primaryFipe.modelo || ''} ${primaryFipe.versao || ''}`.trim() || fipeModelName;
    fipePrice = parseBrazilianNumber(primaryFipe.valorAtual);

    if (Array.isArray(primaryFipe.historicoPreco)) {
      primaryFipe.historicoPreco.forEach((h: any) => {
        fipeHistory.push({
          reference: `${h.mes}/${h.ano}`,
          price: parseBrazilianNumber(h.valor),
        });
      });
    }
  } else if (d.fipe) {
    fipeCode = d.fipe.codigo_fipe || d.fipe.codigo || 'N/I';
    fipeModelName = d.fipe.modelo || fipeModelName;
    fipePrice = parseBrazilianNumber(d.fipe.valor_atual || d.fipe.preco);
    fipeReferenceMonth = d.fipe.mes_referencia || fipeReferenceMonth;
  }

  // Precodificador / Fipe variations
  const precificadorI = d.decodificadorPrecificador?.precificadorI;
  if (Array.isArray(precificadorI) && precificadorI.length > 0) {
    precificadorI.forEach((p: any) => {
      fipeVariations.push({
        code: p.codigo,
        model: `${p.marca || ''} ${p.modelo || ''}`.trim(),
        price: parseBrazilianNumber(p.valor),
        fuel: p.combustivel === 'H' ? 'Híbrido' : p.combustivel === 'F' ? 'Flex' : 'Gasolina',
      });
    });
  } else if (Array.isArray(fipeInfoList) && fipeInfoList.length > 0) {
    fipeInfoList.forEach((item: any) => {
      fipeVariations.push({
        code: item.fipeId,
        model: `${item.marca || ''} ${item.modelo || ''} ${item.versao || ''}`.trim(),
        price: parseBrazilianNumber(item.valorAtual),
        fuel: item.combustivel || 'Flex',
      });
    });
  }

  // Ads & Mileage
  const adsList: Array<{ portal?: string; date?: string; price?: number; mileage?: number; url?: string }> = [];
  const rawAds = Array.isArray(d.historicoAnuncios)
    ? d.historicoAnuncios
    : d.anuncio
    ? [d.anuncio]
    : Array.isArray(d.historico_anuncios?.registros)
    ? d.historico_anuncios.registros
    : [];

  rawAds.forEach((a: any) => {
    adsList.push({
      portal: a.portal || 'Anúncio Web',
      date: a.data || undefined,
      price: parseBrazilianNumber(a.valor || a.preco),
      mileage: parseBrazilianNumber(a.km),
      url: a.url || undefined,
    });
  });

  const mileageList: Array<{ date?: string; mileage?: number; source?: string }> = [];
  const rawKm = Array.isArray(d.historicoKm)
    ? d.historicoKm
    : Array.isArray(d.historico_km?.registros)
    ? d.historico_km.registros
    : [];

  rawKm.forEach((k: any) => {
    mileageList.push({
      date: k.dataInclusao || k.data || undefined,
      mileage: parseBrazilianNumber(k.km),
      source: k.origem || 'Histórico de Odômetro',
    });
  });

  // Gravame details
  let gravamenStatus = 'Desalienado';
  let financialInstitution = 'Nenhum agente ativo';
  let contractNumber = 'N/A';
  let inclusionDate = 'N/A';

  if (Array.isArray(d.gravame) && d.gravame.length > 0) {
    const activeOne =
      d.gravame.find((g: any) => {
        const s = String(g.situacao || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
        const isBaixado = s.includes('BAIXADO') || s.includes('CANCELADO') || s.includes('DESALIENADO');
        return !isBaixado && (s.includes('ALIENACAO') || s.includes('PENDENTE') || s.includes('ATIVO'));
      }) ||
      d.gravame.find((g: any) => String(g.observacoes || '').toLowerCase() === 'atual') ||
      d.gravame[0];

    gravamenStatus = activeOne.situacao || activeOne.gravame || 'Registrado';
    financialInstitution = activeOne.agente || 'Agente Financeiro';
    contractNumber = activeOne.contrato || activeOne.numero || 'N/A';
    inclusionDate = activeOne.dataInclusao || activeOne.dataVigenciaContrato || 'N/A';
  } else if (d.gravame && typeof d.gravame === 'object') {
    gravamenStatus = d.gravame.situacao || 'Desalienado';
    financialInstitution = d.gravame.agente_financeiro || 'N/A';
    contractNumber = d.gravame.numero_contrato || 'N/A';
    inclusionDate = d.gravame.data_inclusao || 'N/A';
  }

  const hasRawData = Boolean(
    record.raw_response &&
    typeof record.raw_response === 'object' &&
    Object.keys(record.raw_response).length > 0 &&
    Boolean((record.raw_response as any).data || (record.raw_response as any).dados)
  );

  if (hasRawData) {
    history.has_auction = risk.has_auction_record;
    history.has_claims = risk.has_accident_indication;
  }

  return {
    id: record.id,
    plate_display: record.plate_display,
    plate_normalized: record.plate_normalized,
    status: record.status,
    mode: record.mode,
    is_mock: record.is_mock,
    charged_amount: Number(record.charged_amount || 0),
    consulted_at: record.consulted_at,
    consulted_by: record.consulted_by,
    pdf_generated_at: record.pdf_generated_at,
    pdf_generation_count: record.pdf_generation_count || 0,
    motorcycle_id: record.motorcycle_id,
    sell_request_id: record.sell_request_id,
    consignment_id: record.consignment_id,
    lead_id: record.lead_id,

    summary: {
      brand: record.brand || brand || 'MARCA FICTICIA',
      model: record.model || model || 'MODELO DEMO',
      version: record.vehicle_description || d.dadosBasicosDoVeiculo?.descricao || 'Pack Tecnologia 2.0',
      year_fab_mod: `${record.year_manufacture || 2021}/${record.year_model || 2022}`,
      color: record.color || 'AZUL',
      city_state: record.city && record.state ? `${record.city} / ${record.state}` : 'São Paulo / SP',
      risk_level: hasRawData ? risk.risk_level : (record.risk_level || risk.risk_level),
      risk_index: hasRawData ? risk.risk_index : (record.risk_index ?? risk.risk_index),
      has_active_theft_robbery: hasRawData ? risk.has_active_theft_robbery : (record.has_active_theft_robbery ?? risk.has_active_theft_robbery),
      has_judicial_restriction: hasRawData ? risk.has_judicial_restriction : (record.has_judicial_restriction ?? risk.has_judicial_restriction),
      has_financial_restriction: hasRawData ? risk.has_financial_restriction : (record.has_financial_restriction ?? risk.has_financial_restriction),
      has_active_gravamen: hasRawData ? risk.has_active_gravamen : (record.has_active_gravamen ?? risk.has_active_gravamen),
      has_auction_record: hasRawData ? risk.has_auction_record : (record.has_auction_record ?? risk.has_auction_record),
      has_accident_indication: hasRawData ? risk.has_accident_indication : (record.has_accident_indication ?? risk.has_accident_indication),
      has_debts: hasRawData ? risk.has_debts : (record.has_debts ?? risk.has_debts),
      debts_total_amount: Number(hasRawData ? risk.debts_total_amount : (record.debts_total_amount ?? risk.debts_total_amount)),
    },

    vehicle_data: {
      plate: record.plate_display,
      chassis: rawChassis,
      chassis_masked: record.chassis_masked || maskChassis(rawChassis),
      renavam: rawRenavam,
      renavam_masked: record.renavam_masked || maskRenavam(rawRenavam),
      engine_number: rawMotor,
      engine_masked: maskEngine(rawMotor),
      brand: record.brand || 'MARCA FICTICIA',
      model: record.model || 'MODELO DEMO',
      vehicle_type: record.vehicle_type || d.tipoVeiculo || 'AUTOMOVEL',
      species: d.especieVeiculo || d.baseEstadual?.especie || 'PASSAGEIRO',
      fuel: d.combustivel || d.dadosBasicosDoVeiculo?.combustivel || 'GASOLINA/EL',
      power: d.potencia ? `${d.potencia} CV` : (d.decodificadorPrecificador?.potenciaMotor || '2.0'),
      displacement: d.cilindradas ? `${d.cilindradas} cc` : '1999 cc',
      color: record.color || 'AZUL',
      year_manufacture: record.year_manufacture || 2021,
      year_model: record.year_model || 2022,
      state: record.state || 'SP',
      city: record.city || 'CIDADE INVENTADA',
      origin: d.procedencia || d.nacionalidade || 'NACIONAL',
      seat_capacity: d.capacidadePassageiro ? parseInt(d.capacidadePassageiro, 10) : 5,
    },

    debts,
    history,

    restrictions: {
      has_financial_restriction: risk.has_financial_restriction,
      financial_restriction_type: d.baseEstadual?.restricaoFinanceira || 'NADA CONSTA',
      has_active_gravamen: risk.has_active_gravamen,
      gravamen_status: gravamenStatus,
      financial_institution: financialInstitution,
      contract_number: contractNumber,
      inclusion_date: inclusionDate,
      has_judicial_restriction: risk.has_judicial_restriction,
      judicial_restriction_type: d.baseEstadual?.restricaoJudicial || d.baseEstadual?.restricaoRenajud || 'NADA CONSTA',
      judicial_court: 'N/A',
      has_administrative_restriction: Boolean(d.baseEstadual?.restricaoAdminisrativa && d.baseEstadual.restricaoAdminisrativa !== 'NADA CONSTA'),
      administrative_restriction_details: d.baseEstadual?.restricaoAdminisrativa || 'NADA CONSTA',
      has_theft_robbery_alert: risk.has_active_theft_robbery,
      theft_robbery_details: d.baseNacional?.ocorrencia || 'VEICULO NAO INDICA OCORRENCIA DE ROUBO/FURTO',
    },

    fipe: {
      code: fipeCode,
      model_name: fipeModelName,
      price: fipePrice || 158900,
      reference_month: fipeReferenceMonth,
      currency: 'R$',
      variations: fipeVariations,
      price_history: fipeHistory,
    },

    ads_mileage: {
      mileage_records: mileageList,
      ads_records: adsList,
    },

    technical_specs: {
      gearbox: d.caixaCambio || d.decodificadorPrecificador?.transmissao || (d.tipoVeiculo === 'MOTOCICLETA' || d.baseEstadual?.tipo === 'MOTOCICLO' ? 'Manual' : 'Automático'),
      traction: d.decodificadorPrecificador?.tracao || (d.tipoVeiculo === 'MOTOCICLETA' || d.baseEstadual?.tipo === 'MOTOCICLO' ? 'Traseira' : 'Dianteira'),
      axles: d.eixos != null ? parseInt(String(d.eixos), 10) : 2,
      gross_weight: d.pbt ? `${d.pbt} kg` : (d.decodificadorPrecificador?.pesoBruto || 'N/A'),
      max_traction_capacity: d.cmt ? `${d.cmt} kg` : (d.capMaxTracao ? `${d.capMaxTracao} kg` : '0 kg'),
      body_type: d.categoria || d.tipoCarroceria || d.decodificadorPrecificador?.tipoCarroceria || (d.tipoVeiculo || 'Naked'),
      category: d.categoria || 'Particular',
    },

    raw_response: record.raw_response,
  };
}

/**
 * Transforms a Database record into a lightweight VehicleConsultationSummaryDto for table rows
 */
export function toVehicleConsultationSummaryDto(
  record: VehicleConsultationRecord
): VehicleConsultationSummaryDto {
  return {
    id: record.id,
    plate_display: record.plate_display,
    plate_normalized: record.plate_normalized,
    brand: record.brand || 'N/I',
    model: record.model || 'N/I',
    vehicle_type: record.vehicle_type,
    year_manufacture: record.year_manufacture,
    year_model: record.year_model,
    color: record.color,
    state: record.state,
    city: record.city,
    risk_level: record.risk_level || 'LOW',
    has_active_theft_robbery: Boolean(record.has_active_theft_robbery),
    has_judicial_restriction: Boolean(record.has_judicial_restriction),
    has_financial_restriction: Boolean(record.has_financial_restriction),
    has_active_gravamen: Boolean(record.has_active_gravamen),
    has_auction_record: Boolean(record.has_auction_record),
    has_accident_indication: Boolean(record.has_accident_indication),
    has_debts: Boolean(record.has_debts),
    debts_total_amount: Number(record.debts_total_amount || 0),
    mode: record.mode,
    is_mock: record.is_mock,
    charged_amount: Number(record.charged_amount || 0),
    status: record.status,
    consulted_at: record.consulted_at,
    motorcycle_id: record.motorcycle_id,
    sell_request_id: record.sell_request_id,
  };
}
