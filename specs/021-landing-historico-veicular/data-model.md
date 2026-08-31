# Data Model: Landing Page Pública — Histórico Veicular

Este documento define as entidades, esquemas de dados, tipagens TypeScript, validações Zod e restrições de persistência para o módulo de Histórico Veicular.

---

## 1. Esquema em `site_settings` (JSONB)

O armazenamento das configurações do serviço de Histórico Veicular ocorre dentro do campo `settings` (JSONB) da tabela existente `site_settings`.

### 1.1 Interface TypeScript (`types/site-settings.ts`)

```typescript
export type VehicleHistoryPositioningMode = 
  | 'COMPETITIVE'      // "Histórico veicular completo por um preço acessível"
  | 'REGIONAL_BEST'    // "Um dos melhores preços para consulta veicular na região"
  | 'SPECIAL_OFFER'    // "Oferta especial de lançamento"
  | 'CHEAPEST_MARKET'  // "O menor preço do mercado" (Requer comprovação)
  | 'CUSTOM';          // Texto personalizado

export interface VehicleHistorySettings {
  /** Indica se a landing page e links públicos estão habilitados */
  isEnabled: boolean;

  /** Preço da consulta em Reais (BRL). Padrão: 39.99 */
  price: number;

  /** Código da moeda ISO 4217. Padrão: 'BRL' */
  currency: string;

  /** Rótulo de apoio ou destaque de preço (ex: 'Consulta completa por R$ 39,99') */
  priceLabel?: string;

  /** Modo de posicionamento de marketing da precificação */
  positioningMode: VehicleHistoryPositioningMode;

  /** Texto personalizado para exibição de posicionamento (se mode === 'CUSTOM') */
  customPositioningText?: string | null;

  /** Texto de evidência/comprovação mercadológica (Obrigatório se 'CHEAPEST_MARKET') */
  claimEvidenceText?: string | null;

  /** Data da realização da pesquisa/comprovação (ISO 8601 YYYY-MM-DD) */
  claimEvidenceDate?: string | null;

  /** Telefone alternativo do WhatsApp exclusivo para laudos (opcional) */
  whatsappPhoneOverride?: string | null;

  /** Template da mensagem de WhatsApp gerada para solicitação com placa */
  whatsappMessageTemplate?: string;

  /** Título customizado da Hero Section */
  heroTitle?: string;

  /** Subtítulo customizado da Hero Section */
  heroSubtitle?: string;

  /** Texto institucional de ressalvas e limitações do serviço */
  disclaimerText?: string;

  /** Se deve exibir o link no Header e Footer */
  isPublishedInNav: boolean;

  /** Data da última alteração das configurações de histórico */
  updatedAt?: string;
}

export interface SiteSettingsData {
  // ... campos existentes (branding, address, socialLinks, about, etc.)
  vehicleHistory?: VehicleHistorySettings;
}
```

---

## 2. Validação com Zod (`lib/settings/schema.ts`)

```typescript
import * as z from 'zod';

export const vehicleHistorySettingsSchema = z.object({
  isEnabled: z.boolean().default(true),
  price: z
    .number({ invalid_type_error: 'Preço deve ser um valor numérico' })
    .positive('O preço da consulta deve ser maior que zero')
    .max(999.99, 'Preço máximo permitido é R$ 999,99')
    .default(39.99),
  currency: z.string().default('BRL'),
  priceLabel: z.string().max(100).optional().default('Consulta completa por R$ 39,99'),
  positioningMode: z.enum([
    'COMPETITIVE',
    'REGIONAL_BEST',
    'SPECIAL_OFFER',
    'CHEAPEST_MARKET',
    'CUSTOM'
  ]).default('COMPETITIVE'),
  customPositioningText: z.string().max(160).optional().nullable(),
  claimEvidenceText: z.string().max(300).optional().nullable(),
  claimEvidenceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD').optional().nullable(),
  whatsappPhoneOverride: z.string().max(20).optional().nullable(),
  whatsappMessageTemplate: z.string().max(500).optional().default(
    'Olá! Quero solicitar o Histórico Veicular da moto com placa {PLATE}. Vi a consulta por {PRICE} no site da AF Motos e gostaria de saber como pagar e receber o relatório.'
  ),
  heroTitle: z.string().max(120).optional(),
  heroSubtitle: z.string().max(250).optional(),
  disclaimerText: z.string().max(500).optional(),
  isPublishedInNav: z.boolean().default(true),
}).superRefine((data, ctx) => {
  // Validação ética e legal de alegação de menor preço absoluto
  if (data.positioningMode === 'CHEAPEST_MARKET') {
    if (!data.claimEvidenceText || data.claimEvidenceText.trim().length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['claimEvidenceText'],
        message: 'Para usar a alegação "Mais barato do mercado", é obrigatório registrar a fonte e metodologia da pesquisa comprobatória (mínimo 10 caracteres).'
      });
    }
    if (!data.claimEvidenceDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['claimEvidenceDate'],
        message: 'Informe a data em que a pesquisa de mercado foi realizada.'
      });
    }
  }

  if (data.positioningMode === 'CUSTOM' && (!data.customPositioningText || data.customPositioningText.trim().length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['customPositioningText'],
      message: 'Informe o texto personalizado de posicionamento.'
    });
  }
});
```

---

## 3. Modelo do Helper de WhatsApp (`lib/utils/whatsapp.ts`)

```typescript
export interface BuildVehicleHistoryWhatsAppParams {
  phone?: string | null;
  plate?: string | null;
  price?: number;
  template?: string;
  siteName?: string;
}

/**
 * Monta o link wa.me para solicitação de Histórico Veicular com placa opcional e preço dinâmico.
 */
export function buildVehicleHistoryWhatsAppUrl({
  phone,
  plate,
  price = 39.99,
  template,
  siteName = 'AF Motos',
}: BuildVehicleHistoryWhatsAppParams): string {
  const formattedPrice = price.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  let message: string;

  if (plate) {
    const formattedPlate = formatBrazilianPlate(plate);
    if (template && template.includes('{PLATE}')) {
      message = template
        .replace('{PLATE}', formattedPlate)
        .replace('{PRICE}', formattedPrice)
        .replace('{SITE_NAME}', siteName);
    } else {
      message = `Olá! Quero solicitar o Histórico Veicular da moto com placa ${formattedPlate}. Vi a consulta por ${formattedPrice} no site da ${siteName} e gostaria de saber como pagar e receber o relatório.`;
    }
  } else {
    message = `Olá! Vi o serviço de Histórico Veicular no site da ${siteName} e gostaria de tirar algumas dúvidas antes de solicitar a consulta.`;
  }

  return generateWhatsAppLink(phone, message);
}
```

---

## 4. Dados das Perguntas Frequentes (FAQ Model)

```typescript
export interface VehicleHistoryFaqItem {
  id: string;
  question: string;
  answer: string;
}

export const VEHICLE_HISTORY_FAQS: VehicleHistoryFaqItem[] = [
  {
    id: 'info-needed',
    question: 'O que preciso informar para solicitar o histórico?',
    answer: 'Apenas a placa da moto. Não é necessário informar chassi, Renavam ou dados do proprietário.',
  },
  {
    id: 'scope',
    question: 'O que o relatório de histórico veicular consulta?',
    answer: 'O relatório verifica dados cadastrais da moto, débitos de IPVA, multas, licenciamento, alienação fiduciária e gravames, restrições judiciais (Renajud), histórico de roubo/furto, indícios de sinistro, histórico de leilão, chamados de recall e referências da tabela FIPE, conforme a disponibilidade das bases integradas.',
  },
  {
    id: 'warranty',
    question: 'O relatório garante que a moto não tem problemas mecânicos?',
    answer: 'Não. O histórico é uma ferramenta analítica de verificação cadastral e documental. Ele é fundamental para prevenir fraudes e pendências, mas não substitui a vistoria mecânica presencial e a conferência física da moto.',
  },
  {
    id: 'payment-delivery',
    question: 'Quanto custa e como recebo o relatório?',
    answer: 'O valor da consulta completa é de R$ 39,99. O pagamento é alinhado diretamente pelo WhatsApp com a AF Motos e, após a confirmação, nossa equipe realiza a consulta e envia o relatório organizado em PDF diretamente no seu chat.',
  },
  {
    id: 'time',
    question: 'A consulta é realizada na hora?',
    answer: 'Sim. Assim que a solicitação e o pagamento são confirmados no WhatsApp, nossa equipe processa a consulta imediatamente e emite o documento.',
  },
  {
    id: 'other-vehicles',
    question: 'Posso consultar carro ou apenas motos?',
    answer: 'Nosso atendimento é especializado e focado no mercado de motocicletas, mas também conseguimos realizar a consulta para automóveis e utilitários sob consulta prévia no WhatsApp.',
  },
  {
    id: 'privacy',
    question: 'A AF Motos armazena a placa que digitei no site?',
    answer: 'Não. A digitação da placa no site serve unicamente para formatar a sua mensagem no WhatsApp. Nenhum dado é salvo no banco de dados da landing page nem compartilhado com terceiros.',
  },
];
```

---

## 5. Diretrizes de Proteção e Dados Proibidos de Armazenamento

Para assegurar conformidade inegociável com a LGPD e a Constituição da AF Motos:
1. **PROIBIDO**: Criar tabelas de leads de placas públicas não autenticadas ou com tracking invisível.
2. **PROIBIDO**: Gravar placas em cookies, `localStorage` persistente ou cabeçalhos de requisições analíticas.
3. **PROIBIDO**: Salvar respostas da API Brasil em cache público sem autenticação do operador.
4. **PERMITIDO**: O rastreamento de telemetria agregada e anônima de cliques nos botões (ex.: `cta_whatsapp_click`, `faq_accordion_toggle`), sem qualquer parâmetro de identificação do veículo.
