import type { CustomerVehicleReportDto, InternalVehicleConsultationDto } from '../types.ts';
import {
  normalizeGravame,
  normalizeFipeReferences,
  normalizeDebts,
  normalizeOwners,
  normalizeCommercialStatus,
  detectAllDivergences,
  NORMALIZER_VERSION,
  REPORT_GENERAL_DISCLAIMER,
} from '../normalizers/index.ts';
import type { RawConsistencyData } from '../normalizers/source-consistency.ts';
import { normalizePower, normalizeDisplacement } from '../sanitizers/index.ts';

/**
 * Transforms an internal vehicle consultation DTO into a customer-facing report DTO.
 *
 * CRITICAL SECURITY & LGPD RULES:
 * 1. Never passes raw_response or provider payload to the returned DTO
 * 2. Never passes contract numbers, documentoFinanciado, or financial identifiers
 * 3. Never passes full CPF, full CNPJ, full chassis, or full renavam
 * 4. Never uses accusatory language ("fraude", "adulteração", "irregularidade")
 * 5. Never uses overly conclusive language ("APROVADO", "100% GARANTIDO", "QUITADO")
 */
interface RawPdfPayload extends RawConsistencyData {
  baseEstadual?: {
    municipio?: string;
    uf?: string;
    licdata?: string;
    dataEmissaoCrv?: string;
    [key: string]: unknown;
  };
  baseNacional?: {
    municipio?: string;
    uf?: string;
    dtUltimaAtualizacao?: string;
    [key: string]: unknown;
  };
  gravame?: unknown;
  [key: string]: unknown;
}

interface PdfIssuerSettings {
  site_name?: string;
  cnpj?: string;
  settings?: {
    branding?: { companyName?: string };
    address?: { city?: string; state?: string };
  };
  [key: string]: unknown;
}

export function toCustomerVehicleReportDto(
  internalDto: InternalVehicleConsultationDto,
  settings?: PdfIssuerSettings,
): CustomerVehicleReportDto {
  const sum = internalDto.summary;
  const vd = internalDto.vehicle_data;
  const debts = internalDto.debts;
  const rest = internalDto.restrictions;
  const hist = internalDto.history;
  const fipe = internalDto.fipe;
  const ads = internalDto.ads_mileage || { ads_records: [], mileage_records: [] };
  const tech = internalDto.technical_specs || {};

  // ─── Normalization layer ─────────────────────────────────────────────
  // Use the raw_response for normalizers that need deep API data,
  // but never expose raw_response to the final customer DTO.
  const rawObj = internalDto.raw_response as Record<string, unknown> | undefined;
  const rawData =
    ((rawObj?.data || rawObj?.dados || rawObj) as RawPdfPayload) || {};

  // Gravame: separate current from historical
  const gravameNorm = normalizeGravame(rawData.gravame);

  // FIPE: handle multiple references with selection
  const fipeNorm = normalizeFipeReferences(rawData);

  // Debts: include source dates and staleness
  const debtsNorm = normalizeDebts(rawData);

  // Owners: handle placeholders
  const ownersNorm = normalizeOwners(rawData.historicoProprietarios);

  // Commercial status: structured availability (replaces raw JSON access)
  const commercialNorm = normalizeCommercialStatus(rawData);

  // Source consistency: detect divergences
  const divergences = detectAllDivergences(rawData);

  // ─── Recalls ─────────────────────────────────────────────────────────
  const pendingRecalls = hist.recalls.filter((r) => r.status === 'PENDENTE');
  const pendingRecallsCount = pendingRecalls.length;
  const recallClear = pendingRecallsCount === 0;

  // ─── Overall Verdict ─────────────────────────────────────────────────
  // Non-conclusive, neutral legal framing:
  let verdict: 'APPROVED' | 'ATTENTION' | 'RESTRICTED' = 'APPROVED';
  let verdictLabel = 'Sem restrições ativas identificadas nas bases consultadas';
  let verdictDesc =
    'Não foram identificados bloqueios judiciais, alertas de roubo ou pendências graves nas bases consultadas.';

  if (sum.has_active_theft_robbery || sum.has_judicial_restriction) {
    verdict = 'RESTRICTED';
    verdictLabel = 'Restrições ativas identificadas nas bases consultadas';
    verdictDesc =
      'Foram identificadas restrições governamentais, bloqueio judicial (Renajud) ou alerta de roubo/furto ativo.';
  } else if (
    sum.has_auction_record ||
    sum.has_accident_indication ||
    gravameNorm.current.status === 'active' ||
    sum.has_debts ||
    !recallClear
  ) {
    verdict = 'ATTENTION';
    verdictLabel = 'Apontamentos identificados nas fontes consultadas';
    verdictDesc =
      'Foram identificados apontamentos que merecem atenção (gravame ativo, histórico de leilão/sinistro, débitos ou recall pendente).';
  }

  // ─── Verdict Bullets ─────────────────────────────────────────────────
  const verdictBullets: string[] = [];

  if (sum.has_active_theft_robbery) {
    verdictBullets.push('Alerta ativo de roubo/furto nos registros policiais.');
  }
  if (sum.has_judicial_restriction) {
    verdictBullets.push('Bloqueio judicial ativo (Renajud). Transferência impedida.');
  }
  if (gravameNorm.current.status === 'active') {
    verdictBullets.push(
      'Gravame/restrição financeira ativa identificada em instituição financeira.',
    );
  }
  if (commercialNorm.rentalRecord.value === true) {
    verdictBullets.push('Consta histórico de uso em locadora.');
  }
  if (sum.has_auction_record) {
    verdictBullets.push('Histórico com registro de passagem por leilão.');
  }
  if (sum.has_accident_indication) {
    verdictBullets.push('Indício de registro de sinistro ou avaria em seguradora.');
  }
  if (debts.total_amount > 0) {
    verdictBullets.push(
      `Débitos estaduais pendentes no valor de R$ ${debts.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
    );
  }
  if (!recallClear) {
    verdictBullets.push(
      `Recall de fábrica pendente de atendimento (${pendingRecallsCount} pendência(s)).`,
    );
  }
  if (gravameNorm.historicalRecords.length > 0) {
    verdictBullets.push(
      `Há histórico de ${gravameNorm.historicalRecords.length} gravame(s) já baixado(s).`,
    );
  }
  if (divergences.length > 0) {
    verdictBullets.push(
      'Foi identificada divergência cadastral entre fontes consultadas (ver detalhes).',
    );
  }

  if (verdictBullets.length === 0) {
    verdictBullets.push('Nenhuma restrição ativa identificada nas bases consultadas.');
  }

  // ─── Mileage & Ads ──────────────────────────────────────────────────
  let latestKmRecord: CustomerVehicleReportDto['latest_km_record'] = undefined;
  const firstAdWithPrice = ads.ads_records?.find((a) => (a.price || 0) > 0);
  const firstAdWithMileage = ads.ads_records?.find((a) => (a.mileage || 0) > 0);

  if (ads.mileage_records && ads.mileage_records.length > 0) {
    const kmItem = ads.mileage_records[0];
    const adItem = ads.ads_records && ads.ads_records.length > 0 ? ads.ads_records[0] : undefined;
    latestKmRecord = {
      mileage: kmItem.mileage || firstAdWithMileage?.mileage || adItem?.mileage || 0,
      date: kmItem.date || adItem?.date,
      source: kmItem.source || adItem?.portal || 'Histórico de Odômetro / Anúncio',
      announced_price: firstAdWithPrice?.price || adItem?.price,
    };
  } else if (ads.ads_records && ads.ads_records.length > 0) {
    const adItem = ads.ads_records[0];
    latestKmRecord = {
      mileage: firstAdWithMileage?.mileage || adItem.mileage || 0,
      date: adItem.date,
      source: adItem.portal || 'Anúncio Web',
      announced_price: firstAdWithPrice?.price || adItem.price,
    };
  }

  // ─── Owner records with normalizer ───────────────────────────────────
  let ownerRecords: NonNullable<CustomerVehicleReportDto['owners_history']>['records'] = [];
  if (hist.previous_owners && hist.previous_owners.length > 0) {
    ownerRecords = hist.previous_owners.map((o) => ({
      state: o.state,
      period: o.period,
      document_type: o.document_type as 'PF' | 'PJ' | 'unknown' | undefined,
      masked_document: o.masked_document,
      note: (o as { note?: string }).note,
    }));
  } else if (ownersNorm.length > 0) {
    ownerRecords = ownersNorm.map((o) => ({
      state: o.state,
      period: o.period,
      document_type: o.documentType as 'PF' | 'PJ' | 'unknown',
      masked_document: o.maskedDocument,
      note: o.note,
    }));
  }

  const hasLocationDivergence = divergences.some(
    (d) => d.field === 'Município' || d.field === 'UF',
  );

  const normalizedPower = normalizePower(vd.power);
  const normalizedDisplacement = normalizeDisplacement(vd.displacement);

  // ─── Build DTO ───────────────────────────────────────────────────────
  // CRITICAL: contract, documentoFinanciado, and raw_response NEVER reach here
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
    power: normalizedPower,
    displacement: normalizedDisplacement,
    engine_capacity: normalizedDisplacement,
    city_state: hasLocationDivergence
      ? `${vd.city} / ${vd.state} (divergência entre fontes)`
      : `${vd.city} / ${vd.state}`,
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

    // FIPE: use normalizer primary + preserve legacy fallback
    fipe_reference: fipeNorm.primary
      ? {
          code: fipeNorm.primary.code,
          model: fipeNorm.primary.version,
          price: fipeNorm.primary.price,
          reference_month: fipeNorm.primary.referenceMonth || fipe.reference_month || 'Atual',
        }
      : fipe.price > 0
        ? {
            code: fipe.code,
            model: fipe.model_name,
            price: fipe.price,
            reference_month: fipe.reference_month,
          }
        : undefined,

    fipe_variations: fipe.variations && fipe.variations.length > 0 ? fipe.variations : undefined,
    fipe_price_history:
      fipe.price_history && fipe.price_history.length > 0 ? fipe.price_history : undefined,

    // FIPE normalization v2 fields
    fipe_selection_note: fipeNorm.selectionNote,
    fipe_alternatives: fipeNorm.alternatives.length > 0 ? fipeNorm.alternatives : undefined,

    debts_summary: {
      total_debts: debts.total_amount,
      ipva_pending: debts.ipva_amount,
      licensing_pending: debts.licensing_amount,
      fines_pending: debts.fines_amount,
      fines_count: debts.fines_count,
    },

    // Debts source info from normalizer
    debts_source_info: {
      licensing_year: debtsNorm.sourceInfo.licensingYear,
      last_update_date: debtsNorm.sourceInfo.lastUpdateDate,
      is_stale: debtsNorm.sourceInfo.isStale,
      stale_warning: debtsNorm.sourceInfo.staleWarning,
    },

    // Legacy gravamen_details (kept for backward compat)
    // IMPORTANT: contract and documentoFinanciado are NEVER included
    gravamen_details: {
      has_active_gravamen: gravameNorm.current.status === 'active',
      status_label: gravameNorm.current.label,
      agent: gravameNorm.current.agent,
      inclusion_date: gravameNorm.current.inclusionDate,
      financial_restriction: rest.financial_restriction_type,
      judicial_restriction: rest.judicial_restriction_type,
      administrative_restriction: rest.administrative_restriction_details,
      theft_robbery_status: rest.theft_robbery_details,
    },

    // New structured gravame fields
    gravame_current: {
      status: gravameNorm.current.status,
      label: gravameNorm.current.label,
      agent: gravameNorm.current.agent,
      inclusion_date: gravameNorm.current.inclusionDate,
    },
    gravame_history:
      gravameNorm.historicalRecords.length > 0
        ? gravameNorm.historicalRecords.map((gh) => ({
            agent: gh.agent,
            status_label: gh.statusLabel,
            inclusion_date: gh.inclusionDate,
            observation: gh.observation,
          }))
        : undefined,

    auction_details: {
      has_auction: hist.has_auction,
      status_label: hist.has_auction
        ? 'Consta Registro de Leilão'
        : 'Nenhum registro identificado nas bases consultadas',
      description: hist.has_auction
        ? 'Veículo possui passagem cadastrada em base de leilão.'
        : 'Nenhum registro de leilão identificado nas bases consultadas.',
      records: hist.auction_records || [],
      score: hist.auction_score,
      photos: hist.auction_photos,
    },

    claims_details: {
      has_claims: hist.has_claims,
      status_label: hist.has_claims
        ? 'Consta Registro de Sinistro'
        : 'Nenhuma ocorrência identificada nas bases consultadas',
      description: hist.has_claims
        ? 'Veículo possui histórico de sinistro/colisão registrado em seguradora.'
        : 'Nenhuma ocorrência de sinistro ou perda indenizada identificada nas bases consultadas.',
      records: hist.claims_records || [],
    },

    owners_history: {
      owners_count: ownerRecords.length || hist.owners_count,
      records: ownerRecords,
    },

    mileage_history:
      ads.mileage_records && ads.mileage_records.length > 0 ? ads.mileage_records : undefined,
    ads_history: ads.ads_records && ads.ads_records.length > 0 ? ads.ads_records : undefined,
    recalls: hist.recalls && hist.recalls.length > 0 ? hist.recalls : undefined,

    recalls_summary: {
      total_count: hist.recalls.length,
      pending_count: pendingRecallsCount,
      status_label:
        pendingRecallsCount > 0
          ? `${pendingRecallsCount} Pendência(s)`
          : 'Nenhuma ocorrência informada nas bases consultadas',
    },

    latest_km_record: latestKmRecord,

    // Commercial indicators from normalizer (no raw JSON access)
    commercial_indicators: {
      has_rental_record: commercialNorm.rentalRecord.value === true,
      rental_label:
        commercialNorm.rentalRecord.value === true
          ? 'Consta nas bases consultadas'
          : 'Não consta nas bases consultadas',
      sale_communication:
        commercialNorm.saleCommunication.value === true
          ? 'Consta comunicação de venda na base estadual'
          : 'Não consta na base estadual consultada',
      has_sale_communication: commercialNorm.saleCommunication.value === true,
      vehicle_status: (commercialNorm.vehicleStatus.value as string) || 'Em circulação',
    },

    // Source consistency warnings
    source_consistency_warnings: divergences.length > 0 ? divergences : undefined,

    // Report metadata
    report_metadata: {
      generated_at: new Date().toISOString(),
      provider_name: 'API Brasil',
      normalizer_version: NORMALIZER_VERSION,
      source_update_dates: [
        {
          source: 'Base estadual',
          date:
            debtsNorm.sourceInfo.lastUpdateDate ||
            rawData.baseEstadual?.licdata ||
            rawData.baseEstadual?.dataEmissaoCrv ||
            null,
        },
        {
          source: 'Base nacional',
          date: rawData.baseNacional?.dtUltimaAtualizacao || null,
        },
      ],
    },

    // Updated disclaimer
    disclaimer: REPORT_GENERAL_DISCLAIMER,
    issuer: {
      company_name:
        settings?.settings?.branding?.companyName ||
        settings?.site_name ||
        'AF Veículos PE Comércio e Locação Ltda',
      trade_name: settings?.site_name || 'AF Veículos PE',
      cnpj: settings?.cnpj || '58.742.981/0001-08',
      city: settings?.settings?.address?.city || 'Recife',
      state: settings?.settings?.address?.state || 'PE',
    },
  };
}
