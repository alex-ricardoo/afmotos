/**
 * AF Motos - Dicionário Central de Traduções e Rótulos Públicos & Administrativos
 * Garante que 100% dos textos exibidos aos usuários estejam em Português Brasileiro (pt-BR).
 */

export const MOTORCYCLE_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: 'Disponível',
  RESERVED: 'Reservada',
  SOLD: 'Vendida',
  RENTED: 'Alugada',
  MAINTENANCE: 'Em revisão',
  UNAVAILABLE: 'Indisponível',
  HIDDEN: 'Oculta',
  // Variações em minúsculo
  disponivel: 'Disponível',
  reservada: 'Reservada',
  vendida: 'Vendida',
  alugada: 'Alugada',
  manutencao: 'Em revisão',
  indisponivel: 'Indisponível',
};

export const motorcycleStatusLabels = MOTORCYCLE_STATUS_LABELS;

export const OPERATION_TYPE_LABELS: Record<string, string> = {
  SALE: 'Venda',
  RENTAL: 'Aluguel',
  SALE_AND_RENTAL: 'Venda e Aluguel',
  venda: 'Venda',
  aluguel: 'Aluguel',
  venda_e_aluguel: 'Venda e Aluguel',
};

export const operationTypeLabels = OPERATION_TYPE_LABELS;

export const OWNERSHIP_TYPE_LABELS: Record<string, string> = {
  OWNED: 'Própria',
  CONSIGNMENT: 'De um Cliente',
  propria: 'Própria',
  consignada: 'De um Cliente',
};

export const ownershipTypeLabels = OWNERSHIP_TYPE_LABELS;

export const FUEL_TYPE_LABELS: Record<string, string> = {
  GASOLINE: 'Gasolina',
  ETHANOL: 'Etanol',
  FLEX: 'Flex',
  ELECTRIC: 'Elétrica',
  DIESEL: 'Diesel',
  gasolina: 'Gasolina',
  etanol: 'Etanol',
  flex: 'Flex',
  eletrica: 'Elétrica',
  diesel: 'Diesel',
};

export const fuelTypeLabels = FUEL_TYPE_LABELS;

export const TRANSMISSION_LABELS: Record<string, string> = {
  MANUAL: 'Manual',
  AUTOMATIC: 'Automática',
  SEMI_AUTOMATIC: 'Semi-automática',
  CVT: 'CVT',
};

export const transmissionLabels = TRANSMISSION_LABELS;

export const LEAD_TYPE_LABELS: Record<string, string> = {
  MOTORCYCLE_INTEREST: 'Interesse em Moto',
  SELL_MOTORCYCLE: 'Proposta de Venda',
  CONSIGNMENT: 'Deixar para Vender',
  RENTAL: 'Locação',
  MOTORCYCLE_REQUEST: 'Busca por Modelo',
  GENERAL_CONTACT: 'Contato Geral',
};

export const leadTypeLabels = LEAD_TYPE_LABELS;

export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: 'Novo',
  IN_CONTACT: 'Em Contato',
  NEGOTIATING: 'Em Negociação',
  CONVERTED: 'Convertido',
  LOST: 'Perdido',
  ARCHIVED: 'Arquivado',
  novo: 'Novo',
  em_contato: 'Em Contato',
  negociando: 'Em Negociação',
  ganho: 'Convertido',
  perdido: 'Perdido',
};

export const leadStatusLabels = LEAD_STATUS_LABELS;

export const PUBLIC_FILTER_LABELS = {
  all: 'Todos',
  allBrands: 'Todas as marcas',
  allModels: 'Todos os modelos',
  allCategories: 'Todas as categorias',
  allYears: 'Todos os anos',
  anyPrice: 'Qualquer valor',
  sortPriceAsc: 'Menor preço',
  sortPriceDesc: 'Maior preço',
  sortYearDesc: 'Mais recentes',
  sortRecent: 'Recém-adicionadas',
  clearFilters: 'Limpar filtros',
  noResults: 'Nenhuma moto encontrada com os filtros selecionados.',
  availableCount: (count: number) =>
    count === 1 ? '1 moto disponível' : `${count} motos disponíveis`,
};

/**
 * Traduz status do veículo com fallback seguro
 */
export function translateStatus(status: string | null | undefined): string {
  if (!status) return 'Disponível';
  const key = String(status).trim().toUpperCase();
  return MOTORCYCLE_STATUS_LABELS[key] || MOTORCYCLE_STATUS_LABELS[status] || status;
}

/**
 * Traduz tipo de operação com fallback seguro
 */
export function translateOperationType(type: string | null | undefined): string {
  if (!type) return 'Venda';
  const key = String(type).trim().toUpperCase();
  return OPERATION_TYPE_LABELS[key] || OPERATION_TYPE_LABELS[type] || type;
}

/**
 * Traduz combustível com fallback seguro
 */
export function translateFuelType(fuel: string | null | undefined): string {
  if (!fuel) return 'Flex';
  const key = String(fuel).trim().toUpperCase();
  return FUEL_TYPE_LABELS[key] || FUEL_TYPE_LABELS[fuel] || fuel;
}
