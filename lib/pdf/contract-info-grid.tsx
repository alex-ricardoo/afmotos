import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  infoCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    padding: 5,
    minHeight: 38,
  },
  label: {
    fontSize: 6,
    fontFamily: 'Helvetica-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: 1.5,
  },
  value: {
    fontSize: 7.8,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
  },
  subValue: {
    fontSize: 6.5,
    color: '#475569',
    marginTop: 1,
  },
});

export interface InfoCardItem {
  label: string;
  value: string;
  subValue?: string | null;
  width?: '32%' | '49%' | '66%' | '100%' | string;
}

interface ContractInfoGridProps {
  items: InfoCardItem[];
}

export function ContractInfoGrid({ items }: ContractInfoGridProps) {
  return (
    <View style={styles.summaryGrid}>
      {items.map((item, idx) => (
        <View key={idx} style={[styles.infoCard, { width: (item.width || '32%') as any }]}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{item.value || 'Não informado'}</Text>
          {item.subValue ? <Text style={styles.subValue}>{item.subValue}</Text> : null}
        </View>
      ))}
    </View>
  );
}
