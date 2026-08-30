import type { ApiBrasilVehicleResponse } from '../schema.ts';
import type { InternalVehicleConsultationDto } from '../types.ts';
import { parseBrazilianNumber } from './apibrasil-vehicle-total.ts';

export function toVehicleDebtsSummary(
  parsed: ApiBrasilVehicleResponse
): InternalVehicleConsultationDto['debts'] {
  const d = parsed.data || parsed.dados;
  const be = d?.baseEstadual || d?.base_estadual || {};

  const ipvaAmount = parseBrazilianNumber(be.debitoIpva ?? be.ipva_debito);
  const licensingAmount = parseBrazilianNumber(be.debitoLicenciamento ?? be.licenciamento_debito);
  const finesAmount = parseBrazilianNumber(be.debitoMultas ?? be.multas_debito);
  const totalAmount = parseBrazilianNumber(be.total_debitos) || ipvaAmount + licensingAmount + finesAmount;

  const finesList = Array.isArray(be.multas)
    ? be.multas.map((m: any, idx: number) => ({
        id: `fine-${idx + 1}`,
        auto_infraction: m.auto_infracao || m.autoInfracao || 'N/I',
        descricao: m.descricao || 'Infração de trânsito',
        orgao: m.orgao || 'DETRAN',
        date: m.data || undefined,
        amount: parseBrazilianNumber(m.valor),
        status: m.status || 'Pendente',
      }))
    : [];

  const ipvaList = Array.isArray(be.ipva)
    ? be.ipva.map((item: any) => ({
        year: Number(item.exercicio) || undefined,
        quota: item.cota || 'Única',
        amount: parseBrazilianNumber(item.valor),
        status: item.status || 'Pendente',
      }))
    : [];

  return {
    total_amount: totalAmount,
    has_ipva_debts: ipvaAmount > 0,
    ipva_amount: ipvaAmount,
    has_licensing_debts: licensingAmount > 0,
    licensing_amount: licensingAmount,
    has_fines: finesAmount > 0 || finesList.length > 0,
    fines_amount: finesAmount,
    fines_count: finesList.length,
    fines_list: finesList,
    ipva_list: ipvaList,
  };
}
