import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { SaleWithDetails } from '@/lib/queries/sales';
import { SiteSettings } from '@/types/database';
import { formatPhone, formatCpf, formatRenavam, formatChassi } from '@/lib/utils/formatters';

const styles = StyleSheet.create({
  page: {
    padding: 26,
    paddingBottom: 32,
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    lineHeight: 1.3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#d97706',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    maxWidth: '68%',
  },
  logoBox: {
    width: 40,
    height: 40,
    backgroundColor: '#090d16',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#f59e0b',
  },
  logoSub: {
    fontSize: 5,
    fontFamily: 'Helvetica-Bold',
    color: '#cbd5e1',
    marginTop: -2,
  },
  storeInfo: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  storeName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#090d16',
    letterSpacing: 0.3,
  },
  storeContact: {
    fontSize: 6.5,
    color: '#475569',
    marginTop: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    flexDirection: 'column',
  },
  receiptBadge: {
    backgroundColor: '#090d16',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  receiptBadgeText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#f59e0b',
    letterSpacing: 0.5,
  },
  receiptDate: {
    fontSize: 6.5,
    color: '#64748b',
    marginTop: 1,
  },
  section: {
    marginBottom: 6,
  },
  sectionHeader: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 2.5,
    paddingHorizontal: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#d97706',
    borderRadius: 2,
    marginBottom: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sectionSub: {
    fontSize: 6,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 5,
    paddingHorizontal: 7,
  },
  grid3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 3,
  },
  col4: {
    width: '33.33%',
    paddingRight: 4,
  },
  col6: {
    width: '50%',
    paddingRight: 4,
  },
  col12: {
    width: '100%',
    paddingRight: 4,
  },
  fieldLabel: {
    fontSize: 5.8,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 0.5,
  },
  fieldValue: {
    fontSize: 7.5,
    fontFamily: 'Helvetica',
    color: '#1e293b',
  },
  fieldValueBold: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  table: {
    width: '100%',
  },
  tableRowHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    paddingBottom: 2,
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 1.5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  th1: { width: '38%', fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase' },
  th2: { width: '25%', fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase' },
  th3: { width: '20%', fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase' },
  th4: { width: '17%', fontSize: 6, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' },
  td1: { width: '38%', fontSize: 7, color: '#0f172a' },
  td2: { width: '25%', fontSize: 7, color: '#334155' },
  td3: { width: '20%', fontSize: 7, color: '#15803d', fontFamily: 'Helvetica-Bold' },
  td4: { width: '17%', fontSize: 7, color: '#0f172a', fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  legalCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 5,
  },
  legalText: {
    fontSize: 6,
    color: '#475569',
    lineHeight: 1.25,
    marginBottom: 2,
    textAlign: 'justify',
  },
  signaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 6,
  },
  signatureBox: {
    width: '44%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#475569',
    marginBottom: 2,
  },
  signatureName: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  signatureRole: {
    fontSize: 6,
    color: '#64748b',
    textAlign: 'center',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  footerText: {
    fontSize: 5.5,
    color: '#94a3b8',
  },
});

interface SaleReceiptPDFProps {
  sale: SaleWithDetails;
  settings?: SiteSettings | null;
  logoSrc?: string;
}

const formatCurrencyBRL = (val?: number | null) => {
  if (val === undefined || val === null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const formatDateBR = (dateStr?: string | null) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

export function SaleReceiptPDF({ sale, settings, logoSrc }: SaleReceiptPDFProps) {
  const storeName = settings?.site_name || 'AF Motos';
  /* const cnpj = '58.490.871/0001-30'; */
  const phone = formatPhone(settings?.whatsapp_phone || '81985901175');
  const email = settings?.contact_email || 'afmotos2026@gmail.com';
  const address = settings?.address || 'Cabo de Santo Agostinho - PE';

  const moto = sale.motorcycle;
  const year = new Date().getFullYear();
  const receiptCode = sale.receipt_number || `AFM-${year}-${sale.id.slice(0, 4).toUpperCase()}`;

  const paymentLabels: Record<string, string> = {
    PIX: 'PIX (À Vista)',
    FINANCIAMENTO: 'Financiamento Bancário',
    CARTAO: 'Cartão de Crédito',
    DINHEIRO: 'Dinheiro (Espécie)',
    TROCA: 'Moto na Troca',
    TRANSFERENCIA: 'Transferência TED',
    OUTRO: 'Outro',
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* CABEÇALHO INSTITUCIONAL */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoSrc ? (
              <Image src={logoSrc} style={{ width: 38, height: 38, borderRadius: 6, objectFit: 'contain' }} />
            ) : (
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>AF</Text>
                <Text style={styles.logoSub}>MOTOS</Text>
              </View>
            )}
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{storeName}</Text>
              <Text style={styles.storeContact}>
                WhatsApp: {phone} {email ? `• E-mail: ${email}` : ''}
              </Text>
              <Text style={styles.storeContact}>{address}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.receiptBadge}>
              <Text style={styles.receiptBadgeText}>{receiptCode}</Text>
            </View>
            <Text style={styles.receiptDate}>Emissão: {formatDateBR(sale.sale_date)}</Text>
            <Text style={{ fontSize: 5.5, color: '#15803d', fontFamily: 'Helvetica-Bold', marginTop: 1 }}>
              COMPROVANTE OFICIAL DE ENTREGA
            </Text>
          </View>
        </View>

        {/* 1. SEÇÃO VEÍCULO (GRID 3 COLUNAS) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>1. Identificação do Veículo & Dados Fiscais</Text>
            <Text style={styles.sectionSub}>Odômetro e Chassi</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.grid3}>
              <View style={styles.col4}>
                <Text style={styles.fieldLabel}>Marca / Modelo / Versão</Text>
                <Text style={styles.fieldValueBold}>
                  {moto?.brand || ''} {moto?.model || ''} {moto?.version || ''}
                </Text>
              </View>

              <View style={styles.col4}>
                <Text style={styles.fieldLabel}>Ano Fab. / Modelo</Text>
                <Text style={styles.fieldValue}>
                  {moto ? `${moto.year_manufacture} / ${moto.year_model}` : '-'}
                </Text>
              </View>

              <View style={styles.col4}>
                <Text style={styles.fieldLabel}>Placa</Text>
                <Text style={styles.fieldValueBold}>{moto?.license_plate || 'Em emplacamento'}</Text>
              </View>

              <View style={styles.col4}>
                <Text style={styles.fieldLabel}>Cor Predominante</Text>
                <Text style={styles.fieldValue}>{moto?.color || 'Não informada'}</Text>
              </View>

              <View style={styles.col4}>
                <Text style={styles.fieldLabel}>Renavam</Text>
                <Text style={styles.fieldValueBold}>{sale.renavam || moto?.renavam ? formatRenavam(sale.renavam || moto?.renavam) : 'Não informado'}</Text>
              </View>

              <View style={styles.col4}>
                <Text style={styles.fieldLabel}>Chassi (VIN)</Text>
                <Text style={styles.fieldValueBold}>{sale.chassi || moto?.chassi ? formatChassi(sale.chassi || moto?.chassi) : 'Não informado'}</Text>
              </View>

              <View style={[styles.col12, { borderTopWidth: 0.5, borderTopColor: '#cbd5e1', paddingTop: 2, marginTop: 1 }]}>
                <Text style={{ fontSize: 6.5, color: '#334155' }}>
                  KM no ato da entrega técnica: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{sale.delivery_km ?? moto?.mileage ?? 0} km</Text>
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 2. SEÇÃO IDENTIFICAÇÃO DAS PARTES */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>2. Identificação das Partes</Text>
          </View>
          <View style={styles.grid3}>
            {/* Vendedora */}
            <View style={[styles.col6, styles.card]}>
              <Text style={[styles.fieldLabel, { color: '#b45309' }]}>Vendedora (Loja)</Text>
              <Text style={styles.fieldValueBold}>{storeName}</Text>
              {/* <Text style={{ fontSize: 6.5, color: '#475569' }}>CNPJ: {cnpj}</Text> */}
              <Text style={{ fontSize: 6.5, color: '#475569' }}>Endereço: {address}</Text>
              <Text style={{ fontSize: 6.5, color: '#475569' }}>Tel/WhatsApp: {phone}</Text>
            </View>

            {/* Comprador */}
            <View style={[styles.col6, styles.card]}>
              <Text style={styles.fieldLabel}>Adquirente (Comprador)</Text>
              <Text style={styles.fieldValueBold}>{sale.buyer_name || 'Não informado'}</Text>
              <Text style={{ fontSize: 6.5, color: '#475569' }}>CPF: {sale.buyer_document ? formatCpf(sale.buyer_document) : 'Não informado'}</Text>
              <Text style={{ fontSize: 6.5, color: '#475569' }}>Tel/WhatsApp: {sale.buyer_phone ? formatPhone(sale.buyer_phone) : 'Não informado'}</Text>
              <Text style={{ fontSize: 6.5, color: '#475569' }}>Endereço: {sale.buyer_address || 'Endereço padrão'}</Text>
            </View>
          </View>
        </View>

        {/* 3. SEÇÃO CONDIÇÕES DE PAGAMENTO */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>3. Condições Financeiras & Quitação</Text>
            <Text style={styles.sectionSub}>Data: {formatDateBR(sale.sale_date)}</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.table}>
              <View style={styles.tableRowHeader}>
                <Text style={styles.th1}>Discriminação</Text>
                <Text style={styles.th2}>Modalidade</Text>
                <Text style={styles.th3}>Situação</Text>
                <Text style={styles.th4}>Valor (R$)</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.td1}>Valor Total do Veículo</Text>
                <Text style={styles.td2}>{paymentLabels[sale.payment_method || 'PIX'] || sale.payment_method}</Text>
                <Text style={styles.td3}>{sale.payment_status === 'PAID' ? 'Quitado' : 'Parcial'}</Text>
                <Text style={styles.td4}>{formatCurrencyBRL(sale.sale_price)}</Text>
              </View>

              {Number(sale.entry_amount) > 0 && (
                <View style={styles.tableRow}>
                  <Text style={[styles.td1, { fontSize: 6.5, paddingLeft: 4 }]}>↳ Valor de Entrada</Text>
                  <Text style={[styles.td2, { fontSize: 6.5 }]}>À Vista</Text>
                  <Text style={[styles.td3, { fontSize: 6.5 }]}>Recebido</Text>
                  <Text style={[styles.td4, { fontSize: 6.5 }]}>{formatCurrencyBRL(sale.entry_amount)}</Text>
                </View>
              )}
              {Number(sale.financed_amount) > 0 && (
                <View style={styles.tableRow}>
                  <Text style={[styles.td1, { fontSize: 6.5, paddingLeft: 4 }]}>↳ Financiamento</Text>
                  <Text style={[styles.td2, { fontSize: 6.5 }]}>Bancário</Text>
                  <Text style={[styles.td3, { fontSize: 6.5, color: '#1d4ed8' }]}>Aprovado</Text>
                  <Text style={[styles.td4, { fontSize: 6.5 }]}>{formatCurrencyBRL(sale.financed_amount)}</Text>
                </View>
              )}
              {Number(sale.trade_amount) > 0 && (
                <View style={styles.tableRow}>
                  <Text style={[styles.td1, { fontSize: 6.5, paddingLeft: 4 }]}>↳ Moto na Troca</Text>
                  <Text style={[styles.td2, { fontSize: 6.5 }]}>Avaliação</Text>
                  <Text style={[styles.td3, { fontSize: 6.5, color: '#7e22ce' }]}>Entregue</Text>
                  <Text style={[styles.td4, { fontSize: 6.5 }]}>{formatCurrencyBRL(sale.trade_amount)}</Text>
                </View>
              )}
            </View>

            {sale.receipt_notes && (
              <View style={{ marginTop: 3, paddingTop: 2, borderTopWidth: 0.5, borderTopColor: '#cbd5e1' }}>
                <Text style={{ fontSize: 6, color: '#475569' }}>
                  <Text style={{ fontFamily: 'Helvetica-Bold' }}>Obs:</Text> {sale.receipt_notes}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* 4. SEÇÃO TERMOS LEGAIS & CTB */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>4. Termos Legais, Vistoria & Cláusulas CTB</Text>
          </View>
          <View style={styles.legalCard}>
            <Text style={styles.legalText}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>4.1. Vistoria:</Text> O adquirente examinou e testou o veículo descrito, aprovando seu estado de conservação mecânica e estética no ato do recebimento das chaves.
            </Text>
            <Text style={styles.legalText}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>4.2. Transferência (Art. 123 CTB):</Text> O adquirente obriga-se a transferir a propriedade junto ao DETRAN em até 30 (trinta) dias.
            </Text>
            <Text style={styles.legalText}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>4.3. Infrações de Trânsito:</Text> A partir da data/hora da entrega, toda responsabilidade civil, criminal e por multas recai exclusivamente sobre o comprador.
            </Text>
          </View>
        </View>

        {/* 5. SEÇÃO ASSINATURAS */}
        <View style={styles.signaturesContainer}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{storeName.toUpperCase()}</Text>
            <Text style={styles.signatureRole}>Vendedora / Representante Legal</Text>
          </View>

          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{(sale.buyer_name || 'Comprador').toUpperCase()}</Text>
            <Text style={styles.signatureRole}>CPF: {sale.buyer_document ? formatCpf(sale.buyer_document) : 'Documento Registrado'}</Text>
          </View>
        </View>

        {/* RODAPÉ */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {storeName} • Recibo e Comprovante de Entrega • Autenticidade: {receiptCode}
          </Text>
          <Text style={styles.footerText}>Página 1 de 1</Text>
        </View>
      </Page>
    </Document>
  );
}
