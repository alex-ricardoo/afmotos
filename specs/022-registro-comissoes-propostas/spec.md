# Feature Specification: Registro, Controle e Relatórios de Comissões por Proposta

**Feature Directory**: `specs/022-registro-comissoes-propostas`  
**Created**: 2026-08-31  
**Status**: Draft  
**Input**: Registro, edição, controle e relatórios de comissões geradas nas propostas da AF Motos, com segregação contábil entre receita própria e intermediação de terceiros, controle de elegibilidade e trilha de auditoria.

---

## 1. Contexto e Problema de Negócio

A **AF Motos** recebe propostas comerciais relativas a motocicletas de terceiros (anúncios, consignações, intermediações e repasses), além da venda de seu estoque próprio.

Quando uma moto de terceiro é intermediada e vendida pela AF Motos, a loja faz jus a uma **comissão pela operação**.

Atualmente, o valor ou percentual da comissão é preenchido de maneira pontual em formulários e impresso no contrato em PDF (`sale_agreements`), mas o gestor da loja carece de uma estrutura gerencial e financeira confiável para:

1. **Registrar a comissão estruturada no banco de dados** como entidade financeira autônoma.
2. **Editar os valores e percentuais da comissão** antes ou durante as negociações, preservando a trilha de auditoria (quem alterou, quando e a justificativa).
3. **Diferenciar com clareza a comissão prevista** (estimada no anúncio/proposta), a **comissão confirmada** (devida pela conclusão da venda) e a **comissão efetivamente recebida** (baixada no caixa).
4. **Impedir que propostas canceladas ou perdidas gerem receita fantasma** no relatório anual ou no fechamento gerencial do contador.
5. **Garantir que apenas operações efetivamente concluídas e com venda confirmada** sejam elegíveis para a contabilização de receita.
6. **Acompanhar o ciclo de vida completo**: pendente, confirmada, a receber, recebida, cancelada ou estornada.
7. **Evitar qualquer confusão financeira** entre:
   - **Valor bruto da venda** da moto de terceiro (volume transacionado);
   - **Valor líquido a repassar** ao proprietário;
   - **Receita líquida de comissão da AF Motos** (ganho real da loja);
   - **Receita de venda de estoque próprio** (100% faturamento da loja).

---

## 2. Objetivos e Não Objetivos

### Objetivos Principais
- Criar a entidade financeira `proposal_commissions` com relacionamento às propostas (`leads` / `sell_requests`), acordos (`sale_agreements`), vendas (`sales`), motocicletas e clientes CRM (`customers`).
- Implementar máquina de estados auditável com regras rígidas de transição e bloqueio de edições pós-recebimento sem justificativa formal.
- Estabelecer regra central de elegibilidade para relatórios (`eligible_for_reports`), garantindo que comissões em rascunho ou canceladas nunca componham receita.
- Oferecer na Central de Relatórios (`/admin/relatorios`) a visão segregada por **Regime de Competência Gerencial** (comissões confirmadas por vendas concluídas) e **Regime de Caixa Gerencial** (comissões baixadas e recebidas).
- Criar histórico completo de alterações (`proposal_commission_audit_logs`) com snapshots de antes e depois.
- Integrar a interface administrativa de detalhe da proposta (`components/admin/proposal-detail-drawer.tsx`) com a gestão de comissão.

### Não Objetivos (Fora de Escopo do MVP)
- Integração direta com gateways de pagamento ou split bancário automático (PIX automático via API bancária).
- Emissão automatizada de Notas Fiscais de Serviço (NFS-e).
- Comissões de vendedores internos / equipe comercial da loja.
- Split de comissão de financiamento bancário (retorno de financeira) ou taxas de cartão.
- Assinatura eletrônica com certificado ICP-Brasil embutida na plataforma.

---

## 3. Histórias de Usuário & Cenários de Teste

### User Story 1 — Registro Estruturado de Comissão na Proposta (Prioridade: P1)
> **Como** gestor ou dono da AF Motos,  
> **Quero** registrar a comissão (percentual ou valor fixo) no momento em que analiso uma proposta de anúncio/consignação,  
> **Para** que a loja tenha controle exato do valor previsto a receber caso o veículo seja comercializado.

**Por que esta prioridade**: É a base do controle financeiro; sem o registro estruturado, a comissão continua dispersa apenas em textos ou PDFs.

**Teste Independente**: Criar uma comissão vinculada a uma proposta de anúncio no drawer de propostas e validar persistência com cálculo automático em BRL.

**Cenários de Aceite**:
1. **Given** uma proposta aberta no drawer administrativo,  
   **When** o administrador seleciona tipo "Percentual" (ex.: 5%) e valor de venda esperado de R$ 30.000,00,  
   **Then** o sistema calcula a comissão prevista em R$ 1.500,00 e o líquido do cliente em R$ 28.500,00, gravando o registro com status `draft` ou `proposed` e `eligible_for_reports = false`.
2. **Given** uma comissão configurada como "Valor Fixo",  
   **When** o administrador define comissão de R$ 2.000,00 para uma moto avaliada em R$ 25.000,00,  
   **Then** o sistema não altera o valor com base em variações de percentual e registra o valor fixo previsto.

---

### User Story 2 — Edição Controlada e Histórico de Auditoria (Prioridade: P1)
> **Como** dono da AF Motos,  
> **Quero** editar o valor ou percentual da comissão durante a negociação com o proprietário, exigindo motivo da alteração,  
> **Para** que o histórico original nunca seja perdido e qualquer mudança seja rastreável.

**Por que esta prioridade**: Negociações sofrem alterações frequentes de preço; a auditoria evita fraudes, equívocos e perda de controle.

**Teste Independente**: Editar uma comissão existente alterando de 5% para 4%, informando o motivo, e verificar a inserção no log de auditoria.

**Cenários de Aceite**:
1. **Given** uma comissão não recebida,  
   **When** o administrador altera o percentual de 5% para 4% com motivo "Acordo comercial para viabilizar venda",  
   **Then** o valor previsto é atualizado e um registro em `proposal_commission_audit_logs` é criado com snapshot anterior e novo.
2. **Given** uma comissão com status `received`,  
   **When** o administrador tenta editar o valor diretamente sem justificativa de estorno/ajuste,  
   **Then** o sistema bloqueia a alteração silenciosa e exige fluxo auditado de reajuste.

---

### User Story 3 — Elegibilidade e Segregação Contábil em Relatórios (Prioridade: P1)
> **Como** gestor da loja e contador,  
> **Quero** que somente propostas concluídas com venda confirmada entrem no relatório gerencial como comissão confirmada ou recebida,  
> **Para** que o faturamento da empresa reflita a realidade e não contenha receitas fictícias.

**Por que esta prioridade**: Relatórios com dados incorretos causam distorção no imposto, no pró-labore e na tomada de decisão gerencial.

**Teste Independente**: Rodar consulta de fechamento anual com propostas em status "NOVO", "PERDIDO" e "CONVERTIDO" e atestar que apenas a convertida foi computada.

**Cenários de Aceite**:
1. **Given** uma proposta em andamento (`status = QUALIFIED` ou `NEW`) com comissão prevista de R$ 2.000,00,  
   **When** o relatório do período é gerado,  
   **Then** o valor de R$ 2.000,00 NÃO é somado na receita da loja.
2. **Given** uma proposta convertida (`status = CONVERTED`) com venda confirmada e comissão de R$ 1.800,00 em status `confirmed`,  
   **When** o relatório em Regime de Competência é gerado,  
   **Then** R$ 1.800,00 entra na linha de "Receita de Comissões de Intermediação", e o valor total da moto entra apenas em "Volume Bruto Transacionado de Terceiros", sem somar duas vezes.

---

### User Story 4 — Cancelamento de Proposta e Remoção de Elegibilidade (Prioridade: P1)
> **Como** dono da AF Motos,  
> **Quero** que, ao marcar uma proposta como cancelada ou perdida, a comissão seja automaticamente desqualificada do relatório,  
> **Para** evitar que desistências ou devoluções poluam o fechamento anual.

**Por que esta prioridade**: Se o cliente desiste de vender a moto pela loja, a comissão nunca deve entrar no balanço.

**Teste Independente**: Alterar status de uma proposta para `LOST` ou `CLOSED` e verificar que a comissão vai para `cancelled` e `eligible_for_reports = false`.

**Cenários de Aceite**:
1. **Given** uma comissão com status `proposed` ou `confirmed` (não recebida),  
   **When** a proposta vinculada é alterada para `LOST` ou cancelada,  
   **Then** a comissão assume status `cancelled`, `eligible_for_reports` passa para `false`, e a data de cancelamento é preenchida.
2. **Given** uma comissão já marcada como `received`,  
   **When** a proposta é cancelada,  
   **Then** o sistema gera alerta de inconsistência contábil e exige confirmação de estorno financeiro em vez de cancelamento automático silencioso.

---

### User Story 5 — Registro de Recebimento e Baixa de Caixa (Prioridade: P2)
> **Como** administrador financeiro,  
> **Quero** registrar o recebimento da comissão com data, forma de pagamento e identificador de comprovante,  
> **Para** que o relatório em Regime de Caixa mostre com precisão o dinheiro que entrou na conta da empresa.

**Por que esta prioridade**: Permite conciliar o extrato bancário com os ganhos da loja.

**Teste Independente**: Dar baixa em uma comissão confirmada com método `PIX` e conferir a atualização no resumo de caixa da Central de Relatórios.

**Cenários de Aceite**:
1. **Given** uma comissão `confirmed`,  
   **When** o administrador clica em "Registrar Recebimento", informa data de recebimento, método (ex.: PIX) e número do documento,  
   **Then** o status muda para `received`, `commission_received_value` é preenchido e a comissão se torna elegível para o relatório de Regime de Caixa.

---

### User Story 6 — Vínculo Transacional entre Venda, Proposta e Moto (Prioridade: P2)
> **Como** administrador ao registrar uma venda no sistema,  
> **Quero** que a comissão da proposta seja associada ao registro oficial de venda (`sales`),  
> **Para** que a nota/recibo e o relatório de vendas identifiquem a operação de consignação sem retrabalho.

**Por que esta prioridade**: Unifica o ecossistema comercial e elimina a necessidade de redigitar dados da comissão ao concluir uma venda.

**Teste Independente**: Cadastrar uma venda para moto consignada originada de proposta e atestar preenchimento de `proposal_commissions.sale_id` e atualização de status.

**Cenários de Aceite**:
1. **Given** uma proposta de consignação com comissão de 6% e moto vendida no balcão por R$ 20.000,00,  
   **When** a venda é finalizada no módulo de vendas,  
   **Then** o sistema vincula `sale_id`, define `final_sale_value = 20000.00`, recalcula a comissão confirmada para R$ 1.200,00 e atualiza o status para `confirmed`.

---

### User Story 7 — Exportação Contábil Limpa e Segura (Prioridade: P3)
> **Como** contador da AF Motos,  
> **Quero** exportar a listagem de comissões confirmadas e recebidas do ano em CSV/XLSX, com dados de placa, proprietário e recibo, sem expor dados sensíveis desnecessários,  
> **Para** confeccionar a declaração anual de rendimentos com segurança jurídica.

**Por que esta prioridade**: Facilita o trabalho do escritório contábil e resguarda o sigilo de dados (LGPD).

**Teste Independente**: Gerar exportação de comissões do ano e verificar colunas, formatações e mascaramento de CPF.

**Cenários de Aceite**:
1. **Given** a tela de Relatório Anual / Contador,  
   **When** o usuário solicita o download das comissões do exercício,  
   **Then** o arquivo contém apenas dados pertinentes (Data, Moto, Placa, Proprietário, Valor Venda, Comissão, Status, Data Recebimento), com nota explicativa de suporte gerencial.

---

## 4. Máquina de Estados e Regras de Negócio

### Estados da Comissão (`proposal_commissions.status`)

| Status | Descrição | Elegível para Relatório? |
| :--- | :--- | :--- |
| `draft` | Rascunho interno em elaboração / simulação | **Não** (`eligible_for_reports = false`) |
| `proposed` | Proposta apresentada ao proprietário ou acordo em PDF gerado | **Não** (`eligible_for_reports = false`) |
| `confirmed` | Proposta concluída e venda do veículo efetivada | **Sim (Competência)** (`eligible_for_reports = true`) |
| `receivable` | Comissão confirmada pendente de recebimento financeiro | **Sim (Competência)** (`eligible_for_reports = true`) |
| `received` | Comissão recebida na conta da AF Motos com baixa | **Sim (Competência e Caixa)** (`eligible_for_reports = true`) |
| `cancelled` | Proposta cancelada, perdida ou venda desfeita | **Não** (`eligible_for_reports = false`) |
| `voided` | Registro anulado administrativamente com justificativa | **Não** (`eligible_for_reports = false`) |

### Matriz de Transições de Estados

```text
[draft] ────────────► [proposed] ────────────► [confirmed / receivable] ────────────► [received]
   │                      │                               │                                 │
   ▼                      ▼                               ▼                                 ▼
[cancelled]           [cancelled]                   [cancelled]*                     [voided/estorno]**
```

- `*`: Transição de `confirmed` para `cancelled` exige motivo obrigatório (ex.: desistência do comprador ou desfazimento da venda).
- `**`: Transição de `received` não pode ser deletada nem cancelada diretamente; requer ação explícita de anulação/estorno auditado.

### Regra de Sincronização com o Status da Proposta

O sistema adotará mapeamento centralizado de funções utilitárias:
- `isProposalSuccessful(status)`: Retorna `true` se `status` for `'CONVERTED'` (em `leads`), `'PURCHASED'` / `'APPROVED'` (em `sell_requests`) ou `'CONVERTED'` (no `ProposalViewModel`).
- `isProposalCancelled(status)`: Retorna `true` se `status` for `'LOST'`, `'CLOSED'` ou `'REJECTED'`.
- `isProposalReportEligible(proposalStatus, commissionStatus)`: Retorna `true` **somente se** a proposta for bem-sucedida E o status da comissão for `confirmed`, `receivable` ou `received`.

---

## 5. Requisitos Funcionais

- **FR-001**: O sistema MUST criar uma tabela dedicada `public.proposal_commissions` com chave primária UUID e relacionamentos íntegros com `leads`, `sell_requests`, `sale_agreements`, `sales`, `motorcycles` e `customers`.
- **FR-002**: O sistema MUST suportar comissões por percentual (`0 <= commission_percentage <= 100`) ou valor fixo (`commission_fixed_value >= 0`).
- **FR-003**: O sistema MUST manter campos separados para `expected_sale_value`, `final_sale_value`, `commission_expected_value`, `commission_confirmed_value` e `commission_received_value` usando tipo `numeric(12,2)`.
- **FR-004**: O sistema MUST atualizar `eligible_for_reports = true` e preencher `eligible_at = now()` unicamente quando a proposta for concluída com sucesso e a comissão for confirmada.
- **FR-005**: Ao marcar uma proposta como cancelada/perdida, o sistema MUST atualizar comissões não recebidas para `cancelled`, definir `eligible_for_reports = false` e preencher `cancelled_at`.
- **FR-006**: O sistema MUST registrar todas as inserções, edições de valores, transições de status e exclusões na tabela `public.proposal_commission_audit_logs`.
- **FR-007**: Toda edição manual de comissão já gerada MUST exigir o preenchimento de um motivo (`reason`) para constar na auditoria.
- **FR-008**: O sistema MUST exibir na Central de Relatórios (`/admin/relatorios`) as comissões segregadas em duas visões: Regime de Competência Gerencial (confirmadas) e Regime de Caixa Gerencial (recebidas).
- **FR-009**: O sistema NÃO PODE somar o valor bruto de vendas de terceiros como receita própria da AF Motos na apuração de resultado; apenas o valor da comissão deve compor a receita líquida da loja.
- **FR-010**: O sistema MUST prover operações idempotentes no backend contra disparos duplicados (duplo clique) em confirmações e baixas.
- **FR-011**: O sistema MUST restringir a visualização, edição, baixa e cancelamento de comissões exclusivamente a administradores autenticados via RLS (`public.is_admin()`).
- **FR-012**: O sistema MUST garantir compatibilidade com propostas e vendas legadas, tratando registros sem comissão como ausência de receita de intermediação sem quebrar relatórios.
- **FR-013**: No drawer administrativo da proposta (`proposal-detail-drawer.tsx`), o sistema MUST apresentar uma aba/seção dedicada com status em tempo real, badges informativas, histórico de alterações e botões de ação contextuais.
- **FR-014**: Na exportação de relatórios (CSV/XLSX), o sistema NÃO PODE expor CPFs completos ou dados bancários sensíveis sem autorização explícita.

---

## 6. Critérios de Sucesso e Métricas Mensuráveis

- **SC-001**: **100% de precisão contábil**: Nenhuma proposta cancelada ou em rascunho é contabilizada como receita nos relatórios anuais ou mensais.
- **SC-002**: **Zero dupla contagem**: Em vendas consignadas, 100% dos cálculos separam o volume transacionado de terceiros da receita de comissão da loja.
- **SC-003**: **Auditoria completa**: 100% das alterações manuais em comissões possuem autor, carimbo de data/hora e justificativa registrada no banco de dados.
- **SC-004**: **Eficiência na operação**: O administrador consegue registrar ou ajustar a comissão e emitir o contrato correspondente em menos de 1 minuto diretamente no drawer de propostas.
- **SC-005**: **Desempenho de consulta**: As queries da Central de Relatórios com agregação de comissões executam em menos de 500ms para períodos anuais.

---

## 7. Premissas e Dependências

1. A tabela `leads` atua como hub comercial central de todas as propostas da loja (incluindo as manuais e as convertidas de anúncios).
2. A tabela `sell_requests` armazena os dados complementares de anúncios e propostas de compra direta de motocicletas de terceiros.
3. A tabela `sale_agreements` continuará gerando contratos PDF, passando a referenciar a entidade financeira `proposal_commissions`.
4. Os relatórios gerenciais emitidos pelo sistema têm caráter informativo e gerencial de apoio, cabendo a validação tributária final ao contador responsável da AF Motos.
