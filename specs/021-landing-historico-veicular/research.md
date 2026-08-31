# Research & Technical Decisions: Landing Page Pública — Histórico Veicular

Este documento consolida as decisões arquiteturais, técnicas, jurídicas (LGPD/CDC) e de UX/SEO para a implementação da Landing Page Pública de Histórico Veicular na AF Motos.

---

## 1. Rota Pública do Serviço

### Decision
Adotar a rota pública:
```text
/historico-veicular
```

### Rationale
- **Intenção de Busca**: O termo "histórico veicular" possui alto volume e clareza direta de intenção comercial no Brasil, englobando débitos, gravames, leilão e procedência.
- **Diferenciação Semântica**: Evita ambiguidades com "laudo cautelar" (termo frequentemente associado à vistoria física de inspeção veicular em galpão) e "consulta de placa" (que é a nomenclatura da rota administrativa privada `/admin/consulta-placa`).
- **SEO & Canonical**: URL limpa, em português, de fácil memorização em peças de marketing social (stories, bio do Instagram).

### Alternatives Considered
- `/consulta-placa`: Rejeitado para evitar conflito com a rota administrativa e não incentivar a impressão de que o site fará uma busca aberta e gratuita no browser.
- `/laudo-cautelar`: Rejeitado por restrições legais e de publicidade ética, uma vez que o serviço consiste em relatório documental/cadastral digital e não em perícia física estrutural.
- `/consulta-cautelar`: Aceitável, mas secundário em relação a `/historico-veicular` na intenção de busca de motocicletas.

### Consequences
A rota canônica e os metadados associados responderão em `/historico-veicular`.

---

## 2. Estrutura de Armazenamento: `site_settings` JSONB vs Tabela Própria

### Decision
Integrar as configurações sob o objeto JSONB `settings.vehicleHistory` na tabela singleton existente `site_settings`.

### Rationale
- **Simplicidade & Consistência**: O projeto já adota `site_settings` com campo JSONB `settings` para abrigar configurações institucionais, horários, redes sociais e a seção Sobre (`settings.about`).
- **Deploy Zero**: Permite atualizações em tempo real no servidor via `revalidatePath('/', 'layout')` e `revalidatePath('/historico-veicular')`.
- **Manutenção de Tipos**: Tipagem estrita via TypeScript (`types/site-settings.ts`) e schema Zod em `lib/settings/schema.ts`.

### Alternatives Considered
- *Criar tabela `vehicle_history_settings`*: Desnecessário e viola o Princípio XII (Evolução Incremental / YAGNI) da Constituição, adicionando complexidade de migrations sem benefício real para uma tabela singleton de 1 linha.

### Consequences
Extensão da interface `SiteSettingsData` com a tipagem `VehicleHistorySettings` e inclusão de nova aba "Histórico Veicular" no formulário de configurações do painel admin.

---

## 3. Estratégia de Preço Configurável e Publicidade Comparativa Ética

### Decision
Disponibilizar preço dinâmico com valor inicial sugerido de `R$ 39,99`, com seletor de modo de posicionamento comercial:
- `COMPETITIVE`: "Histórico veicular completo por um preço acessível."
- `REGIONAL_BEST`: "Um dos melhores preços para consulta veicular na região."
- `SPECIAL_OFFER`: "Oferta especial de lançamento."
- `CHEAPEST_MARKET`: "O menor preço do mercado." *(Habilitado exclusivamente com campos de comprovação preenchidos: `claimEvidenceText` e `claimEvidenceDate`)*.
- `CUSTOM`: Texto livre sanitizado.

### Rationale
- O Código de Defesa do Consumidor (CDC) e as normas do CONAR exigem que alegações de menor preço absoluto sejam objetivas, documentadas e auditáveis temporalmente.
- O sistema protege a AF Motos contra questionamentos legais impedindo que o texto "o mais barato do mercado" seja fixado no código sem governança administrativa.

### Alternatives Considered
- *Preço estático hardcoded no código*: Inflexível diante de reajustes dos provedores de dados.
- *Texto livre sem validação*: Alto risco de publicidade enganosa ou desconforme com a legislação.

### Consequences
O schema de validação Zod no admin exigirá `claimEvidenceText` e `claimEvidenceDate` sempre que `positioningMode === 'CHEAPEST_MARKET'`. Caso contrário, salvará o fallback `COMPETITIVE`.

---

## 4. Fluxo de Conversão via WhatsApp e Validação de Placa

### Decision
A Hero conterá um input interativo com máscara de placa veicular brasileira. Ao clicar no CTA:
1. Validação client-side instantânea (padrão antigo `AAA-9999` ou Mercosul `AAA9A99`).
2. Se válida, codifica a mensagem com a placa normalizada e abre o link `https://wa.me/55...`.
3. Se o usuário preferir não informar a placa, há um botão secundário para tirar dúvidas no WhatsApp.
4. **Nenhuma requisição de rede ou gravação em banco é feita na digitação da placa.**

### Rationale
- **Fricção Zero**: O cliente não precisa preencher formulários longos nem criar senhas.
- **Qualificação do Lead**: O atendente já recebe a placa pronta no chat, economizando minutos na troca de mensagens.
- **Proteção Total de Custos**: Nenhuma chamada paga à API externa ocorre na landing page.

### Alternatives Considered
- *Checkout e Pix no site*: Elevado custo de implementação, risco de chargeback e complexidade com webhooks neste estágio inicial.
- *Formulário de e-mail*: Baixa conversão no mercado de motos usadas em Pernambuco, onde o WhatsApp domina >95% das transações.

### Consequences
Função utilitária `buildVehicleHistoryWhatsAppUrl` isolada e testável, sem dependências de APIs de terceiros.

---

## 5. Hero Interativa com Placa Mercosul Estilizada

### Decision
Construir a representação visual da Placa Mercosul em HTML/CSS puro (Tailwind CSS), combinando o topo azul padrão Mercosul com bandeira do Brasil e o corpo com bordas arredondadas e tipografia automotiva em alto contraste.

### Rationale
- **LCP & Performance**: Componentes CSS leves pesam < 2 KB, carregando instantaneamente em 3G/4G sem dependência de download de imagens pesadas ou WebGL.
- **Acessibilidade**: Elemento semanticamente claro, com `aria-label` e fallback para leitores de tela.
- **Atratividade Visual**: Transmite imediata identificação temática para o usuário de motos.

### Alternatives Considered
- *Imagem PNG estática da placa*: Adicionaria peso à carga da página e ficaria borrada em telas Retina de alta densidade.
- *Canvas 3D / Spline*: Alto consumo de bateria e risco de degradação de Core Web Vitals em aparelhos celulares modestos.

### Consequences
Criação do componente acessível `MercosulPlateVisual.tsx` ou reutilização dos padrões de badge do projeto.

---

## 6. Mockup do Relatório de Histórico (Dados Fictícios)

### Decision
Renderizar uma prévia visual ilustrativa do laudo veicular com dados 100% fictícios (ex.: placa `ABC-1D23`, moto `HONDA CG 160 FAN`), destacando claramente a tag **"Exemplo Ilustrativo"**.

### Rationale
- Aumenta a percepção de valor ao demonstrar a organização dos dados (leilão, roubo/furto, gravame, débitos, FIPE).
- Elimina o risco de expor dados reais de veículos ou proprietários de terceiros (LGPD).
- Não prejudica o LCP pois é renderizado abaixo da primeira dobra (Lazy/Server Component).

### Alternatives Considered
- *PDF embutido via `<iframe>`*: Péssima experiência em smartphones e alto consumo de memória.
- *Captura de tela estática de consulta real*: Risco de vazamento de dados de veículos de terceiros e ilegibilidade em telas pequenas.

### Consequences
Componente `ReportMockupSection.tsx` estruturado em cards Tailwind estilizados.

---

## 7. SEO Técnico, Local e JSON-LD

### Decision
Implementar os seguintes blocos Schema.org na página `/historico-veicular`:
1. `Service`: Nome do serviço e provedor (`AutoDealer`).
2. `Offer`: Preço atual e moeda (`BRL`).
3. `FAQPage`: As perguntas frequentes visíveis.
4. `BreadcrumbList`: Início > Histórico Veicular.

E na rota `app/sitemap.ts`, incluir a página condicionalmente se `isEnabled === true`.

### Rationale
- Em conformidade estrita com o Princípio IX da Constituição da AF Motos ("Performance & SEO Mandatório em Páginas Públicas").
- Ganho de snippets ricos no Google (Rich Results para FAQ e Serviços Locais).

### Alternatives Considered
- *Schema `Product`*: Incorreto para serviços de consultoria/relatório veicular (o Google recomenda `Service` ou `FinancialProduct`/`ProfessionalService`).

### Consequences
Criação do schema builder `generateVehicleHistoryJsonLd()` em `lib/seo/schemas/`.

---

## 8. Tratamento de Estado Ativo / Inativo

### Decision
Quando `vehicleHistory.isEnabled === false`:
1. A rota `/historico-veicular` retorna metadados com `robots: { index: false, follow: false }` e exibe uma tela amigável de "Serviço Temporariamente Indisponível" ou redireciona suavemente para `/motos`.
2. O link é omitido do `Header`, `Footer` e `sitemap.ts`.

### Rationale
- Protege o crawl budget do Google e evita que clientes enviem mensagens quando o serviço estiver suspenso.
