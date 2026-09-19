import type { ApiBrasilVehicleResponse } from '../schema.ts';
import type {
  InternalVehicleConsultationDto,
  AuctionRecord,
  AuctionScore,
  AuctionPhoto,
} from '../types.ts';
import { maskCpf, maskCnpj } from '../sanitizers/index.ts';
import { normalizeText } from './vehicle-risk.ts';

const CORPORATE_KEYWORDS_REGEX = /\b(LTDA|S\/A|SA|LOCADORA|EIRELI|ME|EPP|CIA|COMPANHIA|BANCO|FINANCEIRA|COOPERATIVA|EMPRESA|COMERCIO|SERVICOS|AUTO|VEICULOS|MOTOS|TRANSPORTES|DISTRIBUIDORA|ASSOCIACAO|FUNDACAO)\b/i;

export function toVehicleHistorySummary(
  parsed: ApiBrasilVehicleResponse
): InternalVehicleConsultationDto['history'] {
  const d = parsed.data || parsed.dados;
  if (!d) {
    return {
      owners_count: 0,
      previous_owners: [],
      has_auction: false,
      auction_records: [],
      has_claims: false,
      claims_records: [],
      recalls: [],
    };
  }

  // Previous owners - Tarefa A: Correção de Lógica de Negócio (Tipagem de Proprietários)
  const rawOwners = Array.isArray(d.historicoProprietarios)
    ? d.historicoProprietarios
    : Array.isArray(d.proprietarios?.historico)
    ? d.proprietarios.historico
    : [];

  const owners = rawOwners.map((o: any) => {
    const rawDoc = String(o.cpfCnpj || o.documento || '');
    const cleanDoc = rawDoc.replace(/\D/g, '');
    const ownerName = String(o.proprietario || o.nome || '').trim().toUpperCase();

    // Check if corporate by length, keywords in company name, or explicit tipoDocumento
    const isPjByName = CORPORATE_KEYWORDS_REGEX.test(ownerName);
    const isExplicitPj = o.tipoDocumento === 'JURIDICA' || o.tipo_documento === 'PJ' || o.tipoDocumento === 'PJ';
    const isPj = cleanDoc.length === 14 || isPjByName || isExplicitPj;

    const docType: 'PF' | 'PJ' = isPj ? 'PJ' : 'PF';

    let masked = o.documento_mascarado;
    if (!masked && cleanDoc) {
      masked = docType === 'PJ' ? maskCnpj(cleanDoc) : maskCpf(cleanDoc);
    }

    return {
      state: o.uf || 'SP',
      period: o.anoExercicio || o.periodo || undefined,
      document_type: docType,
      masked_document: masked || (docType === 'PJ' ? '**.***.***/****-**' : '***.***.***-**'),
    };
  });

  // Auction records (leilao.registros)
  const rawAuctions = Array.isArray(d.leilao?.registros) ? d.leilao!.registros : [];
  const auctions: AuctionRecord[] = rawAuctions.map((a: any) => {
    const recordPhotos: string[] = [];
    if (Array.isArray(a.fotos)) {
      a.fotos.forEach((f: any) => {
        if (typeof f === 'string' && f.trim()) {
          recordPhotos.push(f.trim());
        } else if (f && typeof f === 'object' && (f.url || f.base64)) {
          const src = f.url || f.base64;
          if (src) recordPhotos.push(String(src).trim());
        }
      });
    }

    return {
      auctioneer: a.leiloeiro || a.comitente || 'Leilão Oficial',
      auction_date: a.dataLeilao || a.data || a.data_leilao || undefined,
      lot: a.lote != null ? String(a.lote) : undefined,
      bidder: a.comitente || undefined,
      condition: a.condicaoGeral || a.condicao || a.situacao || 'Arrematado',
      claim_type: a.tipoSinistro || a.tipo_sinistro || a.tipo || undefined,
      yard: a.patio || undefined,
      chassis: a.chassi || undefined,
      plate: a.placa || undefined,
      make_model: a.marcaModelo || a.marca_modelo || undefined,
      category: a.tipoSinistro || a.categoria || a.condicaoGeral || 'Recuperado',
      photos: recordPhotos.length > 0 ? recordPhotos : undefined,
    };
  });

  // Auction score (leilao.score)
  let auctionScore: AuctionScore | undefined = undefined;
  const rawScore = d.leilao?.score || d.analiseLeilao?.score;
  if (rawScore && typeof rawScore === 'object') {
    auctionScore = {
      acceptance: rawScore.aceitacao != null ? String(rawScore.aceitacao) : undefined,
      special_inspection_required:
        rawScore.exigenciaVistoriaEspecial != null ? rawScore.exigenciaVistoriaEspecial : undefined,
      reference_percentage:
        rawScore.percentualSobreRef != null ? String(rawScore.percentualSobreRef) : undefined,
      points: rawScore.pontuacao != null ? String(rawScore.pontuacao) : undefined,
      score_label: rawScore.score != null ? String(rawScore.score) : undefined,
    };
  }

  // Consolidated Auction Photos
  // Sources: fotosLoteVeiculo.conteudo, fotos (root array), and leilao.registros[].fotos
  const photosList: AuctionPhoto[] = [];
  const seenSrcs = new Set<string>();

  const addPhoto = (url?: string | null, desc?: string | null, b64?: string | null) => {
    const rawUrl = url ? String(url).trim() : null;
    let rawB64 = b64 ? String(b64).trim() : null;
    if (rawB64 && !rawB64.startsWith('data:') && rawB64.length > 20) {
      rawB64 = `data:image/jpeg;base64,${rawB64}`;
    }
    const previewSrc = rawUrl || rawB64;
    if (!previewSrc || seenSrcs.has(previewSrc)) return;
    seenSrcs.add(previewSrc);

    photosList.push({
      url: rawUrl,
      description: desc ? String(desc).trim() : undefined,
      base64: rawB64,
      preview_src: previewSrc,
    });
  };

  // 1. fotosLoteVeiculo.conteudo (Structure 2)
  const rawLoteConteudo = d.fotosLoteVeiculo?.conteudo;
  if (Array.isArray(rawLoteConteudo)) {
    rawLoteConteudo.forEach((item: any, idx: number) => {
      if (typeof item === 'string' && item.trim()) {
        addPhoto(item.trim(), `Foto do Lote #${idx + 1}`);
      } else if (item && typeof item === 'object') {
        addPhoto(item.url, item.descricao || `Foto do Lote #${idx + 1}`, item.base64);
      }
    });
  }

  // 2. fotos root array (Structure 2)
  const rawFotos = d.fotos;
  if (Array.isArray(rawFotos)) {
    rawFotos.forEach((item: any, idx: number) => {
      if (typeof item === 'string' && item.trim()) {
        addPhoto(item.trim(), `Foto Leilão #${idx + 1}`);
      } else if (item && typeof item === 'object') {
        addPhoto(item.url, item.descricao || `Foto Leilão #${idx + 1}`, item.base64);
      }
    });
  }

  // 3. fotos inside each auction record (Structure 1)
  rawAuctions.forEach((a: any) => {
    if (Array.isArray(a.fotos)) {
      a.fotos.forEach((item: any, idx: number) => {
        if (typeof item === 'string' && item.trim()) {
          addPhoto(item.trim(), `Foto do Registro #${idx + 1}`);
        } else if (item && typeof item === 'object') {
          addPhoto(item.url, item.descricao || `Foto do Registro #${idx + 1}`, item.base64);
        }
      });
    }
  });

  // Claims (Sinistros)
  const rawClaims = Array.isArray(d.sinistro?.registros) ? d.sinistro!.registros : [];
  const claims = rawClaims.map((c: any) => ({
    claim_type: c.tipo || c.tipo_sinistro || 'Colisão',
    claim_date: c.data || undefined,
    damage_level: (c.monta || c.classificacao_monta || 'MEDIA') as 'PEQUENA' | 'MEDIA' | 'GRANDE',
    insurance_company: c.seguradora || undefined,
  }));

  // Recalls - Tarefa B: Inclusão do Status de Recall
  const rawRecalls: any[] = [];

  if (Array.isArray(d.recall?.recallsPendente)) {
    d.recall.recallsPendente.forEach((rp: any) => {
      rawRecalls.push({
        announcement_date: rp.data || rp.data_anuncio || undefined,
        component: rp.componente || rp.sistema || rp.descricao || 'Componente Veicular',
        risk_description: rp.descricao_risco || rp.motivo || rp.descricaoRetorno || 'Recall Pendente',
        status: 'PENDENTE' as const,
      });
    });
  }

  if (Array.isArray(d.recall?.detalhes)) {
    d.recall.detalhes.forEach((rd: any) => {
      rawRecalls.push({
        announcement_date: rd.data || rd.data_anuncio || undefined,
        component: rd.componente || rd.sistema || 'Componente Veicular',
        risk_description: rd.descricao_risco || rd.motivo || rd.descricaoRetorno || 'Verificar na concessionária',
        status: (rd.status === 'ATENDIDO' ? 'ATENDIDO' : 'PENDENTE') as 'PENDENTE' | 'ATENDIDO',
      });
    });
  }

  if (Array.isArray(d.recall?.chamados)) {
    d.recall.chamados.forEach((rc: any) => {
      rawRecalls.push({
        announcement_date: rc.data || rc.data_anuncio || undefined,
        component: rc.componente || rc.sistema || 'Componente Veicular',
        risk_description: rc.descricao_risco || rc.motivo || 'Chamado de fábrica',
        status: (rc.status === 'ATENDIDO' ? 'ATENDIDO' : 'PENDENTE') as 'PENDENTE' | 'ATENDIDO',
      });
    });
  }

  // Auction presence: prefer checking auctions.length > 0 per user requirement
  const leilaoDesc = normalizeText(d.leilao?.descricao || '');
  const hasAuction = Boolean(
    auctions.length > 0 ||
    d.leilao?.tem_leilao === true ||
    (photosList.length > 0 && d.fotosLoteVeiculo) ||
    (auctionScore && (Boolean(auctionScore.score_label) || Boolean(auctionScore.acceptance))) ||
    (leilaoDesc && !leilaoDesc.includes('NAO CONSTA') && !leilaoDesc.includes('SEM REGISTRO') && !leilaoDesc.includes('NADA CONSTA'))
  );

  const sinistroDesc = normalizeText(d.indicioSinistro?.descricao || '');
  const hasClaims = Boolean(
    d.sinistro?.tem_sinistro === true ||
    claims.length > 0 ||
    (sinistroDesc && !sinistroDesc.includes('NAO CONSTA') && !sinistroDesc.includes('NADA CONSTA') && !sinistroDesc.includes('SEM REGISTRO'))
  );

  return {
    owners_count: Number(d.proprietarios?.total_proprietarios || owners.length || 1),
    previous_owners: owners,
    has_auction: hasAuction,
    auction_records: auctions,
    auction_score: auctionScore,
    auction_photos: photosList.length > 0 ? photosList : undefined,
    has_claims: hasClaims,
    claims_records: claims,
    recalls: rawRecalls,
  };
}
