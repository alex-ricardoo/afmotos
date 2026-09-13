# Implementation Plan: Checkout Pro Mercado Pago para Consulta Veicular

**Branch**: `028-mercadopago-checkout-pro` | **Date**: 2026-09-12 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/028-mercadopago-checkout-pro/spec.md`  

---

## Summary

Implementar o Mercado Pago Checkout Pro (checkout hospedado e redirecionado) como a única solução ativa de pagamento online para laudos de consulta veicular na AF Motos. 

O fluxo elimina totalmente a coleta local de dados de cartão de crédito e a invocação direta de `Payment.create()` no navegador, substituindo-os pela criação de preferências no servidor (`Preference.create`), redirecionamento seguro para o Mercado Pago, recepção e validação criptográfica de notificações assíncronas via Webhook (HMAC-SHA256) e liberação atômica e idempotente da consulta veicular (`executeVehiclePlateLookup`) após confirmação definitiva da API do provedor.

---

## Technical Context

**Language/Version**: TypeScript 5.x estrito (`strict: true`), Node.js 20+  
**Primary Dependencies**: Next.js 16.3.2 (App Router), React 19.2.8, `@supabase/ssr`, `@supabase/supabase-js`, `zod` 4.x, `mercadopago@2.12.0` (fixado)  
**Storage**: PostgreSQL hospedado no Supabase (tabelas `payment_transactions`, `webhook_events`, `consultation_audit_logs`, `customer_plate_consultations`)  
**Testing**: Node Test Runner (`node --test`), TypeScript check (`tsc --noEmit`), ESLint  
**Target Platform**: Vercel (Serverless Node.js Runtime para Server Actions e Route Handlers)  
**Project Type**: Full-stack Web Application (Next.js App Router)  
**Performance Goals**: Tempo de geração da preferência e redirecionamento < 3 segundos; resposta ao webhook do MP < 1.5 segundos; processamento do laudo pós-pagamento em execução única.  
**Constraints**: Zero dados de cartão ou tokens processados na AF Motos; chaves de API restritas ao backend; idempotência rígida na liberação de laudos veiculares; compatibilidade total com o banco existente sem migrações destrutivas.  
**Scale/Scope**: Consultas veiculares por placa em tempo real para compradores e proprietários de motocicletas.  

---

## Constitution Check

| Princípio Constitucional | Conformidade na Arquitetura Proposta | Status |
|---|---|---|
| **I. Product First** | Fluxo de pagamento limpo, intuitivo e com suporte aos principais meios brasileiros (Pix, Cartão, Boleto) | PASS |
| **II. Mobile First** | A página do Mercado Pago e a tela de retorno da AF Motos são 100% responsivas para smartphones | PASS |
| **III. Type Safety** | Schemas Zod para todas as entradas e contratos tipados com TypeScript estrito | PASS |
| **IV. Segurança** | Chaves privadas restritas ao servidor; validação HMAC no webhook; nenhum campo de cartão no app | PASS |
| **V. Supabase como Fonte de Dados** | Transações e auditoria integradas nas tabelas oficiais do Supabase com RLS estrito | PASS |
| **VI. Componentização por Domínio** | Serviços isolados em `lib/mercadopago/` e componentes coesos em `components/customer/` | PASS |
| **VII. Integrações Desacopladas** | Gateway pattern implementado para abstrair o SDK do Mercado Pago da lógica de negócio | PASS |
| **VIII. UX Consistente** | Telas de retorno e botões de ação seguem fielmente o Design System da AF Motos | PASS |
| **IX. Performance & SEO** | Páginas protegidas com headers adequados; sem renderização de scripts pesados de terceiros | PASS |
| **X. Testabilidade** | Construtores de preferência, validadores HMAC e mapeadores de status desacoplados para testes unitários | PASS |
| **XI. Observabilidade** | Logs estruturados e sanitizados com mascaramento de dados sensíveis e auditoria de transições | PASS |
| **XII. Evolução Incremental** | Aproveita o schema SQL existente sem alterações desnecessárias (YAGNI) | PASS |

---

## Project Structure

### Documentation (this feature)

```text
specs/028-mercadopago-checkout-pro/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── tasks.md
├── checklists/
│   └── requirements.md
└── contracts/
    ├── create-preference-api.md
    ├── payment-status-api.md
    ├── webhook-api.md
    └── return-page.md

docs/
├── checkout-pro-migration-from-bricks.md
├── checkout-pro-security-model.md
└── checkout-pro-environment-matrix.md
```

### Source Code Architecture

```text
app/
├── api/
│   ├── mp/
│   │   ├── checkout-pro/
│   │   │   └── preferences/
│   │   │       └── route.ts            # Criação da preferência Checkout Pro (POST)
│   │   └── transactions/
│   │       └── [transactionId]/
│   │           └── status/
│   │               └── route.ts        # Endpoint de status higienizado para polling (GET)
│   └── webhooks/
│       └── mercadopago/
│           └── route.ts                # Receptor oficial de webhook com HMAC-SHA256 (POST)
├── cliente/
│   └── pagamento/
│       ├── [consultationId]/
│       │   └── page.tsx                # Botão server-driven "Pagar com Mercado Pago"
│       └── retorno/
│           └── [transactionId]/
│               └── page.tsx            # Tela de retorno com polling e desbloqueio do laudo
components/
└── customer/
    ├── checkout-pro-button.tsx         # Botão com feedback de carregamento e redirecionamento
    └── payment-return-status.tsx       # Componente de polling e renderização de estados de pagamento
lib/
└── mercadopago/
    ├── client.ts                       # Singleton do cliente Mercado Pago SDK v2.12.0
    ├── preference-builder.ts           # Montagem e higienização do payload de preferência
    ├── webhook-service.ts              # Validação de assinatura HMAC e consulta à API MP
    ├── payment-status-mapper.ts        # Mapeamento de status e transições permitidas
    ├── consultation-releaser.ts        # Liberação atômica da consulta veicular e gravação de auditoria
    ├── security.ts                     # Validação de hosts permitidos e mascaramento de PII
    └── observability.ts                # Emissão de logs estruturados sanitizados
```

---

## Complexity Tracking

| Decisão | Por que é necessária | Alternativa mais simples rejeitada porque |
|---|---|---|
| **Checkout Pro hospedado** | Reduz a zero a complexidade de lidar com dados de cartão e elimina os erros 500 do `Payment.create` direto. | Manter Checkout Bricks gerava instabilidade contínua e falhas de tokenização no provedor. |
| **Validação HMAC com consulta direta** | Garante que notificações falsas ou forjadas não aprovem consultas fraudulentamente. | Confiar cegamente no corpo do webhook sem validação nem consulta ao provedor violaria o princípio de segurança. |
| **Polling na tela de retorno** | Fornece feedback em tempo real para pagamentos imediatos (Pix / Cartão aprovado na hora). | Atualização exclusivamente manual exigiria que o usuário recarregasse a página seguidamente. |
