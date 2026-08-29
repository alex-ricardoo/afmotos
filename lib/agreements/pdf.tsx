import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

export interface AgreementPdfInput {
  saleId: string;
  storeName: string;
  logoSrc?: string;
  address: string;
  phone: string;
  email?: string | null;
  cnpj?: string;
  sellerName: string;
  sellerDocument?: string | null;
  sellerRg: string;
  sellerAddress: string;
  sellerPhone: string;
  vehicleBrand?: string | null;
  vehicleModel?: string | null;
  vehicleYear?: number | null;
  vehicleManufactureYear?: number | null;
  vehicleModelYear?: number | null;
  vehicleVersion?: string | null;
  vehicleColor?: string | null;
  vehiclePlate?: string | null;
  vehicleChassi?: string | null;
  vehicleRenavam?: string | null;
  vehicleMileage?: number | null;
  vehicleFuel?: string | null;
  vehicleFipeCode?: string | null;
  vehicleFipeReference?: string | null;
  expectedSaleValue: number;
  commissionPercentage: number;
  commissionValue: number;
  agreementDate: string;
}

const styles = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: 'Helvetica', color: '#0f172a', backgroundColor: '#ffffff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 2, borderBottomColor: '#d97706', paddingBottom: 10, marginBottom: 12 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#0f172a', borderWidth: 1.2, borderColor: '#d97706', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: '#fbbf24' },
  headerInfo: { flexDirection: 'column' },
  storeName: { fontSize: 19, fontFamily: 'Helvetica-Bold', color: '#0f172a', marginBottom: 2 },
  smallText: { fontSize: 7.2, color: '#475569', lineHeight: 1.35 },
  headerRight: { alignItems: 'flex-end' },
  badge: { backgroundColor: '#0f172a', borderRadius: 6, borderWidth: 1, borderColor: '#d97706', paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 8.2, fontFamily: 'Helvetica-Bold', color: '#fbbf24' },
  section: { marginBottom: 12 },
  sectionHeader: { backgroundColor: '#f8fafc', borderLeftWidth: 4, borderLeftColor: '#d97706', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4, marginBottom: 6, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 8.8, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.3 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  infoCard: { width: '32%', backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 5, padding: 6, minHeight: 42 },
  label: { fontSize: 6.2, fontFamily: 'Helvetica-Bold', color: '#64748b', textTransform: 'uppercase', marginBottom: 2 },
  value: { fontSize: 8.1, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  legalBox: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 5, padding: 8 },
  paragraph: { fontSize: 6.6, color: '#334155', textAlign: 'justify', lineHeight: 1.45, marginBottom: 4 },
  totals: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  totalBox: { borderWidth: 1, borderColor: '#fbbf24', backgroundColor: '#fff7ed', borderRadius: 6, padding: 8, width: '30%' },
  totalLabel: { fontSize: 6.4, fontFamily: 'Helvetica-Bold', color: '#9a5b00', textTransform: 'uppercase', marginBottom: 3 },
  totalValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  signatureRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, marginBottom: 12 },
  signatureBox: { width: '42%', alignItems: 'center' },
  signatureLine: { width: '100%', borderTopWidth: 1, borderTopColor: '#475569', marginBottom: 4 },
  signatureName: { fontSize: 8.2, fontFamily: 'Helvetica-Bold' },
  signatureRole: { fontSize: 6.4, color: '#64748b' },
  footer: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 6, flexDirection: 'row', justifyContent: 'space-between', color: '#64748b', fontSize: 6.2 },
});

const currency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatCpf = (value?: string | null) => {
  const digits = value?.replace(/\D/g, '') || '';
  if (digits.length !== 11) return value || 'Não informado';
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

const formatPhone = (value?: string | null) => {
  const digits = value?.replace(/\D/g, '') || '';
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return value || 'Não informado';
};

export function AgreementSalePDF({
  saleId,
  storeName,
  logoSrc,
  address,
  phone,
  email,
  cnpj,
  sellerName,
  sellerDocument,
  sellerRg,
  sellerAddress,
  sellerPhone,
  vehicleBrand,
  vehicleModel,
  vehicleYear,
  vehicleManufactureYear,
  vehicleModelYear,
  vehicleVersion,
  vehicleColor,
  vehiclePlate,
  vehicleChassi,
  vehicleRenavam,
  vehicleMileage,
  vehicleFuel,
  vehicleFipeCode,
  vehicleFipeReference,
  expectedSaleValue,
  commissionPercentage,
  commissionValue,
  agreementDate,
}: AgreementPdfInput) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {logoSrc ? (
              <Image src={logoSrc} style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'contain' }} />
            ) : (
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>AF</Text>
              </View>
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.storeName}>{storeName}</Text>
              <Text style={styles.smallText}>Endereço: {address}</Text>
              <Text style={styles.smallText}>WhatsApp: {phone}{email ? ` • E-mail: ${email}` : ''}</Text>
              {cnpj ? <Text style={styles.smallText}>CNPJ: {cnpj}</Text> : null}
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ACORDO DE VENDA {saleId.slice(0, 8).toUpperCase()}</Text>
            </View>
            <Text style={{ fontSize: 7, color: '#64748b', marginTop: 4 }}>Data: {agreementDate}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>1. Identificação das partes e do veículo</Text>
          </View>
          <View style={styles.summaryGrid}>
            <View style={{ ...styles.infoCard, width: '66%' }}>
              <Text style={styles.label}>Loja / Representante Legal</Text>
              <Text style={styles.value}>{storeName}</Text>
              {cnpj ? <Text style={styles.smallText}>CNPJ: {cnpj}</Text> : null}
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.label}>Proprietário da moto</Text>
              <Text style={styles.value}>{sellerName}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.label}>CPF</Text>
              <Text style={styles.value}>{formatCpf(sellerDocument)}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.label}>RG</Text>
              <Text style={styles.value}>{sellerRg}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.label}>Telefone</Text>
              <Text style={styles.value}>{formatPhone(sellerPhone)}</Text>
            </View>
            <View style={{ ...styles.infoCard, width: '66%' }}>
              <Text style={styles.label}>Endereço</Text>
              <Text style={styles.value}>{sellerAddress}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.label}>Placa</Text>
              <Text style={styles.value}>{vehiclePlate || 'Não informada'}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.label}>Marca / Modelo</Text>
              <Text style={styles.value}>{[vehicleBrand, vehicleModel].filter(Boolean).join(' ') || 'Não informado'}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.label}>Ano / Versão</Text>
              <Text style={styles.value}>{vehicleManufactureYear || vehicleYear || 'Não informado'} / modelo {vehicleModelYear || vehicleYear || 'Não informado'}{vehicleVersion ? ` / ${vehicleVersion}` : ''}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>2. Valores e comissão</Text>
          </View>
          <View style={styles.totals}>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Base de cálculo</Text>
              <Text style={styles.totalValue}>{currency(expectedSaleValue)}</Text>
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Comissão</Text>
              <Text style={styles.totalValue}>{Number(commissionPercentage).toFixed(2)}%</Text>
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Comissão projetada</Text>
              <Text style={styles.totalValue}>{currency(commissionValue)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>3. Cláusulas e termos jurídicos</Text>
          </View>
          <View style={styles.legalBox}>
            <Text style={styles.paragraph}>
              3.1. Intermediação. O PROPRIETÁRIO autoriza a AF Motos a divulgar, anunciar, apresentar e intermediar a negociação da motocicleta descrita neste instrumento, sem que isso transfira à AF Motos a propriedade, a posse ou a responsabilidade pela conservação do veículo, salvo documento específico em sentido contrário. A AF Motos atua apenas como ponte entre o PROPRIETÁRIO e o comprador.
            </Text>
            <Text style={styles.paragraph}>
              3.2. Comissão. A comissão será de {Number(commissionPercentage).toFixed(2)}% sobre o valor total efetivamente negociado na venda, não sendo a quantia de {currency(commissionValue)} um valor fixo: trata-se da projeção calculada sobre a base de {currency(expectedSaleValue)}. O vencimento ocorrerá na data do recebimento do preço ou da assinatura do negócio, o que ocorrer primeiro, mediante pagamento por PIX para a chave informada pela AF Motos.
            </Text>
            <Text style={styles.paragraph}>
              3.3. Cliente apresentado. Considera-se Cliente Apresentado qualquer pessoa que tenha conhecido a motocicleta, recebido informações, fotos, localização, preço ou contato do PROPRIETÁRIO por intermédio da AF Motos, seus anúncios, colaboradores, parceiros, site, WhatsApp, telefone, Instagram, Facebook, marketplaces ou outros canais utilizados pela empresa. A AF Motos poderá registrar esses dados, contatos, visitas, mensagens e propostas por meio físico ou eletrônico, para comprovar a intermediação, observada a legislação de proteção de dados.
            </Text>
            <Text style={styles.paragraph}>
              3.4. Não desvio. O PROPRIETÁRIO não poderá ocultar, desviar ou concluir diretamente negócio com Cliente Apresentado com a finalidade de evitar a comissão. A venda direta ao Cliente Apresentado não afastará a obrigação quando a AF Motos demonstrar sua apresentação ou contribuição causal para a negociação. O contrato não é exclusivo: o PROPRIETÁRIO pode negociar por outros meios, preservada essa obrigação.
            </Text>
            <Text style={styles.paragraph}>
              3.5. Responsabilidades. O PROPRIETÁRIO declara a legitimidade da propriedade e responde perante a AF Motos pela exatidão das informações, conservação, débitos, gravames, restrições, financiamento, reserva de domínio e transferência do veículo. O PROPRIETÁRIO e o COMPRADOR serão responsáveis por vistoria, taxas, quitação de débitos anteriores, assinatura do ATPV-e, comunicação de venda ao DETRAN, transferência e multas entre a entrega e a efetiva transferência, conforme a obrigação legal aplicável a cada um. A AF Motos apenas aproxima as partes e não assume obrigações perante terceiros por força desta declaração.
            </Text>
            <Text style={styles.paragraph}>
              3.6. Atraso e documentos. Em caso de atraso, incidirão multa de 2%, juros de mora de 1% ao mês pro rata die e correção pelo IPCA, sem prejuízo de perdas e danos comprovados e despesas razoáveis de cobrança. O PROPRIETÁRIO deverá informar imediatamente qualquer divergência, gravame, restrição judicial ou administrativa ou impedimento de transferência.
            </Text>
            <Text style={styles.paragraph}>
              3.7. Divulgação e proteção de dados. O PROPRIETÁRIO autoriza a AF Motos a fotografar e filmar a motocicleta, publicar marca, modelo, ano, quilometragem, preço e imagens, compartilhar seus dados de contato com potenciais compradores e utilizar essas informações para divulgação, negociação e documentação, nos limites da legislação aplicável, especialmente a LGPD.
            </Text>
          </View>
        </View>

        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{storeName.toUpperCase()}</Text>
            <Text style={styles.signatureRole}>AF Motos • Representante Legal</Text>
            {cnpj ? <Text style={styles.signatureRole}>CNPJ: {cnpj}</Text> : null}
          </View>

          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>{sellerName.toUpperCase()}</Text>
            <Text style={styles.signatureRole}>Proprietário • CPF {formatCpf(sellerDocument)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Local e data: {address} • {agreementDate}</Text>
          <Text>Documento interno: {saleId}</Text>
        </View>
      </Page>
    </Document>
  );
}
