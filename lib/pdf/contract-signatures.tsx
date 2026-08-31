import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  signatureContainer: {
    marginTop: 14,
    marginBottom: 8,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  witnessRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  signatureBox: {
    width: '45%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#475569',
    marginBottom: 3,
  },
  signatureName: {
    fontSize: 7.8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    textAlign: 'center',
  },
  signatureRole: {
    fontSize: 6.2,
    color: '#64748b',
    textAlign: 'center',
  },
  witnessBox: {
    width: '45%',
    alignItems: 'center',
  },
  witnessLine: {
    width: '90%',
    borderTopWidth: 0.8,
    borderTopColor: '#94a3b8',
    marginBottom: 2,
  },
  witnessTitle: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: '#475569',
    textAlign: 'center',
  },
  witnessDoc: {
    fontSize: 6,
    color: '#64748b',
    textAlign: 'center',
  },
});

interface ContractSignaturesProps {
  buyerName: string;
  buyerRole?: string;
  buyerDocument?: string | null;
  sellerName: string;
  sellerRole?: string;
  sellerDocument?: string | null;
  showWitnesses?: boolean;
  witness1Name?: string | null;
  witness1Doc?: string | null;
  witness2Name?: string | null;
  witness2Doc?: string | null;
}

export function ContractSignatures({
  buyerName,
  buyerRole = 'AF Motos • Compradora / Representante Legal',
  buyerDocument,
  sellerName,
  sellerRole = 'Vendedor / Proprietário',
  sellerDocument,
  showWitnesses = true,
  witness1Name = '1ª Testemunha',
  witness1Doc = 'CPF: ___________________',
  witness2Name = '2ª Testemunha',
  witness2Doc = 'CPF: ___________________',
}: ContractSignaturesProps) {
  return (
    <View style={styles.signatureContainer}>
      <View style={styles.signatureRow}>
        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>{buyerName.toUpperCase()}</Text>
          <Text style={styles.signatureRole}>{buyerRole}</Text>
          {buyerDocument ? <Text style={styles.signatureRole}>{buyerDocument}</Text> : null}
        </View>

        <View style={styles.signatureBox}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureName}>{sellerName.toUpperCase()}</Text>
          <Text style={styles.signatureRole}>{sellerRole}</Text>
          {sellerDocument ? <Text style={styles.signatureRole}>{sellerDocument}</Text> : null}
        </View>
      </View>

      {showWitnesses ? (
        <View style={styles.witnessRow}>
          <View style={styles.witnessBox}>
            <View style={styles.witnessLine} />
            <Text style={styles.witnessTitle}>{witness1Name}</Text>
            <Text style={styles.witnessDoc}>{witness1Doc}</Text>
          </View>

          <View style={styles.witnessBox}>
            <View style={styles.witnessLine} />
            <Text style={styles.witnessTitle}>{witness2Name}</Text>
            <Text style={styles.witnessDoc}>{witness2Doc}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}
