export const proposalTypeLabels = {
  MOTORCYCLE_INTEREST: 'Interesse em moto',
  SELL_MOTORCYCLE: 'Venda de moto',
  CONSIGNMENT: 'Anunciar moto',
  RENTAL: 'Aluguel de moto',
  MOTORCYCLE_REQUEST: 'Pedido de moto',
  GENERAL_CONTACT: 'Contato geral',
} as const;

export type ProposalType = keyof typeof proposalTypeLabels;

export const proposalStatusLabels = {
  NEW: 'Novo contato',
  CONTACTED: 'Em atendimento',
  QUALIFIED: 'Qualificado',
  CONVERTED: 'Convertido',
  LOST: 'Perdido',
  CLOSED: 'Encerrado',
} as const;

export type ProposalStatus = keyof typeof proposalStatusLabels;

export const proposalStatusStyles = {
  NEW: 'green',
  CONTACTED: 'blue',
  QUALIFIED: 'amber',
  CONVERTED: 'gold',
  LOST: 'red',
  CLOSED: 'gray',
} as const;
