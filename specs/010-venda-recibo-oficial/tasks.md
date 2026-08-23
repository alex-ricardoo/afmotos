# Tasks: Refatoração de Venda de Veículos, Dados Fiscais/Cadastrais e Recibo Oficial A4

**Feature**: `010-venda-recibo-oficial` | **Branch**: `010-venda-recibo-oficial` | **Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Estruturar os tipos TypeScript e os utilitários de formatação/máscaras necessários para os novos campos cadastrais e fiscais.

- [X] T001 [P] Atualizar as definições de tipos TypeScript para `Sale`, `Motorcycle` e `SiteSettings` em `types/database.ts`
- [X] T002 [P] Implementar utilitários de máscara pura para CPF/CNPJ, Telefone/WhatsApp, CEP, Renavam e Chassi em `lib/utils/formatters.ts`
- [X] T003 Atualizar o schema de validação Zod para incluir campos fiscais, cadastrais e de quitação em `lib/validations/sale.ts`

---

## Phase 2: Foundational (Database & Data Persistence)

**Purpose**: Criar a migration SQL idempotente no Supabase e atualizar a camada de mutação de dados para persistência segura de todas as novas colunas.

**⚠️ CRITICAL**: A base de dados e a Server Action devem suportar os novos campos antes da integração completa na interface.

- [X] T004 Criar migration SQL idempotente para adicionar colunas fiscais (`chassi`, `renavam`, `delivery_km`, `entry_amount`, `financed_amount`, `trade_amount`, `legal_terms_accepted`, endereço granular) nas tabelas `sales` e `motorcycles` em `supabase/migrations/20260823010000_enhance_sales_official_receipt.sql`
- [X] T005 [P] Atualizar a Server Action `createSaleAction` e `updateSaleAction` com suporte a todos os novos campos fiscais e cadastrais em `lib/actions/sales.ts`
- [X] T006 [P] Atualizar as queries de busca e recuperação detalhada de vendas (`getSaleById`, `getSalesList`) em `lib/queries/sales.ts`

**Checkpoint**: Camada de banco de dados, tipos e Server Actions testadas e prontas para consumo pela UI.

---

## Phase 3: User Story 1 - Formulário Completo de Fechamento de Venda no Admin (Priority: P1) 🎯 MVP

**Goal**: Permitir que o administrador registre vendas com validação em tempo real, máscaras dinâmicas, preenchimento de endereço e discriminação financeira completa.

**Independent Test**: Abrir `/admin/vendas/nova` ou acionar a venda de uma moto no catálogo admin, preencher todos os campos com as máscaras ativas (Renavam, Chassi com auto-uppercase, CPF/CNPJ, CEP, Entrada, Financiamento, Troca e Termos) e salvar a venda com sucesso.

### Implementation for User Story 1

- [X] T007 [US1] Adicionar seção de Dados Fiscais do Veículo (Renavam com máscara de 11 dígitos, Chassi com auto-uppercase de 17 caracteres e KM de entrega) em `components/admin/sales/sale-form.tsx`
- [X] T008 [US1] Adicionar seção de Dados Cadastrais e Endereço Estruturado do Comprador (CPF/CNPJ com máscara inteligente, Telefone com DDD, CEP, Logradouro, Número, Bairro, Cidade e UF) em `components/admin/sales/sale-form.tsx`
- [X] T009 [US1] Adicionar seção de Condições Financeiras com discriminação de valores (Valor Total, Entrada, Saldo Financiado/Troca, Forma de Pagamento e Status) em `components/admin/sales/sale-form.tsx`
- [X] T010 [US1] Adicionar campo de Observações Comerciais com sugestão automática de texto de entrega técnica e checkbox de aceite legal em `components/admin/sales/sale-form.tsx`
- [X] T011 [US1] Integrar feedback de sucesso, redirecionamento pós-salvamento e atalho de emissão imediata de recibo em `components/admin/sales/sale-form.tsx`

**Checkpoint**: Formulário de venda 100% funcional, gravando dados com integridade e permitindo fechar vendas com todas as informações fiscais.

---

## Phase 4: User Story 2 - Recibo Oficial e Comprovante de Entrega Premium A4 (Priority: P1)

**Goal**: Gerar e imprimir o comprovante oficial institucional da AF Motos em layout A4 de 1 página (cabeçalho institucional, 5 seções discriminativas, termos do CTB e linhas de assinaturas) para visualização em tela, impressão direta do navegador (`@media print`) e download em PDF.

**Independent Test**: Acessar o recibo de uma venda salva, acionar o modal/página de impressão, verificar o layout com todas as 5 seções bem diagramadas e disparar `window.print()` confirmando o cabimento estrito em 1 folha A4.

### Implementation for User Story 2

- [X] T012 [P] [US2] Criar componente web de Recibo Oficial A4 com estilização `@media print` e Tailwind CSS em `components/admin/sales/official-receipt-print.tsx`
- [X] T013 [P] [US2] Atualizar o template PDF do `@react-pdf/renderer` para refletir as 5 seções oficiais completas e diagramação A4 em `lib/pdf/sale-receipt.tsx`
- [X] T014 [US2] Integrar o novo Recibo Oficial A4 no modal de detalhes da venda e nas ações de histórico em `components/admin/sales/sale-details-modal.tsx`
- [X] T015 [US2] Atualizar a rota dedicada de visualização/impressão de recibo em `app/admin/(protected)/vendas/[id]/recibo/page.tsx`

**Checkpoint**: Recibo oficial renderizado perfeitamente em tela, pronto para impressão em 1 folha A4 e download em PDF de alta qualidade.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Garantir fidelidade visual, testes de compilação sem warnings e integridade das rotas do painel administrativo.

- [X] T016 [P] Atualizar a visualização das colunas fiscais na listagem e cards de vendas em `components/admin/sales/sales-table.tsx`
- [X] T017 [P] Garantir compatibilidade de impressão sem cabeçalhos indesejados de URL/data do navegador via regras de CSS `@page` em `app/globals.css`
- [X] T018 Executar validação de tipos TypeScript com `npm run build` / lint e verificar ausência de regressões
- [X] T019 Realizar teste ponta a ponta do fluxo de fechamento de venda e emissão de recibo conforme `specs/010-venda-recibo-oficial/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Concluída com sucesso.
- **Foundational (Phase 2)**: Concluída com sucesso.
- **User Story 1 (Phase 3)**: Concluída com sucesso.
- **User Story 2 (Phase 4)**: Concluída com sucesso.
- **Polish (Phase 5)**: Concluída com sucesso (`npm run build` validado sem erros).
