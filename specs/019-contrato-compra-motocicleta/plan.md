# Implementation Plan: Contrato de Compra de Motocicleta pela AF Motos

**Branch**: `019-contrato-compra-motocicleta` | **Date**: 2026-08-31 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/019-contrato-compra-motocicleta/spec.md`

---

## 1. Summary

Implementação do subsistema para emissão, persistência e visualização do **Contrato Particular de Compra e Venda de Motocicleta** (aquisição de motos para estoque próprio da AF Motos). A solução técnica apoia-se em uma arquitetura de **snapshot JSONB imutável** gravado no PostgreSQL (Supabase), reutilização literal do template visual e do componente de **Placa Mercosul** (`@react-pdf/renderer`), armazenamento seguro em bucket privado com URLs assinadas temporárias, e integração nos fluxos de Propostas (`/admin/propostas`), Estoque (`/admin/motos/[id]`) e Clientes (`/admin/clientes/[id]`).

---

## 2. Technical Context

- **Language/Version**: TypeScript 5.x (Strict Mode `strict: true`), Node.js 20+ runtime no servidor.
- **Primary Dependencies**: Next.js 15 (App Router, Server Actions, Route Handlers), React 19, `@react-pdf/renderer`, `@supabase/ssr`, `zod`, `date-fns`, `lucide-react`, `tailwind-merge`, `sonner`.
- **Storage**: Supabase PostgreSQL (`public.motorcycle_purchase_agreements`), Supabase Storage (`agreements` bucket privado com RLS).
- **Testing**: Testes automatizados unitários e de integração com Vitest/Jest e validação visual de PDF.
- **Target Platform**: Aplicação Web responsiva para administradores (Desktop & Mobile).
- **Project Type**: Full-stack Web Application (Next.js App Router + Supabase).
- **Performance Goals**: Renderização e upload do PDF em menos de 2,5 segundos no servidor; consulta de snapshot e resposta de API em menos de 300ms.
- **Constraints**: 100% de paridade visual com o contrato de comissão existente sem regressão; zero vazamento de dados sensíveis (LGPD); bloqueio estrito de acesso a usuários não-admin via RLS.
- **Scale/Scope**: Módulo administrativo para toda a operação de compra e entrada de estoque próprio da loja.

---

## 3. Constitution Check

_GATE: Avaliação de conformidade com os 12 Princípios Constitucionais da AF Motos._

| Princípio Constitucional | Avaliação de Conformidade | Justificativa / Mecanismo |
|---|---|---|
| **I. Product First** | PASS | Atende a uma dor crítica do negócio (formalização de compras e prova de quitação/tradição com agilidade para a equipe de vendas). |
| **II. Mobile First** | PASS | O modal de preparação e o visualizador de contratos são totalmente responsivos, permitindo que o administrador emita contratos pelo celular na loja ou no pátio. |
| **III. Type Safety** | PASS | Tipagem TypeScript estrita de ponta a ponta (`types/purchase-agreement.ts`), schemas Zod no backend e DTOs tipados para o snapshot. |
| **IV. Segurança** | PASS | Geração executada exclusivamente no servidor (`/api/admin/purchase-agreements/generate`); storage privado com signed URLs de curta duração; RLS ativado. |
| **V. Supabase como Fonte** | PASS | Persistência relacional e JSONB no PostgreSQL do Supabase + bucket de Storage nativo. |
| **VI. Componentização por Domínio** | PASS | Organização modular em `lib/purchase-agreements/`, `lib/pdf/` e `components/admin/purchase-agreement-modal.tsx`. |
| **VII. Integrações Desacopladas** | PASS | Vínculo com a consulta veicular (Spec 018) via adapter e referência de ID, sem acoplamento direto a payloads de terceiros. |
| **VIII. UX Consistente** | PASS | Reutilização literal de 100% dos tokens visuais, cores, faixa dourada/laranja e placa Mercosul do contrato já aprovado. |
| **IX. Performance** | PASS | Reimpressão a partir de snapshot JSONB salvo, sem reprocessamentos custosos ou chamadas redundantes. |
| **X. Testabilidade** | PASS | Validações de schema Zod, cálculos de quitação e geração de snapshot isolados em funções puras testáveis. |
| **XI. Observabilidade** | PASS | Logs estruturados de auditoria (`requestId`, `userId`, tempo de execução) no endpoint de geração. |
| **XII. Evolução Incremental** | PASS | Foco exclusivo na compra direta com quitação integral no MVP, com modelagem preparada para parcelamentos futuros. |

---

## 4. Project Structure

### Documentation (this feature)

```text
specs/019-contrato-compra-motocicleta/
├── spec.md              # Feature specification com critérios de aceite
├── plan.md              # Este plano de implementação
├── research.md          # Auditoria técnica e pesquisa jurídica (Código Civil e CTB)
├── data-model.md        # Esquema SQL, JSONB snapshot e interfaces TypeScript
├── quickstart.md        # Guia do desenvolvedor para testes e validação local
├── contracts/           # Contratos de API e JSON Schemas
│   ├── generate-purchase-agreement.schema.json
│   ├── contract-snapshot.schema.json
│   └── api-contracts.md
├── checklists/
│   └── requirements.md  # Checklist de qualidade SpecKit aprovado
└── tasks.md             # Tarefas atômicas divididas em 5 fases
```

### Source Code Layout (repository root)

```text
app/
├── admin/
│   └── (protected)/
│       ├── motos/
│       │   └── [id]/
│       │       └── page.tsx                           # Ação: "Contrato de Aquisição"
│       ├── propostas/
│       │   └── page.tsx                               # Ação: "Gerar Contrato de Compra"
│       └── clientes/
│           └── [id]/
│               └── page.tsx                           # Histórico de compras do cliente
└── api/
    └── admin/
        └── purchase-agreements/
            ├── generate/
            │   └── route.ts                           # Endpoint POST para gerar contrato e PDF
            └── [id]/
                └── pdf/
                    └── route.ts                       # Endpoint GET para obter signed URL do PDF

components/
└── admin/
    ├── proposal-detail-drawer.tsx                     # Drawer de proposta com botão de compra
    └── purchase-agreement-modal.tsx                   # Modal de preparação com 6 etapas de conferência

lib/
├── pdf/
│   ├── contract-company-header.tsx                    # Primitiva de cabeçalho com logo e dados da loja
│   ├── contract-section-header.tsx                    # Faixa dourada (#d97706) e títulos
│   ├── contract-info-grid.tsx                         # Cards informativos (#f8fafc)
│   ├── contract-signatures.tsx                        # Assinaturas com testemunhas
│   ├── contract-footer.tsx                            # Rodapé padronizado com local e data
│   ├── mercosul-plate-badge.tsx                       # Componente reaproveitado de Placa Mercosul
│   ├── purchase-agreement.tsx                         # Template oficial @react-pdf/renderer de Compra
│   └── sale-receipt.tsx                               # Template existente (inalterado)
├── purchase-agreements/
│   ├── schema.ts                                      # Schemas Zod de validação de entrada
│   ├── service.ts                                     # Orquestrador de geração, snapshot e storage
│   └── formatters.ts                                  # Formatadores de texto, quitação e cláusulas
└── queries/
    └── purchase-agreements.ts                         # Queries de busca de contratos e histórico

supabase/
└── migrations/
    └── 20260831000000_create_motorcycle_purchase_agreements.sql  # Migration incremental

types/
├── purchase-agreement.ts                              # Tipos do domínio, DTOs e Snapshot
└── database.ts                                        # Tipos globais gerados do Supabase
```

---

## 5. Complexity Tracking

> **Status**: Nenhuma violação aos princípios constitucionais. A arquitetura mantém complexidade proporcional e segue os padrões estabelecidos no projeto.
