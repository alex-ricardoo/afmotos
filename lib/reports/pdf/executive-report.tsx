import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';
import {
  OverviewReportData,
  SalesReportData,
  FinancialReportData,
  InventoryReportData,
  StockMovementReportData,
  ConsignmentReportItem,
  VehicleResultReportItem,
  DataQualityIssueItem,
} from '../types';
import { SiteSettings } from '@/types/database';
import { formatCurrencyBRL, formatReportDate } from '../formatters';
import { formatCnpj } from '@/lib/utils/cnpj';
import { formatPhone } from '@/lib/utils/formatters';

const styles = StyleSheet.create({
  page: {
    padding: 24,
    paddingTop: 18,
    paddingBottom: 28,
    fontSize: 7.2,
    fontFamily: 'Helvetica',
    color: '#0f172a',
    backgroundColor: '#ffffff',
    lineHeight: 1.25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 8,
    borderBottomWidth: 1.8,
    borderBottomColor: '#d97706',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '68%',
  },
  logoBox: {
    width: 44,
    height: 44,
    backgroundColor: '#090d16',
    borderRadius: 5,
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
    fontSize: 14,
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
    justifyContent: 'center',
    paddingLeft: 4,
  },
  storeName: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#090d16',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  storeContact: {
    fontSize: 6.5,
    color: '#475569',
    lineHeight: 1.4,
    marginTop: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    flexDirection: 'column',
  },
  badge: {
    backgroundColor: '#090d16',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  badgeText: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#f59e0b',
    letterSpacing: 0.4,
  },
  periodLabel: {
    fontSize: 6.5,
    color: '#64748b',
    marginTop: 1.5,
    textAlign: 'right',
  },
  section: {
    marginBottom: 6,
  },
  sectionHeader: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 2.5,
    paddingHorizontal: 5.5,
    borderLeftWidth: 3,
    borderLeftColor: '#d97706',
    borderRadius: 2,
    marginBottom: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 7.4,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  sectionSub: {
    fontSize: 5.8,
    color: '#64748b',
  },
  card: {
    backgroundColor: '#f8fafc',
    borderWidth: 0.8,
    borderColor: '#e2e8f0',
    borderRadius: 3.5,
    padding: 5,
    paddingHorizontal: 6.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 3.5,
  },
  col3: {
    width: '25%',
    paddingRight: 3,
  },
  col4: {
    width: '33.33%',
    paddingRight: 3,
  },
  col6: {
    width: '50%',
    paddingRight: 3,
  },
  fieldLabel: {
    fontSize: 5.5,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 0.8,
  },
  fieldValue: {
    fontSize: 7.2,
    fontFamily: 'Helvetica',
    color: '#0f172a',
  },
  fieldValueBold: {
    fontSize: 7.8,
    fontFamily: 'Helvetica-Bold',
    color: '#090d16',
  },
  fieldValuePositive: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#047857',
  },
  fieldValueHighlight: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#b45309',
  },
  confidenceBadge: {
    fontSize: 5,
    fontFamily: 'Helvetica-Bold',
    paddingHorizontal: 3.5,
    paddingVertical: 1,
    borderRadius: 2,
    marginTop: 1.5,
    alignSelf: 'flex-start',
  },
  table: {
    width: '100%',
    marginTop: 2,
    marginBottom: 3.5,
    borderWidth: 0.8,
    borderColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#090d16',
    paddingVertical: 3,
    paddingHorizontal: 4.5,
  },
  tableHeaderCell: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#f59e0b',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 2.6,
    paddingHorizontal: 4.5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
  },
  tableRowAlt: {
    backgroundColor: '#f8fafc',
  },
  tableCell: {
    fontSize: 6.4,
    color: '#334155',
  },
  tableCellBold: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  legalBox: {
    backgroundColor: '#fefce8',
    borderWidth: 0.8,
    borderColor: '#fef08a',
    borderRadius: 3.5,
    padding: 5,
    marginTop: 4,
    marginBottom: 5,
  },
  legalTitle: {
    fontSize: 6.2,
    fontFamily: 'Helvetica-Bold',
    color: '#713f12',
    textTransform: 'uppercase',
    marginBottom: 1.5,
  },
  legalText: {
    fontSize: 5.8,
    color: '#713f12',
    lineHeight: 1.25,
  },
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 24,
    right: 24,
    paddingTop: 3.5,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 5.5,
    color: '#94a3b8',
  },
});

interface ExecutiveReportPDFProps {
  overview: OverviewReportData;
  sales: SalesReportData;
  financial: FinancialReportData;
  inventory: InventoryReportData;
  stockMovement?: StockMovementReportData;
  consignments?: ConsignmentReportItem[];
  vehicleResults?: VehicleResultReportItem[];
  dataQualityIssues?: DataQualityIssueItem[];
  settings?: SiteSettings | null;
  logoSrc?: string;
  reportTitle?: string;
  yearLabel?: string;
}

export function ExecutiveReportPDF({
  overview,
  sales,
  financial,
  inventory,
  stockMovement,
  consignments = [],
  vehicleResults = [],
  dataQualityIssues = [],
  settings,
  logoSrc,
  reportTitle = 'RELATÓRIO GERENCIAL ANUAL DE APOIO CONTÁBIL',
  yearLabel,
}: ExecutiveReportPDFProps) {
  const storeName = settings?.site_name || 'AF Motos';
  const rawCnpj = settings?.cnpj || '';
  const formattedCnpj = formatCnpj(rawCnpj) || rawCnpj || '';
  const storePhone = formatPhone(settings?.whatsapp_phone) || settings?.whatsapp_phone || '';
  const storeEmail = settings?.contact_email || '';
  const storeAddress = settings?.address || 'São Paulo, SP';

  const baseYear = yearLabel || overview.dateRange.startDate.substring(0, 4);

  return (
    <Document title={`${reportTitle} — ${storeName}`} author={storeName}>
      <Page size="A4" style={styles.page}>
        {/* ========================================================= */}
        {/* CABEÇALHO PADRÃO AF MOTOS */}
        {/* ========================================================= */}
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
                {formattedCnpj ? `CNPJ: ${formattedCnpj}` : 'Comércio e Intermediação de Motocicletas'}
                {storePhone ? ` • WhatsApp: ${storePhone}` : ''}
              </Text>
              <Text style={styles.storeContact}>
                {storeAddress}
                {storeEmail ? ` • E-mail: ${storeEmail}` : ''}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>ANO-BASE {baseYear}</Text>
            </View>
            <Text style={styles.periodLabel}>
              Período: {formatReportDate(overview.dateRange.startDate)} a{' '}
              {formatReportDate(overview.dateRange.endDate)}
            </Text>
            <Text style={[styles.periodLabel, { fontSize: 5.5, color: '#94a3b8' }]}>
              Emissão: {new Date().toLocaleDateString('pt-BR')} às{' '}
              {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>

        {/* ========================================================= */}
        {/* SEÇÃO I: IDENTIFICAÇÃO E PERÍODO */}
        {/* ========================================================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>I. Identificação da Empresa & Exercício</Text>
            <Text style={styles.sectionSub}>Tipo: Relatório Gerencial Anual de Apoio Contábil</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.grid}>
              <View style={styles.col6}>
                <Text style={styles.fieldLabel}>Nome Empresarial / Fantasia</Text>
                <Text style={styles.fieldValueBold}>{storeName}</Text>
              </View>
              {formattedCnpj && (
                <View style={styles.col6}>
                  <Text style={styles.fieldLabel}>CNPJ Cadastrado</Text>
                  <Text style={styles.fieldValueBold}>{formattedCnpj}</Text>
                </View>
              )}
              <View style={styles.col6}>
                <Text style={styles.fieldLabel}>Endereço do Estabelecimento</Text>
                <Text style={styles.fieldValue}>{storeAddress}</Text>
              </View>
              <View style={styles.col6}>
                <Text style={styles.fieldLabel}>Canais de Contato</Text>
                <Text style={styles.fieldValue}>
                  {storePhone} {storeEmail ? `| ${storeEmail}` : ''}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ========================================================= */}
        {/* SEÇÃO II: RESUMO EXECUTIVO */}
        {/* ========================================================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>II. Resumo Executivo de Desempenho</Text>
            <Text style={styles.sectionSub}>Indicadores consolidados da receita própria da loja</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.grid}>
              <View style={styles.col4}>
                <Text style={styles.fieldLabel}>Receita Operacional (AF Motos)</Text>
                <Text style={styles.fieldValuePositive}>{overview.grossRevenue.formattedValue}</Text>
                <Text style={[styles.confidenceBadge, { backgroundColor: '#dcfce7', color: '#15803d' }]}>
                  Vendas Próprias + Comissões
                </Text>
              </View>

              <View style={styles.col4}>
                <Text style={styles.fieldLabel}>Motos Comercializadas</Text>
                <Text style={styles.fieldValueBold}>{overview.salesCount.formattedValue}</Text>
                <Text style={[styles.confidenceBadge, { backgroundColor: '#f1f5f9', color: '#475569' }]}>
                  {overview.ownedSalesCount || 0} próprias, {overview.consignmentSalesCount || 0} consignadas
                </Text>
              </View>

              <View style={styles.col4}>
                <Text style={styles.fieldLabel}>Volume Intermediado (Terceiros)</Text>
                <Text style={[styles.fieldValueBold, { color: '#0284c7' }]}>
                  {formatCurrencyBRL(overview.thirdPartyTransactedVolume?.value || 0)}
                </Text>
                <Text style={[styles.confidenceBadge, { backgroundColor: '#e0f2fe', color: '#0369a1' }]}>
                  Pago Diretamente ao Dono
                </Text>
              </View>

              <View style={styles.col4}>
                <Text style={styles.fieldLabel}>Despesas Pagas do Período</Text>
                <Text style={[styles.fieldValueBold, { color: '#dc2626' }]}>
                  {formatCurrencyBRL(financial.totalExpensesPaid)}
                </Text>
                <Text style={[styles.confidenceBadge, { backgroundColor: '#dcfce7', color: '#15803d' }]}>
                  Confirmado
                </Text>
              </View>

              <View style={styles.col4}>
                <Text style={styles.fieldLabel}>Despesas Pendentes de Pagamento</Text>
                <Text style={[styles.fieldValueBold, { color: '#ea580c' }]}>
                  {formatCurrencyBRL(financial.totalExpensesPending)}
                </Text>
                <Text style={[styles.confidenceBadge, { backgroundColor: '#fef3c7', color: '#b45309' }]}>
                  Pendente
                </Text>
              </View>

              <View style={styles.col4}>
                <Text style={styles.fieldLabel}>Resultado Operacional Estimado</Text>
                <Text style={[styles.fieldValueBold, { color: '#047857' }]}>
                  {overview.estimatedOperatingResult.formattedValue}
                </Text>
                <Text style={[styles.confidenceBadge, { backgroundColor: '#fef3c7', color: '#b45309' }]}>
                  Estimado (Antes de Impostos)
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ========================================================= */}
        {/* SEÇÃO III: VENDAS & SEGREGAÇÃO (PRÓPRIA VS CONSIGNAÇÃO) */}
        {/* ========================================================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>III. Vendas & Movimentação Comercial</Text>
            <Text style={styles.sectionSub}>Extrato analítico (Estoque próprio vs Consignações/Intermediações)</Text>
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '11%' }]}>Data</Text>
              <Text style={[styles.tableHeaderCell, { width: '27%' }]}>Veículo / Modelo</Text>
              <Text style={[styles.tableHeaderCell, { width: '11%' }]}>Placa</Text>
              <Text style={[styles.tableHeaderCell, { width: '13%' }]}>Operação</Text>
              <Text style={[styles.tableHeaderCell, { width: '11%' }]}>Forma Pgto</Text>
              <Text style={[styles.tableHeaderCell, { width: '13%', textAlign: 'right' }]}>Valor do Veículo</Text>
              <Text style={[styles.tableHeaderCell, { width: '14%', textAlign: 'right' }]}>Receita Loja</Text>
            </View>

            {sales.detailedSalesList.length === 0 ? (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '100%', textAlign: 'center', color: '#94a3b8' }]}>
                  Nenhuma venda concluída registrada no período.
                </Text>
              </View>
            ) : (
              sales.detailedSalesList.slice(0, 12).map((sale, idx) => {
                const isConsignment = sale.ownershipType === 'CONSIGNMENT';
                return (
                  <View key={sale.id} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                    <Text style={[styles.tableCell, { width: '11%' }]}>{formatReportDate(sale.saleDate)}</Text>
                    <Text style={[styles.tableCellBold, { width: '27%' }]}>{sale.motorcycleLabel}</Text>
                    <Text style={[styles.tableCell, { width: '11%' }]}>{sale.motorcyclePlate || '-'}</Text>
                    <Text style={[styles.tableCell, { width: '13%' }]}>
                      {isConsignment ? 'Consignação*' : 'Própria'}
                    </Text>
                    <Text style={[styles.tableCell, { width: '11%' }]}>{sale.paymentMethod || 'Não informado'}</Text>
                    <Text style={[styles.tableCell, { width: '13%', textAlign: 'right', color: '#475569' }]}>
                      {formatCurrencyBRL(sale.salePrice)}
                    </Text>
                    <Text style={[styles.tableCellBold, { width: '14%', textAlign: 'right', color: '#047857' }]}>
                      {formatCurrencyBRL(sale.storeRevenue)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
          <Text style={{ fontSize: 5.4, color: '#64748b', fontStyle: 'italic', marginTop: 1 }}>
            * Regra de Consignação: Nas motos de terceiros, o valor de venda é recebido diretamente pelo proprietário. A receita tributável da AF Motos compreende exclusivamente a comissão de intermediação.
          </Text>
        </View>

        {/* ========================================================= */}
        {/* SEÇÃO IV: RECEBIMENTOS & MEIOS DE PAGAMENTO */}
        {/* ========================================================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>IV. Recebimentos & Meios de Pagamento</Text>
            <Text style={styles.sectionSub}>Composição das formas de recebimento contratadas</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.grid}>
              {overview.paymentDistribution.map((item) => (
                <View key={item.method} style={styles.col3}>
                  <Text style={styles.fieldLabel}>{item.label}</Text>
                  <Text style={styles.fieldValueBold}>{formatCurrencyBRL(item.totalAmount)}</Text>
                  <Text style={[styles.fieldValue, { fontSize: 6, color: '#64748b' }]}>
                    {item.count} {item.count === 1 ? 'venda' : 'vendas'} ({item.percentage.toFixed(1)}%)
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* ========================================================= */}
        {/* SEÇÃO V: DESPESAS & CENTROS DE CUSTO (COM FORMA DE PAGAMENTO) */}
        {/* ========================================================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>V. Despesas & Centros de Custo</Text>
            <Text style={styles.sectionSub}>Rateio entre gastos de oficina e despesas da loja por forma de pagamento</Text>
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '36%' }]}>Categoria de Gasto</Text>
              <Text style={[styles.tableHeaderCell, { width: '26%' }]}>Tipo de Centro de Custo</Text>
              <Text style={[styles.tableHeaderCell, { width: '20%' }]}>Forma de Pagamento</Text>
              <Text style={[styles.tableHeaderCell, { width: '18%', textAlign: 'right' }]}>Total Pago</Text>
            </View>

            {financial.expensesByCategory.slice(0, 8).map((cat, idx) => (
              <View key={cat.categoryId} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCellBold, { width: '36%' }]}>{cat.categoryName}</Text>
                <Text style={[styles.tableCell, { width: '26%' }]}>
                  {cat.expenseType === 'MOTO' ? 'Gastos com Veículos / Oficina' : 'Despesas Gerais da Loja'}
                </Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>
                  {cat.paymentMethodLabel || 'Pix'}
                </Text>
                <Text style={[styles.tableCellBold, { width: '18%', textAlign: 'right' }]}>
                  {formatCurrencyBRL(cat.totalAmount)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* ========================================================= */}
        {/* SEÇÃO VI: ESTOQUE EM 31/12 (SEM FIPE) */}
        {/* ========================================================= */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>VI. Posição de Estoque em Pátio</Text>
            <Text style={styles.sectionSub}>Balanço de motocicletas ativas e valor total anunciado</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.grid}>
              <View style={styles.col4}>
                <Text style={styles.fieldLabel}>Motos Disponíveis em Pátio</Text>
                <Text style={styles.fieldValueBold}>
                  {inventory.activeCount} motos ({inventory.ownedCount} próprias, {inventory.consignmentCount} consignadas)
                </Text>
              </View>
              <View style={styles.col4}>
                <Text style={styles.fieldLabel}>Valor Total Anunciado do Estoque</Text>
                <Text style={styles.fieldValueHighlight}>{formatCurrencyBRL(inventory.totalAnnouncedValue)}</Text>
              </View>
              <View style={styles.col4}>
                <Text style={styles.fieldLabel}>Idade Média do Pátio</Text>
                <Text style={styles.fieldValueBold}>
                  {inventory.averageInventoryAgeDays} dias em estoque
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ========================================================= */}
        {/* SEÇÃO VII: AUDITORIA DE PENDÊNCIAS CADASTRAIS */}
        {/* ========================================================= */}
        {dataQualityIssues.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>VII. Auditoria de Qualidade de Dados Cadastrais</Text>
              <Text style={styles.sectionSub}>Inconsistências identificadas para conferência</Text>
            </View>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderCell, { width: '45%' }]}>Item de Auditoria</Text>
                <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'center' }]}>Ocorrências</Text>
                <Text style={[styles.tableHeaderCell, { width: '40%' }]}>Impacto Contábil / Ação</Text>
              </View>

              {dataQualityIssues.slice(0, 4).map((issue, idx) => (
                <View key={issue.id} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                  <Text style={[styles.tableCellBold, { width: '45%' }]}>{issue.title}</Text>
                  <Text style={[styles.tableCellBold, { width: '15%', textAlign: 'center', color: '#dc2626' }]}>
                    {issue.count} reg.
                  </Text>
                  <Text style={[styles.tableCell, { width: '40%', fontSize: 5.8 }]}>{issue.impact}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ========================================================= */}
        {/* SEÇÃO VIII: DECLARAÇÃO DE USO GERENCIAL & ISENÇÃO TRIBUTÁRIA */}
        {/* ========================================================= */}
        <View style={styles.legalBox}>
          <Text style={styles.legalTitle}>Declaração de Uso Gerencial & Limitação Fiscal</Text>
          <Text style={styles.legalText}>
            Este relatório é um demonstrativo gerencial de apoio, elaborado a partir dos dados cadastrados no
            sistema AF Motos. Os valores devem ser conferidos com notas fiscais, contratos, comprovantes de
            pagamento e demais documentos. O sistema não apura impostos (DAS/Simples Nacional/IRPJ/CSLL/ICMS) nem
            substitui a escrituração contábil, livro caixa ou a validação contábil do contador responsável.
          </Text>
        </View>

        {/* ========================================================= */}
        {/* RODAPÉ ELETRÔNICO (SEM ÁREAS DE ASSINATURA) */}
        {/* ========================================================= */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Relatório gerado eletronicamente pelo sistema AF Motos em {new Date().toLocaleDateString('pt-BR')} às{' '}
            {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.
          </Text>
          <Text style={styles.footerText}>
            Documento gerencial de apoio contábil • Dados sujeitos à validação do contador
          </Text>
        </View>
      </Page>
    </Document>
  );
}
