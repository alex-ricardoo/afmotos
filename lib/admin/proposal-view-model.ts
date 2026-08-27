import {
  ProposalType,
  ProposalStatus,
  proposalTypeLabels,
  proposalStatusLabels,
  getProposalStatusLabel,
} from './proposal-labels';

export type ProposalSource = 'lead' | 'sell_request' | 'consignment_request' | 'rental_request';

export interface ProposalImage {
  id?: string;
  url: string;
  thumbnailUrl?: string | null;
  altText?: string | null;
  provider?: 'imgbb' | 'supabase' | null;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface ProposalMotorcycle {
  id: string | null;
  brand: string | null;
  model: string | null;
  version: string | null;
  year: number | null;
  yearManufacture?: number | null;
  yearModel?: number | null;
  mileage: number | null;
  color: string | null;
  desiredPrice: number | null;
  fipePrice: number | null;
  fipeCode?: string | null;
  offerPercentage?: number | null;
  estimatedOffer?: number | null;
  fipeReferencePeriod?: string | null;
  fipeSnapshot?: Record<string, unknown> | null;
  licensePlate?: string | null;
}


export interface ProposalRental {
  age: number | null;
  hasCnhA: string | null;
  purposeOfUse: string | null;
  desiredPlan: string | null;
  expectedStartDate: string | null;
}

export type ProposalViewModel = {
  id: string;
  source: ProposalSource;
  sourceId: string;
  type: ProposalType;
  typeLabel: string;
  status: ProposalStatus;
  statusLabel: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  state: string | null;
  message: string | null;
  notes?: string | null;
  createdAt: string;
  motorcycle: ProposalMotorcycle | null;
  rental?: ProposalRental | null;
  images: ProposalImage[];
  metadata: Record<string, unknown>;
};

export function normalizeStatus(status: string | undefined): ProposalStatus {
  if (!status) return 'NEW';

  const statusMap: Record<string, ProposalStatus> = {
    NEW: 'NEW',
    novo: 'NEW',
    novo_contato: 'NEW',
    PENDING: 'NEW',
    pending: 'NEW',
    IN_CONTACT: 'CONTACTED',
    em_contato: 'CONTACTED',
    em_atendimento: 'CONTACTED',
    CONTACTED: 'CONTACTED',
    QUALIFIED: 'QUALIFIED',
    qualificado: 'QUALIFIED',
    NEGOTIATING: 'QUALIFIED',
    negociando: 'QUALIFIED',
    CONVERTED: 'CONVERTED',
    convertido: 'CONVERTED',
    ganho: 'CONVERTED',
    CONCLUDED: 'CONVERTED',
    concluded: 'CONVERTED',
    concluido: 'CONVERTED',
    APPROVED: 'CONVERTED',
    approved: 'CONVERTED',
    CLOSED: 'CLOSED',
    encerrado: 'CLOSED',
    LOST: 'LOST',
    perdido: 'LOST',
    REJECTED: 'LOST',
    rejected: 'LOST',
  };

  return statusMap[status.toUpperCase()] || statusMap[status.toLowerCase()] || 'NEW';
}

export function normalizeType(type: string | undefined): ProposalType {
  if (!type) return 'GENERAL_CONTACT';

  const typeMap: Record<string, ProposalType> = {
    MOTORCYCLE_INTEREST: 'MOTORCYCLE_INTEREST',
    interesse: 'MOTORCYCLE_INTEREST',
    SELL_MOTORCYCLE: 'SELL_MOTORCYCLE',
    venda: 'SELL_MOTORCYCLE',
    venda_moto: 'SELL_MOTORCYCLE',
    CONSIGNMENT: 'CONSIGNMENT',
    consignar: 'CONSIGNMENT',
    anunciar: 'CONSIGNMENT',
    RENTAL: 'RENTAL',
    aluguel: 'RENTAL',
    MOTORCYCLE_REQUEST: 'MOTORCYCLE_REQUEST',
    pedido: 'MOTORCYCLE_REQUEST',
    GENERAL_CONTACT: 'GENERAL_CONTACT',
    contato: 'GENERAL_CONTACT',
  };

  return typeMap[type] || typeMap[type.toLowerCase()] || 'GENERAL_CONTACT';
}

export function extractImages(
  metadata: Record<string, unknown> | null | undefined,
): ProposalImage[] {
  if (!metadata) return [];

  const rawImages = (metadata.images || metadata.photos) as unknown;

  if (Array.isArray(rawImages)) {
    return rawImages
      .map((img: unknown, index: number): ProposalImage | null => {
        if (!img) return null;
        if (typeof img === 'string') {
          return {
            id: String(index),
            url: img,
            thumbnailUrl: img,
            altText: `Foto ${index + 1}`,
            provider: img.includes('ibb.co') ? 'imgbb' : 'supabase',
            sortOrder: index,
            isPrimary: index === 0,
          };
        }
        if (typeof img === 'object' && img !== null && 'url' in img) {
          const imgObj = img as {
            id?: string;
            url: string;
            thumbnailUrl?: string | null;
            altText?: string | null;
            provider?: 'imgbb' | 'supabase' | null;
            sortOrder?: number;
            isPrimary?: boolean;
          };
          return {
            id: imgObj.id || String(index),
            url: imgObj.url,
            thumbnailUrl: imgObj.thumbnailUrl || imgObj.url,
            altText: imgObj.altText || `Foto ${index + 1}`,
            provider: imgObj.provider || (imgObj.url.includes('ibb.co') ? 'imgbb' : 'supabase'),
            sortOrder: imgObj.sortOrder ?? index,
            isPrimary: imgObj.isPrimary ?? index === 0,
          };
        }
        return null;
      })
      .filter((img): img is ProposalImage => Boolean(img && img.url));
  }

  return [];
}

export function getProposalImages(proposal: ProposalViewModel): ProposalImage[] {
  if (proposal.images && proposal.images.length > 0) {
    return proposal.images;
  }
  return extractImages(proposal.metadata);
}

export function mapLeadToProposal(
  lead: Record<string, unknown> & {
    id: string;
    status?: string;
    type?: string;
    source?: string;
    name?: string;
    phone?: string;
    email?: string | null;
    message?: string | null;
    notes?: string | null;
    created_at?: string;
    city?: string | null;
    state?: string | null;
    brand?: string | null;
    model?: string | null;
    version?: string | null;
    year_model?: number | null;
    year_manufacture?: number | null;
    color?: string | null;
    metadata?: Record<string, unknown>;
  },
): ProposalViewModel {
  const status = normalizeStatus(lead.status);
  const type = normalizeType(lead.type);
  const metadata = (lead.metadata as Record<string, unknown>) || {};

  const year =
    (metadata.year_model as number | string | undefined) ||
    (metadata.year_manufacture as number | string | undefined) ||
    (metadata.year as number | string | undefined) ||
    lead.year_model ||
    lead.year_manufacture ||
    null;

  const brand = ((metadata.brand as string | undefined) || lead.brand || null) as string | null;
  const model = ((metadata.model as string | undefined) || lead.model || null) as string | null;

  return {
    id: lead.id,
    source: (lead.source === 'sell_request' || metadata.sell_request_id
      ? 'sell_request'
      : 'lead') as ProposalSource,
    sourceId: (metadata.sell_request_id as string | undefined) || lead.id,
    type,
    typeLabel: proposalTypeLabels[type] || type,
    status,
    statusLabel: getProposalStatusLabel(status, type),
    name: lead.name || 'Sem nome',

    phone: lead.phone || '',
    email: lead.email || null,
    message: lead.message || null,
    notes: (metadata.notes as string | undefined) || lead.notes || null,
    createdAt: lead.created_at || new Date().toISOString(),
    city: ((metadata.city as string | undefined) || lead.city || null) as string | null,
    state: ((metadata.state as string | undefined) || lead.state || 'PE') as string | null,
    motorcycle:
      brand || model
        ? {
            id: (metadata.motorcycle_id as string | undefined) || null,
            brand,
            model,
            version: ((metadata.version as string | undefined) || lead.version || null) as
              string | null,
            year: typeof year === 'number' ? year : year ? Number(year) : null,
            yearManufacture: metadata.year_manufacture ? Number(metadata.year_manufacture) : null,
            yearModel: metadata.year_model ? Number(metadata.year_model) : null,
            mileage: metadata.mileage != null ? Number(metadata.mileage) : null,
            color: ((metadata.color as string | undefined) || lead.color || null) as string | null,
            desiredPrice: metadata.desired_price != null ? Number(metadata.desired_price) : null,
            fipePrice: metadata.fipe_price != null ? Number(metadata.fipe_price) : null,
            fipeCode: (metadata.fipe_code as string | undefined) || null,
            offerPercentage:
              metadata.offer_percentage != null ? Number(metadata.offer_percentage) : null,
            estimatedOffer:
              metadata.estimated_offer != null ? Number(metadata.estimated_offer) : null,
            fipeReferencePeriod: (metadata.fipe_reference_period as string | undefined) || null,
            fipeSnapshot: (metadata.fipe_snapshot as Record<string, unknown> | undefined) || null,
          }
        : null,

    rental: null,
    images: extractImages(metadata),
    metadata,
  };
}

export function mapRentalRequestToProposal(row: Record<string, any>): ProposalViewModel {
  const status = normalizeStatus(row.status);
  const type: ProposalType = 'RENTAL';

  const motorcycleData = row.motorcycle;
  let motorcycle: ProposalMotorcycle | null = null;
  let images: ProposalImage[] = [];

  if (motorcycleData) {
    motorcycle = {
      id: motorcycleData.id || null,
      brand: motorcycleData.brand || null,
      model: motorcycleData.model || null,
      version: motorcycleData.version || null,
      year: motorcycleData.year_model || motorcycleData.year_manufacture || null,
      yearManufacture: motorcycleData.year_manufacture || null,
      yearModel: motorcycleData.year_model || null,
      mileage: motorcycleData.mileage != null ? Number(motorcycleData.mileage) : null,
      color: motorcycleData.color || null,
      desiredPrice: motorcycleData.price != null ? Number(motorcycleData.price) : null,
      fipePrice: null,
    };

    if (
      Array.isArray(motorcycleData.motorcycle_images) &&
      motorcycleData.motorcycle_images.length > 0
    ) {
      images = motorcycleData.motorcycle_images.map((img: any, idx: number) => {
        let publicUrl = img.storage_path || img.public_url || '';
        if (publicUrl && !publicUrl.startsWith('http') && !publicUrl.startsWith('/')) {
          publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}/storage/v1/object/public/motorcycle-images/${publicUrl}`;
        }
        return {
          id: img.id || String(idx),
          url: publicUrl,
          thumbnailUrl: publicUrl,
          altText: `Foto ${idx + 1}`,
          provider: 'supabase',
          sortOrder: idx,
          isPrimary: img.is_primary || idx === 0,
        };
      });
    }
  }

  return {
    id: row.id,
    source: 'rental_request',
    sourceId: row.id,
    type,
    typeLabel: proposalTypeLabels[type] || 'Aluguel de moto',
    status,
    statusLabel: getProposalStatusLabel(status, type),
    name: row.name || 'Cliente sem nome',

    phone: row.phone || '',
    email: null,
    city: null,
    state: null,
    message: row.notes || null,
    notes: row.notes || null,
    createdAt: row.created_at || new Date().toISOString(),
    motorcycle,
    rental: {
      age: row.age != null ? Number(row.age) : null,
      hasCnhA: row.has_cnh_a || null,
      purposeOfUse: row.purpose_of_use || null,
      desiredPlan: row.desired_plan || null,
      expectedStartDate: row.expected_start_date || null,
    },
    images,
    metadata: {
      rental_request_id: row.id,
      age: row.age,
      has_cnh_a: row.has_cnh_a,
      purpose_of_use: row.purpose_of_use,
      desired_plan: row.desired_plan,
      expected_start_date: row.expected_start_date,
    },
  };
}

/**
 * Gera a URL para a tela de cadastrar nova moto no estoque (/admin/motos/nova)
 * com todos os dados da proposta (marca, modelo, anos, cor, km, preço, fotos) já preenchidos.
 */
export function getStockRegistrationUrlFromProposal(proposal: ProposalViewModel): string {
  const params = new URLSearchParams();
  if (proposal.motorcycle?.brand) params.set('brand', proposal.motorcycle.brand);
  if (proposal.motorcycle?.model) params.set('model', proposal.motorcycle.model);
  if (proposal.motorcycle?.version) params.set('version', proposal.motorcycle.version);
  if (proposal.motorcycle?.yearManufacture) {
    params.set('year_manufacture', String(proposal.motorcycle.yearManufacture));
  } else if (proposal.motorcycle?.year) {
    params.set('year_manufacture', String(proposal.motorcycle.year));
  }
  if (proposal.motorcycle?.yearModel) {
    params.set('year_model', String(proposal.motorcycle.yearModel));
  } else if (proposal.motorcycle?.year) {
    params.set('year_model', String(proposal.motorcycle.year));
  }
  if (proposal.motorcycle?.color) params.set('color', proposal.motorcycle.color);
  if (proposal.motorcycle?.mileage != null) params.set('mileage', String(proposal.motorcycle.mileage));
  if (proposal.motorcycle?.fipePrice != null) params.set('fipe_price', String(proposal.motorcycle.fipePrice));
  if (proposal.motorcycle?.desiredPrice != null) params.set('price', String(proposal.motorcycle.desiredPrice));
  if (proposal.motorcycle?.licensePlate) params.set('license_plate', proposal.motorcycle.licensePlate);

  params.set('ownership_type', proposal.type === 'CONSIGNMENT' ? 'CONSIGNMENT' : 'OWNED');
  params.set('proposal_id', proposal.id);
  if (proposal.name) params.set('from_client', proposal.name);

  // Anexar URLs de imagens se houver
  const images = getProposalImages(proposal);
  if (images.length > 0) {
    const urls = images.map((img) => img.url).filter(Boolean);
    if (urls.length > 0) {
      params.set('images', JSON.stringify(urls));
    }
  }

  return `/admin/motos/nova?${params.toString()}`;
}

