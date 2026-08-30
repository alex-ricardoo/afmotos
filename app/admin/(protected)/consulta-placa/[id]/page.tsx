import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getVehicleConsultationById, getMotorcyclesForLinking } from '@/lib/queries/vehicle-lookup';
import { VehicleDetailClient } from '@/components/admin/vehicle-lookup/vehicle-detail-client';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const dto = await getVehicleConsultationById(id);

  if (!dto) {
    return {
      title: 'Laudo Veicular Não Encontrado | AF Motos',
    };
  }

  return {
    title: `Laudo ${dto.plate_display} (${dto.summary.brand} ${dto.summary.model}) | AF Motos`,
    description: `Diagnóstico e histórico veicular da placa ${dto.plate_display}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export const dynamic = 'force-dynamic';

export default async function VehicleConsultationDetailPage({ params }: PageProps) {
  const { id } = await params;
  const [dto, motorcycles] = await Promise.all([
    getVehicleConsultationById(id),
    getMotorcyclesForLinking(),
  ]);

  if (!dto) {
    notFound();
  }

  return <VehicleDetailClient dto={dto} motorcycles={motorcycles} />;
}
