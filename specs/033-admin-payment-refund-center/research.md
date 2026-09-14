# Pesquisa e Diagnóstico Técnico: Central Administrativa de Pagamentos, Consultas e Estornos

## 1. Contexto e Objetivos

Esta pesquisa estabelece as bases arquiteturais e operacionais para a Central Administrativa de Pagamentos, Consultas e Estornos da AF Motos (`/admin/pagamentos-consultas`), garantindo:
1. Reutilização de 100% das tabelas, serviços e rotinas existentes no projeto sem criação de entidades duplicadas.
2. Identificação automática de consultas retidas por saldo esgotado na API Brasil (`APIBRASIL_INSUFFICIENT_CREDITS`, status HTTP 402).
3. Estorno administrativo integral seguro, com confirmação reforçada, bloqueio de estornos duplicados e uso exclusivo do `mp_payment_id` autoritativo do Mercado Pago.
4. Reconciliação autoritativa do status de estornos pendentes.
5. Reprocessamento seguro da entrega de laudos apenas quando o pagamento estiver aprovado, o laudo não tiver sido entregue e nenhum estorno tiver sido acionado.
6. Acesso estritamente restrito a administradores com verificação em nível de servidor.

---

## 2. Inspeção da Arquitetura e Código Existente

### 2.1. Autenticação e Guarda de Administrador
- **Arquivo**: `lib/auth/admin-guard.ts`
- **Funções Chave**:
  - `validateAdminUser(supabase, authUserId)`: Consulta `public.admin_profiles` verificando `auth_user_id = authUserId`, `is_active = true` e `role IN ('admin', 'super_admin')`.
  - `getAuthenticatedAdmin()`: Carrega a sessão de `createClient()` (server cookies) e valida o perfil.
  - `requireAdminUser()`: Bloqueia acesso em Server Components e Server Actions redirecionando para `/admin/login?error=unauthorized`.
- **Função no Banco**: `public.is_admin()` (definida na migration `00020_fix_is_admin.sql`) valida `admin_profiles` via `auth_user_id = auth.uid()`.
- **Decisão**: A rota e todas as APIs administrativas utilizarão `requireAdminUser()` e `getAuthenticatedAdmin()`, além de aplicar chamadas com `createAdminClient()` (`lib/supabase/admin.ts`) para operações que exigem bypass seguro de RLS mantendo auditoria no banco.

### 2.2. Esquema de Banco de Dados Existente
Foram inspecionadas as migrations em `supabase/migrations/`:
1. `payment_transactions` (`20260912110000_mercadopago_transactions_and_audit.sql`):
   - Chave primária: `id UUID`.
   - Vínculos: `consultation_id REFERENCES customer_plate_consultations(id)`, `user_id REFERENCES auth.users(id)`.
   - Campos Mercado Pago: `mp_payment_id TEXT UNIQUE`, `mp_preference_id TEXT`, `status TEXT`, `status_detail TEXT`, `transaction_amount NUMERIC(10,2)`, `refund_status TEXT`, `mp_refund_id TEXT`, `refunded_at TIMESTAMPTZ`.
   - Já possui RLS para administradores.
2. `payment_refunds` (`20260913200000_create_payment_refunds.sql`):
   - Tabela dedicada e imutável para rastreamento de estornos Mercado Pago.
   - Campos: `id`, `transaction_id`, `consultation_id`, `provider` ('mercadopago'), `provider_payment_id`, `provider_refund_id`, `amount_cents`, `currency`, `status` (`requested`, `pending`, `confirmed`, `failed`, `manual_review`), `reason_code`, `reason_safe`, `idempotency_key`, `request_attempts`, `last_error_code`, `last_error_safe`.
   - Índice único: `idx_unique_active_refund_per_transaction` (`status IN ('requested', 'pending', 'confirmed')`), garantindo no banco a impossibilidade de estornos múltiplos ativos.
3. `consultation_delivery_jobs` (`20260913190000_create_consultation_delivery_jobs.sql`):
   - Fila de tentativas de emissão do laudo veicular via API Brasil.
   - Campos: `status` (`pending`, `processing`, `completed`, `retry_scheduled`, `failed_permanent`), `attempt_count`, `next_retry_at`, `locked_at`, `locked_by`, `lock_expires_at`, `last_error_code`, `last_http_status`, `last_failure_class`.
   - Código específico para saldo: `last_error_code = 'APIBRASIL_INSUFFICIENT_CREDITS'`.
4. `customer_plate_consultations` (`20260911000000_create_customer_area.sql`):
   - Vinculada ao usuário (`user_id REFERENCES customer_profiles(id)`).
   - Campos: `plate`, `plate_normalized`, `vehicle_data JSONB`, `status` (`pending`, `paid`, `processing`, `completed`, `failed`), `payment_status` (`unpaid`, `paid`, `refunded`), `latest_payment_transaction_id`.
5. `consultation_audit_logs` (`20260912110000_mercadopago_transactions_and_audit.sql`):
   - Campos: `consultation_id`, `transaction_id`, `actor_id`, `actor_type` (`customer`, `system`, `admin`, `webhook`), `event`, `details JSONB`, `created_at`.
   - Permite registrar `actor_type = 'admin'` com ID do administrador responsável.

### 2.3. Serviços de Pagamento e Estorno
- **Arquivo**: `lib/mercadopago/refund-service.ts`
  - Já implementa `evaluateRefundEligibility` com checagens estritas:
    - Pagamento deve ser `approved`.
    - `mp_payment_id` deve estar presente.
    - Valor deve ser positivo.
    - Laudo veicular não pode estar concluído com dados válidos (`consultation.status === 'completed' && vehicle_data`).
    - Não pode existir refund em `requested`, `pending` ou `confirmed`.
    - Detecta `APIBRASIL_INSUFFICIENT_CREDITS` e gera alerta `support_action_required = 'RECHARGE_APIBRASIL'`.
  - Já implementa `buildRefundIdempotencyKey(transactionId, mpPaymentId)`.
  - Já implementa `serializeMercadoPagoError` sanitizando credenciais e tokens.
  - Já implementa `initiateRefundForFailedDelivery` e `reconcileSingleRefund`.
- **Arquivo**: `lib/mercadopago/reconciliation-service.ts`:
  - Reconciliação autoritativa consultando a API do Mercado Pago por `mp_payment_id` ou busca por `external_reference`.
- **Arquivo**: `lib/vehicle-delivery/delivery-service.ts` e `lib/vehicle-delivery/reprocess-service.ts`:
  - Contém a máquina de estados de entrega e identificação de dados live vs cache vs mock bloqueado.

---

## 3. Análise da Falha Operacional: Saldo Insuficiente na API Brasil

### 3.1. Causa Raiz
Quando a conta corporativa da API Brasil fica sem créditos pré-pagos:
1. O endpoint de consulta veicular retorna HTTP `402 Payment Required`.
2. O normalizador de erro classifica como:
   - `failureClass`: `permanent`
   - `failureCode`: `APIBRASIL_INSUFFICIENT_CREDITS`
   - `httpStatus`: `402`
3. A rotina de entrega marca o job como `failed_permanent`.
4. A consulta não pode ser entregue até que o operador recarregue os créditos na plataforma da API Brasil.

### 3.2. Tratamento no Painel Administrativo
- O painel identificará automaticamente registros com:
  - `consultation_delivery_jobs.last_error_code = 'APIBRASIL_INSUFFICIENT_CREDITS'`, ou
  - `payment_transactions.status = 'approved'` AND `customer_plate_consultations.status IN ('failed', 'pending', 'processing')` com evento de auditoria de saldo insuficiente.
- Exibição de card de destaque vermelho/âmbar no topo: "Saldo API Brasil Insuficiente".
- Bloqueio de reprocessamento até que o administrador confirme formalmente que o saldo foi restabelecido.
- Opção de estorno imediato com motivo pré-selecionado: `APIBRASIL_INSUFFICIENT_CREDITS`.

---

## 4. Decisões Arquiteturais e de Banco de Dados

### 4.1. Estratégia de Consulta (View vs Query com Joins)
- **Decisão**: Criar uma View SQL administrativa segura (`admin_payment_consultations_view`) acompanhada de índices otimizados para filtros comuns.
- **Justificativa**:
  1. A central precisa combinar dados de 5 tabelas (`payment_transactions`, `customer_plate_consultations`, `customer_profiles`, `payment_refunds`, `consultation_delivery_jobs`).
  2. Fazer joins manuais repetidos em rotas de paginação e contagem gera overhead e duplicação de lógica.
  3. A View encapsula o cálculo do status consolidado, elegibilidade prévia de estorno e detecção de saldo insuficiente em nível de banco de dados.
  4. Índices nas colunas de filtro (`created_at`, `status`, `mp_payment_id`, `plate_normalized`) garantem tempo de resposta < 50ms mesmo com milhares de registros.
  5. A View respeitará a política RLS permitindo leitura apenas se `public.is_admin()` for verdadeiro ou via client com service_role no backend.

### 4.2. Padrão de Rotas e Endpoints
- **Página Principal**: `app/admin/(protected)/pagamentos-consultas/page.tsx`
  - Reutiliza o layout protegido existente (`app/admin/(protected)/layout.tsx`), aproveitando o menu lateral e a proteção nativa de autenticação.
- **Item de Navegação**: Adicionar item "Pagamentos & Estornos" em `components/admin/admin-sidebar.tsx` com ícone `CircleDollarSign` ou `CreditCard`.
- **Endpoints de Ação**:
  - `GET /api/admin/payments`: Listagem paginada, busca e indicadores para os cards.
  - `GET /api/admin/payments/[transactionId]`: Detalhes completos, blocos operacionais e timeline de auditoria.
  - `POST /api/admin/payments/[transactionId]/refund`: Acionamento do estorno com validação Zod e trava atômica.
  - `POST /api/admin/payments/[transactionId]/refund/reconcile`: Reconciliação autoritativa do estorno junto ao Mercado Pago.
  - `POST /api/admin/payments/[transactionId]/reprocess`: Reprocessamento da entrega do laudo veicular.

---

## 5. Matriz de Segurança e Logs

### 5.1. Regras Inegociáveis
- Validação server-side de `requireAdminUser()` em todas as mutações e leituras.
- Bloqueio definitivo de estorno se o laudo live já tiver sido entregue.
- Proibição absoluta de utilizar `preference_id` ou referências externas no estorno do Mercado Pago — uso estrito de `mp_payment_id`.
- Chave de idempotência determinística em todas as chamadas externas.
- Registro obrigatório no log estruturado `[ADMIN_PAYMENTS]` com identificadores mascarados (`maskId`).
- Proibição de exposição de tokens (`MERCADO_PAGO_ACCESS_TOKEN`, `APIBRASIL_TOKEN`), dados de cartão ou CPFs em logs e respostas HTTP.
