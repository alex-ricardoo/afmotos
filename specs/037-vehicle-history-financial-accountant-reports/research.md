# Research: Relatório Financeiro e Operacional de Histórico Veicular para Gestão e Contador

**Feature Directory**: `specs/037-vehicle-history-financial-accountant-reports`  
**Date**: 2026-09-14  
**Auditor**: Antigravity AI Engine  

---

## 1. Mapeamento da Arquitetura e Código Atual

### 1.1 Onde o preço de venda da consulta é salvo e consultado
- **Tabela Singleton**: `public.site_settings` no Supabase PostgreSQL.
- **Estrutura de Armazenamento**: Armazenado sob a coluna JSONB `settings`, no caminho `settings.vehicleHistory.price` (numérico, ex.: `39.90` ou `49.90`).
- **Função Leitora Atual**: `getVehicleConsultationPrice()` em [`lib/settings/server-queries.ts`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/lib/settings/server-queries.ts).
  - Consulta `getPublicSiteSettings()` que sanitiza os dados via `resolvePublicSiteSettings()` em [`lib/site-settings.ts`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/lib/site-settings.ts).
  - Fallback atual documentado: `39.90`.
- **Criação de Preferência Mercado Pago**: Em [`lib/customer/payment-service.ts`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/lib/customer/payment-service.ts), função `createPlateConsultationPreference()`, o valor retornado por `getVehicleConsultationPrice()` é passado como `unit_price` para a API do Mercado Pago.

### 1.2 Onde o preço é editado no painel administrativo
- **Componente**: [`components/admin/settings/vehicle-history-tab.tsx`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/admin/settings/vehicle-history-tab.tsx).
- **Formulário Principal**: [`components/admin/settings-form.tsx`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/admin/settings-form.tsx).
- **Validação de Schema**: [`lib/settings/schema.ts`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/lib/settings/schema.ts) (`vehicleHistorySettingsSchema`).
- **Server Action de Atualização**: [`lib/actions/settings.ts`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/lib/actions/settings.ts) (`updateSettings`).
- **Diagnóstico da Situação Atual**: Atualmente, o formulário possui apenas o campo "Preço da Consulta (R$)" e "Texto de Apoio ao Preço". O custo cobrado pela API Brasil **não** existe nessa tela nem no schema de `site_settings`. Ele estava hardcoded no código!

### 1.3 Onde a chamada live à API Brasil é feita e onde o custo é conhecido
- **Mecanismo de Execução Direta**: [`lib/vehicle-lookup/service.ts`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/lib/vehicle-lookup/service.ts) (`executeVehiclePlateLookup`).
- **Mecanismo de Fila / Worker**: [`lib/vehicle-delivery/delivery-service.ts`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/lib/vehicle-delivery/delivery-service.ts) (`executeSingleDeliveryJob`).
- **Configuração Atual**: [`lib/vehicle-lookup/config.ts`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/lib/vehicle-lookup/config.ts):
  - `estimatedCostPerLookup: 30.0` estava hardcoded na linha 28.
  - Em `lib/vehicle-lookup/service.ts` (linhas 226 e 324), `chargedAmount` recebia `config.estimatedCostPerLookup`, e `taxCharged` possuía fallback `rawPayload.tax || 30.0`.
- **Comportamento da Resposta da API Brasil**:
  - Quando bem-sucedida, o payload contém `balance` (saldo restante) e opcionalmente `tax` (tarifa cobrada pelo endpoint).
  - Em caso de saldo insuficiente, retorna `error: true`, mensagem contendo "saldo" ou "recarregue" e `recharge_url`, disparando `InsufficientBalanceError`. **Nesse caso, a API Brasil não cobra nada** (custo = R$ 0,00).

### 1.4 Se `charged_amount` já representa custo real do provedor
- Na tabela `vehicle_plate_consultations`, `charged_amount` existe como coluna `numeric(12,2)` com default `0.00`.
- Em execuções passadas, se executado em mock, `charged_amount = 0.00`. Se executado em live, gravava `30.00`.
- **Limitações do modelo anterior**:
  1. `customer_plate_consultations` (a tabela de consultas do cliente e da área logada) não guardava snapshot de custo nem de preço de venda! Guardava apenas `source_consultation_id`.
  2. Em entregas por Cache Hit, o cliente final pagou (ou consumiu crédito), mas para a AF Motos o custo na API Brasil naquela consulta foi R$ 0,00. O sistema anterior não distinguia explicitamente na camada analítica que aquela consulta de cliente teve custo adicional de provedor R$ 0,00.
  3. Não existia versionamento histórico de tabela de preço/custo. Se o preço da API Brasil mudasse de R$ 30,00 para R$ 35,00, a leitura retroativa ficaria inconsistente.
- **Decisão Arquitetural**:
  - Implementar a tabela de versionamento `vehicle_history_pricing_versions` para gerenciar a vigência de preço de venda e custo unitário API Brasil.
  - Implementar a tabela de custos de provedor aditiva `vehicle_lookup_provider_costs` vinculada a cada chamada live e job de entrega, garantindo idempotência e snapshot imutável.
  - Estender `customer_plate_consultations` com colunas de snapshot: `pricing_version_id`, `public_price_snapshot_cents`, `provider_cost_snapshot_cents`, `provider_cost_status`.

### 1.5 Confiabilidade das flags `mode`, `is_mock`, `is_chargeable` e status de provedor
- Na tabela `vehicle_plate_consultations`:
  - `mode`: `'mock' | 'live'` (estritamente checado via enum/check constraint).
  - `is_mock`: booleano (`true` para fixtures de teste, `false` para chamadas reais à API Brasil).
  - `is_chargeable`: booleano (`true` apenas para consultas oficiais que consumiram crédito).
  - `status`: `'PENDING_CONFIRMATION' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CHARGE_STATUS_UNKNOWN'`.
- Essas colunas são extremamente confiáveis para isolar o que foi mock/teste do que foi operação real.

### 1.6 Como Cache Hit é identificado
- Em `delivery-service.ts` (linhas 297 a 378):
  - O worker verifica `findExistingConsultation(plateToLookup)`.
  - Se um laudo prévio concluído e elegível existir, `cacheHit = true`.
  - O laudo existente é vinculado em `customer_plate_consultations.source_consultation_id = cached.id`.
  - Não é feita nenhuma requisição HTTP para a API Brasil.
  - Custo incremental da consulta entregue via cache: **R$ 0,00**.

### 1.7 Como Consultas por Crédito B2B são identificadas
- Estabelecido na Spec 036 (`20260914120000_create_secure_b2b_credit_packages.sql`):
  - `customer_plate_consultations.payment_coverage_type`: `'mercadopago' | 'platform_credit' | 'free' | 'legacy_unknown'`.
  - `customer_plate_consultations.credit_package_id`: UUID de `customer_credit_packages`.
  - `customer_plate_consultations.credit_reservation_id`: UUID de `customer_credit_reservations`.
  - `customer_plate_consultations.credit_status`: `'none' | 'reserved' | 'consumed' | 'released'`.
  - Consultas com `payment_coverage_type = 'platform_credit'` **NÃO** possuem transação no Mercado Pago (`transaction_id IS NULL`), impedindo contaminação de receitas de gateway.

### 1.8 Como Estornos (Refunds) são identificados
- Estabelecido na Spec 030/033 (`20260913200000_create_payment_refunds.sql`):
  - Tabela `payment_refunds` com status `'requested' | 'pending' | 'confirmed' | 'failed' | 'manual_review'`.
  - Apenas `status = 'confirmed'` reduz a receita líquida.
  - Estornos com status `requested` ou `pending` entram como pendências operacionais em aberto.

### 1.9 Relatórios e Painéis Administrativos Existentes
- **Central de Relatórios Geral**:
  - Rota: `/admin/relatorios` ([`app/admin/(protected)/relatorios/page.tsx`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/app/admin/%28protected%29/relatorios/page.tsx)).
  - Componente: [`components/admin/reports/reports-dashboard.tsx`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/admin/reports/reports-dashboard.tsx).
  - Abas atuais: `overview`, `sales`, `financial`, `inventory`, `customers`, `accountant`.
  - Padrão arquitetural: Adicionar a aba `historico-veicular` na Central de Relatórios (`/admin/relatorios?tab=historico-veicular`), aproveitando o filtro de período e o cabeçalho existente.
- **Painel de Pagamentos de Consultas**:
  - Rota: `/admin/pagamentos-consultas` (Spec 033), focada em conciliação transacional e reprocessamento/estorno manual.
- **Painel de Créditos B2B**:
  - Rota: `/admin/creditos-consultas` (Spec 036), focada em gestão de saldo e concessão de pacotes.

### 1.10 Timezone de Negócio
- A aplicação utiliza `America/Sao_Paulo` (Horário de Brasília, UTC-3), conforme padronizado em [`lib/reports/formatters.ts`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/lib/reports/formatters.ts) linha 48.
- Todos os filtros de início/fim de dia e agrupamentos mensais devem respeitar o timezone de Brasília (`America/Sao_Paulo`), garantindo consistência com os demais relatórios contábeis e fiscais da AF Motos.

### 1.11 Validação de Administrador
- Função Canônica: `requireActiveAdmin()` e `checkAdminProfileAccess()` em [`lib/admin/admin-auth.ts`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/lib/admin/admin-auth.ts).
- Critério estrito:
  ```sql
  admin_profiles.auth_user_id = auth.uid()
  AND admin_profiles.is_active = true
  AND admin_profiles.role IN ('admin', 'super_admin')
  ```
- **AVISO CRÍTICO**: Nunca comparar `admin_profiles.id = auth.uid()`, pois `admin_profiles.id` é uma PK UUID independente da linha de cadastro, enquanto `auth_user_id` é o ID do usuário no Supabase Auth.

---

## 2. Decisões Arquiteturais e Diretrizes Técnicas

| Decisão | Opção Escolhida | Justificativa |
| :--- | :--- | :--- |
| **Armazenamento de Valores Monetários** | Inteiros em Centavos (`integer`) com helpers de conversão | Elimina erros de arredondamento de ponto flutuante em JavaScript e garante compatibilidade com os padrões de `payment_refunds` e `customer_credit_packages`. |
| **Versionamento de Preço & Custo** | Tabela dedicada `vehicle_history_pricing_versions` | Permite controle estrito de vigência (`effective_from`, `effective_to`), restrição de unicidade da versão ativa, rastreabilidade de quem alterou e por quê, e impede sobrescrita do passado. |
| **Custo de Provedor Efetivo** | Tabela aditiva `vehicle_lookup_provider_costs` + snapshot em `customer_plate_consultations` | Separa a intenção de consulta do fato econômico de consumo de saldo na API Brasil. Suporta idempotência para retries e audita com clareza casos de saldo insuficiente e cache hits. |
| **Localização do Módulo no Admin** | Aba integrada `/admin/relatorios?tab=historico-veicular` | Evita fragmentação da experiência do administrador, reaproveita o seletor de período e dialog de exportação global, mantendo harmonia com a Central de Relatórios. |
| **Informe Anual para o Contador** | Sub-aba e rota especializada `/admin/relatorios/historico-veicular/anual` (e aba dentro de `historico-veicular`) com exportação CSV dedicada | Atende diretamente ao requisito de fechamento anual com a contabilidade, com disclaimer indelével de que é relatório gerencial de apoio e não apuração fiscal. |
| **Exclusão de Dados de Teste** | Exclusão automática de `is_mock = true` no relatório contábil | Evita contaminação de números e discrepâncias com o extrato bancário oficial e painel da API Brasil. |
