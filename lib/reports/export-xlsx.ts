import {
  SalesReportData,
  FinancialReportData,
  InventoryReportData,
  CustomersReportData,
  StockMovementReportData,
  ConsignmentReportItem,
} from './types';
import { formatReportDate } from './formatters';

function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Gera uma pasta de trabalho Microsoft Excel XML (Multi-Sheet Workbook)
 * Compatível nativamente com Excel, LibreOffice e Google Sheets.
 */
export function generateExcelWorkbookXML(
  sales: SalesReportData,
  financial: FinancialReportData,
  inventory: InventoryReportData,
  customers: CustomersReportData,
  stockMovement?: StockMovementReportData,
  consignments?: ConsignmentReportItem[],
  includeSensitiveCadastralData = false,
): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#1E293B" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="14" ss:Color="#0F172A" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="R$ #,##0.00"/>
  </Style>
  <Style ss:ID="Date">
   <Alignment ss:Horizontal="Center"/>
  </Style>
 </Styles>

 <!-- ABA 1: RESUMO EXECUTIVO -->
 <Worksheet ss:Name="Resumo Executivo">
  <Table>
   <Column ss:Width="240"/>
   <Column ss:Width="160"/>
   <Row ss:Height="25">
    <Cell ss:StyleID="Title"><Data ss:Type="String">AF MOTOS — RESUMO GERENCIAL ANUAL</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Período: ${sales.dateRange.startDate} a ${sales.dateRange.endDate}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Data de Geração: ${new Date().toLocaleDateString('pt-BR')}</Data></Cell>
   </Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Indicador Gerencial</Data></Cell>
    <Cell><Data ss:Type="String">Valor</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Faturamento Bruto Registrado</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${sales.totalSalesValue}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Quantidade de Motos Vendidas</Data></Cell>
    <Cell><Data ss:Type="Number">${sales.salesCount}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Ticket Médio por Venda</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${sales.averageTicket}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Despesas Pagas do Período</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${financial.totalExpensesPaid}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Despesas Pendentes de Pagamento</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${financial.totalExpensesPending}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Gastos com Veículos (Oficina/Peças)</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${financial.expensesByVehicle}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Gastos da Loja (Operacional)</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${financial.expensesByStore}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Resultado Operacional Estimado</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${financial.estimatedOperatingResult}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Motos em Estoque Ativo</Data></Cell>
    <Cell><Data ss:Type="Number">${inventory.activeCount}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Valor Total Anunciado do Estoque</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${inventory.totalAnnouncedValue}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Valor FIPE Estimado do Estoque</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${inventory.totalFipeEstimatedValue}</Data></Cell>
   </Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   <Row>
    <Cell><Data ss:Type="String">Aviso: Documento de apoio gerencial. A conferência tributária é de responsabilidade do contador.</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- ABA 2: VENDAS DETALHADAS -->
 <Worksheet ss:Name="Vendas">
  <Table>
   <Column ss:Width="90"/>
   <Column ss:Width="160"/>
   <Column ss:Width="90"/>
   <Column ss:Width="110"/>
   <Column ss:Width="160"/>
   <Column ss:Width="110"/>
   <Column ss:Width="110"/>
   <Column ss:Width="90"/>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Data</Data></Cell>
    <Cell><Data ss:Type="String">Motocicleta</Data></Cell>
    <Cell><Data ss:Type="String">Placa</Data></Cell>
    <Cell><Data ss:Type="String">Tipo Estoque</Data></Cell>
    <Cell><Data ss:Type="String">Comprador</Data></Cell>
    <Cell><Data ss:Type="String">Forma Pgto</Data></Cell>
    <Cell><Data ss:Type="String">Valor Venda (R$)</Data></Cell>
    <Cell><Data ss:Type="String">Nº Recibo</Data></Cell>
   </Row>
   ${sales.detailedSalesList
     .map(
       (s) => `
   <Row>
    <Cell ss:StyleID="Date"><Data ss:Type="String">${escapeXml(formatReportDate(s.saleDate))}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(s.motorcycleLabel)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(s.motorcyclePlate || '-')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(s.ownershipType === 'CONSIGNMENT' ? 'Consignação' : 'Própria')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(s.buyerName || 'Cliente Balcão')}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(s.paymentMethod || 'Não informado')}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${s.salePrice}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(s.receiptNumber || 'Pendente')}</Data></Cell>
   </Row>`,
     )
     .join('')}
  </Table>
 </Worksheet>

 <!-- ABA 3: DESPESAS -->
 <Worksheet ss:Name="Despesas">
  <Table>
   <Column ss:Width="180"/>
   <Column ss:Width="140"/>
   <Column ss:Width="100"/>
   <Column ss:Width="120"/>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Categoria</Data></Cell>
    <Cell><Data ss:Type="String">Tipo</Data></Cell>
    <Cell><Data ss:Type="String">Qtd Lançamentos</Data></Cell>
    <Cell><Data ss:Type="String">Total Gasto (R$)</Data></Cell>
   </Row>
   ${financial.expensesByCategory
     .map(
       (c) => `
   <Row>
    <Cell><Data ss:Type="String">${escapeXml(c.categoryName)}</Data></Cell>
    <Cell><Data ss:Type="String">${escapeXml(c.expenseType === 'MOTO' ? 'Gastos com Veículos / Oficina' : 'Despesas Gerais da Loja')}</Data></Cell>
    <Cell><Data ss:Type="Number">${c.count}</Data></Cell>
    <Cell ss:StyleID="Currency"><Data ss:Type="Number">${c.totalAmount}</Data></Cell>
   </Row>`,
     )
     .join('')}
  </Table>
 </Worksheet>
</Workbook>`;

  return xml;
}
