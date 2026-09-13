# Feature Specification: Checkout Pro Mercado Pago para Consulta Veicular

**Feature Branch**: `028-mercadopago-checkout-pro`  
**Created**: 2026-09-12  
**Status**: Draft  
**Input**: User description: "Implement Mercado Pago Checkout Pro as the sole active online-payment flow for paid vehicle consultation reports in AF Motos."  

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Iniciar Pagamento Seguro via Checkout Pro (Priority: P1)

Como um cliente autenticado com uma consulta veicular pendente de pagamento, quero iniciar o pagamento clicando em "Pagar com Mercado Pago", para ser redirecionado com segurança para o ambiente hospedado do Mercado Pago sem expor dados de cartão na aplicação AF Motos.

**Why this priority**: É a porta de entrada indispensável para a monetização de consultas veiculares. Sem a inicialização segura do checkout hospedado, os clientes não conseguem pagar pelos laudos.

**Independent Test**: Pode ser testado de forma independente criando uma consulta veicular pendente, clicando em "Pagar com Mercado Pago", verificando a criação da transação interna pendente e recebendo o redirecionamento com URL HTTPS segura da plataforma de checkout.

**Acceptance Scenarios**:

1. **Given** que o cliente possui uma consulta veicular com status `pending` e `payment_status = 'unpaid'`,  
   **When** clica no botão "Pagar com Mercado Pago",  
   **Then** o servidor valida a titularidade, calcula o valor canônico oficial no backend, cria um registro pendente em `payment_transactions`, gera uma Preferência no Mercado Pago com `external_reference` vinculado à transação e retorna a URL de redirecionamento hospedada (`init_point` / `sandbox_init_point`).
2. **Given** que o cliente tenta clicar múltiplas vezes seguidas no botão de pagamento,  
   **When** a primeira requisição está em trânsito ou acabou de criar uma transação pendente válida,  
   **Then** o sistema previne criação concorrente duplicada através de chave de idempotência e reutiliza com segurança a tentativa aberta elegível.
3. **Given** que um usuário tenta iniciar pagamento para uma consulta pertencente a outro cliente ou já com status `completed` / `paid`,  
   **When** a requisição de checkout é enviada,  
   **Then** o sistema rejeita a operação com erro de permissão/estado inválido e não cria nenhuma transação ou preferência.
4. **Given** que o navegador envia valores adulterados (ex.: preço zero, moeda alterada ou status falso),  
   **When** a preferência é processada no servidor,  
   **Then** todos os parâmetros enviados pelo navegador são ignorados e apenas a fonte canônica do banco de dados determina o valor real da consulta.

---

### User Story 2 - Pagamento Hospedado e Retorno do Cliente à AF Motos (Priority: P1)

Como um cliente que realizou o pagamento na página hospedada do Mercado Pago (via Pix, cartão, débito ou boleto), quero retornar à plataforma AF Motos e visualizar o status transparente da minha consulta, acessando o laudo veicular assim que a confirmação oficial for recebida.

**Why this priority**: Garante o fechamento do ciclo de experiência do comprador sem comprometer a integridade financeira, assegurando que o laudo nunca seja liberado por simples visita à URL de retorno.

**Independent Test**: Pode ser testado simulando o fluxo de retorno com parâmetros de sucesso, pendência ou falha, confirmando que a interface reflete a situação do banco de dados e aguarda a conciliação do webhook/API antes de liberar o laudo.

**Acceptance Scenarios**:

1. **Given** que o cliente concluiu o pagamento no Checkout Pro e foi redirecionado para a página de retorno da AF Motos,  
   **When** a página de retorno carrega,  
   **Then** ela consulta o status interno da transação sem confiar em parâmetros de query (`collection_status`, `payment_id`), exibindo tela de "Aguardando confirmação" ou "Pagamento confirmado" conforme o estado verificado no servidor.
2. **Given** que a transação ainda está com status pendente de processamento,  
   **When** a página de retorno permanece aberta,  
   **Then** a interface realiza sondagem controlada (polling com limite máximo de tentativas e intervalo seguro) até que o estado transite para aprovado ou atinja o tempo limite amigável com opção de atualização manual.
3. **Given** que a transação foi aprovada pelo provedor e o laudo foi gerado,  
   **When** a página de retorno detecta a confirmação,  
   **Then** o cliente recebe acesso direto para visualizar seu laudo completo da consulta veicular.
4. **Given** que o pagamento foi recusado ou cancelado no provedor,  
   **When** o cliente retorna à aplicação,  
   **Then** a interface apresenta mensagem clara de pagamento não autorizado e permite reiniciar uma nova tentativa de forma segura.

---

### User Story 3 - Sincronização Autoritativa via Webhook com Validação de Assinatura (Priority: P1)

Como sistema AF Motos, quero receber notificações via webhook enviadas pelo Mercado Pago, validar a assinatura criptográfica HMAC-SHA256 e consultar os dados definitivos do pagamento diretamente na API do provedor, para desbloquear a consulta e executar a busca veicular exatamente uma vez.

**Why this priority**: O webhook é a única fonte confiável e assíncrona de liquidação financeira. Sem ele, pagamentos via Pix ou offline e clientes que fecham o navegador ficariam sem receber seus relatórios.

**Independent Test**: Pode ser testado enviando payload de notificação assinado, verificando a validação HMAC, consulta à API do provedor, persistência do ID real do pagamento (`mp_payment_id`), atualização atômica da transação e disparo único da rotina de consulta veicular.

**Acceptance Scenarios**:

1. **Given** que uma notificação de pagamento do Mercado Pago chega ao endpoint de webhook com cabeçalho `x-signature` válido,  
   **When** a assinatura HMAC é verificada contra o segredo do webhook no servidor,  
   **Then** o evento é registrado na tabela de auditoria, os dados do pagamento são buscados diretamente na API do Mercado Pago e o status é mapeado com segurança.
2. **Given** que o pagamento verificado está com status `approved` e a consulta vinculada ainda não foi liberada,  
   **When** a transação é atualizada,  
   **Then** a consulta veicular é marcada como paga, a execução da busca na base veicular é acionada exatamente uma vez e o resultado é gravado com log de auditoria.
3. **Given** que o Mercado Pago reenvia a mesma notificação (retry) ou envia eventos fora de ordem,  
   **When** o webhook processa a mensagem subsequente,  
   **Then** o mecanismo de idempotência identifica que a transação e o laudo já foram processados, respondendo HTTP 200 prontamente sem reexecutar a busca veicular nem gerar duplicações financeiras.
4. **Given** que uma notificação chega com cabeçalho `x-signature` ausente, forjado ou inválido,  
   **When** o validador inspeciona a requisição,  
   **Then** a requisição é rejeitada, o status da transação não é alterado e o evento suspeito é registrado para auditoria de segurança.

---

### User Story 4 - Consulta Segura de Status da Transação pelo Cliente (Priority: P2)

Como um cliente autenticado na área do cliente, quero verificar o status atualizado do meu pagamento, para saber se meu laudo veicular já está liberado ou se há alguma ação pendente.

**Why this priority**: Fornece visibilidade transparente ao usuário e desacopla a verificação de status no frontend de quaisquer dados sensíveis do provedor.

**Independent Test**: Pode ser testado via endpoint `/api/mp/transactions/[transactionId]/status`, garantindo que apenas campos higienizados e normalizados sejam retornados para o usuário autenticado dono da transação.

**Acceptance Scenarios**:

1. **Given** que o cliente solicita o status da sua própria transação,  
   **When** o endpoint responde,  
   **Then** retorna apenas campos normalizados (`status`, `statusDetail`, `consultationStatus`, `reportAvailable`, `retryable`), omitindo tokens, chaves, dados completos do pagador e payloads brutos do provedor.
2. **Given** que um usuário tenta consultar uma transação de outro usuário,  
   **When** a requisição é validada pelo backend,  
   **Then** o sistema retorna HTTP 403/404 preservando a privacidade entre clientes.

---

### User Story 5 - Reconciliação e Visibilidade Administrativa (Priority: P3)

Como administrador da AF Motos, quero auditar as tentativas de pagamento, visualizar transações pendentes/reconciliadas e disparar reconciliação segura com o Mercado Pago para casos de atraso de notificação, sem permitir marcação manual de pagamento sem verificação oficial da API.

**Why this priority**: Garante suporte operacional a incidentes de rede, atrasos em webhooks ou dúvidas de clientes com total rastreabilidade contábil.

**Independent Test**: Pode ser testado na área administrativa disparando o serviço de reconciliação para uma transação com ID de pagamento real e confirmando que o status é atualizado apenas conforme a resposta da API do Mercado Pago.

**Acceptance Scenarios**:

1. **Given** que um administrador inspeciona uma transação com notificação atrasada que possui `mp_payment_id` registrado,  
   **When** aciona a ação de reconciliação,  
   **Then** o servidor efetua requisição direta ao Mercado Pago, atualiza a transação idempotentemente e registra o log de auditoria com a identificação do operador.
2. **Given** que uma transação não possui comprovante verificado pelo provedor,  
   **When** um administrador visualiza a transação,  
   **Then** o sistema não disponibiliza opção de aprovação manual unilateral sem validação oficial do provedor.

---

### Edge Cases

- **Queda de conexão no momento do redirecionamento**: O cliente clica no botão, a preferência é criada no banco, mas a janela fecha antes da abertura do Mercado Pago. A tentativa permanece `pending`; se o cliente reabrir a página, pode retomar a mesma tentativa ou iniciar uma nova sem inconsistência.
- **Cliente paga via Pix ou boleto e fecha o navegador**: O retorno visual não ocorre, mas o webhook do Mercado Pago notifica o servidor da AF Motos, que liquida a transação e processa o laudo em segundo plano. Quando o cliente retornar à área do cliente, encontrará a consulta concluída.
- **Notificações de webhook fora de ordem**: O Mercado Pago pode enviar status `in_process` depois de um `approved` por atraso de entrega de rede. O mapeador de status rejeita downgrade de estados terminais aprovados.
- **Falha na API de busca veicular após pagamento aprovado**: O pagamento já foi recebido e permanece `approved`, mas a consulta de dados veiculares falha por instabilidade de fornecedor. O sistema transita a consulta para `failed` operacional com registro de auditoria para reexecução manual/automática segura pela equipe, sem perda de comprovação financeira.
- **Tentativa de estorno sem ID oficial**: Solicitações de estorno/cancelamento só podem ser executadas se existir um `mp_payment_id` aprovado válido confirmado na API do Mercado Pago.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema MUST criar preferências de pagamento exclusivamente no servidor através da rota autenticada `POST /api/mp/checkout-pro/preferences`.
- **FR-002**: O sistema MUST validar que o cliente autenticado é o legítimo proprietário da consulta veicular antes de gerar a preferência.
- **FR-003**: O sistema MUST obter o preço canônico oficial da consulta veicular a partir da tabela de configurações do servidor (`site_settings`), ignorando categoricamente qualquer valor monetário vindo do navegador.
- **FR-004**: O sistema MUST criar um registro em `payment_transactions` com status `pending` e chave de idempotência UUID única antes de invocar a criação da preferência no Mercado Pago.
- **FR-005**: O sistema MUST registrar o `mp_preference_id` retornado na linha correspondente de `payment_transactions`.
- **FR-006**: O sistema MUST definir o campo `external_reference` da preferência como o UUID da transação interna (`payment_transactions.id`) para permitir correlação precisa nos webhooks.
- **FR-007**: O sistema MUST configurar as URLs de retorno (`back_urls`) da preferência apontando para a rota interna `/cliente/pagamento/retorno/[transactionId]`.
- **FR-008**: O sistema MUST definir `auto_return: "approved"` na preferência do Checkout Pro para retorno automático após conclusão positiva de pagamento.
- **FR-009**: O sistema MUST configurar a URL pública de notificação HTTPS (`notification_url`) apontando para `/api/webhooks/mercadopago`.
- **FR-010**: O sistema MUST validar a URL de redirecionamento retornada pelo Mercado Pago para garantir que pertence aos domínios autorizados do provedor (`mercadopago.com`, `mercadopago.com.br`) antes de redirecionar o navegador.
- **FR-011**: O sistema MUST utilizar `sandbox_init_point` apenas quando configurado em modo de teste e `init_point` em ambiente de produção.
- **FR-012**: O sistema MUST manter os segredos `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_WEBHOOK_SECRET` restritos estritamente ao ambiente do servidor, nunca os expondo via variáveis `NEXT_PUBLIC_` ou respostas de API.
- **FR-013**: O sistema MUST receber requisições de webhook no endpoint `POST /api/webhooks/mercadopago` e validar a assinatura criptográfica HMAC-SHA256 (`x-signature` e `x-request-id`) com comparação em tempo constante (`crypto.timingSafeEqual`).
- **FR-014**: O sistema MUST registrar todos os eventos de webhook recebidos na tabela `webhook_events`, preservando auditoria e garantindo controle rigoroso de idempotência.
- **FR-015**: O sistema MUST buscar as informações definitivas do pagamento na API do Mercado Pago a partir do ID de pagamento recebido no webhook antes de efetuar qualquer alteração de estado.
- **FR-016**: O sistema MUST atualizar o registro de `payment_transactions` com `mp_payment_id`, status normalizado e carimbo de data/hora de forma atômica e idempotente.
- **FR-017**: O sistema MUST disparar a execução da consulta veicular (`releaseVerifiedPaidConsultation`) somente quando o pagamento for verificado com status `approved` e possuir `mp_payment_id` válido.
- **FR-018**: O sistema MUST garantir que a liberação da consulta veicular seja executada no máximo uma vez para cada transação aprovada, impedindo chamadas duplicadas à API de fornecedores.
- **FR-019**: O sistema MUST disponibilizar o endpoint de status `GET /api/mp/transactions/[transactionId]/status` com autenticação, validação de propriedade e apenas campos higienizados na resposta.
- **FR-020**: O sistema MUST renderizar a tela de retorno em `/cliente/pagamento/retorno/[transactionId]` exibindo estados contextuais claros (aprovado com laudo, processando, pendente, rejeitado e erro) com sondagem segura.
- **FR-021**: O sistema MUST impedir que a tela de retorno ou qualquer parâmetro de URL conceda aprovação de pagamento ou liberação de laudo sem confirmação prévia no banco de dados.
- **FR-022**: O sistema MUST preservar os registros históricos e a integridade das tabelas `payment_transactions`, `webhook_events`, `consultation_audit_logs` e `customer_plate_consultations` sem migrações destrutivas.
- **FR-023**: O sistema MUST fornecer rotina de reconciliação para administradores autenticados que consulte diretamente o provedor para transações com pendência de sincronização.
- **FR-024**: O sistema MUST higienizar todos os logs de observabilidade, proibindo a gravação de CPF completo, e-mails completos, números de cartão, tokens, segredos ou corpos brutos do provedor.
- **FR-025**: O sistema MUST excluir completamente componentes de Checkout Bricks, formulários locais de cartão e simulações de aprovação sem provedor do fluxo de produção ativo.

---

### Key Entities _(include if feature involves data)_

- **`payment_transactions`**: Entidade central de registro de pagamento. Atributos principais: `id` (UUID PK), `consultation_id` (FK), `user_id` (FK), `mp_preference_id` (identificador da preferência Checkout Pro), `mp_payment_id` (identificador oficial do pagamento liquidado no Mercado Pago), `status` (estado padronizado: `pending`, `approved`, `authorized`, `in_process`, `rejected`, `cancelled`, `refunded`, `charged_back`, `provider_error`, `pending_reconciliation`), `status_detail`, `payment_method_id`, `payment_type_id`, `transaction_amount`, `idempotency_key`, `created_at`, `updated_at`.
- **`webhook_events`**: Entidade de auditoria e idempotência de eventos assíncronos. Atributos principais: `id` (UUID PK), `event_id` (ID único do evento), `event_type`, `action`, `mp_resource_id`, `signature_valid` (booleano), `processing_status` (`pending`, `processed`, `ignored`, `failed`), `payload` (JSONB sanitizado), `headers` (JSONB sanitizado), `processed_at`, `created_at`.
- **`consultation_audit_logs`**: Trilha imutável de governança das transições de status da consulta veicular. Atributos principais: `id` (UUID PK), `consultation_id` (FK), `transaction_id` (FK anulável), `actor_id` (FK anulável), `actor_type` (`customer`, `system`, `admin`, `webhook`), `event`, `details` (JSONB), `created_at`.
- **`customer_plate_consultations`**: Entidade de negócio da consulta veicular realizada pelo cliente. Campos integrados: `id`, `user_id`, `plate`, `status` (`pending`, `paid`, `processing`, `completed`, `failed`), `payment_status` (`unpaid`, `paid`, `refunded`), `latest_payment_transaction_id` (FK para `payment_transactions`), `vehicle_data` (JSONB do laudo), `processed_at`.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% das tentativas de pagamento de consultas veiculares utilizam a página hospedada do Mercado Pago Checkout Pro, com zero exposição de campos ou formulários de cartão na AF Motos.
- **SC-002**: Redução a zero (0%) dos erros de `HTTP 500 internal_error` causados por coleta e tokenização local de cartão de crédito.
- **SC-003**: 100% dos eventos de liquidação financeira são validados via assinatura criptográfica HMAC-SHA256 e confirmados por consulta direta à API do provedor antes de liberar relatórios.
- **SC-004**: Menos de 3 segundos de tempo decorrido entre o clique do cliente em "Pagar com Mercado Pago" e o redirecionamento para o ambiente seguro do Mercado Pago.
- **SC-005**: 100% de garantia de execução única da busca veicular (`lookup`) por pagamento aprovado, eliminando consultas duplicadas e custos adicionais com fornecedores de dados veiculares.
- **SC-006**: 0 vazamentos de credenciais, chaves secretas (`MERCADO_PAGO_ACCESS_TOKEN`, `MERCADO_PAGO_WEBHOOK_SECRET`) ou dados sensíveis de clientes (CPF, número de cartão) em logs estruturados da aplicação.
- **SC-007**: 100% de preservação dos dados históricos de auditoria existentes no banco de dados Supabase durante e após a transição.
- **SC-008**: 100% de cobertura de testes unitários e de integração nas rotinas críticas de construção de preferência, mapeamento de status, validação de assinatura e liberação atômica de consulta.

---

## Assumptions

- O cliente final possui navegador moderno com suporte a redirecionamento HTTPS e execução padrão de JavaScript para polling de status.
- O Mercado Pago disponibiliza os métodos de pagamento desejados (Pix, Cartão de Crédito, Débito e Boleto) de acordo com as configurações da conta vendedora no painel do Mercado Pago.
- A conta do Mercado Pago possui credenciais de teste (`TEST-...`) e de produção (`APP_USR-...`) válidas e ativas com chave secreta de webhook configurada.
- O endpoint de webhook `/api/webhooks/mercadopago` será acessível publicamente via HTTPS (por meio de túnel como ngrok/cloudflared em ambiente local e por domínio público no Vercel Preview/Produção).
- As tabelas `payment_transactions`, `webhook_events` e `consultation_audit_logs` criadas nas migrações anteriores permanecem ativas e reutilizáveis, não necessitando de recriação estrutural ou drop.
- O fornecedor de dados de histórico veicular (API Brasil) continua funcionando por trás da abstração existente `executeVehiclePlateLookup` sem alterações em seus contratos.
