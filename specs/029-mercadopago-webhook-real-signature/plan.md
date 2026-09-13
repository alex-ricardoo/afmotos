# Implementation Plan: Mercado Pago Real Webhook Signature and Reconciliation

## Technical Context

A aplicação AF Motos opera em arquitetura moderna e distribuída com as seguintes tecnologias e configurações:
- **Framework & Runtime**: Next.js 16 (App Router com Route Handlers e Server Components) executado sobre Vercel Serverless Functions (Node.js runtime).
- **Linguagem & Tipagem**: TypeScript 5 com modo estrito (`strict: true`).
- **SDK do Provedor de Pagamento**: Biblioteca oficial `mercadopago@2.12.0` fixada no `package.json` (usando `MercadoPagoConfig`, `Preference` e `Payment`).
- **Persistência & Banco de Dados**: Supabase PostgreSQL com Row Level Security (RLS) habilitado, acessado via `@supabase/ssr` e `@supabase/supabase-js`.
- **Tabelas Existentes**:
  - `public.payment_transactions` (registros de pagamento com chave de idempotência e restrição de status ampliada para `provider_error` e `pending_reconciliation`).
  - `public.webhook_events` (tabela de auditoria e idempotência de eventos assíncronos).
  - `public.customer_plate_consultations` (dados do laudo veicular e controle de ciclo de vida).
  - `public.consultation_audit_logs` (trilha imutável de auditoria de consultas).
- **Ambiente de Produção**: `https://afmotos.vercel.app`.
- **Fluxo de Pagamento Atual**: Mercado Pago Checkout Pro iniciado via API de Preferências (`POST /checkout/preferences`) com URL de notificação apontada para `https://afmotos.vercel.app/api/webhooks/mercadopago`.
- **Variáveis de Ambiente Requeridas**:
  - `MERCADO_PAGO_ACCESS_TOKEN` (credencial privada da aplicação de produção).
  - `MERCADO_PAGO_WEBHOOK_SECRET` (chave de assinatura HMAC configurada no painel de webhooks).
  - `NEXT_PUBLIC_APP_URL` e `MERCADO_PAGO_APP_URL` (`https://afmotos.vercel.app`).
  - `MERCADO_PAGO_WEBHOOK_URL` (`https://afmotos.vercel.app/api/webhooks/mercadopago`).

---

## Current-State Findings

A análise dos logs da Vercel e da base de código confirma o seguinte diagnóstico do estado atual:
1. **Acessibilidade e Roteamento**: A URL de notificação `https://afmotos.vercel.app/api/webhooks/mercadopago` é pública, segura (HTTPS) e recebe com sucesso as requisições enviadas pelo Mercado Pago.
2. **Criação de Preferências**: As preferências de pagamento são geradas corretamente em produção pelo backend (`unit_price: 49.99`, `auto_return: "approved"`, `back_urls` HTTPS válidas).
3. **Retorno do Cliente**: O comprador conclui o pagamento na interface hospedada do Mercado Pago e retorna com êxito para a página `/cliente/pagamento/retorno/[transactionId]?result=success`.
4. **Isolamento de Segurança**: A aplicação respeita o princípio de que o navegador não é fonte de verdade, não liberando a consulta apenas pelos parâmetros da URL de retorno.
5. **Incidente Confirmado**: Notificações reais de pagamento disparam `POST /api/webhooks/mercadopago`, mas são rejeitadas com **HTTP 401** (`checkout_pro.webhook_signature_rejected`, motivo: *"Assinatura criptográfica não confere"*).
6. **Comportamento do Simulador vs Produção**: O simulador de webhooks do painel do Mercado Pago responde HTTP 200 com `paymentId: 123456`, indicando que a lógica atual é compatível com o fixture do simulador, mas falha no formato real das notificações de produção.
7. **Bloqueio de UX**: Como o webhook é recusado, o status interno da transação permanece `pending`. O cliente fica preso na tela de "Aguardando confirmação do pagamento", mesmo tendo o valor de R$ 49,99 já debitado em sua conta.
8. **Observabilidade Insuficiente**: Os logs atuais não registram o hash truncado do manifesto construído nem detalhes do formato dos cabeçalhos recebidos, impedindo a visualização da discrepância exata que causa a rejeição.
9. **Inconsistência de Ambiente**: Eventos nos logs de produção da Vercel exibem incorretamente `environment: development` devido à leitura exclusiva de `MERCADO_PAGO_CHECKOUT_MODE` em vez de inspecionar `VERCEL_ENV`.

---

## Root Cause Hypotheses

Hipóteses priorizadas a serem avaliadas e validadas diretamente no código:

1. **Hipótese 1 (Alta Prioridade - Resolução do Resource ID)**: Na notificação real, o Mercado Pago envia `?data.id=177857907601&type=payment` ou payload com `body.id` (ID do evento) e `body.data.id` (ID do pagamento). O código atual prioriza `(bodyJson.data)?.id || searchParams.get('data.id') || searchParams.get('id') || bodyJson.id`. Se `data.id` for numérico ou se `bodyJson.id` for capturado indevidamente, o manifesto HMAC é construído com um ID diferente do assinado pelo Mercado Pago.
2. **Hipótese 2 (Alta Prioridade - Fragilidade do Parser de Assinatura)**: O cabeçalho `x-signature` recebido na requisição real pode conter espaços ao redor do sinal de igual (`ts = ..., v1 = ...`), ordem invertida (`v1=..., ts=...`) ou campos extras. O `split(',')` e `split('=')` atual não higieniza chaves adequadamente, podendo deixar `ts` ou `v1` nulos ou com espaços espúrios.
3. **Hipótese 3 (Alta Prioridade - Comparação Incorreta de Buffers Hex)**: A função `timingSafeCompare` compara strings UTF-8 (`Buffer.from(a, 'utf8')`) em vez de decodificar os digests hexadecimais em bytes (`Buffer.from(hex, 'hex')`). Além disso, não há validação prévia de que `v1` possui comprimento exato de 64 caracteres hexadecimais (32 bytes), causando falhas silenciosas de comparação.
4. **Hipótese 4 (Média Prioridade - Estrutura do Manifesto HMAC)**: O manifesto oficial esperado pelo Mercado Pago é estritamente `id:{data.id};request-id:{x-request-id};ts:{ts};`. Qualquer divergência na presença ou ausência do ponto e vírgula final, no nome do atributo (`request-id:` vs `x-request-id:`) ou no separador invalida o hash resultante.
5. **Hipótese 5 (Média Prioridade - Normalização de Case de ID)**: Se o ID vier da query string e contiver caracteres alfanuméricos, a documentação pode exigir normalização para minúsculas (lowercase). É necessário criar uma rotina pura de resolução com regras explícitas.
6. **Hipótese 6 (Média Prioridade - Dessincronização de Segredo por Aplicação)**: A variável `MERCADO_PAGO_WEBHOOK_SECRET` configurada na Vercel pode pertencer a uma aplicação diferente ou credencial de teste em vez do segredo específico da aplicação de produção que gerou a preferência.
7. **Hipótese 7 (Baixa Prioridade - Codificação de URL na Query String)**: O valor de `data.id` na query string pode sofrer dupla codificação de URL ou conter espaços externos ao ser lido por `searchParams.get()`.

---

## Constitution Check

Conformidade rigorosa com os princípios da Constituição AF Motos (`.specify/memory/constitution.md`):

- **Princípio I (Product First)**: O cliente tem seu laudo liberado em menos de 5 segundos após o pagamento, eliminando a experiência de ficar preso na tela de espera.
- **Princípio III (Type Safety)**: Tipagem estrita em TypeScript (`strict: true`), sem uso de `any`, com validação de schemas de entrada e interfaces formais para os serviços de webhook e reconciliação.
- **Princípio IV (Segurança)**: Proibição absoluta de exposição de segredos (`MERCADO_PAGO_WEBHOOK_SECRET`, `MERCADO_PAGO_ACCESS_TOKEN`) e dados confidenciais do pagador em logs e retornos de API. O laudo NUNCA é liberado a partir de parâmetros do navegador.
- **Princípio V (Supabase como Fonte de Dados)**: Reutilização estrita das tabelas existentes (`payment_transactions`, `webhook_events`, `customer_plate_consultations`, `consultation_audit_logs`) sem criação de bancos de dados paralelos.
- **Princípio VII (Integrações Desacopladas)**: A camada de aplicação se comunica com o Mercado Pago através de adapters e services isolados (`webhook-service.ts`, `reconciliation-service.ts`, `payment-processing-service.ts`).
- **Princípio X (Testabilidade)**: Todas as funções de resolução de recursos, parsers de cabeçalho, cálculo HMAC e máquina de estados são puras e cobertas por testes automatizados com fixtures realistas.
- **Princípio XI (Observabilidade)**: Emissão de logs estruturados com prefixo `[CHECKOUT_PRO]` e métricas seguras sem segredos em texto claro.
- **Princípio XII (Evolução Incremental)**: Não aplicar migrações destrutivas. Preservar o histórico financeiro intacto.

---

## Target Architecture

### 1. Fluxo Principal: Notificação Assíncrona via Webhook
```text
Mercado Pago
  │ (HTTP POST com x-signature, x-request-id e data.id)
  ▼
app/api/webhooks/mercadopago/route.ts
  │
  ├── 1. Leitura única do body e parse seguro
  ├── 2. resolveMercadoPagoWebhookResourceId(request, body)
  ├── 3. validateWebhookSignature(headers, resourceId) ──[Inválido]──> Resposta HTTP 401 + Log Seguro
  │         │ [Válido]
  ├── 4. Deduplicação do evento em webhook_events
  ├── 5. Busca autoritativa na API do Mercado Pago (Payment.get)
  ├── 6. Validação de integridade:
  │        - external_reference === transaction.id
  │        - transaction_amount bate em centavos
  │        - currency_id === 'BRL'
  ├── 7. Transição atômica de status no Supabase (proibido downgrade de approved)
  ├── 8. Se approved: releaseVerifiedPaidConsultation(transaction.id) [Lock Otimista 1x]
  └── 9. Resposta HTTP 200 OK { received: true, status: 'processed' }
```

### 2. Fluxo de Fallback: Reconciliação Sob Demanda no Retorno do Cliente
```text
Cliente (app/cliente/pagamento/retorno/[transactionId]/page.tsx)
  │ (Carregamento da página ou clique em "Verificar Status")
  ▼
POST /api/mp/transactions/[transactionId]/reconcile
  │
  ├── 1. Autenticação de sessão (Supabase Auth)
  ├── 2. Verificação de propriedade (transaction.user_id === user.id ou Admin)
  ├── 3. Rate limiting em memória por transação
  ├── 4. Se transaction.status === 'approved' e laudo liberado ──> Retorna status imediato
  ├── 5. Se pendente: busca pagamento no Mercado Pago:
  │        - Por mp_payment_id salvo; ou
  │        - Por Payment.search({ external_reference: transactionId })
  ├── 6. Executa a mesma rotina transacional de confirmação do webhook
  ├── 7. Atualiza consultation_audit_logs
  └── 8. Retorna JSON higienizado para a interface (desbloqueando visualização do laudo)
```

---

## Data Model and Migrations

### Avaliação do Schema Atual
- A tabela `public.payment_transactions` já possui colunas essenciais: `id`, `consultation_id`, `user_id`, `mp_payment_id`, `mp_preference_id`, `status`, `transaction_amount`, `idempotency_key`, `created_at`, `updated_at`.
- A migration `20260912180000_add_provider_error_status_to_payment_transactions.sql` já expandiu a constraint de status para suportar `provider_error` e `pending_reconciliation`.
- A tabela `public.webhook_events` já possui: `id`, `event_id`, `event_type`, `action`, `mp_resource_id`, `signature_valid`, `processing_status`, `processing_error`, `payload`, `headers`, `processed_at`, `created_at`.
- A tabela `public.consultation_audit_logs` já audita eventos operacionais de clientes, administradores e webhooks.

### Planejamento de Migrations
Não são necessárias migrações destrutivas. Caso seja útil otimizar a deduplicação de webhooks, planeja-se uma migração aditiva opcional:
```sql
-- Migration planejada (se necessária): 20260913150000_add_webhook_deduplication_indexes.sql
CREATE INDEX IF NOT EXISTS idx_webhook_events_resource_status
    ON public.webhook_events(mp_resource_id, processing_status);
```
O bloqueio de concorrência na liberação da consulta continuará sendo garantido via trava otimista na tabela `customer_plate_consultations`:
```sql
UPDATE public.customer_plate_consultations
SET payment_status = 'paid', status = 'processing', ...
WHERE id = $consultation_id AND payment_status = 'unpaid';
```
Se nenhuma linha for afetada, o processo concorrente reconhece que a consulta já foi liberada e não duplica a chamada veicular.

---

## Webhook Signature Strategy

A validação criptográfica será implementada com as seguintes etapas estritas:

1. **Leitura Segura do Corpo**: Ler o corpo da requisição uma única vez como texto bruto ou JSON, tratando exceções de parsing sem derrubar a aplicação.
2. **Resolução Determinística do Identificador (`resolveMercadoPagoWebhookResourceId`)**:
   - Tentar obter `payload.data.id` (se existir e for string ou número, converter para string e aplicar `.trim()`).
   - Se ausente, obter `data.id` da query string da URL.
   - Se ausente, obter `id` da query string (apenas se for aplicável ao evento de pagamento).
   - Se ainda ausente, retornar `null`.
3. **Extração de Cabeçalhos**:
   - `x-request-id`: ler via `headers.get('x-request-id')`. Rejeitar com motivo `missing_request_id` se ausente.
   - `x-signature`: ler via `headers.get('x-signature')`. Rejeitar com motivo `missing_signature` se ausente.
4. **Parser Tolerante de Assinatura**:
   - Quebrar por vírgulas: `signatureHeader.split(',')`.
   - Para cada parte, aplicar regex ou split higienizado: `part.trim().match(/^([a-zA-Z0-9_]+)\s*=\s*(.+)$/)`.
   - Extrair `ts` e `v1` independentemente da ordem (`ts=...,v1=...` ou `v1=...,ts=...`).
   - Rejeitar com motivos específicos (`missing_signature_timestamp` ou `missing_signature_digest`) se algum faltar.
5. **Construção do Manifesto Oficial**:
   - Formato padronizado: `id:${resourceId};request-id:${xRequestId};ts:${ts};`
   - Preservar rigorosamente os dois-pontos e o ponto e vírgula final.
6. **Cálculo HMAC-SHA256**:
   - Obter segredo de `process.env.MERCADO_PAGO_WEBHOOK_SECRET`. Rejeitar com `missing_webhook_secret` se ausente.
   - `const expectedHash = crypto.createHmac('sha256', secret).update(manifest, 'utf8').digest('hex')`.
7. **Validação e Comparação em Tempo Constante**:
   - Validar que `v1` possui formato hexadecimal válido com regex `/^[0-9a-fA-F]{64}$/`.
   - Validar que ambos os hashes possuem 64 caracteres.
   - Comparar utilizando buffers decodificados em hexadecimal:
     `crypto.timingSafeEqual(Buffer.from(expectedHash, 'hex'), Buffer.from(v1.toLowerCase(), 'hex'))`.
8. **Resposta e Auditoria**:
   - Se mismatch: retornar HTTP 401 `{ error: "Assinatura de notificação inválida ou ausente." }` e registrar `checkout_pro.webhook_signature_rejected`.
   - Se válida: prosseguir para busca autoritativa e registrar `checkout_pro.webhook_signature_verified`.

---

## Payment Verification Strategy

Após a validação da assinatura:
1. **Busca Autoritativa**: O backend invoca `getPaymentClient().get({ id: resourceId })` utilizando `MERCADO_PAGO_ACCESS_TOKEN`.
2. **Validação de Vínculo com a Transação**:
   - Localizar a transação interna comparando `payment.external_reference` com `payment_transactions.id`.
   - Se não localizada, tentar busca por `mp_payment_id === payment.id`.
   - Se nenhuma transação for encontrada: marcar o evento de webhook como `ignored` e responder HTTP 200.
3. **Validação de Valor e Moeda**:
   - Comparar o valor em centavos: `Math.round(payment.transaction_amount * 100) === Math.round(transaction.transaction_amount * 100)`.
   - Confirmar que a moeda é `'BRL'`.
4. **Aplicação da Máquina de Estados**:
   - Mapear status do Mercado Pago (`approved`, `pending`, `in_process`, `rejected`, `cancelled`, `refunded`, `charged_back`).
   - Aplicar `canTransitionStatus(currentStatus, newStatus)`:
     - `pending` pode transitar para `in_process`, `approved`, `rejected`, `cancelled`.
     - `approved` é TERMINAL para liquidação: rejeitar qualquer transição posterior de volta para `pending` ou `in_process`.
5. **Atualização do Registro**:
   - Gravar `mp_payment_id`, `status`, `status_detail`, `payment_method_id`, `payment_type_id`, `payer_email` e `updated_at`.
6. **Liberação da Consulta Veicular**:
   - Se `newStatus === 'approved'`, invocar `releaseVerifiedPaidConsultation(transaction.id)`.

---

## Idempotency and Concurrency Strategy

1. **Tratamento de Múltiplos Webhooks**:
   - O Mercado Pago pode retransmitir o webhook até 4 vezes em caso de timeout.
   - Cada notificação recebida é registrada na tabela `webhook_events`. Se o evento já constar como `processed`, o webhook responde HTTP 200 prontamente e emite `checkout_pro.webhook_duplicate_ignored`.
2. **Concorrência entre Webhook e Reconcile**:
   - O cliente pode clicar no botão "Verificar Status" exatamente no momento em que o webhook está em trânsito.
   - A função de atualização transacional deve utilizar uma trava lógica no banco: a primeira rotina a atualizar a transação para `approved` executa a liberação.
   - Em `releaseVerifiedPaidConsultation`, a trava otimista `.eq('payment_status', 'unpaid')` garante que apenas um processo consiga atualizar a consulta para `processing` e chamar a API veicular.
   - O segundo processo recebe `{ success: true, claimedByOther: true }` e encerra sem erros.
3. **Falhas Temporárias da API do Provedor**:
   - Se o webhook receber assinatura válida mas a chamada `Payment.get` falhar por indisponibilidade da API do Mercado Pago, a rota responde HTTP 502 (Bad Gateway), permitindo que o Mercado Pago tente novamente (retry).

---

## Reconciliation Fallback

Criação da rota autenticada:
`POST /api/mp/transactions/[transactionId]/reconcile`

### Especificação Técnica:
- **Autenticação**: Sessão de usuário validada via `createClient()` do Supabase.
- **Autorização**: Apenas o usuário dono da transação (`transaction.user_id === user.id`) ou administradores com perfil ativo em `admin_profiles`. Retornar HTTP 404 para usuários não autorizados para evitar enumeração de recursos.
- **Rate Limiting**: Limite em memória por transação (máximo 1 execução a cada 3 segundos). Retornar HTTP 429 se violado.
- **Estratégia de Busca**:
  1. Se a transação já estiver `approved` e a consulta `completed`, retornar status de sucesso imediatamente sem chamar a API do Mercado Pago.
  2. Se `mp_payment_id` estiver preenchido, consultar `Payment.get({ id: mp_payment_id })`.
  3. Se `mp_payment_id` for nulo, buscar via `Payment.search({ options: { external_reference: transactionId } })`.
- **Confirmação Reutilizável**:
  - Reutilizar exatamente a mesma função central de confirmação compartilhada com o webhook (`confirmAndProcessPaymentTransaction`).
  - Se aprovado, atualiza o banco e desbloqueia a consulta.
  - Se ainda pendente no provedor, mantém `pending` e informa o frontend sem erros.
- **Auditoria**: Gravar em `consultation_audit_logs` o evento `reconciliation_payment_approved` ou `reconciliation_payment_checked`.

---

## Customer Return Experience

Melhorias na experiência do cliente em `app/cliente/pagamento/retorno/[transactionId]/page.tsx` e `components/customer/payment-return-status.tsx`:

1. **Ativação Inicial do Reconcile**:
   - Ao montar o componente com status inicial pendente e parâmetro visual de retorno, o frontend efetua um disparo imediato (`POST /api/mp/transactions/[transactionId]/reconcile`).
2. **Estratégia de Polling Controlado**:
   - Intervalos de sondagem com backoff progressivo: imediato (0s), 3 segundos, 8 segundos, 15 segundos.
   - Encerrar o polling automaticamente ao atingir estado terminal (`approved` com consulta `completed`, ou `rejected`/`cancelled`) ou após 15 tentativas.
3. **Ação Manual do Usuário**:
   - O botão "Verificar Status" executa a chamada de `reconcile` no servidor antes de atualizar o estado visual, exibindo indicador de carregamento (`Loader2`).
4. **Estados Visuais Claros e Amigáveis**:
   - *Aguardando Confirmação*: "Estamos confirmando seu pagamento com segurança. Isso pode levar alguns instantes."
   - *Pagamento Confirmado / Preparando Laudo*: "Pagamento confirmado! Gerando seu laudo veicular..."
   - *Laudo Disponível*: Exibe botão destacado "Visualizar Laudo Completo".
   - *Pagamento Pendente/Pix*: Informações sobre o tempo de compensação bancária.
   - *Pagamento Recusado*: Orientação clara com opção de reiniciar o pagamento.
   - *Suporte ao Cliente*: Link direto para o WhatsApp de atendimento com mensagem pré-formatada.
5. **Garantia de Integridade**: Nenhuma tela ou componente poderá considerar a transação paga unicamente pela query string do navegador (`?result=success` ou `?collection_status=approved`).

---

## Logging and Observability

Implementar um módulo centralizado de observabilidade (`lib/mercadopago/observability.ts` e `lib/mercadopago/webhook-logger.ts`) com as seguintes diretrizes:

### 1. Prefixo Mandatório
Todos os logs do ciclo de vida devem utilizar:
```text
[CHECKOUT_PRO]
```

### 2. Helpers de Higienização e Mascaramento
- `maskId(id: string | null): string`: Exibe os 4 primeiros e 4 últimos caracteres (ex.: `1778...7601`).
- `shortHash(val: string | null): string`: Gera os 8 primeiros caracteres do hash SHA-256 da string para rastrear manifestos sem expor o conteúdo bruto.
- `getRuntimeEnvironment(): 'production' | 'preview' | 'local'`:
  ```ts
  export function getRuntimeEnvironment(): 'production' | 'preview' | 'local' {
    if (process.env.VERCEL_ENV === 'production') return 'production';
    if (process.env.VERCEL_ENV === 'preview') return 'preview';
    return 'local';
  }
  ```
- `sanitizeError(error: unknown): { name: string; message: string }`: Remove tokens, e-mails e credenciais de mensagens de erro.

### 3. Eventos Estruturados
- `checkout_pro.webhook_received`: Registro de chegada com metadados do request, presença de cabeçalhos e fonte do resource ID.
- `checkout_pro.webhook_signature_manifest_built`: Hash truncado do manifesto, versão e tamanho.
- `checkout_pro.webhook_signature_verified`: Assinatura validada com sucesso e duração em milissegundos.
- `checkout_pro.webhook_signature_rejected`: Motivo específico da rejeição (`reasonCode`), tamanho dos digests recebido e esperado.
- `checkout_pro.webhook_duplicate_ignored`: Notificação repetida ignorada com segurança.
- `checkout_pro.payment_fetch_started` e `payment_fetch_succeeded`: Rastreamento da chamada à API oficial.
- `checkout_pro.transaction_confirmed`: Atualização atômica do status da transação.
- `checkout_pro.consultation_released`: Desbloqueio e execução do laudo veicular.
- `checkout_pro.reconcile_requested` e `checkout_pro.reconcile_completed`: Rastreamento do fallback de reconciliação.

### 4. Lista Negra Absoluta de Log
É terminantemente proibido registrar:
- `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_WEBHOOK_SECRET`
- Digest esperado completo ou assinatura `v1` completa
- Payload JSON bruto integral
- CPF, e-mail, telefone ou nomes completos de clientes
- Dados confidenciais de cartão ou credenciais de autenticação

---

## Security Considerations

1. **Resistência a Timing Attacks**: Uso mandatório de `crypto.timingSafeEqual` sobre buffers de tamanho idêntico.
2. **Validação Estrita de Formato**: Garantir que `v1` é uma cadeia hexadecimal de 64 caracteres antes de converter para buffer, prevenindo exceções de execução.
3. **Prevenção de Falsificação de Parâmetros**: Nunca confiar em valores monetários, IDs de consulta ou status passados pelo navegador.
4. **Isolamento de Credenciais por Ambiente**: Garantir que segredos de ambiente preview ou local nunca sejam usados para validar pagamentos de produção.
5. **Autenticação em Mutações**: Todas as rotinas de conciliação exigem usuário autenticado com RLS e validação de propriedade da transação no banco.
6. **Proteção Contra Replay**: IDs de notificação e eventos são armazenados em `webhook_events` para impedir reprocessamentos forjados.

---

## Implementation Phases

### Phase 0 — Baseline, Análise e Reprodução com Fixtures
- Revisar a implementação de `validateWebhookSignature` em `lib/mercadopago/webhook-service.ts`.
- Criar fixture representativo com base nos dados reais do incidente (`paymentId: 177857907601`, `x-request-id`, `ts`, payload real).
- Reproduzir o cálculo do manifesto e mapear exatamente onde o hash diverge.

### Phase 1 — Utilitários Puros de Assinatura e Observabilidade
- Implementar `resolveMercadoPagoWebhookResourceId(request: Request, payload: unknown): string | null` em `lib/mercadopago/webhook-service.ts`.
- Refatorar o parser de `x-signature` para suportar tolerância a espaços, chaves em qualquer ordem e campos extras.
- Implementar a validação de hex e comparação de buffers via `crypto.timingSafeEqual`.
- Implementar `getRuntimeEnvironment()` em `lib/mercadopago/observability.ts`.
- Adicionar os helpers de observabilidade segura (`shortHash`, `maskId`, sanitização).

### Phase 2 — Suíte de Testes Unitários de Assinatura
- Expandir `lib/mercadopago/__tests__/webhook-signature.test.ts` cobrindo todos os 20 cenários especificados:
  - Template oficial `id:{data.id};request-id:{x-request-id};ts:{ts};`.
  - Ordem alternada (`v1=..., ts=...`), espaços extras, campos desconhecidos.
  - Cabeçalhos ausentes, segredo ausente, digest inválido, digest não hexadecimal.
  - Identificador via body (`data.id` string e number) e via query string.
  - Verificação de que nenhum segredo é vazado nos logs ou exceções.

### Phase 3 — Serviço Centralizado de Confirmação e Atualização do Webhook
- Criar/refatorar a função centralizada `confirmAndProcessPaymentTransaction` em `lib/mercadopago/payment-processing-service.ts` (ou módulo de domínio coeso), reutilizável pelo webhook e pelo reconcile.
- Atualizar `app/api/webhooks/mercadopago/route.ts` para usar o novo pipeline de validação e confirmação.
- Integrar a deduplicação de eventos em `webhook_events`.

### Phase 4 — Endpoint de Reconciliação Autenticada
- Criar a rota `app/api/mp/transactions/[transactionId]/reconcile/route.ts`.
- Implementar validação de sessão, verificação de propriedade da transação e controle de taxa (rate limiting).
- Conectar a busca do Mercado Pago por `mp_payment_id` ou `external_reference`.
- Invocar a rotina central de confirmação compartilhada.

### Phase 5 — Aprimoramento da Interface de Retorno do Cliente
- Atualizar `components/customer/payment-return-status.tsx` para acionar a rota de reconciliação no retorno de sucesso.
- Implementar o polling com backoff progressivo (0s, 3s, 8s, 15s).
- Atualizar o botão "Verificar Status" para disparar a conciliação manual.
- Refinar as mensagens de estado e acessibilidade mobile.

### Phase 6 — Testes de Integração e Verificação End-to-End
- Executar a suíte completa de testes (`npm test`).
- Testar a rota de reconciliação com transações aprovadas e pendentes.
- Validar a idempotência simulando requisições concorrentes de webhook e reconciliação.

### Phase 7 — Documentação, Runbook Operacional e Recuperação
- Finalizar a documentação da feature em `specs/029-mercadopago-webhook-real-signature/`.
- Documentar os passos de recuperação operacional para pagamentos que ficaram pendentes em produção.

---

## Test Strategy

A estratégia de testes abrange três níveis:

### 1. Testes Unitários (`lib/mercadopago/__tests__/webhook-signature.test.ts`)
- **T01**: Validação de assinatura com manifesto oficial `id:177857907601;request-id:req-123;ts:1704067200;`.
- **T02**: Parser de assinatura com ordem invertida (`v1=..., ts=...`).
- **T03**: Parser de assinatura com espaços em branco após vírgulas e ao redor do sinal de igual.
- **T04**: Tolerância a campos extras desconhecidos no cabeçalho `x-signature`.
- **T05**: Rejeição quando cabeçalho `x-signature` estiver ausente.
- **T06**: Rejeição quando cabeçalho `x-request-id` estiver ausente.
- **T07**: Rejeição quando `data.id` estiver ausente tanto no corpo quanto na URL.
- **T08**: Rejeição quando o digest `v1` contiver caracteres não hexadecimais.
- **T09**: Rejeição quando o digest `v1` possuir tamanho diferente de 64 caracteres.
- **T10**: Rejeição quando o digest `v1` for adulterado.
- **T11**: Rejeição controlada quando `MERCADO_PAGO_WEBHOOK_SECRET` não estiver configurado.
- **T12**: Extração de recurso quando `payload.data.id` for string.
- **T13**: Extração de recurso quando `payload.data.id` for número.
- **T14**: Extração de recurso a partir do parâmetro `data.id` da query string.
- **T15**: Prevenção de vazamento de segredos em logs e saídas de erro.

### 2. Testes de Integração
- **T16**: Dois webhooks concorrentes para o mesmo pagamento (idempotência confirmada).
- **T17**: Notificação aprovada seguida de evento pendente atrasado (sem downgrade de status).
- **T18**: Reconciliação autenticada de pagamento aprovado no Mercado Pago (desbloqueio do laudo).
- **T19**: Reconciliação autenticada de pagamento pendente (estado preservado sem erro).
- **T20**: Rejeição de reconciliação de transação pertencente a outro cliente.

### 3. Validação Manual
- Execução do cenário no simulador do painel do Mercado Pago.
- Teste com checkout real controlado em ambiente de produção após deploy.

---

## Deployment and Rollback

### Procedimento de Deploy em Produção
1. Criar branch `029-mercadopago-webhook-real-signature` e Pull Request para `master`.
2. Executar validação automatizada local: `npm run typecheck`, `npm run lint` e `npm test`.
3. Validar no deployment de Preview da Vercel a ausência de regressões.
4. Confirmar que a variável `MERCADO_PAGO_WEBHOOK_SECRET` no painel da Vercel para o ambiente **Production** corresponde exatamente ao segredo da aplicação ativa no Mercado Pago.
5. Realizar o merge para a branch `master` acionando o deploy de produção.
6. Acessar o painel do Mercado Pago e disparar um evento de teste para o webhook de produção.
7. Monitorar os logs da Vercel com filtro `[CHECKOUT_PRO]` por 30 minutos, confirmando:
   - `runtimeEnvironment: "production"`
   - `checkout_pro.webhook_signature_verified`
   - Zero ocorrências de `checkout_pro.webhook_signature_rejected` em eventos legítimos.

### Procedimento de Rollback
1. Em caso de anomalia grave, acionar o botão de rollback para o deployment anterior no painel da Vercel.
2. Como não há migrações destrutivas no banco, o schema do Supabase permanece 100% compatível com a versão anterior.
3. Transações financeiras e laudos já liberados são mantidos intactos.
4. Qualquer pendência operacional pode ser tratada através da rotina administrativa de reconciliação.

---

## Operational Recovery

Procedimento de recuperação para transações reais aprovadas no Mercado Pago que permaneceram com status `pending` devido à falha anterior do webhook:

### Transações Identificadas para Avaliação:
- `3c561c8c-95f4-43e4-aaf0-1862817593e4`
- `e1b2385d-c20c-48f3-840d-f81260faaef8`
- `54b419a6-053e-48fc-8afc-9aa3eaed39ad` (Payment ID: `177857907601`, Consulta: `259d3e00-d00d-45ce-bcf2-935493b8eae8`)

### Procedimento Seguro de Recuperação (Runbook):
1. **Nunca executar UPDATE manual direto via SQL** para alterar transações para `approved` sem conferência na API do provedor.
2. **Executar a reconciliação autoritativa** utilizando a Server Action administrativa já existente (`reconcilePaymentTransactionAdmin` em `lib/mercadopago/admin-actions.ts`) ou endpoint autenticado.
3. A rotina consulta o Mercado Pago via `MERCADO_PAGO_ACCESS_TOKEN`:
   - Valida se o pagamento está com status `approved`.
   - Valida se `external_reference` corresponde à transação.
   - Atualiza `payment_transactions` com `mp_payment_id` e status `approved`.
   - Aciona `releaseVerifiedPaidConsultation` para desbloquear a consulta e gerar o laudo.
   - Registra a ação na tabela `consultation_audit_logs`.
4. Em caso de divergência de valores ou referências inexistentes, manter o status pendente e sinalizar para verificação financeira manual.
5. Jamais executar estornos automáticos como parte da rotina de recuperação.

---

## Risks and Open Questions

### Riscos Mapeados e Mitigações
1. **Risco**: Mercado Pago alterar o formato do cabeçalho `x-signature` ou omitir `data.id` em versões futuras de API.  
   *Mitigação*: Parser tolerante com regex, extração em múltiplas fontes com prioridades definidas e fallback de reconciliação ativo no retorno do cliente.
2. **Risco**: Cliente fechar o navegador imediatamente após pagar no Checkout Pro sem passar pela tela de retorno.  
   *Mitigação*: A correção da validação HMAC do webhook garante que a liquidação ocorra de forma assíncrona mesmo sem a presença do cliente na aplicação.
3. **Risco**: Concorrência excessiva de chamadas de reconciliação gerando sobrecarga na API do Mercado Pago.  
   *Mitigação*: Rate limiting em memória e verificação prévia de status terminal antes de qualquer requisição externa.

### Questões Operacionais
- O segredo cadastrado em `MERCADO_PAGO_WEBHOOK_SECRET` na Vercel deve ser conferido manualmente pelo operador no painel do desenvolvedor do Mercado Pago para assegurar que corresponde à aplicação de Produção (e não ao ambiente de testes/sandbox).
