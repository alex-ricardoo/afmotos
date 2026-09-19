/* eslint-disable jsx-a11y/alt-text */
import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { CustomerVehicleReportDto } from '../types.ts';
import type { SiteSettings } from '@/types/database';
import { formatCnpj } from '@/lib/utils/cnpj';
import { formatPhone } from '@/lib/utils/formatters';
import { MercosulPlateBadge } from '@/lib/pdf/mercosul-plate-badge';
import { getSiteInitials } from '@/lib/site-settings';

const styles = StyleSheet.create({
  page: {
    padding: 18,
    paddingTop: 14,
    paddingBottom: 32,
    fontSize: 7.5,
    fontFamily: 'Helvetica',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    lineHeight: 1.25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 7,
    borderBottomWidth: 1.8,
    borderBottomColor: '#d97706',
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    maxWidth: '62%',
  },
  logoBox: {
    width: 44,
    height: 44,
    backgroundColor: '#090d16',
    borderRadius: 4,
    borderWidth: 1.2,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImg: {
    width: 42,
    height: 42,
    objectFit: 'contain',
  },
  logoText: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#f59e0b',
  },
  storeInfo: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    paddingLeft: 2,
  },
  storeName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#090d16',
    letterSpacing: 0.15,
    lineHeight: 1.15,
    marginBottom: 2.5,
  },
  storeContact: {
    fontSize: 6.6,
    color: '#475569',
    lineHeight: 1.3,
    marginBottom: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    flexDirection: 'column',
  },
  metaLabel: {
    fontSize: 6,
    color: '#64748b',
    marginTop: 1,
    textAlign: 'right',
  },

  // Section Styles
  section: {
    marginBottom: 5,
  },
  sectionHeader: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 2.5,
    paddingHorizontal: 5,
    borderLeftWidth: 2.8,
    borderLeftColor: '#d97706',
    borderRadius: 2,
    marginBottom: 2.5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 0.15,
  },
  sectionSub: {
    fontSize: 6,
    color: '#64748b',
  },

  // Cards & Grids
  card: {
    backgroundColor: '#f8fafc',
    borderRadius: 3,
    borderWidth: 0.6,
    borderColor: '#e2e8f0',
    padding: 4.5,
    marginBottom: 3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -2,
  },
  col3: { width: '25%', paddingHorizontal: 2, marginBottom: 2.5 },
  col4: { width: '33.33%', paddingHorizontal: 2, marginBottom: 2.5 },
  col6: { width: '50%', paddingHorizontal: 2, marginBottom: 2.5 },
  col12: { width: '100%', paddingHorizontal: 2, marginBottom: 2.5 },

  fieldLabel: {
    fontSize: 5.4,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.15,
    marginBottom: 1,
  },
  fieldValue: {
    fontSize: 7,
    color: '#1e293b',
  },
  fieldValueBold: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },

  // Verdict Banner
  verdictBanner: {
    borderRadius: 3.5,
    padding: 5.5,
    marginBottom: 5.5,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  verdictApproved: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  verdictAttention: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  verdictRestricted: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  verdictTitle: {
    fontSize: 8.6,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.2,
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 1.2,
  },
  bulletDot: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    marginRight: 4,
    lineHeight: 1.2,
  },
  bulletText: {
    fontSize: 6.8,
    color: '#475569',
    lineHeight: 1.25,
    maxWidth: '92%',
  },
  verdictTag: {
    paddingHorizontal: 6,
    paddingVertical: 2.2,
    borderRadius: 2.5,
    fontSize: 6.8,
    fontFamily: 'Helvetica-Bold',
  },

  // 8-Card Diagnostic Grid (2 rows of 4)
  diagCard: {
    borderRadius: 2.5,
    padding: 3.5,
    borderWidth: 0.6,
    marginBottom: 2.5,
    minHeight: 25,
    justifyContent: 'center',
  },
  diagCardClear: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  diagCardAlert: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
  },
  diagCardDanger: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  diagLabel: {
    fontSize: 5.2,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 1,
  },
  diagStatus: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
  },

  // Divergences Section
  divergenceSection: {
    backgroundColor: '#fffbeb',
    borderRadius: 3,
    borderWidth: 0.8,
    borderColor: '#fcd34d',
    padding: 4.5,
    marginBottom: 5,
  },
  divergenceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2.5,
  },
  divergenceTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 0.15,
  },
  divergenceBody: {
    flexDirection: 'column',
    gap: 2,
  },
  divergenceEntry: {
    marginBottom: 2,
  },
  divergenceField: {
    fontSize: 6.8,
    fontFamily: 'Helvetica-Bold',
    color: '#78350f',
    marginBottom: 1,
  },
  divergenceSourceLine: {
    fontSize: 6.2,
    color: '#451a03',
    marginLeft: 4,
    lineHeight: 1.25,
  },
  divergenceRec: {
    fontSize: 5.6,
    color: '#92400e',
    marginTop: 2,
    lineHeight: 1.25,
    fontFamily: 'Helvetica',
  },

  // Commercial Chips
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 3.5,
  },
  chip: {
    paddingHorizontal: 4.5,
    paddingVertical: 1.5,
    borderRadius: 2,
    borderWidth: 0.5,
    fontSize: 6.2,
    fontFamily: 'Helvetica-Bold',
  },
  chipSuccess: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
    color: '#15803d',
  },
  chipWarning: {
    backgroundColor: '#fef3c7',
    borderColor: '#fcd34d',
    color: '#b45309',
  },
  chipNeutral: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    color: '#334155',
  },

  // Balanced 2-Column Split
  columnsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  columnHalf: {
    width: '49%',
  },

  // Tables
  table: {
    borderWidth: 0.6,
    borderColor: '#e2e8f0',
    borderRadius: 2.5,
    overflow: 'hidden',
    marginBottom: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderBottomWidth: 0.6,
    borderBottomColor: '#cbd5e1',
    paddingVertical: 2.5,
    paddingHorizontal: 3.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 2.2,
    paddingHorizontal: 3.5,
    backgroundColor: '#ffffff',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  th: {
    fontSize: 5.4,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    textTransform: 'uppercase',
  },
  td: {
    fontSize: 6.8,
    color: '#334155',
  },
  tdBold: {
    fontSize: 6.8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },

  // Mini Debt Box
  miniDebtBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 0.6,
    borderColor: '#e2e8f0',
    borderRadius: 2.5,
    padding: 3,
    width: '23.5%',
    alignItems: 'center',
  },

  // Auction Photo & Score in PDF
  auctionPhotoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginTop: 3,
    paddingTop: 2.5,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
  },
  auctionPhotoItem: {
    width: '23.5%',
    height: 38,
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
  },
  auctionPhotoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  auctionScoreBox: {
    marginTop: 2.5,
    padding: 2.5,
    backgroundColor: '#f8fafc',
    borderRadius: 2,
    borderWidth: 0.5,
    borderColor: '#e2e8f0',
  },

  // Resumo para Negociação
  negotiationSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 3,
    borderWidth: 0.8,
    borderColor: '#e2e8f0',
    padding: 4.5,
    marginTop: 1,
    marginBottom: 4,
  },
  negotiationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  negotiationTitle: {
    fontSize: 7.2,
    fontFamily: 'Helvetica-Bold',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 0.15,
  },
  negotiationBody: {
    flexDirection: 'column',
  },
  negotiationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 1,
  },
  negotiationDot: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#d97706',
    marginRight: 4,
    lineHeight: 1.2,
  },
  negotiationText: {
    fontSize: 6.2,
    color: '#334155',
    lineHeight: 1.25,
    maxWidth: '96%',
  },

  // Structured Footer (3 blocks)
  footer: {
    position: 'absolute',
    bottom: 8,
    left: 18,
    right: 18,
    paddingTop: 3,
    borderTopWidth: 0.7,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  footerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    maxWidth: '90%',
    gap: 8,
  },
  footerCol: {
    flex: 1,
  },
  footerHeading: {
    fontSize: 5.4,
    fontFamily: 'Helvetica-Bold',
    color: '#334155',
    marginBottom: 1,
    textTransform: 'uppercase',
  },
  footerText: {
    fontSize: 4.9,
    color: '#64748b',
    lineHeight: 1.2,
  },
  pageNumber: {
    fontSize: 5.8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    marginTop: 2,
  },
});

function formatCurrency(val?: number | null): string {
  if (val == null || isNaN(val)) return 'R$ 0,00';
  return Number(val).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatKm(km?: number | null): string {
  if (km == null || isNaN(km)) return '0 km';
  return `${Number(km).toLocaleString('pt-BR')} km`;
}

function formatReportDate(iso?: string | null): string {
  if (!iso) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  }
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} às ${hours}:${minutes}`;
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  } catch {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} às ${hours}:${minutes}`;
  }
}

interface VehicleReportPDFProps {
  report: CustomerVehicleReportDto;
  settings?: SiteSettings | null;
  logoSrc?: string | null;
}

export const VehicleReportPDF: React.FC<VehicleReportPDFProps> = ({
  report,
  settings,
  logoSrc,
}) => {
  const storeName = settings?.site_name || report.issuer?.trade_name || 'AF MOTOS';
  const cnpj = settings?.cnpj || report.issuer?.cnpj || '58.742.981/0001-08';
  const formattedCnpj = cnpj ? formatCnpj(cnpj) : null;
  const storeAddress = settings?.address || 'Recife / PE • Loja Principal';
  const storePhone = settings?.whatsapp_phone ? formatPhone(settings.whatsapp_phone) : null;
  const storeEmail = settings?.contact_email || 'contato@afmotos.com.br';

  const isApproved = report.procedural_verdict === 'APPROVED';
  const isRestricted = report.procedural_verdict === 'RESTRICTED';

  const bannerStyle = isApproved
    ? styles.verdictApproved
    : isRestricted
      ? styles.verdictRestricted
      : styles.verdictAttention;

  const verdictTagBg = isApproved ? '#dcfce7' : isRestricted ? '#fee2e2' : '#fef3c7';
  const verdictTagColor = isApproved ? '#15803d' : isRestricted ? '#b91c1c' : '#b45309';

  const recallClear = report.risk_summary.recall_clear;
  const recallPendingCount = report.recalls_summary?.pending_count || 0;
  const hasRentalRecord = report.commercial_indicators?.has_rental_record || false;
  const bullets =
    report.verdict_bullets && report.verdict_bullets.length > 0
      ? report.verdict_bullets
      : [report.verdict_description || 'Relatório de procedência e integridade cadastral.'];

  const hasLocationDivergence = Boolean(
    report.source_consistency_warnings?.some((w) => w.field === 'Município' || w.field === 'UF'),
  );

  // Dynamic negotiation summary items
  const negotiationPoints: string[] = [];
  if (isApproved) {
    negotiationPoints.push('Nenhuma restrição ativa identificada nas bases consultadas.');
  } else if (isRestricted) {
    negotiationPoints.push(
      'Restrições ativas identificadas nas fontes consultadas. Recomenda-se regularização prévia.',
    );
  } else {
    negotiationPoints.push(
      'Apontamentos identificados nas fontes consultadas que requerem atenção antes da negociação.',
    );
  }

  if (report.gravame_history && report.gravame_history.length > 0) {
    negotiationPoints.push(
      `Histórico de ${report.gravame_history.length} gravame(s) já baixado(s).`,
    );
  }

  if (hasLocationDivergence) {
    negotiationPoints.push(
      'Divergência cadastral identificada entre fontes sobre município/dados do veículo (ver seção de divergências).',
    );
  }

  if (report.debts_source_info?.last_update_date) {
    negotiationPoints.push(
      `Débitos com referência da base em ${report.debts_source_info.last_update_date}.`,
    );
  } else if ((report.debts_summary?.total_debts || 0) > 0) {
    negotiationPoints.push(
      `Débitos pendentes informados no total de ${formatCurrency(report.debts_summary?.total_debts)}.`,
    );
  }

  negotiationPoints.push(
    'Confirme documentos (CRLV-e), situação atual nos órgãos competentes e realize vistoria mecânica antes da transferência.',
  );

  return (
    <Document title={`Laudo Veicular - ${report.plate_display} - ${storeName}`}>
      <Page size="A4" style={styles.page}>
        {/* ========================================================================= */}
        {/* CABEÇALHO INSTITUCIONAL & BADGE MERCOSUL */}
        {/* ========================================================================= */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.logoBox}>
              {logoSrc ? (
                <Image src={logoSrc} style={styles.logoImg} />
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.logoText}>{getSiteInitials(storeName)}</Text>
                </View>
              )}
            </View>

            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{storeName}</Text>
              <Text style={styles.storeContact}>
                {formattedCnpj ? `CNPJ: ${formattedCnpj}` : 'Comércio de Motocicletas e Veículos'}
                {storePhone ? ` • Telefone/WhatsApp: ${storePhone}` : ''}
              </Text>
              <Text style={styles.storeContact}>{storeAddress}</Text>
              {storeEmail ? (
                <Text style={styles.storeContact}>E-mail: {storeEmail}</Text>
              ) : null}
            </View>
          </View>

          <View style={styles.headerRight}>
            <MercosulPlateBadge plate={report.plate_display} width={98} fontSize={11} />
            <Text style={styles.metaLabel}>Emissão: {formatReportDate(report.consulted_at)}</Text>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* CARD SUPERIOR DE APONTAMENTOS / VEREDITO */}
        {/* ========================================================================= */}
        <View style={[styles.verdictBanner, bannerStyle]}>
          <View style={{ maxWidth: '78%' }}>
            <Text style={[styles.verdictTitle, { color: verdictTagColor }]}>
              {report.verdict_label || 'Sem restrições ativas identificadas nas bases consultadas'}
            </Text>
            {bullets.map((bullet, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={[styles.bulletDot, { color: verdictTagColor }]}>•</Text>
                <Text style={styles.bulletText}>{bullet}</Text>
              </View>
            ))}
          </View>
          <View style={[styles.verdictTag, { backgroundColor: verdictTagBg }]}>
            <Text style={{ color: verdictTagColor, fontSize: 6.8, fontFamily: 'Helvetica-Bold' }}>
              {isApproved
                ? 'SEM RESTRIÇÕES ATIVAS'
                : isRestricted
                  ? 'RESTRIÇÃO ATIVA'
                  : 'APONTAMENTOS'}
            </Text>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* SEÇÃO I: DIAGNÓSTICO GERAL DE RISCO E SEGURANÇA (8 CARDS) */}
        {/* ========================================================================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>I. Diagnóstico Geral de Risco e Segurança</Text>
            <Text style={styles.sectionSub}>Fontes consultadas: bases públicas e conveniadas</Text>
          </View>

          <View style={styles.grid}>
            {/* 1. Roubo e Furto */}
            <View style={styles.col3}>
              <View
                style={[
                  styles.diagCard,
                  report.risk_summary.theft_robbery_clear
                    ? styles.diagCardClear
                    : styles.diagCardDanger,
                ]}
              >
                <Text style={styles.diagLabel}>Roubo e Furto</Text>
                <Text
                  style={[
                    styles.diagStatus,
                    {
                      color: report.risk_summary.theft_robbery_clear ? '#166534' : '#991b1b',
                      fontSize: 6.2,
                    },
                  ]}
                >
                  {report.risk_summary.theft_robbery_clear
                    ? 'Nenhuma ocorrência ativa'
                    : 'Alerta de Roubo'}
                </Text>
              </View>
            </View>

            {/* 2. Bloqueio Judicial */}
            <View style={styles.col3}>
              <View
                style={[
                  styles.diagCard,
                  report.risk_summary.judicial_clear ? styles.diagCardClear : styles.diagCardDanger,
                ]}
              >
                <Text style={styles.diagLabel}>Bloqueio Renajud</Text>
                <Text
                  style={[
                    styles.diagStatus,
                    {
                      color: report.risk_summary.judicial_clear ? '#166534' : '#991b1b',
                      fontSize: 6.2,
                    },
                  ]}
                >
                  {report.risk_summary.judicial_clear ? 'Nenhum apontamento' : 'Bloqueio Judicial'}
                </Text>
              </View>
            </View>

            {/* 3. Alienação / Gravame */}
            <View style={styles.col3}>
              <View
                style={[
                  styles.diagCard,
                  report.gravame_current?.status === 'active'
                    ? styles.diagCardAlert
                    : styles.diagCardClear,
                ]}
              >
                <Text style={styles.diagLabel}>Alienação / Gravame</Text>
                <Text
                  style={[
                    styles.diagStatus,
                    {
                      color: report.gravame_current?.status === 'active' ? '#b45309' : '#166534',
                      fontSize: 6.2,
                    },
                  ]}
                >
                  {report.gravame_current?.status === 'active'
                    ? 'Gravame Ativo'
                    : 'Nenhum gravame ativo'}
                </Text>
              </View>
            </View>

            {/* 4. Passagem por Leilão */}
            <View style={styles.col3}>
              <View
                style={[
                  styles.diagCard,
                  report.auction_details?.has_auction ? styles.diagCardAlert : styles.diagCardClear,
                ]}
              >
                <Text style={styles.diagLabel}>Passagem por Leilão</Text>
                <Text
                  style={[
                    styles.diagStatus,
                    {
                      color: report.auction_details?.has_auction ? '#b45309' : '#166534',
                      fontSize: 6.2,
                    },
                  ]}
                >
                  {report.auction_details?.has_auction ? 'Consta Leilão' : 'Nenhum registro'}
                </Text>
              </View>
            </View>

            {/* 5. Registro de Sinistro */}
            <View style={styles.col3}>
              <View
                style={[
                  styles.diagCard,
                  report.claims_details?.has_claims ? styles.diagCardAlert : styles.diagCardClear,
                ]}
              >
                <Text style={styles.diagLabel}>Registro de Sinistro</Text>
                <Text
                  style={[
                    styles.diagStatus,
                    {
                      color: report.claims_details?.has_claims ? '#b45309' : '#166534',
                      fontSize: 6.2,
                    },
                  ]}
                >
                  {report.claims_details?.has_claims ? 'Consta Sinistro' : 'Nenhuma ocorrência'}
                </Text>
              </View>
            </View>

            {/* 6. Recall de Fábrica */}
            <View style={styles.col3}>
              <View
                style={[
                  styles.diagCard,
                  recallClear ? styles.diagCardClear : styles.diagCardDanger,
                ]}
              >
                <Text style={styles.diagLabel}>Recall de Fábrica</Text>
                <Text
                  style={[
                    styles.diagStatus,
                    { color: recallClear ? '#166534' : '#991b1b', fontSize: 6.2 },
                  ]}
                >
                  {recallClear ? 'Nenhuma ocorrência' : `${recallPendingCount} Pendência(s)`}
                </Text>
              </View>
            </View>

            {/* 7. Débitos Estaduais */}
            <View style={styles.col3}>
              <View
                style={[
                  styles.diagCard,
                  report.risk_summary.debts_clear ? styles.diagCardClear : styles.diagCardAlert,
                ]}
              >
                <Text style={styles.diagLabel}>Débitos Estaduais</Text>
                <Text
                  style={[
                    styles.diagStatus,
                    {
                      color: report.risk_summary.debts_clear ? '#166534' : '#b45309',
                      fontSize: 6.2,
                    },
                  ]}
                >
                  {report.risk_summary.debts_clear
                    ? 'Sem débitos informados'
                    : formatCurrency(report.debts_summary?.total_debts)}
                </Text>
              </View>
            </View>

            {/* 8. Uso em Locadora */}
            <View style={styles.col3}>
              <View
                style={[
                  styles.diagCard,
                  hasRentalRecord ? styles.diagCardAlert : styles.diagCardClear,
                ]}
              >
                <Text style={styles.diagLabel}>Uso em Locadora</Text>
                <Text
                  style={[
                    styles.diagStatus,
                    { color: hasRentalRecord ? '#b45309' : '#166534', fontSize: 6.2 },
                  ]}
                >
                  {hasRentalRecord
                    ? 'Consta nas bases consultadas'
                    : 'Não consta nas bases consultadas'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* SEÇÃO II: IDENTIFICAÇÃO CADASTRAL DO VEÍCULO & METADADOS */}
        {/* ========================================================================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>II. Identificação Cadastral do Veículo</Text>
            <Text style={styles.sectionSub}>Fonte: base de trânsito (SENATRAN / DETRAN)</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.grid}>
              <View style={styles.col3}>
                <Text style={styles.fieldLabel}>Placa</Text>
                <Text style={styles.fieldValueBold}>{report.plate_display}</Text>
              </View>
              <View style={styles.col6}>
                <Text style={styles.fieldLabel}>Marca / Modelo / Versão</Text>
                <Text style={styles.fieldValueBold}>
                  {report.brand} {report.model}{' '}
                  {report.version && report.version !== report.model ? `• ${report.version}` : ''}
                </Text>
              </View>
              <View style={styles.col3}>
                <Text style={styles.fieldLabel}>Ano Fab. / Modelo</Text>
                <Text style={styles.fieldValueBold}>
                  {report.year_manufacture || '-'} / {report.year_model || '-'}
                </Text>
              </View>

              <View style={styles.col3}>
                <Text style={styles.fieldLabel}>Cor Predominante</Text>
                <Text style={styles.fieldValue}>{report.color || '-'}</Text>
              </View>
              <View style={styles.col3}>
                <Text style={styles.fieldLabel}>Combustível</Text>
                <Text style={styles.fieldValue}>{report.fuel || '-'}</Text>
              </View>
              <View style={styles.col3}>
                <Text style={styles.fieldLabel}>Potência</Text>
                <Text style={styles.fieldValue}>{report.power || 'Não informada pela fonte'}</Text>
              </View>
              <View style={styles.col3}>
                <Text style={styles.fieldLabel}>Cilindrada</Text>
                <Text style={styles.fieldValue}>
                  {report.displacement || report.engine_capacity || 'Não informada pela fonte'}
                </Text>
              </View>

              <View style={styles.col3}>
                <Text style={styles.fieldLabel}>Tipo / Espécie</Text>
                <Text style={styles.fieldValue}>
                  {report.vehicle_type} • {report.species || 'Passageiro'}
                </Text>
              </View>
              <View style={styles.col3}>
                <Text style={styles.fieldLabel}>Município / UF</Text>
                {hasLocationDivergence ? (
                  <>
                    <Text style={[styles.fieldValueBold, { color: '#b45309', fontSize: 6.6 }]}>
                      Divergência entre fontes
                    </Text>
                    <Text style={{ fontSize: 5, color: '#64748b' }}>
                      Ver seção de divergências cadastrais
                    </Text>
                  </>
                ) : (
                  <Text style={styles.fieldValue}>{report.city_state || '-'}</Text>
                )}
              </View>
              <View style={styles.col3}>
                <Text style={styles.fieldLabel}>Procedência</Text>
                <Text style={styles.fieldValue}>{report.origin || 'Nacional'}</Text>
              </View>
              <View style={styles.col3}>
                <Text style={styles.fieldLabel}>Câmbio / Tração</Text>
                <Text style={styles.fieldValue}>
                  {report.gearbox || 'Manual'} • {report.traction || 'Traseira/Dianteira'}
                </Text>
              </View>

              <View style={styles.col4}>
                <Text style={styles.fieldLabel}>Chassi Mascarado (LGPD)</Text>
                <Text style={styles.fieldValueBold}>{report.chassis_masked || 'Protegido'}</Text>
              </View>
              <View style={styles.col4}>
                <Text style={styles.fieldLabel}>Renavam Mascarado (LGPD)</Text>
                <Text style={styles.fieldValueBold}>{report.renavam_masked || 'Protegido'}</Text>
              </View>
              <View style={styles.col4}>
                <Text style={styles.fieldLabel}>Número do Motor (LGPD)</Text>
                <Text style={styles.fieldValueBold}>{report.engine_masked || 'Protegido'}</Text>
              </View>

              {/* Status Comercial */}
              <View style={[styles.col12, { marginTop: 3 }]}>
                <Text style={styles.fieldLabel}>Status Comercial & Indicadores</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 2 }}>
                  <View
                    style={[styles.chip, hasRentalRecord ? styles.chipWarning : styles.chipSuccess]}
                  >
                    <Text>
                      Locadora:{' '}
                      {report.commercial_indicators?.rental_label ||
                        'Não consta nas bases consultadas'}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.chip,
                      report.commercial_indicators?.has_sale_communication
                        ? styles.chipWarning
                        : styles.chipSuccess,
                    ]}
                  >
                    <Text>
                      Comunicação de Venda:{' '}
                      {report.commercial_indicators?.sale_communication ||
                        'Não consta na base estadual consultada'}
                    </Text>
                  </View>

                  <View style={[styles.chip, styles.chipNeutral]}>
                    <Text>
                      Situação Cadastral:{' '}
                      {report.commercial_indicators?.vehicle_status || 'Em circulação'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* SEÇÃO VISÍVEL: DIVERGÊNCIAS CADASTRAIS ENTRE FONTES */}
        {/* Renderizada SOMENTE quando existir divergência real entre as bases */}
        {/* ========================================================================= */}
        {report.source_consistency_warnings && report.source_consistency_warnings.length > 0 ? (
          <View style={styles.divergenceSection}>
            <View style={styles.divergenceHeader}>
              <Text style={styles.divergenceTitle}>Divergências cadastrais entre fontes</Text>
            </View>
            <View style={styles.divergenceBody}>
              {report.source_consistency_warnings.map((entry, idx) => (
                <View key={idx} style={styles.divergenceEntry}>
                  <Text style={styles.divergenceField}>Campo: {entry.field}</Text>
                  {entry.sources.map((src, sIdx) => (
                    <Text key={sIdx} style={styles.divergenceSourceLine}>
                      • {src.source}: {src.value}
                    </Text>
                  ))}
                  <Text style={styles.divergenceRec}>Orientação: {entry.recommendation}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ========================================================================= */}
        {/* GRID BALANCEADO EM 2 COLUNAS (50% / 50%) */}
        {/* ========================================================================= */}
        <View style={styles.columnsContainer}>
          {/* ----------------- COLUNA ESQUERDA (50%) ----------------- */}
          <View style={styles.columnHalf}>
            {/* III. RESTRIÇÕES & GRAVAME */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>III. Restrições & Gravame</Text>
                <Text style={styles.sectionSub}>Fonte: Sircaf / base integrada de gravames</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.grid}>
                  <View style={styles.col12}>
                    <Text style={styles.fieldLabel}>Situação Financeira Atual</Text>
                    <Text
                      style={[
                        styles.fieldValueBold,
                        {
                          color:
                            report.gravame_current?.status === 'active' ? '#b45309' : '#166534',
                        },
                      ]}
                    >
                      {report.gravame_current?.status === 'active'
                        ? report.gravame_current?.label || 'Gravame Ativo'
                        : 'Nenhum gravame ativo identificado nas bases consultadas.'}
                    </Text>
                  </View>
                  <View style={styles.col6}>
                    <Text style={styles.fieldLabel}>Agente Financeiro</Text>
                    <Text style={styles.fieldValueBold}>
                      {report.gravame_current?.status === 'active'
                        ? report.gravame_current?.agent || 'Nenhum agente identificado'
                        : 'Sem gravame ativo'}
                    </Text>
                  </View>
                  <View style={styles.col6}>
                    <Text style={styles.fieldLabel}>Data de Inclusão</Text>
                    <Text style={styles.fieldValue}>
                      {report.gravame_current?.status === 'active'
                        ? report.gravame_current?.inclusion_date || 'N/I'
                        : '-'}
                    </Text>
                  </View>

                  {/* Histórico financeiro: registros anteriores */}
                  {report.gravame_history && report.gravame_history.length > 0 ? (
                    <View style={styles.col12}>
                      <Text
                        style={[
                          styles.fieldLabel,
                          {
                            marginTop: 2,
                            borderTopWidth: 0.5,
                            borderTopColor: '#e2e8f0',
                            paddingTop: 2,
                          },
                        ]}
                      >
                        Histórico financeiro: {report.gravame_history.length}{' '}
                        {report.gravame_history.length === 1
                          ? 'registro anterior'
                          : 'registros anteriores'}
                      </Text>
                      <Text style={{ fontSize: 5.5, color: '#64748b', marginBottom: 2 }}>
                        Foram identificados {report.gravame_history.length}{' '}
                        {report.gravame_history.length === 1
                          ? 'registro anterior de gravame já baixado.'
                          : 'registros anteriores de gravame já baixado.'}
                      </Text>
                      {report.gravame_history.map((gh, ghIdx) => (
                        <View
                          key={ghIdx}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginTop: 1.5,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Text
                            style={[
                              styles.fieldValueBold,
                              { fontSize: 5.8, color: '#334155', maxWidth: '62%' },
                            ]}
                          >
                            • {gh.agent}
                          </Text>
                          <Text style={{ fontSize: 5.5, color: '#64748b' }}>
                            Situação: Gravame baixado
                            {gh.inclusion_date ? ` • Data: ${gh.inclusion_date}` : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* IV. LEILÃO & SINISTROS */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>IV. Leilão & Sinistro</Text>
                <Text style={styles.sectionSub}>
                  Fonte: bases integradas de leilão e seguradoras
                </Text>
              </View>
              <View style={styles.card}>
                <View style={styles.grid}>
                  <View style={styles.col6}>
                    <Text style={styles.fieldLabel}>Leilão</Text>
                    <Text
                      style={[
                        styles.fieldValueBold,
                        { color: report.auction_details?.has_auction ? '#b45309' : '#166534' },
                      ]}
                    >
                      {report.auction_details?.has_auction
                        ? report.auction_details?.status_label || 'Consta Registro'
                        : 'Nenhum registro identificado nas bases consultadas'}
                    </Text>
                    {report.auction_details?.has_auction &&
                    report.auction_details.records?.[0]?.bidder ? (
                      <Text
                        style={[
                          styles.fieldValue,
                          { fontSize: 5.8, color: '#475569', marginTop: 1 },
                        ]}
                      >
                        Comitente: {report.auction_details.records[0].bidder}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.col6}>
                    <Text style={styles.fieldLabel}>Sinistro</Text>
                    <Text
                      style={[
                        styles.fieldValueBold,
                        { color: report.claims_details?.has_claims ? '#b45309' : '#166534' },
                      ]}
                    >
                      {report.claims_details?.has_claims
                        ? report.claims_details?.status_label || 'Consta Sinistro'
                        : 'Nenhuma ocorrência identificada nas bases consultadas'}
                    </Text>
                    {report.claims_details?.has_claims && report.claims_details.records?.[0] ? (
                      <Text style={[styles.fieldValue, { fontSize: 5.8, marginTop: 1 }]}>
                        {report.claims_details.records[0].damage_level || 'Média Monta'}
                      </Text>
                    ) : null}
                  </View>

                  {/* Informações detalhadas do lote se houver passagem por leilão */}
                  {report.auction_details?.has_auction && report.auction_details.records?.[0] ? (
                    <>
                      <View style={[styles.col6, { marginTop: 2 }]}>
                        <Text style={styles.fieldLabel}>Leiloeiro / Lote</Text>
                        <Text style={[styles.fieldValue, { fontSize: 6 }]}>
                          {report.auction_details.records[0].auctioneer || 'Leiloeiro Oficial'}
                          {report.auction_details.records[0].lot
                            ? ` • Lote: ${report.auction_details.records[0].lot}`
                            : ''}
                        </Text>
                      </View>
                      <View style={[styles.col6, { marginTop: 2 }]}>
                        <Text style={styles.fieldLabel}>Data / Pátio</Text>
                        <Text style={[styles.fieldValue, { fontSize: 6 }]}>
                          {report.auction_details.records[0].auction_date || 'N/I'}
                          {report.auction_details.records[0].yard
                            ? ` • ${report.auction_details.records[0].yard}`
                            : ''}
                        </Text>
                      </View>
                    </>
                  ) : null}

                  {/* Score de Mercado & Segurabilidade */}
                  {report.auction_details?.has_auction && report.auction_details.score ? (
                    <View style={[styles.col12, styles.auctionScoreBox]}>
                      <Text style={[styles.fieldLabel, { fontSize: 5.2, marginBottom: 1 }]}>
                        Score & Segurabilidade de Mercado:
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text
                          style={{ fontSize: 5.8, fontFamily: 'Helvetica-Bold', color: '#b45309' }}
                        >
                          Aceitação: {report.auction_details.score.acceptance || 'Restrita'}
                        </Text>
                        {report.auction_details.score.reference_percentage ? (
                          <Text style={{ fontSize: 5.8, color: '#334155' }}>
                            Ref. FIPE: {report.auction_details.score.reference_percentage}%
                          </Text>
                        ) : null}
                        {report.auction_details.score.special_inspection_required != null ? (
                          <Text style={{ fontSize: 5.8, color: '#334155' }}>
                            Vistoria Especial:{' '}
                            {String(
                              report.auction_details.score.special_inspection_required,
                            ).toUpperCase()}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  ) : null}

                  {/* Fotos Padronizadas Compactas do Lote */}
                  {report.auction_details?.has_auction &&
                  Array.isArray(report.auction_details.photos) &&
                  report.auction_details.photos.length > 0 ? (
                    <View style={styles.col12}>
                      <View style={styles.auctionPhotoGrid}>
                        {report.auction_details.photos
                          .filter(
                            (p) =>
                              p.preview_src &&
                              (p.preview_src.startsWith('http') ||
                                p.preview_src.startsWith('data:image')),
                          )
                          .slice(0, 4)
                          .map((photo, pIdx) => (
                            <View key={pIdx} style={styles.auctionPhotoItem}>
                              <Image src={photo.preview_src} style={styles.auctionPhotoImg} />
                            </View>
                          ))}
                      </View>
                      {report.auction_details.photos.length > 4 ? (
                        <Text
                          style={{
                            fontSize: 4.8,
                            color: '#64748b',
                            marginTop: 1.5,
                            textAlign: 'right',
                          }}
                        >
                          +{report.auction_details.photos.length - 4} foto(s) no laudo digital
                          completo
                        </Text>
                      ) : null}
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* V. DÉBITOS ESTADUAIS */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>V. Débitos Estaduais</Text>
                <Text style={styles.sectionSub}>
                  Fonte: base estadual de trânsito (DETRAN / SEFAZ)
                </Text>
              </View>
              <View style={styles.card}>
                {/* Referência da base e Exercício informado */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: 2.5,
                    borderBottomWidth: 0.5,
                    borderBottomColor: '#e2e8f0',
                    paddingBottom: 2,
                  }}
                >
                  <Text style={{ fontSize: 5.8, color: '#475569' }}>
                    Referência da base:{' '}
                    <Text style={{ fontFamily: 'Helvetica-Bold', color: '#1e293b' }}>
                      {report.debts_source_info?.last_update_date || 'Conforme base'}
                    </Text>
                  </Text>
                  <Text style={{ fontSize: 5.8, color: '#475569' }}>
                    Exercício informado:{' '}
                    <Text style={{ fontFamily: 'Helvetica-Bold', color: '#1e293b' }}>
                      {report.debts_source_info?.licensing_year || '-'}
                    </Text>
                  </Text>
                </View>

                {/* Status textual */}
                <Text
                  style={[
                    styles.fieldValueBold,
                    {
                      fontSize: 6.8,
                      color: (report.debts_summary?.total_debts || 0) > 0 ? '#b45309' : '#166534',
                      marginBottom: 2.5,
                    },
                  ]}
                >
                  {(report.debts_summary?.total_debts || 0) > 0
                    ? `Débitos identificados na base consultada (${formatCurrency(report.debts_summary?.total_debts)})`
                    : 'Sem débitos financeiros informados na base consultada'}
                </Text>

                {/* 4 Mini Debt Boxes */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <View style={styles.miniDebtBox}>
                    <Text style={styles.fieldLabel}>Multas</Text>
                    <Text style={styles.fieldValueBold}>
                      {formatCurrency(report.debts_summary?.fines_pending)}
                    </Text>
                  </View>
                  <View style={styles.miniDebtBox}>
                    <Text style={styles.fieldLabel}>IPVA</Text>
                    <Text style={styles.fieldValueBold}>
                      {formatCurrency(report.debts_summary?.ipva_pending)}
                    </Text>
                  </View>
                  <View style={styles.miniDebtBox}>
                    <Text style={styles.fieldLabel}>Licenc.</Text>
                    <Text style={styles.fieldValueBold}>
                      {formatCurrency(report.debts_summary?.licensing_pending)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.miniDebtBox,
                      {
                        borderColor:
                          (report.debts_summary?.total_debts || 0) > 0 ? '#fcd34d' : '#e2e8f0',
                      },
                    ]}
                  >
                    <Text style={styles.fieldLabel}>Total Inf.</Text>
                    <Text
                      style={[
                        styles.fieldValueBold,
                        {
                          color:
                            (report.debts_summary?.total_debts || 0) > 0 ? '#b45309' : '#166534',
                        },
                      ]}
                    >
                      {formatCurrency(report.debts_summary?.total_debts)}
                    </Text>
                  </View>
                </View>

                {/* Stale Warning Badge se a base for antiga */}
                {report.debts_source_info?.is_stale ? (
                  <View
                    style={{
                      marginTop: 2.5,
                      padding: 2,
                      backgroundColor: '#fef3c7',
                      borderRadius: 2,
                      borderWidth: 0.5,
                      borderColor: '#fcd34d',
                    }}
                  >
                    <Text style={{ fontSize: 5.2, color: '#92400e', fontFamily: 'Helvetica-Bold' }}>
                      BASE COM ATUALIZAÇÃO ANTERIOR À DATA DE EMISSÃO (
                      {report.debts_source_info.last_update_date})
                    </Text>
                  </View>
                ) : null}

                {/* Nota explicativa de fechamento da seção */}
                <Text style={{ fontSize: 4.8, color: '#64748b', marginTop: 2, lineHeight: 1.2 }}>
                  Os valores refletem a última atualização disponibilizada pela fonte. Confirme a
                  situação atual no órgão competente antes da transferência.
                </Text>
              </View>
            </View>
          </View>

          {/* ----------------- COLUNA DIREITA (50%) ----------------- */}
          <View style={styles.columnHalf}>
            {/* VI. HISTÓRICO DE PROPRIETÁRIOS (LGPD) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>VI. Histórico de Proprietários</Text>
                <Text style={styles.sectionSub}>Fonte: histórico registral de trânsito</Text>
              </View>

              <View style={styles.card}>
                <View
                  style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}
                >
                  <Text style={{ fontSize: 5.8, color: '#475569' }}>
                    Registros disponibilizados:{' '}
                    <Text style={{ fontFamily: 'Helvetica-Bold', color: '#1e293b' }}>
                      {report.owners_history?.records?.length ||
                        report.owners_history?.owners_count ||
                        1}
                    </Text>
                  </Text>
                </View>

                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.th, { width: '15%' }]}>Ano</Text>
                    <Text style={[styles.th, { width: '12%' }]}>UF</Text>
                    <Text style={[styles.th, { width: '35%' }]}>Tipo Titular</Text>
                    <Text style={[styles.th, { width: '38%' }]}>Documento</Text>
                  </View>

                  {report.owners_history && report.owners_history.records.length > 0 ? (
                    report.owners_history.records.map((owner, idx) => (
                      <View
                        key={idx}
                        style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}
                      >
                        <Text style={[styles.tdBold, { width: '15%' }]}>{owner.period || '-'}</Text>
                        <Text style={[styles.td, { width: '12%' }]}>{owner.state || '-'}</Text>
                        <Text
                          style={[
                            styles.td,
                            {
                              width: '35%',
                              color:
                                owner.document_type === 'PJ'
                                    ? '#1e40af'
                                    : owner.document_type === 'unknown'
                                      ? '#64748b'
                                      : '#334155',
                              fontFamily: 'Helvetica-Bold',
                            },
                          ]}
                        >
                          {owner.document_type === 'PJ'
                            ? 'Pessoa Jurídica'
                            : owner.document_type === 'PF'
                              ? 'Pessoa Física'
                              : 'Não informado'}
                        </Text>
                        <Text style={[styles.tdBold, { width: '38%', color: '#334155' }]}>
                          {owner.masked_document &&
                          owner.masked_document !== 'Documento não disponibilizado pela fonte'
                            ? owner.masked_document
                            : 'Não disponibilizado'}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <View style={styles.tableRow}>
                      <Text style={[styles.td, { width: '100%', color: '#64748b' }]}>
                        Nenhum registro histórico de proprietário anterior retornado pela fonte.
                      </Text>
                    </View>
                  )}
                </View>

                <Text style={{ fontSize: 5, color: '#64748b', lineHeight: 1.25 }}>
                  A fonte disponibilizou registro histórico, mas não forneceu detalhes adicionais do
                  titular.
                </Text>
              </View>
            </View>

            {/* VII. REFERÊNCIA TABELA FIPE */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>VII. Referência Tabela FIPE</Text>
                <Text style={styles.sectionSub}>Fonte: referência de mercado (FIPE)</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.grid}>
                  <View style={styles.col12}>
                    <Text style={[styles.fieldLabel, { color: '#b45309' }]}>
                      Referência principal sugerida
                    </Text>
                  </View>
                  <View style={styles.col6}>
                    <Text style={styles.fieldLabel}>Código FIPE</Text>
                    <Text style={styles.fieldValueBold}>
                      {report.fipe_reference?.code || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.col6}>
                    <Text style={styles.fieldLabel}>Valor Médio de Referência</Text>
                    <Text style={[styles.fieldValueBold, { fontSize: 8.8, color: '#b45309' }]}>
                      {formatCurrency(report.fipe_reference?.price)}
                    </Text>
                  </View>
                  <View style={styles.col6}>
                    <Text style={styles.fieldLabel}>Mês de Referência</Text>
                    <Text style={styles.fieldValue}>
                      {report.fipe_reference?.reference_month || 'Atual'}
                    </Text>
                  </View>
                  <View style={styles.col6}>
                    <Text style={styles.fieldLabel}>Versão</Text>
                    <Text style={[styles.fieldValue, { fontSize: 5.8 }]}>
                      {report.fipe_reference?.model || 'N/I'}
                    </Text>
                  </View>

                  {/* Nota visível e discreta sobre FIPE */}
                  <View
                    style={[
                      styles.col12,
                      {
                        marginTop: 2,
                        paddingVertical: 1.5,
                        borderTopWidth: 0.5,
                        borderTopColor: '#e2e8f0',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 5, color: '#64748b', lineHeight: 1.25 }}>
                      A FIPE é uma referência de mercado. Não representa preço de venda garantido,
                      avaliação final ou valor obrigatório de negociação.
                    </Text>
                  </View>

                  {/* Tabela de Outras referências compatíveis */}
                  {report.fipe_alternatives && report.fipe_alternatives.length > 0 ? (
                    <View style={[styles.col12, { marginTop: 2 }]}>
                      <Text style={[styles.fieldLabel, { fontSize: 5.4, marginBottom: 1.5 }]}>
                        Outras referências compatíveis
                      </Text>
                      <View style={styles.table}>
                        <View style={styles.tableHeader}>
                          <Text style={[styles.th, { width: '22%' }]}>Código</Text>
                          <Text style={[styles.th, { width: '52%' }]}>Versão</Text>
                          <Text style={[styles.th, { width: '26%', textAlign: 'right' }]}>
                            Valor de Referência
                          </Text>
                        </View>
                        {report.fipe_alternatives.slice(0, 3).map((alt, altIdx) => (
                          <View
                            key={altIdx}
                            style={[styles.tableRow, altIdx % 2 === 1 ? styles.tableRowAlt : {}]}
                          >
                            <Text style={[styles.tdBold, { width: '22%' }]}>{alt.code}</Text>
                            <Text style={[styles.td, { width: '52%' }]}>
                              {alt.version}
                              {alt.fuel ? ` (${alt.fuel})` : ''}
                            </Text>
                            <Text
                              style={[
                                styles.tdBold,
                                { width: '26%', textAlign: 'right', color: '#0f172a' },
                              ]}
                            >
                              {formatCurrency(alt.price)}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            {/* VIII. ÚLTIMO ANÚNCIO DE MERCADO & QUILOMETRAGEM */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>VIII. Último Anúncio & Quilometragem</Text>
                <Text style={styles.sectionSub}>Fonte: histórico de mercado e odômetro</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.grid}>
                  <View style={styles.col6}>
                    <Text style={styles.fieldLabel}>Preço do Último Anúncio</Text>
                    <Text style={[styles.fieldValueBold, { fontSize: 8.8, color: '#15803d' }]}>
                      {report.latest_km_record?.announced_price
                        ? formatCurrency(report.latest_km_record.announced_price)
                        : report.ads_history?.[0]?.price
                          ? formatCurrency(report.ads_history[0].price)
                          : 'Não registrado'}
                    </Text>
                  </View>
                  <View style={styles.col6}>
                    <Text style={styles.fieldLabel}>Quilometragem do Odômetro</Text>
                    <Text style={[styles.fieldValueBold, { fontSize: 8.8, color: '#0f172a' }]}>
                      {formatKm(
                        report.latest_km_record?.mileage ?? report.ads_history?.[0]?.mileage,
                      )}
                    </Text>
                  </View>

                  <View style={styles.col6}>
                    <Text style={styles.fieldLabel}>Data do Registro</Text>
                    <Text style={styles.fieldValue}>
                      {report.latest_km_record?.date ||
                        report.ads_history?.[0]?.date ||
                        'Registro recente'}
                    </Text>
                  </View>
                  <View style={styles.col6}>
                    <Text style={styles.fieldLabel}>Origem / Portal</Text>
                    <Text style={styles.fieldValue}>
                      {report.latest_km_record?.source ||
                        report.ads_history?.[0]?.portal ||
                        'Portal de Anúncios'}
                    </Text>
                  </View>

                  {/* Comparativo FIPE x Anúncio */}
                  {Boolean(
                    (report.latest_km_record?.announced_price || report.ads_history?.[0]?.price) &&
                    report.fipe_reference?.price,
                  ) && (
                    <View
                      style={[
                        styles.col12,
                        {
                          marginTop: 2,
                          paddingTop: 2,
                          borderTopWidth: 0.5,
                          borderTopColor: '#e2e8f0',
                        },
                      ]}
                    >
                      <Text style={[styles.fieldLabel, { fontSize: 5.2 }]}>
                        Relação com Tabela FIPE:
                      </Text>
                      <Text style={[styles.fieldValue, { fontSize: 6, color: '#475569' }]}>
                        {(() => {
                          const adPrice =
                            report.latest_km_record?.announced_price ||
                            report.ads_history?.[0]?.price ||
                            0;
                          const fipePrice = report.fipe_reference?.price || 0;
                          const ratio = Math.round((adPrice / fipePrice) * 100);
                          const diff = adPrice - fipePrice;
                          const diffFormatted = formatCurrency(Math.abs(diff));
                          if (diff > 0) {
                            return `Anúncio em ${ratio}% da FIPE (+${diffFormatted} acima da tabela)`;
                          } else if (diff < 0) {
                            return `Anúncio em ${ratio}% da FIPE (${diffFormatted} abaixo da tabela)`;
                          }
                          return `Preço anunciado 100% alinhado à Tabela FIPE`;
                        })()}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* IX. RESUMO PARA NEGOCIAÇÃO */}
        {/* Síntese compacta para tomada de decisão, aproveitando o espaço da página */}
        {/* ========================================================================= */}
        <View style={styles.negotiationSection}>
          <View style={styles.negotiationHeader}>
            <Text style={styles.negotiationTitle}>Resumo para negociação</Text>
          </View>
          <View style={styles.negotiationBody}>
            {negotiationPoints.map((point, pIdx) => (
              <View key={pIdx} style={styles.negotiationRow}>
                <Text style={styles.negotiationDot}>•</Text>
                <Text style={styles.negotiationText}>{point}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ========================================================================= */}
        {/* RODAPÉ INSTITUCIONAL & NOTAS ESTRUTURADAS (3 GRUPOS) */}
        {/* ========================================================================= */}
        <View style={styles.footer} fixed>
          <View style={styles.footerGrid}>
            <View style={styles.footerCol}>
              <Text style={styles.footerHeading}>Origem dos dados</Text>
              <Text style={styles.footerText}>
                Dados consolidados a partir de fontes integradas, como bases veiculares, estaduais,
                financeiras e conveniadas (via API Brasil).
              </Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerHeading}>Limitações do relatório</Text>
              <Text style={styles.footerText}>
                Este relatório é complementar e não substitui vistoria mecânica presencial, perícia,
                conferência do CRLV-e ou validação junto aos órgãos competentes.
              </Text>
            </View>
            <View style={styles.footerCol}>
              <Text style={styles.footerHeading}>Atualização das fontes</Text>
              <Text style={styles.footerText}>
                {report.report_metadata?.source_update_dates &&
                report.report_metadata.source_update_dates.some((s) => s.date)
                  ? report.report_metadata.source_update_dates
                      .filter((s) => s.date)
                      .map((s) => `${s.source}: ${s.date}`)
                      .join(' • ')
                  : `Base estadual: ${report.debts_source_info?.last_update_date || 'Conforme base'} • Base nacional: Conforme base`}
              </Text>
            </View>
          </View>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) => `Pág. ${pageNumber}/${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};
