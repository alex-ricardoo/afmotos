import { ProposalType, ProposalStatus, proposalTypeLabels, proposalStatusLabels } from './proposal-labels';

export interface ProposalImage {
  url: string;
  isPrimary?: boolean;
}

export type ProposalViewModel = {
  id: string;
  source: 'lead' | 'sell_request' | 'consignment_request';
  sourceId: string;
  type: ProposalType;
  typeLabel: string;
  status: ProposalStatus;
  statusLabel: string;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  createdAt: string;
  city: string | null;
  state: string | null;
  motorcycle: {
    id: string | null;
    brand: string | null;
    model: string | null;
    version: string | null;
    year: number | null;
    mileage: number | null;
    color: string | null;
    desiredPrice: number | null;
    fipePrice: number | null;
  } | null;
  images: ProposalImage[];
  metadata: Record<string, unknown>;
};

function normalizeStatus(status: string | undefined): ProposalStatus {
  if (!status) return 'NEW';
  
  const statusMap: Record<string, ProposalStatus> = {
    'NEW': 'NEW',
    'novo': 'NEW',
    'IN_CONTACT': 'CONTACTED',
    'em_contato': 'CONTACTED',
    'CONTACTED': 'CONTACTED',
    'QUALIFIED': 'QUALIFIED',
    'NEGOTIATING': 'QUALIFIED',
    'negociando': 'QUALIFIED',
    'CONVERTED': 'CONVERTED',
    'ganho': 'CONVERTED',
    'CLOSED': 'CLOSED',
    'LOST': 'LOST',
    'perdido': 'LOST',
  };

  return statusMap[status.toUpperCase()] || statusMap[status] || 'NEW';
}

function normalizeType(type: string | undefined): ProposalType {
  if (!type) return 'GENERAL_CONTACT';
  
  const typeMap: Record<string, ProposalType> = {
    'MOTORCYCLE_INTEREST': 'MOTORCYCLE_INTEREST',
    'SELL_MOTORCYCLE': 'SELL_MOTORCYCLE',
    'CONSIGNMENT': 'CONSIGNMENT',
    'RENTAL': 'RENTAL',
    'MOTORCYCLE_REQUEST': 'MOTORCYCLE_REQUEST',
    'GENERAL_CONTACT': 'GENERAL_CONTACT',
  };
  
  return typeMap[type] || 'GENERAL_CONTACT';
}

function extractImages(metadata: any): ProposalImage[] {
  if (!metadata) return [];
  
  if (Array.isArray(metadata.images)) {
    return metadata.images.map((img: string | { url: string }, index: number) => {
      const url = typeof img === 'string' ? img : img.url;
      return {
        url,
        isPrimary: index === 0
      };
    }).filter((img: ProposalImage) => img.url);
  }
  
  return [];
}

export function mapLeadToProposal(lead: any): ProposalViewModel {
  const status = normalizeStatus(lead.status);
  const type = normalizeType(lead.type);
  const metadata = lead.metadata || {};
  
  return {
    id: lead.id,
    source: 'lead',
    sourceId: lead.id,
    type,
    typeLabel: proposalTypeLabels[type] || type,
    status,
    statusLabel: proposalStatusLabels[status] || status,
    name: lead.name || 'Sem nome',
    phone: lead.phone || '',
    email: lead.email || null,
    message: lead.message || null,
    createdAt: lead.created_at || new Date().toISOString(),
    city: metadata.city || null,
    state: metadata.state || null,
    motorcycle: {
      id: metadata.motorcycle_id || null,
      brand: metadata.brand || null,
      model: metadata.model || null,
      version: metadata.version || null,
      year: metadata.year_model || metadata.year_manufacture || null,
      mileage: metadata.mileage || null,
      color: metadata.color || null,
      desiredPrice: metadata.desired_price ? Number(metadata.desired_price) : null,
      fipePrice: metadata.fipe_price ? Number(metadata.fipe_price) : null,
    },
    images: extractImages(metadata),
    metadata
  };
}
