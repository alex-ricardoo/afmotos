# Research & Decision Record: SEO Técnico, Local e de Inventário

Este documento registra as pesquisas técnicas, análises de conformidade com as diretrizes do Google Search Central e decisões arquiteturais adotadas para a AF Motos.

---

## 1. Domínio Canônico e Tratamento de Variantes (WWW vs Não-WWW, HTTPS)

### Decision
Utilizar uma única URL canônica raiz oficial configurada via variável de ambiente `NEXT_PUBLIC_SITE_URL` (com fallback robusto para `https://aflocacoesevendas.com.br` ou domínio em produção). No Vercel/DNS, todo o tráfego HTTP e subdomínio `www` deve ser redirecionado via status 301/308 para a versão HTTPS canônica.

### Rationale
O Google trata `http://`, `https://`, `www.dominio.com.br` e `dominio.com.br` como sites completamente diferentes. Ter múltiplas versões acessíveis divide a autoridade de rastreamento (PageRank) e causa problemas de conteúdo duplicado.

### Alternatives Considered
- *Permitir que cada página descubra seu domínio no runtime a partir dos cabeçalhos da requisição (`Host` / `X-Forwarded-Host`)*: Rejeitado porque em ambientes de proxy reverso (Vercel/Cloudflare) isso pode gerar URLs canônicas com domínios de preview transitórios (`afmotos-git-preview.vercel.app`), arruinando a indexação.
- *Hardcode do domínio em todos os arquivos*: Rejeitado por violar o princípio de portabilidade de ambientes e impedir testes em staging.

### Consequences
Todas as funções geradoras de URLs absolutas (`getCanonicalUrl`, `getPublicMotorcycleUrl`, `sitemap.ts`) consumirão o helper centralizado `getBaseSiteUrl()`.

---

## 2. Bloqueio de Indexação em Ambientes de Preview e Staging (Vercel)

### Decision
Adicionar lógica no `app/layout.tsx` e no middleware/cabeçalhos HTTP para injetar `<meta name="robots" content="noindex, nofollow" />` e o cabeçalho `X-Robots-Tag: noindex, nofollow` sempre que o host atual contiver `*.vercel.app` ou a variável `VERCEL_ENV !== 'production'`.

### Rationale
Ambientes de preview da Vercel frequentemente são rastreados por bots de busca, gerando cópias duplicadas do site oficial no Google e canibalizando o tráfego do domínio principal.

### Alternatives Considered
- *Bloquear via robots.txt dinâmico*: Bom, mas insuficiente, pois o Google pode indexar a URL mesmo sem rastrear o conteúdo se ela receber links externos. A meta tag `noindex` no HTML é a forma mais segura recomendada pelo Google.

### Consequences
Previews de branches e Pull Requests nunca disputarão espaço com o site de produção no Google.

---

## 3. MetadataBase e Title Templates no Next.js App Router

### Decision
Definir `metadataBase: new URL(getBaseSiteUrl())` e `title: { default: 'AF Motos | Motos usadas e seminovas em Cabo de Santo Agostinho - PE', template: '%s | AF Motos' }` no `app/layout.tsx`. Cada página pública exportará títulos objetivos sem repetir a marca manualmente no final.

### Rationale
O Next.js App Router substitui `%s` automaticamente pelo título da página filha. Isso evita títulos duplicados ou truncados como `"Honda Fan 160 | AF Motos | AF Motos"`. O `metadataBase` garante que URLs relativas de imagens Open Graph e favicons sejam automaticamente convertidas em URLs absolutas válidas para bots.

### Alternatives Considered
- *Escrever títulos completos com o nome da loja em todas as páginas*: Propenso a erros de digitação e inconsistências quando o nome da loja for alterado em `site_settings`.

### Consequences
Páginas filhas precisam apenas fornecer o título do seu conteúdo (ex: `Motos Disponíveis`, `Honda CG 160 Start 2024`), simplificando o código e garantindo uniformidade.

---

## 4. Estratégia de Geração de Sitemap Dinâmico (`app/sitemap.ts`)

### Decision
Utilizar o recurso nativo de App Router `app/sitemap.ts` com busca assíncrona no Supabase das motos ativas (`status = 'AVAILABLE'`), com fallback seguro `try/catch` para retornar rotas estáticas caso o banco esteja indisponível durante o build/runtime.

### Rationale
1. O formato nativo do Next.js dispensa scripts complexos de pós-build.
2. Atualizações em motos (novos cadastros, edições de preço) refletem instantaneamente no `/sitemap.xml` através de revalidação controlada.
3. Permite incluir a data real de modificação (`lastModified = motorcycle.updated_at`).

### Alternatives Considered
- *Sitemap estático em `public/sitemap.xml`*: Exigiria deploy a cada nova moto inserida ou vendida. Inviável para uma loja ativa.
- *Plugins externos de sitemap*: Adicionam dependências desnecessárias quando o Next.js já fornece a API `MetadataRoute.Sitemap`.

### Consequences
O sitemap será sempre enxuto, preciso e atualizado em tempo real.

---

## 5. Regras de `robots.txt` (`app/robots.ts`)

### Decision
Implementar `app/robots.ts` com:
- `Allow: /`
- `Disallow: /admin/`
- `Disallow: /api/`
- `Disallow: /login`
- `Disallow: /auth/`
- `Disallow: /consulta-placa/`
- `Disallow: /contratos/`
- `Disallow: /recibos/`
- `Disallow: /propostas/`
- `Disallow: /*?*sort=`
- `Disallow: /*?*view=`
- `Sitemap: https://[dominio-oficial]/sitemap.xml`

### Rationale
Protege áreas privadas contra consumo desnecessário de orçamento de rastreamento (*crawl budget*) do Googlebot e impede a indexação de páginas administrativas e links gerados por parâmetros estéticos de ordenação/visualização.

### Alternatives Considered
- *Bloquear todos os query params com `Disallow: /*?*`*: Muito agressivo; poderia bloquear parâmetros essenciais de rastreamento de campanhas legítimas caso o Googlebot tente validar a página de aterrissagem. É melhor tratar filtros via `canonical` e `noindex, follow`.

### Consequences
Robôs de busca concentrarão seus recursos exclusivamente nas páginas de alto valor comercial e institucional.

---

## 6. Tratamento de Ciclo de Vida: Motos Ativas, Vendidas e Inativas

### Decision
Adotar a seguinte política de 3 estados:
1. **Ativa (`AVAILABLE`)**: HTTP 200, indexável, no sitemap, schema `Product/Offer (InStock)`.
2. **Vendida (`SOLD`)**: HTTP 200, badge visual "Vendido / Negociado", `robots: { index: false, follow: true }`, oferta desativada no schema, exibição de 3 motos semelhantes disponíveis, exclusão do sitemap prioritário.
3. **Oculta / Rascunho (`HIDDEN`)**: `notFound()` (HTTP 404) para visitantes não autenticados, excluída do sitemap e robots.

### Rationale
Se uma moto vendida retornar 404 imediatamente, links compartilhados em redes sociais ou salvos por clientes gerarão erro, frustrando o comprador e perdendo autoridade de links externos (*backlinks*). Manter a página com HTTP 200, aviso de venda e sugestões de estoque mantém o usuário navegando, enquanto o `noindex` avisa ao Google para remover suavemente o anúncio esgotado da SERP.

### Alternatives Considered
- *Redirecionamento 301 para a homepage*: Péssima prática ("soft 404" perante o Google) e confunde o usuário que clicou esperando ver uma moto específica.
- *Manter a moto vendida indexada indefinidamente com oferta ativa*: Viola as diretrizes de dados estruturados do Google (Merchant Center / Rich Results) e decepciona clientes que ligam buscando motos já vendidas.

### Consequences
Experiência do usuário sem links quebrados e catálogo do Google sempre sincronizado com o estoque real.

---

## 7. Parâmetros de Filtro do Catálogo vs URLs Canônicas

### Decision
A página de catálogo `/motos` responderá com canonical fixo para `https://[dominio-oficial]/motos`. Quando houver parâmetros de filtro (`?brand=Honda&minYear=2022`), a página injetará `robots: { index: false, follow: true }` nos metadados.

### Rationale
Permite que o usuário use filtros livremente sem gerar milhares de combinações de URLs duplicadas com conteúdo quase idêntico (*thin content*), que diluem a relevância da página principal de catálogo.

### Alternatives Considered
- *Criar páginas de destino estáticas para cada marca/categoria*: Válido para o futuro caso haja grande volume sustentado de motos de uma mesma marca (ex: mais de 10 motos Honda constantes). No momento, com estoque dinâmico e enxuto, criaria páginas vazias ou com apenas 1 moto, atraindo penalizações de *thin content*.

### Consequences
O Google ranqueará fortemente a URL `/motos` sem dispersão de autoridade.

---

## 8. Tipos de Schema.org: `LocalBusiness` vs `AutoDealer` vs `MotorcycleDealer`

### Decision
Utilizar `@type: "AutoDealer"` (subtipo oficial de `AutomotiveBusiness` e `LocalBusiness` no vocabulário Schema.org) para o markup institucional da AF Motos na Homepage e na página Sobre. Para o markup de motos individuais, utilizar `@type: "Product"` com `@type: "Offer"` e especificação `category: "Motorcycle"`.

### Rationale
1. O Google reconhece e valida explicitamente `AutoDealer` e `LocalBusiness` para rich snippets de negócios locais e conhecimento de entidade.
2. Para inventário de motos no Brasil, o Google suporta extensivamente a especificação `Product` com `Offer` (preço, disponibilidade, condição usada `UsedCondition`, moeda BRL). O tipo experimental `Vehicle` pode ser aninhado como tipo adicional, mas `Product` garante 100% de compatibilidade com os validadores do Google Search Central.

### Alternatives Considered
- *Usar apenas `Organization` genérico*: Perde todas as propriedades geográficas ricas de endereço local (`PostalAddress`, `GeoCoordinates`, `openingHoursSpecification`).

### Consequences
A AF Motos terá sua ficha de negócio e seus veículos compreendidos de forma ideal pelos algoritmos de busca e grafos de conhecimento.

---

## 9. Imagens Open Graph e Resolução de CDNs Remotas (ImgBB / Supabase)

### Decision
Utilizar a URL da imagem principal da moto diretamente nas meta tags `og:image` e `twitter:image`. As URLs de imagem já estão configuradas no `next.config.ts` (`i.ibb.co`, `image.ibb.co`, `**.supabase.co`). Caso a moto não possua fotos cadastradas, aplicar a imagem padrão da logo institucional `/logo.jpg`.

### Rationale
1. A imagem da moto é o principal fator de atração visual em redes como WhatsApp e Facebook.
2. CDNs como ImgBB e Supabase Storage já entregam imagens otimizadas via HTTPS com suporte a crawlers.
3. Evita custos excessivos de processamento e latência de geração dinâmica de imagens via `@vercel/og` para um catálogo de rápida rotatividade.

### Alternatives Considered
- *Gerar imagens OG dinâmicas com canvas no servidor*: Adiciona complexidade, aumenta tempo de resposta (TTFB) e pode falhar por bloqueios de CORS/timeout ao buscar imagens remotas de motos.

### Consequences
Compartilhamento ultrarrápido, leve e altamente confiável.

---

## 10. Checklist Manual: Google Search Console e Google Meu Negócio

### Decision
Não tentar automatizar chamadas de API do Google Search Console ou Google Business Profile via código, mas fornecer um guia detalhado passo a passo no `quickstart.md` para o administrador validar a propriedade via DNS/HTML tag e enviar o sitemap após o deploy.

### Rationale
A verificação de domínio e a reivindicação de local físico no Google Meu Negócio exigem autenticação do proprietário e correspondência postal/telefônica que não pertencem ao ciclo de build da aplicação web.

### Consequences
Procedimentos operacionais claros e seguros para a equipe da loja executar após a publicação da feature.
