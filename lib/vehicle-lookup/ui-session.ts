/**
 * Gerenciador de Sessão de Interface e Telemetria Segura para Consulta Veicular
 *
 * Garante que:
 * 1. O estado de uma consulta ativa (startedAt, status, placa) seja preservado
 *    no sessionStorage para reconstrução precisa em caso de refresh;
 * 2. Nenhum dado sensível (token, CPF, Renavam, Chassi) seja persistido ou enviado;
 * 3. A telemetria registre apenas métricas operacionais agregadas;
 * 4. O cálculo do cronômetro seja determinístico a partir do startedAt original.
 */

export type LookupUiStatus =
  | 'starting'
  | 'processing'
  | 'completed'
  | 'consultation_in_progress'
  | 'charge_status_unknown'
  | 'manual_review'
  | 'failed';

export interface ActiveLookupSession {
  consultationId?: string;
  plateNormalized: string;
  plateDisplay: string;
  startedAt: string;
  status: LookupUiStatus;
  context: 'admin' | 'customer' | 'admin_panel' | 'customer_portal';
  estimatedCostCents?: number;
}

export const STORAGE_PREFIX = 'af_lookup_session_v1_';

/**
 * Salva a sessão ativa de consulta no sessionStorage com proteção contra falhas.
 */
export function saveActiveLookupSession(session: ActiveLookupSession): void {
  if (typeof window === 'undefined') return;

  try {
    const ctx =
      session.context === 'customer_portal' || session.context === 'customer'
        ? 'customer'
        : 'admin';
    const key = `${STORAGE_PREFIX}${ctx}_${session.plateNormalized.toUpperCase()}`;
    // Salva apenas os campos necessários, estritamente livres de dados sensíveis
    const payload: ActiveLookupSession = {
      consultationId: session.consultationId,
      plateNormalized: session.plateNormalized.toUpperCase(),
      plateDisplay: session.plateDisplay,
      startedAt: session.startedAt,
      status: session.status,
      context: session.context,
      estimatedCostCents: session.estimatedCostCents,
    };
    window.sessionStorage.setItem(key, JSON.stringify(payload));
  } catch (err) {
    // Falha silenciosa caso o armazenamento local esteja bloqueado por políticas do navegador
    console.warn('[LookupUiSession] Não foi possível salvar sessão no sessionStorage:', err);
  }
}

export const saveLookupSession = saveActiveLookupSession;

/**
 * Normaliza contexto admin/customer
 */
function normalizeContextKey(ctx?: string): 'admin' | 'customer' {
  if (!ctx) return 'admin';
  if (ctx.includes('customer')) return 'customer';
  return 'admin';
}

/**
 * Recupera a sessão ativa de consulta do sessionStorage.
 * Suporta tanto getActiveLookupSession('PFX3G38', 'admin') quanto getActiveLookupSession('admin', 'PFX3G38').
 */
export function getActiveLookupSession(
  param1: string,
  param2?: string
): ActiveLookupSession | null {
  if (typeof window === 'undefined') return null;

  let ctx: 'admin' | 'customer' = 'admin';
  let plate = param1;

  if (param2 !== undefined) {
    if (param1.includes('admin') || param1.includes('customer')) {
      ctx = normalizeContextKey(param1);
      plate = param2;
    } else {
      ctx = normalizeContextKey(param2);
      plate = param1;
    }
  }

  try {
    const key = `${STORAGE_PREFIX}${ctx}_${plate.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveLookupSession;
    if (!parsed || !parsed.startedAt || !parsed.plateNormalized) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Remove a sessão do sessionStorage após término definitivo ou cancelamento.
 */
export function clearActiveLookupSession(
  param1: string,
  param2?: string
): void {
  if (typeof window === 'undefined') return;

  let ctx: 'admin' | 'customer' = 'admin';
  let plate = param1;

  if (param2 !== undefined) {
    if (param1.includes('admin') || param1.includes('customer')) {
      ctx = normalizeContextKey(param1);
      plate = param2;
    } else {
      ctx = normalizeContextKey(param2);
      plate = param1;
    }
  }

  try {
    const key = `${STORAGE_PREFIX}${ctx}_${plate.toUpperCase().replace(/[^A-Z0-9]/g, '')}`;
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignora falhas de limpeza
  }
}

export const clearLookupSession = clearActiveLookupSession;

/**
 * Lista todas as sessões ativas do contexto atual (ex: para verificar pendências ao montar).
 */
export function listActiveLookupSessions(context: 'admin' | 'customer' = 'admin'): ActiveLookupSession[] {
  if (typeof window === 'undefined') return [];

  const sessions: ActiveLookupSession[] = [];
  try {
    const prefix = `${STORAGE_PREFIX}${context}_`;
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const key = window.sessionStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const raw = window.sessionStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed?.startedAt && parsed?.plateNormalized) {
            sessions.push(parsed);
          }
        }
      }
    }
  } catch {
    // Ignora falhas
  }
  return sessions;
}

/**
 * Formata os segundos decorridos no padrão estrito da especificação:
 * - até 59s: `00:47`
 * - acima de 1 minuto: `01:12`
 */
export function formatElapsedTime(seconds: number): string {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds <= 0) {
    return '00:00';
  }
  const safeSeconds = Math.floor(seconds);
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  const paddedMins = String(mins).padStart(2, '0');
  const paddedSecs = String(secs).padStart(2, '0');
  return `${paddedMins}:${paddedSecs}`;
}

/**
 * Calcula os segundos decorridos a partir de um ISO string de startedAt.
 * Garante que em caso de refresh o tempo continue do ponto correto.
 */
export function calculateElapsedSeconds(startedAtIso: string, nowMs = Date.now()): number {
  try {
    const startTime = new Date(startedAtIso).getTime();
    if (isNaN(startTime)) return 0;
    const diff = Math.max(0, nowMs - startTime);
    return Math.floor(diff / 1000);
  } catch {
    return 0;
  }
}

/**
 * Calcula o percentual de progresso estimado honesto:
 * - Nunca atinge 100% sem sucesso retornado do backend;
 * - Avanca suavemente até o teto de 85% durante a espera (120s max);
 * - Se completed, avanca para 100%.
 */
export function calculateHonestProgress(elapsedSeconds: number, status: LookupUiStatus): number {
  if (status === 'completed') {
    return 100;
  }

  if (['failed', 'charge_status_unknown', 'manual_review', 'consultation_in_progress'].includes(status)) {
    // Para estados de parada, congela no ponto atual
    return Math.min(85, Math.max(10, Math.floor((elapsedSeconds / 75) * 85)));
  }

  // Curva assintótica suave: nos primeiros 30s sobe até 50%, até 70s sobe até 75%, até 120s alcança máx 85%
  if (elapsedSeconds <= 0) return 5;
  if (elapsedSeconds <= 15) return 5 + Math.floor((elapsedSeconds / 15) * 25); // 5% -> 30%
  if (elapsedSeconds <= 45) return 30 + Math.floor(((elapsedSeconds - 15) / 30) * 30); // 30% -> 60%
  if (elapsedSeconds <= 90) return 60 + Math.floor(((elapsedSeconds - 45) / 45) * 18); // 60% -> 78%
  if (elapsedSeconds <= 120) return 78 + Math.floor(((elapsedSeconds - 90) / 30) * 7); // 78% -> 85%

  return 85; // Teto estrito durante espera
}

/**
 * Telemetria segura da interface de consulta.
 * Nunca inclui credenciais, tokens, CPF, dados de pagamento ou chassi.
 */
export interface UiTelemetryPayload {
  context: 'admin_panel' | 'customer_portal';
  plateMasked: string;
  status: LookupUiStatus;
  elapsedSeconds?: number;
  consultationIdMasked?: string;
  action?: string;
  source?: string;
}

export function maskPlateForTelemetry(plate: string): string {
  const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (clean.length < 4) return '***';
  return `${clean.slice(0, 3)}***${clean.slice(-1)}`;
}

export function maskIdForTelemetry(id?: string): string | undefined {
  if (!id) return undefined;
  if (id.length <= 8) return id;
  return `${id.slice(0, 4)}...${id.slice(-4)}`;
}

export function logLookupUiEvent(event: string, payload: UiTelemetryPayload): void {
  // Dispara apenas log estruturado no console cliente para observabilidade
  const timestamp = new Date().toISOString();
  const safeData = {
    tag: '[VEHICLE_LOOKUP_UI]',
    event,
    timestamp,
    context: payload.context,
    plate_masked: maskPlateForTelemetry(payload.plateMasked),
    status: payload.status,
    elapsed_seconds: payload.elapsedSeconds ?? 0,
    consultation_id_masked: maskIdForTelemetry(payload.consultationIdMasked),
    action: payload.action,
    source: payload.source,
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log(safeData.tag, event, safeData);
  }
}
