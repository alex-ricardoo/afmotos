# Research & Technical Decisions: Migração de Uploads para ImgBB com Fallback Supabase Storage

**Feature**: `008-imgbb-image-upload`  
**Date**: 2026-08-22  
**Status**: Completed

---

## 1. Inventário Detalhado do Estado Atual de Uploads

| Local / Componente | Contexto | Provedor Atual | Tabela | Campo / Payload | Rota / Action | Auth Requerida | Decisão de Migração |
|---|---|---|---|---|---|---|---|
| `components/gallery/image-uploader.tsx` | Fotos de Motocicletas | Supabase Storage (`motorcycle-images`) | `public.motorcycle_images` | `storage_path`, `is_primary`, `sort_order` | `uploadMotorcycleImageAction()` em `lib/actions/images.ts` | Sim (Admin) | **Migrar para `uploadImage()` (ImgBB 1º, Supabase 2º)** |
| `components/forms/anunciar-moto-form.tsx` | Fotos de Proposta de Venda / Anúncio | Supabase Storage (`motorcycle-images`) via Client SDK | `public.leads`, `public.sell_requests` | `metadata.images`, `sell_requests.notes` | Upload direto no browser + `createSellRequestAction()` | Não (Público) | **Migrar para Server Action com `uploadImage()`** |
| `components/admin/settings-form.tsx` | Logo / Favicon da Loja | URL manual / Input | `public.site_settings` | `settings.logo`, `settings.favicon` | `saveSettingsAction()` em `lib/actions/settings.ts` | Sim (Admin) | **Compatibilizar helper universal `getImageSource()`** |
| `lib/actions/motorcycles.ts` | Exclusão em Lote de Fotos de Moto | Supabase Storage (`.remove`) | `public.motorcycle_images` | Deleção física + cascata | `deleteMotorcycleAction()` | Sim (Admin) | **Adaptar para verificar `provider` antes de chamar `.remove`** |
| `lib/queries/motorcycles.ts` | Resolução de URLs no Catálogo | `getPublicImageUrl()` (Supabase) | N/A (Leitura) | `image_url`, `url` | SSR / Queries públicas | Não (Público) | **Substituir por `getImageSource()` universal** |

---

## 2. Decisões Arquiteturais & Trade-offs

### Decisão 1: Upload 100% Server-Side para o ImgBB
- **Decisão**: O envio para a API `https://api.imgbb.com/1/upload` ocorrerá exclusivamente no servidor (via Server Action / Route Handler interno).
- **Justificativa**: A chave `IMGBB_API_KEY` jamais pode ser exposta no navegador (`NEXT_PUBLIC_`), evitando abuso por terceiros e custos imprevistos. O upload no servidor elimina também restrições de CORS e viabiliza a execução do fallback transparente caso o ImgBB falhe.
- **Alternativas Rejeitadas**:
  - *Upload direto pelo browser*: Rejeitado por expor a chave de API no bundle do cliente.
  - *Assinatura prévia/Presigned URL*: A API do ImgBB v1 não possui suporte a presigned URLs client-side como o AWS S3/Cloudflare R2.

### Decisão 2: Estratégia de Fallback Sequencial com Retry Restrito
- **Decisão**: 
  1. Tentar ImgBB com timeout de 15 segundos e até 2 retries (com backoff e jitter) exclusivamente para erros transitórios (HTTP 408, 429, 5xx e network drop).
  2. Em caso de falha transitória esgotada, erro 500, resposta sem `data.url` ou chave `IMGBB_API_KEY` ausente, o sistema aciona imediatamente o cliente `supabase-storage.ts`.
  3. Somente se ambos falharem, retorna erro amigável ao usuário.
- **Justificativa**: Garante alta disponibilidade (99.9%+) sem duplicar uploads no Supabase quando o ImgBB estiver saudável.

### Decisão 3: Schema de Persistência Híbrido e Retrocompatível
- **Decisão**: Manter o campo `storage_path` existente na tabela `motorcycle_images` e adicionar colunas opcionais `provider text default 'supabase'`, `public_url text`, `display_url text`, `thumbnail_url text` e `delete_url text`.
- **Justificativa**: Não corrompe o significado de `storage_path` para fotos já cadastradas no bucket Supabase. Permite que o sistema identifique com precisão de onde a imagem deve ser lida ou excluída.
- **Alternativas Rejeitadas**:
  - *Gravar URL do ImgBB em `storage_path`*: Rejeitado porque `getPublicUrl(storagePath)` e rotinas de deleção do Supabase Storage falhariam ou gerariam URLs duplicadas como `https://supabase.../https://i.ibb.co/...`.

### Decisão 4: Configuração Restrita de `remotePatterns` no Next.js
- **Decisão**: Configurar no `next.config.ts` os hostnames canônicos do ImgBB (`i.ibb.co`, `image.ibb.co`) e o Supabase Storage do projeto (`zeebjgiiaeojnyyfgztb.supabase.co`).
- **Justificativa**: O componente `next/image` exige declaração explícita de domínios para aplicar otimização de imagens (WebP/AVIF, lazy loading e srcset). Sem isso, imagens externas quebram a renderização.

### Decisão 5: Gerenciamento de Exclusão de Imagens
- **Decisão**:
  - Se `provider == 'supabase'`: Deleta o arquivo físico no Storage e deleta o registro na tabela.
  - Se `provider == 'imgbb'`: Registra intenção de exclusão; como a exclusão na API v1 do ImgBB requer scraping da página de `delete_url` ou chamada web não-autenticada, o backend efetua a limpeza do banco e auditoria em log sem bloquear a operação da loja.

---

## 3. Matriz de Tratamento de Falhas e Retries

| Cenário de Falha | Provedor Tentado | Comportamento | Resposta ao Usuário |
|---|---|---|---|
| `IMGBB_API_KEY` não configurada | ImgBB | Ignora ImgBB e aciona Supabase Storage diretamente | Sucesso transparente |
| ImgBB HTTP 500 / 502 / 503 | ImgBB | 2 retries (backoff 500ms -> 1000ms); aciona Supabase Storage | Sucesso transparente |
| ImgBB HTTP 429 (Rate Limit) | ImgBB | 1 retry; aciona Supabase Storage | Sucesso transparente |
| ImgBB HTTP 400 (Bad Request) | ImgBB | Não faz retry; aciona Supabase Storage | Sucesso transparente |
| Supabase Storage falha após ImgBB falhar | Ambos | Nenhum registro salvo no banco; limpa arquivos temporários | Erro: "Não foi possível enviar a imagem. Tente novamente." |
| Insert no banco falha após upload | Supabase / ImgBB | Exclui arquivo físico do Supabase Storage se criado | Erro: "Falha ao registrar a imagem. O envio foi revertido." |
