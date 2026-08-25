# Feature Specification: Módulo Financeiro de Gastos

**Feature Branch**: `015-modulo-financeiro-gastos`

**Created**: 2026-08-24

**Status**: Draft

**Input**: User description: "Módulo financeiro de gastos da AF Motos - Criar uma nova tela no painel administrativo para cadastrar, consultar, editar, excluir e analisar os gastos da loja (/admin/gastos)."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Lançamento e Controle de Gastos por Competência Mensal (Priority: P1)

Como proprietário/administrador da loja, quero cadastrar e consultar despesas da loja (divididas entre gastos diretos de uma moto e gastos gerais do estabelecimento) filtrando por mês de competência, para que eu possa acompanhar exatamente quanto a loja está gastando e quanto foi pago ou está pendente.

**Why this priority**: É o valor central do módulo financeiro. Sem o cadastro e controle mensal de despesas pagas/pendentes por tipo (Moto vs Loja), a loja não possui visibilidade dos seus custos operacionais.

**Independent Test**: Pode ser testado de forma independente acessando `/admin/gastos`, cadastrando um gasto vinculado a uma moto (ex: Troca de óleo de R$ 180,00) e um gasto geral da loja (ex: Aluguel de R$ 2.500,00), e verificando se os totais do mês corrente e os status (Pago/Pendente) são calculados corretamente.

**Acceptance Scenarios**:

1. **Given** que o administrador está na tela `/admin/gastos`, **When** ele clica em "Adicionar gasto", preenche o formulário selecionando o tipo "Gasto de moto", escolhe uma motocicleta específica, a categoria "Óleo e filtros", o valor R$ 180,00, a data e o status "Pago", e confirma, **Then** o gasto é registrado, associado à moto escolhida e o total de gastos com motos do mês é atualizado imediatamente.
2. **Given** que o administrador está na tela `/admin/gastos`, **When** ele clica em "Adicionar gasto", escolhe o tipo "Gasto da loja", a categoria "Aluguel da loja", o valor R$ 2.500,00, o status "Pendente" e salva, **Then** a seleção de moto fica desabilitada/oculta, o registro é salvo com sucesso e o indicador "Pendente" do mês reflete o acréscimo de R$ 2.500,00.
3. **Given** que existem gastos cadastrados em meses diferentes, **When** o usuário altera o filtro de mês (ex: de Agosto/2026 para Julho/2026), **Then** os indicadores do dashboard e a listagem de gastos recarregam para exibir exclusivamente os dados da competência selecionada.

---

### User Story 2 - Gestão Visual, Filtros Avançados e Recorrência (Priority: P2)

Como administrador da loja, quero filtrar despesas por palavra-chave, categoria, tipo, status, forma de pagamento e moto vinculada, além de configurar gastos recorrentes mensais, para gerenciar com facilidade os compromissos recorrentes da loja.

**Why this priority**: Permite organização rápida dos dados conforme o volume de lançamentos cresce e reduz trabalho manual repetitivo com custos fixos mensais (ex: conta de luz, internet, aluguel).

**Independent Test**: Pode ser testado cadastrando múltiplos lançamentos com diferentes categorias/status e verificando se a busca por palavra-chave e os filtros por drawer (no mobile) ou barra de filtros (no desktop) exibem exatamente os registros correspondentes.

**Acceptance Scenarios**:

1. **Given** uma lista com 20 despesas variadas, **When** o usuário digita "Honda" na busca ou seleciona o filtro de categoria "Manutenção", **Then** a lista exibe apenas os registros correspondentes ao critério pesquisado.
2. **Given** o formulário de cadastro de gasto, **When** o usuário marca a opção "Gasto recorrente mensal" e informa o dia de vencimento (ex: dia 10), **Then** o gasto é sinalizado como recorrente e fica estruturado para controle de competência mensal sem duplicar valores erroneamente.
3. **Given** um gasto com status "Pendente", **When** o usuário clica na ação "Marcar como pago", **Then** o status muda para "Pago", a data de pagamento é registrada e o saldo pendente do dashboard é deduzido, somando ao total pago.

---

### User Story 3 - Análise de Gastos e Custo Acumulado da Moto (Priority: P3)

Como gestor da loja, quero visualizar gráficos de distribuição por categoria, comparação mensal e o custo total acumulado por motocicleta no painel admin, para tomar decisões estratégicas de precificação e rentabilidade.

**Why this priority**: Oferece inteligência financeira e visão de margem real por veículo, agregando valor às decisões de negócio.

**Independent Test**: Pode ser testado cadastrando 3 despesas em uma mesma moto e verificando se a soma exata dos valores (não cancelados) aparece no detalhe/resumo de custos da moto e no ranking de custos por moto.

**Acceptance Scenarios**:

1. **Given** o painel de gastos no desktop, **When** o usuário visualiza a seção de indicadores e gráficos, **Then** são exibidos gráficos de pizza/donut para distribuição por categoria, evolução mensal e ranking de motos com maior custo.
2. **Given** uma moto cadastrada com 3 lançamentos de manutenção que somam R$ 1.200,00 (e 1 lançamento cancelado de R$ 300,00), **When** o administrador visualiza o resumo de custos da moto no admin, **Then** o valor acumulado exibido é exatamente R$ 1.200,00.

---

### Edge Cases

- **O que acontece quando o usuário tenta cadastrar um gasto do tipo "MOTO" sem selecionar uma motocicleta?**
  O sistema impede o envio, destacando o campo de seleção de moto com mensagem de validação obrigatória.
- **Como o sistema reage se uma moto que possui gastos vinculados for excluída do sistema?**
  A chave estrangeira deve possuir tratamento seguro (`ON DELETE SET NULL`), garantindo que o histórico financeiro do gasto não seja apagado e continue contabilizado nos totais da loja.
- **O que ocorre com gastos marcados como "CANCELLED"?**
  Gastos cancelados são desconsiderados de todos os cálculos do dashboard (Total do Mês, Pago, Pendente, Custo por Moto), mas permanecem visíveis quando o filtro "Cancelados" estiver explicitamente ativo para fins de auditoria.
- **Como o sistema lida com valores negativos, zerados ou formatos de moeda inválidos?**
  A validação no cliente e servidor rejeita valores menores ou iguais a zero e garante arredondamento correto em centavos de Real (R$).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema DEVE fornecer uma rota administrativa exclusiva `/admin/gastos` integrada ao menu do painel admin.
- **FR-002**: O sistema DEVE permitir a classificação primária de cada gasto em dois tipos: `MOTO` (despesa associada a uma motocicleta específica) e `LOJA` (despesa geral operacional/administrativa da loja).
- **FR-003**: O sistema DEVE exigir a vinculação de uma moto existente quando o tipo for `MOTO` e DEVE proibir/limpar o vínculo de moto quando o tipo for `LOJA`.
- **FR-004**: O sistema DEVE armazenar os campos obrigatórios do gasto: título, tipo (`MOTO` | `LOJA`), categoria, valor em R$ (numérico positivo), data do gasto, mês de competência, status (`PAID` | `PENDING` | `CANCELLED`) e forma de pagamento.
- **FR-005**: O sistema DEVE suportar cadastro e gerenciamento de categorias em tabela própria (`expense_categories`), contendo nome, slug, tipo (`MOTO` ou `LOJA`), ordem de exibição e estado ativo.
- **FR-006**: O sistema DEVE disponibilizar status controlados com tradução visual: `PAID` (Pago), `PENDING` (Pendente) e `CANCELLED` (Cancelado), registrando automaticamente o carimbo de data/hora no pagamento (`paid_at`).
- **FR-007**: O sistema DEVE calcular os indicadores financeiros em tempo real com base no mês de competência selecionado (`competence_month`), apresentando: Total do Mês, Total Pago, Total Pendente, Gastos com Motos, Gastos da Loja e Quantidade de Lançamentos.
- **FR-008**: O sistema DEVE permitir a configuração de despesas recorrentes (único, mensal, anual) com indicação do dia de vencimento, sem gerar duplicidade de registros para o mesmo mês de competência.
- **FR-009**: O sistema DEVE apresentar a listagem de gastos adaptada para dispositivos móveis (cards responsivos) e computadores (tabela completa com colunas ordenáveis e ações rápidas).
- **FR-010**: O sistema DEVE fornecer filtros por mês/ano, busca textual (título, descrição, fornecedor, moto), tipo de gasto, categoria, status, forma de pagamento e filtro rápido para recorrentes.
- **FR-011**: O sistema DEVE calcular o custo total acumulado de cada moto (soma dos gastos com status diferente de `CANCELLED`) e exibir a informação no painel administrativo sem expor dados financeiros na área pública do site.
- **FR-012**: O sistema DEVE aplicar controle de acesso rígido (RLS no banco de dados e verificação de sessão admin no servidor), impedindo que usuários não autenticados ou clientes acessem ou modifiquem registros financeiros.

### Key Entities

- **Expense (Gasto)**: Representa uma despesa financeira lançada. Atributos: título, descrição, valor (numeric), data do gasto (date), mês de competência (date), tipo (`MOTO` ou `LOJA`), status (`PAID`, `PENDING`, `CANCELLED`), forma de pagamento, nota fiscal/fornecedor, observações, marcação de recorrência, ID da moto (opcional), ID da categoria, ID do criador e timestamps.
- **ExpenseCategory (Categoria de Gasto)**: Categoria classificatória pré-cadastrada. Atributos: nome, slug único, tipo (`MOTO` ou `LOJA`), ordem de exibição, sinalizador ativo/inativo e timestamps.
- **Motorcycle (Motocicleta)**: Entidade operacional já existente na loja, referenciada opcionalmente pelas despesas do tipo `MOTO`.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: O proprietário da loja consegue cadastrar qualquer despesa (geral ou de moto) em menos de 30 segundos, em dispositivos móveis ou desktop.
- **SC-002**: Os indicadores do dashboard de gastos (Total do Mês, Pago, Pendente, Distribuição) atualizam com dados reais do banco de dados em menos de 1 segundo após qualquer criação, edição ou alteração de status.
- **SC-003**: 100% dos dados e rotas financeiras permanecem inacessíveis para o público geral ou usuários não administrativos (zero vazamento de dados).
- **SC-004**: A interface mobile (320px a 430px) exibe formulários e listagens com 0px de transbordo horizontal (scroll horizontal indesejado), garantindo usabilidade total em smartphones.

## Assumptions

- O controle de permissões usará a estrutura de autenticação e perfis de administrador já implantados no projeto.
- A primeira versão controlará lançamentos manuais e gestão por competência mensal, preparando a base para relatórios avançados sem exigir integração bancária via API ou emissão automática de NF-e neste primeiro momento.
- A exclusão de lançamentos será tratada prioritariamente via alteração para o status `CANCELLED` ou confirmação explícita de exclusão física restrita a administradores.
