# Research & Technical Decisions: Skeleton Loaders em Transições de Página

**Feature**: `024-skeleton-page-transitions`  
**Status**: Concluído  
**Date**: 2026-09-04  

---

## 1. Decisão Arquitetural do Componente Base `Skeleton`

### Decisão
Criar/refatorar o componente atômico `Skeleton` (`components/ui/skeleton.tsx`) para suportar:
- Variantes estruturais primárias: `default`, `text`, `image`, `card`, `list`, `button`, `avatar`.
- Efeito de **shimmer** fluido (1.2s ciclo) com gradiente linear via CSS puro / Tailwind v4 utility tokens (`bg-[linear-gradient(...)]`), utilizando as cores de luxo da marca AF Motos (`bg-zinc-900` com destaque reflexivo em `zinc-800/80` e sutil reflexo âmbar).
- Responsividade nativa: atributos ou classes condicionais mobile/desktop (`mobileOnly`, `desktopOnly`, ou classes responsivas Tailwind como `hidden md:block`).
- Respeito a acessibilidade: marcações automáticas `aria-busy="true"`, `role="status"` e desativação total de shimmer em `@media (prefers-reduced-motion: reduce)`.

### Racional
- Bibliotecas externas como `react-loading-skeleton` adicionam peso ao bundle cliente (JavaScript) e podem causar hidratação desnecessária em Server Components do Next.js.
- O uso de CSS puro aproveita a aceleração por hardware da GPU (`transform: translateX` ou animação de `background-position`), com consumo mínimo de bateria em dispositivos móveis.
- Manter o componente no ecossistema shadcn/ui customizado preserva a integridade de estilos do projeto (`@/components/ui/skeleton`).

### Alternativas Consideradas
- **Bibliotecas prontas (`react-loading-skeleton`, `content-loader`)**: Rejeitadas por adicionarem dependências npm extras, código client-only incompatível com streaming puro de Server Components sem `"use client"` e maior risco de hydration mismatch.
- **Animação básica `animate-pulse`**: Rejeitada para páginas de produto de alto padrão; o pulso simples parece genérico e monótono, enquanto o gradiente *shimmer* direcional (efeito espelhado) transmite sensação de rapidez e tecnologia de ponta.

---

## 2. Estratégia de Transições de Página no Next.js App Router

### Decisão
1. **Adotar `loading.tsx` dedicado em cada segmento de rota pública**:
   - `app/(public)/loading.tsx` (Fallback universal para rotas públicas filhas)
   - `app/(public)/motos/loading.tsx` (Esqueleto fiel do catálogo com barra de filtros e grid de cards)
   - `app/(public)/motos/[slug]/loading.tsx` (Esqueleto da página de detalhes: galeria 16:10, título, preço, specs e botão WhatsApp)
   - `app/(public)/aluguel/loading.tsx` (Esqueleto da frota de locação e tabela de planos)
   - `app/(public)/venda-sua-moto/loading.tsx` (Esqueleto do formulário de proposta de venda/consignação)
   - `app/(public)/historico-veicular/loading.tsx` (Esqueleto do buscador de placas e benefícios)
   - `app/(public)/sobre/loading.tsx` (Esqueleto institucional)
2. **Corrigir `app/loading.tsx` raiz**:
   - Remover qualquer chamada assíncrona (`await getSiteSettings()`) de dentro de `loading.tsx`. Os fallbacks de carregamento DEVEM ser síncronos e puros para renderizar no frame zero (0ms de latência de inicialização).
3. **Usar `Suspense` granular para blocos assíncronos internos**:
   - Para seções específicas que demoram mais (ex: carrossel de motos recomendadas ou comentários), encapsular com `<Suspense fallback={<MotorcycleGridSkeleton count={3} />}>`.

### Racional
O Next.js App Router renderiza o `loading.tsx` instantaneamente no cliente durante a transição via `<Link>`, sem recarregar o Header e o Footer (já presentes no layout persistente). Isso atende ao requisito de reação em <100ms e dá a percepção imediata de que a página destino está quase pronta.

### Alternativas Consideradas
- **Page transitions com bibliotecas pesadas de animação (`framer-motion`)**: Rejeitada porque adiciona ~40kB de JavaScript ao bundle móvel inicial e atrasa a pintura da árvore DOM em conexões de baixo desempenho.
- **Estado de navegação global com barra de progresso (NProgress / TopLoader)**: Útil como complemento em conjunto com skeletons, mas uma barra de progresso isolada no topo não resolve o Cumulative Layout Shift (CLS) nem dá prévia da geometria da página.

---

## 3. Eliminação Total de Layout Shift (CLS = 0) e Mobile-First

### Decisão
1. **Aspect-ratio e alturas fixadas por containers**:
   - Imagens dos cards no catálogo: `aspect-[16/10]` idêntico ao `MotorcycleCard`.
   - Galeria da página de produto: `aspect-[16/10]` no mobile e `aspect-[16/10]` no desktop com o mesmo raio de borda (`rounded-3xl`).
   - Cards de especificações técnicas: grid com altura e padding idênticos a `MotorcycleSpecs`.
   - Botões CTA: altura padrão de 48px/52px (touch targets ideais para celular).
2. **Design responsivo e simplificado no mobile**:
   - No celular: 1 card por linha com espaçamento `gap-4` ou `gap-6`. Menos linhas de texto secundário no esqueleto mobile para evitar poluição visual.
   - No desktop: 3 cards por linha no catálogo com altura precisa.

### Racional
O Google Core Web Vitals penaliza fortemente o Cumulative Layout Shift (CLS > 0.1). Ao casar exatamente a geometria de CSS (paddings, margins, grid classes e aspect ratios), o conteúdo que chega do servidor simplesmente substitui o esqueleto sem mover 1 pixel da página.

---

## 4. Animação Shimmer e Acessibilidade

### Decisão
1. Implementar classe utilitária `.skeleton-shimmer` em CSS puro no `globals.css` ou via utilitário Tailwind:
   - Gradiente: `linear-gradient(90deg, #151515 0%, #222222 50%, #151515 100%)`.
   - `background-size: 200% 100%`.
   - Keyframe suave `translateX` ou `background-position` com duração de 1.5s linear/ease-in-out infinita.
2. Suporte estrito a `@media (prefers-reduced-motion: reduce)`:
   - A animação é pausada/removida, mantendo um fundo estático de baixa saturação (`bg-zinc-800`).
3. Semântica:
   - `role="status"`
   - `aria-busy="true"`
   - `aria-live="polite"`
   - `sr-only`: texto "Carregando conteúdo..." para usuários de leitor de tela.
