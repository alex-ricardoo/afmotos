export function generateWhatsAppLink(phone: string, message: string): string {
  // Clean phone number: remove non-digits
  const cleanPhone = phone.replace(/\D/g, '');

  // Format message for URL
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/55${cleanPhone}?text=${encodedMessage}`;
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
