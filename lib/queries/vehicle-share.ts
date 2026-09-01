import { getAdminShareDetailsByConsultationId } from '@/lib/vehicle-lookup/share-service';
import type { AdminVehicleShareDetailsDto } from '@/lib/vehicle-lookup/share-types';

export async function getActiveShareByConsultationId(
  consultationId: string
): Promise<AdminVehicleShareDetailsDto> {
  try {
    return await getAdminShareDetailsByConsultationId(consultationId);
  } catch (err) {
    console.error('Error fetching active share by consultation id:', err);
    return { hasActiveShare: false };
  }
}
