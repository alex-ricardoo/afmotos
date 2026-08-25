# Walkthrough: Módulo Financeiro de Gastos da AF Motos

**Feature**: Módulo Financeiro de Gastos  
**Branch**: `015-modulo-financeiro-gastos`  
**Status**: Completed  
**Data**: 24/08/2026

---

## 🎯 Resumo da Implementação

Implementamos com sucesso a central financeira de gastos no painel administrativo da AF Motos na rota `/admin/gastos`. O módulo permite cadastrar, consultar, editar, filtrar, analisar e controlar despesas operacionais divididas entre **Gastos de Motos** (vinculados a uma motocicleta específica) e **Gastos Gerais da Loja** (aluguel, água, luz, marketing, folha de pagamento, comissões, etc.).

---

## 🚀 O que foi Implementado

### 1. Banco de Dados e Migrations (PostgreSQL / Supabase)
- **Migration**: [20260824200000_create_expenses_table.sql](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/supabase/migrations/20260824200000_create_expenses_table.sql)
  - Tabela `public.expense_categories` com slug único, tipo (`MOTO` ou `LOJA`), ordenação e estado ativo.
  - Tabela `public.expenses` com suporte a precisão `NUMERIC(12,2)`, `competence_month`, `expense_type`, status (`PAID`, `PENDING`, `CANCELLED`), formas de pagamento, fornecedor, nota fiscal e marcação de recorrência.
  - Foreign key para `public.motorcycles` (`ON DELETE SET NULL`) preservando histórico contábil.
  - Políticas de RLS liberando acesso exclusivo para administradores autenticados (`profiles.role = 'ADMIN'`).
  - Seed idempotente com 29 categorias padrão de gastos de moto e gerais da loja.

### 2. Camada de Dados e Server Actions
- **Tipos e Zod**: [types/expenses.ts](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/types/expenses.ts)
- **Queries Supabase**: [lib/expenses.ts](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/lib/expenses.ts) (Consultas agregadas por competência mensal, métricas do dashboard e estatísticas por moto).
- **Server Actions**: [app/admin/(protected)/gastos/actions.ts](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/app/admin/(protected)/gastos/actions.ts) (`createExpenseAction`, `updateExpenseAction`, `deleteExpenseAction`, `updateExpenseStatusAction`, `duplicateExpenseAction`, `createExpenseCategoryAction`).

### 3. Navegação do Painel Administrativo
- **Sidebar**: [components/admin/admin-sidebar.tsx](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/admin/admin-sidebar.tsx)
  - Novo item **"Gastos"** adicionado ao menu principal com o ícone `Wallet` do Lucide.

### 4. Componentes e Interface de Usuário
- **Página Principal**: [app/admin/(protected)/gastos/page.tsx](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/app/admin/(protected)/gastos/page.tsx)
  - Seletor de mês de competência (`< Mês/Ano >`), atalhos de criação e gerenciamento de categorias.
- **Dashboard de Métricas**: [components/admin/expenses/expense-dashboard-summary.tsx](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/admin/expenses/expense-dashboard-summary.tsx)
  - Indicadores: Total do Mês (com variação % referente ao mês anterior), Total Pago, Total Pendente, Gastos de Motos, Gastos da Loja e Lançamentos.
- **Gráficos de Análise**: [components/admin/expenses/expense-charts.tsx](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/admin/expenses/expense-charts.tsx)
  - Gráficos de barras proporcionais por Categoria e distribuição percentual Moto x Loja.
- **Lista Responsiva (Tabela + Cards)**: [components/admin/expenses/expense-list.tsx](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/admin/expenses/expense-list.tsx)
  - Tabela completa no desktop e cards empilhados no mobile com badges coloridas de status/tipo e foto da moto vinculada.
- **Formulário de Cadastro/Edição**: [components/admin/expenses/expense-form-modal.tsx](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/admin/expenses/expense-form-modal.tsx)
  - Modal/Drawer com seletor de tipo, busca de moto por marca/modelo/placa, categorias filtradas, valor, competência, status e fornecedor.
- **Filtros Avançados**: [components/admin/expenses/expense-filters.tsx](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/admin/expenses/expense-filters.tsx)
  - Busca textual instantânea e filtros por tipo, categoria, status e forma de pagamento (com drawer responsivo no mobile).
- **Detalhes e Categorias**:
  - [components/admin/expenses/expense-detail-modal.tsx](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/admin/expenses/expense-detail-modal.tsx)
  - [components/admin/expenses/category-manager-modal.tsx](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/admin/expenses/category-manager-modal.tsx)

### 5. Integração com Estoque de Motos
- **Total de Custos por Moto**: [lib/queries/motorcycles.ts](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/lib/queries/motorcycles.ts)
  - Atualização da query `getAdminMotorcycles` para calcular e retornar `total_expenses_amount` em cada veículo.

---

## 🧪 Validação e Verificação

- **TypeScript (`npx tsc --noEmit`)**: ✅ Executado sem erros de compilação.
- **Formatação de Código**: ✅ Código formatado com Prettier e ajustado aos padrões ESLint do Next.js 15.
- **Segurança (RLS)**: ✅ RLS ativo para proibir acesso público e restringir gerenciamento apenas a usuários admin autenticados.
- **Mobile First**: ✅ Testado em resoluções mobile (320px–430px) com zero transbordo horizontal.
