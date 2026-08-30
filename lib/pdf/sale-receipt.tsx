import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import { SaleWithDetails } from '@/lib/queries/sales';
import { SiteSettings } from '@/types/database';
import { formatPhone, formatCpf, formatRenavam, formatChassi } from '@/lib/utils/formatters';
import { formatCnpj } from '@/lib/utils/cnpj';
import { MercosulPlateBadge } from '@/lib/pdf/mercosul-plate-badge';

const styles = StyleSheet.create({
  page: {
    padding: 24,
    paddingTop: 20,
    paddingBottom: 20,
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
    marginBottom: 7,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    maxWidth: '68%',
  },
  logoBox: {
    width: 42,
    height: 42,
    backgroundColor: '#090d16',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 15,
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
    paddingLeft: 2,
  },
  storeNameBox: {
    marginBottom: 5,
    paddingBottom: 1,
  },
  storeName: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#090d16',
    letterSpacing: 0.3,
  },
  storeContact: {
    fontSize: 6.8,
    color: '#475569',
    lineHeight: 1.35,
    marginTop: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    flexDirection: 'column',
  },
  receiptBadge: {
    backgroundColor: '#090d16',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  receiptBadgeText: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: '#f59e0b',
    letterSpacing: 0.5,
  },
  receiptDate: {
    fontSize: 6.8,
    color: '#64748b',
    marginTop: 1.5,
  },
  section: {
    marginBottom: 6,
  },
  sectionHeader: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 2.6,
    paddingHorizontal: 6,
    borderLeftWidth: 3.5,
    borderLeftColor: '#d97706',
    borderRadius: 2.5,
    marginBottom: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 7.8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sectionSub: {
    fontSize: 6.2,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4.5,
    padding: 5,
    paddingHorizontal: 7.5,
  },
  grid3: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 3.5,
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
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 0.8,
  },
  fieldValue: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: '#1e293b',
  },
  fieldValueBold: {
    fontSize: 8,
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
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  th1: { width: '38%', fontSize: 6.2, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase' },
  th2: { width: '25%', fontSize: 6.2, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase' },
  th3: { width: '20%', fontSize: 6.2, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase' },
  th4: { width: '17%', fontSize: 6.2, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase', textAlign: 'right' },
  td1: { width: '38%', fontSize: 7.5, color: '#0f172a' },
  td2: { width: '25%', fontSize: 7.5, color: '#334155' },
  td3: { width: '20%', fontSize: 7.5, color: '#15803d', fontFamily: 'Helvetica-Bold' },
  td4: { width: '17%', fontSize: 7.5, color: '#0f172a', fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  legalCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4.5,
    padding: 5,
    paddingHorizontal: 7,
  },
  legalText: {
    fontSize: 5.6,
    color: '#475569',
    lineHeight: 1.25,
    marginBottom: 2,
    textAlign: 'justify',
  },
  signaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 12,
    marginBottom: 5,
  },
  signatureBox: {
    width: '42%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#475569',
    marginBottom: 3,
  },
  signatureName: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  signatureRole: {
    fontSize: 6.2,
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
    marginTop: 5,
  },
  footerText: {
    fontSize: 5.8,
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

import { CONSTANTS } from '@/lib/utils/constants';

export function SaleReceiptPDF({ sale, settings, logoSrc }: SaleReceiptPDFProps) {
  const storeName = settings?.site_name || CONSTANTS.STORE_NAME;
  const cnpj = formatCnpj(settings?.cnpj);
  const phone = formatPhone(settings?.whatsapp_phone || CONSTANTS.CONTACT_PHONE);
  const email = settings?.contact_email || CONSTANTS.CONTACT_EMAIL;
  const address = settings?.address || CONSTANTS.STORE_ADDRESS;

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
              <Image src={logoSrc} style={{ width: 44, height: 44, borderRadius: 7, objectFit: 'contain' }} />
            ) : (
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>AF</Text>
                <Text style={styles.logoSub}>MOTOS</Text>
              </View>
            )}
            <View style={styles.storeInfo}>
              <View style={styles.storeNameBox}>
                <Text style={styles.storeName}>{storeName}</Text>
              </View>
              <Text style={styles.storeContact}>
                WhatsApp: {phone} {email ? `• E-mail: ${email}` : ''}
              </Text>
              {cnpj ? <Text style={styles.storeContact}>CNPJ: {cnpj}</Text> : null}
              <Text style={styles.storeContact}>{address}</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.receiptBadge}>
              <Text style={styles.receiptBadgeText}>{receiptCode}</Text>
            </View>
            <Text style={styles.receiptDate}>Emissão: {formatDateBR(sale.sale_date)}</Text>
            <Text style={{ fontSize: 6, color: '#15803d', fontFamily: 'Helvetica-Bold', marginTop: 1.5 }}>
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
                <Text style={styles.fieldLabel}>Placa de Identificação</Text>
                {moto?.license_plate ? (
                  <View style={{ marginTop: 1 }}>
                    <MercosulPlateBadge plate={moto.license_plate} width={82} fontSize={9} />
                  </View>
                ) : (
                  <Text style={styles.fieldValueBold}>0km / Em emplacamento</Text>
                )}
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
              {cnpj ? <Text style={{ fontSize: 6.5, color: '#475569' }}>CNPJ: {cnpj}</Text> : null}
              <Text style={{ fontSize: 6.5, color: '#475569' }}>Tel/WhatsApp: {phone}</Text>
              {email ? <Text style={{ fontSize: 6.5, color: '#475569' }}>E-mail: {email}</Text> : null}
              <Text style={{ fontSize: 6.5, color: '#475569' }}>Endereço: {address}</Text>
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

        {/* 4. SEÇÃO TERMO DE GARANTIA (90 DIAS OU 3.000 KM) & PROTEÇÃO JURÍDICA */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>4. Termo de Garantia (90 Dias / 3.000 KM), Vistoria & Proteção Legal</Text>
            <Text style={styles.sectionSub}>Art. 18 e 26 CDC & Art. 123 e 134 CTB</Text>
          </View>
          <View style={styles.legalCard}>
            <Text style={styles.legalText}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>4.1. Garantia Legal de 90 Dias ou 3.000 KM (Motor e Câmbio):</Text> A Loja "{storeName}" concede ao ADQUIRENTE garantia legal pelo prazo improrrogável de 90 (noventa) dias corridos ou 3.000 (três mil) quilômetros rodados, o que primeiro ocorrer, a contar da data de entrega do veículo, nos termos do Artigo 26, Inciso II da Lei Federal nº 8.078/1990 (Código de Defesa do Consumidor). A referida garantia é restrita e exclusiva aos componentes internos banhados a óleo de MOTOR e CÂMBIO.
            </Text>
            <Text style={styles.legalText}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>4.2. Exclusões Expressas por Mau Uso, Modificações e Negligência:</Text> A garantia NÃO COBRE avarias decorrentes de: a) Mau uso, sobre-rotação ("corte de giro"), empinar/manobras, sobrecarga de carga/passageiros ou competições; b) Falta, atraso na troca de óleo, nível insuficiente de lubrificante ou uso de combustível adulterado; c) Quedas, colisões, acidentes ou submersão em água/alagamentos; d) Instalação de escapamento esportivo, remap de injeção, corte de chicote elétrico, alarmes ou rastreadores não homologados pela LOJA.
            </Text>
            <Text style={styles.legalText}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>4.3. Perda Imediata da Garantia por Intervenção de Terceiros e Prazos:</Text> Havendo suspeita de anomalia, o ADQUIRENTE deve comunicar imediatamente a LOJA e apresentar o veículo na sede da {storeName}. Qualquer desmontagem, abertura de motor, rompimento de lacres ou tentativa de conserto por mecânicos terceiros sem autorização formal por escrito implicará na PERDA TOTAL E IMEDIATA DA GARANTIA. Em caso de reparo coberto, a LOJA disporá do prazo legal de até 30 (trinta) dias para solução do vício (Art. 18, § 1º do CDC).
            </Text>
            <Text style={styles.legalText}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>4.4. Transporte e Despesas de Reboque:</Text> O transporte, guincho ou reboque do veículo até a sede da Loja "{storeName}" para diagnóstico ou reparo é de responsabilidade e custo exclusivo do ADQUIRENTE.
            </Text>
            <Text style={styles.legalText}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>4.5. Itens de Desgaste Natural e Manutenção Preventiva:</Text> Fica expressamente convencionado que NÃO são cobertos pela garantia componentes sujeitos a desgaste natural por atrito e rodagem (pneus, câmaras de ar, pastilhas/lonas de freio, relação/transmissão, cabos de embreagem/acelerador, bateria, lâmpadas, velas e filtros), cabendo sua manutenção periódica exclusivamente ao COMPRADOR.
            </Text>
            <Text style={styles.legalText}>
              <Text style={{ fontFamily: 'Helvetica-Bold' }}>4.6. Vistoria, Infrações e Transferência DETRAN (CTB):</Text> O COMPRADOR declara que vistoriou, testou e aprovou as condições estéticas, mecânicas e estruturais do veículo. A partir da presente data e hora da entrega física, todas as responsabilidades civis, criminais e multas/infrações de trânsito recaem exclusivamente sobre o COMPRADOR, que se obriga a efetivar a transferência no DETRAN no prazo legal de 30 (trinta) dias (Art. 123 do CTB), ficando a LOJA autorizada a realizar a devida Comunicação de Venda (Art. 134 do CTB).
            </Text>
          </View>
        </View>

        {/* 5. SEÇÃO ASSINATURAS */}
        <View style={styles.signaturesContainer}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{storeName.toUpperCase()}</Text>
            <Text style={styles.signatureRole}>Representante Legal</Text>
            {cnpj ? <Text style={styles.signatureRole}>CNPJ: {cnpj}</Text> : null}
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
        </View>
      </Page>
    </Document>
  );
}
