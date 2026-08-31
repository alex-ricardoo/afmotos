# Tasks: SEO Técnico, Local e de Inventário — AF Motos

**Feature Branch**: `020-seo-tecnico-local-inventario`  
**Created**: 2026-08-31  
**Status**: Completed

---

## Fase 0: Auditoria e Inventário de URLs

- [X] **TSK-001**: Auditar e mapear todas as rotas públicas, rotas administrativas e dependências de `site_settings`.
  - **Arquivos previstos**: `specs/020-seo-tecnico-local-inventario/data-model.md`
  - **Dependências**: Nenhuma
  - **Critério de conclusão**: Documento `data-model.md` validado com tabela de indexabilidade completa.
  - **Pode rodar em paralelo?**: Não

---

## Fase 1: Módulo Central de SEO e Metadados Globais

- [X] **TSK-010**: Criar módulo de configuração mestre e utilitários de SEO em `lib/seo/`.
  - **Arquivos previstos**: `lib/seo/config.ts`, `lib/seo/utils.ts`, `lib/seo/metadata.ts`
  - **Dependências**: TSK-001
  - **Critério de conclusão**: Funções `getBaseSiteUrl()`, `getCanonicalUrl()` e `buildPageMetadata()` criadas e testadas com tipagem estrita.
  - **Pode rodar em paralelo?**: Não

- [X] **TSK-011**: Atualizar `app/layout.tsx` com `metadataBase`, `title.template` e metadados institucionais padrão.
  - **Arquivos previstos**: `app/layout.tsx`
  - **Dependências**: TSK-010
  - **Critério de conclusão**: `metadataBase` configurado com a URL canônica e title template `%s | AF Motos` ativo no layout raiz.
  - **Pode rodar em paralelo?**: Não

- [X] **TSK-012**: Implementar proteção anti-indexação para ambientes de preview da Vercel.
  - **Arquivos previstos**: `app/layout.tsx`, `next.config.ts`
  - **Dependências**: TSK-011
  - **Critério de conclusão**: Tags e headers `noindex, nofollow` aplicados automaticamente caso o host seja de preview.
  - **Pode rodar em paralelo?**: Sim

---

## Fase 2: Arquivos Especiais de Rastreamento (Sitemap e Robots)

- [X] **TSK-020**: Implementar arquivo `app/robots.ts`.
  - **Arquivos previstos**: `app/robots.ts`
  - **Dependências**: TSK-010
  - **Critério de conclusão**: Rota `/robots.txt` gerada com bloqueio de `/admin/`, `/api/`, `/login/` e link do sitemap canônico.
  - **Pode rodar em paralelo?**: Sim

- [X] **TSK-021**: Implementar arquivo `app/sitemap.ts` dinâmico com consulta ao Supabase.
  - **Arquivos previstos**: `app/sitemap.ts`
  - **Dependências**: TSK-010
  - **Critério de conclusão**: Rota `/sitemap.xml` responde com status 200 listando homepage, catálogo, páginas institucionais e motos com status `AVAILABLE` (com datas `lastmod`), tratando falhas com fallback estático.
  - **Pode rodar em paralelo?**: Sim

---

## Fase 3: Dados Estruturados (Schema.org / JSON-LD)

- [X] **TSK-030**: Criar componente seguro `JsonLd` em `lib/seo/jsonld.tsx`.
  - **Arquivos previstos**: `lib/seo/jsonld.tsx`
  - **Dependências**: TSK-010
  - **Critério de conclusão**: Componente renderiza `<script type="application/ld+json">` com sanitização contra caracteres perigosos.
  - **Pode rodar em paralelo?**: Sim

- [X] **TSK-031**: Criar gerador de schema `AutoDealer` / `LocalBusiness` em `lib/seo/schemas/auto-dealer.ts`.
  - **Arquivos previstos**: `lib/seo/schemas/auto-dealer.ts`
  - **Dependências**: TSK-030
  - **Critério de conclusão**: Schema gerado com endereço real de Cabo de Santo Agostinho, horários, telefone/WhatsApp e redes sociais a partir de `site_settings`.
  - **Pode rodar em paralelo?**: Sim

- [X] **TSK-032**: Criar gerador de schema `Product` e `Offer` em `lib/seo/schemas/product.ts`.
  - **Arquivos previstos**: `lib/seo/schemas/product.ts`
  - **Dependências**: TSK-030
  - **Critério de conclusão**: Schema de moto gerado com preço em BRL, condição usada, fotos absolutas e vendedor `AutoDealer`.
  - **Pode rodar em paralelo?**: Sim

- [X] **TSK-033**: Criar geradores de schema `BreadcrumbList` e `FAQPage`.
  - **Arquivos previstos**: `lib/seo/schemas/breadcrumbs.ts`, `lib/seo/schemas/faq.ts`
  - **Dependências**: TSK-030
  - **Critério de conclusão**: Schemas gerados para navegação hierárquica e perguntas frequentes.
  - **Pode rodar em paralelo?**: Sim

---

## Fase 4: Integração nas Páginas Públicas

- [X] **TSK-040**: Atualizar Homepage (`app/(public)/page.tsx`) com metadados e schema `AutoDealer`.
  - **Arquivos previstos**: `app/(public)/page.tsx`
  - **Dependências**: TSK-011, TSK-031
  - **Critério de conclusão**: Homepage com título institucional único, descrição local e JSON-LD de AutoDealer injetado.
  - **Pode rodar em paralelo?**: Não

- [X] **TSK-041**: Atualizar Catálogo (`app/(public)/motos/page.tsx`) com controle de canonical e filtros.
  - **Arquivos previstos**: `app/(public)/motos/page.tsx`
  - **Dependências**: TSK-011, TSK-033
  - **Critério de conclusão**: Canonical fixo em `/motos`, `noindex, follow` aplicado quando houver query params e schema BreadcrumbList ativo.
  - **Pode rodar em paralelo?**: Sim

- [X] **TSK-042**: Atualizar Detalhe da Moto (`app/(public)/motos/[slug]/page.tsx`) com metadados dinâmicos e tratamento de motos vendidas.
  - **Arquivos previstos**: `app/(public)/motos/[slug]/page.tsx`
  - **Dependências**: TSK-011, TSK-032, TSK-033
  - **Critério de conclusão**: Metadados dinâmicos com foto principal, schema `Product`, breadcrumbs e comportamento `noindex, follow` para motos vendidas.
  - **Pode rodar em paralelo?**: Não

- [X] **TSK-043**: Atualizar páginas de serviços (`/vender-minha-moto`, `/anunciar-sua-moto`, `/aluguel`) e institucionais (`/sobre`, `/motos-vendidas`, `/politica-de-privacidade`).
  - **Arquivos previstos**: Páginas em `app/(public)/**`
  - **Dependências**: TSK-011, TSK-031, TSK-033
  - **Critério de conclusão**: Todas as páginas públicas com metadados próprios, canonicals absolutos e schemas correspondentes.
  - **Pode rodar em paralelo?**: Sim

---

## Fase 5: Otimização de Performance, Imagens e Acessibilidade

- [X] **TSK-050**: Auditar e garantir `alt` contextual em todas as tags `next/image` de motos e banners.
  - **Arquivos previstos**: `components/motorcycles/**`, `components/gallery/**`, `components/about/**`
  - **Dependências**: TSK-040, TSK-042
  - **Critério de conclusão**: Imagens com texto descritivo incluindo marca, modelo e contexto.
  - **Pode rodar em paralelo?**: Sim

- [X] **TSK-051**: Configurar atributos `priority` e `sizes` para otimização de LCP e prevenção de CLS.
  - **Arquivos previstos**: `components/layout/header.tsx`, `components/gallery/image-carousel.tsx`, `app/(public)/page.tsx`
  - **Dependências**: TSK-050
  - **Critério de conclusão**: Sem avisos de LCP não otimizado no console do Next.js.
  - **Pode rodar em paralelo?**: Sim

---

## Fase 6: Testes, Validação e Checklist

- [X] **TSK-060**: Criar testes unitários para o módulo `lib/seo/`.
  - **Arquivos previstos**: `lib/seo/__tests__/seo.test.ts`
  - **Dependências**: Todas as anteriores
  - **Critério de conclusão**: 100% de sucesso nos testes de montagem de canonical, formatação de títulos, sanitização de JSON-LD e fallbacks.
  - **Pode rodar em paralelo?**: Não

- [X] **TSK-061**: Executar validação de build, lint e typecheck completo (`npm run build`).
  - **Arquivos previstos**: Todos
  - **Dependências**: TSK-060
  - **Critério de conclusão**: Build concluído com sucesso gerando todas as rotas estáticas e dinâmicas perfeitamente.
  - **Pode rodar em paralelo?**: Não
