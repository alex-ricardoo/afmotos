# Feature Specification: Pagamento Mercado Pago para Consulta Veicular

**Feature Branch**: `026-mercadopago-vehicle-payment`

**Created**: 2026-09-12

**Status**: Draft

**Input**: User description: "Implementar integração de pagamento real com Mercado Pago (Payment Brick) para consultas veiculares na Área do Cliente, substituindo o pagamento simulado existente. Inclui validação de webhook HMAC, estorno automático em caso de falha da consulta, orquestração mock/live do serviço de consulta veicular, e painel administrativo de transações."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Cliente paga e recebe consulta veicular (Priority: P1)

Um cliente autenticado deseja consultar o histórico de um veículo pela placa. Ele acessa a área de consulta, informa a placa, visualiza o valor da consulta e realiza o pagamento usando o meio de pagamento de sua preferência (cartão, Pix, etc.) através da interface integrada do Mercado Pago. Após confirmação do pagamento, o sistema processa a consulta automaticamente e disponibiliza o resultado no painel do cliente.

**Why this priority**: Este é o fluxo principal de receita do produto. Sem pagamento real, a funcionalidade de consulta veicular para clientes não gera valor comercial.

**Independent Test**: Pode ser testado com um cliente de teste realizando uma consulta completa do início ao fim — informando placa, pagando com cartão de teste do Mercado Pago e verificando que o resultado da consulta aparece no painel.

**Acceptance Scenarios**:

1. **Given** um cliente autenticado com uma placa válida, **When** ele informa a placa e solicita a consulta, **Then** o sistema exibe o valor correto da consulta e a interface de pagamento do Mercado Pago.
2. **Given** o cliente completa o pagamento com sucesso, **When** o pagamento é confirmado pelo Mercado Pago, **Then** o sistema processa a consulta veicular e disponibiliza o resultado no painel do cliente.
3. **Given** o cliente já possui uma consulta disponível para a mesma placa, **When** ele tenta consultar novamente, **Then** o sistema exibe o resultado existente sem cobrar novamente.
4. **Given** o valor da consulta é definido no sistema, **When** o cliente visualiza o preço, **Then** o valor exibido corresponde exatamente ao valor configurado pelo administrador, sem possibilidade de alteração pelo cliente.

---

### User Story 2 - Webhook confirma pagamento e libera consulta com segurança (Priority: P1)

O sistema recebe notificações do Mercado Pago via webhook quando o status de um pagamento muda. Cada notificação é validada criptograficamente antes de ser processada. O sistema verifica o pagamento diretamente com o Mercado Pago e só libera a consulta após confirmação positiva server-side. Notificações duplicadas ou fraudulentas são rejeitadas sem efeitos colaterais.

**Why this priority**: Segurança financeira e integridade do fluxo. Sem validação server-side, um atacante poderia simular pagamento e obter consultas gratuitamente.

**Independent Test**: Enviar uma notificação de webhook válida e verificar que a consulta é liberada; enviar uma notificação com assinatura inválida e verificar que é rejeitada; enviar a mesma notificação duas vezes e verificar que a consulta não é processada em duplicidade.

**Acceptance Scenarios**:

1. **Given** um pagamento pendente no sistema, **When** chega uma notificação autêntica de pagamento aprovado do Mercado Pago, **Then** o sistema confirma o pagamento e inicia o processamento da consulta.
2. **Given** uma notificação de webhook, **When** a assinatura criptográfica é inválida, **Then** o sistema rejeita a notificação sem processar nenhuma ação.
3. **Given** uma notificação de pagamento aprovado já processada, **When** a mesma notificação chega novamente, **Then** o sistema a ignora sem criar duplicidade de consulta ou estorno.
4. **Given** um pagamento com valor diferente do registrado no sistema, **When** o webhook tenta confirmar esse pagamento, **Then** o sistema rejeita a confirmação e registra o evento para auditoria.

---

### User Story 3 - Estorno automático quando a consulta falha (Priority: P1)

Quando o pagamento do cliente é aprovado, mas o serviço de consulta veicular falha por motivos técnicos (indisponibilidade do provedor, saldo do provedor insuficiente, timeout), o sistema deve estornar automaticamente o valor pago ao cliente. O cliente recebe uma mensagem clara informando a indisponibilidade temporária, o status do estorno e um canal de suporte.

**Why this priority**: Confiança do cliente e obrigação ética/legal. Cobrar sem entregar o serviço é inaceitável. O estorno automático reduz atrito e chamados de suporte.

**Independent Test**: Simular uma falha do provedor de consulta veicular após pagamento aprovado e verificar que o estorno é iniciado automaticamente, o cliente recebe notificação adequada e o administrador vê o registro completo.

**Acceptance Scenarios**:

1. **Given** um pagamento aprovado e o provedor de consulta retorna erro técnico, **When** o sistema detecta a falha, **Then** um estorno automático é iniciado junto ao Mercado Pago.
2. **Given** um estorno solicitado com sucesso, **When** o cliente acessa sua consulta, **Then** ele vê uma mensagem informando que o serviço está temporariamente indisponível e que o pagamento será estornado, com prazo e canal de suporte.
3. **Given** um estorno que falha no Mercado Pago, **When** o administrador acessa o painel, **Then** ele vê a transação marcada para revisão manual, com opção de tentar novamente ou reconciliar.
4. **Given** uma consulta já entregue com sucesso, **When** qualquer processo tenta estornar automaticamente, **Then** o sistema bloqueia o estorno e sinaliza a tentativa para revisão.

---

### User Story 4 - Pagamento com meio assíncrono (Pix/boleto) (Priority: P2)

Um cliente que escolhe Pix, boleto ou outro meio de pagamento assíncrono recebe instruções claras e pode acompanhar o status do pagamento. A consulta só é liberada quando a confirmação chega pelo webhook. O cliente pode verificar o status da solicitação e iniciar nova tentativa caso o pagamento expire ou seja rejeitado.

**Why this priority**: Pix é o meio de pagamento mais popular no Brasil. Suportar pagamentos assíncronos amplia a base de clientes pagantes.

**Independent Test**: Iniciar um pagamento com Pix de teste, verificar que a consulta não é liberada prematuramente, aguardar a confirmação e verificar que o fluxo completa normalmente.

**Acceptance Scenarios**:

1. **Given** o cliente seleciona Pix como meio de pagamento, **When** o pagamento fica pendente, **Then** o sistema exibe "Estamos aguardando a confirmação do seu pagamento" com identificação da solicitação e opção de atualizar status.
2. **Given** um pagamento pendente, **When** o cliente clica em "Atualizar status", **Then** o sistema verifica o status diretamente com o Mercado Pago e atualiza a interface.
3. **Given** um pagamento que expira ou é rejeitado, **When** o cliente retorna à área de consulta, **Then** ele pode iniciar uma nova tentativa de pagamento sem perder o histórico da tentativa anterior.

---

### User Story 5 - Administrador audita transações de consultas (Priority: P2)

Um administrador autorizado acessa o painel administrativo para visualizar, filtrar e detalhar todas as transações de pagamento de consultas veiculares. Ele pode buscar por cliente, placa, status ou período, visualizar a linha do tempo completa de cada transação (pagamento, consulta, estorno) e executar ações de reconciliação quando necessário.

**Why this priority**: Visibilidade operacional e resolução de problemas. Sem painel administrativo, qualquer incidente requer acesso direto ao banco de dados.

**Independent Test**: Acessar como administrador o painel de transações, verificar que as transações aparecem com filtros funcionais, abrir o detalhe de uma transação e verificar a linha do tempo completa.

**Acceptance Scenarios**:

1. **Given** um administrador autenticado, **When** ele acessa o painel de transações, **Then** ele vê a lista paginada de transações com informações de cliente, placa, valor, status de pagamento e status de consulta.
2. **Given** uma transação com estorno falhado, **When** o administrador abre os detalhes, **Then** ele vê a linha do tempo completa, o motivo da falha e opções de reconciliação/retry.
3. **Given** o administrador busca por email de um cliente, **When** insere o email na busca, **Then** o sistema retorna somente transações daquele cliente.
4. **Given** um cliente comum autenticado, **When** ele tenta acessar a rota administrativa, **Then** o acesso é negado.

---

### User Story 6 - Modo de desenvolvimento sem consumo de API externa (Priority: P2)

Em ambiente de desenvolvimento ou homologação, o sistema opera em modo simulado para consultas veiculares: o pagamento passa pelo fluxo completo do Mercado Pago de teste, mas a consulta veicular retorna dados de teste fixos sem chamar nenhuma API externa paga. Isso permite testar todo o fluxo sem custos.

**Why this priority**: Desenvolvimento e testes seguros. Sem este modo, cada teste consome créditos reais da API de consulta veicular.

**Independent Test**: Configurar o ambiente em modo de teste, realizar um pagamento com credenciais sandbox, verificar que a consulta retorna dados de teste e que nenhuma API externa é chamada.

**Acceptance Scenarios**:

1. **Given** o ambiente está em modo de teste, **When** um pagamento é aprovado, **Then** a consulta retorna dados de teste sem chamar API externa.
2. **Given** o ambiente está em modo de teste, **When** o resultado é exibido ao cliente, **Then** não há indicação visível de que é modo de teste (apenas o administrador vê esta informação no painel).
3. **Given** o ambiente está em modo produção, **When** um pagamento é aprovado, **Then** a consulta usa o provedor real de dados veiculares.

---

### Edge Cases

- O que acontece se o cliente fecha o navegador durante o pagamento? O webhook continua processando normalmente, independente do estado do navegador.
- O que acontece se o webhook do Mercado Pago não chega? O cliente pode verificar manualmente o status, e o sistema pode reconciliar consultando o Mercado Pago diretamente.
- O que acontece se dois clientes consultam a mesma placa simultaneamente? Cada um tem sua própria transação e consulta independente — dados de um cliente não são compartilhados com outro.
- O que acontece se o cliente tenta pagar duas vezes pela mesma consulta? O sistema detecta transação existente e previne cobrança duplicada.
- O que acontece se o provedor de consulta retorna resultado parcial ou ambíguo? O sistema não estorna automaticamente se houver possibilidade de que o serviço foi consumido; encaminha para revisão manual.
- O que acontece se o Mercado Pago confirma pagamento com valor divergente? O sistema rejeita a confirmação e registra para auditoria.
- O que acontece durante retry de estorno após falha? O sistema tenta até um número limitado de vezes com intervalo crescente, depois encaminha para revisão manual administrativa.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema MUST substituir o pagamento simulado existente por uma integração real com Mercado Pago na área do cliente.
- **FR-002**: O sistema MUST exibir a interface de pagamento do Mercado Pago (Payment Brick) na página de pagamento da consulta.
- **FR-003**: O valor da consulta MUST ser definido exclusivamente por configuração administrativa no sistema, nunca pelo cliente.
- **FR-004**: O sistema MUST validar criptograficamente (HMAC) todas as notificações de webhook recebidas do Mercado Pago antes de processá-las.
- **FR-005**: O sistema MUST confirmar o status do pagamento diretamente com o Mercado Pago (server-side) antes de liberar qualquer consulta veicular.
- **FR-006**: O processamento de webhooks MUST ser idempotente — o mesmo evento recebido múltiplas vezes não pode causar efeitos duplicados (consulta, estorno ou crédito).
- **FR-007**: A consulta veicular MUST ser processada somente após confirmação server-side de pagamento aprovado.
- **FR-008**: Em modo de teste, a consulta veicular MUST usar dados de teste fixos sem chamar nenhuma API externa paga.
- **FR-009**: Em modo de produção, a consulta veicular MUST usar o provedor real de dados veiculares, reutilizando a infraestrutura existente de consulta.
- **FR-010**: O sistema MUST iniciar estorno automático quando o pagamento é aprovado, mas a consulta falha por motivo técnico do provedor (erro, timeout, saldo insuficiente do provedor).
- **FR-011**: O sistema MUST NOT estornar automaticamente consultas já entregues com sucesso.
- **FR-012**: O estorno MUST ser idempotente — múltiplas tentativas não podem gerar estornos duplicados.
- **FR-013**: O sistema MUST exibir ao cliente mensagem clara e canal de suporte (WhatsApp) quando a consulta não puder ser concluída após pagamento.
- **FR-014**: Pagamentos pendentes (Pix, boleto) MUST NOT liberar a consulta até confirmação definitiva.
- **FR-015**: O cliente MUST poder verificar o status do pagamento pendente a qualquer momento.
- **FR-016**: Pagamentos rejeitados, cancelados ou expirados MUST permitir ao cliente iniciar nova tentativa sem perder histórico.
- **FR-017**: O sistema MUST manter registro completo de auditoria de todas as transações, eventos de webhook, tentativas de consulta e estornos.
- **FR-018**: O painel administrativo MUST permitir listagem, busca, filtros e paginação de transações de consultas veiculares.
- **FR-019**: O painel administrativo MUST exibir detalhes completos com linha do tempo de cada transação.
- **FR-020**: Administradores autorizados MUST poder executar reconciliação e retry de estorno com confirmação e auditoria.
- **FR-021**: O sistema MUST garantir que credenciais de pagamento e tokens do provedor de consulta veicular nunca sejam expostos ao navegador do cliente.
- **FR-022**: Cada cliente MUST acessar somente suas próprias transações e consultas — isolamento total entre clientes.
- **FR-023**: O fluxo administrativo existente de consulta de placa MUST continuar funcionando sem alterações.
- **FR-024**: Se o cliente já possui uma consulta disponível para a mesma placa, o sistema MUST exibir o resultado existente sem cobrar novamente.
- **FR-025**: O modo de operação (teste/produção) da consulta veicular MUST ser definido exclusivamente por configuração do servidor, nunca pelo cliente.

### Key Entities _(include if feature involves data)_

- **Transação de Pagamento**: Representa uma tentativa de pagamento de um cliente por uma consulta veicular. Contém valor, status do pagamento, referência ao Mercado Pago, status de estorno e vínculo com a consulta e o cliente. Uma consulta pode ter múltiplas tentativas de pagamento (em caso de rejeição/expiração seguida de nova tentativa).
- **Evento de Webhook**: Registro de auditoria de cada notificação recebida do Mercado Pago, com validação de assinatura, status de processamento e vínculo com a transação correspondente. Garante idempotência e rastreabilidade.
- **Tentativa de Consulta**: Registro de cada tentativa de processamento da consulta veicular após pagamento aprovado, incluindo modo de operação, provedor, status e detalhes de falha quando aplicável.
- **Consulta Veicular (existente)**: Entidade existente no sistema que armazena o resultado da consulta. Será estendida com campos de rastreabilidade de pagamento e origem (administrativa vs. cliente pago).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% dos pagamentos de consulta veicular passam pelo fluxo real do Mercado Pago — nenhum pagamento simulado permanece na área do cliente.
- **SC-002**: O cliente completa o fluxo de pagamento e recebe o resultado da consulta em menos de 2 minutos (em condições normais de operação).
- **SC-003**: 100% das notificações de webhook com assinatura inválida são rejeitadas sem nenhuma ação ser executada.
- **SC-004**: Nenhuma consulta é liberada ao cliente sem confirmação positiva de pagamento verificada diretamente com o provedor de pagamento.
- **SC-005**: Em caso de falha técnica do provedor de consulta, o estorno automático é iniciado em até 30 segundos após detecção da falha.
- **SC-006**: O estorno nunca é executado em duplicidade, mesmo sob recebimento de múltiplas notificações simultâneas.
- **SC-007**: O administrador pode localizar qualquer transação por cliente, placa ou status em menos de 15 segundos usando busca e filtros.
- **SC-008**: Nenhuma credencial secreta ou token de provedor aparece em código do navegador, logs públicos ou dados retornados ao cliente.
- **SC-009**: Transações de pagamento de um cliente são completamente invisíveis para outros clientes.
- **SC-010**: O fluxo funciona corretamente em dispositivos móveis, tablets e desktops.

## Assumptions

- O sistema de autenticação existente (Supabase Auth com Google OAuth e email) será reutilizado sem alterações.
- O preço da consulta veicular já está configurável via tabela ou configuração existente no sistema.
- O fluxo de consulta de placa existente (normalização, cache, controle de concorrência, persistência) será reutilizado sem recriação.
- O mecanismo de administração existente (admin_profiles/permissões) será reutilizado para o novo painel de transações.
- O número de telefone de suporte WhatsApp já está disponível em configuração do sistema (site_settings ou equivalente).
- Credenciais do Mercado Pago (sandbox e produção) serão configuradas pelo proprietário do negócio no painel de desenvolvedores do Mercado Pago.
- O provedor de consulta veicular (API Brasil) já está integrado e funcional no modo live existente.
- Múltiplas tentativas de pagamento por consulta são permitidas (em caso de rejeição/expiração da primeira tentativa).
- O Mercado Pago suporta estorno programático via SDK/API para os meios de pagamento oferecidos.
- O ambiente de deployment (Vercel) suporta webhooks com acesso ao corpo bruto da requisição para validação HMAC.
