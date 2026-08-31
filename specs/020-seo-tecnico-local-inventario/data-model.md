# Data Model & Technical Mapping: SEO Técnico, Local e de Inventário

Este documento detalha o mapeamento de rotas, fontes de dados, modelos de metadados, estruturas JSON-LD e regras de canônicos para a AF Motos.

---

## 1. Mapa de Rotas Públicas e Indexabilidade

| Rota | Descrição | Status HTTP | Indexável (Robots) | No Sitemap? | Canonical URL |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/` | Homepage institucional e destaques | 200 | `index, follow` | **Sim** (`priority: 1.0`, `daily`) | `https://[dominio]/` |
| `/motos` | Catálogo de motos disponíveis (sem filtros) | 200 | `index, follow` | **Sim** (`priority: 0.9`, `daily`) | `https://[dominio]/motos` |
| `/motos?[filtros]` | Catálogo com filtros de busca/ordenação | 200 | `noindex, follow` | **Não** | `https://[dominio]/motos` |
| `/motos/[slug]` (Ativa) | Detalhe de moto com status `AVAILABLE` | 200 | `index, follow` | **Sim** (`priority: 0.8`, `weekly`) | `https://[dominio]/motos/[slug]` |
| `/motos/[slug]` (Vendida) | Detalhe de moto com status `SOLD` | 200 | `noindex, follow` | **Não** | `https://[dominio]/motos/[slug]` |
| `/motos/[slug]` (Oculta) | Moto com status `HIDDEN` | 404 | N/A | **Não** | N/A |
| `/anunciar-sua-moto` | Formulário de anúncio de moto pelo cliente | 200 | `index, follow` | **Sim** (`priority: 0.7`, `monthly`) | `https://[dominio]/anunciar-sua-moto` |
| `/vender-minha-moto` | Formulário de venda direta com avaliação FIPE | 200 | `index, follow` | **Sim** (`priority: 0.7`, `monthly`) | `https://[dominio]/vender-minha-moto` |
| `/aluguel` | Informações de planos de locação semanal/mensal | 200 | `index, follow` | **Sim** (`priority: 0.7`, `monthly`) | `https://[dominio]/aluguel` |
| `/sobre` | História, diferenciais e localização da AF Motos | 200 | `index, follow` | **Sim** (`priority: 0.5`, `monthly`) | `https://[dominio]/sobre` |
| `/motos-vendidas` | Histórico público de motos negociadas | 200 | `index, follow` | **Sim** (`priority: 0.5`, `weekly`) | `https://[dominio]/motos-vendidas` |
| `/politica-de-privacidade` | LGPD e termos legais do site | 200 | `index, follow` | **Sim** (`priority: 0.3`, `yearly`) | `https://[dominio]/politica-de-privacidade` |
| `/venda-sua-moto` | Rota legada de redirect | 308 | N/A | **Não** | `https://[dominio]/anunciar-sua-moto` |
| `/consignar-moto` | Rota legada de redirect | 308 | N/A | **Não** | `https://[dominio]/anunciar-sua-moto` |
| `/admin/**` | Todas as páginas do painel administrativo | 200/302 | `noindex, nofollow` | **NUNCA** | N/A |
| `/api/**` | Endpoints de backend e webhooks | 200/40x | `noindex, nofollow` | **NUNCA** | N/A |

---

## 2. Modelo de Dados de Metadados por Página

### 2.1 Homepage (`/`)
- **Title**: `AF Motos | Motos usadas e seminovas em Cabo de Santo Agostinho - PE`
- **Description**: `Encontre motos usadas e seminovas na AF Motos, em Cabo de Santo Agostinho - PE. Confira nosso estoque revisado, consulte detalhes e fale direto pelo WhatsApp.`
- **Canonical**: `https://[dominio]/`
- **OG Type**: `website`
- **OG Image**: Foto do banner hero ou logo da loja.

### 2.2 Catálogo Geral (`/motos`)
- **Title**: `Motos Usadas e Seminovas à Venda | AF Motos`
- **Description**: `Confira as melhores motos revisadas e com procedência garantida na AF Motos em Cabo de Santo Agostinho - PE. Financiamento facilitado e negociação transparente.`
- **Canonical**: `https://[dominio]/motos`
- **OG Type**: `website`

### 2.3 Detalhe da Moto (`/motos/[slug]`)
- **Title**: `[Marca] [Modelo] [Versão?] [Ano] usada à venda em Cabo de Santo Agostinho | [Nome da Loja]`
  - Exemplo: `Honda CG 160 Start 2024 usada à venda em Cabo de Santo Agostinho | AF Motos`
- **Description**: `[Marca] [Modelo] [Ano], [KM] km rodados, cor [Cor], por R$ [Preço]. Disponível na AF Motos em Cabo de Santo Agostinho - PE. Veja fotos e fale conosco no WhatsApp.`
- **Canonical**: `https://[dominio]/motos/[slug]`
- **OG Type**: `product`
- **OG Image**: `motorcycle.images[0].url` (com fallback para `/logo.jpg`)
- **Twitter Card**: `summary_large_image`

### 2.4 Vender Minha Moto (`/vender-minha-moto`)
- **Title**: `Venda sua Moto para a AF Motos | Avaliação Justa e Pagamento Rápido`
- **Description**: `Quer vender sua moto em Cabo de Santo Agostinho ou Recife? Consulte a Tabela FIPE, simule sua proposta e venda diretamente para a AF Motos com pagamento seguro via PIX.`
- **Canonical**: `https://[dominio]/vender-minha-moto`

---

## 3. Modelo de Dados Estruturados (JSON-LD)

### 3.1 Local Business / Auto Dealer Schema (`AutoDealer`)
Injetado na Homepage (`/`) e na página Sobre (`/sobre`):

```json
{
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  "@id": "https://[dominio]/#autodealer",
  "name": "AF Motos",
  "legalName": "AF Motos",
  "url": "https://[dominio]",
  "logo": "https://[dominio]/logo.jpg",
  "image": "https://[dominio]/logo.jpg",
  "description": "Compra, venda e intermediação de motocicletas seminovas e usadas em Cabo de Santo Agostinho e Região Metropolitana de Recife.",
  "telephone": "+5581999999999",
  "email": "contato@afmotos.com.br",
  "priceRange": "$$",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rua Milton Adolfo de Jesus, 68, Loja",
    "addressNeighborhood": "São Francisco",
    "addressLocality": "Cabo de Santo Agostinho",
    "addressRegion": "PE",
    "postalCode": "54350-655",
    "addressCountry": "BR"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": -8.2833,
    "longitude": -35.0333
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      "opens": "08:00",
      "closes": "18:00"
    },
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Saturday"],
      "opens": "08:00",
      "closes": "13:00"
    }
  ],
  "sameAs": [
    "https://www.instagram.com/afmotospe"
  ]
}
```

*Nota: CNPJ e coordenadas geográficas só são incluídos se existirem no banco/configuração.*

---

### 3.2 Product & Offer Schema (`Product` / `Offer`)
Injetado na página de detalhe de moto ativa (`/motos/[slug]`):

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://[dominio]/motos/honda-cg-160-start-2024#product",
  "name": "Honda CG 160 Start 2024",
  "description": "Moto seminova em excelente estado com laudo cautelar aprovado e garantia na AF Motos.",
  "image": [
    "https://i.ibb.co/abc/honda-cg-160.jpg"
  ],
  "category": "Motorcycle",
  "brand": {
    "@type": "Brand",
    "name": "Honda"
  },
  "model": "CG 160 Start",
  "productionDate": "2024",
  "offers": {
    "@type": "Offer",
    "url": "https://[dominio]/motos/honda-cg-160-start-2024",
    "priceCurrency": "BRL",
    "price": "15900.00",
    "priceValidUntil": "2026-12-31",
    "itemCondition": "https://schema.org/UsedCondition",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "AutoDealer",
      "name": "AF Motos",
      "url": "https://[dominio]"
    }
  }
}
```

---

### 3.3 Breadcrumb Schema (`BreadcrumbList`)
Injetado nas páginas de detalhe e seções:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Início",
      "item": "https://[dominio]/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Motos Disponíveis",
      "item": "https://[dominio]/motos"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Honda CG 160 Start 2024",
      "item": "https://[dominio]/motos/honda-cg-160-start-2024"
    }
  ]
}
```

---

### 3.4 FAQ Schema (`FAQPage`)
Injetado na página `/vender-minha-moto` ou `/anunciar-sua-moto`:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Como a AF Motos avalia minha moto?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Utilizamos a Tabela FIPE oficial atualizada como referência de mercado e avaliamos o estado de conservação, quilometragem, documentação e procedência do veículo para fazer uma oferta justa e transparente."
      }
    },
    {
      "@type": "Question",
      "name": "Como é feito o pagamento da compra da moto?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Após a vistoria presencial e conferência do laudo cautelar e documentação de transferência, o pagamento é realizado integralmente à vista via transferência bancária ou PIX."
      }
    }
  ]
}
```

---

## 4. Auditoria de Campos do Banco de Dados e Necessidade de Migrations

### Campos Existentes Identificados:
- `motorcycles.slug`: Presente e único por moto.
- `motorcycles.brand`, `model`, `version`, `year_model`, `price`, `mileage`, `color`, `fuel`: Presentes.
- `motorcycles.status`: Presente (`AVAILABLE`, `SOLD`, `RESERVED`, `HIDDEN`).
- `motorcycles.updated_at`: Presente (usado para `<lastmod>` no sitemap).
- `motorcycle_images.public_url` / `display_url` / `storage_path`: Presentes.
- `motorcycle_images.is_primary`: Presente.
- `site_settings.site_name`, `whatsapp_phone`, `contact_email`, `address`, `settings`: Presentes com suporte a dados detalhados.

### Conclusão sobre Migrations:
**NENHUMA migration de banco de dados é necessária para o MVP de SEO Técnico.**  
Todos os metadados, títulos, descrições e schemas serão derivados e sintetizados em tempo de execução no servidor (Server Components) a partir dos dados já existentes no banco de dados. Isso preserva a simplicidade operacional e evita sobrecarga de preenchimento manual por parte dos administradores da loja.
