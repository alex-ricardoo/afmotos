import { CONSTANTS } from './constants';

/**
 * Normaliza o número de telefone para o padrão internacional do WhatsApp (wa.me)
 * Trata números com ou sem DDI (55), com ou sem DDD, com ou sem símbolos e zeros iniciais.
 * Evita o bug de duplicação do 55 (ex: 555511999999999).
 */
export function cleanWhatsAppNumber(phone?: string | null): string {
  if (!phone) {
    phone = CONSTANTS.CONTACT_PHONE;
  }

  // Remove tudo que não for dígito
  let digits = phone.replace(/\D/g, '');

  // Remove zero(s) à esquerda se houver (ex: 011999999999 -> 11999999999)
  if (digits.startsWith('0')) {
    digits = digits.replace(/^0+/, '');
  }

  // Se já inicia com 55 e tem tamanho de número brasileiro completo (12 ou 13 dígitos: 55 + 2 DDD + 8 ou 9 dígitos)
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  // Se tem tamanho de número brasileiro sem DDI (10 ou 11 dígitos: 2 DDD + 8 ou 9 dígitos)
  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  // Caso genérico: se já começar com 55 mantém, senão adiciona 55
  return digits.startsWith('55') ? digits : `55${digits}`;
}

/**
 * Formata um número de telefone para exibição amigável ao usuário (ex: (11) 99999-9999)
 */
export function formatPhoneForDisplay(phone?: string | null): string {
  if (!phone) return '';
  
  let digits = phone.replace(/\D/g, '');
  
  // Se vier com o 55 e tiver 12 ou 13 dígitos, remove o 55 para exibição nacional
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return phone;
}

export function generateWhatsAppLink(phone: string | undefined | null, message: string): string {
  const cleanPhone = cleanWhatsAppNumber(phone);
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

export function generateMotorcycleInterestMessage(motorcycle: {
  brand: string;
  model: string;
  year_model: number;
  price?: number | null;
}): string {
  return `Olá! Tenho interesse na ${motorcycle.brand} ${motorcycle.model} (${motorcycle.year_model}). Pode me passar mais informações?`;
}

export function generateSellOrConsignMessage(): string {
  return 'Olá! Quero anunciar minha moto com a AF Motos. Como faço?';
}

export function generateRentalMessage(): string {
  return 'Olá! Tenho interesse em alugar uma moto. Gostaria de saber as opções disponíveis.';
}

import { ProposalViewModel } from '../admin/proposal-view-model';

export function generateProposalWhatsAppMessage(proposal: ProposalViewModel): string {
  let greeting = `Olá ${proposal.name}! `;
  
  switch (proposal.type) {
    case 'SELL_MOTORCYCLE':
      return greeting + `Vi seu interesse em anunciar sua moto${proposal.motorcycle?.brand ? ` (${proposal.motorcycle.brand} ${proposal.motorcycle.model})` : ''} no site da AF Motos e gostaria de conversar sobre os próximos passos.`;
      
    case 'CONSIGNMENT':
      return greeting + `Recebemos sua solicitação para consignar sua moto${proposal.motorcycle?.brand ? ` (${proposal.motorcycle.brand} ${proposal.motorcycle.model})` : ''}. Gostaria de passar mais detalhes sobre o nosso formato de trabalho.`;
      
    case 'MOTORCYCLE_INTEREST':
      return greeting + `Vi seu interesse na moto informada pelo site da AF Motos e gostaria de passar mais detalhes.`;
      
    case 'RENTAL':
      return greeting + `Recebemos seu contato pelo site referente ao aluguel de motos. Como podemos ajudar?`;
      
    default:
      return greeting + `Vim falar sobre o contato enviado pelo site da AF Motos. Como podemos ajudar?`;
  }
}
