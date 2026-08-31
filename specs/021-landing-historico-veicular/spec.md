# Feature Specification: Landing Page Pública — Histórico Veicular para Motos

**Feature Branch**: `021-landing-historico-veicular`  
**Created**: 2026-08-31  
**Status**: Draft (Specification Ready for Review)  
**Input**: User description: "Landing Page Pública de Alta Conversão para Histórico Veicular e Consulta Cautelar Digital com precificação configurável via painel administrativo, captação via WhatsApp, placa Mercosul estilizada na hero, mockup ilustrativo de laudo, SEO técnico/local e conformidade rigorosa com LGPD."

---

## 1. Visão Geral e Contexto de Negócio

A **AF Motos** atua no mercado de compra, venda e intermediação de motocicletas seminovas e usadas em Cabo de Santo Agostinho - PE e Região Metropolitana de Recife. Para agregar valor ao ecossistema de clientes, a loja passará a comercializar um serviço de **Histórico Veicular / Consulta Cautelar Digital** para compradores e vendedores de motos.

Com apenas a placa da motocicleta, o cliente poderá solicitar um relatório estruturado antes de fechar negócio, prevenindo prejuízos com motocicletas que possuam restrições judiciais, gravames financeiros, débitos ocultos de IPVA/multas, histórico de roubo/furto, indícios de sinistro, histórico de leilão, recalls pendentes ou registros em locadoras.

O serviço terá preço sugerido inicial de **R$ 39,99**, sendo 100% gerenciável no painel administrativo (`site_settings`), sem necessidade de novo deploy para reajustes de preço, atualizações de textos ou desativação temporária da oferta.

### 1.1 Objetivos Principais
1. **Atração e Conversão Mobile-First**: Apresentar uma landing page moderna, rápida e confiável na rota `/historico-veicular`, focada no público comprador de motos que navega via smartphone e redes sociais (Instagram/WhatsApp).
2. **Captação Segura via WhatsApp**: Conduzir o cliente para o atendimento humano oficial da AF Motos com mensagem pré-preenchida contendo a placa normalizada, sem chamar APIs pagas nem coletar dados sensíveis no site público.
3. **Gestão Flexível e Posicionamento Ético**: Permitir que o proprietário/administrador configure valores, textos promocionais, status ativo/inativo e mensagens de WhatsApp, impedindo alegações de "mais barato do mercado" sem comprovação cadastrada.
4. **Transparência e Confiança**: Deixar explícito que o relatório é uma ferramenta de apoio analítico baseada nas bases integradas disponíveis e que **não substitui** vistoria mecânica presencial ou conferência física de documentos.
5. **SEO & Autoridade Orgânica**: Implementar SEO técnico completo (metadata, Open Graph, Sitemap dinâmico, JSON-LD Schema `Service`, `Offer`, `FAQPage`, `BreadcrumbList`) com aderência aos princípios da Constituição da AF Motos.

---

## 2. Personas e Proposta de Valor

### 2.1 Personas
- **Comprador Cuidadoso de Moto Usada (Público Principal)**: Encontrou uma moto em classificados ou redes sociais e deseja checar se há multas, gravames, restrições financeiras ou leilão antes de pagar o sinal.
- **Vendedor / Proprietário de Moto**: Deseja demonstrar a boa procedência de sua motocicleta para valorizar o preço de venda e acelerar a negociação com potenciais compradores.
- **Administrador / Atendente da AF Motos**: Recebe o lead qualificado no WhatsApp com a placa já digitada, orienta a forma de pagamento (ex.: Pix), executa a consulta pelo painel `/admin/consulta-placa` e envia o PDF gerado ao cliente.

### 2.2 Proposta de Valor
> *"Antes de comprar uma moto, consulte o histórico veicular. Com apenas a placa, você recebe um relatório organizado para analisar débitos, multas, gravames, leilão, roubo/furto e restrições com mais segurança."*

---

## 3. Fluxo de Conversão e Arquitetura de Conversão

### 3.1 Fluxo do MVP (Sem Gateway Online nem Chamada Externa Pública)

```text
[Usuário acessa /historico-veicular]
          │
          ├──> Compreende os benefícios, preço (R$ 39,99) e escopo do relatório
          │
          ├──> [Opção A: Digita Placa na Hero] ──> Validação no Browser (Mercosul / Antiga)
          │                                           │
          │                                           ▼
          │                            Clica em "Solicitar histórico pelo WhatsApp"
          │                                           │
          │                                           ▼
          │                          Abre WhatsApp (wa.me/55...) com msg:
          │                          "Olá! Quero solicitar o Histórico Veicular da moto com placa [ABC-1234]..."
          │
          └──> [Opção B: Não possui placa / Dúvidas]
                                           │
                                           ▼
                             Clica em "Tirar dúvidas pelo WhatsApp"
                                           │
                                           ▼
                             Abre WhatsApp com mensagem institucional geral
                                           │
                                           ▼
                     [Atendimento Humano AF Motos]
                     - Confirma dados e pagamento (Pix manual)
                     - Executa consulta interna via /admin/consulta-placa
                     - Envia PDF gerado ao cliente
```

### 3.2 Regras de Entrada e Validação de Placa no Navegador
- **Formatos Aceitos**:
  - Padrão Antigo / Cinza: `ABC-1234` ou `ABC1234`
  - Padrão Mercosul: `ABC1D23`
- **Validação Local Imediata**: Ocorre estritamente no cliente com funções utilitárias isoladas (`normalizeBrazilianPlate`, `isValidBrazilianPlate`).
- **Nenhum Envio Prévio**: A placa digitada não é enviada para backend, não dispara requisição à API Brasil, não gera cookie de rastreamento e não é transmitida para pixels de marketing (Meta Pixel, Google Ads, TikTok).
- **Tratamento de Placa Inválida**: Caso o usuário insira formato incorreto e clique no botão de solicitação com placa, exibe mensagem acessível de erro: *"Informe uma placa brasileira válida para continuar."* sem travar a navegação.

---

## 4. Estrutura Visual e Conteúdo da Landing Page (`/historico-veicular`)

A página é mobile-first, com alto contraste, paleta escura padrão da loja (`zinc-950`), toques em ouro/âmbar (`#c9a44c`, `#e3c56c`), verde WhatsApp oficial (`#25D366`), tipografia moderna (Inter / Outfit) e divisões semânticas claras:

### 4.1 Hero Section
- **Badge Superior**: *"Proteção & Procedência Veicular"*
- **Título Principal (`<h1>`)**: *"Antes de comprar uma moto, consulte o histórico veicular."*
- **Subtítulo**: *"Com apenas a placa, você recebe um relatório completo para analisar restrições, leilão, roubo/furto, gravames, débitos, recall e muito mais."*
- **Badge de Preço em Destaque**: *"Histórico veicular completo por R$ 39,99"* (ou label configurado).
- **Elemento Central Interativo**: Placa Mercosul Estilizada (faixa azul superior com bandeira do Brasil/Mercosul, letras pretas em fonte automotiva, efeito de relevo sutil e responsiva em telas pequenas).
- **Formulário Simples de Conversão**:
  - Campo de entrada com máscara visual de placa (`placeholder="Ex: ABC1D23"`).
  - Botão Primário CTA: *"Solicitar histórico pelo WhatsApp"* (com ícone WhatsApp).
  - Link / Botão Secundário: *"Tirar dúvidas no WhatsApp"* ou *"Ver o que o relatório mostra"*.
- **Microcopy de Confiança**: *"A consulta é realizada após confirmação do atendimento. Nenhum valor é cobrado no site."*

### 4.2 Bloco "Você só precisa da placa" (3 Passos Rápidos)
1. **Informe a placa**: Digite a placa da moto que deseja consultar.
2. **Fale com a AF Motos no WhatsApp**: Confirmamos a placa e orientamos a solicitação de forma ágil e segura.
3. **Receba seu relatório**: Enviamos o documento organizado para você analisar com calma antes de negociar.

### 4.3 Bloco "O que você pode consultar" (Grid de Cards com Ícones)
Itens descritos com linguagem humana e ressalvas de disponibilidade:
- **Roubo e Furto**: Ocorrências ativas e histórico policial registrado.
- **Leilão e Sinistro**: Apontamentos de leilões anteriores e indícios de sinistro.
- **Gravames e Financiamento**: Restrições financeiras e alienação fiduciária vigentes.
- **Restrições Judiciais (Renajud)**: Bloqueios administrativos ou ordens judiciais.
- **Débitos e Multas**: IPVA, licenciamento, Renainf e infrações estaduais disponíveis.
- **Comunicação de Venda & Recall**: Chamados de fábrica e registros de transferência.
- **Dados Cadastrais & FIPE**: Marca, modelo, versão, cor, cilindradas e valor de referência de mercado.
- **Histórico Adicional (quando disponível)**: Registros de proprietários anteriores, histórico de anúncios e quilometragens pretéritas catalogadas.

### 4.4 Bloco "Por que consultar antes de fechar negócio"
Quatro cards focados em prevenção de prejuízo sem alarmismo falso:
- **Mais segurança na negociação**: Evite surpresas com bloqueios ou pendências de terceiros.
- **Mais clareza sobre o histórico**: Entenda o passado da moto antes de transferir qualquer valor.
- **Mais poder de barganha**: Use informações concretas de débitos ou mercado para negociar o preço justo.
- **Decisão com tranquilidade**: Tenha um relatório legível em PDF para guardar como comprovante.

### 4.5 Bloco de Preço e Oferta Comercial
- Card de destaque com borda dourada âmbar e visual premium.
- Título: *"Histórico Veicular Completo"*
- Preço dinâmico vindo de `site_settings`: `R$ 39,99`.
- Subtítulo de posicionamento: *"Um dos melhores preços para consulta veicular na região"* (ou configurado).
- Checklist de valor incluído:
  - Consulta por placa Mercosul ou antiga
  - Relatório visual em PDF de fácil leitura
  - Principais alertas destacados (Roubo, Leilão, Gravame)
  - Atendimento direto com a equipe da AF Motos
- Botão CTA: *"Quero consultar uma moto"*
- Nota legal: *"Valor e disponibilidade do serviço sujeitos a atualização pela AF Motos."*

### 4.6 Bloco "Como Funciona o Atendimento"
Etapas transparentes explicando o motivo do fluxo assistido:
- *"Realizamos a confirmação dos dados pelo WhatsApp para assegurar que a placa informada esteja correta e evitar consultas desnecessárias."*

### 4.7 Mockup Visual do Relatório (Exemplo Ilustrativo)
- Representação gráfica simplificada em HTML/CSS de um laudo (marca `HONDA CG 160 FAN`, placa fictícia `ABC1D23`, status `Sem pendências críticas de roubo/furto`, débitos quitados, tabela FIPE de referência).
- Tag destacada: **"Exemplo Ilustrativo — Dados Fictícios"**.
- Otimizado para não gerar imagens pesadas (renderizado via componentes Tailwind leves, sem travar o LCP).

### 4.8 Bloco de Transparência e Limitações do Serviço
- Texto obrigatório: *"O relatório de histórico veicular reúne informações disponibilizadas por bases de dados públicas e privadas integradas na data da consulta. Ele serve como ferramenta de auxílio e decisão, mas não substitui a vistoria mecânica presencial, conferência de documentos e avaliação física da motocicleta."*
- Bullets explicativos reforçando responsabilidade e boas práticas de compra.

### 4.9 Seção de Perguntas Frequentes (FAQ)
Accordion acessível e com dados estruturados `FAQPage`:
1. *O que preciso informar para solicitar o histórico?* (Apenas a placa da moto).
2. *O que a consulta verifica?* (Dados cadastrais, débitos, gravames, leilão, roubo/furto e restrições conforme bases disponíveis).
3. *O relatório garante que a moto não tem problemas mecânicos?* (Não. O histórico é documental/cadastral e não substitui vistoria física de um mecânico).
4. *Quanto custa e como faço o pagamento?* (Custa R$ 39,99, pago de forma combinada no WhatsApp com envio do comprovante).
5. *Em quanto tempo recebo o relatório?* (Após confirmação no WhatsApp, nossa equipe realiza a consulta e envia o PDF imediatamente).
6. *Posso consultar outros veículos além de motos?* (O atendimento da AF Motos é especializado em motos, mas podemos avaliar consultas de outros veículos sob demanda).
7. *A AF Motos guarda a placa que digitei no site?* (Não. A digitação na página serve apenas para montar sua mensagem de WhatsApp).

### 4.10 Seção CTA Final
- Chamada forte: *"Vai comprar ou vender uma moto? Consulte o histórico antes de fechar negócio."*
- Botões duplos: *"Solicitar pelo WhatsApp"* e *"Tirar dúvidas"*.

---

## 5. Configurações Administrativas (`site_settings`)

O serviço é configurado dentro da tabela singleton `site_settings`, sob o nó JSONB `settings.vehicleHistory`.

### 5.1 Campos Configuráveis

| Campo | Tipo | Padrão | Descrição |
| :--- | :--- | :--- | :--- |
| `isEnabled` | `boolean` | `true` | Ativa/desativa a exibição pública da landing page e links de menu |
| `price` | `number` | `39.99` | Preço numérico em Reais (BRL), estritamente positivo |
| `currency` | `string` | `'BRL'` | Código da moeda ISO |
| `priceLabel` | `string` | `'Consulta completa por R$ 39,99'` | Texto curto de apoio ao preço |
| `positioningMode` | `enum` | `'COMPETITIVE'` | Modo: `'COMPETITIVE'`, `'REGIONAL_BEST'`, `'SPECIAL_OFFER'`, `'CHEAPEST_MARKET'`, `'CUSTOM'` |
| `customPositioningText` | `string?` | `null` | Texto personalizado quando modo `CUSTOM` |
| `claimEvidenceText` | `string?` | `null` | Texto de comprovação obrigatório se modo for `'CHEAPEST_MARKET'` |
| `claimEvidenceDate` | `string?` | `null` | Data da comprovação de mercado (ISO Date) |
| `whatsappPhoneOverride` | `string?` | `null` | Número específico para histórico (se diferente do WhatsApp geral) |
| `whatsappMessageTemplate`| `string` | Template padrão | Mensagem pré-formatada com interpolação de placa |
| `heroTitle` | `string` | Template padrão | Título customizado da Hero |
| `heroSubtitle` | `string` | Template padrão | Subtítulo customizado da Hero |
| `disclaimerText` | `string` | Template padrão | Texto legal de limitações |
| `isPublishedInNav` | `boolean` | `true` | Exibe link no Header e Footer |

### 5.2 Regras de Validação Administrativa
- **Validação de Preço**: O valor não pode ser negativo ou zero quando `isEnabled = true`.
- **Trava Ética de Publicidade Comparativa**: A opção *"Mais barato do mercado"* (`CHEAPEST_MARKET`) **só pode ser salva** se os campos `claimEvidenceText` e `claimEvidenceDate` estiverem preenchidos com pesquisa comprovada. Se vazios, o formulário bloqueia a gravação ou reverte para o fallback seguro `'COMPETITIVE'`.
- **Sanitização de Strings**: Todos os campos de texto passam por `trim()` e remoção de tags HTML/scripts para prevenir XSS.

---

## 6. Integração com WhatsApp e Formatação de Mensagens

O helper de WhatsApp reutiliza e estende as funções de `lib/utils/whatsapp.ts`.

### 6.1 URLs Geradas

1. **Solicitação com Placa (CTA Principal da Hero ou Preço)**:
```text
https://wa.me/5581985901175?text=Ol%C3%A1!%20Quero%20solicitar%20o%20Hist%C3%B3rico%20Veicular%20da%20moto%20com%20placa%20ABC-1234.%20Vi%20a%20consulta%20por%20R%24%2039%2C99%20no%20site%20e%20gostaria%20de%20saber%20como%20pagar%20e%20receber%20o%20relat%C3%B3rio.
```

2. **Dúvidas Gerais (CTA Secundário ou FAQ)**:
```text
https://wa.me/5581985901175?text=Ol%C3%A1!%20Vi%20o%20servi%C3%A7o%20de%20Hist%C3%B3rico%20Veicular%20no%20site%20da%20AF%20Motos%20e%20tenho%20algumas%20d%C3%BAvidas.%20Poderia%20me%20ajudar%3F
```

---

## 7. SEO, Metadados e Dados Estruturados

### 7.1 URLs e Rota Canônica
- Rota Canônica: `https://afmotos.com.br/historico-veicular`
- Evita conflito com `/admin/consulta-placa` (área administrativa privada com `noindex`).

### 7.2 Metadados Técnicos
- **Title**: `Histórico Veicular para Motos por Placa | AF Motos`
- **Description**: `Consulte o histórico veicular da sua moto por placa com a AF Motos em Cabo de Santo Agostinho e Região. Verifique leilão, roubo/furto, gravames, débitos e restrições por R$ 39,99.`
- **Open Graph**: Imagem temática com logo AF Motos, badge Mercosul e selo de consulta veicular.
- **Robots / Indexação**:
  - `index: true, follow: true` se `vehicleHistory.isEnabled === true`.
  - `index: false, follow: false` (ou 404 seguro) caso o serviço seja desativado.

### 7.3 Schema Markup (JSON-LD)
A página injeta blocos estruturados válidos via Schema.org:
1. `Service`: Nome do serviço (*"Consulta de Histórico Veicular para Motos"*), fornecido pela AF Motos (`AutoDealer`).
2. `Offer`: Preço (`39.99`), moeda (`BRL`), disponibilidade (`https://schema.org/InStock`).
3. `FAQPage`: As 7 perguntas frequentes visíveis na página.
4. `BreadcrumbList`: Início > Histórico Veicular.

### 7.4 Inclusão no Sitemap (`app/sitemap.ts`)
A rota `/historico-veicular` é incluída dinamicamente no `app/sitemap.ts` com `priority: 0.8` e `changeFrequency: 'weekly'` **somente se** o serviço estiver ativo nas configurações do site.

---

## 8. Privacidade, LGPD e Segurança da Informação

1. **Zero Chamadas a Provedores Externos na Web Pública**: Nenhuma requisição é feita à API Brasil a partir da landing page.
2. **Zero Custos por Acesso de Usuários**: A página pública consome R$ 0,00 de créditos da loja.
3. **Não Persistência de Placas no Site Público**: A placa não é gravada em banco de dados, nem em cookies, nem repassada a ferramentas terceiras de rastreamento.
4. **Sem Vazamento em URL**: A placa nunca é injetada como parâmetro de busca (`?placa=...`) para evitar indexação acidental no histórico do navegador ou logs de servidor.
5. **Acesso Administrativo Restrito**: Consultas reais continuam sendo disparadas exclusivamente por operadores autenticados através de Server Actions protegidas no `/admin/consulta-placa`.

---

## 9. Histórias de Usuário e Critérios de Aceite

### User Story 1 — Descoberta e Compreensão da Consulta (Priority: P1)
Como comprador de moto usada, quero acessar a página `/historico-veicular` no meu celular para entender quais pendências e débitos o relatório analisa e quanto custa o serviço.

**Acceptance Scenarios**:
1. **Given** o usuário acessa `/historico-veicular`, **When** a página carrega, **Then** exibe título claro, preço de R$ 39,99, cards com os benefícios (leilão, gravame, roubo, débitos) com ressalvas de disponibilidade e tempo de carregamento mobile veloz.

---

### User Story 2 — Solicitação com Placa via WhatsApp (Priority: P1)
Como comprador interessado, quero digitar a placa da moto na Hero e clicar no botão para abrir o WhatsApp com mensagem pronta, para agilizar meu atendimento.

**Acceptance Scenarios**:
1. **Given** o usuário digita `BRA2E19` ou `ABC-1234` na placa da Hero, **When** clica em "Solicitar histórico pelo WhatsApp", **Then** o sistema valida o formato da placa no navegador e abre o link `https://wa.me/...` com a placa preenchida na mensagem.
2. **Given** o usuário digita uma placa incompleta ou inválida (ex.: `123`), **When** tenta submeter, **Then** exibe mensagem de alerta no campo de texto e não abre o WhatsApp.

---

### User Story 3 — Solicitação de Dúvidas sem Placa (Priority: P2)
Como usuário sem a placa em mãos no momento, quero clicar em um botão de dúvidas para conversar com a loja antes de contratar.

**Acceptance Scenarios**:
1. **Given** o usuário na landing page, **When** clica em "Tirar dúvidas pelo WhatsApp" (na Hero, no FAQ ou no rodapé da página), **Then** abre o WhatsApp oficial com mensagem genérica e acolhedora sobre o serviço.

---

### User Story 4 — Gerenciamento de Preço e Conteúdo no Painel (Priority: P1)
Como proprietário da AF Motos, quero alterar o valor da consulta e a mensagem de WhatsApp na aba de configurações do painel admin, para que o novo preço reflita na página sem necessidade de deploy.

**Acceptance Scenarios**:
1. **Given** o admin em `/admin/configuracoes`, **When** acessa a aba "Histórico Veicular", altera o preço para `R$ 49,90` e salva, **Then** a landing page `/historico-veicular` e o Schema JSON-LD passam a exibir `R$ 49,90` imediatamente.
2. **Given** o admin seleciona o modo "Mais barato do mercado", **When** tenta salvar sem comprovação preenchida, **Then** o formulário bloqueia a ação e emite aviso explicativo de conformidade legal.

---

### User Story 5 — Ativação e Desativação do Serviço (Priority: P2)
Como proprietário da AF Motos, quero desativar o serviço temporariamente com um interruptor no painel quando a equipe estiver indisponível.

**Acceptance Scenarios**:
1. **Given** `isEnabled = false` no painel, **When** um usuário tenta acessar `/historico-veicular`, **Then** o sistema oculta os links de navegação e redireciona ou exibe aviso amigável de serviço temporariamente pausado com `noindex`.

---

## 10. Fora de Escopo do MVP (Não-Objetivos)
- Pagamento automático via Pix ou cartão de crédito no site.
- Consulta instantânea da API Brasil no navegador do visitante.
- Exibição de laudo público ou download aberto de relatórios veiculares.
- Área do cliente com login para histórico de pedidos.
- Vistoria mecânica presencial ou laudo cautelar oficial com perito físico.
- Disparo de e-mails transacionais automáticos.
