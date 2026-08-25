# Research & Technical Decisions: Módulo Financeiro de Gastos

**Feature Branch**: `015-modulo-financeiro-gastos`

**Date**: 2026-08-24

## 1. Scope & Technical Overview

O Módulo Financeiro de Gastos da AF Motos visa prover gestão completa de despesas (gerais e atreladas a motocicletas especificas). A arquitetura prioriza facilidade de uso diário via smartphones e computadores, garantindo isolamento total de dados via Supabase RLS.

## 2. Technical Decisions & Rationale

### Decision 1: Database Schema & RLS Architecture
- **Decision**: Criar tabelas dedicadas `public.expense_categories` e `public.expenses` com Row Level Security (RLS) habilitado.
- **Rationale**:
  - Isolamento total entre receitas, vendas e despesas operacionais.
  - Vínculo opcional `motorcycle_id` com `ON DELETE SET NULL` para preservar o histórico financeiro caso um veículo seja removido.
  - Policiamento RLS garantindo que apenas usuários autenticados com perfil administrativo possam visualizar, inserir, atualizar ou excluir registros.
- **Alternatives Considered**:
  - *Inserir array de custos dentro da tabela `motorcycles`*: Rejeitado por impedir o registro de gastos gerais da loja (ex: luz, aluguel) e dificultar consultas agregadas por competência mensal.

### Decision 2: Precisão Numérica e Manipulação de Moeda
- **Decision**: Armazenar valores financeiros no banco como `NUMERIC(12, 2)` e utilizar a API nativa do navegador `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })` para exibição formatada.
- **Rationale**: Evita erros de arredondamento inerentes ao uso de `float` ou `double` binários. Validação server-side via Zod coercitivo exigindo valor estritamente maior que zero.
- **Alternatives Considered**:
  - *Armazenar valores como inteiro em centavos*: Rejeitado pois `NUMERIC(12,2)` é o padrão ISO SQL nativo do PostgreSQL Supabase, integrando-se perfeitamente às Server Actions sem conversores adicionais.

### Decision 3: Arquitetura de Interface Mobile-First & Desktop High-Density
- **Decision**: Utilizar estrutura em cards para dispositivos móveis (`< 768px`) e tabela estruturada para desktop (`>= 768px`). Modais de criação/edição em `Dialog` no desktop e `Drawer` no mobile.
- **Rationale**: Cumpre os Princípios II (Mobile First) e VIII (UX Consistente). Garante touch targets confortáveis em celulares e alta densidade de informação em telas grandes.
- **Alternatives Considered**:
  - *Tabela única com rolagem horizontal no mobile*: Rejeitado por prejudicar a experiência do usuário em telefones celulares.

### Decision 4: Lógica de Competência Mensal (`competence_month`)
- **Decision**: Adicionar coluna `competence_month DATE NOT NULL` (armazenada sempre no primeiro dia do mês correspondente, ex: `2026-08-01`).
- **Rationale**: Desacopla a data em que o gasto foi efetivamente pago (`paid_at` / `expense_date`) do mês contábil a que a despesa pertence (ex: aluguel de agosto pago em 05 de setembro pertence à competência de agosto).
- **Alternatives Considered**:
  - *Filtrar apenas por `created_at` ou `expense_date`*: Rejeitado por distorcer relatórios financeiros quando pagamentos ocorrem adiantados ou com atraso.

### Decision 5: Gestão de Recorrência Mensal sem Sobrecarga de Processos
- **Decision**: Marcar gastos recorrentes com `is_recurring = true`, `recurrence_type = 'MONTHLY'`, `recurrence_day` e fornecer funcionalidade de duplicação/geração assistida com trava de segurança para não duplicar o mesmo lançamento no mesmo mês de competência.
- **Rationale**: Mantém o sistema simples (Princípio XII - Evolução Incremental) sem requerer cron jobs ou edge functions complexas na primeira versão, permitindo controle total ao proprietário da loja.
- **Alternatives Considered**:
  - *Geração automática via Supabase Cron / Edge Function*: Adiado para fase futura para evitar complexidade e custos de infraestrutura desnecessários no MVP.
