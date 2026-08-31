# Feature Specification: SEO Técnico, Local e de Inventário — AF Motos

**Feature Branch**: `020-seo-tecnico-local-inventario`  
**Created**: 2026-08-31  
**Status**: Draft  
**Input**: User description: "Feature: SEO Técnico, Local e de Inventário — AF Motos"

---

## 1. Visão Geral e Contexto de Negócio

A **AF Motos** atua no segmento de compra, venda e intermediação de motocicletas seminovas e usadas, sediada em Cabo de Santo Agostinho - PE (Rua Milton Adolfo de Jesus, 68, Loja, São Francisco, CEP 54350-655), atendendo compradores e vendedores de Cabo de Santo Agostinho, Recife e Região Metropolitana de Pernambuco.

Para maximizar a captação orgânica de clientes qualificados sem custos com anúncios pagos contínuos, o site precisa ser facilmente descoberto e corretamente interpretado pelos motores de busca (Google, Bing) e redes sociais (WhatsApp, Instagram, Facebook).

O objetivo desta especificação é estruturar toda a arquitetura de **SEO Técnico, SEO Local e SEO de Inventário de Veículos**, garantindo:
1. Indexação veloz e precisa das páginas públicas e motocicletas ativas.
2. Apresentação visual atraente nos resultados de busca (SERP) e no compartilhamento social.
3. Tratamento seguro de páginas privadas (admin, relatórios, contratos, consultas de placa e APIs), mantendo-as 100% invisíveis aos robôs de busca.
4. Schema estruturado padronizado (JSON-LD) para a empresa (`AutoDealer`/`LocalBusiness`), produtos (`Product`/`Offer`), navegação (`BreadcrumbList`) e dúvidas (`FAQPage`).
5. Proteção rigorosa de dados pessoais e sensíveis (LGPD) em metadados e sitemaps.
6. Zero conteúdo duplicado ou links quebrados por filtros e ordenações do catálogo.

---

## 2. Princípios Obrigatórios de SEO e Engenharia

1. **Conteúdo Real e Fidedigno**: O SEO e os dados estruturados devem refletir estritamente o conteúdo visível na página. Proibido forjar preços, avaliações, horários ou estoques inexistentes.
2. **Sem Keyword Stuffing**: Descrições e títulos devem ser naturais, persuasivos e orientados ao usuário humano.
3. **Servidor First (SSR/SSG/ISR)**: Todos os metadados, tags Open Graph, canonicals e JSON-LD devem ser renderizados no servidor via recursos nativos do Next.js App Router (`metadata`, `generateMetadata`, `robots.ts`, `sitemap.ts`).
4. **Proteção Total de Rotas Privadas**: O painel administrativo (`/admin/**`), rotas de autenticação (`/login`), APIs (`/api/**`) e documentos internos (`/contratos`, `/recibos`, `/propostas`) NUNCA podem constar no sitemap e devem ser bloqueados no `robots.txt` e conter diretiva `noindex, nofollow`.
5. **Segurança e LGPD**: Nunca expor placas completas, RENAVAM, chassi, dados de clientes, leads, telefones de terceiros ou custos internos em metadados, imagens abertas ou schemas.
6. **Estratégia Anti-Duplicação de URLs**: Parâmetros de filtro e busca no catálogo (`/motos?brand=...&sort=...`) recebem canonical para a página base e diretiva de rastreio controlada (`noindex, follow`).
7. **Tratamento de Estoque Esgotado**: Motos vendidas permanecem acessíveis com indicação visual clara, sugestões de similares e cabeçalho `noindex, follow` para desindexação orgânica suave sem quebra de links externos.

---

## 3. User Scenarios & Testing (Histórias de Usuário Priorizadas)

### User Story 1 - Descoberta Local e Institucional no Google (Priority: P1)

Como uma pessoa de Cabo de Santo Agostinho ou Região Metropolitana de Pernambuco buscando lojas confiáveis de motos usadas, quero encontrar a AF Motos no Google com nome, endereço, horário e canais de contato corretos, para que eu possa visitar a loja ou iniciar uma conversa no WhatsApp.

**Why this priority**: Estabelece a autoridade e presença de marca local da AF Motos, atraindo tráfego com alta intenção de visita e negociação.

**Independent Test**: Pode ser validado inspecionando o HTML da homepage e página Sobre, confirmando meta tags completas, canonical absoluto, Open Graph e bloco JSON-LD `AutoDealer` validado no *Google Rich Results Test*.

**Acceptance Scenarios**:
1. **Given** um usuário buscando no Google por "loja de motos em Cabo de Santo Agostinho", **When** o Googlebot indexar a homepage, **Then** o snippet exibirá o título e descrição oficiais da loja com indicação da cidade/UF e telefone de contato.
2. **Given** a página institucional "Sobre Nós", **When** acessada publicamente, **Then** conterá metadados próprios, breadcrumb e dados consistentes com as configurações de `site_settings`.

---

### User Story 2 - Descoberta de Motos Específicas no Catálogo (Priority: P1)

Como um comprador buscando um modelo específico (ex: "Honda CG 160 Start 2024"), quero encontrar a página do anúncio da AF Motos diretamente na pesquisa do Google com fotos, preço em reais, ano, quilometragem e localização.

**Why this priority**: A busca por modelo/ano é a principal fonte de leads com alta propensão de compra imediata.

**Independent Test**: Testável gerando a metadata e JSON-LD de qualquer moto ativa via `generateMetadata` e validando o `Product`/`Offer` no Schema Markup Validator.

**Acceptance Scenarios**:
1. **Given** uma moto ativa cadastrada no estoque (ex: Honda CG 160 Fan 2023), **When** a página `/motos/[slug]` for renderizada, **Then** conterá `<title>` exclusivo no formato `[Marca] [Modelo] [Ano] usada à venda em Cabo de Santo Agostinho | [Nome da Loja]`, canonical apontando para `/motos/[slug]`, meta description com ano/km/cor e JSON-LD de Produto com Preço em BRL e disponibilidade `InStock`.
2. **Given** uma moto sem fotos customizadas cadastradas, **When** a metadata for gerada, **Then** o sistema aplicará a imagem padrão institucional como fallback seguro de Open Graph.

---

### User Story 3 - Compartilhamento Rico em Redes Sociais e WhatsApp (Priority: P1)

Como um cliente ou vendedor compartilhando o link de uma moto no WhatsApp, Instagram ou Facebook, quero visualizar uma prévia profissional contendo a foto principal nítida, título com marca/modelo/ano e descrição resumida da moto.

**Why this priority**: O WhatsApp é o principal canal de vendas da AF Motos; links com preview correto aumentam exponencialmente a taxa de abertura (CTR) e confiança.

**Independent Test**: Validar as meta tags `og:image`, `og:title`, `og:description`, `twitter:card` e `og:url` em ambiente simulado ou via Facebook Sharing Debugger.

**Acceptance Scenarios**:
1. **Given** o link canônico `https://dominio.com.br/motos/honda-biz-125-2023`, **When** colado no chat do WhatsApp, **Then** o crawler do WhatsApp receberá as tags Open Graph com URL absoluta da imagem principal (ImgBB/Supabase), título formatado e descrição comercial.
2. **Given** uma imagem hospedada em CDN externa, **When** montada na tag Open Graph, **Then** o protocolo e domínio serão absolutos e seguros (HTTPS).

---

### User Story 4 - Rastreamento e Sitemap Automatizado para Motores de Busca (Priority: P2)

Como administrador do sistema, quero que o site gere e atualize automaticamente o arquivo `/sitemap.xml` e `/robots.txt` a partir do banco de dados, incluindo apenas páginas públicas e motos ativas, para que o Google descubra novos anúncios instantaneamente.

**Why this priority**: Automatiza o ciclo de vida de indexação sem demandar intervenção manual a cada moto cadastrada.

**Independent Test**: Acessar `http://localhost:3000/sitemap.xml` e `http://localhost:3000/robots.txt` e verificar conformidade estrutural com os padrões do protocolo Sitemap 0.9 e RFC Robots.

**Acceptance Scenarios**:
1. **Given** a publicação de uma nova moto no estoque, **When** o endpoint `/sitemap.xml` for consultado, **Then** a URL `/motos/[slug]` estará presente com `<lastmod>` preenchido com a data de atualização mais recente.
2. **Given** uma moto com status `SOLD` (Vendida) ou `HIDDEN` (Rascunho), **When** o sitemap for gerado, **Then** sua URL individual NÃO constará na lista de URLs prioritárias de estoque.
3. **Given** o arquivo `/robots.txt`, **When** inspecionado por robôs de busca, **Then** conterá regras `Disallow` claras para `/admin/`, `/api/`, `/login/` e indicação da URL absoluta do `sitemap.xml`.

---

### User Story 5 - Tratamento Amigável e SEO de Motos Vendidas (Priority: P2)

Como um usuário que encontrou um link antigo de uma moto já vendida, quero ser informado com clareza de que o veículo foi negociado e ver imediatamente outras motos similares disponíveis, para que eu continue navegando sem encontrar uma página de erro 404 abrupta.

**Why this priority**: Preserva tráfego residual de links externos, evita frustração e redireciona a intenção de compra para motos disponíveis.

**Independent Test**: Acessar a URL de uma moto com status `SOLD` e confirmar badge visual "Vendido", ausência de formulário de proposta inútil, listagem de 3 motos relacionadas e cabeçalho `noindex, follow`.

**Acceptance Scenarios**:
1. **Given** uma moto marcada como `SOLD`, **When** sua página `/motos/[slug]` for acessada, **Then** a página responderá HTTP 200, conterá meta tag `robots: { index: false, follow: true }`, schema de oferta marcado como `OutOfStock` ou omitido, e exibirá a seção de "Motos Semelhantes em Estoque".
2. **Given** a página pública `/motos-vendidas`, **When** indexada pelos buscadores, **Then** servirá como portfólio público indexável de credibilidade e histórico de transações bem-sucedidas da loja.

---

### User Story 6 - Proteção e Blindagem de Páginas Privadas e Dados Sensíveis (Priority: P1)

Como proprietário da AF Motos, quero ter total garantia de que páginas de clientes, relatórios financeiros, contratos em PDF, consultas de placa e painéis administrativos nunca apareçam nos resultados do Google ou exponham dados privados.

**Why this priority**: Mandatório por segurança, compliance com a LGPD e privacidade comercial.

**Independent Test**: Inspecionar os cabeçalhos de resposta e tags de todas as rotas em `/admin/**`, `/api/**` e endpoints de download, verificando `X-Robots-Tag: noindex, nofollow, noarchive`.

**Acceptance Scenarios**:
1. **Given** uma tentativa de rastreamento em `/admin/clientes` ou `/admin/relatorios`, **When** o crawler ler a página, **Then** o arquivo `robots.txt` bloqueará a pasta e a resposta HTTP incluirá meta tags `noindex, nofollow`.
2. **Given** o schema JSON-LD de qualquer moto ou página pública, **When** inspecionado, **Then** não conterá placa completa, CPF, RENAVAM, chassi ou custos de aquisição/despesas.

---

### User Story 7 - Otimização On-Page e Hierarquia Visual de Páginas de Serviços (Priority: P3)

Como um cliente buscando vender ou consignar sua moto em Pernambuco, quero encontrar páginas dedicadas ("Venda sua Moto" / "Anuncie sua Moto") com explicações claras do processo, etapas simples e FAQ visível.

**Why this priority**: Aumenta a captação de estoque direto com proprietários locais.

**Independent Test**: Verificar as rotas `/anunciar-sua-moto` e `/vender-minha-moto` com `H1` semântico, textos estruturados e FAQ Schema válido.

**Acceptance Scenarios**:
1. **Given** a página `/vender-minha-moto`, **When** renderizada, **Then** conterá meta tags sobre avaliação FIPE e compra à vista, e FAQ visível estruturado com Schema `FAQPage`.
2. **Given** links legados como `/venda-sua-moto` e `/consignar-moto`, **When** acessados, **Then** manterão redirecionamentos 308/301 limpos para as páginas oficiais correspondentes.

---

## 4. Requisitos Funcionais do Sistema

### 4.1 Configuração Centralizada de SEO (`lib/seo/`)
- **FR-001**: O sistema MUST centralizar todas as regras de domínio, canônicos, templates de título e schemas em um módulo coeso sob `lib/seo/`.
- **FR-002**: O sistema MUST resolver a URL canônica base a partir de `process.env.NEXT_PUBLIC_SITE_URL`, com fallback seguro e sanitização contra barras finais (`trailing slashes`).
- **FR-003**: O sistema MUST injetar `metadataBase` no `app/layout.tsx` a partir da URL canônica oficial.
- **FR-004**: O sistema MUST suportar template de título padronizado: `%s | AF Motos` (ou nome configurado em `site_settings`).

### 4.2 Metadados e Open Graph Dinâmicos
- **FR-005**: Todas as rotas públicas MUST possuir função `generateMetadata` ou objeto `metadata` exportado com `title`, `description`, `alternates.canonical`, `openGraph` e `twitter`.
- **FR-006**: Para páginas de detalhe de moto (`/motos/[slug]`), o sistema MUST gerar metadados dinâmicos extraindo marca, modelo, ano, quilometragem, cor e preço da moto, utilizando sua imagem principal cadastrada como imagem Open Graph (com fallback para a logo da loja).
- **FR-007**: Para páginas de catálogo com filtros de busca ativos (`/motos?brand=...`), o sistema MUST definir canonical apontando para a rota base `/motos` e adicionar `robots: { index: false, follow: true }` para evitar duplicação e canibalização de palavras-chave.

### 4.3 Arquivos Especiais de Rastreamento
- **FR-008**: O sistema MUST implementar `app/robots.ts` gerando regras `Allow: /` para conteúdo público e `Disallow` explícito para `/admin/`, `/api/`, `/login/`, `/contratos/`, `/recibos/`, `/propostas/` e parâmetros de busca desnecessários, apontando para o sitemap canônico.
- **FR-009**: O sistema MUST implementar `app/sitemap.ts` retornando dinamicamente:
  - Homepage (`/`) com prioridade `1.0` e frequência `daily`.
  - Catálogo de Motas (`/motos`) com prioridade `0.9` e frequência `daily`.
  - Motos ativas em estoque (`/motos/[slug]`) com prioridade `0.8`, frequência `weekly` e `<lastmod>` vindo de `motorcycles.updated_at`.
  - Páginas de serviços (`/anunciar-sua-moto`, `/vender-minha-moto`, `/aluguel`) com prioridade `0.7`.
  - Páginas institucionais (`/sobre`, `/motos-vendidas`, `/politica-de-privacidade`) com prioridade `0.5`.
- **FR-010**: O sitemap MUST tratar falhas de conexão com o banco de dados retornando com segurança as rotas estáticas sem quebrar o build ou a resposta HTTP.

### 4.4 Dados Estruturados (Schema.org / JSON-LD)
- **FR-011**: O sistema MUST implementar um componente seguro `JsonLd` para serializar e injetar dados estruturados via `<script type="application/ld+json">` com sanitização contra caracteres maliciosos.
- **FR-012**: O sistema MUST gerar schema `AutoDealer` (ou `LocalBusiness`) na Homepage e página Sobre com os dados reais da AF Motos (Razão/Nome Fantasia, Endereço Postal em Cabo de Santo Agostinho, Coordenadas se disponíveis, Telefone/WhatsApp, Horário de Funcionamento e Redes Sociais).
- **FR-013**: O sistema MUST gerar schema `Product` e `Offer` em cada página de moto ativa, com moeda `BRL`, preço numérico válido, condição `UsedCondition`, disponibilidade `InStock` e imagens absolutas.
- **FR-014**: O sistema MUST gerar schema `BreadcrumbList` em todas as páginas públicas profundas (Catálogo, Detalhes da Moto, Venda sua Moto, Sobre).
- **FR-015**: O sistema MUST omitir propriedades vazias, nulas ou opcionais (ex: CNPJ, latitude/longitude quando não cadastrados) sem quebrar a validação estrutural do schema.

### 4.5 Ciclo de Vida e Estados de Inventário
- **FR-016**: Motos com status `AVAILABLE` MUST ser 100% indexáveis, presentes no sitemap e com schema `Offer.availability = InStock`.
- **FR-017**: Motos com status `SOLD` MUST retornar status HTTP 200, receber `noindex, follow`, ter oferta removida ou marcada como `OutOfStock`, e exibir grade com até 3 motos ativas similares em estoque.
- **FR-018**: Motos com status `HIDDEN` ou rascunhos MUST acionar `notFound()` (HTTP 404) para visitantes não autenticados e NUNCA constar em sitemaps ou listas públicas.

---

## 5. Entidades e Mapeamento de Dados

| Entidade | Campos Utilizados no SEO | Origem / Tabela | Regras e Tratamentos |
| :--- | :--- | :--- | :--- |
| **Site Settings** | `site_name`, `whatsapp_phone`, `contact_email`, `address`, `settings.address`, `settings.businessHours`, `settings.socialLinks`, `settings.branding` | `site_settings` | Fallbacks seguros via `CONSTANTS` e `lib/site-settings.ts`. CNPJ omitido se nulo. |
| **Motocicleta** | `slug`, `brand`, `model`, `version`, `year_manufacture`, `year_model`, `price`, `mileage`, `color`, `fuel`, `description`, `status`, `updated_at` | `motorcycles` | Placa, RENAVAM e Chassi NUNCA expostos. Preço formatado em BRL no front e numérico no JSON-LD. |
| **Imagens da Moto**| `public_url`, `display_url`, `storage_path`, `is_primary`, `alt_text`, `sort_order` | `motorcycle_images` | Imagem com `is_primary` ou primeira na ordem de exibição é utilizada no Open Graph e Schema. |
| **Diferenciais** | `name`, `slug` | `motorcycle_features` | Utilizados para enriquecer a descrição da moto e o conteúdo semântico on-page. |

---

## 6. Critérios de Sucesso e Métricas Mensuráveis

- **SC-001**: 100% das páginas públicas principais (`/`, `/motos`, `/motos/[slug]`, `/sobre`, `/anunciar-sua-moto`, `/vender-minha-moto`, `/motos-vendidas`, `/politica-de-privacidade`) possuem `<title>` único, `<meta name="description">` e `<link rel="canonical">` válido.
- **SC-002**: 100% dos schemas JSON-LD gerados (`AutoDealer`, `Product`, `Offer`, `BreadcrumbList`, `FAQPage`) passam sem erros críticos no *Google Rich Results Test* e no *Schema Markup Validator*.
- **SC-003**: 0% de exposição de rotas administrativas (`/admin/**`), APIs (`/api/**`) ou dados privados no sitemap ou resultados públicos indexados.
- **SC-004**: O endpoint `/sitemap.xml` responde com status 200 e tempo de geração de servidor inferior a 500ms em condições normais de catálogo.
- **SC-005**: 100% das prévias de links de motos no WhatsApp e redes sociais exibem foto nítida, título com marca/ano e texto descritivo.
- **SC-006**: Score de SEO no Google Lighthouse / PageSpeed Insights acima de 95 em todas as rotas públicas principais.

---

## 7. Premissas e Limitações

1. **Domínio Oficial**: As URLs canônicas em produção dependerão da correta configuração da variável de ambiente `NEXT_PUBLIC_SITE_URL`.
2. **Ambiente de Homologação / Vercel Preview**: Deploys em URLs temporárias (`*.vercel.app`) devem aplicar automaticamente cabeçalho ou meta tag `noindex` para evitar contaminação do índice do Google.
3. **Google Search Console e Perfil de Empresa**: A verificação de propriedade no Google Search Console e o cadastro no Google Meu Negócio são etapas operacionais humanas executadas via checklist após o deploy.
4. **Sem Promessa Mágica de Ranking**: A especificação garante a infraestrutura técnica e semântica perfeita exigida pelo Google Search Central, mas a posição final nos resultados dependerá de concorrência, autoridade de domínio e relevância de mercado.
