// ─────────────────────────────────────────────────────────────────────────────
// Recall Normalizer
//
// Pure, defensive, strongly-typed normalization for vehicle recall data from
// API Brasil and other external provider payloads.
// ─────────────────────────────────────────────────────────────────────────────

import { stripEmojis } from './availability-helpers.ts';

export type RecallItem = {
  codigoProcon?: string | null;
  dataInicioCampanha?: string | null;
  defeito?: string | null;
  descricaoCompleta?: string | null;
  gravidade?: string | null;
  risco?: string | null;
  sujeitoConfirmacaoPelaMontadora?: string | null;
  telefoneConfirmacao?: string | null;
  status?: string | null;
  realizado?: boolean | null;
  comprovanteUrl?: string | null;
};

export type RecallSummary = {
  hasRecallHistory: boolean;
  historyCount: number;
  pendingCount: number;
  completedCount: number | null;
  pendingItems: RecallItem[];
  historyItems: RecallItem[];
  status: 'NONE' | 'PENDING' | 'HISTORY_ONLY' | 'UNKNOWN';
  title: string;
  diagnosticLabel: string;
  diagnosticTone: 'success' | 'warning' | 'danger' | 'neutral';
  sourceDescription: string | null;
};

export type RecallItemResolution = {
  situation: 'Pendente' | 'Realizado' | 'Campanha identificada — sem pendência informada';
  action: string;
  isPending: boolean;
  isCompleted: boolean;
};

function getString(val: unknown): string | null {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof val === 'number') {
    return String(val);
  }
  return null;
}

function parseRecallItem(raw: unknown): RecallItem {
  if (!raw || typeof raw !== 'object') {
    return {
      codigoProcon: null,
      dataInicioCampanha: null,
      defeito: null,
      descricaoCompleta: null,
      gravidade: null,
      risco: null,
      sujeitoConfirmacaoPelaMontadora: null,
      telefoneConfirmacao: null,
      status: null,
      realizado: null,
      comprovanteUrl: null,
    };
  }

  const r = raw as Record<string, unknown>;

  const codigoProcon = getString(r.codigoProcon ?? r.codigo_procon ?? r.codigo ?? r.procon);
  const dataInicioCampanha = getString(
    r.dataInicioCampanha ?? r.data_inicio_campanha ?? r.data ?? r.data_anuncio ?? r.dataCampanha,
  );
  const defeito = getString(r.defeito ?? r.componente ?? r.sistema ?? r.titulo);
  const descricaoCompleta = getString(
    r.descricaoCompleta ?? r.descricao_completa ?? r.descricao ?? r.motivo,
  );
  const gravidade = getString(r.gravidade ?? r.severidade);
  const risco = getString(r.risco ?? r.descricao_risco ?? r.riscos);
  const sujeitoConfirmacaoPelaMontadora = getString(
    r.sujeitoConfirmacaoPelaMontadora ?? r.sujeito_confirmacao ?? r.confirmacaoMontadora,
  );
  const telefoneConfirmacao = getString(
    r.telefoneConfirmacao ?? r.telefone_confirmacao ?? r.telefone ?? r.contato,
  );
  const status = getString(r.status ?? r.situacao);

  let realizado: boolean | null = null;
  if (typeof r.realizado === 'boolean') {
    realizado = r.realizado;
  } else if (typeof r.concluido === 'boolean') {
    realizado = r.concluido;
  } else if (typeof r.atendido === 'boolean') {
    realizado = r.atendido;
  } else if (status) {
    const s = status.toUpperCase();
    if (s === 'ATENDIDO' || s === 'REALIZADO' || s === 'CONCLUIDO' || s === 'BAIXADO') {
      realizado = true;
    } else if (s === 'PENDENTE' || s === 'NAO ATENDIDO' || s === 'ABERTO') {
      realizado = false;
    }
  }

  const comprovanteUrl = getString(r.comprovanteUrl ?? r.comprovante_url ?? r.comprovante);

  return {
    codigoProcon,
    dataInicioCampanha,
    defeito,
    descricaoCompleta,
    gravidade,
    risco,
    sujeitoConfirmacaoPelaMontadora,
    telefoneConfirmacao,
    status,
    realizado,
    comprovanteUrl,
  };
}

/**
 * Normalizes recall information into a pure, defensive and strongly-typed RecallSummary.
 *
 * Rules:
 * - `historyItems` comes from `data.recall.detalhes` (when a valid array).
 * - `pendingItems` comes from `data.recall.recallsPendente` (when a valid array).
 * - `pendingCount` is strictly `pendingItems.length`.
 * - Never uses `historyItems.length` to define pending count.
 * - `hasRecallHistory` is `historyItems.length > 0`.
 * - `completedCount` returns an integer count only when explicit status is present, otherwise `null`.
 * - `recallsPendente` must be an array. If missing/null/undefined or an unexpected type (e.g. string or object),
 *   it classifies as `UNKNOWN` with a safe fallback to prevent crashes.
 */
export function normalizeRecallSummary(payload: unknown): RecallSummary {
  const defaultUnknown: RecallSummary = {
    hasRecallHistory: false,
    historyCount: 0,
    pendingCount: 0,
    completedCount: null,
    pendingItems: [],
    historyItems: [],
    status: 'UNKNOWN',
    title: 'RECALL DE FÁBRICA',
    diagnosticLabel: 'Não foi possível confirmar',
    diagnosticTone: 'neutral',
    sourceDescription: null,
  };

  if (!payload || typeof payload !== 'object') {
    return defaultUnknown;
  }

  const root = payload as Record<string, unknown>;

  // Resolve the recall container node
  let recallNode: Record<string, unknown> | null = null;

  if (root.data && typeof root.data === 'object') {
    const d = root.data as Record<string, unknown>;
    if (d.recall && typeof d.recall === 'object') {
      recallNode = d.recall as Record<string, unknown>;
    }
  }

  if (!recallNode && root.recall && typeof root.recall === 'object') {
    recallNode = root.recall as Record<string, unknown>;
  }

  if (
    !recallNode &&
    ('detalhes' in root || 'recallsPendente' in root || 'descricaoRetorno' in root)
  ) {
    recallNode = root;
  }

  if (!recallNode) {
    return defaultUnknown;
  }

  const sourceDescription = getString(recallNode.descricaoRetorno);

  // Parse history items from detalhes or chamados
  const rawHistory = recallNode.detalhes ?? recallNode.chamados;
  let historyItems: RecallItem[] = [];
  if (Array.isArray(rawHistory)) {
    historyItems = rawHistory.map(parseRecallItem);
  }

  const historyCount = historyItems.length;
  const hasRecallHistory = historyCount > 0;

  // Defensive validation of recallsPendente:
  // Must be an array. If null, undefined, string, or non-array object, return UNKNOWN.
  const rawPending = recallNode.recallsPendente;
  if (!Array.isArray(rawPending)) {
    return {
      hasRecallHistory,
      historyCount,
      pendingCount: 0,
      completedCount: null,
      pendingItems: [],
      historyItems,
      status: 'UNKNOWN',
      title: 'RECALL DE FÁBRICA',
      diagnosticLabel: 'Não foi possível confirmar',
      diagnosticTone: 'neutral',
      sourceDescription,
    };
  }

  const pendingItems: RecallItem[] = rawPending.map(parseRecallItem);
  const pendingCount = pendingItems.length;

  // Evaluate explicit completedCount
  let completedCount: number | null = null;
  const explicitCompletedHistory = historyItems.filter((item) => {
    if (item.realizado === true) return true;
    const st = item.status?.trim().toUpperCase();
    return st === 'ATENDIDO' || st === 'REALIZADO' || st === 'CONCLUIDO' || st === 'BAIXADO';
  });

  if (explicitCompletedHistory.length > 0) {
    completedCount = explicitCompletedHistory.length;
  } else if (Array.isArray(recallNode.recallsAtendidos)) {
    completedCount = recallNode.recallsAtendidos.length;
  } else if (Array.isArray(recallNode.atendidos)) {
    completedCount = recallNode.atendidos.length;
  } else {
    completedCount = null;
  }

  // Determine status
  let status: RecallSummary['status'] = 'NONE';
  if (pendingCount > 0) {
    status = 'PENDING';
  } else if (historyCount > 0) {
    status = 'HISTORY_ONLY';
  } else {
    status = 'NONE';
  }

  // Formatting diagnostic label & tone according to specification table
  let diagnosticLabel = 'Não foi possível confirmar';
  let diagnosticTone: RecallSummary['diagnosticTone'] = 'neutral';

  if (status === 'PENDING') {
    diagnosticLabel =
      pendingCount === 1 ? '1 pendência de recall' : `${pendingCount} pendência(s) de recall`;
    diagnosticTone = 'danger';
  } else if (status === 'HISTORY_ONLY') {
    diagnosticLabel = 'Nenhuma pendência';
    diagnosticTone = 'success';
  } else if (status === 'NONE') {
    diagnosticLabel = 'Nenhuma campanha identificada';
    diagnosticTone = 'neutral';
  } else {
    diagnosticLabel = 'Não foi possível confirmar';
    diagnosticTone = 'neutral';
  }

  return {
    hasRecallHistory,
    historyCount,
    pendingCount,
    completedCount,
    pendingItems,
    historyItems,
    status,
    title: 'RECALL DE FÁBRICA',
    diagnosticLabel,
    diagnosticTone,
    sourceDescription,
  };
}

/**
 * Resolves the display situation and recommended action for an individual recall item.
 *
 * Rules:
 * 1. If the item exists in pendingItems or has explicit pending status -> 'Pendente'
 * 2. If the item has explicit proof/completed status -> 'Realizado'
 * 3. If the item is only in historyItems without pending report and without unequivocal proof:
 *    -> 'Campanha identificada — sem pendência informada'
 * (Never assume 'Realizado' without unequivocal status)
 */
export function resolveRecallItemSituation(
  item: RecallItem,
  pendingItems: RecallItem[],
  brandName?: string | null,
): RecallItemResolution {
  const brand = brandName && brandName.trim().length > 0 ? brandName.trim() : 'autorizada';

  // Check if this item is in the pending list
  const isExplicitlyPending =
    item.status?.trim().toUpperCase() === 'PENDENTE' || item.realizado === false;

  const matchesPending =
    isExplicitlyPending ||
    pendingItems.some((p) => {
      if (item.codigoProcon && p.codigoProcon && item.codigoProcon === p.codigoProcon) {
        return true;
      }
      if (
        item.defeito &&
        p.defeito &&
        item.defeito.trim().toLowerCase() === p.defeito.trim().toLowerCase() &&
        item.dataInicioCampanha === p.dataInicioCampanha
      ) {
        return true;
      }
      return false;
    });

  if (matchesPending) {
    const brandLabel =
      brand.toLowerCase().includes('concession') || brand.toLowerCase().includes('autorizad')
        ? brand
        : `${brand}`;
    return {
      situation: 'Pendente',
      action: `Agendar atendimento gratuito em uma concessionária autorizada ${brandLabel} e confirmar a situação pelo chassi.`,
      isPending: true,
      isCompleted: false,
    };
  }

  // Check if there is unequivocal proof/status of completion
  const isExplicitlyCompleted =
    item.realizado === true ||
    (item.status &&
      ['ATENDIDO', 'REALIZADO', 'CONCLUIDO', 'BAIXADO'].includes(
        item.status.trim().toUpperCase(),
      )) ||
    Boolean(item.comprovanteUrl);

  if (isExplicitlyCompleted) {
    return {
      situation: 'Realizado',
      action: 'Campanha registrada como realizada. Guarde o comprovante de atendimento.',
      isPending: false,
      isCompleted: true,
    };
  }

  // History item without pending and without unequivocal completed proof
  return {
    situation: 'Campanha identificada — sem pendência informada',
    action:
      'Nenhuma ação indicada pela resposta. Confirme com a montadora caso necessite de comprovante.',
    isPending: false,
    isCompleted: false,
  };
}

/**
 * Safely formats recall campaign start date into dd/MM/yyyy.
 */
export function formatRecallDate(dateStr?: string | null): string {
  if (!dateStr || typeof dateStr !== 'string') {
    return 'N/I';
  }

  const clean = dateStr.trim();
  if (!clean) return 'N/I';

  // Format DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}/.test(clean)) {
    return clean.slice(0, 10);
  }

  // Format YYYY-MM-DD or ISO
  const isoMatch = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}/${month}/${year}`;
  }

  // If cannot parse as date, return stripped clean string if short, or N/I
  if (clean.length <= 15) {
    return stripEmojis(clean);
  }

  return 'N/I';
}

/**
 * Sanitizes and bounds long text descriptions for safe PDF table rendering without layout overflow.
 */
export function sanitizeRecallText(text?: string | null, maxLength = 160): string {
  if (!text || typeof text !== 'string') {
    return '-';
  }

  const stripped = stripEmojis(text.trim());
  if (!stripped) return '-';

  if (stripped.length <= maxLength) {
    return stripped;
  }

  return `${stripped.slice(0, maxLength).trim()}...`;
}
