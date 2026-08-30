import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import type { CustomerVehicleReportDto } from '../types.ts';
import type { SiteSettings } from '@/types/database';
import { formatCnpj } from '@/lib/utils/cnpj';
import { formatPhone } from '@/lib/utils/formatters';
import { MercosulPlateBadge } from '@/lib/pdf/mercosul-plate-badge';

const styles = StyleSheet.create({
  page: {
    padding: 18,
    paddingTop: 14,
    paddingBottom: 28,
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
  logoSub: {
    fontSize: 4.8,
    fontFamily: 'Helvetica-Bold',
    color: '#cbd5e1',
    marginTop: -2,
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

  // Footer
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
    alignItems: 'flex-end',
  },
  footerText: {
    fontSize: 5.2,
    color: '#64748b',
    lineHeight: 1.25,
  },
  footerTrust: {
    fontSize: 5.1,
    color: '#334155',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 0.8,
  },
  pageNumber: {
    fontSize: 5.8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
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
  const bullets = report.verdict_bullets && report.verdict_bullets.length > 0
    ? report.verdict_bullets
    : [report.verdict_description || 'Relatório de procedência e integridade cadastral.'];

  return (
    <Document title={`Laudo Veicular - ${report.plate_display} - AF Motos`}>
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
                  <Text style={styles.logoText}>AF</Text>
                  <Text style={styles.logoSub}>MOTOS</Text>
                </View>
              )}
            </View>

            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{storeName}</Text>
              <Text style={styles.storeContact}>
                {formattedCnpj ? `CNPJ: ${formattedCnpj}` : 'Comércio de Motocicletas e Veículos'}
                {storePhone ? ` • Telefone/WhatsApp: ${storePhone}` : ''}
              </Text>
              <Text style={styles.storeContact}>
                {storeAddress}
                {storeEmail ? ` • E-mail: ${storeEmail}` : ''}
              </Text>
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
          <View style={{ maxWidth: '80%' }}>
            <Text style={[styles.verdictTitle, { color: verdictTagColor }]}>
              {report.verdict_label || 'Procedência Veicular'}
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
              {isApproved ? 'APROVADO' : isRestricted ? 'RESTRITO' : 'APONTAMENTOS'}
            </Text>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* SEÇÃO I: DIAGNÓSTICO GERAL DE RISCO E SEGURANÇA (8 CARDS) */}
        {/* ========================================================================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>I. Diagnóstico Geral de Risco e Segurança</Text>
            <Text style={styles.sectionSub}>Bases Governamentais & Conveniadas</Text>
          </View>

          <View style={styles.grid}>
            {/* 1. Roubo e Furto */}
            <View style={styles.col3}>
              <View
                style={[
                  styles.diagCard,
                  report.risk_summary.theft_robbery_clear ? styles.diagCardClear : styles.diagCardDanger,
                ]}
              >
                <Text style={styles.diagLabel}>Roubo e Furto</Text>
                <Text
                  style={[
                    styles.diagStatus,
                    { color: report.risk_summary.theft_robbery_clear ? '#166534' : '#991b1b' },
                  ]}
                >
                  {report.risk_summary.theft_robbery_clear ? 'Nada Consta' : 'Alerta de Roubo'}
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
                    { color: report.risk_summary.judicial_clear ? '#166534' : '#991b1b' },
                  ]}
                >
                  {report.risk_summary.judicial_clear ? 'Desimpedido' : 'Bloqueio Judicial'}
                </Text>
              </View>
            </View>

            {/* 3. Alienação / Gravame */}
            <View style={styles.col3}>
              <View
                style={[
                  styles.diagCard,
                  report.gravamen_details?.has_active_gravamen ? styles.diagCardAlert : styles.diagCardClear,
                ]}
              >
                <Text style={styles.diagLabel}>Alienação / Gravame</Text>
                <Text
                  style={[
                    styles.diagStatus,
                    { color: report.gravamen_details?.has_active_gravamen ? '#b45309' : '#166534' },
                  ]}
                >
                  {report.gravamen_details?.has_active_gravamen ? 'Gravame Ativo' : 'Desalienado'}
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
                    { color: report.auction_details?.has_auction ? '#b45309' : '#166534' },
                  ]}
                >
                  {report.auction_details?.has_auction ? 'Consta Leilão' : 'Sem Registro'}
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
                    { color: report.claims_details?.has_claims ? '#b45309' : '#166534' },
                  ]}
                >
                  {report.claims_details?.has_claims ? 'Consta Sinistro' : 'Sem Registro'}
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
                    { color: recallClear ? '#166534' : '#991b1b' },
                  ]}
                >
                  {recallClear ? 'Sem Pendências' : `${recallPendingCount} Pendência(s)`}
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
                    { color: report.risk_summary.debts_clear ? '#166534' : '#b45309' },
                  ]}
                >
                  {report.risk_summary.debts_clear ? 'Quitados (R$ 0,00)' : formatCurrency(report.debts_summary?.total_debts)}
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
                    { color: hasRentalRecord ? '#b45309' : '#166534' },
                  ]}
                >
                  {hasRentalRecord ? 'Consta Registro' : 'Não Consta'}
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
            <Text style={styles.sectionSub}>Dados Oficiais Senatran & Detran</Text>
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
                  {report.brand} {report.model} {report.version && report.version !== report.model ? `• ${report.version}` : ''}
                </Text>
              </View>
              <View style={styles.col3}>
                <Text style={styles.fieldLabel}>Ano Fab. / Modelo</Text>
                <Text style={styles.fieldValueBold}>{report.year_manufacture || '-'} / {report.year_model || '-'}</Text>
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
                <Text style={styles.fieldLabel}>Potência / Cilindrada</Text>
                <Text style={styles.fieldValue}>{report.power || '-'} • {report.engine_capacity || '-'}</Text>
              </View>
              <View style={styles.col3}>
                <Text style={styles.fieldLabel}>Tipo / Espécie</Text>
                <Text style={styles.fieldValue}>{report.vehicle_type} • {report.species || 'Passageiro'}</Text>
              </View>

              <View style={styles.col3}>
                <Text style={styles.fieldLabel}>Município / UF</Text>
                <Text style={styles.fieldValue}>{report.city_state || '-'}</Text>
              </View>
              <View style={styles.col3}>
                <Text style={styles.fieldLabel}>Procedência</Text>
                <Text style={styles.fieldValue}>{report.origin || 'Nacional'}</Text>
              </View>
              <View style={styles.col3}>
                <Text style={styles.fieldLabel}>Câmbio / Tração</Text>
                <Text style={styles.fieldValue}>{report.gearbox || 'Manual'} • {report.traction || 'Dianteira'}</Text>
              </View>
              <View style={styles.col3}>
                <Text style={styles.fieldLabel}>Lugares</Text>
                <Text style={styles.fieldValue}>{report.seat_capacity || 5} passageiros</Text>
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

              {/* Chips de Status Comercial & Transferência */}
              <View style={[styles.col12, { marginTop: 2, paddingTop: 2.5, borderTopWidth: 0.5, borderTopColor: '#e2e8f0' }]}>
                <View style={styles.chipRow}>
                  <Text style={[styles.fieldLabel, { marginRight: 4, marginBottom: 0 }]}>Status Comercial:</Text>
                  
                  <View style={[styles.chip, hasRentalRecord ? styles.chipWarning : styles.chipSuccess]}>
                    <Text>Locadora: {report.commercial_indicators?.rental_label || 'Não Consta'}</Text>
                  </View>

                  <View style={[styles.chip, report.commercial_indicators?.has_sale_communication ? styles.chipWarning : styles.chipSuccess]}>
                    <Text>Comunicação de Venda: {report.commercial_indicators?.has_sale_communication ? 'Ativa' : 'Não Consta'}</Text>
                  </View>

                  <View style={[styles.chip, styles.chipNeutral]}>
                    <Text>Situação: {report.commercial_indicators?.vehicle_status || 'Circulação'}</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

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
                <Text style={styles.sectionSub}>Sircaf</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.grid}>
                  <View style={styles.col12}>
                    <Text style={styles.fieldLabel}>Situação do Gravame</Text>
                    <Text style={[styles.fieldValueBold, { color: report.gravamen_details?.has_active_gravamen ? '#b45309' : '#166534' }]}>
                      {report.gravamen_details?.status_label || 'Desalienado'}
                    </Text>
                  </View>
                  <View style={styles.col12}>
                    <Text style={styles.fieldLabel}>Agente Financeiro</Text>
                    <Text style={styles.fieldValueBold}>{report.gravamen_details?.agent || 'Nenhum agente ativo'}</Text>
                  </View>
                  <View style={styles.col6}>
                    <Text style={styles.fieldLabel}>Contrato</Text>
                    <Text style={styles.fieldValue}>{report.gravamen_details?.contract || 'N/A'}</Text>
                  </View>
                  <View style={styles.col6}>
                    <Text style={styles.fieldLabel}>Vigência</Text>
                    <Text style={styles.fieldValue}>{report.gravamen_details?.inclusion_date || 'N/A'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* IV. LEILÃO & SINISTROS */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>IV. Leilão & Sinistro</Text>
                <Text style={styles.sectionSub}>Bases Integradas</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.grid}>
                  <View style={styles.col6}>
                    <Text style={styles.fieldLabel}>Leilão</Text>
                    <Text style={[styles.fieldValueBold, { color: report.auction_details?.has_auction ? '#b45309' : '#166534' }]}>
                      {report.auction_details?.status_label || 'Sem Registro'}
                    </Text>
                    {report.auction_details?.has_auction && report.auction_details.records[0] ? (
                      <Text style={[styles.fieldValue, { fontSize: 6.2, marginTop: 1 }]}>
                        {report.auction_details.records[0].category || 'Recuperado'}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.col6}>
                    <Text style={styles.fieldLabel}>Sinistro / Avaria</Text>
                    <Text style={[styles.fieldValueBold, { color: report.claims_details?.has_claims ? '#b45309' : '#166534' }]}>
                      {report.claims_details?.status_label || 'Sem Registro'}
                    </Text>
                    {report.claims_details?.has_claims && report.claims_details.records[0] ? (
                      <Text style={[styles.fieldValue, { fontSize: 6.2, marginTop: 1 }]}>
                        {report.claims_details.records[0].damage_level || 'Média Monta'}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>

            {/* VII. ODÔMETRO & ANÚNCIOS WEB */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>VII. Odômetro & Anúncios Web</Text>
                <Text style={styles.sectionSub}>Histórico Web</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.fieldLabel}>Última Quilometragem Registrada</Text>
                {report.latest_km_record ? (
                  <View>
                    <Text style={[styles.fieldValueBold, { fontSize: 9.5, color: '#090d16', marginVertical: 1 }]}>
                      {formatKm(report.latest_km_record.mileage)}
                    </Text>
                    <Text style={[styles.fieldValue, { color: '#64748b', fontSize: 6.4 }]}>
                      {report.latest_km_record.date ? `Data: ${report.latest_km_record.date}` : ''}
                      {report.latest_km_record.source ? ` (${report.latest_km_record.source})` : ''}
                    </Text>
                    {report.latest_km_record.announced_price ? (
                      <Text style={[styles.fieldValueBold, { color: '#b45309', fontSize: 6.8, marginTop: 1 }]}>
                        Oferta anunciada: {formatCurrency(report.latest_km_record.announced_price)}
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <Text style={[styles.fieldValue, { color: '#64748b', fontSize: 6.5, marginVertical: 1 }]}>
                    Sem registros de KM em anúncios públicos
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* ----------------- COLUNA DIREITA (50%) ----------------- */}
          <View style={styles.columnHalf}>
            {/* V. HISTÓRICO DE PROPRIETÁRIOS (LGPD) */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>V. Proprietários Anteriores (LGPD)</Text>
                <Text style={styles.sectionSub}>{report.owners_history?.owners_count || 1} registro(s)</Text>
              </View>

              <View style={styles.table}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.th, { width: '18%' }]}>Ano</Text>
                  <Text style={[styles.th, { width: '12%' }]}>UF</Text>
                  <Text style={[styles.th, { width: '32%' }]}>Tipo Titular</Text>
                  <Text style={[styles.th, { width: '38%' }]}>Doc. Mascarado</Text>
                </View>

                {report.owners_history && report.owners_history.records.length > 0 ? (
                  report.owners_history.records.map((owner, idx) => (
                    <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                      <Text style={[styles.tdBold, { width: '18%' }]}>{owner.period || '-'}</Text>
                      <Text style={[styles.td, { width: '12%' }]}>{owner.state || 'SP'}</Text>
                      <Text style={[styles.td, { width: '32%', color: owner.document_type === 'PJ' ? '#1e40af' : '#334155', fontFamily: 'Helvetica-Bold' }]}>
                        {owner.document_type === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física'}
                      </Text>
                      <Text style={[styles.tdBold, { width: '38%', color: '#334155' }]}>
                        {owner.masked_document || (owner.document_type === 'PJ' ? '**.***.***/****-**' : '***.***.***-**')}
                      </Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.tableRow}>
                    <Text style={[styles.td, { width: '100%', color: '#64748b' }]}>
                      Primeiro proprietário registrado ou sem histórico anterior.
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* VI. REFERÊNCIA TABELA FIPE */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>VI. Referência Tabela FIPE</Text>
                <Text style={styles.sectionSub}>Oficial FIPE</Text>
              </View>
              <View style={styles.card}>
                <View style={styles.grid}>
                  <View style={styles.col6}>
                    <Text style={styles.fieldLabel}>Código FIPE</Text>
                    <Text style={styles.fieldValueBold}>{report.fipe_reference?.code || 'N/A'}</Text>
                  </View>
                  <View style={styles.col6}>
                    <Text style={styles.fieldLabel}>Preço Médio Atual</Text>
                    <Text style={[styles.fieldValueBold, { fontSize: 8.8, color: '#b45309' }]}>
                      {formatCurrency(report.fipe_reference?.price)}
                    </Text>
                  </View>
                  <View style={styles.col12}>
                    <Text style={styles.fieldLabel}>Mês de Referência</Text>
                    <Text style={styles.fieldValue}>{report.fipe_reference?.reference_month || 'Atual'}</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* VIII. DÉBITOS ESTADUAIS */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>VIII. Débitos Estaduais</Text>
                <Text style={styles.sectionSub}>Detran / Sefaz</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={styles.miniDebtBox}>
                  <Text style={styles.fieldLabel}>Multas</Text>
                  <Text style={styles.fieldValueBold}>{formatCurrency(report.debts_summary?.fines_pending)}</Text>
                </View>
                <View style={styles.miniDebtBox}>
                  <Text style={styles.fieldLabel}>IPVA</Text>
                  <Text style={styles.fieldValueBold}>{formatCurrency(report.debts_summary?.ipva_pending)}</Text>
                </View>
                <View style={styles.miniDebtBox}>
                  <Text style={styles.fieldLabel}>Licenc.</Text>
                  <Text style={styles.fieldValueBold}>{formatCurrency(report.debts_summary?.licensing_pending)}</Text>
                </View>
                <View style={[styles.miniDebtBox, { borderColor: (report.debts_summary?.total_debts || 0) > 0 ? '#fcd34d' : '#e2e8f0' }]}>
                  <Text style={styles.fieldLabel}>Total</Text>
                  <Text style={[styles.fieldValueBold, { color: (report.debts_summary?.total_debts || 0) > 0 ? '#b45309' : '#166534' }]}>
                    {formatCurrency(report.debts_summary?.total_debts)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ========================================================================= */}
        {/* RODAPÉ INSTITUCIONAL & NOTA DE ORIGEM GOVERNAMENTAL */}
        {/* ========================================================================= */}
        <View style={styles.footer} fixed>
          <View style={{ maxWidth: '86%' }}>
            <Text style={styles.footerTrust}>
              Origem dos Dados: Coletados e consolidados via API Brasil com integração direta aos sistemas governamentais oficiais (SENATRAN, DETRAN Estaduais, Renajud, Sircaf e bases conveniadas).
            </Text>
            <Text style={styles.footerText}>
              Documento gerado eletronicamente pelo Sistema de Gestão {storeName}. Consulta cadastral informativa para verificação de procedência e integridade veicular.
            </Text>
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
