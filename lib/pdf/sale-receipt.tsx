import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { SaleWithDetails } from '@/lib/queries/sales';
import { SiteSettings } from '@/types/database';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    paddingBottom: 40,
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    lineHeight: 1.35,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#c9a44c',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '68%',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    objectFit: 'cover',
  },
  storeInfo: {
    flexDirection: 'column',
    justifyContent: 'center',
  },
  storeName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  storeTagline: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#b45309',
    marginTop: 1,
  },
  storeContact: {
    fontSize: 7,
    color: '#475569',
    marginTop: 2,
  },
  storeAddress: {
    fontSize: 7,
    color: '#64748b',
    marginTop: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    flexDirection: 'column',
  },
  receiptBadge: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    marginBottom: 3,
  },
  receiptBadgeText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#92400e',
    letterSpacing: 0.5,
  },
  receiptNumber: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  receiptDate: {
    fontSize: 7.5,
    color: '#64748b',
    marginTop: 2,
  },
  docTitleBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    textAlign: 'center',
  },
  docTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  section: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionHeaderDot: {
    width: 3,
    height: 9,
    backgroundColor: '#c9a44c',
    borderRadius: 1.5,
    marginRight: 4,
  },
  sectionTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  card: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 5,
    padding: 7,
    paddingHorizontal: 9,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 4,
  },
  col6: {
    width: '50%',
    paddingRight: 6,
  },
  col4: {
    width: '33.33%',
    paddingRight: 6,
  },
  col12: {
    width: '100%',
    paddingRight: 6,
  },
  fieldLabel: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 1,
    letterSpacing: 0.2,
  },
  fieldValue: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#1e293b',
  },
  fieldValueBold: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  financeCard: {
    backgroundColor: '#fefce8',
    borderWidth: 1,
    borderColor: '#fef08a',
    borderRadius: 5,
    padding: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financeLeft: {
    flexDirection: 'column',
  },
  financeLabel: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#854d0e',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  financeValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#b45309',
    marginTop: 1,
  },
  financeRight: {
    alignItems: 'flex-end',
    flexDirection: 'column',
  },
  paymentMethodBadge: {
    backgroundColor: '#0f172a',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 2,
  },
  paymentMethodText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
  },
  paymentStatusText: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: '#15803d',
    marginTop: 1,
  },
  termsCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 5,
    padding: 7,
  },
  notesHighlight: {
    backgroundColor: '#ffffff',
    borderLeftWidth: 2.5,
    borderLeftColor: '#c9a44c',
    padding: 4,
    paddingLeft: 6,
    marginBottom: 4,
    borderRadius: 2,
  },
  notesLabel: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#b45309',
    marginBottom: 1,
    textTransform: 'uppercase',
  },
  notesText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Oblique',
    color: '#334155',
  },
  termsText: {
    fontSize: 6.5,
    color: '#475569',
    lineHeight: 1.35,
  },
  locationDateBlock: {
    marginTop: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  locationDateText: {
    fontSize: 8,
    color: '#475569',
    textAlign: 'center',
  },
  signaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  signatureBox: {
    width: '42%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    marginBottom: 3,
  },
  signatureName: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  signatureRole: {
    fontSize: 6.5,
    color: '#64748b',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 30,
    right: 30,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 6.5,
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

const formatDocumentBR = (val?: string | null) => {
  if (!val) return 'Não informado';
  const clean = val.replace(/\D/g, '');
  if (clean.length === 11) {
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  if (clean.length === 14) {
    return clean
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  }
  return val;
};

const formatPhoneBR = (val?: string | null) => {
  if (!val) return 'Não informado';
  const clean = val.replace(/\D/g, '');
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
  }
  if (clean.length === 10) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6, 10)}`;
  }
  return val;
};

const getMonthNameBR = (monthIndex: number) => {
  const months = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];
  return months[monthIndex] || '';
};

export function SaleReceiptPDF({ sale, settings, logoSrc }: SaleReceiptPDFProps) {
  const storeName = settings?.site_name || 'AF Motos';
  const phone = formatPhoneBR(settings?.whatsapp_phone || '81985901175');
  const email = settings?.contact_email || 'afmotos2026@gmail.com';
  const address = settings?.address || 'Cabo de Santo Agostinho - PE';

  const moto = sale.motorcycle;

  const dateObj = sale.sale_date ? new Date(`${sale.sale_date}T12:00:00`) : new Date();
  const day = dateObj.getDate();
  const monthName = getMonthNameBR(dateObj.getMonth());
  const year = dateObj.getFullYear();
  const cityLocation =
    address.split(',')[1]?.trim() ||
    address.split('-')[0]?.trim() ||
    'Cabo de Santo Agostinho - PE';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 1. Header with Logo & Store Identification */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoSrc ? <Image src={logoSrc} style={styles.logo} /> : null}
            <View style={styles.storeInfo}>
              <Text style={styles.storeContact}>
                WhatsApp: {phone} • E-mail: {email}
              </Text>
              <Text style={styles.storeAddress}>{address}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.receiptBadge}>
              <Text style={styles.receiptBadgeText}>RECIBO DE VENDA</Text>
            </View>
            <Text style={styles.receiptNumber}>{sale.receipt_number || `AFM-${year}-0001`}</Text>
            <Text style={styles.receiptDate}>Data da Emissão: {formatDateBR(sale.sale_date)}</Text>
          </View>
        </View>

        {/* 2. Document Title Banner */}
        <View style={styles.docTitleBanner}>
          <Text style={styles.docTitle}>COMPROVANTE DE NEGOCIAÇÃO E REPASSE DE VEÍCULO</Text>
        </View>

        {/* 3. Section: Dados do Veículo */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderDot} />
            <Text style={styles.sectionTitle}>1. Identificação do Veículo</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.grid}>
              <View style={styles.col6}>
                <Text style={styles.fieldLabel}>Marca / Modelo / Versão</Text>
                <Text style={styles.fieldValueBold}>
                  {moto?.brand || 'N/A'} {moto?.model || ''} {moto?.version || ''}
                </Text>
              </View>

              <View style={styles.col6}>
                <Text style={styles.fieldLabel}>Ano Fab. / Ano Mod.</Text>
                <Text style={styles.fieldValue}>
                  {moto ? `${moto.year_manufacture} / ${moto.year_model}` : 'N/A'}
                </Text>
              </View>

              <View style={styles.col6}>
                <Text style={styles.fieldLabel}>Placa</Text>
                <Text style={styles.fieldValueBold}>
                  {moto?.license_plate || 'Em emplacamento / Não informada'}
                </Text>
              </View>

              <View style={styles.col6}>
                <Text style={styles.fieldLabel}>Cor</Text>
                <Text style={styles.fieldValue}>{moto?.color || 'Não informada'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4. Section: Dados do Comprador */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderDot} />
            <Text style={styles.sectionTitle}>2. Identificação do Comprador</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.grid}>
              <View style={styles.col6}>
                <Text style={styles.fieldLabel}>Nome Completo</Text>
                <Text style={styles.fieldValueBold}>{sale.buyer_name || 'Não informado'}</Text>
              </View>

              <View style={styles.col6}>
                <Text style={styles.fieldLabel}>CPF / CNPJ</Text>
                <Text style={styles.fieldValue}>{formatDocumentBR(sale.buyer_document)}</Text>
              </View>

              <View style={styles.col6}>
                <Text style={styles.fieldLabel}>Telefone / WhatsApp</Text>
                <Text style={styles.fieldValue}>{formatPhoneBR(sale.buyer_phone)}</Text>
              </View>

              <View style={styles.col6}>
                <Text style={styles.fieldLabel}>E-mail</Text>
                <Text style={styles.fieldValue}>{sale.buyer_email || 'Não informado'}</Text>
              </View>

              <View style={styles.col12}>
                <Text style={styles.fieldLabel}>Endereço Completo</Text>
                <Text style={styles.fieldValue}>{sale.buyer_address || 'Não informado'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 5. Section: Condições Financeiras */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderDot} />
            <Text style={styles.sectionTitle}>3. Dados Financeiros & Condições de Pagamento</Text>
          </View>
          <View style={styles.financeCard}>
            <View style={styles.financeLeft}>
              <Text style={styles.financeLabel}>Valor Total Negociado</Text>
              <Text style={styles.financeValue}>{formatCurrencyBRL(sale.sale_price)}</Text>
            </View>
            <View style={styles.financeRight}>
              <View style={styles.paymentMethodBadge}>
                <Text style={styles.paymentMethodText}>FORMA: {sale.payment_method || 'PIX'}</Text>
              </View>
              <Text style={styles.paymentStatusText}>
                {sale.payment_status === 'PAID'
                  ? '✓ PAGO INTEGRALMENTE'
                  : sale.payment_status === 'PARTIAL'
                    ? `✓ ENTRADA DE ${formatCurrencyBRL(sale.amount_paid)}`
                    : '⏳ AGUARDANDO PAGAMENTO'}
              </Text>
            </View>
          </View>
        </View>

        {/* 6. Section: Termos de Entrega & Declarações */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderDot} />
            <Text style={styles.sectionTitle}>4. Observações & Termos de Entrega</Text>
          </View>
          <View style={styles.termsCard}>
            {sale.receipt_notes ? (
              <View style={styles.notesHighlight}>
                <Text style={styles.notesLabel}>Observações da Venda:</Text>
                <Text style={styles.notesText}>{sale.receipt_notes}</Text>
              </View>
            ) : null}
            <Text style={styles.termsText}>
              • O comprador declara que vistoriou o veículo descrito acima e o recebe nas condições
              mecânicas e estéticas acordadas entre as partes.
            </Text>
            <Text style={styles.termsText}>
              • A transferência de propriedade e responsabilidade sobre o veículo perante os órgãos
              executivos de trânsito (DETRAN) deverá ser efetivada dentro do prazo legal de 30
              (trinta) dias.
            </Text>
            <Text style={styles.termsText}>
              • Este documento formaliza a transação comercial de venda e repasse, servindo como
              recibo de quitação/sinal acordado.
            </Text>
          </View>
        </View>

        {/* 7. Local & Data */}
        <View style={styles.locationDateBlock}>
          <Text style={styles.locationDateText}>
            {cityLocation}, {day} de {monthName} de {year}
          </Text>
        </View>

        {/* 8. Signatures */}
        <View style={styles.signaturesContainer}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{storeName.toUpperCase()}</Text>
            <Text style={styles.signatureRole}>Vendedor / Representante Legal</Text>
          </View>

          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>
              {(sale.buyer_name || 'Comprador').toUpperCase()}
            </Text>
            <Text style={styles.signatureRole}>Comprador / Adquirente</Text>
          </View>
        </View>

        {/* 9. Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {storeName} • Documento e recibo autêntico gerado eletronicamente em{' '}
            {new Date().toLocaleDateString('pt-BR')}
          </Text>
          <Text style={styles.footerText}>Página 1 de 1</Text>
        </View>
      </Page>
    </Document>
  );
}
