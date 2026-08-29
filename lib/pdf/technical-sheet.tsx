import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { MotorcycleTechnicalSheet } from '@/lib/technical-sheet/schema';
import type { SiteSettings } from '@/types/database';
import { formatCnpj } from '@/lib/utils/cnpj';

const styles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: 'Helvetica',
    color: '#1f2937',
    fontSize: 8,
    backgroundColor: '#fff',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eef7ed',
    borderWidth: 1,
    borderColor: '#95d39f',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 2,
    borderBottomColor: '#c9a44c',
    paddingBottom: 8,
    marginBottom: 10,
  },
  brand: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: '#111827' },
  eyebrow: { fontSize: 7, color: '#6b7280', marginTop: 2 },
  title: { fontSize: 19, fontFamily: 'Helvetica-Bold', color: '#111827' },
  subtitle: { fontSize: 8, color: '#6b7280', marginTop: 3 },
  hero: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  imageFrame: {
    width: 184,
    height: 132,
    padding: 5,
    borderWidth: 1.5,
    borderColor: '#c9a44c',
    backgroundColor: '#fff',
    borderRadius: 5,
  },
  image: {
    width: 172,
    height: 120,
    objectFit: 'cover',
    backgroundColor: '#f3f4f6',
    borderRadius: 2,
  },
  imageFallback: {
    width: 172,
    height: 120,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
  },
  unit: { flex: 1, paddingTop: 2 },
  price: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#9a7626', marginTop: 7 },
  section: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: '#111827',
    borderLeftWidth: 3,
    borderLeftColor: '#c9a44c',
    paddingLeft: 7,
    marginBottom: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 3,
  },
  field: { width: '33.33%', paddingRight: 8, marginBottom: 4 },
  label: { fontSize: 6, color: '#6b7280', textTransform: 'uppercase', marginBottom: 1 },
  value: { fontSize: 7.8, color: '#111827' },
  highlight: { width: '50%', color: '#374151', marginBottom: 3, fontSize: 7.8 },
  quickGrid: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  quickCard: { flex: 1, backgroundColor: '#111827', borderRadius: 3, padding: 5 },
  quickLabel: { fontSize: 6, color: '#d1d5db', textTransform: 'uppercase', marginBottom: 2 },
  quickValue: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: '#fff' },
  heroMetric: {
    backgroundColor: '#f8f6ef',
    borderWidth: 1,
    borderColor: '#ead9a7',
    padding: 7,
    marginTop: 10,
    width: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 18,
    left: 32,
    right: 32,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: '#6b7280',
  },
  note: {
    fontSize: 6.5,
    color: '#6b7280',
    marginTop: 6,
    lineHeight: 1.4,
  },
});

type Props = {
  sheet: MotorcycleTechnicalSheet & { pdfVersion?: number };
  settings: SiteSettings | null;
  logoSrc?: string | null;
};

function formatCurrency(value: number | null) {
  return value === null
    ? null
    : value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatCompactNumber(value: number | null, maxFractionDigits = 1) {
  if (value === null) return null;
  return Number(value).toLocaleString('pt-BR', {
    maximumFractionDigits: maxFractionDigits,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
  });
}

function Field({ label, value }: { label: string; value: string | number | null }) {
  if (value === null || value === '') return null;
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{String(value)}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.grid}>{children}</View>
    </View>
  );
}

export function TechnicalSheetPDF({ sheet, settings, logoSrc }: Props) {
  const {
    identity,
    unitData,
    engine,
    performance,
    consumption,
    dimensions,
    chassisAndSuspension,
    safety,
    equipment,
  } = sheet;
  const storeName = settings?.site_name || 'AF Motos';
  const phone = settings?.whatsapp_phone || '';
  const cnpj = formatCnpj(settings?.cnpj);
  const contact = [phone, cnpj ? `CNPJ: ${cnpj}` : null, settings?.address]
    .filter(Boolean)
    .join(' | ');
  const boolValue = (value: boolean | null) => (value === null ? null : value ? 'Sim' : 'Não');
  const technicalVersionAvailable = Boolean(
    identity.version && identity.yearManufacture && identity.yearModel,
  );
  const verifiedBadgeActive =
    sheet.review.status === 'APPROVED' && technicalVersionAvailable && !!consumption?.isVerified;
  const headerTitle =
    sheet.review.status === 'DRAFT'
      ? 'Ficha técnica — rascunho'
      : sheet.review.status === 'PENDING_REVIEW'
        ? 'Ficha técnica — aguardando revisão'
        : verifiedBadgeActive
          ? 'Ficha técnica verificada'
          : 'Ficha técnica';
  const versionLabel = identity.version
    ? `${identity.version}`
    : 'Versão: Consulte a equipe AF Motos';
  const hasConsumption = Boolean(
    consumption?.isVerified &&
    (consumption.cityKmPerLiter !== null ||
      consumption.highwayKmPerLiter !== null ||
      consumption.combinedKmPerLiter !== null ||
      consumption.fuelTankLiters !== null),
  );

  return (
    <Document title={`Ficha tecnica - ${identity.brand} ${identity.model}`} author={storeName}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {logoSrc && (
              <Image src={logoSrc} style={{ width: 42, height: 30, objectFit: 'contain' }} />
            )}
            <View>
              <Text style={styles.brand}>{storeName}</Text>
              <Text style={styles.eyebrow}>{headerTitle}</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {verifiedBadgeActive && (
              <View style={styles.badge}>
                <Text style={{ fontSize: 6, color: '#1d6f33', fontFamily: 'Helvetica-Bold' }}>
                  Informações verificadas
                </Text>
              </View>
            )}
            <Text style={styles.eyebrow}>
              {new Date(sheet.generatedAt).toLocaleDateString('pt-BR')}
            </Text>
          </View>
        </View>
        <View style={styles.hero}>
          <View style={styles.imageFrame}>
            {unitData.imageUrl ? (
              <Image src={unitData.imageUrl} style={styles.image} />
            ) : (
              <View style={styles.imageFallback}>
                <Text>Imagem indisponivel</Text>
              </View>
            )}
          </View>
          <View style={styles.unit}>
            <Text style={styles.title}>
              {identity.brand} {identity.model}
            </Text>
            <Text style={styles.subtitle}>
              {versionLabel}
              {identity.version
                ? ` | Modelo ${identity.yearModel}`
                : ` | Modelo ${identity.yearModel}`}
            </Text>
            <Field label="Ano de fabricacao" value={identity.yearManufacture} />
            <Field label="Cor" value={unitData.color} />
            <Field
              label="Quilometragem"
              value={
                unitData.mileage === null ? null : `${unitData.mileage.toLocaleString('pt-BR')} km`
              }
            />
            {unitData.price !== null && (
              <Text style={styles.price}>{formatCurrency(unitData.price)}</Text>
            )}
          </View>
        </View>
        {sheet.highlights.length > 0 && (
          <Section title="Destaques desta unidade">
            {sheet.highlights.map((highlight) => (
              <Text key={highlight} style={styles.highlight}>
                • {highlight}
              </Text>
            ))}
          </Section>
        )}
        {(engine.maximumPower ||
          performance.maximumSpeed ||
          dimensions.maximumPayloadKg !== null ||
          engine.fuel) && (
          <View style={styles.quickGrid} wrap={false}>
            {engine.maximumPower && (
              <View style={styles.quickCard}>
                <Text style={styles.quickLabel}>Potência máxima</Text>
                <Text style={styles.quickValue}>{engine.maximumPower}</Text>
              </View>
            )}
            {performance.maximumSpeed && (
              <View style={styles.quickCard}>
                <Text style={styles.quickLabel}>Velocidade máxima</Text>
                <Text style={styles.quickValue}>{performance.maximumSpeed}</Text>
              </View>
            )}
            {dimensions.maximumPayloadKg !== null && (
              <View style={styles.quickCard}>
                <Text style={styles.quickLabel}>Capacidade máxima de carga</Text>
                <Text style={styles.quickValue}>{dimensions.maximumPayloadKg} kg</Text>
              </View>
            )}
            {engine.fuel && (
              <View style={styles.quickCard}>
                <Text style={styles.quickLabel}>Combustível</Text>
                <Text style={styles.quickValue}>{engine.fuel}</Text>
              </View>
            )}
          </View>
        )}
        {hasConsumption && (
          <Section title="Consumo e autonomia">
            <Field
              label="Consumo urbano"
              value={
                consumption?.cityKmPerLiter === null
                  ? null
                  : `${formatCompactNumber(consumption?.cityKmPerLiter ?? null)} km/l`
              }
            />
            <Field
              label="Consumo rodoviário"
              value={
                consumption?.highwayKmPerLiter === null
                  ? null
                  : `${formatCompactNumber(consumption?.highwayKmPerLiter ?? null)} km/l`
              }
            />
            <Field
              label="Consumo combinado"
              value={
                consumption?.combinedKmPerLiter === null
                  ? null
                  : `${formatCompactNumber(consumption?.combinedKmPerLiter ?? null)} km/l`
              }
            />
            <Field
              label="Capacidade do tanque"
              value={
                consumption?.fuelTankLiters === null
                  ? null
                  : `${formatCompactNumber(consumption?.fuelTankLiters ?? null)} L`
              }
            />
            <Field
              label="Autonomia urbana estimada"
              value={
                consumption?.estimatedCityRangeKm === null
                  ? null
                  : `${formatCompactNumber(consumption?.estimatedCityRangeKm ?? null)} km`
              }
            />
            <Field
              label="Autonomia rodoviária estimada"
              value={
                consumption?.estimatedHighwayRangeKm === null
                  ? null
                  : `${formatCompactNumber(consumption?.estimatedHighwayRangeKm ?? null)} km`
              }
            />
            <Text style={styles.note}>
              *O consumo e a autonomia podem variar conforme condução, carga, condições da via,
              manutenção, combustível e uso da motocicleta.
            </Text>
          </Section>
        )}
        {technicalVersionAvailable && (
          <>
            <Section title="Motor e transmissao">
              <Field
                label="Cilindrada"
                value={engine.displacementCc === null ? null : `${engine.displacementCc} cc`}
              />
              <Field label="Combustível" value={engine.fuel} />
              <Field label="Sistema de alimentação" value={engine.fuelSystem} />
              <Field label="Tipo de motor" value={engine.engineType} />
              <Field label="Resfriamento" value={engine.cooling} />
              <Field label="Transmissão" value={engine.transmission} />
              <Field label="Partida" value={engine.starter} />
              <Field label="Potência máxima" value={engine.maximumPower} />
              <Field label="Torque máximo" value={engine.maximumTorque} />
              <Field label="Transmissão final" value={engine.finalDrive} />
            </Section>
            <Section title="Dimensoes e capacidades">
              <Field
                label="Tanque"
                value={dimensions.fuelTankLiters === null ? null : `${dimensions.fuelTankLiters} L`}
              />
              <Field
                label="Peso seco"
                value={dimensions.dryWeightKg === null ? null : `${dimensions.dryWeightKg} kg`}
              />
              <Field
                label="Peso em ordem de marcha"
                value={dimensions.curbWeightKg === null ? null : `${dimensions.curbWeightKg} kg`}
              />
              <Field
                label="Altura do assento"
                value={dimensions.seatHeightMm === null ? null : `${dimensions.seatHeightMm} mm`}
              />
              <Field
                label="Distância entre-eixos"
                value={dimensions.wheelbaseMm === null ? null : `${dimensions.wheelbaseMm} mm`}
              />
              <Field
                label="Distância do solo"
                value={
                  dimensions.groundClearanceMm === null
                    ? null
                    : `${dimensions.groundClearanceMm} mm`
                }
              />
              <Field
                label="Comprimento"
                value={dimensions.lengthMm === null ? null : `${dimensions.lengthMm} mm`}
              />
              <Field
                label="Largura"
                value={dimensions.widthMm === null ? null : `${dimensions.widthMm} mm`}
              />
              <Field
                label="Altura"
                value={dimensions.heightMm === null ? null : `${dimensions.heightMm} mm`}
              />
              <Field
                label="Capacidade máxima de carga"
                value={
                  dimensions.maximumPayloadKg === null ? null : `${dimensions.maximumPayloadKg} kg`
                }
              />
              <Field
                label="Peso bruto máximo"
                value={
                  dimensions.maximumTotalWeightKg === null
                    ? null
                    : `${dimensions.maximumTotalWeightKg} kg`
                }
              />
            </Section>
            <Section title="Chassi, suspensao e freios">
              <Field label="Chassi" value={chassisAndSuspension.frame} />
              <Field label="Suspensao dianteira" value={chassisAndSuspension.frontSuspension} />
              <Field label="Suspensao traseira" value={chassisAndSuspension.rearSuspension} />
              <Field label="Freio dianteiro" value={chassisAndSuspension.frontBrake} />
              <Field label="Freio traseiro" value={chassisAndSuspension.rearBrake} />
              <Field label="Pneu dianteiro" value={chassisAndSuspension.frontTire} />
              <Field label="Pneu traseiro" value={chassisAndSuspension.rearTire} />
              <Field label="Roda dianteira" value={chassisAndSuspension.frontWheel} />
              <Field label="Roda traseira" value={chassisAndSuspension.rearWheel} />
            </Section>
            <Section title="Seguranca e equipamentos">
              <Field label="ABS" value={boolValue(safety.abs)} />
              <Field label="Sistema de frenagem combinada" value={boolValue(safety.cbs)} />
              <Field label="Controle de tracao" value={boolValue(safety.tractionControl)} />
              <Field label="Farol LED" value={boolValue(safety.ledHeadlight)} />
              <Field label="Pisca-alerta" value={boolValue(safety.hazardLights)} />
              <Field label="Imobilizador" value={boolValue(safety.immobilizer)} />
              <Field label="Partida eletrica" value={boolValue(equipment.electricStart)} />
              <Field label="Rodas de liga leve" value={boolValue(equipment.alloyWheels)} />
              <Field label="Painel digital" value={boolValue(equipment.digitalPanel)} />
              <Field label="USB" value={boolValue(equipment.usbPort)} />
              <Field label="Bluetooth" value={boolValue(equipment.bluetoothConnectivity)} />
              <Field label="Embreagem assistida" value={boolValue(equipment.slipperClutch)} />
              <Field label="Chave presencial" value={boolValue(equipment.keylessIgnition)} />
            </Section>
          </>
        )}
        {sheet.sources.length > 0 && (
          <Text style={styles.note}>
            Informações técnicas consultadas em fonte de fabricante e revisadas pela AF Motos.
          </Text>
        )}
        <Text style={styles.note}>
          As especificações técnicas podem variar conforme versão, ano/modelo e mercado de
          fabricação. Os equipamentos e características desta unidade devem ser conferidos antes da
          compra. Consumo e autonomia são estimativas e podem variar conforme o uso.
        </Text>
        <View style={styles.footer} fixed>
          <Text>
            {storeName}
            {contact ? ` | ${contact}` : ''}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Ficha ${sheet.pdfVersion || 1} | ${pageNumber}/${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
