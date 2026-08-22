export const motorcycleStatusLabels = {
  AVAILABLE: "Disponível",
  RESERVED: "Reservada",
  SOLD: "Vendida",
  RENTED: "Alugada",
  MAINTENANCE: "Em manutenção",
  UNAVAILABLE: "Indisponível",
  HIDDEN: "Oculta",
} as const;

export const operationTypeLabels = {
  SALE: "Venda",
  RENTAL: "Locação",
  SALE_AND_RENTAL: "Venda e locação",
} as const;

export const ownershipTypeLabels = {
  OWN: "Própria",
  OWNED: "Própria",
  CONSIGNMENT: "Consignação",
} as const;

export const leadTypeLabels = {
  MOTORCYCLE_INTEREST: "Interesse em motocicleta",
  SELL_MOTORCYCLE: "Venda de motocicleta",
  CONSIGNMENT: "Consignação",
  RENTAL: "Locação",
  MOTORCYCLE_REQUEST: "Solicitação de motocicleta",
  GENERAL_CONTACT: "Contato geral",
} as const;

export const leadStatusLabels = {
  NEW: "Novo",
  CONTACTED: "Contatado",
  QUALIFIED: "Qualificado",
  CONVERTED: "Convertido",
  LOST: "Perdido",
  CLOSED: "Encerrado",
} as const;

export const rentalStatusLabels = {
  REQUESTED: "Solicitada",
  CONFIRMED: "Confirmada",
  ACTIVE: "Ativa",
  COMPLETED: "Concluída",
  CANCELLED: "Cancelada",
} as const;
