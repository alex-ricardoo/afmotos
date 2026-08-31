# Implementation Plan: SEO Técnico, Local e de Inventário — AF Motos

**Feature Branch**: `020-seo-tecnico-local-inventario`  
**Created**: 2026-08-31  
**Status**: Ready for Execution

---

## 1. Arquitetura Proposta e Estrutura de Arquivos

### 1.1 Novos Arquivos a Criar:
```text
lib/seo/
  ├── config.ts              # Configuração mestre, domínio canônico e fallbacks seguros
  ├── metadata.ts            # Gerador de objetos de Metadata do Next.js padronizados
  ├── jsonld.tsx             # Componente de injeção segura de scripts application/ld+json
  ├── schemas/
  │   ├── auto-dealer.ts     # Schema de LocalBusiness / AutoDealer para a AF Motos
  │   ├── product.ts         # Schema de Product / Offer para motos em estoque
  │   ├── breadcrumbs.ts     # Schema de BreadcrumbList para navegação
  │   └── faq.ts             # Schema de FAQPage para páginas de serviços
  └── utils.ts              # Utilitários de sanitização, formatação de preços e URLs

app/
  ├── sitemap.ts             # Sitemap dinâmico oficial com motos ativas e páginas públicas
  └── robots.ts              # Regras oficiais de robots.txt com bloqueios de admin/api
```

### 1.2 Arquivos Existentes a Modificar:
- `app/layout.tsx`: Atualizar `metadataBase`, `title.template`, `title.default`, `description` padrão e metadados globais (Open Graph, Twitter, robôs de preview).
- `app/(public)/page.tsx`: Adicionar `generateMetadata`, JSON-LD `AutoDealer` e H1/conteúdo semântico aprimorado.
- `app/(public)/motos/page.tsx`: Atualizar `generateMetadata` com canonical e controle de `noindex` para buscas/filtros, além de breadcrumbs.
- `app/(public)/motos/[slug]/page.tsx`: Atualizar `generateMetadata` e adicionar JSON-LD `Product`/`Offer` e `BreadcrumbList`, com suporte a motos vendidas (`noindex, follow`).
- `app/(public)/anunciar-sua-moto/page.tsx`: Atualizar metadados completos e adicionar JSON-LD `FAQPage`.
- `app/(public)/vender-minha-moto/page.tsx`: Atualizar metadados completos e adicionar JSON-LD `FAQPage`.
- `app/(public)/aluguel/page.tsx`: Adicionar `generateMetadata` e canonical.
- `app/(public)/motos-vendidas/page.tsx`: Atualizar `generateMetadata` com canonical e Open Graph.
- `app/(public)/politica-de-privacidade/page.tsx`: Atualizar `generateMetadata` e canonical.
- `app/(public)/sobre/page.tsx`: Adicionar JSON-LD `AutoDealer` e refinar metadados.
- `next.config.ts`: Adicionar cabeçalho de segurança/noindex para previews e conferir redirects.

---

## 2. Fases de Execução Técnica

### Fase 1: Fundação Central de SEO (`lib/seo/`)
1. Implementar `lib/seo/config.ts` com extração confiável da URL base e tratamento de HTTPS/trailing slashes.
2. Implementar `lib/seo/utils.ts` com serialização segura de JSON-LD e formatação monetária.
3. Criar componente `JsonLd` em `lib/seo/jsonld.tsx`.
4. Criar geradores de Schema em `lib/seo/schemas/`.
5. Criar construtor de metadados em `lib/seo/metadata.ts`.

### Fase 2: Configuração Global e Arquivos Especiais de Rastreamento
1. Atualizar `app/layout.tsx` com `metadataBase` e template global.
2. Criar `app/robots.ts` com regras de `Allow` e `Disallow` e link do sitemap.
3. Criar `app/sitemap.ts` com consulta resiliente ao Supabase e prioridades por rota.

### Fase 3: Metadados e Dados Estruturados em Todas as Páginas Públicas
1. Homepage (`app/(public)/page.tsx`): Integrar metadata e schema `AutoDealer`.
2. Catálogo (`app/(public)/motos/page.tsx`): Integrar metadata com regras de query params e breadcrumbs.
3. Detalhe da Moto (`app/(public)/motos/[slug]/page.tsx`): Integrar metadata rica com foto principal e schema `Product`/`Offer` e `BreadcrumbList`, tratando status `SOLD`.
4. Páginas de Serviços e Institucionais: Atualizar `/anunciar-sua-moto`, `/vender-minha-moto`, `/aluguel`, `/sobre`, `/motos-vendidas` e `/politica-de-privacidade`.

### Fase 4: Otimização de Imagens, Performance e Acessibilidade
1. Auditar tags `alt` de todas as fotos de motos no catálogo e detalhe da moto.
2. Garantir `priority` nas imagens principais acima da dobra (LCP) da homepage e do detalhe da moto.
3. Garantir dimensões estáticas / proporções CSS para prevenir CLS (Cumulative Layout Shift).

### Fase 5: Testes Automatizados e Validação Técnica
1. Testes unitários para utilitários de canonical, serialização de JSON-LD, formatação de títulos e metadados.
2. Testes de integração simulando requisição de `/sitemap.xml` e `/robots.txt`.
3. Validação do HTML gerado contra o *Google Rich Results Test* e *Schema Markup Validator*.
4. Execução de `npm run build` e `npm run lint` para validação de integridade.

---

## 3. Gestão de Riscos e Mitigação

| Risco Identificado | Severidade | Mitigação Arquitetural |
| :--- | :--- | :--- |
| **Supabase fora do ar durante requisição do sitemap** | Média | Bloco `try/catch` retornando a lista das rotas estáticas públicas caso a consulta de motos falhe. |
| **Indexação acidental de URLs de preview do Vercel** | Alta | Meta tag `noindex` e cabeçalho `X-Robots-Tag` injetados condicionalmente quando `VERCEL_ENV !== 'production'`. |
| **Duplicação de títulos ao concatenar a marca** | Baixa | Utilização do recurso nativo `title.template: '%s | AF Motos'` gerenciado pelo framework. |
| **XSS via JSON-LD em dados digitados por usuários** | Alta | Sanitização de strings e serialização segura com escape de caracteres `<` e `>` no componente `JsonLd`. |
| **Exposição de dados sensíveis da moto** | Alta | Tipagem estrita excluindo placa completa, chassi e renavam do payload de metadados e schema. |

---

## 4. Plano de Rollback

Caso ocorra qualquer regressão inesperada em produção:
1. Reverter os commits da branch `020-seo-tecnico-local-inventario`.
2. O sistema voltará ao comportamento anterior com metadados básicos sem afetar o banco de dados (já que nenhuma migration estrutural foi aplicada).
