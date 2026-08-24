# Feature Specification: Redesign da Central de Propostas e Leads (CRM AF Motos)

**Feature Branch**: `011-admin-propostas-redesign`

**Created**: 2026-08-23

**Status**: Draft

**Input**: Redesenhar completamente a tela administrativa de propostas, contatos e leads (`/admin/propostas`) transformando-a em uma central comercial moderna, rápida, mobile-first, com indicadores reais, galeria de fotos, WhatsApp integrado, alteração ágil de status e suporte a múltiplas fontes de contato sem dados mockados.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Atendimento Rápido e Contato via WhatsApp (Priority: P1)

Como atendente ou gestor comercial da AF Motos, quero visualizar imediatamente os novos contatos recebidos pelo site e iniciar uma conversa no WhatsApp com 1 toque/clique já com mensagem personalizada e dados do veículo, para reduzir o tempo de primeiro contato e aumentar a taxa de conversão.

**Why this priority**: O contato ágil com o lead é o principal fator de conversão de vendas e captação de motos da concessionária.

**Independent Test**: Pode ser testado abrindo o card de qualquer proposta recebida, verificando o número formatado e clicando no botão "Falar no WhatsApp", confirmando a abertura do link com o texto correspondente ao tipo de solicitação (interesse em moto, anúncio de venda, consignação ou aluguel) com os dados da moto inseridos automaticamente.

**Acceptance Scenarios**:

1. **Given** que há uma proposta de venda de moto cadastrada por um cliente com telefone e dados da moto, **When** o administrador clica no botão "Falar no WhatsApp" no card ou no detalhe, **Then** o sistema gera uma URL do WhatsApp direcionando para o telefone limpo do cliente com mensagem personalizada contextualizada com o nome do cliente e a moto em questão.
2. **Given** que o administrador deseja apenas copiar o telefone para discagem direta, **When** clica no ícone de cópia ao lado do número formatado `(XX) X XXXX-XXXX`, **Then** o sistema copia os dígitos para a área de transferência e exibe confirmação visual.

---

### User Story 2 - Gestão e Transição Rápida de Status Comercial (Priority: P1)

Como vendedor da loja, quero atualizar o status de qualquer lead diretamente pelo card ou modal (ex.: de "Novo contato" para "Em atendimento", "Qualificado", "Convertido", "Perdido" ou "Encerrado") com atualização imediata na interface e persistência garantida no banco de dados.

**Why this priority**: Manter o pipeline atualizado permite que toda a equipe saiba quais clientes já foram contatados, evitando contatos duplicados ou leads esquecidos.

**Independent Test**: Selecionar uma opção no seletor de status de um card, verificar a atualização otimista instantânea na UI e nos indicadores de métricas, seguida pelo toast de sucesso e confirmação de persistência no reload da página.

**Acceptance Scenarios**:

1. **Given** uma proposta com status "Novo contato", **When** o operador altera para "Em atendimento", **Then** a cor da badge/borda do card muda imediatamente para azul, o contador "Novos contatos" decrementa em 1, o contador "Em atendimento" incrementa em 1, e a base de dados é atualizada com sucesso.
2. **Given** uma falha de conexão ou erro no servidor durante a atualização, **When** a mutação falha, **Then** o sistema reverte o estado visual para o status anterior e exibe um alerta de erro amigável.

---

### User Story 3 - Visualização Completa com Galeria de Fotos e Indicador FIPE (Priority: P2)

Como avaliador comercial de motos, quero ver a foto de capa no card e abrir uma galeria completa com as fotos enviadas pelo proprietário (sejam armazenadas no ImgBB ou Supabase Storage), além do comparativo entre o valor pedido pelo cliente e o valor de Tabela FIPE no painel de detalhes.

**Why this priority**: A avaliação visual do estado da moto e o comparativo FIPE definem a viabilidade e a margem da negociação antes mesmo de responder ao cliente.

**Independent Test**: Criar/selecionar uma proposta com fotos e valor pedido, validar que o thumbnail carrega no card com tag de contagem de fotos, clicar na imagem para abrir a galeria em tela cheia/drawer e inspecionar a porcentagem de diferença em relação à FIPE.

**Acceptance Scenarios**:

1. **Given** uma proposta de anúncio/venda com múltiplas fotos cadastradas, **When** o card é renderizado, **Then** exibe a foto principal, a tag de quantidade de fotos (`+N fotos`) e, ao clicar, abre o visualizador de imagens em alta resolução com navegação.
2. **Given** uma proposta onde o cliente pediu R$ 15.000 e a FIPE é R$ 16.000, **When** o operador abre os detalhes, **Then** o sistema exibe a etiqueta destacada indicando "-6.3% abaixo da FIPE".

---

### User Story 4 - Busca, Filtros Multidimensionais e Visão Adaptativa Mobile/Desktop (Priority: P2)

Como operador em dispositivo móvel ou desktop, quero filtrar propostas por status, tipo de solicitação, cidade, presença de fotos e buscar em tempo real por nome, telefone ou modelo de moto, além de poder alternar entre visualização em cards ricos ou tabela compacta.

**Why this priority**: Com o crescimento do volume de contatos diários, localizar rapidamente clientes específicos ou filtrar apenas leads quentes é indispensável para a produtividade da equipe.

**Independent Test**: Digitar termos na caixa de busca ou clicar nas abas de status/tipo e conferir a listagem filtrada dinamicamente com preservação da fluidez visual e suporte a drawer responsivo no mobile.

**Acceptance Scenarios**:

1. **Given** uma lista de 50 contatos diversos, **When** o usuário clica no filtro "Com fotos" e pesquisa por "Honda", **Then** a lista exibe apenas as propostas que possuem imagens associadas e contêm "Honda" no modelo/marca.
2. **Given** um acesso através de smartphone (largura < 768px), **When** o usuário clica em um card, **Then** o detalhe é apresentado em um Bottom Sheet/Drawer fluido ao alcance do polegar com botões de ação ampliados.

---

## Edge Cases

- **Ausência de fotos**: Se a proposta for de interesse de compra ou contato geral sem fotos, o card exibe ícone estilizado do tipo de contato em layout harmonioso sem espaços em branco quebrados.
- **Formato inconsistente de telefone**: Números digitados com ou sem DDD, com 8 ou 9 dígitos, ou caracteres especiais são higienizados garantindo que o link do WhatsApp utilize sempre o formato internacional brasileiro `55 + DDD + 9 dígitos`.
- **Propostas com URLs de fotos antigas ou quebradas**: URLs de imagem inválidas ou provedores fora do ar recebem fallback visual elegante (placeholder da AF Motos) sem travar a interface nem gerar erro fatal de execução.
- **Zero registros retornados**: A tela exibe um estado vazio ilustrado com mensagem encorajadora e botão para redefinir filtros caso haja filtros ativos.
- **Conflito de fontes de dados**: Unificação de propostas vindas de `leads`, `sell_requests` e `consignment_requests` sem duplicação e com identificadores consistentes.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema DEVE unificar em um ViewModel padronizado todas as solicitações comerciais provenientes das tabelas `leads`, `sell_requests` e `consignment_requests`.
- **FR-002**: O sistema DEVE exibir uma barra superior com 6 indicadores de volume em tempo real: "Total de Contatos", "Novos Leads", "Em atendimento", "Qualificados", "Convertidos" e "Encerrados", calculados a partir dos registros reais do banco.
- **FR-003**: O sistema DEVE permitir busca textual unificada em tempo real por nome do cliente, telefone, e-mail, mensagem, cidade, marca e modelo da moto.
- **FR-004**: O sistema DEVE disponibilizar filtros por tipo de contato ("Interesse em Moto", "Venda de Moto", "Anunciar / Consignar", "Aluguel de Moto", "Contato Geral"), por status e por presença de fotos.
- **FR-005**: O sistema DEVE alternar entre modo de visualização em Grade de Cards Comerciais e Tabela Compacta, memorizando a preferência do usuário na sessão.
- **FR-006**: Cada card comercial DEVE apresentar cabeçalho com faixa gradiente de status, badge de tipo com ícone temático, nome do interessado, telefone com botão de cópia, cidade/UF, data relativa formatada, foto de capa com contador de fotos, resumo da moto (marca, modelo, ano, km, valor pedido vs FIPE) e botões de ação primária.
- **FR-007**: O sistema DEVE disponibilizar o botão "Falar no WhatsApp" com acionamento em um toque gerando mensagens pré-formatadas adequadas ao tipo de solicitação (interesse, venda, aluguel ou contato geral) e modelos de resposta rápida no detalhe (pedir fotos/documento, agendar visita, enviar contraproposta).
- **FR-008**: O sistema DEVE permitir alteração ágil de status comercial diretamente pelo dropdown no card e pela lista de botões no detalhe, aplicando atualização otimista na interface e sincronizando no Supabase.
- **FR-009**: O painel de detalhes DEVE abrir em formato Dialog/Modal amplo no desktop e Bottom Sheet/Drawer no mobile, exibindo dados completos do cliente, especificações da moto, comparativo percentual FIPE, histórico da mensagem e galeria de fotos navegável com suporte a tela cheia.
- **FR-010**: O sistema DEVE suportar imagens hospedadas tanto no Supabase Storage quanto no ImgBB, tratando com segurança domínios externos e ordenação por `sort_order`.
- **FR-011**: O sistema DEVE manter todas as operações protegidas por Row Level Security (RLS), bloqueando leitura/atualização pública e restringindo o acesso exclusivamente a usuários autenticados com perfil administrativo.
- **FR-012**: O sistema NÃO DEVE utilizar dados fictícios/mockados e DEVE tratar estados de carregamento, erro de rede e lista vazia sem travamento.

---

### Key Entities

- **ProposalViewModel**: Modelo unificado de apresentação contendo `id`, `source` (`lead` | `sell_request` | `consignment_request`), `type`, `typeLabel`, `status`, `statusLabel`, `name`, `phone`, `email`, `city`, `state`, `message`, `createdAt`, `motorcycle` (dados estruturados e FIPE) e `images` (array de fotos).
- **ProposalImage**: Representação de foto contendo `id`, `url`, `thumbnailUrl`, `provider` (`supabase` | `imgbb`), `sortOrder` e `isPrimary`.
- **ProposalStatus**: Enum de status do pipeline comercial com os estados: `NEW` (Novo contato), `CONTACTED` (Em atendimento), `QUALIFIED` (Qualificado), `CONVERTED` (Convertido), `LOST` (Perdido) e `CLOSED` (Encerrado).
- **ProposalType**: Tipos de intenção: `MOTORCYCLE_INTEREST`, `SELL_MOTORCYCLE`, `CONSIGNMENT`, `RENTAL`, `MOTORCYCLE_REQUEST`, `GENERAL_CONTACT`.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: O tempo necessário para o atendente localizar um lead e iniciar uma conversa no WhatsApp deve ser inferior a 5 segundos (redução de mais de 70% em relação ao fluxo anterior).
- **SC-002**: A alteração de status de um lead deve refletir na interface em menos de 100ms via atualização otimista, com feedback visual imediato.
- **SC-003**: 100% das imagens enviadas pelos clientes (seja via ImgBB ou Supabase) devem carregar corretamente com fallback visual caso alguma esteja inacessível.
- **SC-004**: A interface deve ser 100% responsiva e utilizável com uma mão em telas a partir de 320px de largura sem qualquer barra de rolagem horizontal indesejada.
- **SC-005**: Zero consultas redundantes N+1 no carregamento da listagem de propostas e imagens.

---

## Assumptions

- O número de WhatsApp oficial da AF Motos e os parâmetros de configuração de contato permanecem gerenciados centralizadamente pelas configurações gerais do sistema.
- A tabela `leads` atua como hub central de propostas e contatos, mantendo vínculo com `sell_requests` e `consignment_requests` quando originados desses fluxos específicos.
- O acesso a `/admin/propostas` continua restrito pelo middleware e pelas Server Actions protegidas com verificação de autenticação de administrador Supabase.
- As imagens públicas provenientes do ImgBB e Supabase Storage continuam respeitando os domínios configurados no `next.config.ts`.
