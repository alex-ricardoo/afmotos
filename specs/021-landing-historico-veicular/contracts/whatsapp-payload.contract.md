# Contract: WhatsApp Click-to-Chat URL Generation

**Scope**: Interface entre os componentes públicos da landing page (`VehicleHistoryHero`, `VehicleHistoryPricing`, `VehicleHistoryCtaFinal`), o helper de URL `buildVehicleHistoryWhatsAppUrl()` e o protocolo de mensageria `wa.me`.

---

## 1. Input Parameters Contract

```typescript
export interface BuildVehicleHistoryWhatsAppParams {
  /** Telefone com DDI e DDD (ex: "5581985901175" ou "(81) 98590-1175") */
  phone?: string | null;

  /** Placa do veículo (ex: "BRA2E19" ou "ABC-1234"). Se ausente, gera mensagem de dúvidas */
  plate?: string | null;

  /** Preço da consulta em Reais. Padrão: 39.99 */
  price?: number;

  /** Template de interpolação com tags {PLATE}, {PRICE} e {SITE_NAME} */
  template?: string;

  /** Nome oficial da loja. Padrão: "AF Motos" */
  siteName?: string;
}
```

---

## 2. Output Contract

- Retorna uma URL válida no formato: `https://wa.me/[clean_phone]?text=[encoded_message]`
- `clean_phone`: Estritamente numérico, iniciando com `55` seguido de DDD (2 dígitos) e número de telefone (8 ou 9 dígitos).
- `encoded_message`: String formatada e sanitizada, escapada com `encodeURIComponent()`.

---

## 3. Invariantes de Segurança e Privacidade

1. **Zero Rastreamento Indireto**: A URL do WhatsApp não conterá tokens de sessão, IP do usuário ou identificadores de tracking.
2. **Placa Normalizada**: Placas são formatadas visualmente antes do escape (`ABC-1234` ou `BRA2E19`).
3. **Fallback Resiliente**: Caso o telefone venha nulo ou indefinido, aplica `CONSTANTS.CONTACT_PHONE` como fallback seguro.
