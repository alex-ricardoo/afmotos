# Research & Architecture Decisions: Registro, Controle e Relatórios de Comissões por Proposta

**Feature**: `022-registro-comissoes-propostas`  
**Date**: 2026-08-31  
**Author**: AF Motos Architecture & Fullstack Team

---

## 1. Auditoria do Código e Schema Atual

### 1.1 Entidade de Propostas no Banco
- **Tabela Central**: `public.leads` funciona como hub central de propostas comerciais (origens: `WEBSITE`, `MANUAL`, `WHATSAPP`). Possui os tipos `MOTORCYCLE_INTEREST`, `SELL_MOTORCYCLE`, `CONSIGNMENT`, `RENTAL`, `MOTORCYCLE_REQUEST`, `GENERAL_CONTACT`.
- **Tabela de Detalhes de Anúncios e Venda Direta**: `public.sell_requests` (com `request_kind` = `'ANNOUNCEMENT'` | `'DIRECT_SALE'`), referenciando `lead_id` e `customer_id`.
- **Tabela de Aluguéis**: `public.rental_requests`, referenciando `customer_id` e `motorcycle_id`.
- **Status Atuais**:
  - `leads.status`: `('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST', 'CLOSED')`.
  - `sell_requests.status`: `('NEW', 'UNDER_REVIEW', 'CONTACTED', 'PROPOSAL_SENT', 'NEGOTIATING', 'APPROVED', 'REJECTED', 'PURCHASED', 'CLOSED')`.
  - `proposal-view-model.ts`: Centraliza o mapeamento `normalizeStatus(status)` convertendo variações textuais para o enum padrão (`NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `LOST`, `CLOSED`).

### 1.2 Contratos e Acordos de Comissão Existentes
- **Tabela**: `public.sale_agreements` com colunas `id`, `sell_request_id`, `sale_id`, `owner_cpf`, `commission_percentage`, `commission_value`, `expected_sale_value`, `pdf_url`, `status` (`'draft'`, `'generated'`, `'signed'`).
- **Geração de PDF**: `app/api/agreements/generate/route.ts` renderiza o PDF com `@react-pdf/renderer` e faz upload para o bucket `agreements`.
- **Limitação Identificada**: `sale_agreements` é um documento de contrato com foto e texto, mas não possui ciclo de vida de recebimento financeiro, baixa de caixa, status de cancelamento sincronizado nem log de auditoria estruturado.

### 1.3 Vendas e Estoque
- **Tabela**: `public.sales` com colunas `id`, `motorcycle_id`, `customer_id`, `sale_price`, `sale_date`, `payment_method`, `payment_status` (`'PAID'`, etc.), `amount_paid`, `receipt_number`.
- **Estoque**: `public.motorcycles` com `ownership_type` (`'OWNED'` | `'CONSIGNMENT'`).
- **Lacuna Identificada**: Na conclusão de uma venda consignada, nem sempre `sale_agreements.sale_id` era preenchido, gerando divergência na apuração de receita de comissão.

### 1.4 Módulo de Relatórios
- **Arquivos**: `lib/reports/types.ts`, `lib/reports/queries.ts`, `app/admin/(protected)/relatorios/page.tsx`.
- **Cálculo Atual**: `lib/reports/queries.ts` tenta mapear `agreementsRaw` para achar a comissão se `ownership_type === 'CONSIGNMENT'`, caso contrário soma 100% de `sale_price`. Se a comissão não estiver vinculada em `sale_agreements`, assume 0 de comissão para a loja em vez de buscar a entidade de comissão da proposta.

---

## 2. Decisões de Arquitetura (ADRs)

### ADR-001: Entidade Dedicada `public.proposal_commissions`

- **Decision**: Criar a tabela `public.proposal_commissions` como entidade financeira de primeira classe, vinculada ao `lead_id` (como `proposal_id`) e opcionalmente a `sell_request_id`, `sale_agreement_id`, `sale_id`, `motorcycle_id` e clientes (`owner_customer_id`, `buyer_customer_id`).
- **Rationale**: A comissão nasce no momento da negociação da proposta, é formalizada no acordo em PDF e é liquidada/confirmada na venda. Ter uma tabela financeira dedicada separa as regras de caixa e competência da camada de apresentação de leads.
- **Alternatives Considered**:
  1. *Adicionar campos soltos na tabela `leads` ou `sell_requests`*: Rejeitado por não suportar auditoria de alterações, múltiplos estados financeiros, vínculos cruzados com `sales` e histórico de estornos.
  2. *Reutilizar apenas a tabela `sale_agreements`*: Rejeitado porque nem toda comissão gera de imediato um contrato formal assinado em PDF e `sale_agreements` foi modelada para representar o arquivo/documento físico.
- **Consequences**: Garante integridade referencial, permite consultas otimizadas por índice e centraliza o cálculo de relatórios.

---

### ADR-002: Máquina de Estados e Regras de Elegibilidade para Relatórios

- **Decision**: Adicionar coluna `eligible_for_reports boolean NOT NULL DEFAULT false` e máquina de estados (`draft` -> `proposed` -> `confirmed` / `receivable` -> `received` / `cancelled` / `voided`).
- **Rationale**: Um número estimado no rascunho de uma proposta não pode impactar o balanço financeiro da loja. Apenas quando a proposta é convertida com sucesso (`CONVERTED` / `PURCHASED` / `APPROVED`) E a comissão atinge status `confirmed` ou `received`, o campo `eligible_for_reports` é ativado (`true`).
- **Alternatives Considered**:
  1. *Filtrar nos relatórios com base no status da proposta em tempo de execução via `JOIN`*: Rejeitado por ser computacionalmente caro e frágil caso o status da proposta seja alterado sem gatilho de consistência.
- **Consequences**: Relatórios executam agregações extremamente rápidas via `WHERE eligible_for_reports = true`, sem risco de inclusão de receitas indevidas.

---

### ADR-003: Diferenciação entre Regime de Competência e Regime de Caixa

- **Decision**: Modelar campos explícitos `confirmed_at` (competência) e `received_at` com `commission_received_value`, `received_payment_method` e `received_reference` (caixa).
- **Rationale**:
  - **Competência Gerencial**: Reconhece a receita no momento em que a venda é concretizada (`confirmed_at`), gerando direito creditório para a loja.
  - **Caixa Gerencial**: Reconhece a receita apenas no momento da efetiva entrada do dinheiro na conta (`received_at`).
- **Alternatives Considered**:
  1. *Tratar toda comissão confirmada como recebida de imediato*: Rejeitado por gerar distorções de fluxo de caixa quando o proprietário repassa a comissão dias após a entrega do veículo.
- **Consequences**: A Central de Relatórios passa a exibir ambas as métricas com clareza, municiando tanto o gestor operacional quanto o contador.

---

### ADR-004: Segregação Contra Dupla Contagem Contábil

- **Decision**: Em vendas de motocicletas consignadas (`ownership_type === 'CONSIGNMENT'`), o valor total do veículo é somado ao "Volume Bruto Transacionado de Terceiros" e **somente** o valor da comissão é computado na "Receita Efetiva da AF Motos". Para veículos próprios (`OWNED`), 100% do valor da venda entra na receita da loja.
- **Rationale**: Evita a falsa impressão de que a loja faturou R$ 50.000,00 quando, na verdade, faturou uma comissão de R$ 3.000,00 e repassou R$ 47.000,00 ao dono da moto.
- **Alternatives Considered**:
  1. *Somar tudo no faturamento bruto e criar uma "despesa de repasse"*: Rejeitado por distorcer o regime tributário da empresa (que tributa apenas a prestação de serviços de intermediação / comissão).
- **Consequences**: Proteção contábil e conformidade fiscal perfeita com as orientações do contador.

---

### ADR-005: Auditoria Completa via `proposal_commission_audit_logs`

- **Decision**: Criar tabela de auditoria que captura snapshots em JSONB (`previous_snapshot`, `new_snapshot`), o usuário autenticado (`changed_by`), data (`changed_at`) e a justificativa obrigatória (`reason`).
- **Rationale**: Prevenir litígios e divergências financeiras entre sócios e administradores ao alterar valores negociados.
- **Alternatives Considered**:
  1. *Trigger genérica de auditoria*: Rejeitado por não capturar o campo "motivo da alteração" digitado pelo usuário na interface.
- **Consequences**: Total transparência com histórico auditável exibido diretamente no drawer da proposta.

---

## 3. Pontos para Validação com Contador e Jurídico

1. **Retenção de Impostos**: Confirmar se a AF Motos emite NFS-e pelo valor líquido da comissão ou se há retenção na fonte em determinadas operações com pessoa jurídica.
2. **Prazo Médio de Repasse**: Estabelecer regra operacional para alertar no dashboard quando uma comissão confirmada ultrapassar 7 dias sem baixa de recebimento.
3. **Aditivos Contratuais**: Confirmar se a renegociação de comissão após a emissão de contrato assinado exige obrigatoriamente a geração de um novo PDF de aditivo.
