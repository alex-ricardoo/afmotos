import { Metadata } from 'next';
import { getMotorcyclesForFipeLinker } from '@/lib/queries/motorcycles';
import { getFipeConsultations } from '@/lib/queries/fipe-consultations';
import { FipePageClient } from '@/components/admin/fipe/fipe-page-client';

export const metadata: Metadata = {
  title: 'Consulta Tabela FIPE | AF Motos Admin',
  description:
    'Consulta de valores de referência de motocicletas via Tabela FIPE para apoio à avaliação e negociação comercial.',
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminFipePage() {
  const [motorcycles, consultations] = await Promise.all([
    getMotorcyclesForFipeLinker(),
    getFipeConsultations(50),
  ]);

  return <FipePageClient initialMotorcycles={motorcycles} initialConsultations={consultations} />;
}
