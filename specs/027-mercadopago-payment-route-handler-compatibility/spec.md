# Feature Specification: Reimplementação do Pagamento Mercado Pago no padrão Moura’s Pizzas

**Feature Branch**: `027-mercadopago-payment-route-handler-compatibility`  
**Created**: 2026-09-12  
**Status**: Draft  
**Input**: Reimplementação do processamento de pagamento com cartão Mercado Pago no AF Motos seguindo a arquitetura comprovadamente funcional do projeto Moura’s Pizzas (Payment Brick no frontend → Route Handler HTTP server-side → MercadoPagoConfig + Payment → Payment.create() → persistência e liberação segura do laudo).

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Pagamento com Cartão Aprovado e Liberação do Laudo (Priority: P1)

Como comprador ou interessado em uma motocicleta com consulta veicular pendente,  
desejo inserir os dados do meu cartão de crédito no Payment Brick e concluir o pagamento com segurança,  
para que o valor correto seja cobrado, o pagamento seja confirmado no Mercado Pago e o laudo veicular seja liberado imediatamente.

**Why this priority**: É o fluxo principal de monetização e entrega de valor do produto de Histórico Veicular. Sem a aprovação e liberação correta, o serviço fica inoperante.

**Independent Test**: Pode ser testado de ponta a ponta criando uma consulta pendente, abrindo a página de pagamento, preenchendo o cartão de teste do Mercado Pago (`5480 8328 0103 3311`), submetendo o formulário, verificando a chamada ao endpoint `POST /api/mp/process-payment`, confirmando a criação do pagamento com status `approved`, atualização da transação local e redirecionamento para o laudo veicular com status `completed`.

**Acceptance Scenarios**:

1. **Given** que o usuário está autenticado e possui uma consulta veicular no status `pending_payment`,  
   **When** abre a tela de pagamento,  
   **Then** visualiza o valor canônico (R$ 49,90 / R$ 49,99) determinado pelo servidor e o Payment Brick sem nenhum warning no console do navegador (`fontFamily`, `preferenceId` ou `entityType`).

2. **Given** que o usuário preencheu os dados válidos do cartão de teste e clicou em pagar,  
   **When** o Payment Brick gera o token e o frontend envia uma requisição `POST /api/mp/process-payment`,  
   **Then** o backend valida a sessão, a propriedade da consulta e o token, chama `Payment.create()` no Mercado Pago com idempotência, recebe status `approved` com `mp_payment_id` real, atualiza `payment_transactions` para `approved`, executa o enriquecimento veicular e redireciona o usuário para o laudo liberado.

---

### User Story 2 - Recusa Legítima do Cartão e Possibilidade de Nova Tentativa (Priority: P2)

Como comprador utilizando um cartão sem limite ou com dados incorretos,  
desejo receber uma mensagem de retorno amigável e segura informando que a operadora recusou a transação,  
para que eu possa corrigir os dados ou usar outro cartão sem que o sistema trave ou gere transações inconsistentes.

**Why this priority**: Cartões recusados são comuns em checkout e exigem tratamento sem vazamento de erros técnicos e sem reenvio de tokens expirados.

**Independent Test**: Pode ser testado submetendo um cartão de teste com recusa (ex.: saldo insuficiente), verificando se o backend atualiza a transação como `rejected`, se o frontend invalida o token anterior, se remonta o Brick para exigir novo token e se exibe mensagem de recusa sem liberar a consulta.

**Acceptance Scenarios**:

1. **Given** que o usuário submeteu um cartão com dados que levam à recusa pelo emissor/adquirente,  
   **When** o Mercado Pago responde com status `rejected` (ex.: `cc_rejected_insufficient_amount`),  
   **Then** o backend atualiza `payment_transactions` como `rejected`, não libera a consulta veicular, não chama a API Brasil e retorna uma resposta limpa `{ success: false, retryable: true, status: 'rejected', message: '...' }`.

2. **Given** que o pagamento foi recusado,  
   **When** o usuário decide tentar novamente na mesma página,  
   **Then** o formulário/Brick é resetado com novo ciclo de montagem, exigindo que o usuário gere um novo token de cartão antes de permitir nova submissão.

---

### User Story 3 - Resiliência e Blindagem Contra Erro Técnico do Provedor (Priority: P3)

Como operador do sistema e como cliente,  
desejo que qualquer erro de infraestrutura ou instabilidade técnica do Mercado Pago (ex.: HTTP 500 `internal_error`) seja contido com segurança,  
para que o cliente não receba cobranças indevidas, a consulta permaneça protegida sem liberação artificial e os logs registrem snapshots sanitizados para investigação.

**Why this priority**: Evita vazamento de receita, laudos gratuitos não pagos e dados corrompidos na base quando o provedor externo falha.

**Independent Test**: Pode ser testado simulando ou reproduzindo resposta HTTP 500 do Mercado Pago, garantindo que o status seja gravado como `provider_error` ou `pending_reconciliation`, nenhuma chamada à API Brasil seja disparada e nenhuma consulta seja concluída.

**Acceptance Scenarios**:

1. **Given** que a chamada `Payment.create()` retorna `MPServerError HTTP 500 internal_error` sem `payment_id`,  
   **When** a exceção é capturada no backend,  
   **Then** a transação é registrada estritamente como `provider_error`, a consulta veicular permanece em `pending_payment`, o snapshot sanitizado do request é emitido em log e o cliente recebe mensagem amigável sem exposição técnica.

2. **Given** que ocorreu um erro HTTP 500 ou timeout,  
   **When** o sistema avalia as regras de integridade,  
   **Then** sob nenhuma hipótese é gerado pagamento falso, aprovação simulada ou estorno sem `mp_payment_id`.

---

### User Story 4 - Reconciliação Assíncrona via Webhook com Validação Criptográfica (Priority: P4)

Como administrador do AF Motos,  
desejo que os eventos de alteração de status de pagamento enviados pelo Mercado Pago sejam recebidos e validados por webhook assíncrono,  
para que pagamentos aprovados posteriormente (ou em processos de análise de risco) sejam reconciliados com precisão.

**Why this priority**: Garante que pagamentos que entraram em análise (`in_process`) ou demoraram para confirmar sejam finalizados sem intervenção manual.

**Independent Test**: Enviar requisição POST para `/api/webhooks/mercadopago` com assinatura HMAC válida contendo `data.id`, verificar a busca do pagamento real na API do Mercado Pago e a atualização idempotente da transação correspondente.

**Acceptance Scenarios**:

1. **Given** que uma notificação de pagamento chega em `POST /api/webhooks/mercadopago`,  
   **When** a assinatura HMAC do cabeçalho `x-signature` é validada contra `MERCADO_PAGO_WEBHOOK_SECRET`,  
   **Then** o endpoint busca os dados atualizados do pagamento na API oficial do Mercado Pago utilizando o Access Token server-side antes de qualquer alteração no banco.

2. **Given** que o pagamento consultado no Mercado Pago retornou status `approved`,  
   **When** a transação no banco estava `pending` ou `in_process`,  
   **Then** a transação é atualizada para `approved`, a consulta veicular é liberada e processada de forma estritamente idempotente.

---

## Edge Cases

- **Double-submit no cliente**: O usuário clica repetidamente no botão de submissão do Brick durante o processamento. O frontend deve desabilitar o botão imediatamente no primeiro clique e o backend deve rejeitar requisições concorrentes com o mesmo token ou mesma consulta em andamento.
- **Reutilização de token de cartão**: Tentativa de reenviar um token já utilizado anteriormente ou após falha de submissão. O backend deve validar e rejeitar o token, e o frontend deve forçar um novo ciclo de montagem (`mountKey`).
- **Valores divergentes entre cliente e servidor**: Se o cliente tentar injetar um valor customizado no payload, o backend ignora completamente qualquer valor vindo do cliente e utiliza unicamente o valor canônico configurado no banco/servidor.
- **`issuer_id` ausente ou inconsistente**: Em alguns cartões de teste ou bandeiras, o Brick não envia `issuer_id` ou envia valor inválido. O backend só deve incluir `issuer_id` no body do Mercado Pago se for fornecido pelo Brick na submissão e validado como inteiro positivo.
- **Webhook recebido antes da resposta da rota síncrona**: Em cenários de concorrência onde o webhook chega antes do fim de `Payment.create()`, transações com status final não devem ser sobrescritas por estados intermediários.
- **Ausência de credenciais ou chaves mal formatadas**: Chaves públicas sem prefixo `TEST-` ou `APP_USR-` impedem a renderização do Brick, exibindo mensagem de configuração sem quebrar a aplicação.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema MUST fornecer um endpoint HTTP dedicado `POST /api/mp/process-payment` como via exclusiva para processar pagamentos com cartão tokenizado.
- **FR-002**: O endpoint `POST /api/mp/process-payment` MUST exigir autenticação válida de sessão de usuário no Supabase (`supabase.auth.getUser()`).
- **FR-003**: O endpoint MUST validar que a consulta referenciada por `consultationId` pertence ao usuário autenticado e está com status apto para pagamento (`pending_payment`).
- **FR-004**: O preço da consulta MUST ser obtido exclusivamente no servidor a partir das configurações canônicas (`site_settings`), ignorando qualquer valor monetário vindo do cliente.
- **FR-005**: O sistema MUST criar previamente um registro em `payment_transactions` com status `pending` e uma chave de idempotência UUID única antes de disparar a criação no Mercado Pago.
- **FR-006**: O sistema MUST encapsular a comunicação com o Mercado Pago através de uma interface de adapter (`MercadoPagoPaymentProvider`), suportando o adapter `v2` (baseado no padrão Moura’s Pizzas / `mercadopago@2.12.0`) e o adapter `v3` (`mercadopago@^3.6.1`).
- **FR-007**: A seleção do adapter ativo MUST ser configurada exclusivamente no servidor via variável de ambiente `MERCADO_PAGO_PROVIDER_ADAPTER` (valores `v2` ou `v3`), com fallback seguro para `v3`.
- **FR-008**: O payload enviado ao Mercado Pago MUST conter apenas os campos canônicos suportados: `transaction_amount` (number), `token` (string), `description` (string), `installments` (number), `payment_method_id` (string), `payer.email` (string), `payer.identification.type` ('CPF') e `payer.identification.number` (string com 11 dígitos).
- **FR-009**: O campo `issuer_id` só MUST ser incluído no request ao Mercado Pago se tiver sido fornecido diretamente pelo Payment Brick na mesma submissão e for validado como inteiro positivo.
- **FR-010**: A chave de idempotência MUST ser enviada em `requestOptions.idempotencyKey`, garantindo que o SDK do Mercado Pago a propague como cabeçalho `X-Idempotency-Key`.
- **FR-011**: O Payment Brick no frontend MUST ser montado de forma limpa e determinística, sem repassar propriedades inválidas como `fontFamily`, sem `preferenceId` no fluxo de tokenização direta e sem o par inconsistente `mercadoPago`/`preferenceId`.
- **FR-012**: O campo `entityType` do pagador no Brick MUST ser normalizado estritamente para `'individual'` (para pessoas físicas com CPF), rejeitando qualquer valor divergente.
- **FR-013**: Em caso de resposta HTTP 500 do Mercado Pago, timeout ou falha de conexão, o sistema MUST atualizar o status da transação para `provider_error` ou `pending_reconciliation`, nunca para `rejected` e sob nenhuma hipótese marcar como `approved`.
- **FR-014**: A consulta veicular MUST ser marcada como `completed` e o laudo liberado APENAS se houver `mp_payment_id` real retornado e o status for comprovadamente `approved` (ou `authorized`, se configurado).
- **FR-015**: O sistema MUST registrar um snapshot sanitizado do request imediatamente antes da chamada de criação, mascarando dados sensíveis (sem expor token de cartão, CPF completo, e-mail completo, segredos de API ou payload cru).
- **FR-016**: O endpoint de webhook `POST /api/webhooks/mercadopago` MUST validar a assinatura HMAC (`x-signature`), consultar o status atualizado no Mercado Pago antes de processar e operar com idempotência estrita.

### Key Entities _(include if feature involves data)_

- **CustomerPlateConsultation**: Representa a consulta de histórico veicular do cliente (`id`, `user_id`, `plate`, `status`, `payment_status`, `amount`, `created_at`).
- **PaymentTransaction**: Registra cada tentativa e ciclo de vida de pagamento (`id`, `consultation_id`, `user_id`, `provider` ['mercadopago'], `mp_payment_id`, `amount`, `currency`, `payment_method`, `status` ['pending', 'approved', 'rejected', 'provider_error', etc.], `idempotency_key`, `metadata`, `created_at`, `updated_at`).
- **MercadoPagoPaymentRequestSnapshot**: Snapshot para auditoria técnica pré-envio, contendo metadados sanitizados (versão do SDK, adapter ativo, hashes truncados de idempotência e token, chaves presentes no body, etc.).

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: O console do navegador deve apresentar 0 (zero) warnings de configuração do Payment Brick relacionados a `fontFamily`, `preferenceId` e `entityType`.
- **SC-002**: 100% das tentativas de pagamento com cartão de teste válido (`APRO`) devem resultar em transações com `mp_payment_id` real, status `approved` e liberação automática do laudo veicular em menos de 10 segundos.
- **SC-003**: 0% de laudos veiculares liberados sem confirmação prévia e síncrona/assíncrona de pagamento aprovado com ID de provedor real.
- **SC-004**: 100% dos erros HTTP 500 do provedor devem ser classificados com precisão como `provider_error`, impedindo falsos positivos de recusa (`rejected`) ou falsas aprovações.
- **SC-005**: 100% dos retries após falha de pagamento devem forçar um novo ciclo de geração de token no frontend, com zero reutilização de tokens descartados.
- **SC-006**: Zero ocorrências de dados sensíveis (tokens de cartão, CVV, senhas, segredos de webhook, Access Tokens ou CPFs desmascarados) em arquivos de log, commits ou respostas de API para o cliente.
- **SC-007**: 100% de cobertura de testes de regressão e validação do contrato de comunicação com os adaptadores v2 e v3, mantendo a suíte de testes passando com zero quebras.

---

## Assumptions

- **A-001**: A integração do Payment Brick no AF Motos opera no modo de tokenização direta transparente, não necessitando de Checkout Pro ou criação de `Preference` para pagamentos com cartão de crédito.
- **A-002**: O ambiente de desenvolvimento continuará utilizando credenciais de teste oficiais do Mercado Pago (`TEST-...`) e os cartões de teste documentados pela plataforma.
- **A-003**: O padrão arquitetural de Route Handler HTTP (`POST /api/mp/process-payment`) desacopla a criação do pagamento do ciclo de renderização de Server Actions do Next.js, espelhando com precisão o comportamento estável observado no projeto de referência Moura’s Pizzas.
- **A-004**: O usuário Supabase não precisa ter vínculo cadastral de conta buyer/seller no Mercado Pago para pagar com cartão de crédito via Payment Brick.
- **A-005**: A presença da URL pública de webhook não é bloqueante para a criação síncrona do pagamento por cartão, mas é essencial para resiliência e reconciliação assíncrona.
