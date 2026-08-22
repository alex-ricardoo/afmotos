# Implementation Plan: Migração de Uploads para ImgBB com Fallback Supabase Storage

**Branch**: `008-imgbb-image-upload` | **Date**: 2026-08-22 | **Spec**: [specs/008-imgbb-image-upload/spec.md](spec.md)

---

## Summary

Migração completa da infraestrutura de upload de imagens do projeto AF Motos para utilizar o serviço ImgBB como provedor primário e o Supabase Storage como fallback automático e transparente. A solução estabelece uma camada centralizada em `lib/uploads/`, isola totalmente a chave de API no servidor (`IMGBB_API_KEY`), garante retrocompatibilidade com fotos legadas no Supabase, adiciona domínios seguros no `next.config.ts` e atualiza todos os pontos de upload (painel admin, formulários públicos e visualizadores).

---

## Technical Context

**Language/Version**: TypeScript 5.x / Next.js 15+ (App Router, Server Actions, Server Components)  
**Primary Dependencies**: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `sonner`, `lucide-react`  
**Storage**: ImgBB API v1 (Primary), Supabase Storage Bucket `motorcycle-images` (Fallback & Legacy), PostgreSQL (`public.motorcycle_images`, `public.sell_requests`, `public.site_settings`)  
**Testing**: Manual E2E Validation, Next.js typecheck, ESLint, TypeScript Strict Mode  
**Target Platform**: Web (Mobile-First responsive, Desktop Admin)  
**Project Type**: Fullstack Web Application (Next.js App Router)  
**Performance Goals**: Tempo de upload < 2.5s no ImgBB; fallback imperceptível < 3.5s; 0% de quebra de imagens legadas  
**Constraints**: Zero vazamento de `IMGBB_API_KEY` para o cliente; chave estritamente server-side; sem migração física forçada de arquivos legados  
**Scale/Scope**: Todas as imagens do catálogo de motos, propostas públicas de venda/anúncio e configurações da loja

---

## Constitution Check

_GATE: Passed during research and ratified for design._

- **Product First (I)**: ✅ Mantém a experiência fluida sem interrupções por quedas de provedor único.
- **Mobile First (II)**: ✅ Formulários públicos otimizados para upload rápido a partir de dispositivos móveis.
- **Type Safety (III)**: ✅ Tipagem estrita com TypeScript e Zod em todas as fronteiras de upload.
- **Segurança (IV)**: ✅ Chave `IMGBB_API_KEY` acessada exclusivamente no servidor. Zero exposição em bundles.
- **Supabase como Fonte de Dados (V)**: ✅ PostgreSQL do Supabase permanece como fonte única da verdade para persistência e metadados.
- **Integrações Desacopladas (VII)**: ✅ Arquitetura baseada em Adapter em `lib/uploads/` desacopla a aplicação da API do ImgBB e do SDK do Supabase.
- **Performance & SEO (IX)**: ✅ URLs configuradas em `remotePatterns` no `next.config.ts` para permitir otimização total pelo `next/image`.

---

## Project Structure & File Changes

### Documentação da Feature
```text
specs/008-imgbb-image-upload/
├── spec.md              # Especificação de requisitos e cenários de aceitação
├── research.md          # Diagnóstico, inventário e decisões técnicas (Phase 0)
├── data-model.md        # Schema, RLS e migration idempotente (Phase 1)
├── contracts/           # Interfaces TypeScript e contratos de APIs/Actions
│   └── upload-contracts.md
├── quickstart.md        # Guia de teste e validação ponta a ponta
└── plan.md              # Este plano de execução detalhado
```

### Arquivos a Criar
1. `lib/uploads/types.ts`: Definição de tipos (`ImageUploadProvider`, `UploadImageInput`, `UploadedImage`, etc.).
2. `lib/uploads/constants.ts`: Constantes de limites de tamanho (10MB/32MB), MIME types permitidos, timeouts e domínios.
3. `lib/uploads/validation.ts`: Validações de arquivo, extensão, integridade e sanitização de nomes.
4. `lib/uploads/errors.ts`: Classes de erro normalizadas para o serviço de upload.
5. `lib/uploads/imgbb.ts`: Cliente HTTP server-side para API ImgBB com timeout, retry e backoff.
6. `lib/uploads/supabase-storage.ts`: Cliente de fallback Supabase Storage com organização padronizada de paths.
7. `lib/uploads/image-url.ts`: Helper universal `getImageSource()` compatível com URLs do ImgBB e paths legados do Supabase.
8. `lib/uploads/upload-image.ts`: Orquestrador central `uploadImage()` gerenciando o fluxo ImgBB -> Fallback Supabase.
9. `supabase/migrations/00024_add_external_image_metadata.sql`: Migration SQL para adicionar colunas `provider`, `public_url`, `display_url`, `thumbnail_url`, `delete_url` com índice de suporte.

### Arquivos a Alterar
1. `.env.example`: Adicionar documentação da variável `IMGBB_API_KEY=`.
2. `next.config.ts`: Adicionar `i.ibb.co` e `image.ibb.co` ao array `remotePatterns`.
3. `types/database.ts`: Atualizar interface `MotorcycleImage` para incluir campos de metadados externos.
4. `lib/actions/images.ts`: Refatorar `uploadMotorcycleImageAction` e `deleteMotorcycleImageAction` para usar `lib/uploads/`.
5. `lib/queries/motorcycles.ts`: Atualizar `getPublicImageUrl()` para consumir `getImageSource()` garantindo retrocompatibilidade.
6. `components/forms/anunciar-moto-form.tsx`: Substituir upload direto do cliente para envio seguro via Server Action unificada.
7. `lib/actions/leads.ts`: Atualizar `createSellRequestAction` para salvar URLs públicas completas.
8. `components/gallery/image-uploader.tsx`: Atualizar feedback visual de upload e tratamento de imagens com `public_url`.

---

## Fases de Execução e Entregáveis

### Fase 1: Camada Central de Upload (`lib/uploads/`)
- Implementar `types.ts`, `constants.ts`, `validation.ts`, `errors.ts`.
- Implementar cliente `imgbb.ts` com chamada `POST` autenticada via query parameter `key`, timeout de 15s e retries restritos a erros transitórios (408, 429, 5xx).
- Implementar cliente `supabase-storage.ts` com fallback para o bucket `motorcycle-images`.
- Implementar orquestrador mestre `upload-image.ts`.
- Implementar `image-url.ts` para resolver de forma transparente URLs ImgBB e paths do Supabase.

### Fase 2: Schema de Banco & Migration
- Criar a migration `supabase/migrations/00024_add_external_image_metadata.sql`.
- Atualizar tipagens em `types/database.ts`.

### Fase 3: Server Actions & Segurança
- Refatorar `lib/actions/images.ts` integrando a função `uploadImage()`.
- Atualizar a exclusão de imagens em `deleteMotorcycleImageAction()` e `deleteMotorcycleAction()` em `lib/actions/motorcycles.ts` para tratar o discriminador `provider`.
- Assegurar que `process.env.IMGBB_API_KEY` seja lida estritamente no servidor.

### Fase 4: Formulários Públicos & Admin
- Migrar `components/forms/anunciar-moto-form.tsx` para processar arquivos via Server Action sem chamadas diretas de Storage no browser.
- Atualizar `components/gallery/image-uploader.tsx` e `components/gallery/image-carousel.tsx` para renderizar tanto `public_url` quanto `storage_path`.

### Fase 5: Configuração do Next.js & Validação de Imagens
- Adicionar hostnames do ImgBB em `next.config.ts`.
- Executar validações de tipagem e build (`npm run typecheck`, `npm run lint`).

---

## Estratégia de Rollout & Rollback

- **Rollout**: 
  1. Adicionar `IMGBB_API_KEY` ao ambiente.
  2. Aplicar migration SQL idempotente.
  3. Deploy das novas rotas e actions.
- **Rollback**: 
  1. Caso ocorra qualquer instabilidade no ImgBB, esvaziar a variável `IMGBB_API_KEY` faz com que o sistema opere 100% no Supabase Storage sem necessidade de rollback de código.
  2. Os campos adicionados no banco são anuláveis (`NULLABLE`), preservando a integridade das imagens legadas.
