'use server';

import { requireActiveAdmin } from '@/lib/admin/admin-auth';
import {
  getVehicleHistoryAnnualReport,
  AnnualReportResult,
} from '@/lib/reports/annual-accountant-queries';

export async function getVehicleHistoryAnnualReportAction(
  year: number,
  includeMockTests: boolean = false,
): Promise<{ success: boolean; data?: AnnualReportResult; error?: string }> {
  try {
    const adminCtx = await requireActiveAdmin();

    const result = await getVehicleHistoryAnnualReport({
      year,
      includeMockTests,
      adminId: adminCtx.adminProfileId,
      adminName: adminCtx.name || 'Administrador',
    });

    return { success: true, data: result };
  } catch (error: unknown) {
    console.error('[AnnualReportAction Error]:', error);
    const message =
      error instanceof Error ? error.message : 'Falha ao gerar o informe contábil anual.';
    return {
      success: false,
      error: message,
    };
  }
}
