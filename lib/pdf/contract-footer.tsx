import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: '#64748b',
    fontSize: 6.2,
    marginTop: 6,
  },
  footerText: {
    color: '#64748b',
    fontSize: 6.2,
  },
});

interface ContractFooterProps {
  locationAndDate: string;
  documentNumber: string;
  pageNumber?: number;
  totalPages?: number;
}

export function ContractFooter({
  locationAndDate,
  documentNumber,
  pageNumber,
  totalPages,
}: ContractFooterProps) {
  return (
    <View style={styles.footer}>
      <Text style={styles.footerText}>Local e data: {locationAndDate}</Text>
      <Text style={styles.footerText}>Documento interno: {documentNumber}</Text>
      {pageNumber && totalPages ? (
        <Text style={styles.footerText}>
          Página {pageNumber} de {totalPages}
        </Text>
      ) : null}
    </View>
  );
}
