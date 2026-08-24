import { CONSTANTS } from './constants';
import { ProposalViewModel } from '../admin/proposal-view-model';

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

  // Remove zero(s) à esquerda se houver (ex: 081999999999 -> 81999999999)
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
 * Formata um número de telefone para exibição amigável ao usuário (ex: (81) 9 8590-1175)
 */
export function formatPhoneForDisplay(phone?: string | null): string {
  if (!phone) return '';

  let digits = phone.replace(/\D/g, '');

  // Se vier com o 55 e tiver 12 ou 13 dígitos, remove o 55 para exibição nacional
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2);
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
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

export function generateProposalWhatsAppMessage(proposal: ProposalViewModel): string {
  const name = proposal.name ? proposal.name.trim() : 'Cliente';
  const moto = proposal.motorcycle?.brand
    ? `${proposal.motorcycle.brand} ${proposal.motorcycle.model || ''}`.trim()
    : '';

  switch (proposal.type) {
    case 'SELL_MOTORCYCLE': {
      const motoData = proposal.motorcycle;
      const details: string[] = [];
      if (motoData?.yearModel || motoData?.yearManufacture || motoData?.year) {
        details.push(
          `Ano: ${motoData.yearManufacture ? `${motoData.yearManufacture}/` : ''}${motoData.yearModel || motoData.year}`,
        );
      }
      if (motoData?.mileage) {
        details.push(`Quilometragem: ${motoData.mileage.toLocaleString('pt-BR')} km`);
      }
      if (motoData?.fipePrice) {
        details.push(
          `Referência FIPE: R$ ${motoData.fipePrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        );
      }
      if (motoData?.estimatedOffer) {
        details.push(
          `Estimativa simulada: R$ ${motoData.estimatedOffer.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${motoData.offerPercentage || 85}%)`,
        );
      }
      if (motoData?.desiredPrice) {
        details.push(
          `Expectativa informada: R$ ${motoData.desiredPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        );
      }

      const detailsBlock = details.length > 0 ? `\n\n${details.join('\n')}` : '';
      return `Olá, ${name}! Aqui é da AF Motos. Recebemos sua proposta para vender sua moto${moto ? ` (${moto})` : ''} e gostaríamos de confirmar as informações para darmos sequência à avaliação.${detailsBlock}`;
    }

    case 'CONSIGNMENT':
      return `Olá ${name}! Recebemos sua solicitação para anunciar/consignar sua moto${moto ? ` (${moto})` : ''}. Gostaria de passar os detalhes do nosso modelo de venda.`;

    case 'MOTORCYCLE_INTEREST':
      return `Olá ${name}! Vi seu interesse${moto ? ` na moto ${moto}` : ' em uma moto'} pelo site da AF Motos e gostaria de passar mais informações e condições especiais.`;

    case 'RENTAL': {
      const plano = proposal.rental?.desiredPlan || 'Não informado';
      const rawDate = proposal.rental?.expectedStartDate;
      const dataFormatted = rawDate ? rawDate.split('-').reverse().join('/') : 'Não informada';
      const motoDesc = moto || 'Ainda não selecionou uma moto específica';

      return `Olá, ${name}! Aqui é da AF Motos. Recebemos sua proposta de aluguel de uma moto pelo nosso site e gostaríamos de confirmar alguns detalhes com você.\n\nPlano desejado: ${plano}\nData prevista: ${dataFormatted}\nMoto: ${motoDesc}`;
    }

    case 'MOTORCYCLE_REQUEST':
      return `Olá ${name}! Recebemos seu pedido de moto pelo site da AF Motos e estamos buscando as melhores opções para você.`;

    case 'GENERAL_CONTACT':
    default:
      return `Olá ${name}! Vi seu contato enviado pelo site da AF Motos. Como posso te ajudar hoje?`;
  }
}
