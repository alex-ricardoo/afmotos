import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  sectionHeader: {
    backgroundColor: '#f8fafc',
    borderLeftWidth: 4,
    borderLeftColor: '#d97706',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 4,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: '#0f172a',
  },
  sectionSub: {
    fontSize: 6.5,
    color: '#64748b',
    fontFamily: 'Helvetica',
  },
});

interface ContractSectionHeaderProps {
  title: string;
  subtitle?: string | null;
}

export function ContractSectionHeader({ title, subtitle }: ContractSectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
    </View>
  );
}
