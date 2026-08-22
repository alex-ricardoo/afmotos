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
  const priceText = motorcycle.price
    ? ` anunciada por R$ ${motorcycle.price.toLocaleString('pt-BR')}`
    : '';

  return `Olá! Tenho interesse na moto ${motorcycle.brand} ${motorcycle.model} (${motorcycle.year_model})${priceText}. Podemos conversar?`;
}
