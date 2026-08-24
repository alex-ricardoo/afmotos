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
  NEW: {
    label: 'Novo contato',
    badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold',
    cardBorder: 'border-emerald-500/35 hover:border-emerald-400',
    cardGlow: 'hover:shadow-[0_12px_35px_rgba(16,185,129,0.15)]',
    topLine: 'from-emerald-500 via-teal-400 to-emerald-500',
    dot: 'bg-emerald-400 animate-pulse',
  },
  CONTACTED: {
    label: 'Em atendimento',
    badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/40 font-bold',
    cardBorder: 'border-blue-500/30 hover:border-blue-400',
    cardGlow: 'hover:shadow-[0_12px_35px_rgba(59,130,246,0.12)]',
    topLine: 'from-blue-500 via-cyan-400 to-blue-500',
    dot: 'bg-blue-400',
  },
  QUALIFIED: {
    label: 'Qualificado',
    badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold',
    cardBorder: 'border-purple-500/30 hover:border-purple-400',
    cardGlow: 'hover:shadow-[0_12px_35px_rgba(168,85,247,0.12)]',
    topLine: 'from-purple-500 via-pink-400 to-purple-500',
    dot: 'bg-purple-400',
  },
  CONVERTED: {
    label: 'Convertido',
    badgeClass: 'bg-[#c9a44c]/25 text-[#f5d77f] border-[#c9a44c]/50 font-bold',
    cardBorder: 'border-[#c9a44c]/40 hover:border-[#c9a44c]',
    cardGlow: 'hover:shadow-[0_12px_35px_rgba(201,164,76,0.18)]',
    topLine: 'from-[#c9a44c] via-amber-300 to-[#c9a44c]',
    dot: 'bg-[#e3c56c]',
  },
  LOST: {
    label: 'Perdido',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-semibold',
    cardBorder: 'border-rose-500/20 hover:border-rose-500/40',
    cardGlow: '',
    topLine: 'from-rose-500 to-red-400',
    dot: 'bg-rose-400',
  },
  CLOSED: {
    label: 'Encerrado',
    badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700 font-medium',
    cardBorder: 'border-zinc-800/80 hover:border-zinc-700',
    cardGlow: '',
    topLine: 'from-zinc-700 to-zinc-800',
    dot: 'bg-zinc-500',
  },
} as const;
