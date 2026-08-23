# Implementation Plan: Refatoração de Venda de Veículos, Dados Fiscais/Cadastrais e Recibo Oficial A4

**Branch**: `010-venda-recibo-oficial` | **Date**: 2026-08-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-venda-recibo-oficial/spec.md`

---

## Summary

Refatoração integral do fluxo de conclusão de vendas e emissão de recibo/comprovante oficial da AF Motos, contemplando:
1. **Migration SQL no Supabase**: Inclusão de campos fiscais e cadastrais (`chassi`, `renavam`, `delivery_km`, `entry_amount`, `financed_amount`, `trade_amount`, `legal_terms_accepted`, endereço estruturado `buyer_cep`, `buyer_street`, `buyer_number`, etc.) nas tabelas `sales` e `motorcycles`.
2. **Formulário Administrativo de Venda (UX/UI)**: Refatoração dos componentes em `components/admin/sales/` com máscaras dinâmicas (CPF/CNPJ, WhatsApp, CEP, Renavam, Chassi com auto-uppercase), validações Zod e divisão visual intuitiva em blocos lógicos.
3. **Template de Recibo Oficial A4 Premium**: Redesenho do comprovante oficial institucional com cabeçalho completo, 5 seções estruturadas (Veículo, Partes, Condições de Pagamento, Termos Legais CTB e Assinaturas formais), estilizado para impressão nativa em 1 página A4 (`@media print` com Tailwind CSS) e sincronizado com o gerador `@react-pdf/renderer`.

---

## Technical Context

**Language/Version**: TypeScript 5+ / Next.js 15 App Router (React 19)

**Primary Dependencies**: Tailwind CSS, React Hook Form, Zod, Lucide React, `@react-pdf/renderer`, `@supabase/supabase-js`, Sonner

**Storage**: Supabase PostgreSQL (tabelas `sales`, `motorcycles`, `site_settings`)

**Testing**: Validação visual de formulário com máscaras, testes de compilação TypeScript strict mode (`npm run build` / lint) e teste de impressão A4 via browser / PDF render

**Target Platform**: Web Desktop & Mobile (Painel Administrativo) + Saída Impressa / PDF A4

**Project Type**: Web Application (Next.js Full-Stack)

**Performance Goals**: Carregamento instantâneo do formulário, validação sem latência e geração de recibo A4 em < 1 segundo

**Constraints**: O layout de impressão do recibo deve caber estritamente em **1 página A4** sem quebras indesejadas nem cortes de rodapé

**Scale/Scope**: Módulo administrativo de vendas e catálogo de estoque

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Princípio Constitucional | Conformidade | Detalhes |
|---|:---:|---|
| **I. Product First** | ✅ PASS | Simplifica o trabalho do administrador e entrega um documento oficial e elegante ao comprador. |
| **II. Mobile First** | ✅ PASS | O formulário de fechamento de venda é totalmente responsivo para uso em smartphones e tablets no pátio da loja. |
| **III. Type Safety** | ✅ PASS | Tipagem TypeScript estrita em `types/database.ts` e validação de runtime no Zod schema `lib/validations/sale.ts`. |
| **IV. Segurança** | ✅ PASS | Mutações e operações de venda protegidas por Server Actions e RLS com verificação de `is_admin()`. |
| **V. Supabase como Fonte de Dados** | ✅ PASS | Persistência exclusiva no PostgreSQL do Supabase via migrations idempotentes. |
| **VI. Componentização & Organização** | ✅ PASS | Componentes coesos organizados em `components/admin/sales/` e utilitários em `lib/pdf/` e `lib/validations/`. |
| **VIII. UX Consistente** | ✅ PASS | Design tokens da AF Motos, paleta refinada (grafite, dourado, branco econômico) e micro-interações elegantes. |
| **X. Testabilidade** | ✅ PASS | Schemas Zod e formatadores de documentos desacoplados da camada de visualização. |

---

## Project Structure

### Documentation (this feature)

```text
specs/010-venda-recibo-oficial/
├── spec.md              # Especificação de requisitos funcionais e critérios
├── plan.md              # Este plano de implementação
├── research.md          # Pesquisa técnica e decisões de arquitetura
├── data-model.md        # Diagrama de entidades e dicionário de dados
├── quickstart.md        # Guia de validação ponta a ponta
├── contracts/           # Contratos de tipos e schema Zod
│   └── sales-api.ts
└── checklists/
    └── requirements.md  # Checklist de qualidade do spec
```

### Source Code (repository layout)

```text
supabase/migrations/
└── 20260823010000_enhance_sales_official_receipt.sql  # [NOVO] Migration com novos campos fiscais e cadastrais

types/
└── database.ts                                        # [MODIFY] Atualização dos tipos TypeScript de Sale, Motorcycle e SiteSettings

lib/
├── validations/
│   └── sale.ts                                        # [MODIFY] Zod schema estendido com máscaras e validações
├── actions/
│   └── sales.ts                                       # [MODIFY] Server action atualizada com persistência dos novos campos
├── queries/
│   └── sales.ts                                       # [MODIFY] Queries tipadas com novos campos de endereço e fiscais
└── pdf/
    └── sale-receipt.tsx                               # [MODIFY] Redesign institucional premium do PDF A4

components/
└── admin/
    └── sales/
        ├── sale-form.tsx                              # [MODIFY] Formulário com novas seções, máscaras e auto-uppercase
        ├── official-receipt-preview.tsx               # [NOVO] Componente visual A4 com CSS @media print para impressão direta
        └── sale-details-modal.tsx                     # [MODIFY] Modal de detalhes exibindo todos os novos dados
```

**Structure Decision**: Adoção do padrão Next.js App Router existente com Server Actions para mutação segura, Zod para validação e componentes modulares no diretório `components/admin/sales/`.

---

## Complexity Tracking

| Aspecto | Motivo da Escolha | Alternativa Rejeitada |
|---|---|---|
| Suporte Dual (Web Print + PDF) | Dá flexibilidade para impressão direta na loja e envio digital via WhatsApp | Apenas PDF (mais lento para impressão rápida no balcão) |
| Máscaras sem libs externas | Zero conflito com React 19 e controle total de digitação | Libs antigas com problemas de concorrência e hydration |
