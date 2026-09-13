# Feature Specification: Corrigir HMAC Real do Mercado Pago, Diagnóstico Seguro e Fallback de Reconciliação

**Feature Branch**: `029-mercadopago-webhook-real-signature`  
**Created**: 2026-09-13  
**Status**: Draft  
**Input**: User description: "Corrigir HMAC real do Mercado Pago, adicionar diagnóstico seguro e fallback de reconciliação"

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Validação e Liquidação Confiável de Notificações Reais do Mercado Pago (Priority: P1)

Como sistema de pagamentos da AF Motos, quero processar notificações de pagamento reais emitidas pelo Mercado Pago validando a assinatura criptográfica oficial HMAC-SHA256, para que pagamentos legítimos concluídos pelos clientes sejam reconhecidos de forma imediata e assíncrona, desbloqueando a consulta veicular sem intervenção manual.

**Why this priority**: É a espinha dorsal da integração com o Checkout Pro. Em produção, os clientes realizam o pagamento no Mercado Pago, mas o webhook vinha sendo rejeitado por divergência no formato da assinatura HMAC, impedindo a confirmação automática do pagamento.

**Independent Test**: Pode ser testado enviando payloads e cabeçalhos reais (ou fixtures fiéis ao formato real de produção do Mercado Pago), verificando que a assinatura HMAC é validada com sucesso, os dados são checados autoritativamente na API do provedor e a transação interna transita para aprovada.

**Acceptance Scenarios**:

1. **Given** que o Mercado Pago emite uma notificação de pagamento com cabeçalho `x-signature` (contendo `ts` e `v1`) e `x-request-id`,  
   **When** a notificação chega ao endpoint `/api/webhooks/mercadopago`,  
   **Then** o sistema extrai o identificador do recurso a partir do payload (`data.id`) ou query string, monta o manifesto oficial `id:{data.id};request-id:{x-request-id};ts:{ts};`, valida o hash HMAC de forma segura e responde HTTP 200 processando a transação.
2. **Given** que o cabeçalho `x-signature` é enviado com ordem alternada de atributos (`v1=..., ts=...`), espaços extras após vírgulas ou parâmetros adicionais não reconhecidos,  
   **When** o validador de assinatura analisa a requisição,  
   **Then** os valores de `ts` e `v1` são extraídos com tolerância e precisão sem rejeitar notificações legítimas.
3. **Given** que uma requisição de notificação possui cabeçalho ausente, digest adulterado, timestamp expirado/ausente ou segredo não configurado no servidor,  
   **When** o validador inspeciona a assinatura,  
   **Then** a requisição é rejeitada com HTTP 401 controlado, sem expor rastreamento de pilha (stack trace), e o motivo da rejeição é registrado de forma higienizada nos logs de auditoria.

---

### User Story 2 - Reconciliação Server-Side e Desbloqueio Imediato no Retorno do Cliente (Priority: P1)

Como um cliente autenticado que acabou de pagar a consulta veicular no Checkout Pro e retornou à plataforma, quero que a aplicação verifique ativamente o status oficial do meu pagamento no provedor caso o webhook ainda não tenha sido recebido, para que eu não fique bloqueado na tela de espera ("Aguardando confirmação").

**Why this priority**: Depender exclusivamente de webhooks introduz riscos de latência de rede, atrasos na fila do provedor ou falhas temporárias de entrega. O mecanismo de reconciliação sob demanda garante que o cliente tenha seu laudo liberado em segundos assim que retornar ao site.

**Independent Test**: Pode ser testado navegando para a tela de retorno com um pagamento recém-aprovado no Mercado Pago sem o processamento prévio do webhook, confirmando que a chamada de reconciliação consulta a API do provedor, atualiza a transação para aprovada e libera o laudo veicular para visualização.

**Acceptance Scenarios**:

1. **Given** que o cliente retorna para a página `/cliente/pagamento/retorno/[transactionId]` após pagar no Mercado Pago e a transação interna ainda consta como `pending`,  
   **When** a página carrega ou o cliente clica no botão "Verificar Status",  
   **Then** a aplicação aciona o endpoint seguro de reconciliação no servidor (`POST /api/mp/transactions/[transactionId]/reconcile`), que busca o status autoritativo na API do Mercado Pago e conclui a aprovação caso o pagamento esteja confirmado.
2. **Given** que o cliente tenta acionar a reconciliação repetidas vezes seguidas,  
   **When** as requisições chegam ao servidor,  
   **Then** o sistema aplica controle de taxa (rate limiting) por transação/usuário e reutiliza o estado recente sem sobrecarregar a API externa.
3. **Given** que um usuário tenta reconciliar uma transação pertencente a outro cliente,  
   **When** a requisição é recebida,  
   **Then** o endpoint rejeita a operação com erro de autorização e não executa nenhuma consulta externa.
4. **Given** que a URL de retorno contém parâmetros de sucesso (`result=success`),  
   **When** o cliente acessa a página,  
   **Then** esses parâmetros são tratados estritamente como indicação visual temporária e o laudo NUNCA é liberado sem a confirmação autoritativa do servidor.

---

### User Story 3 - Observabilidade Estruturada e Diagnóstico Seguro de Webhooks (Priority: P2)

Como administrador e operador da infraestrutura AF Motos, quero acompanhar logs estruturados e padronizados de todas as tentativas de notificação e reconciliação com identificação precisa do ambiente de execução (`production`, `preview` ou `local`), para auditar a saúde da integração sem jamais vazar segredos ou dados pessoais sensíveis nos registros.

**Why this priority**: O diagnóstico do incidente em produção foi dificultado pela exibição errônea de `environment: development` na Vercel e pela ausência de metadados detalhados sobre o formato dos cabeçalhos recebidos. Logs estruturados e mascarados garantem resolução rápida sem comprometer a segurança.

**Independent Test**: Pode ser testado inspecionando a saída dos logs gerados durante uma requisição de webhook e de reconciliação, conferindo o prefixo `[CHECKOUT_PRO]`, o ambiente detectado corretamente e a ausência absoluta de segredos, tokens ou dados pessoais em texto claro.

**Acceptance Scenarios**:

1. **Given** que uma requisição é processada em ambiente Vercel de produção (`VERCEL_ENV=production`),  
   **When** os eventos de observabilidade são emitidos,  
   **Then** o campo `runtimeEnvironment` é registrado como `production`, desconsiderando defaults genéricos de ambiente local.
2. **Given** que qualquer evento de webhook ou reconciliação é registrado,  
   **When** os campos são formatados,  
   **Then** todos os logs contêm o prefixo `[CHECKOUT_PRO]`, IDs são mascarados (ex.: primeiros 4 e últimos 4 caracteres), hashes são truncados e variáveis como `MERCADO_PAGO_WEBHOOK_SECRET` ou `MERCADO_PAGO_ACCESS_TOKEN` jamais são serializadas.
3. **Given** que ocorre uma falha na validação de assinatura,  
   **When** o erro é registrado,  
   **Then** o log inclui um código de motivo preciso (ex.: `missing_signature`, `signature_mismatch`, `missing_resource_id`) juntamente com o tamanho dos digests recebido e esperado, sem expor os hashes completos.

---

### User Story 4 - Idempotência Estrita e Prevenção de Downgrade de Transações (Priority: P2)

Como sistema de gestão financeira da AF Motos, quero garantir que o processamento de pagamentos seja rigorosamente idempotente e imune a notificações fora de ordem, para que uma notificação tardia com status pendente ou uma duplicata de evento nunca reverta uma transação já aprovada nem reexecute a emissão de laudo veicular.

**Why this priority**: Webhooks podem ser retransmitidos múltiplas vezes pelo provedor ou chegar com inversão de ordem em redes distribuídas. É crítico impedir inconsistências financeiras ou duplicidade na geração de custos com APIs veiculares.

**Independent Test**: Pode ser testado simulando o recebimento de uma notificação com status aprovado seguida de uma notificação atrasada com status pendente para a mesma transação, confirmando que a segunda notificação é ignorada e o status aprovado é preservado.

**Acceptance Scenarios**:

1. **Given** que uma transação de pagamento já se encontra no status `approved`,  
   **When** uma notificação tardia ou fora de ordem com status `pending` ou `in_process` é recebida,  
   **Then** o sistema rejeita a transição inválida, mantém o status `approved` e registra o evento como duplicata/fora de ordem ignorada.
2. **Given** que o webhook recebe uma notificação idêntica que já foi completamente processada,  
   **When** a requisição é avaliada,  
   **Then** o sistema responde HTTP 200 indicando recebimento com sucesso, registra `checkout_pro.webhook_duplicate_ignored` e não reexecuta a liberação da consulta veicular.
3. **Given** que uma transação é aprovada concomitantemente via webhook e via fallback de reconciliação da página de retorno,  
   **When** ambas as rotinas tentam atualizar o banco,  
   **Then** a rotina de liberação atômica garante que a busca veicular externa seja disparada exatamente uma única vez.

---

### Edge Cases

- **Cabeçalho `x-signature` com ordem invertida**: O cabeçalho vem formatado como `v1=...,ts=...` em vez de `ts=...,v1=...`. O sistema deve parsear chave-valor individualmente sem assumir posições fixas.
- **Espaços em branco nos cabeçalhos**: Presença de espaços após vírgulas (`ts=123, v1=abc`) ou em torno dos sinais de igual. Devem ser removidos com higienização estrita de whitespace.
- **Identificador entregue via corpo ou query string**: Mercado Pago pode enviar o ID do pagamento no corpo (`data.id` como string ou número) ou na URL (`?data.id=...` ou `?id=...`). O resolvedor de recursos deve priorizar o corpo e usar a query string como fallback seguro.
- **Digest não hexadecimal ou tamanho divergente**: O valor de `v1` recebido pode conter caracteres inválidos ou comprimento diferente de 64 caracteres hexadecimais (SHA-256). O sistema deve validar antes da comparação para evitar falhas ou exceções não tratadas no comparador criptográfico.
- **Transação ausente ou external_reference desconhecida**: Notificação recebida para um pagamento que não pertence a nenhuma transação interna da AF Motos. O sistema deve registrar o evento de forma auditável e responder sem quebrar a integridade do sistema.
- **Tentativa de adulteração de parâmetros no navegador**: Cliente altera a query string da URL de retorno para forjar status de sucesso. O sistema deve desconsiderar qualquer parâmetro da URL do cliente como autoritativo e validar exclusivamente via backend.
- **Secret de webhook ausente ou não sincronizado**: Variável de ambiente vazia ou dessincronizada da aplicação correspondente no Mercado Pago. O sistema deve registrar alerta específico de configuração sem vazar dados ou expor stack trace ao cliente externo.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema MUST validar a assinatura criptográfica de todas as notificações recebidas no endpoint de webhook utilizando o algoritmo HMAC-SHA256 oficial do Mercado Pago, baseado no manifesto estrito `id:{data.id};request-id:{x-request-id};ts:{ts};`.
- **FR-002**: O sistema MUST extrair o identificador do recurso (`resourceId`) através de uma função pura e determinística que prioriza `payload.data.id` (convertendo valores numéricos para string e removendo espaços externos) e utiliza como contingência os parâmetros de URL `data.id` ou `id`.
- **FR-003**: O sistema MUST parsear os atributos `ts` (timestamp) e `v1` (hash) do cabeçalho `x-signature` de maneira resiliente, suportando qualquer ordem de campos, espaços em branco opcionais e chaves adicionais desconhecidas sem gerar falhas de execução.
- **FR-004**: O sistema MUST validar que o hash `v1` recebido é uma cadeia hexadecimal válida de comprimento correspondente ao hash SHA-256 (32 bytes / 64 caracteres hexadecimais) antes de executar a comparação em tempo constante (`timingSafeEqual`) em formato de buffers de bytes.
- **FR-005**: O sistema MUST rejeitar imediatamente com código HTTP 401 qualquer notificação que possua segredo ausente, cabeçalhos faltantes, formato de assinatura inválido ou divergência no hash criptográfico, registrando o motivo de forma segura sem expor segredos ou rastreamento de pilha.
- **FR-006**: O sistema MUST buscar as informações definitivas do pagamento diretamente na API oficial do Mercado Pago após a validação bem-sucedida da assinatura, utilizando o token de acesso no servidor e jamais confiando exclusivamente nos dados do corpo do webhook.
- **FR-007**: O sistema MUST validar que o pagamento retornado pela API oficial corresponde ao recurso notificado, que a referência externa (`external_reference`) coincide com a transação interna, e que o valor e moeda correspondem aos dados registrados no banco.
- **FR-008**: O sistema MUST garantir a idempotência do processamento de pagamentos, impedindo regressão de estado (downgrade) de pagamentos já aprovados para estados pendentes e ignorando eventos duplicados com resposta HTTP 200.
- **FR-009**: O sistema MUST acionar a rotina de desbloqueio e execução da consulta veicular (`releaseVerifiedPaidConsultation`) exatamente uma única vez por transação aprovada.
- **FR-010**: O sistema MUST disponibilizar um endpoint server-side autenticado `POST /api/mp/transactions/[transactionId]/reconcile`, restrito ao usuário proprietário da transação ou administradores, que consulta ativamente a API do Mercado Pago por `mp_payment_id` ou `external_reference` e aplica a mesma lógica transacional de confirmação do webhook.
- **FR-011**: O sistema MUST implementar na página de retorno do cliente (`app/cliente/pagamento/retorno/[transactionId]/page.tsx`) um mecanismo de verificação ativa que aciona a reconciliação server-side com estratégia de sondagem (polling) controlada com recuo (backoff) e opção de atualização manual pelo botão "Verificar Status".
- **FR-012**: O sistema MUST emitir logs estruturados padronizados com o prefixo `[CHECKOUT_PRO]` para todos os eventos de ciclo de vida do webhook e da reconciliação, identificando com precisão o ambiente de execução (`production`, `preview` ou `local`) a partir de variáveis confiáveis como `VERCEL_ENV`.
- **FR-013**: O sistema MUST mascarar obrigatoriamente identificadores, e-mails, documentos e hashes em todos os logs, sendo estritamente proibido o registro em texto claro de segredos de webhook, tokens de acesso, assinaturas brutas ou corpos inteiros de requisições.

### Key Entities _(include if feature involves data)_

- **Transação de Pagamento (`payment_transactions`)**: Registro financeiro interno da AF Motos vinculado à consulta veicular, contendo referências externas do provedor (`mp_preference_id`, `mp_payment_id`), status atualizado, valor monetário, chave de idempotência e dados de auditoria.
- **Evento de Webhook (`webhook_events`)**: Registro de auditoria e controle de idempotência para todas as notificações recebidas pelo webhook, contendo chaves do provedor, identificador do recurso, status de validação da assinatura, hash do payload e status de processamento (`pending`, `processed`, `failed`, `ignored`).
- **Consulta Veicular (`customer_plate_consultations`)**: Registro do pedido de consulta por placa realizado pelo cliente, possuindo status de ciclo de vida (`pending`, `paid`, `completed`, `failed`) e status de pagamento (`unpaid`, `paid`).
- **Log de Auditoria de Consulta (`consultation_audit_logs`)**: Registro histórico de todas as alterações críticas de estado e ações de reconciliação executadas por usuários ou pelo sistema.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% das notificações legítimas enviadas pelo Mercado Pago em ambiente de produção são validadas criptograficamente e processadas sem falsos positivos de rejeição de assinatura.
- **SC-002**: 100% das requisições com assinaturas forjadas, adulteradas ou sem credenciais válidas são rejeitadas com código HTTP 401 sem revelar segredos nos logs ou cabeçalhos de resposta.
- **SC-003**: 100% dos clientes que concluem o pagamento no Checkout Pro e retornam para a plataforma têm seu laudo disponibilizado em até 5 segundos através da ação combinada de webhook ou reconciliação de contingência.
- **SC-004**: Zero laudos veiculares liberados exclusivamente a partir de parâmetros da URL do navegador ou do lado cliente sem validação autoritativa do servidor.
- **SC-005**: Zero ocorrências de downgrade de transações previamente aprovadas e zero duplicações na execução de consultas veiculares pagas.
- **SC-006**: Zero exposição de segredos (`MERCADO_PAGO_WEBHOOK_SECRET`, `MERCADO_PAGO_ACCESS_TOKEN`), digests completos ou dados pessoais em texto claro nos logs da aplicação.
- **SC-007**: 100% dos eventos registrados em produção exibem o identificador de ambiente correto (`runtimeEnvironment: "production"`).

---

## Assumptions

- A plataforma é hospedada na Vercel e a variável de ambiente `VERCEL_ENV` é preenchida nativamente pela infraestrutura de hospedagem (`production`, `preview` ou `development`).
- O segredo de webhook (`MERCADO_PAGO_WEBHOOK_SECRET`) configurado na Vercel corresponde rigorosamente ao segredo da aplicação ativa cadastrada no painel do Mercado Pago que gera as preferências de pagamento.
- As credenciais de produção do Mercado Pago (`MERCADO_PAGO_ACCESS_TOKEN`) possuem permissão de leitura sobre pagamentos (`payments:read`) para permitir a busca autoritativa por ID ou busca por referência externa.
- A base de dados PostgreSQL no Supabase já possui as tabelas `payment_transactions`, `webhook_events`, `customer_plate_consultations` e `consultation_audit_logs` devidamente configuradas com permissões de serviço administrativo.
- Operações de estorno automático ou cancelamento manual de pedidos permanecem no escopo de ferramentas administrativas e não serão alteradas nesta especificação.
