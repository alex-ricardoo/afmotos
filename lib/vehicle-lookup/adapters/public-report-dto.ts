import type {
  PublicVehicleReportDto,
  InternalVehicleConsultationDto,
  VehicleConsultationRecord,
} from '../types.ts';
import { toCustomerVehicleReportDto } from './vehicle-pdf.ts';
import { maskCpf, maskCnpj } from '../sanitizers/index.ts';

/**
 * Transforms an internal vehicle consultation record / DTO into a strictly sanitized,
 * LGPD-compliant PublicVehicleReportDto for anonymous client rendering and public PDF generation.
 */
export function toPublicVehicleReportDto(
  internalDtoOrRecord: InternalVehicleConsultationDto | (VehicleConsultationRecord & { summary?: any }),
  shareContext?: { shareId?: string }
): PublicVehicleReportDto {
  // If it's already an InternalVehicleConsultationDto with structured sub-objects
  const customerDto = 'summary' in internalDtoOrRecord && 'vehicle_data' in internalDtoOrRecord
    ? toCustomerVehicleReportDto(internalDtoOrRecord as InternalVehicleConsultationDto)
    : toCustomerVehicleReportDto(internalDtoOrRecord as any);

  // Sanitize owner documents if any exist
  const sanitizedOwners = customerDto.owners_history?.records?.map((owner) => {
    let maskedDoc = owner.masked_document;
    if (owner.document_type === 'PF' && maskedDoc && !maskedDoc.includes('*')) {
      maskedDoc = maskCpf(maskedDoc);
    } else if (owner.document_type === 'PJ' && maskedDoc && !maskedDoc.includes('*')) {
      maskedDoc = maskCnpj(maskedDoc);
    }
    return {
      state: owner.state,
      period: owner.period,
      document_type: owner.document_type,
      masked_document: maskedDoc || 'Documento sigiloso',
    };
  }) || [];

  return {
    share_id: shareContext?.shareId,
    consultation_id: customerDto.consultation_id,
    consulted_at: customerDto.consulted_at,
    plate_display: customerDto.plate_display,
    brand: customerDto.brand,
    model: customerDto.model,
    version: customerDto.version,
    vehicle_type: customerDto.vehicle_type,
    species: customerDto.species,
    year_manufacture: customerDto.year_manufacture,
    year_model: customerDto.year_model,
    color: customerDto.color,
    fuel: customerDto.fuel,
    power: customerDto.power,
    displacement: customerDto.displacement,
    engine_capacity: customerDto.engine_capacity,
    city_state: customerDto.city_state,
    chassis_masked: customerDto.chassis_masked,
    renavam_masked: customerDto.renavam_masked,
    engine_masked: customerDto.engine_masked,
    origin: customerDto.origin,
    seat_capacity: customerDto.seat_capacity,
    gearbox: customerDto.gearbox,
    traction: customerDto.traction,
    body_type: customerDto.body_type,

    procedural_verdict: customerDto.procedural_verdict,
    verdict_label: customerDto.verdict_label,
    verdict_description: customerDto.verdict_description,
    verdict_bullets: customerDto.verdict_bullets || [],
    risk_score: customerDto.risk_score,
    risk_level: customerDto.risk_level,

    risk_summary: {
      theft_robbery_clear: customerDto.risk_summary.theft_robbery_clear,
      judicial_clear: customerDto.risk_summary.judicial_clear,
      financial_clear: customerDto.risk_summary.financial_clear,
      auction_clear: customerDto.risk_summary.auction_clear,
      accident_clear: customerDto.risk_summary.accident_clear,
      recall_clear: customerDto.risk_summary.recall_clear,
      debts_clear: customerDto.risk_summary.debts_clear,
    },

    fipe_reference: customerDto.fipe_reference,
    fipe_variations: customerDto.fipe_variations,
    fipe_price_history: customerDto.fipe_price_history,

    debts_summary: customerDto.debts_summary,
    gravamen_details: customerDto.gravamen_details,
    auction_details: customerDto.auction_details,
    claims_details: customerDto.claims_details,
    owners_history: {
      owners_count: customerDto.owners_history?.owners_count || sanitizedOwners.length,
      records: sanitizedOwners,
    },
    mileage_history: customerDto.mileage_history,
    ads_history: customerDto.ads_history,
    recalls: customerDto.recalls,
    recalls_summary: customerDto.recalls_summary,
    latest_km_record: customerDto.latest_km_record,
    commercial_indicators: customerDto.commercial_indicators,

    is_mock: Boolean((internalDtoOrRecord as any).is_mock),
    disclaimer:
      'Este relatório foi elaborado com base nas informações disponibilizadas pelas bases governamentais e conveniadas consultadas na data indicada. A ausência de apontamentos não substitui vistoria mecânica presencial ou conferência física do veículo.',
    issuer: {
      company_name: 'AF Motos Comércio e Locação Ltda',
      trade_name: 'AF Motos',
      cnpj: '58.742.981/0001-08',
      city: 'Recife',
      state: 'PE',
    },
  };
}
