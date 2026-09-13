# Feature Specification: Entrega Resiliente de Laudo Pós-Pagamento, Retry Persistido, Auditoria e Estorno Seguro

**Feature Branch**: `030-resilient-paid-report-delivery-refunds`  
**Created**: 2026-09-13  
**Status**: Ready for Planning  
**Input**: Feature: Entrega resiliente de laudo pós-pagamento, retry persistido, auditoria e estorno seguro

---

## 1. Visão Geral & Problema de Negócio

No fluxo de compra de laudo veicular (histórico completo de placa), o cliente efetua o pagamento através do Mercado Pago Checkout Pro. Atualmente, assim que o pagamento é confirmado, o sistema tenta de forma síncrona buscar o laudo (no cache local ou chamando a API Brasil). 

Entretanto, o provedor externo (API Brasil) pode estar temporariamente indisponível, responder com lentidão (timeout), retornar erro 500/502/503/504, apresentar taxa de requisições excedida (HTTP 429), estar sem créditos na conta pré-paga da empresa, ou o token estar expirado.

**Problema a resolver**:
1. O cliente **não pode ficar sem o laudo e sem o dinheiro**.
2. A confirmação de pagamento não pode depender da saúde imediata do provedor de laudo.
3. Não se deve usar rotinas em memória em ambientes serverless (Vercel) para processamento em background.
4. Falhas transitórias devem ser retentadas de maneira durável com backoff exponencial e jitter.
5. Falhas permanentes (ex: saldo esgotado, credencial inválida) ou esgotamento de retries devem disparar de forma automática, idempotente e segura o **estorno total (refund)** do valor pago via Mercado Pago.
6. A operação e o suporte devem saber exatamente em que estado a entrega e o estorno se encontram, sem vazamento de segredos, tokens ou dados sensíveis.

---

## 2. User Scenarios & Testing (Mandatório)

### User Story 1 - Entrega Confiável do Laudo com Cache ou Consulta Imediata (Priority: P1)

Como cliente comprador de um laudo veicular, quero que meu pagamento aprovado resulte na liberação imediata do laudo quando o sistema ou cache estiverem saudáveis, para que eu visualize o histórico do veículo sem atrito.

**Why this priority**: É o fluxo de valor principal da plataforma (caminho feliz). 95%+ das consultas devem transitar por aqui sem intervenção.

**Independent Test**: Pode ser testado gerando um pagamento aprovado; o sistema confirma o pagamento, cria o job persistido de entrega, resolve via cache ou API Brasil em tempo hábil e disponibiliza o laudo ao cliente.

**Acceptance Scenarios**:
1. **Given** um pagamento aprovado pelo Mercado Pago para a consulta da placa "ABC1234",  
   **When** o sistema processa a confirmação de pagamento,  
   **Then** o pagamento é registrado como `approved` e um job persistido de entrega é criado com status `pending_delivery`.
2. **Given** um job de entrega com placa já existente e válida na base de cache local,  
   **When** o worker processa a entrega,  
   **Then** o laudo é copiado para a consulta do cliente sem chamar a API Brasil, o status da consulta avança para `completed` e o job é finalizado com sucesso.
3. **Given** um job de entrega com cache miss em ambiente de produção com credenciais válidas,  
   **When** a API Brasil responde 200 OK com payload estruturado,  
   **Then** o laudo é persistido no banco, o job é marcado como `completed` e a tela do cliente exibe "Seu laudo está disponível".

---

### User Story 2 - Resiliência a Falhas Transitórias e Retries Persistidos (Priority: P2)

Como cliente que realizou um pagamento durante instabilidade momentânea da API Brasil (timeout de rede ou erro 500), quero que o sistema tente buscar meu laudo automaticamente sem que eu precise reiniciar o processo ou perder meu pagamento.

**Why this priority**: Evita perda desnecessária de transações e estornos precipitados em decorrência de soluços de rede temporários.

**Independent Test**: Simular resposta HTTP 500 ou timeout na chamada da API Brasil; o sistema classifica o erro como `transient`, agenda `next_retry_at` no banco e retém o job para o próximo ciclo de execução.

**Acceptance Scenarios**:
1. **Given** um job em execução que recebe HTTP 500, 502, 503, 504, 408 ou timeout de rede da API Brasil,  
   **When** a falha é interceptada,  
   **Then** o erro é classificado como `transient`, a tentativa é incrementada e o job é agendado com status `retry_scheduled` com backoff progressivo (1m, 5m, 15m, 30m).
2. **Given** uma requisição que retorna HTTP 429 da API Brasil com cabeçalho `Retry-After: 120`,  
   **When** o worker processa a falha,  
   **Then** o agendamento `next_retry_at` respeita o tempo informado pelo provedor acrescido de jitter.
3. **Given** um job em `retry_scheduled`,  
   **When** o cliente acessa a tela de retorno ou "Minhas Consultas",  
   **Then** a interface informa: *"Estamos enfrentando uma instabilidade temporária para preparar seu laudo. Nossa equipe já está acompanhando; tentaremos novamente automaticamente."*

---

### User Story 3 - Estorno Automático Seguro em Falhas Permanentes ou Esgotamento de Retries (Priority: P1)

Como cliente cujo laudo não pôde ser gerado devido a erro definitivo (ex: falta de saldo na conta da empresa ou 5 tentativas esgotadas), quero receber o estorno integral automático do meu pagamento no Mercado Pago, para não ser lesado financeiramente.

**Why this priority**: Protege a integridade financeira do cliente e cumpre a regra inegociável de que "o cliente não pode ficar sem laudo e sem o dinheiro".

**Independent Test**: Forçar resposta de saldo insuficiente (`InsufficientBalanceError`) ou esgotar 5 tentativas transitórias; o sistema encerra a entrega com `failed_permanent`, emite solicitação de estorno ao Mercado Pago via `mp_payment_id` e atualiza as telas.

**Acceptance Scenarios**:
1. **Given** a API Brasil respondendo com saldo insuficiente ou conta bloqueada (falha permanente),  
   **When** o worker processa a entrega,  
   **Then** o sistema marca o job como `failed_permanent`, não agenda novos retries para a API Brasil e cria uma ordem de estorno persistida (`payment_refunds`).
2. **Given** uma ordem de estorno criada com status `requested`,  
   **When** o serviço de refund aciona a API do Mercado Pago utilizando o `mp_payment_id` e chave de idempotência única,  
   **Then** o estorno é submetido, o identificador `mp_refund_id` é registrado e o status passa para `pending` até confirmação autoritativa.
3. **Given** um estorno confirmado pelo webhook ou reconciliação do Mercado Pago,  
   **When** os registros são atualizados,  
   **Then** `payment_transactions.status = refunded`, `customer_plate_consultations.payment_status = refunded` e a tela informa: *"Seu pagamento foi estornado integralmente."*

---

### User Story 4 - Visibilidade Operacional e Alertas de Suporte (Priority: P3)

Como operador de suporte ou administrador da AF Motos, quero ser alertado imediatamente quando a API Brasil estiver sem saldo ou quando houver estornos com pendência técnica, para recarregar o saldo ou intervir antes que clientes se queixem.

**Why this priority**: Garante que falhas operacionais não fiquem invisíveis e que o time tome providências imediatas sem depender de reclamações externas.

**Independent Test**: Consultar o painel administrativo ou log de auditoria após simular erro de saldo; verificar o alerta explícito "Ação necessária: recarregar saldo da API Brasil" e histórico auditado.

**Acceptance Scenarios**:
1. **Given** a ocorrência de erro `APIBRASIL_INSUFFICIENT_CREDITS`,  
   **When** o log e o evento de auditoria são gerados,  
   **Then** o evento `support_attention_required` é registrado com a mensagem interna *"Ação necessária: recarregar saldo da API Brasil"*, sem expor valores brutos em logs públicos.
2. **Given** um cliente que clica no botão "Falar com suporte no WhatsApp",  
   **When** a conversa é iniciada,  
   **Then** a mensagem pré-preenchida contém apenas a referência pública da transação e a placa mascarada, sem termos técnicos de infraestrutura ou segredos.

---

## 3. Máquinas de Estados & Ciclo de Vida

### 3.1 Transação de Pagamento (`payment_transactions.status`)
```
pending ──> approved ──> refunded
   │           │
   └──> rejected / cancelled
```
*Regra*: O status `approved` JAMAIS sofre downgrade para `pending` ou `in_process`. A única transição válida a partir de `approved` é para `refunded` (quando comprovadamente devolvido).

### 3.2 Consulta do Cliente (`customer_plate_consultations.status` e `payment_status`)
- `payment_status`: `unpaid` ──> `paid` ──> `refunded`
- `status`:
```
pending
   └──> paid (aguardando worker)
          └──> processing (worker reivindicou lock)
                 ├──> completed (laudo gerado ou cache hit)
                 ├──> retry_scheduled (instabilidade transitória)
                 ├──> failed_permanent (esgotamento ou erro irrecuperável)
                 ├──> refund_pending (estorno em processamento no gateway)
                 ├──> refunded (estorno confirmado)
                 └──> manual_review (divergência ou anomalia operacional)
```

### 3.3 Job de Entrega (`consultation_delivery_jobs.status`)
```
pending ──> processing ──> completed (sucesso)
                 │
                 ├──> retry_scheduled ──> (next_retry_at ativado) ──> processing
                 │
                 └──> failed_permanent ──> [Dispara fluxo de refund]
```

### 3.4 Processo de Estorno (`payment_refunds.status`)
```
none ──> requested ──> pending ──> confirmed
              │            │
              └──> failed ─┴──> manual_review
```

---

## 4. Classificação de Falhas da API Brasil

| Evento / Código HTTP / Erro | Classe de Falha | Código de Erro Interno | Ação do Sistema |
|---|---|---|---|
| Timeout de conexão (>120s ou AbortError) | `transient` | `APIBRASIL_TIMEOUT` | Agendar retry com backoff |
| Erro de rede / DNS / Conexão recusada | `transient` | `APIBRASIL_NETWORK_ERROR` | Agendar retry com backoff |
| HTTP 408 Request Timeout | `transient` | `APIBRASIL_TIMEOUT` | Agendar retry com backoff |
| HTTP 429 Too Many Requests | `transient` | `APIBRASIL_RATE_LIMIT` | Agendar retry respeitando `Retry-After` |
| HTTP 500, 502, 503, 504 | `transient` | `APIBRASIL_SERVER_ERROR` | Agendar retry com backoff |
| HTTP 401, 403 Forbidden / Token Inválido | `permanent` | `APIBRASIL_AUTH_ERROR` | Interromper retries; iniciar refund; alertar suporte |
| Resposta contendo "saldo", "recarregue" | `permanent` | `APIBRASIL_INSUFFICIENT_CREDITS` | Interromper retries; iniciar refund; alertar suporte |
| Conta do provedor bloqueada / suspensa | `permanent` | `APIBRASIL_ACCOUNT_SUSPENDED` | Interromper retries; iniciar refund; alertar suporte |
| Placa inválida na base nacional (HTTP 400/422) | `permanent` | `APIBRASIL_INVALID_REQUEST` | Interromper retries; iniciar refund |
| Mock Mode detectado em ambiente Vercel Live | `permanent` | `APIBRASIL_MOCK_MODE_IN_PRODUCTION` | Bloquear entrega de mock falso; iniciar refund; alertar admin |
| Token não configurado em produção | `permanent` | `APIBRASIL_CONFIGURATION_ERROR` | Bloquear; iniciar refund; alertar admin |
| Payload com schema divergente / quebrado | `unknown` | `APIBRASIL_INVALID_RESPONSE` | Até 2 retries; se persistir, `failed_permanent` |
| Erro desconhecido não mapeado | `unknown` | `APIBRASIL_UNKNOWN_ERROR` | Até 2 retries; se persistir, `failed_permanent` |

---

## 5. Política de Tentativas (Retry Policy)

- **Máximo de Tentativas (`MAX_ATTEMPTS`)**: 5
- **Intervalos de Retentativa**:
  - Tentativa 1: Imediatamente após confirmação do pagamento (gatilho assíncrono não-bloqueante).
  - Tentativa 2: 1 minuto (+ jitter aleatório de 0 a 15 segundos).
  - Tentativa 3: 5 minutos (+ jitter aleatório de 0 a 30 segundos).
  - Tentativa 4: 15 minutos (+ jitter aleatório de 0 a 60 segundos).
  - Tentativa 5: 30 minutos (+ jitter aleatório de 0 a 60 segundos).
- **Tratamento de Lock & Lease**:
  - Cada execução assume um lock com identificador do worker (`locked_by`) e timestamp (`locked_at`).
  - O lease de lock expira em **5 minutos**. Se um worker falhar silenciosamente ou a função sofrer timeout, o próximo ciclo do cron assume o job abandonado.
  - Concorrência protegida via `SELECT ... FOR UPDATE SKIP LOCKED` em stored procedure PostgreSQL.

---

## 6. Regras de Refund Mercado Pago

1. **Identificador Obrigatório**: O estorno é realizado SEMPRE pelo `mp_payment_id` (`payment_transactions.mp_payment_id`). Nunca por `mp_preference_id` ou `transactionId` interno.
2. **Valor**: Estorno total no valor exato cobrado (`amount = transaction_amount`).
3. **Idempotência**: Uma chave única UUID (`refund_idempotency_key`) é gerada e vinculada à transação, evitando chamadas duplicadas ao gateway em caso de retentativa de rede.
4. **Confirmação em Duas Fases**:
   - Fase 1 (`requested`/`pending`): A API do Mercado Pago aceita o pedido de devolução.
   - Fase 2 (`confirmed`): O webhook oficial ou reconciliação do pagamento atesta que o pagamento mudou para `refunded`. Apenas neste momento o status final de devolução é considerado consolidado.

---

## 7. Experiência do Usuário & Textos Oficiais

| Estado Interno | Título na Tela | Mensagem Exibida ao Cliente | Ação Principal |
|---|---|---|---|
| `pending` (pagamento) | Aguardando Pagamento | "Estamos aguardando a confirmação do pagamento pelo Mercado Pago." | Verificar Status |
| `pending_delivery` / `processing` | Pagamento Confirmado | "Pagamento confirmado! Estamos preparando seu laudo oficial." | Acompanhar (spinner) |
| `retry_scheduled` | Preparando seu Laudo | "Estamos enfrentando uma instabilidade temporária para preparar seu laudo. Nossa equipe já está acompanhando; tentaremos novamente automaticamente em instantes." | Atualizar / Suporte |
| `refund_pending` / `failed_permanent` | Consulta Indisponível | "Não foi possível concluir sua consulta neste momento devido a uma indisponibilidade nas bases oficiais. Solicitamos o estorno integral do seu pagamento." | Falar com Suporte |
| `refunded` | Pagamento Estornado | "Seu pagamento foi estornado integralmente. O prazo para o valor constar depende do método de pagamento e da instituição financeira." | Voltar a Consultas |
| `manual_review` | Verificação Necessária | "Sua consulta precisa de uma verificação adicional. Nossa equipe foi avisada e retornará pelo canal de atendimento." | Falar com Suporte |
| `completed` | Laudo Disponível | "Seu laudo veicular foi gerado com sucesso e está pronto para visualização!" | Visualizar Laudo |

---

## 8. Segurança, Sigilo e Auditoria

1. **Proteção de Credenciais**:
   - `APIBRASIL_TOKEN`, `MERCADO_PAGO_ACCESS_TOKEN` e `CRON_SECRET` nunca podem ser expostos ao cliente, renderizados no DOM, salvos em colunas acessíveis via RLS ou logados no console.
2. **Sanitização de Logs**:
   - Todos os logs usam prefixos padronizados: `[VEHICLE_DELIVERY]` e `[PAYMENT_REFUND]`.
   - Identificadores (transação, pagamento, consulta, placa) são mascarados (ex: `ABC***19`, `1234***5678`).
3. **Restrições de RLS**:
   - Clientes só podem ler registros de suas próprias consultas e transações via `auth.uid() = user_id`.
   - As tabelas operacionais (`consultation_delivery_jobs`, `payment_refunds`, `webhook_events`) não possuem permissão de leitura/escrita para clientes comuns (acesso exclusivo para service-role e administradores).

---

## 9. Success Criteria (Critérios de Sucesso Mensuráveis)

- **SC-001**: 0% de ocorrência de clientes com pagamento aprovado que fiquem sem laudo e sem solicitação de estorno após o término do processamento.
- **SC-002**: 100% dos erros transitórios da API Brasil recebem ao menos 1 retentativa automática sem exigência de ação pelo usuário.
- **SC-003**: Tempo de resposta do webhook do Mercado Pago permanece abaixo de 1.500 ms, pois o processamento do laudo não bloqueia o retorno HTTP 200/204.
- **SC-004**: Eliminação completa de chamadas duplicadas à API Brasil ou estornos duplicados ao Mercado Pago para a mesma transação (taxa de duplicação = 0%).
- **SC-005**: 100% de sanitização de tokens e segredos em traces e logs da Vercel.
