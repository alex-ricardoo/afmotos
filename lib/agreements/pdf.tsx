import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ContractCompanyHeader } from '@/lib/pdf/contract-company-header';
import { ContractSectionHeader } from '@/lib/pdf/contract-section-header';
import { ContractInfoGrid } from '@/lib/pdf/contract-info-grid';
import { ContractSignatures } from '@/lib/pdf/contract-signatures';
import { ContractFooter } from '@/lib/pdf/contract-footer';

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
  page: {
    padding: 26,
    paddingTop: 22,
    paddingBottom: 22,
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  section: {
    marginBottom: 8,
  },
  legalBox: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 6,
    paddingHorizontal: 7,
  },
  paragraph: {
    fontSize: 6.3,
    color: '#334155',
    textAlign: 'justify',
    lineHeight: 1.38,
    marginBottom: 3.5,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 2,
  },
  totalBox: {
    borderWidth: 1,
    borderColor: '#fbbf24',
    backgroundColor: '#fff7ed',
    borderRadius: 5,
    padding: 6,
    width: '32%',
  },
  totalLabel: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#9a5b00',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 10.5,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
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
  const formattedAgreementNumber = saleId.slice(0, 10).toUpperCase();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* CABEÇALHO PADRÃO AF MOTOS */}
        <ContractCompanyHeader
          storeName={storeName}
          logoSrc={logoSrc}
          address={address}
          phone={phone}
          email={email}
          cnpj={cnpj}
          vehiclePlate={vehiclePlate}
          documentIdentifier={formattedAgreementNumber}
          documentDate={agreementDate}
          documentTypeLabel="ACORDO DE VENDA"
        />

        {/* 1. IDENTIFICAÇÃO DO VEÍCULO E DAS PARTES */}
        <View style={styles.section}>
          <ContractSectionHeader title="1. Identificação da Motocicleta e das Partes" />
          <ContractInfoGrid
            items={[
              // PRIMEIRO: INFORMAÇÕES DO VEÍCULO
              {
                label: 'Marca / Modelo / Versão',
                value: `${vehicleBrand || ''} ${vehicleModel || ''} ${vehicleVersion || ''}`.trim() || 'Não informado',
                width: '40%',
              },
              {
                label: 'Ano Fab. / Mod.',
                value: `${vehicleManufactureYear || vehicleYear || '-'} / ${vehicleModelYear || vehicleYear || '-'}`,
                width: '20%',
              },
              {
                label: 'Placa',
                value: vehiclePlate || 'Não informada',
                width: '18%',
              },
              {
                label: 'Cor / Combustível',
                value: `${vehicleColor || 'Não inf.'} • ${vehicleFuel || 'Flex'}`,
                width: '18%',
              },
              {
                label: 'Chassi (VIN)',
                value: vehicleChassi || 'Não informado',
                width: '49%',
              },
              {
                label: 'Renavam',
                value: vehicleRenavam || 'Não informado',
                subValue: vehicleMileage ? `Km: ${vehicleMileage.toLocaleString('pt-BR')} km` : undefined,
                width: '49%',
              },

              // ABAIXO: LOJA NA ESQUERDA, PROPRIETÁRIO NA DIREITA
              {
                label: 'Intermediadora (Loja)',
                value: storeName,
                subValue: `${cnpj ? `CNPJ: ${cnpj}\n` : ''}End.: ${address}\nWhatsApp: ${phone}${email ? ` • E-mail: ${email}` : ''}`,
                width: '49%',
              },
              {
                label: 'Vendedor (Proprietário)',
                value: sellerName,
                subValue: `CPF: ${formatCpf(sellerDocument)}${sellerRg ? ` • RG: ${sellerRg}` : ''}\nEnd.: ${sellerAddress}\nTel: ${formatPhone(sellerPhone)}`,
                width: '49%',
              },
            ]}
          />
        </View>

        {/* 2. VALORES E CONDIÇÕES DE COMISSÃO */}
        <View style={styles.section}>
          <ContractSectionHeader title="2. Condições Comerciais e Comissão" />
          <View style={styles.totalsRow}>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Base de Cálculo (Anúncio)</Text>
              <Text style={styles.totalValue}>{currency(expectedSaleValue)}</Text>
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Comissão Acordada</Text>
              <Text style={styles.totalValue}>{Number(commissionPercentage).toFixed(2)}%</Text>
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Comissão Projetada</Text>
              <Text style={styles.totalValue}>{currency(commissionValue)}</Text>
            </View>
          </View>
        </View>

        {/* 3. CLÁUSULAS E TERMOS JURÍDICOS COM DESTAQUES EM NEGRITO */}
        <View style={styles.section}>
          <ContractSectionHeader title="3. Cláusulas e Termos Jurídicos de Intermediação" />
          <View style={styles.legalBox}>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.1. Intermediação: </Text>
              O <Text style={styles.bold}>PROPRIETÁRIO</Text> autoriza expressamente a <Text style={styles.bold}>{storeName}</Text> a divulgar, anunciar, apresentar e intermediar a negociação da motocicleta descrita neste instrumento, <Text style={styles.bold}>sem transferência de propriedade ou posse</Text>, atuando a loja estritamente como <Text style={styles.bold}>intermediadora e aproximação de partes</Text> entre o proprietário e compradores.
            </Text>

            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.2. Comissão e Pagamento: </Text>
              A comissão devida à loja será de <Text style={styles.bold}>{Number(commissionPercentage).toFixed(2)}%</Text> sobre o <Text style={styles.bold}>valor total efetivamente negociado</Text> na venda do veículo (estimativa calculada em <Text style={styles.bold}>{currency(commissionValue)}</Text> sobre o valor anunciado de <Text style={styles.bold}>{currency(expectedSaleValue)}</Text>). O pagamento da comissão é devido no <Text style={styles.bold}>ato do recebimento do preço da venda</Text> ou assinatura do instrumento definitivo, mediante quitação via <Text style={styles.bold}>PIX ou transferência bancária</Text>.
            </Text>

            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.3. Cliente Apresentado: </Text>
              Considera-se <Text style={styles.bold}>Cliente Apresentado</Text> qualquer pessoa que tenha tomado conhecimento do veículo, fotos, especificações, localização ou contato do proprietário por intermédio dos canais da <Text style={styles.bold}>{storeName}</Text> (loja física, site, WhatsApp, Instagram, portais de classificados ou anúncios digitais).
            </Text>

            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.4. Vedação ao Desvio de Negócio: </Text>
              O <Text style={styles.bold}>PROPRIETÁRIO</Text> compromete-se a <Text style={styles.bold}>não ocultar, desviar ou concluir diretamente a venda</Text> com Cliente Apresentado com a intenção de afastar a comissão devida. A conclusão direta com cliente apresentado <Text style={styles.bold}>não extingue a obrigação do pagamento integral da comissão</Text> fixada neste instrumento. O contrato não é exclusivo, podendo o proprietário anunciar por outros meios sem clientela concorrente.
            </Text>

            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.5. Responsabilidade Civil e Documental: </Text>
              O <Text style={styles.bold}>PROPRIETÁRIO</Text> declara e garante a <Text style={styles.bold}>legitimidade da propriedade</Text>, procedência do veículo e ausência de restrições ou gravames impeditivos, responsabilizando-se civil e criminalmente por <Text style={styles.bold}>débitos anteriores, multas, vistorias cautelares, quitação de financiamento e transferência no DETRAN (ATPV-e)</Text>.
            </Text>

            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.6. Atraso e Encargos Moratórios: </Text>
              Em caso de inadimplemento ou atraso no repasse da comissão após a concretização da venda, incidirão <Text style={styles.bold}>multa moratória de 2%</Text>, <Text style={styles.bold}>juros de mora de 1% ao mês</Text> pro rata die e correção monetária pelo <Text style={styles.bold}>IPCA</Text>, além das despesas comprovadas de cobrança.
            </Text>

            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.7. Autorização de Imagem e LGPD: </Text>
              O <Text style={styles.bold}>PROPRIETÁRIO</Text> autoriza a produção e veiculação de fotos e vídeos da motocicleta para fins comerciais e documentais, nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018).
            </Text>
          </View>
        </View>

        {/* ASSINATURAS */}
        <ContractSignatures
          buyerName={storeName}
          buyerRole="AF Motos • Intermediadora / Representante Legal"
          buyerDocument={cnpj ? `CNPJ: ${cnpj}` : undefined}
          sellerName={sellerName}
          sellerRole="Vendedor / Proprietário"
          sellerDocument={`CPF: ${formatCpf(sellerDocument)}`}
          showWitnesses={false}
        />

        {/* RODAPÉ */}
        <ContractFooter
          locationAndDate={`${address} • ${agreementDate}`}
          documentNumber={formattedAgreementNumber}
        />
      </Page>
    </Document>
  );
}
