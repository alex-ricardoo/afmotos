import React from 'react';
import { View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  badgeContainer: {
    borderWidth: 1.2,
    borderColor: '#0f172a',
    borderRadius: 3,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  headerBar: {
    backgroundColor: '#003399',
    paddingVertical: 1.2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 5.2,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 0.8,
  },
  plateBody: {
    backgroundColor: '#ffffff',
    paddingVertical: 2.2,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateText: {
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    letterSpacing: 0.8,
  },
});

interface MercosulPlateBadgeProps {
  plate?: string | null;
  width?: number;
  fontSize?: number;
}

export const MercosulPlateBadge: React.FC<MercosulPlateBadgeProps> = ({
  plate = '---',
  width = 96,
  fontSize = 10.5,
}) => {
  const displayPlate = plate?.trim() || '---';

  return (
    <View style={[styles.badgeContainer, { width }]}>
      <View style={styles.headerBar}>
        <Text style={styles.headerText}>BRASIL</Text>
      </View>
      <View style={styles.plateBody}>
        <Text style={[styles.plateText, { fontSize }]}>{displayPlate}</Text>
      </View>
    </View>
  );
};
