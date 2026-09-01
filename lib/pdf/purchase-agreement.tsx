import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { PurchaseAgreementSnapshot } from '@/types/purchase-agreement';
import { ContractCompanyHeader } from './contract-company-header';
import { ContractSectionHeader } from './contract-section-header';
import { ContractInfoGrid } from './contract-info-grid';
import { ContractSignatures } from './contract-signatures';
import { ContractFooter } from './contract-footer';
import { formatCurrencyBRL, formatCpfOrCnpj, formatPhoneNumber } from '@/lib/purchase-agreements/formatters';

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
    lineHeight: 1.35,
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
    marginBottom: 4,
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
  dischargeAlert: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 4,
    padding: 5,
    marginTop: 4,
  },
  dischargeText: {
    fontSize: 6.4,
    color: '#166534',
    lineHeight: 1.35,
    fontFamily: 'Helvetica-Bold',
  },
});

interface MotorcyclePurchaseAgreementPDFProps {
  snapshot: PurchaseAgreementSnapshot;
  agreementNumber: string;
  logoSrc?: string;
}

export function MotorcyclePurchaseAgreementPDF({
  snapshot,
  agreementNumber,
  logoSrc,
}: MotorcyclePurchaseAgreementPDFProps) {
  const { store, seller, motorcycle, commercial_terms, delivery_and_possession, transfer_and_compliance, signatures } = snapshot;

  const vehiclePlate = motorcycle.license_plate;
  const isPaidFull = commercial_terms.payment_status === 'PAID_FULL';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* CABEÇALHO INSTITUCIONAL */}
        <ContractCompanyHeader
          storeName={store.name}
          logoSrc={logoSrc}
          address={store.address}
          phone={store.phone}
          email={store.email}
          cnpj={store.cnpj}
          vehiclePlate={vehiclePlate}
          documentIdentifier={agreementNumber}
          documentDate={new Date(snapshot.generated_at).toLocaleDateString('pt-BR')}
          documentTypeLabel="CONTRATO DE COMPRA"
        />

        {/* 1. IDENTIFICAÇÃO DAS PARTES E DO VEÍCULO */}
        <View style={styles.section}>
          <ContractSectionHeader title="1. Identificação das Partes e da Motocicleta" />
          <ContractInfoGrid
            items={[
              { label: 'Compradora (Loja)', value: store.name, subValue: store.cnpj ? `CNPJ: ${store.cnpj}` : undefined, width: '49%' },
              { label: 'Vendedor (Proprietário)', value: seller.full_name, subValue: `CPF/CNPJ: ${formatCpfOrCnpj(seller.document)}`, width: '49%' },
              { label: 'Endereço do Vendedor', value: seller.address, width: '66%' },
              { label: 'Telefone / WhatsApp', value: formatPhoneNumber(seller.phone), subValue: seller.email || undefined, width: '32%' },
              { label: 'Marca / Modelo / Versão', value: `${motorcycle.brand} ${motorcycle.model} ${motorcycle.version || ''}`.trim(), width: '40%' },
              { label: 'Ano Fab. / Mod.', value: `${motorcycle.year_manufacture} / ${motorcycle.year_model}`, width: '20%' },
              { label: 'Placa', value: motorcycle.license_plate || 'Não informada', width: '18%' },
              { label: 'Cor / Combustível', value: `${motorcycle.color || 'Não inf.'} • ${motorcycle.fuel || 'Flex'}`, width: '18%' },
              { label: 'Chassi (VIN)', value: motorcycle.chassi || 'Não informado', width: '49%' },
              { label: 'Renavam', value: motorcycle.renavam || 'Não informado', subValue: motorcycle.engine_number ? `Motor: ${motorcycle.engine_number}` : undefined, width: '49%' },
            ]}
          />
        </View>

        {/* 2. VALORES, PAGAMENTO E QUITAÇÃO */}
        <View style={styles.section}>
          <ContractSectionHeader title="2. Condições Comerciais, Pagamento e Quitação" />
          <View style={styles.totalsRow}>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Valor de Aquisição</Text>
              <Text style={styles.totalValue}>{formatCurrencyBRL(commercial_terms.purchase_amount)}</Text>
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Forma de Pagamento</Text>
              <Text style={styles.totalValue}>{commercial_terms.payment_method}</Text>
            </View>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Situação do Pagamento</Text>
              <Text style={[styles.totalValue, { color: isPaidFull ? '#15803d' : '#b45309' }]}>
                {commercial_terms.payment_status_label}
              </Text>
            </View>
          </View>

          {isPaidFull ? (
            <View style={styles.dischargeAlert}>
              <Text style={styles.dischargeText}>
                {commercial_terms.discharge_statement}
              </Text>
            </View>
          ) : null}
        </View>

        {/* 3. TERMOS JURÍDICOS, POSSE, TRANSFERÊNCIA E DECLARAÇÕES */}
        <View style={styles.section}>
          <ContractSectionHeader title="3. Cláusulas e Termos Jurídicos de Aquisição" />
          <View style={styles.legalBox}>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.1. Objeto e Tradição:</Text> O VENDEDOR transfere à COMPRADORA ({store.name}) a posse direta, guarda e titularidade da motocicleta descrita neste instrumento em {new Date(delivery_and_possession.delivery_datetime).toLocaleString('pt-BR')}, com hodômetro em {delivery_and_possession.delivery_km} km, {delivery_and_possession.keys_count} chave(s){delivery_and_possession.has_manual ? ', manual do proprietário' : ''}{delivery_and_possession.accessories_delivered.length ? `, acessórios (${delivery_and_possession.accessories_delivered.join(', ')})` : ''}.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.2. Responsabilidade por Débitos e Infrações Anteriores:</Text> O VENDEDOR declara expressamente e responde integral e exclusivamente por todas as multas de trânsito, autuações, impostos (IPVA), taxas de licenciamento e quaisquer débitos ou encargos cujo fato gerador seja anterior à data e horário da entrega física documentada, obrigando-se ao imediato ressarcimento à COMPRADORA caso acionada.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.3. Declarações de Titularidade e Evicção (Art. 447 CC):</Text> O VENDEDOR declara sob as penas da lei ser o legítimo proprietário do bem, gozar de plena capacidade civil e que o veículo encontrasse livre de quaisquer gravames financeiros, alienações não declaradas, restrições judiciais (Renajud), roubo/furto, sinistro grave, leilão ou adulteração de chassi e motor, respondendo pelos riscos de evicção e vícios redibitórios ocultos.
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.4. Transferência Administrativa (Art. 123 e 134 CTB):</Text> As partes obrigam-se a assinar e cooperar com todos os atos necessários (inclusive ATPV-e digital ou física) para a formalização da transferência de propriedade perante o DETRAN no prazo legal de até {transfer_and_compliance.transfer_deadline_days} dias ({new Date(transfer_and_compliance.transfer_deadline_date).toLocaleDateString('pt-BR')}).
            </Text>
            <Text style={styles.paragraph}>
              <Text style={styles.bold}>3.5. Posse e Guarda pela Loja:</Text> A partir da entrega física, a COMPRADORA assume a guarda, conservação e responsabilidade pelos atos e circulação da motocicleta, observadas as exigências legais e a efetiva comunicação de venda.
            </Text>
          </View>
        </View>

        {/* 4. ASSINATURAS */}
        <ContractSignatures
          buyerName={signatures.buyer_name || store.name}
          buyerRole={signatures.buyer_role}
          buyerDocument={signatures.buyer_document ? `CNPJ: ${signatures.buyer_document}` : null}
          sellerName={signatures.seller_name || seller.full_name}
          sellerRole={signatures.seller_role}
          sellerDocument={`CPF/CNPJ: ${formatCpfOrCnpj(signatures.seller_document || seller.document)}`}
          showWitnesses={false}
        />

        {/* 5. RODAPÉ */}
        <ContractFooter
          locationAndDate={`${store.city || 'Carpina'}/${store.state || 'PE'} • ${new Date(snapshot.generated_at).toLocaleDateString('pt-BR')}`}
          documentNumber={agreementNumber}
        />
      </Page>
    </Document>
  );
}
