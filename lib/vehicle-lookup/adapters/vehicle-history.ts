import type { ApiBrasilVehicleResponse } from '../schema.ts';
import type { InternalVehicleConsultationDto } from '../types.ts';
import { maskCpf, maskCnpj } from '../sanitizers/index.ts';

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

  // Auction records
  const rawAuctions = Array.isArray(d.leilao?.registros) ? d.leilao!.registros : [];
  const auctions = rawAuctions.map((a: any) => ({
    auctioneer: a.leiloeiro || a.comitente || 'Leilão Oficial',
    auction_date: a.data || a.data_leilao || undefined,
    lot: a.lote ? String(a.lote) : undefined,
    condition: a.condicao || a.situacao || 'Arrematado',
    category: a.categoria || 'Recuperado',
  }));

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

  const leilaoDesc = String(d.leilao?.descricao || '');
  const hasAuction = Boolean(
    d.leilao?.tem_leilao ||
    auctions.length > 0 ||
    (leilaoDesc && !leilaoDesc.toLowerCase().includes('nao consta') && !leilaoDesc.toLowerCase().includes('sem registro'))
  );

  const sinistroDesc = String(d.indicioSinistro?.descricao || '');
  const hasClaims = Boolean(
    d.sinistro?.tem_sinistro ||
    claims.length > 0 ||
    (sinistroDesc && !sinistroDesc.toUpperCase().includes('NAO CONSTA'))
  );

  return {
    owners_count: Number(d.proprietarios?.total_proprietarios || owners.length || 1),
    previous_owners: owners,
    has_auction: hasAuction,
    auction_records: auctions,
    has_claims: hasClaims,
    claims_records: claims,
    recalls: rawRecalls,
  };
}
