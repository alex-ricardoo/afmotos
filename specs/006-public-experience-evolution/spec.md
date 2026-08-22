# Feature Specification: AF Motos — Evolução Completa da Experiência Pública

**Feature Branch**: `[006-public-experience-evolution]`

**Created**: 2026-08-22

**Status**: Ready for Planning

**Input**: User description: "/speckit-specify AF Motos — Evolução completa da experiência pública..."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Descoberta Visual e Navegação Fluida na Home (Priority: P1)

Como um cliente em potencial acessando o site da AF Motos (principalmente pelo celular via redes sociais ou WhatsApp), quero visualizar uma hero com foto nítida e legível, entender imediatamente a proposta de valor honesta da loja, navegar pelo menu de forma clara (com link explícito para Início) e acessar as motos disponíveis ou anunciar minha própria moto sem ser bombardeado por promessas falsas ou contadores inventados.

**Why this priority**: A Hero e o Header são o primeiro ponto de contato e a porta de entrada da experiência mobile da AF Motos. Imagens excessivamente escuras ou promessas enganosas quebram a confiança e a conversão do usuário.

**Independent Test**: Carregar a página inicial em dispositivos móveis (320px a 430px) e desktop, verificar a nitidez da imagem de fundo com contraste de texto perfeitamente legível, acionar os botões de ação ("Ver motos disponíveis" e "Anunciar minha moto") e navegar pelo menu conferindo o item "Início".

**Acceptance Scenarios**:

1. **Given** um visitante acessando a página inicial, **When** a seção Hero renderiza, **Then** a imagem de fundo de motocicleta é claramente visível com gradiente escuro focado na legibilidade do texto, sem fundos pretos chapados ou opacidade excessiva que ocultem a foto.
2. **Given** um visitante navegando no cabeçalho ou menu mobile, **When** visualiza as opções de menu, **Then** encontra links diretos e em português: "Início", "Motos disponíveis", "Anuncie sua moto", "Aluguel", "Motos vendidas" e "Fale conosco", com estado ativo claramente demarcado.
3. **Given** a mensagem principal na Hero, **When** lida pelo visitante, **Then** exibe título direto ("Encontre sua próxima moto.") e subtítulo transparente ("Veja as motos disponíveis ou anuncie a sua com a AF Motos."), sem menção a quantidades de vendas inventadas, aprovação bancária garantida ou taxas irreais.

---

### User Story 2 - Catálogo Dinâmico e Filtros Baseados em Dados Reais (Priority: P1)

Como um comprador buscando uma motocicleta, quero filtrar o catálogo de motos disponíveis utilizando opções dinâmicas que reflitam exclusivamente as marcas, modelos, anos, categorias e faixas de preço realmente cadastradas no estoque da loja, com todas as opções e seletores apresentados 100% em português.

**Why this priority**: Exibir filtros com marcas inexistentes, categorias vazias ou textos em inglês ("All") confunde o cliente, gera buscas sem resultado e degrada a experiência comercial.

**Independent Test**: Filtrar o catálogo por marca e categoria com dados do banco e validar que apenas opções existentes com estoque aparecem no seletor, os contadores de resultado são precisos e nenhum termo em inglês aparece na interface.

**Acceptance Scenarios**:

1. **Given** um catálogo com 3 marcas cadastradas no banco de dados, **When** o usuário abre o seletor de marcas, **Then** apenas essas 3 marcas reais são exibidas além da opção "Todas as marcas" (nenhum seletor exibe "All" ou marcas vazias sem itens).
2. **Given** a seleção de filtros pelo usuário, **When** um filtro é aplicado ou alterado, **Then** os parâmetros são sincronizados na URL de forma limpa, a contagem de resultados reflete o estoque real e, caso não haja correspondência, é exibido um estado vazio elegante e acolhedor com botão de limpar filtros.
3. **Given** os seletores e opções de ordenação da página pública, **When** renderizados na tela, **Then** exibem rótulos em português como "Todas as categorias", "Todos os anos", "Menor preço", "Maior preço", "Mais recentes".

---

### User Story 3 - Visualização de Cards de Motos em Destaque e Catálogo (Priority: P1)

Como um comprador interessado, quero visualizar cards de motos com fotos de alta qualidade, especificações essenciais organizadas (marca, modelo, versão, ano, km, cilindrada, cor, preço), status comercial em português e botão direto para negociar via WhatsApp com mensagem contextualizada.

**Why this priority**: O card da moto é a peça central da conversão de venda. Precisa ser limpo, consistente em altura, mobile-first e confiável, sem exibir dados confidenciais (placa) ou promessas não comprovadas.

**Independent Test**: Visualizar a vitrine de motos em destaque na Home e na listagem geral, testar o hover/focus, verificar fallbacks de imagem ausente, validar as tags de status traduzidas e acionar o botão de WhatsApp verificando o preenchimento da mensagem com os dados da moto.

**Acceptance Scenarios**:

1. **Given** uma moto cadastrada no catálogo, **When** renderizada no card público, **Then** exibe imagem principal nítida (com fallback de placeholder elegante caso não haja foto), marca, modelo, versão (se preenchida), ano de fabricação/modelo, quilometragem formatada, cilindrada, cor e preço formatado em Reais (R$).
2. **Given** uma moto com status específico no banco, **When** apresentada no card, **Then** exibe o status em português ("Disponível", "Reservada", "Vendida", "Alugada", "Em revisão", "Indisponível", "Oculta"), sem exibir termos em inglês como `AVAILABLE` ou `SOLD`.
3. **Given** o card da moto, **When** o usuário clica no CTA de WhatsApp, **Then** abre a conversa direta com o número oficial da loja (`site_settings`) com mensagem contextualizada contendo o modelo, ano e link da moto.

---

### User Story 4 - Anúncio e Proposta de Venda Direta ("Anuncie sua moto") (Priority: P2)

Como proprietário de uma moto que deseja anunciá-la ou vendê-la através da AF Motos, quero acessar uma página clara e humana ("Anuncie sua moto com a AF Motos"), entender as etapas simples do processo (envio de informações, análise humana pela equipe e contato para combinar condições) e enviar os dados e fotos do veículo através de um formulário seguro e validado, recebendo confirmação imediata.

**Why this priority**: Unifica o fluxo de captação de motos de terceiros em uma experiência compreensível, sem termos jurídicos complexos como "consignação" que afastam o usuário comum, e sem promessas enganosas de compra imediata.

**Independent Test**: Preencher o formulário em `/anunciar-sua-moto` com dados válidos e anexos de fotos, submeter e verificar o toast de sucesso e o registro gerado no Supabase. Testar também acesso via `/venda-sua-moto` e `/consignar-moto` verificando o redirecionamento consistente.

**Acceptance Scenarios**:

1. **Given** um usuário que quer anunciar sua moto, **When** acessa a página de anúncio, **Then** encontra um título acolhedor ("Anuncie sua moto com a AF Motos" ou "Quer vender sua moto?"), explicação clara em etapas e avisos transparentes de que o envio não garante venda prévia e que as condições serão combinadas via WhatsApp.
2. **Given** o preenchimento do formulário, **When** o usuário preenche nome, WhatsApp, marca, modelo, ano, km, preço desejado, observações e faz upload de fotos, **Then** validações de campos obrigatórios, tipos e limites de imagem ocorrem com mensagens amigáveis em português.
3. **Given** a submissão bem-sucedida, **When** os dados são enviados, **Then** o sistema desabilita o botão para evitar envio duplo, exibe um toast de sucesso claro ("Recebemos os dados da sua moto. Vamos analisar e falar com você.") e persiste a solicitação no banco de dados.

---

### User Story 5 - Locação de Motocicletas com Planos Flexíveis e Personalizados (Priority: P2)

Como um cliente em busca de aluguel de motocicletas, quero consultar as opções disponíveis (diárias ou mensais reais) e ter a opção de solicitar um plano personalizado para durações maiores (ex.: 3 meses, 6 meses, 1 ano ou sob medida), preenchendo uma solicitação direta para que a loja monte uma proposta customizada.

**Why this priority**: A loja oferece aluguéis locais e pode atender contratos de média e longa duração. Permitir pedidos sob medida capta leads qualificados sem exigir tabelas de preço rígidas ou irreais.

**Independent Test**: Acessar a página de aluguel, conferir as opções baseadas nas configurações reais do banco (`rental_settings`), abrir a seção "Precisa alugar por mais tempo?", preencher o formulário de plano personalizado e verificar a criação do lead/solicitação com feedback de sucesso.

**Acceptance Scenarios**:

1. **Given** um visitante na página de aluguel, **When** navega pela tela, **Then** visualiza as condições vigentes da loja e encontra uma seção destacada: "Precisa alugar por mais tempo? Se você precisa de uma moto por 6 meses, 1 ano ou outro período, fale com a gente para montarmos uma condição personalizada."
2. **Given** o formulário de plano personalizado, **When** o cliente informa nome, WhatsApp, moto de interesse, data inicial pretendida, período desejado (1 mês, 2 meses, 3 meses, 6 meses, 12 meses ou outro) e mensagem, **Then** o sistema valida os dados e envia como solicitação de lead comercial de locação.
3. **Given** o envio da solicitação de aluguel personalizado, **When** concluído, **Then** exibe feedback positivo ("Recebemos sua solicitação. Vamos falar com você para montar uma condição personalizada.") sem registrar reservas fictícias na tabela operacional de aluguéis fechados.

---

### User Story 6 - Política de Privacidade e Conformidade com Legislação Brasileira (Priority: P2)

Como um usuário consciente da proteção de seus dados pessoais, quero acessar a página de Política de Privacidade da AF Motos em `/politica-de-privacidade` para entender de forma clara e acessível como meus dados de contato e propostas são tratados conforme a LGPD (Lei 13.709/2018) e o Marco Civil da Internet (Lei 12.965/2014), sem referências desatualizadas a "Termos de Uso".

**Why this priority**: Conformidade legal obrigatória para negócios digitais no Brasil que coletam dados e propostas via formulários web e WhatsApp.

**Independent Test**: Acessar a rota `/politica-de-privacidade` via link no rodapé, verificar a presença de todas as seções legais com placeholders editáveis (`[RAZÃO SOCIAL]`, `[CNPJ]`, `[CONTATO]`) e confirmar a ausência total de links ou páginas de "Termos de Uso".

**Acceptance Scenarios**:

1. **Given** o rodapé e menus do site, **When** o usuário procura links institucionais, **Then** encontra o link para "Política de Privacidade" e não encontra nenhum link ou menção a "Termos de Uso".
2. **Given** o acesso a `/politica-de-privacidade`, **When** a página é renderizada, **Then** exibe texto estruturado contendo: identificação do controlador, dados coletados em formulários, finalidade do uso e contato via WhatsApp, armazenamento seguro no Supabase, direitos do titular e canal para solicitação de exclusão/correção de dados.
3. **Given** links legados que apontavam para termos de uso, **When** acessados, **Then** redirecionam de forma segura e elegante para a Política de Privacidade ou página inicial sem gerar páginas quebradas (404 indesejado).

---

### User Story 7 - Sistema Centralizado de Toasts, Tooltips e Feedback Visual (Priority: P2)

Como usuário ou administrador interagindo com qualquer formulário da plataforma, quero receber feedback visual imediato, acessível e não intrusivo (toasts com ícones de sucesso/erro e tooltips explicativos) para saber exatamente o status de cada envio sem depender de caixas nativas intrusivas como `alert()`.

**Why this priority**: Comunicação transparente de status elimina incerteza, previne reenvios desnecessários e melhora a percepção de qualidade técnica e confiabilidade do site.

**Independent Test**: Submeter formulários com sucesso e com erros forçados de validação ou rede, verificando a exibição de toasts acessíveis com `role="status"` ou `role="alert"`, duração apropriada, opção de fechamento manual e tooltips de ajuda.

**Acceptance Scenarios**:

1. **Given** qualquer submissão de formulário (anunciar moto, aluguel personalizado, contato, login admin), **When** a ação é disparada, **Then** o botão exibe estado de loading/desabilitado e um toast contextualizado notifica o resultado final (sucesso ou erro amigável em português).
2. **Given** uma falha de validação ou erro de servidor, **When** o toast de erro é renderizado, **Then** exibe mensagem clara sem expor stack traces, comandos SQL ou códigos técnicos internos.
3. **Given** ícones ou campos informativos na interface, **When** o usuário passa o cursor ou foca pelo teclado, **Then** tooltips acessíveis exibem dicas contextuais sem obstruir elementos fundamentais.

---

### Edge Cases

- **Catálogo vazio (0 motos disponíveis)**: O site não deve quebrar nem exibir erros de execução; deve renderizar uma mensagem acolhedora de estoque em atualização com CTA para falar no WhatsApp ou encomendar uma moto.
- **Apenas 1 moto cadastrada ou 1 marca no estoque**: Os seletores de filtro mostram apenas as opções pertinentes, sem opções vazias ou duplicadas.
- **Moto sem fotos cadastradas no banco**: O card e a página de detalhes exibem um placeholder elegante da AF Motos mantendo as dimensões e layout intactos.
- **Falha de conectividade ou instabilidade do Supabase**: A interface captura o erro suavemente, exibe estados de fallback funcionais e notifica o usuário via toast amigável sem quebrar a renderização global.
- **Envio com arquivos de imagem pesados ou formato inválido**: O formulário bloqueia antes do upload, informando o limite máximo de tamanho e formatos aceitos (JPEG, PNG, WebP).
- **Clique duplo rápido no botão de envio de formulários**: O botão entra imediatamente em estado desabilitado (loading), prevenindo criação de registros duplicados no banco.
- **Configurações do site (`site_settings`) incompletas**: O sistema adota fallbacks sensatos (nome padrão "AF Motos", telefone padrão da loja) sem quebrar o layout do header, footer ou links de WhatsApp.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema MUST exibir uma seção Hero na página inicial com imagem de fundo de motocicleta com iluminação e contraste equilibrados, garantindo legibilidade do texto e dos botões de ação em qualquer tamanho de tela.
- **FR-002**: O sistema MUST eliminar da Hero e das páginas públicas quaisquer dados fictícios, contadores inventados de motos vendidas, menções a financiamento garantido, laudos técnicos não realizados ou aprovação bancária imediata.
- **FR-003**: O sistema MUST derivar dinamicamente todos os filtros do catálogo público (marcas, categorias, anos, faixas de preço) com base exclusiva nos registros reais de motocicletas disponíveis retornados pelo Supabase.
- **FR-004**: O sistema MUST exibir 100% dos textos de filtros, seletores, ordenações, estados vazios e badges da área pública em português brasileiro, eliminando qualquer texto em inglês como "All", "AVAILABLE", "SOLD", "RENTED", etc.
- **FR-005**: O sistema MUST redesenhar os cards de motocicletas (em destaque e no catálogo geral) com hierarquia visual clara: foto principal otimizada, fallback para ausência de foto, especificações (marca, modelo, versão, ano, km, cilindrada, cor, preço), badge de status traduzido e CTA direto de WhatsApp contextualizado com dados da moto.
- **FR-006**: O sistema MUST disponibilizar uma navegação pública clara no cabeçalho desktop e menu mobile com os itens: "Início", "Motos disponíveis", "Anuncie sua moto", "Aluguel", "Motos vendidas" e "Fale conosco", garantindo que "Início" aponte para `/` com estado ativo visível.
- **FR-007**: O sistema MUST disponibilizar a página pública `/anunciar-sua-moto` com linguagem direta ("Anuncie sua moto com a AF Motos"), explicação transparente das etapas do processo e formulário validado para envio de dados e fotos, persistindo a solicitação na tabela de requests do Supabase.
- **FR-008**: O sistema MUST consolidar rotas redundantes de captação de motos (`/venda-sua-moto` e `/consignar-moto`), redirecionando-as para a experiência unificada `/anunciar-sua-moto` sem links quebrados.
- **FR-009**: O sistema MUST incluir na página de aluguel uma seção dedicada a planos personalizados ("Precisa alugar por mais tempo?"), contendo formulário para solicitação de períodos customizados (3 meses, 6 meses, 1 ano, etc.), persistindo o contato como lead comercial de locação sem criar reservas operacionais prematuras.
- **FR-010**: O sistema MUST criar a página pública `/politica-de-privacidade` estruturada de acordo com a LGPD e o Marco Civil da Internet com placeholders editáveis claramente identificados (`[RAZÃO SOCIAL]`, `[CNPJ]`, `[CONTATO]`), adicionando o link no rodapé.
- **FR-011**: O sistema MUST remover completamente todas as rotas, links no menu e links no rodapé que façam referência a "Termos de Uso".
- **FR-012**: O sistema MUST implementar um sistema centralizado de toasts e tooltips acessíveis (`role="status"`, `role="alert"`) para todos os formulários e ações interativas do site, proibindo o uso de `alert()` nativo e prevenindo envios duplicados.
- **FR-013**: O sistema MUST centralizar a recuperação de informações institucionais (nome da loja, telefone WhatsApp, e-mail, endereço, redes sociais) a partir da tabela `site_settings` do Supabase, aplicando fallbacks seguros caso algum campo esteja vazio.
- **FR-014**: O sistema MUST assegurar que todas as páginas públicas cumpram critérios de acessibilidade WCAG 2.2 AA (contraste de cores, navegação por teclado, foco visível, touch targets mínimos de 44x44px, alt text em imagens).
- **FR-015**: O sistema MUST configurar metadados de SEO consistentes e realistas (títulos, descrições, Open Graph, tags canônicas) para todas as rotas públicas, sem jargões exagerados ou alegações não comprovadas.

---

### Key Entities

- **Motorcycle**: Registro do catálogo de veículos contendo marca, modelo, versão, ano de fabricação/modelo, quilometragem, cilindrada, cor, preço, tipo de operação (venda/aluguel), status comercial (`AVAILABLE`, `RESERVED`, `SOLD`, etc.), flag de destaque e imagens associadas.
- **Motorcycle Image**: Imagens vinculadas a cada motocicleta, contendo URL no storage, ordem de exibição e flag de imagem principal.
- **Sell / Consignment Request**: Registro de solicitação de proprietário interessado em vender ou anunciar sua motocicleta pela AF Motos, contendo dados do proprietário, especificações da moto, valor pretendido, observações e URLs de fotos enviadas.
- **Rental Lead / Request**: Solicitação de proposta comercial para locação de motocicletas, contendo dados de contato do cliente, moto de interesse, data de início e período pretendido (incluindo prazos customizados de 3 a 12+ meses).
- **Site Setting**: Configurações institucionais da loja contendo nome oficial, telefone de atendimento WhatsApp, e-mail, endereço físico, horários e metadados.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A Hero apresenta imagem visível com taxa de contraste de texto superior a 4.5:1 em 100% dos testes de acessibilidade em telas móveis e desktop.
- **SC-002**: 100% das opções presentes nos filtros públicos do catálogo correspondem a dados realmente existentes no banco, com zero filtros exibindo rótulos em inglês ou categorias vazias.
- **SC-003**: 100% dos formulários públicos (anúncio de moto, plano de aluguel personalizado, contato) fornecem feedback visual via toast acessível em menos de 1 segundo após o processamento, sem uso de `alert()`.
- **SC-004**: A rota `/politica-de-privacidade` é 100% acessível e indexável, enquanto 0 referências a "Termos de Uso" permanecem nos menus, rodapé ou rotas ativas.
- **SC-005**: 100% dos botões de WhatsApp nos cards de motos geram links com mensagem pré-formatada contendo modelo, ano e identificador correto da moto.
- **SC-006**: O tempo de carregamento percebido das páginas públicas em dispositivos móveis (FCP/LCP) mantém performance otimizada com imagens responsivas e carregamento progressivo.
- **SC-007**: As verificações de qualidade automatizadas (`lint`, `typecheck` e `build`) executam com 100% de sucesso sem nenhum erro ou aviso bloqueante.

---

## Assumptions

- A infraestrutura utiliza Next.js App Router com TypeScript estrito e Supabase como backend PostgreSQL e Storage.
- As tabelas `motorcycles`, `motorcycle_images`, `sell_requests`/`consignment_requests`, `leads`/`motorcycle_requests` e `site_settings` já existem no schema do banco ou requerem apenas pequenas extensões compatíveis sem quebra de dados.
- O canal prioritário de fechamento de negócios e negociação é o WhatsApp com atendimento humano pela equipe da AF Motos.
- Os placeholders jurídicos na Política de Privacidade (`[RAZÃO SOCIAL]`, `[CNPJ]`, etc.) serão completados pelo responsável legal da loja antes do lançamento definitivo.
- O público-alvo acessa primordialmente através de smartphones via redes sociais (Instagram/WhatsApp), exigindo prioridade absoluta para a experiência mobile.
