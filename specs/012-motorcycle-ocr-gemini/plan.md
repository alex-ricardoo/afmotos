# Implementation Plan: OCR Inteligente para Cadastro de Motos com Google Gemini

**Branch**: `012-motorcycle-ocr-gemini` | **Date**: 2026-08-23 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/012-motorcycle-ocr-gemini/spec.md`

## Summary

Implementar a funcionalidade de OCR assistido por IA (Google Gemini) no formulário de cadastro de motocicletas (`/admin/motos/nova`). O administrador poderá fotografar diretamente com a câmera do celular ou anexar uma imagem do documento veicular (CRLV/CRV), extrair dados técnicos estruturados de forma 100% segura no lado do servidor, preencher automaticamente o formulário com revisão humana obrigatória, badges visuais e garantia total de privacidade documental.

---

## Technical Context

**Language/Version**: TypeScript 5 (Strict Mode), Node.js runtime  
**Primary Dependencies**: Next.js 16.3 (App Router, Server Actions, Route Handlers), React 19, Zod 4, Lucide React, Tailwind CSS 4  
**Storage**: Supabase PostgreSQL (para dados da moto salvos manualmente após revisão); Imagem do documento é estritamente em memória transitória (zero storage)  
**Testing & Validation**: `npm run lint`, `npm run typecheck`, `npm run build` + Testes manuais ponta a ponta com cenários de aceite  
**Target Platform**: Web responsivo (Smartphones Android/iOS e Desktop)  
**Project Type**: Next.js Full-stack Web Application  
**Performance Goals**: Tempo de resposta do OCR < 8 segundos; zero impacto no bundle JavaScript do cliente (chaves de API no servidor)  
**Constraints**: Chave `GEMINI_API_KEY` exclusivamente em variáveis server-side; sem gravação de fotos de documento na galeria pública; sem auto-save no banco sem validação humana  
**Scale/Scope**: Painel administrativo da AF Motos, formulário `/admin/motos/nova` e componente modular reutilizável  

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Princípio Constitucional | Avaliação de Conformidade | Status |
|---|---|---|
| **I. Product First** | Elimina digitação repetitiva de Chassi/RENAVAM e acelera a entrada de estoque diretamente no pátio da loja. | PASS |
| **II. Mobile First** | Suporte a `capture="environment"` para acionamento direto da câmera traseira do celular e interface responsiva. | PASS |
| **III. Type Safety** | Schemas estritos com Zod (`MotorcycleOcrResultSchema`) para todas as respostas da IA e formulários. | PASS |
| **IV. Segurança** | Chave `GEMINI_API_KEY` apenas em variáveis privadas de servidor; validação de sessão e role de admin no Route Handler. | PASS |
| **V. Supabase como Fonte** | Não cria bancos paralelos; mantém `public.motorcycles` como destino único dos dados revisados. | PASS |
| **VI. Componentização** | Criação do componente isolado `components/admin/motorcycle-document-ocr.tsx` integrado ao `motorcycle-form.tsx`. | PASS |
| **VII. Integrações Desacopladas** | Criação de serviço isolado `lib/ocr/gemini.ts` com interface limpa para processamento de imagem. | PASS |
| **VIII. UX Consistente** | Segue o design system existente com paleta dark/amber, badges de IA, dialogs acessíveis e feedback claro. | PASS |
| **IX. Performance** | Chamada assíncrona sob demanda sem bloquear renderização inicial da página; imagens validadas em tamanho (máx 10 MB). | PASS |
| **X. Testabilidade** | Normalizadores e schemas são desacoplados e testáveis unitariamente. | PASS |
| **XI. Observabilidade** | Logs estruturados de início, sucesso e falha de OCR sem expor imagens ou dados confidenciais. | PASS |
| **XII. Evolução Incremental** | Entrega valor imediato no cadastro de novas motos sem complexidades desnecessárias de armazenamento permanente. | PASS |

---

## Project Structure

### Documentation (this feature)

```text
specs/012-motorcycle-ocr-gemini/
├── spec.md              # Especificação de requisitos funcionais e critérios de aceite
├── plan.md              # Este plano de implementação
├── research.md          # Auditoria inicial e decisões arquiteturais do Gemini
├── data-model.md        # Schemas Zod, tipos e regras de normalização
├── quickstart.md        # Guia de testes e validação
├── checklists/
│   └── requirements.md  # Checklist de qualidade da especificação
└── contracts/
    └── ocr-api.md       # Contrato de rota POST /api/admin/motorcycles/ocr
```

### Source Code Planned Changes

```text
app/
└── api/
    └── admin/
        └── motorcycles/
            └── ocr/
                └── route.ts              # [NEW] Route handler protegido para OCR com Gemini

components/
└── admin/
    ├── motorcycle-document-ocr.tsx      # [NEW] Componente de câmera/anexo, preview e trigger de IA
    ├── motorcycle-ocr-conflict-modal.tsx # [NEW] Modal de confirmação para campos conflitantes
    └── motorcycle-form.tsx              # [MODIFY] Integração do OCR no Passo 1 com badges visuais

lib/
├── ocr/
│   ├── gemini.ts                        # [NEW] Serviço de integração com Google Gemini (REST / JSON Schema)
│   ├── normalizers.ts                   # [NEW] Normalizadores de Placa, RENAVAM, Chassi, Anos e Cilindrada
│   └── schemas.ts                       # [NEW] Schemas Zod e TypeScript types do OCR
└── utils/
    └── formatters.ts                    # [REUSE] Formatadores utilitários existentes

.env.example                             # [MODIFY] Adicionar GEMINI_API_KEY=
```

---

## Complexity Tracking

_Nenhuma violação constitucional detectada. Todas as diretrizes de segurança, tipagem e isolamento foram cumpridas._
