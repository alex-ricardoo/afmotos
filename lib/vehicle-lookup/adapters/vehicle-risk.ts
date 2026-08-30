import type { ApiBrasilVehicleResponse } from '../schema.ts';
import type { RiskLevel } from '../types.ts';
import { parseBrazilianNumber } from './apibrasil-vehicle-total.ts';

export interface CalculatedRiskMatrix {
  risk_level: RiskLevel;
  risk_index: number;
  has_active_theft_robbery: boolean;
  has_judicial_restriction: boolean;
  has_financial_restriction: boolean;
  has_active_gravamen: boolean;
  has_auction_record: boolean;
  has_accident_indication: boolean;
  has_debts: boolean;
  debts_total_amount: number;
}

export function toVehicleRiskSummary(parsed: ApiBrasilVehicleResponse): CalculatedRiskMatrix {
  const d = parsed.data || parsed.dados;
  if (!d) {
    return {
      risk_level: 'LOW',
      risk_index: 0,
      has_active_theft_robbery: false,
      has_judicial_restriction: false,
      has_financial_restriction: false,
      has_active_gravamen: false,
      has_auction_record: false,
      has_accident_indication: false,
      has_debts: false,
      debts_total_amount: 0,
    };
  }

  // 1. Theft / Robbery
  const baseNacOcorrencia = String(d.baseNacional?.ocorrencia || d.base_nacional?.situacao_roubo_furto || '');
  const hasTheft = Boolean(
    d.rouboFurto?.constaOcorrencia === true ||
    d.rouboFurto?.constaOcorrenciaAtiva === true ||
    d.base_nacional?.alerta_roubo_furto === true ||
    (baseNacOcorrencia.includes('ROUBO') && !baseNacOcorrencia.includes('NAO INDICA') && !baseNacOcorrencia.includes('SEM REGISTRO'))
  );

  // 2. Judicial restriction (Renajud)
  const restJudicial = String(d.baseEstadual?.restricaoJudicial || d.base_estadual?.restricao_judicial_descricao || '');
  const restRenajud = String(d.baseEstadual?.restricaoRenajud || '');
  const hasJudicial = Boolean(
    d.base_estadual?.tem_restricao_judicial === true ||
    (restJudicial && !restJudicial.includes('NADA CONSTA') && restJudicial !== ' ') ||
    (restRenajud && !restRenajud.includes('NADA CONSTA') && restRenajud !== ' ')
  );

  // 3. Financial restriction / Gravamen
  let hasActiveGravamen = false;
  let hasFinancial = false;

  if (Array.isArray(d.gravame)) {
    hasActiveGravamen = d.gravame.some((g: any) => {
      const sit = String(g.situacao || g.gravame || '').toUpperCase();
      return sit.includes('ALIENACAO') || sit.includes('PENDENTE') || sit.includes('ATIVO');
    });
    hasFinancial = hasActiveGravamen;
  } else if (d.gravame && typeof d.gravame === 'object') {
    hasActiveGravamen = Boolean(d.gravame.tem_gravame);
    const sit = String(d.gravame.situacao || '').toUpperCase();
    hasFinancial = hasActiveGravamen || sit.includes('ALIENADO');
  }

  // 4. Auction (Leilão)
  const leilaoDesc = String(d.leilao?.descricao || '');
  const hasAuction = Boolean(
    d.leilao?.tem_leilao ||
    (Array.isArray(d.leilao?.registros) && d.leilao.registros.length > 0) ||
    (leilaoDesc && !leilaoDesc.toLowerCase().includes('nao consta') && !leilaoDesc.toLowerCase().includes('sem registro'))
  );

  // 5. Accident (Sinistro)
  const sinistroDesc = String(d.indicioSinistro?.descricao || '');
  const hasAccident = Boolean(
    d.sinistro?.tem_sinistro ||
    (Array.isArray(d.sinistro?.registros) && d.sinistro.registros.length > 0) ||
    (sinistroDesc && !sinistroDesc.toUpperCase().includes('NAO CONSTA'))
  );

  // 6. Debts (Multas + IPVA + Licenciamento)
  const be = d.baseEstadual || d.base_estadual || {};
  const multasVal = parseBrazilianNumber(be.debitoMultas ?? be.multas_debito);
  const ipvaVal = parseBrazilianNumber(be.debitoIpva ?? be.ipva_debito);
  const licVal = parseBrazilianNumber(be.debitoLicenciamento ?? be.licenciamento_debito);
  const totalDebts = parseBrazilianNumber(be.total_debitos) || multasVal + ipvaVal + licVal;
  const hasDebts = totalDebts > 0;

  // 7. Calculate Risk Index & Level
  const rawIndice = d.analiseRisco?.indiceRisco;
  let riskScore = rawIndice ? parseInt(String(rawIndice), 10) * 10 : 0;

  if (hasTheft) riskScore += 50;
  if (hasJudicial) riskScore += 40;
  if (hasAccident) riskScore += 30;
  if (hasAuction) riskScore += 25;
  if (hasActiveGravamen) riskScore += 15;
  if (hasDebts && totalDebts > 1000) riskScore += 15;
  else if (hasDebts) riskScore += 5;

  const riskIndex = Math.min(100, isNaN(riskScore) ? 0 : riskScore);

  let riskLevel: RiskLevel = 'LOW';
  if (hasTheft || hasJudicial || riskIndex >= 70) {
    riskLevel = 'CRITICAL';
  } else if (hasAuction || hasAccident || riskIndex >= 40) {
    riskLevel = 'HIGH';
  } else if (hasFinancial || hasDebts || riskIndex >= 15) {
    riskLevel = 'MEDIUM';
  }

  return {
    risk_level: riskLevel,
    risk_index: riskIndex,
    has_active_theft_robbery: hasTheft,
    has_judicial_restriction: hasJudicial,
    has_financial_restriction: hasFinancial,
    has_active_gravamen: hasActiveGravamen,
    has_auction_record: hasAuction,
    has_accident_indication: hasAccident,
    has_debts: hasDebts,
    debts_total_amount: totalDebts,
  };
}
