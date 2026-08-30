import {
  SalesReportData,
  FinancialReportData,
  InventoryReportData,
  StockMovementReportData,
  ConsignmentReportItem,
  AnnualAccountantReportData,
} from './types';
import { formatReportDate } from './formatters';

const BOM = '\uFEFF';

function formatExcelNumber(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0,00';
  return val.toFixed(2).replace('.', ',');
}

/**
 * 1. CSV de Vendas Detalhadas
 */
export function generateSalesCSV(
  data: SalesReportData,
  includeSensitiveCadastralData = false,
): string {
  const headers = [
    'Data da Venda',
    'Motocicleta',
    'Placa',
    'Tipo de Operação',
    'Comprador',
    'Telefone',
    'Documento / CPF',
    'Forma de Pagamento',
    'Valor do Veículo (R$)',
    'Receita AF Motos (R$)',
    'Comissão AF Motos (R$)',
    'Repasse ao Proprietário (R$)',
    'Valor de Entrada (R$)',
    'Valor Financiado (R$)',
    'Valor de Troca (R$)',
    'Nº Recibo',
    'Status da Venda',
  ];

  const rows = data.detailedSalesList.map((s) => [
    formatReportDate(s.saleDate),
    s.motorcycleLabel,
    s.motorcyclePlate || 'Sem Placa',
    s.ownershipType === 'CONSIGNMENT' ? 'Consignação (Terceiro)' : 'Estoque Próprio',
    s.buyerName || 'Cliente Balcão',
    includeSensitiveCadastralData ? s.buyerPhone || '-' : '***',
    includeSensitiveCadastralData ? s.buyerDocument || '-' : '***',
    s.paymentMethod || 'Não informado',
    formatExcelNumber(s.salePrice),
    formatExcelNumber(s.storeRevenue),
    formatExcelNumber(s.commissionValue),
    formatExcelNumber(s.payoutToOwner),
    formatExcelNumber(s.entryAmount),
    formatExcelNumber(s.financedAmount),
    formatExcelNumber(s.tradeAmount),
    s.receiptNumber || 'Pendente',
    s.paymentStatus || 'PAID',
  ]);

  const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  return BOM + csvContent;
}

/**
 * 2. CSV de Despesas Detalhadas
 */
export function generateExpensesCSV(data: FinancialReportData): string {
  const headers = [
    'Categoria / Centro de Custo',
    'Tipo de Despesa',
    'Qtd Lançamentos',
    'Total Gasto Pago (R$)',
    '% do Total',
  ];

  const rows = data.expensesByCategory.map((c) => [
    c.categoryName,
    c.expenseType === 'MOTO' ? 'Gastos com Veículos / Oficina' : 'Despesas Gerais da Loja',
    c.count.toString(),
    formatExcelNumber(c.totalAmount),
    c.percentageOfTotal.toFixed(2).replace('.', ',') + '%',
  ]);

  const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  return BOM + csvContent;
}

/**
 * 3. CSV de Estoque Atual
 */
export function generateInventoryCSV(data: InventoryReportData): string {
  const headers = [
    'Código',
    'Motocicleta',
    'Ano/Modelo',
    'Tipo de Estoque',
    'Dias em Pátio',
    'Preço Anunciado (R$)',
    'Preço Tabela FIPE (R$)',
    'Status',
    'Ação Sugerida',
  ];

  const rows = data.motosRequiringAttention.map((m) => [
    m.internalCode,
    `${m.brand} ${m.model}`,
    m.yearModel.toString(),
    m.ownershipType === 'CONSIGNMENT' ? 'Consignação' : 'Própria',
    m.daysInStock.toString(),
    formatExcelNumber(m.price),
    formatExcelNumber(m.fipePrice),
    m.status,
    m.suggestedAction,
  ]);

  const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  return BOM + csvContent;
}

/**
 * 4. CSV de Movimentação de Estoque (Entradas e Saídas)
 */
export function generateStockMovementCSV(
  stock: StockMovementReportData,
  dateRange: { startDate: string; endDate: string },
): string {
  const lines = [
    `AF MOTOS — DEMONSTRATIVO DE MOVIMENTAÇÃO DE ESTOQUE`,
    `Período: ${stock ? dateRange.startDate : ''} a ${stock ? dateRange.endDate : ''}`,
    `Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`,
    `Aviso: Documento de apoio gerencial. Conferência obrigatória pelo contador responsável.`,
    ``,
    `Indicador de Movimentação;Quantidade;Valor Total Anunciado (R$)`,
    `Estoque no Início do Período;${stock.initialStockCount};${formatExcelNumber(stock.initialStockValue)}`,
    `Entradas de Motos Próprias;${stock.entriesOwnedCount};-`,
    `Entradas de Motos em Consignação;${stock.entriesConsignmentCount};-`,
    `Saídas por Venda Realizada;${stock.salesCount};-`,
    `Estoque Final em Pátio;${stock.finalStockCount};${formatExcelNumber(stock.finalStockValue)}`,
  ];

  return BOM + lines.join('\r\n');
}

/**
 * 5. CSV de Comissões e Consignações
 */
export function generateConsignmentsCSV(consignments: ConsignmentReportItem[]): string {
  const headers = [
    'Motocicleta',
    'Placa',
    'Proprietário',
    'Valor Pedido (R$)',
    'Valor Anunciado (R$)',
    'Tipo de Comissão',
    'Taxa / %',
    'Comissão Prevista (R$)',
    'Repasse ao Proprietário (R$)',
    'Status do Contrato',
    'Data de Início',
    'Data de Término',
  ];

  const rows = consignments.map((c) => [
    c.motorcycleLabel,
    c.plate || 'Sem Placa',
    c.ownerName || 'Não informado',
    formatExcelNumber(c.askingPrice),
    formatExcelNumber(c.advertisedPrice),
    c.commissionType === 'percentage' ? 'Percentual (%)' : 'Valor Fixo (R$)',
    c.commissionValue.toString().replace('.', ','),
    formatExcelNumber(c.commissionAmount),
    formatExcelNumber(c.payoutToOwner),
    c.contractStatus,
    c.startDate ? formatReportDate(c.startDate) : '-',
    c.endDate ? formatReportDate(c.endDate) : '-',
  ]);

  const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
  return BOM + csvContent;
}

/**
 * 6. CSV Consolidado Gerencial Completo
 */
export function generateConsolidatedCSV(
  sales: SalesReportData,
  financial: FinancialReportData,
  inventory: InventoryReportData,
): string {
  const lines = [
    `AF MOTOS — RELATÓRIO GERENCIAL CONSOLIDADO`,
    `Período: ${sales.dateRange.startDate} a ${sales.dateRange.endDate}`,
    `Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}`,
    `Aviso: Documento de apoio gerencial. Conferência obrigatória pelo contador responsável.`,
    ``,
    `RESUMO EXECUTIVO`,
    `Indicador;Valor`,
    `Faturamento Bruto Registrado;R$ ${formatExcelNumber(sales.totalSalesValue)}`,
    `Motos Comercializadas;${sales.salesCount}`,
    `Ticket Médio;R$ ${formatExcelNumber(sales.averageTicket)}`,
    `Despesas Pagas do Período;R$ ${formatExcelNumber(financial.totalExpensesPaid)}`,
    `Despesas Pendentes de Pagamento;R$ ${formatExcelNumber(financial.totalExpensesPending)}`,
    `Gastos com Veículos (Oficina/Peças);R$ ${formatExcelNumber(financial.expensesByVehicle)}`,
    `Gastos da Loja (Operacional);R$ ${formatExcelNumber(financial.expensesByStore)}`,
    `Resultado Operacional Estimado;R$ ${formatExcelNumber(financial.estimatedOperatingResult)}`,
    `Motos em Estoque Ativo;${inventory.activeCount}`,
    `Motos Próprias em Estoque;${inventory.ownedCount}`,
    `Motos Consignadas em Estoque;${inventory.consignmentCount}`,
    `Valor Total Anunciado do Estoque;R$ ${formatExcelNumber(inventory.totalAnnouncedValue)}`,
    `Valor FIPE Estimado do Estoque;R$ ${formatExcelNumber(inventory.totalFipeEstimatedValue)}`,
    ``,
    `DESPESAS POR CATEGORIA`,
    `Categoria;Tipo;Qtd;Total (R$);%`,
    ...financial.expensesByCategory.map(
      (c) =>
        `${c.categoryName};${c.expenseType};${c.count};${formatExcelNumber(c.totalAmount)};${c.percentageOfTotal.toFixed(1)}%`,
    ),
  ];

  return BOM + lines.join('\r\n');
}
