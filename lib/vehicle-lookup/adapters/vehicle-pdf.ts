import type {
  CustomerVehicleReportDto,
  InternalVehicleConsultationDto,
} from '../types.ts';
import type { ApiBrasilVehicleResponse } from '../schema.ts';

export function toCustomerVehicleReportDto(
  internalDto: InternalVehicleConsultationDto
): CustomerVehicleReportDto {
  const sum = internalDto.summary;
  const vd = internalDto.vehicle_data;
  const debts = internalDto.debts;
  const rest = internalDto.restrictions;
  const hist = internalDto.history;
  const fipe = internalDto.fipe;
  const ads = internalDto.ads_mileage;
  const tech = internalDto.technical_specs;
  const rawParsed = internalDto.raw_response as unknown as ApiBrasilVehicleResponse;
  const d = rawParsed?.data || rawParsed?.dados || {};

  // Recalls calculations (Tarefa B)
  const pendingRecalls = hist.recalls.filter((r) => r.status === 'PENDENTE');
  const pendingRecallsCount = pendingRecalls.length;
  const recallClear = pendingRecallsCount === 0;

  // Determine Overall Procedural Verdict
  let verdict: 'APPROVED' | 'ATTENTION' | 'RESTRICTED' = 'APPROVED';
  let verdictLabel = 'Procedência Aprovada';
  let verdictDesc = 'Veículo sem bloqueios judiciais, alerta de roubo ou pendências graves identificadas nas bases governamentais.';

  if (sum.has_active_theft_robbery || sum.has_judicial_restriction) {
    verdict = 'RESTRICTED';
    verdictLabel = 'Procedência Restrita';
    verdictDesc = 'Veículo com restrição governamental, bloqueio judicial (Renajud) ou queixa de roubo/furto ativa.';
  } else if (
    sum.has_auction_record ||
    sum.has_accident_indication ||
    sum.has_active_gravamen ||
    sum.has_debts ||
    !recallClear
  ) {
    verdict = 'ATTENTION';
    verdictLabel = 'Procedência com Apontamentos';
    verdictDesc = 'Veículo com apontamentos comerciais (gravame ativo, histórico de leilão/sinistro, débitos ou recall pendente).';
  }

  // Commercial & Rental Indicators (Tarefa D)
  const isLocadoraJson = Boolean(
    d.registroEmLocadora?.registroEmLocadora === true ||
    d.registro_locadora === true ||
    d.registro_em_locadora === true ||
    /LOCADORA/i.test(JSON.stringify(d.historicoProprietarios || ''))
  );

  const rawComVenda = String(
    d.baseEstadual?.comunicacaoVenda ||
    d.base_estadual?.comunicacao_venda ||
    d.baseNacional?.indicadorComunicacaoVendas ||
    'NÃO CONSTA COMUNICAÇÃO DE VENDAS'
  ).trim();

  const hasComVenda = !rawComVenda.toUpperCase().includes('NAO CONSTA') &&
    !rawComVenda.toUpperCase().includes('NADA CONSTA') &&
    rawComVenda.toUpperCase() !== 'NAO';

  const vehicleStatus = String(
    d.baseEstadual?.situacaoVeiculo ||
    d.base_estadual?.situacao_veiculo ||
    d.baseNacional?.situacaoVeiculo ||
    'CIRCULAÇÃO'
  ).trim();

  // Build concise, scannable bullet points for the verdict banner
  const verdictBullets: string[] = [];

  if (sum.has_active_theft_robbery) {
    verdictBullets.push('Alerta ativo de roubo/furto nos registros policiais.');
  }
  if (sum.has_judicial_restriction) {
    verdictBullets.push('Bloqueio judicial ativo (Renajud). Transferência impedida.');
  }
  if (rest.has_active_gravamen) {
    verdictBullets.push('Gravame fiduciário ativo registrado em instituição financeira.');
  }
  if (isLocadoraJson) {
    verdictBullets.push('Veículo com histórico de titularidade por Pessoa Jurídica / Locadora.');
  }
  if (sum.has_auction_record) {
    verdictBullets.push('Histórico com registro de passagem por leilão.');
  }
  if (sum.has_accident_indication) {
    verdictBullets.push('Indício de registro de sinistro ou avaria em seguradora.');
  }
  if (debts.total_amount > 0) {
    verdictBullets.push(`Débitos estaduais pendentes no valor de R$ ${debts.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`);
  }
  if (!recallClear) {
    verdictBullets.push(`Recall de fábrica pendente de atendimento (${pendingRecallsCount} pendência(s)).`);
  }

  if (verdictBullets.length === 0) {
    verdictBullets.push('Nenhum apontamento restritivo identificado nas bases governamentais consultadas.');
  }

  // Mileage & Ads extraction (Tarefa C)
  let latestKmRecord: CustomerVehicleReportDto['latest_km_record'] = undefined;
  if (ads.mileage_records && ads.mileage_records.length > 0) {
    const kmItem = ads.mileage_records[0];
    const adItem = ads.ads_records && ads.ads_records.length > 0 ? ads.ads_records[0] : undefined;
    latestKmRecord = {
      mileage: kmItem.mileage || (adItem?.mileage || 0),
      date: kmItem.date || adItem?.date,
      source: kmItem.source || adItem?.portal || 'Histórico de Odômetro / Anúncio',
      announced_price: adItem?.price,
    };
  } else if (ads.ads_records && ads.ads_records.length > 0) {
    const adItem = ads.ads_records[0];
    if (adItem.mileage) {
      latestKmRecord = {
        mileage: adItem.mileage,
        date: adItem.date,
        source: adItem.portal || 'Anúncio Web',
        announced_price: adItem.price,
      };
    }
  }

  return {
    consultation_id: internalDto.id,
    consulted_at: internalDto.consulted_at,
    plate_display: internalDto.plate_display,
    brand: vd.brand,
    model: vd.model,
    version: sum.version,
    vehicle_type: vd.vehicle_type,
    species: vd.species,
    year_manufacture: vd.year_manufacture,
    year_model: vd.year_model,
    color: vd.color,
    fuel: vd.fuel,
    power: vd.power,
    displacement: vd.displacement,
    engine_capacity: vd.displacement,
    city_state: `${vd.city} / ${vd.state}`,
    chassis_masked: vd.chassis_masked,
    renavam_masked: vd.renavam_masked,
    engine_masked: vd.engine_masked,
    origin: vd.origin,
    seat_capacity: vd.seat_capacity ?? undefined,
    gearbox: tech.gearbox,
    traction: tech.traction,
    body_type: tech.body_type,

    procedural_verdict: verdict,
    verdict_label: verdictLabel,
    verdict_description: verdictDesc,
    verdict_bullets: verdictBullets,
    risk_score: sum.risk_index,
    risk_level: sum.risk_level,

    risk_summary: {
      theft_robbery_clear: !sum.has_active_theft_robbery,
      judicial_clear: !sum.has_judicial_restriction,
      financial_clear: !rest.has_financial_restriction,
      auction_clear: !hist.has_auction,
      accident_clear: !hist.has_claims,
      recall_clear: recallClear,
      debts_clear: !debts.has_fines && !debts.has_ipva_debts && !debts.has_licensing_debts,
    },

    fipe_reference: fipe.price > 0
      ? {
          code: fipe.code,
          model: fipe.model_name,
          price: fipe.price,
          reference_month: fipe.reference_month,
        }
      : undefined,

    fipe_variations: fipe.variations && fipe.variations.length > 0 ? fipe.variations : undefined,
    fipe_price_history: fipe.price_history && fipe.price_history.length > 0 ? fipe.price_history : undefined,

    debts_summary: {
      total_debts: debts.total_amount,
      ipva_pending: debts.ipva_amount,
      licensing_pending: debts.licensing_amount,
      fines_pending: debts.fines_amount,
      fines_count: debts.fines_count,
    },

    gravamen_details: {
      has_active_gravamen: rest.has_active_gravamen,
      status_label: rest.gravamen_status,
      agent: rest.financial_institution,
      contract: rest.contract_number,
      inclusion_date: rest.inclusion_date,
      financial_restriction: rest.financial_restriction_type,
      judicial_restriction: rest.judicial_restriction_type,
      administrative_restriction: rest.administrative_restriction_details,
      theft_robbery_status: rest.theft_robbery_details,
    },

    auction_details: {
      has_auction: hist.has_auction,
      status_label: hist.has_auction ? 'Consta Registro de Leilão' : 'Sem Registro de Leilão',
      description: hist.has_auction
        ? 'Veículo possui passagem cadastrada em base de leilão.'
        : 'Nenhum registro de leilão localizado nas bases oficiais consultadas.',
      records: hist.auction_records || [],
    },

    claims_details: {
      has_claims: hist.has_claims,
      status_label: hist.has_claims ? 'Consta Registro de Sinistro' : 'Sem Registro de Sinistro',
      description: hist.has_claims
        ? 'Veículo possui histórico de sinistro/colisão registrado em seguradora.'
        : 'Nenhum registro de sinistro ou perda indenizada localizado nas bases oficiais.',
      records: hist.claims_records || [],
    },

    owners_history: {
      owners_count: hist.owners_count,
      records: hist.previous_owners || [],
    },

    mileage_history: ads.mileage_records && ads.mileage_records.length > 0 ? ads.mileage_records : undefined,
    ads_history: ads.ads_records && ads.ads_records.length > 0 ? ads.ads_records : undefined,
    recalls: hist.recalls && hist.recalls.length > 0 ? hist.recalls : undefined,

    recalls_summary: {
      total_count: hist.recalls.length,
      pending_count: pendingRecallsCount,
      status_label: pendingRecallsCount > 0 ? `${pendingRecallsCount} Pendência(s)` : 'Sem Pendências',
    },

    latest_km_record: latestKmRecord,

    commercial_indicators: {
      has_rental_record: isLocadoraJson,
      rental_label: isLocadoraJson ? 'Consta Histórico em Locadora' : 'Não Consta',
      sale_communication: rawComVenda,
      has_sale_communication: hasComVenda,
      vehicle_status: vehicleStatus || 'Circulação',
    },

    disclaimer:
      'Dados consolidados via API Brasil com integração direta aos sistemas governamentais oficiais (SENATRAN, DETRAN Estaduais, Renajud, Sircaf e bases conveniadas de leilão e seguradoras). Documento para conferência cadastral e procedência veicular.',
    issuer: {
      company_name: 'AF Motos Comércio e Locação Ltda',
      trade_name: 'AF Motos',
      cnpj: '58.742.981/0001-08',
      city: 'Recife',
      state: 'PE',
    },
  };
}
