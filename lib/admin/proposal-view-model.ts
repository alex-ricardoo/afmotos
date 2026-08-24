import {
  ProposalType,
  ProposalStatus,
  proposalTypeLabels,
  proposalStatusLabels,
} from './proposal-labels';

export type ProposalSource = 'lead' | 'sell_request' | 'consignment_request';

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
  images: ProposalImage[];
  metadata: Record<string, unknown>;
};

export function normalizeStatus(status: string | undefined): ProposalStatus {
  if (!status) return 'NEW';

  const statusMap: Record<string, ProposalStatus> = {
    NEW: 'NEW',
    novo: 'NEW',
    novo_contato: 'NEW',
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
    CLOSED: 'CLOSED',
    encerrado: 'CLOSED',
    LOST: 'LOST',
    perdido: 'LOST',
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
    statusLabel: proposalStatusLabels[status] || status,
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
          }
        : null,
    images: extractImages(metadata),
    metadata,
  };
}
