import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { MercosulPlateBadge } from './mercosul-plate-badge';

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: '#d97706',
    paddingBottom: 10,
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '68%',
  },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1.2,
    borderColor: '#d97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: '#fbbf24',
  },
  headerInfo: {
    flexDirection: 'column',
  },
  storeName: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  smallText: {
    fontSize: 7.2,
    color: '#475569',
    lineHeight: 1.35,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  badge: {
    backgroundColor: '#0f172a',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d97706',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#fbbf24',
  },
});

interface ContractCompanyHeaderProps {
  storeName: string;
  logoSrc?: string;
  address: string;
  phone: string;
  email?: string | null;
  cnpj?: string | null;
  vehiclePlate?: string | null;
  documentIdentifier?: string;
  documentDate: string;
  documentTypeLabel?: string;
}

export function ContractCompanyHeader({
  storeName,
  logoSrc,
  address,
  phone,
  email,
  cnpj,
  vehiclePlate,
  documentIdentifier,
  documentDate,
  documentTypeLabel = 'CONTRATO DE COMPRA',
}: ContractCompanyHeaderProps) {
  const displayCnpj = cnpj?.trim();

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {logoSrc ? (
          <Image src={logoSrc} style={{ width: 50, height: 50, borderRadius: 8, objectFit: 'contain' }} />
        ) : (
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>AF</Text>
          </View>
        )}
        <View style={styles.headerInfo}>
          <Text style={styles.storeName}>{storeName}</Text>
          <Text style={styles.smallText}>Endereço: {address}</Text>
          <Text style={styles.smallText}>
            WhatsApp: {phone}
            {email ? ` • E-mail: ${email}` : ''}
          </Text>
          {displayCnpj ? <Text style={styles.smallText}>CNPJ: {displayCnpj}</Text> : null}
        </View>
      </View>

      <View style={styles.headerRight}>
        {vehiclePlate?.trim() ? (
          <View style={{ marginBottom: 2 }}>
            <MercosulPlateBadge plate={vehiclePlate} width={96} fontSize={10.5} />
          </View>
        ) : (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {documentIdentifier ? `${documentTypeLabel} ${documentIdentifier.slice(0, 10).toUpperCase()}` : documentTypeLabel}
            </Text>
          </View>
        )}
        <Text style={{ fontSize: 7, color: '#64748b', marginTop: 3 }}>Data: {documentDate}</Text>
      </View>
    </View>
  );
}
