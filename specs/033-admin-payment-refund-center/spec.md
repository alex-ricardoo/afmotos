# Feature Specification: Central Administrativa de Pagamentos, Consultas e Estornos

**Feature Branch**: `feat/admin-payment-refund-center`

**Created**: 2026-09-13

**Status**: Draft

**Input**: User description: "Central Administrativa de Pagamentos, Consultas e Estornos para acompanhamento operacional de pagamentos, consultas veiculares, status de laudo, falhas de provedores e gestão segura e auditada de estornos."

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Visibilidade Operacional Unificada de Pagamentos e Consultas (Priority: P1)

Como administrador do sistema AF Motos, desejo visualizar em um único painel todos os pagamentos realizados por clientes vinculados às suas respectivas consultas veiculares por placa, identificando de imediato o status do pagamento, o estado de entrega do laudo e a origem dos dados (cache, provedor oficial ou bloqueio preventivo), para que eu possa acompanhar a saúde das vendas e identificar gargalos na operação.

**Why this priority**: É a fundação de toda a operação. Sem visibilidade consolidada de pagamentos versus consultas entregues, a equipe de suporte e gestão opera às cegas e não consegue diagnosticar reclamações de clientes nem monitorar a entrega do serviço contratado.

**Independent Test**: Pode ser testado acessando o painel administrativo autenticado como administrador, verificando a listagem ordenada de transações recentes com placas, valores, status de gateway e entrega, comprovando que nenhum usuário sem privilégios administrativos consegue acessar esses registros.

**Acceptance Scenarios**:

1. **Given** um administrador autenticado com perfil ativo, **When** ele acessa a central de pagamentos e consultas, **Then** o sistema exibe cards de indicadores operacionais (pagamentos aprovados, laudos concluídos, em processamento, falhas e estornos) e uma tabela com os registros mais recentes ordenados por prioridade operacional.
2. **Given** um usuário comum (cliente) ou visitante anônimo, **When** tenta acessar a URL da central ou requisitar seus dados, **Then** o sistema bloqueia o acesso imediatamente com negação explícita e redirecionamento para autenticação.
3. **Given** uma lista de pagamentos com diferentes situações, **When** o administrador digita uma placa veicular no campo de busca, **Then** a tabela filtra instantaneamente os pagamentos e laudos correspondentes a essa placa sem expor dados a terceiros.

---

### User Story 2 - Identificação de Saldo Insuficiente e Alertas Operacionais (Priority: P1)

Como operador administrativo, desejo identificar visualmente e de forma inequívoca quando uma consulta veicular paga não pôde ser emitida por falta de saldo ou créditos na API de consulta veicular, recebendo a recomendação clara de recarregar a conta do provedor antes de qualquer reprocessamento, para que o cliente não fique desassistido e a equipe saiba exatamente qual ação física/financeira adotar.

**Why this priority**: Incidentes reais com saldo esgotado geram chamados imediatos no suporte (WhatsApp) e bloqueio na experiência do cliente. Dar visibilidade imediata desta falha evita reprocessamentos repetidos que continuariam falhando.

**Independent Test**: Simular ou carregar uma transação paga cujo retorno técnico da consulta indicou saldo insuficiente no provedor. O painel deve exibir um badge de atenção destacado, contabilizar o caso no card de alerta superior e instruir a recarga antes de qualquer ação.

**Acceptance Scenarios**:

1. **Given** um pagamento aprovado cuja consulta veicular falhou com código de créditos insuficientes do provedor externo, **When** o administrador visualiza o painel, **Then** o card "Saldo Provedor Insuficiente" destaca a quantidade afetada e a linha da tabela exibe alerta visual e textual explícito.
2. **Given** que o administrador clica no card "Saldo Provedor Insuficiente", **When** o filtro é ativado, **Then** a tabela exibe apenas as transações retidas por falta de créditos, permitindo ação coordenada em lote de recarga e posterior resolução.

---

### User Story 3 - Solicitação de Estorno Manual Seguro com Confirmação Reforçada (Priority: P2)

Como administrador, desejo solicitar o estorno integral seguro de um pagamento aprovado cuja consulta veicular não pôde ser concluída e entregue, informando o motivo e digitando uma confirmação explícita de segurança antes do envio ao gateway, para garantir que o cliente seja ressarcido com rapidez sem risco de acionamentos acidentais ou estornos indevidos.

**Why this priority**: Garante a conformidade do Código de Defesa do Consumidor e a reputação da loja quando um serviço pago não pode ser honrado, com salvaguardas financeiras contra erros humanos ou cliques acidentais.

**Independent Test**: Selecionar um pagamento aprovado com falha definitiva na entrega do laudo, acionar o botão de estorno, verificar a abertura do modal de confirmação reforçada com resumo financeiro, preencher a palavra-chave de confirmação e validar a mudança de estado para estorno solicitado/confirmado.

**Acceptance Scenarios**:

1. **Given** um pagamento aprovado cuja consulta veicular falhou definitivamente sem laudo entregue, **When** o administrador aciona "Solicitar estorno", **Then** um modal reforçado exibe placa, valor, identificadores seguros, seleção de motivo e campo obrigatório de digitação da confirmação.
2. **Given** que o administrador digita a palavra de confirmação incorretamente ou deixa o motivo em branco, **When** tenta confirmar o estorno, **Then** o botão destrutivo permanece bloqueado e a ação financeira externa não é executada.
3. **Given** que o administrador preenche o motivo, confirmação e clica no botão destrutivo, **When** o estorno é processado com sucesso, **Then** o status da transação e da consulta é atualizado para estornado, um registro de auditoria imutável é gravado e o botão de estorno torna-se permanentemente indisponível.
4. **Given** um pagamento aprovado cujo laudo veicular oficial já foi concluído e disponibilizado ao cliente, **When** o administrador abre os detalhes da transação, **Then** o botão de estorno está inativo e exibe mensagem clara informando que o laudo já foi entregue com sucesso.

---

### User Story 4 - Reconciliação Autoritativa de Estornos Pendentes (Priority: P2)

Como administrador, desejo auditar e sincronizar o estado de estornos que permaneceram pendentes ou incertos junto ao gateway de pagamento com apenas um clique, para que a base de dados reflita com precisão o estado real do dinheiro e da transação sem intervenções manuais no banco de dados.

**Why this priority**: Em caso de timeouts do gateway ou respostas intermediárias assíncronas, o operador precisa garantir que o sistema descubra autoritativamente se o dinheiro retornou ao cliente ou se uma nova ação é necessária.

**Independent Test**: Acionar o botão de reconciliação em uma transação com estorno em estado pendente, verificando que o sistema consulta o histórico do gateway e atualiza atomicamente os registros caso o estorno tenha sido concluído.

**Acceptance Scenarios**:

1. **Given** uma transação com estorno em processamento no gateway, **When** o administrador aciona "Reconciliar estorno", **Then** o sistema consulta o provedor financeiro e, caso aprovado, atualiza o status para confirmado e cancela jobs pendentes de entrega.
2. **Given** que dois administradores tentam reconciliar ou acionar o estorno da mesma transação simultaneamente, **When** ambas as requisições chegam ao servidor, **Then** o sistema processa apenas uma e bloqueia a segunda com alerta de concorrência/idempotência, sem duplicar chamadas financeiras.

---

### User Story 5 - Reprocessamento Controlado de Entrega de Laudo (Priority: P3)

Como administrador, desejo reprocessar a busca veicular e a geração de laudo para pagamentos aprovados que sofreram falha técnica temporária (ou após a recarga de créditos na API externa), garantindo que consultas já estornadas ou já entregues não sejam reprocessadas, para entregar o produto contratado sem exigir novo pagamento do cliente.

**Why this priority**: Quando o operador recarrega os créditos da API Brasil ou quando uma instabilidade externa passageira cessa, o cliente pode receber seu laudo prontamente sem cancelamento da compra.

**Independent Test**: Localizar uma transação com entrega pendente ou retida por créditos, confirmar que o saldo externo foi normalizado, acionar o botão de reprocessamento, visualizar o aviso de advertência, confirmar a ação e checar a transição de estado da entrega para concluído.

**Acceptance Scenarios**:

1. **Given** uma consulta com pagamento aprovado sem laudo entregue e sem estorno iniciado, **When** o administrador aciona "Reprocessar entrega", **Then** um modal de confirmação exibe o último erro, alerta sobre a necessidade de saldo no provedor e exige confirmação antes de disparar a rotina.
2. **Given** que o estorno de uma transação já foi solicitado ou confirmado, **When** o administrador visualiza as ações, **Then** a opção de reprocessar a entrega está bloqueada com justificativa expressa.

---

### User Story 6 - Auditoria Detalhada e Timeline de Eventos (Priority: P3)

Como auditor ou gestor da AF Motos, desejo abrir os detalhes de qualquer transação e visualizar uma linha do tempo completa e cronológica de eventos (criação do pagamento, notificações do gateway, tentativas de entrega, falhas técnicas, solicitações de estorno e ações administrativas), para entender o ciclo de vida da transação com transparência operacional total.

**Why this priority**: Suporte a disputas, resolução de tickets complexos de clientes e governança interna exigem rastreabilidade de quem fez o que, quando e por qual motivo técnico ou comercial.

**Independent Test**: Abrir a gaveta/modal de detalhes de uma transação e verificar que os blocos de consulta, pagamento, entrega técnica, estorno e timeline de auditoria exibem horários, atores (sistema/administrador), status e mensagens higienizadas.

**Acceptance Scenarios**:

1. **Given** qualquer registro na tabela principal, **When** o administrador clica em "Ver detalhes", **Then** um painel lateral se abre com seções organizadas e timeline cronológica de todos os eventos associados àquela transação e consulta.
2. **Given** eventos de erro de rede ou respostas de provedores, **When** exibidos no painel de auditoria, **Then** nenhuma credencial, token secreto ou dado bancário sensível é exibido na tela ou nos logs.

---

### Edge Cases

- **Tentativa de estorno simultâneo por múltiplos administradores**: O primeiro adquire a trava de idempotência; o segundo recebe retorno amigável informando que a operação já foi iniciada.
- **Transação com pagamento aprovado, mas sem identificador oficial do gateway**: O sistema impede o estorno automático e orienta intervenção manual de suporte, pois não há código de cobrança válido para devolver.
- **Provedor de consulta veicular offline durante reprocessamento**: O sistema reclassifica a falha, preserva o histórico da tentativa e permite que o administrador decida entre nova tentativa posterior ou estorno.
- **Cliente solicitou chargeback/contestação diretamente no banco emissor do cartão**: O sistema indica o status especial de mediação e desativa o botão de estorno simples para evitar conflito com a disputa em andamento.
- **Laudo emitido por cache ou mock em ambiente produtivo**: O sistema identifica a inconsistência, impede que dados simulados sejam considerados oficiais e permite o reprocessamento live ou o estorno ao cliente.
- **Falha de rede durante o processamento do estorno no gateway**: A transação passa para o estado pendente com motivo registrado, permitindo a reconciliação autoritativa posterior sem gerar duplicidade.

---

## Requirements _(mandatory)_

### Functional Requirements

#### Acesso e Segurança
- **FR-001**: O sistema DEVE restringir o acesso à rota administrativa e a todas as suas operações exclusivamente a usuários autenticados com papel administrativo ativo (`admin` ou `super_admin`).
- **FR-002**: Todas as operações de leitura, consulta de detalhes, estorno, reconciliação e reprocessamento DEVEM validar a autorização no lado do servidor, rejeitando qualquer tentativa não autorizada com código de erro HTTP apropriado (401/403).
- **FR-003**: O sistema NUNCA DEVE expor chaves secretas, tokens de integração (como credenciais do gateway de pagamento ou da API de consulta veicular), assinaturas criptográficas ou dados bancários sensíveis em telas, payloads de resposta ou logs.

#### Indicadores e Painel Operacional
- **FR-004**: O painel DEVE exibir cards de indicadores consolidados no topo da página, refletindo o período selecionado: Pagamentos Aprovados, Laudos Concluídos, Consultas em Processamento, Consultas em Retry, Falhas Permanentes, Estornos Pendentes, Estornos Confirmados e Casos de Saldo Insuficiente no Provedor.
- **FR-005**: Cada card DEVE ser interativo, aplicando o respectivo filtro na tabela ao ser clicado pelo administrador, acompanhado de descrição/tooltip explicativo e sinalização semântica visual e textual acessível.
- **FR-006**: O painel DEVE destacar uma seção prioritária de "Ações Necessárias" para casos urgentes (estornos pendentes há muito tempo, falhas de saldo na API Brasil e jobs retidos).

#### Listagem, Busca e Filtros
- **FR-007**: A tabela principal DEVE listar os pagamentos vinculados às consultas veiculares com paginação no servidor, ordenando por padrão casos com ação pendente em primeiro lugar, seguidos pelos mais recentes.
- **FR-008**: A tabela DEVE exibir: data/hora no fuso horário do negócio, placa veicular formatada, nome/e-mail do cliente, valor em Reais (BRL), status no gateway financeiro, estado de entrega do laudo, origem dos dados do laudo (cache, provedor live ou bloqueio), último status de consulta técnica, estado do estorno e ações disponíveis.
- **FR-009**: O sistema DEVE fornecer mecanismo de busca textual eficiente por placa do veículo, código interno da transação, código do pagamento no gateway, código de estorno e nome ou e-mail do cliente.
- **FR-010**: O sistema DEVE fornecer filtros combináveis por: período de datas, status de pagamento, status de entrega, status de estorno, código de falha do provedor, origem dos dados e atalhos operacionais rápidos (ex.: "Apenas saldo insuficiente", "Aprovados sem laudo", "Estornos pendentes/com falha").
- **FR-011**: O estado dos filtros e da página atual DEVE ser sincronizado com parâmetros de URL (`query params`), permitindo que a equipe compartilhe links internos diretos para análises operacionais.

#### Painel de Detalhes e Rastreabilidade
- **FR-012**: Ao acionar "Ver detalhes" em qualquer linha, o sistema DEVE abrir um painel lateral contendo blocos estruturados: Consulta, Pagamento, Provedor Veicular / Entrega, Estorno e Linha do Tempo de Auditoria.
- **FR-013**: A linha do tempo de auditoria DEVE apresentar cada evento em ordem cronológica com data/hora exata, tipo de evento, ator responsável (cliente, sistema, webhook ou administrador), mudança de estado e motivo técnico higienizado.

#### Gestão e Elegibilidade de Estorno
- **FR-014**: O botão "Solicitar estorno" DEVE estar habilitado exclusivamente quando a transação atender cumulativamente a todas as regras de elegibilidade:
  1. Solicitante é administrador autenticado e ativo.
  2. Pagamento está no estado aprovado no gateway.
  3. Código oficial do pagamento no gateway existe e é válido.
  4. Valor da transação é estritamente maior que zero.
  5. Não existe estorno prévio confirmado ou em processamento (solicitado/pendente) para a mesma transação.
  6. A consulta veicular NÃO possui laudo oficial válido concluído e entregue ao cliente.
  7. Ocorreu falha definitiva ou condição com necessidade de intervenção de suporte.
  8. O pagamento não se encontra sob disputa/contestação no gateway.
- **FR-015**: Quando a transação for inelegível para estorno, o sistema DEVE manter o botão desabilitado e exibir o motivo claro da inelegibilidade (ex.: "Laudo já entregue com sucesso", "Estorno já em andamento").
- **FR-016**: Ao acionar o estorno de uma transação elegível, o sistema DEVE abrir obrigatoriamente um modal de confirmação reforçada com o resumo financeiro, exigindo seleção de motivo (com justificativa obrigatória se for selecionado "Outro") e digitação exata da palavra de confirmação ("ESTORNAR").
- **FR-017**: O fluxo de estorno DEVE utilizar chave de idempotência estável e persistida, garantindo que mesmo sob requisições duplicadas ou concorrentes nunca seja gerada mais de uma solicitação de estorno no gateway para a mesma transação.
- **FR-018**: O estorno DEVE utilizar exclusivamente o identificador oficial de pagamento do gateway (`mp_payment_id`), sendo terminantemente vedado o uso de identificadores de preferência ou referências externas para acionar devoluções financeiras.

#### Reconciliação e Reprocessamento
- **FR-019**: O sistema DEVE fornecer a ação "Reconciliar estorno" para transações com estorno solicitado, pendente ou falho, consultando autoritativamente o gateway para sincronizar o status real da devolução no banco de dados.
- **FR-020**: O sistema DEVE fornecer a ação "Reprocessar entrega do laudo" para consultas pagas que falharam por indisponibilidade temporária ou falta de saldo após este ser restabelecido, desde que o laudo ainda não tenha sido entregue e nenhum estorno tenha sido iniciado ou confirmado.
- **FR-021**: Ao acionar o reprocessamento em caso de saldo insuficiente prévio, o sistema DEVE alertar explicitamente o operador sobre a obrigatoriedade de recarregar a conta do provedor antes da confirmação.

#### Auditoria e Observabilidade
- **FR-022**: Toda ação administrativa (visualização detalhada, solicitação de estorno, reconciliação e reprocessamento) DEVE gerar log estruturado com prefixo padronizado `[ADMIN_PAYMENTS]` e registro persistido de auditoria identificando o administrador responsável.
- **FR-023**: A interface DEVE seguir os padrões de design escuro, acessibilidade (contraste, foco no teclado em modais, leitores de tela com `aria-label`, feedback textual em ações), skeletons de carregamento e mensagens claras em português.

---

### Key Entities _(include if feature involves data)_

- **Transação de Pagamento (`payment_transactions`)**: Registro financeiro que conecta o cliente à sua compra de consulta veicular. Contém referências do gateway de pagamento, valor, método, parcelamento, status interno, status do gateway e timestamps de cobrança e atualização.
- **Consulta Veicular do Cliente (`customer_plate_consultations`)**: Registro da consulta contratada pelo cliente para uma placa específica. Contém status da consulta, status do pagamento, dados do veículo e laudo técnico quando emitido.
- **Estorno de Pagamento (`payment_refunds`)**: Registro imutável de solicitação e processamento de estorno. Armazena o código de pagamento do gateway, código do estorno retornado pelo gateway, valor estornado, chave de idempotência, status (`requested`, `pending`, `confirmed`, `failed`, `manual_review`), motivo e mensagens higienizadas de erro.
- **Job de Entrega de Laudo (`consultation_delivery_jobs`)**: Fila persistida de tentativas de obtenção do laudo veicular junto ao provedor de dados. Registra número de tentativas, agendamento de retentativa, locks pessimistas contra concorrência e códigos de falha técnica (ex.: saldo insuficiente).
- **Log de Auditoria (`consultation_audit_logs`)**: Rastro cronológico de todas as ocorrências associadas à consulta e ao pagamento, identificando o ator (cliente, sistema, webhook ou administrador), o evento realizado, o status anterior/novo e metadados contextuais.
- **Perfil de Administrador (`admin_profiles`)**: Cadastro com permissões administrativas ativas vinculado à autenticação do Supabase, utilizado para autorizar o acesso à central e registrar a autoria das decisões operacionais.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Administradores autorizados conseguem localizar qualquer pagamento ou consulta veicular por placa ou código em menos de 3 segundos utilizando a busca da central.
- **SC-002**: Redução a 0% de estornos duplicados ou devoluções financeiras indevidas de laudos já entregues com sucesso, graças às travas automatizadas de elegibilidade e idempotência.
- **SC-003**: 100% das transações impactadas por saldo insuficiente do provedor veicular são automaticamente catalogadas e filtráveis em um único clique no painel.
- **SC-004**: O tempo operacional de triagem e devolução financeira de consultas não atendíveis cai de intervenções manuais complexas para menos de 1 minuto por caso via interface guiada.
- **SC-005**: 100% das mutações operacionais (estornos, reconciliações e reprocessamentos) possuem registro de auditoria com ator administrativo rastreável e log estruturado.
- **SC-006**: Acesso negado com 100% de eficácia em nível de backend para qualquer requisição de usuário comum ou anônimo contra rotas da central administrativa.

---

## Assumptions

- O projeto já possui a tabela `admin_profiles` e a função SQL `public.is_admin()` devidamente configuradas no Supabase para verificação de permissões.
- A aplicação utiliza o SDK oficial do Mercado Pago no backend com credenciais configuradas para operações de consulta de pagamentos e estornos (`PaymentRefund`).
- As tabelas `payment_transactions`, `payment_refunds`, `customer_plate_consultations`, `consultation_delivery_jobs` e `consultation_audit_logs` já existem no banco de dados e devem ser aproveitadas integralmente sem duplicidades.
- O gateway de pagamento permite estorno total enquanto a transação estiver no estado aprovado e dentro da janela permitida de contestação/devolução do provedor.
- As consultas veiculares que sofreram erro definitivo por créditos esgotados possuem o código seguro `APIBRASIL_INSUFFICIENT_CREDITS` armazenado no histórico técnico.
- A interface administrativa segue o tema escuro padrão com Tailwind CSS e componentes shadcn/ui já presentes na área restrita da aplicação.
