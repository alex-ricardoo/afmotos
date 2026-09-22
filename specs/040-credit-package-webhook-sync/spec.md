# Feature Specification: Robustez e Conciliação de Compra de Pacotes de Créditos Veiculares

**Feature Branch**: `feature/040-credit-package-webhook-sync`

**Created**: 2026-09-22

**Status**: Draft

**Input**: User description: "/speckit-specify Você é um Staff Engineer / Senior Full-Stack Engineer especializado em Next.js App Router, TypeScript, Supabase/PostgreSQL, Mercado Pago Checkout Pro, webhooks seguros, conciliação financeira, credit ledger append-only e sistemas de pagamento idempotentes. A sua missão é corrigir e robustecer o fluxo de compra de pacotes de créditos veiculares, garantindo que ele seja tão confiável quanto o fluxo já funcional de compra de consulta individual por placa, e que todas as compras de pacote apareçam no painel administrativo /admin/pagamentos-consultas para rastreabilidade, conciliação e estorno manual."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Concessão Autônoma de Créditos via Webhook Aprovado (Priority: P1)

Como comprador de pacote de créditos veiculares,
quando meu pagamento for aprovado pelo Mercado Pago via Checkout Pro,
quero que meus créditos sejam concedidos instantaneamente ao meu saldo no sistema sem que eu precise manter a aba do navegador aberta ou retornar ao site,
para que eu possa utilizar minhas consultas veiculares de imediato e sem risco de perda financeira.

**Why this priority**: É o cerne da falha crítica reportada em produção (pedido `de58e94b-247c-451d-abd2-9291c9b1b6b4`). O pagamento foi faturado pelo gateway, mas os créditos não foram liberados na conta do cliente devido à ausência de processamento autônomo e resiliente pelo webhook.

**Independent Test**: Simular o envio de webhook com assinatura HMAC válida contendo a notificação de pagamento aprovado para uma ordem de pacote de créditos; verificar se a ordem passa para status `paid`, a transação vincula o `mp_payment_id`, o pacote ativo é criado em `customer_credit_packages`, o ledger contábil recebe o lançamento do tipo `grant`, e o saldo do cliente é incrementado sem dependência de interação do navegador.

**Acceptance Scenarios**:

1. **Given** um pedido de pacote de créditos com status `pending` e transação associada `pending`, **When** o webhook oficial receber notificação de pagamento com status aprovado e valor coincidente com a oferta, **Then** o sistema deve atualizar a transação para `approved` com o `mp_payment_id`, atualizar a ordem para `paid`, disparar a concessão atômica de créditos, gerar exatamente 1 pacote ativo, 1 entrada de ledger do tipo `grant` e atualizar o saldo disponível do cliente.
2. **Given** um pedido de pacote que já teve seus créditos liberados anteriormente, **When** o webhook for reenviado com a mesma notificação de pagamento, **Then** o sistema deve reconhecer o processamento prévio de forma estritamente idempotente, responder sucesso HTTP sem duplicar pacotes, ledger ou saldo.
3. **Given** um webhook recebido com status `rejected` ou `cancelled`, **When** o processamento for executado, **Then** o status da transação e do pedido devem refletir a recusa sem qualquer liberação de créditos no balanço do cliente.

---

### User Story 2 - Reconciliação Server-Side e Recuperação de Pedidos Pendentes (Priority: P1)

Como cliente ou administrador da plataforma,
quando um webhook do Mercado Pago atrasar, for bloqueado ou falhar em rede,
quero que o sistema seja capaz de consultar ativamente a API do Mercado Pago usando identificadores de fallback (order ID, external reference ou preference ID), atualizar a ordem e liberar os créditos,
para que nenhum cliente pagante permaneça com créditos retidos.

**Why this priority**: Garante tolerância a falhas na infraestrutura de webhooks e permite recuperar imediatamente pedidos históricos (como `de58e94b-247c-451d-abd2-9291c9b1b6b4`) sem depender de intervenções manuais no banco de dados.

**Independent Test**: Executar a ação de reconciliação de uma ordem de pacote pendente com pagamento aprovado no Mercado Pago onde o `mp_payment_id` ainda não estava registrado; verificar que a busca localiza o pagamento real por referência externa/preferência, executa a rotina unificada e concede os créditos de forma segura.

**Acceptance Scenarios**:

1. **Given** uma ordem de pacote pendente sem `mp_payment_id` persistido, **When** a reconciliação for acionada pelo admin ou pela tela de status/retorno do cliente, **Then** o sistema deve consultar a API do Mercado Pago buscando pagamentos associados à `external_reference` da ordem (ou preferência), vincular o `mp_payment_id` descoberto e conceder os créditos via rotina unificada.
2. **Given** uma ordem de pacote cujo pagamento ainda não foi concluído no gateway, **When** a reconciliação for executada, **Then** o sistema deve manter o status pendente sem alterar saldos e informar claramente o estado ao solicitante.
3. **Given** múltiplas chamadas concorrentes de reconciliação para a mesma ordem, **Then** o lock pessimista na ordem e a chave de idempotência do ledger devem garantir exatamente uma concessão.

---

### User Story 3 - Visibilidade Unificada na Central Administrativa de Pagamentos (Priority: P2)

Como administrador financeiro e operacional da AF Motos,
quero que todas as compras de pacotes de crédito apareçam na Central `/admin/pagamentos-consultas` junto com as consultas individuais,
para que eu possa acompanhar receitas, rastrear identificadores do gateway, auditar concessões de créditos e identificar pendências em uma interface única.

**Why this priority**: Atualmente a view e os serviços administrativos realizam inner join exclusivo com consultas individuais (`customer_plate_consultations`), tornando as compras de pacote 100% invisíveis na central operacional.

**Independent Test**: Acessar `/admin/pagamentos-consultas` com pedidos de consultas individuais e pacotes de créditos registrados; testar os filtros por tipo ("Todos", "Consultas Veiculares", "Pacotes de Créditos"), a busca textual (por placa, e-mail, order ID, MP payment ID e preferência) e a abertura do drawer de detalhes para cada tipo.

**Acceptance Scenarios**:

1. **Given** transações de ambos os tipos (`vehicle_consultation` e `credit_package`), **When** o administrador acessar a listagem geral, **Then** a tabela deve exibir linhas de ambos os propósitos, com badges distintos ("Consulta Veicular [PLACA]" vs "Pacote de Créditos [NOME/QTD]"), valores, compradores e status corretos.
2. **Given** o filtro por tipo selecionado como "Pacotes de Créditos", **When** a página atualizar, **Then** apenas pedidos de pacotes devem ser exibidos, mostrando a quantidade de créditos e o status de concessão.
3. **Given** um administrador pesquisando pelo UUID do pedido de pacote ou pelo ID de pagamento do Mercado Pago, **When** a busca for submetida, **Then** a linha correspondente deve ser retornada com precisão.
4. **Given** um pedido de pacote com pagamento pendente, **When** o administrador clicar em "Reconciliar" na linha da tabela, **Then** o sistema deve consultar o gateway, atualizar a ordem e recarregar os dados na tela.

---

### User Story 4 - Estorno Manual Seguro e Auditável de Pacotes (Priority: P3)

Como administrador financeiro,
quando um cliente solicitar estorno de um pacote adquirido,
quero avaliar de forma automatizada se o pacote ainda está íntegro (créditos não utilizados nem reservados) e, se elegível, realizar o estorno no Mercado Pago com revogação contábil dos créditos no ledger,
para que o cliente seja ressarcido sem deixar créditos órfãos utilizáveis no sistema.

**Why this priority**: Preserva a integridade financeira e contábil, impedindo que créditos estornados sejam consumidos indevidamente ou que pacotes com créditos já gastos sofram estorno automático descontrolado.

**Independent Test**: Executar tentativa de estorno para: (a) pacote 100% intacto -> deve comunicar o Mercado Pago, registrar cancelamento, lançar débito compensatório no ledger e deduzir saldo; (b) pacote parcialmente ou totalmente consumido -> deve bloquear estorno automático e exigir revisão manual.

**Acceptance Scenarios**:

1. **Given** um pacote de créditos ativo com 100% dos créditos disponíveis (nenhum consumido ou reservado), **When** o administrador confirmar o estorno manual com motivo obrigatório, **Then** o sistema deve registrar a chamada no gateway, atualizar ordem e transação para `refunded`, lançar evento de revogação append-only no `customer_credit_ledger` e abater o saldo em `customer_credit_balances`.
2. **Given** um pacote cujos créditos já foram parcialmente ou totalmente consumidos, **When** o estorno for solicitado, **Then** o sistema deve bloquear o estorno automático, exibir mensagem clara dos créditos já utilizados e colocar o pacote sob revisão manual sem alteração destrutiva do histórico.

---

### Edge Cases

- **Webhook recebido antes da criação da transação/ordem terminar no checkout**: Webhook responde status seguro ou retry sem corromper integridade; a busca não localiza registro incompleto e aguarda retry legítimo do gateway.
- **Divergência de valor monetário (centavos)**: O pagamento recebido diverge do preço oficial da oferta gravado no snapshot do pedido. O sistema MUST registrar falha com alerta de auditoria, recusar a concessão de créditos e colocar a ordem em análise.
- **Duplo webhook quase simultâneo (concorrência)**: Ambas as requisições tentam conceder créditos. A primeira obtém o lock exclusivo da linha da ordem via `FOR UPDATE`; a segunda detecta status já pago ou pacote já existente na verificação de idempotência (`ALREADY_GRANTED`), retornando sucesso sem duplicar saldo.
- **Tentativa de estorno concorrente com consumo de crédito**: O cliente tenta gastar o crédito no momento em que o admin estorna. A transação com lock e validação de saldo deve impedir saldo negativo (`CHECK (available_credits >= 0)`).
- **Notificação sem `external_reference` no payload do MP**: O sistema utiliza estratégia de fallback cascateada confiável (`mp_payment_id`, `preference_id` e metadata oficial) para localizar a transação correta.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O endpoint de webhooks (`/api/webhooks/mercadopago`) MUST validar a assinatura HMAC-SHA256 (`x-signature` e `x-request-id`) com base no segredo oficial antes de qualquer efeito financeiro ou persistência autoritativa.
- **FR-002**: O sistema MUST consultar a API oficial do Mercado Pago para obter o estado autoritativo do pagamento antes de acionar rotinas de desbloqueio de consulta ou concessão de pacotes.
- **FR-003**: O processamento de pagamentos confirmados do Mercado Pago MUST ser unificado em um serviço de domínio idempotente compartilhado estritamente entre o webhook, a reconciliação administrativa e a checagem de status.
- **FR-004**: Para pagamentos com `purpose = 'credit_package'`, a liberação de créditos MUST ser realizada exclusivamente através da RPC transacional `grant_credit_package_from_paid_order`, que garante transacionalidade e idempotência estrita.
- **FR-005**: A concessão de créditos de um pacote de compras NUNCA deve ser executada mais de uma vez para a mesma ordem ou transação de pagamento.
- **FR-006**: A tabela `customer_credit_ledger` MUST ser estritamente append-only; é terminantemente proibido atualizar ou excluir registros contábeis históricos.
- **FR-007**: A reconciliação server-side de pacotes de crédito MUST ser capaz de localizar pagamentos no Mercado Pago mesmo quando o `mp_payment_id` for originalmente nulo, utilizando busca por referência externa (`order.id`) ou identificador de preferência.
- **FR-008**: A Central Administrativa `/admin/pagamentos-consultas` MUST listar transações tanto de consultas veiculares individuais quanto de pacotes de créditos, adaptando colunas, badges, KPIs e filtros contextualmente.
- **FR-009**: A interface administrativa MUST permitir filtrar explicitamente por tipo de transação ("Todos", "Consultas Veiculares", "Pacotes de Créditos") e buscar por identificador do pedido (`orderId`), placa, e-mail do cliente, ID de pagamento MP e ID de preferência.
- **FR-010**: O estorno manual de pacotes MUST validar a integridade dos créditos concedidos: apenas pacotes com 100% de créditos intactos (não consumidos e não reservados) podem ser estornados automaticamente; qualquer consumo prévio bloqueia o estorno automático e exige revisão manual.
- **FR-011**: Em caso de estorno confirmado de pacote, a dedução de créditos no balanço do usuário MUST ser acompanhada de um lançamento compensatório do tipo `revoke` no ledger, mantendo a regra de que o saldo nunca fique negativo.
- **FR-012**: O fluxo existente de consulta veicular individual (desbloqueio de laudo, criação de delivery job, reprocessamento na API Brasil e estorno de consulta) MUST ser preservado integralmente sem qualquer regressão.

### Key Entities

- **PaymentTransaction (`payment_transactions`)**: Registro financeiro central que representa a cobrança junto ao gateway. Possui `purpose` (`vehicle_consultation` ou `credit_package`), valor, status no gateway, método de pagamento, `mp_payment_id` e ponteiros exclusivos para `consultation_id` ou `credit_package_order_id`.
- **CreditPackageOrder (`credit_package_orders`)**: Pedido comercial de aquisição de pacote de créditos. Contém snapshot imutável da oferta, quantidade de créditos, valor em centavos, status (`pending`, `paid`, `refunded`, etc.), timestamps de pagamento (`paid_at`) e concessão (`granted_at`).
- **CustomerCreditPackage (`customer_credit_packages`)**: Pacote de créditos efetivamente concedido a uma conta de cliente. Rastreia créditos concedidos, créditos restantes, validade e vínculo com o pedido de compra (`purchase_order_id`).
- **CustomerCreditLedger (`customer_credit_ledger`)**: Livro-razão contábil append-only com efeito em balanço (`available_effect`, `consumed_effect`, `reserved_effect`).
- **CustomerCreditBalance (`customer_credit_balances`)**: Saldo consolidado por cliente com proteção contra saldo negativo (`available_credits >= 0`).
- **AdminPaymentConsultationsView (`admin_payment_consultations_view`)**: Visão relacional administrativa otimizada que unifica transações financeiras de consultas veiculares e pacotes de crédito com seus respectivos metadados, entregas e estornos.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% dos pagamentos de pacotes aprovados no gateway têm seus créditos concedidos automaticamente e disponibilizados na conta do cliente em menos de 5 segundos após o recebimento do webhook, sem necessidade de abertura de página pelo comprador.
- **SC-002**: 0 casos de créditos duplicados ou lançamentos múltiplos no ledger contábil para um mesmo pagamento, comprovado em testes de reenvio de webhook e concorrência sob carga.
- **SC-003**: 100% das ordens de pacote de crédito (incluindo o caso histórico `de58e94b-247c-451d-abd2-9291c9b1b6b4`) podem ser auditadas, localizadas e reconciliadas com sucesso através da Central Administrativa.
- **SC-004**: 100% das compras de pacotes aparecem na Central `/admin/pagamentos-consultas` com seus metadados comerciais e status de créditos.
- **SC-005**: 0 regressões no fluxo de consultas individuais existentes, mantendo cobertura de 100% de aprovação na suíte de testes automatizados do repositório.

## Assumptions

- O segredo de webhook do Mercado Pago (`MERCADO_PAGO_WEBHOOK_SECRET`) está configurado no ambiente de produção e assina adequadamente todas as notificações.
- A RPC `grant_credit_package_from_paid_order` é executada com privilégios de `SECURITY DEFINER` e possui permissões de execução para o role de backend (`service_role`).
- O volume e tipo de ofertas comerciais de crédito são previamente administrados na tabela `credit_package_offers`.
- Quando um webhook do Mercado Pago não enviar `external_reference`, a preferência registrada (`mp_preference_id`) ou os metadados da transação fornecem ponteiro suficiente para localização determinística da transação correspondente.
- A exclusão ou edição física de linhas de `customer_credit_ledger` continuará sendo terminantemente barrada por trigger de banco de dados (`trg_prevent_customer_credit_ledger_mutation`).
