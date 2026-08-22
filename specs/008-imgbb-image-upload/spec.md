# Feature Specification: Migração de Upload de Imagens (ImgBB com Fallback Supabase Storage)

**Feature Branch**: `008-imgbb-image-upload`  
**Created**: 2026-08-22  
**Status**: Draft  
**Input**: User description: "Migração completa do sistema de upload de imagens para ImgBB com fallback Supabase Storage"

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Upload de Fotos no Painel Administrativo de Motos (Priority: P1)

Como administrador da AF Motos, quero fazer upload de fotos em alta resolução para o cadastro e edição de motocicletas de forma rápida e confiável, para que os veículos sejam exibidos no catálogo público com boa qualidade visual e sem consumir a cota limitada do Supabase Storage quando o serviço ImgBB estiver operacional.

**Why this priority**: O cadastro e manutenção do catálogo de motos é o core business da AF Motos. Imagens pesadas de alta qualidade no painel admin consom a maior fatia de armazenamento da plataforma.

**Independent Test**:
- O administrador acessa a edição de uma motocicleta (`/admin/motos/[id]/editar`), anexa múltiplos arquivos JPEG/PNG/WebP.
- O sistema processa o envio primariamente pelo ImgBB, gravando os metadados e URL pública segura no banco de dados.
- Caso o ImgBB falhe ou esteja sem chave configurada, o sistema aciona transparentemente o Supabase Storage (`motorcycle-images`), garantindo que nenhuma foto seja perdida.

**Acceptance Scenarios**:
1. **Given** que o administrador selecionou 3 fotos válidas e o serviço ImgBB está ativo com chave válida no servidor, **When** clica em adicionar fotos, **Then** as 3 imagens são enviadas ao ImgBB, as URLs públicas são salvas no banco com `provider = 'imgbb'` e a galeria é atualizada imediatamente sem acionar o Supabase Storage.
2. **Given** que o serviço ImgBB responde com erro HTTP 500 ou timeout, **When** o upload é executado, **Then** o sistema realiza retries controlados e, persistindo a falha, envia os arquivos automaticamente ao bucket `motorcycle-images` do Supabase com `provider = 'supabase'`, notificando o sucesso do upload ao usuário sem exibir detalhes técnicos de erro.
3. **Given** que ambos os provedores estão indisponíveis ou rejeitam a imagem, **When** o upload falha em todas as tentativas, **Then** nenhuma linha parcial é gravada no banco, qualquer arquivo órfão é revertido e o usuário recebe a mensagem: `"Não foi possível enviar a imagem. Tente novamente."`.

---

### User Story 2 - Upload Público em Formulários de Anúncio e Venda (Priority: P2)

Como proprietário ou vendedor de motocicleta acessando a página `/anunciar-sua-moto` (ou outros formulários públicos), quero enviar fotos da minha moto através do meu smartphone ou computador, para que a equipe da AF Motos receba os dados completos e imagens nítidas para avaliação comercial.

**Why this priority**: A captação de motos de terceiros alimenta o estoque da loja. A experiência mobile do usuário não pode travar com falhas de rede ou exposição indevida de credenciais.

**Independent Test**:
- Um visitante acessa o formulário de anúncio, anexa fotos pelo celular e envia a proposta.
- As imagens são enviadas com segurança pelo backend para o provedor primário/fallback e anexadas à solicitação.

**Acceptance Scenarios**:
1. **Given** um usuário preenchendo o formulário público com fotos anexadas, **When** ele clica em "Enviar Anúncio", **Then** as fotos são validadas (tamanho, formato), enviadas via Server Action / API interna protegida e vinculadas ao lead/proposta.
2. **Given** um usuário tentando enviar um arquivo não permitido (ex.: executável, arquivo > 10MB ou MIME inválido), **When** seleciona o arquivo, **Then** a validação rejeita localmente e no servidor com mensagem amigável antes de qualquer requisição externa.

---

### User Story 3 - Resolução Unificada e Compatibilidade com Imagens Antigas (Priority: P3)

Como visitante da plataforma pública ou administrador, quero visualizar todas as motos (tanto as cadastradas anteriormente no Supabase Storage quanto as novas no ImgBB) sem links quebrados e com carregamento otimizado via `next/image`.

**Why this priority**: A migração não pode quebrar imagens legadas já persistidas no bucket Supabase nem violar as políticas de segurança de domínios do Next.js.

**Independent Test**:
- O catálogo público carrega uma página contendo motos antigas (com `storage_path = 'motorcycles/...'`) e motos novas (com URLs externas do ImgBB). Ambas renderizam perfeitamente com Next.js Image Optimization.

**Acceptance Scenarios**:
1. **Given** um registro legado com `provider = 'supabase'` e caminho relativo `motorcycles/id/foto.jpg`, **When** a página é renderizada, **Then** o helper de resolução gera a URL pública canônica do Supabase Storage.
2. **Given** um novo registro com `provider = 'imgbb'` e `public_url = 'https://i.ibb.co/...'`, **When** a página é renderizada, **Then** a URL pública do ImgBB é utilizada diretamente sem consultar o Storage do Supabase.
3. **Given** uma foto excluída pelo administrador, **When** a exclusão é confirmada, **Then** se o provedor for Supabase o arquivo é removido do bucket; se for ImgBB, a remoção é registrada e o registro de banco é limpo com segurança.

---

## Edge Cases

- **Chave ImgBB ausente ou inválida no `.env`**: O sistema não trava o build nem o servidor; registra log sanitizado e direciona todo o fluxo imediatamente para o fallback Supabase Storage.
- **Falha transitória de rede durante o upload**: Aplicação de retry com backoff exponencial com jitter (2 a 3 tentativas) antes de chavear para o fallback.
- **Cancelamento do upload pelo usuário (`AbortSignal`)**: As conexões abertas são abortadas sem criar registros fantasmas no banco.
- **Arquivo corrompido ou resposta incompleta da API externa**: Se o ImgBB responder com status 200 mas sem a propriedade `data.url`, a resposta é tratada como falha e o fallback é acionado.
- **Exclusão de imagem principal (capa)**: O sistema elege automaticamente a próxima imagem da ordem como capa para evitar estados inconsistentes no catálogo.
- **Tentativa de injeção de paths ou arquivos maliciosos**: O servidor ignora qualquer caminho sugerido pelo cliente e gera identificadores UUID estritamente controlados pelo servidor.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema MUST manter uma camada centralizada e reutilizável de serviço de upload (`lib/uploads/`) responsável pela orquestração de provedores.
- **FR-002**: A ordem de envio MUST ser estritamente: (1) ImgBB via API oficial; (2) Fallback automático para Supabase Storage; (3) Retorno de erro amigável caso ambos falhem.
- **FR-003**: A chave de API do ImgBB (`IMGBB_API_KEY`) MUST ser acessada exclusivamente no ambiente de servidor, NUNCA exposta ao cliente, NUNCA prefixada com `NEXT_PUBLIC_` e NUNCA exibida em logs, erros ou bundle do navegador.
- **FR-004**: O sistema MUST validar arquivos no cliente e no servidor por tipo MIME (`image/jpeg`, `image/png`, `image/webp`, `image/avif`), tamanho máximo (10MB no front, 32MB no limite do provedor) e sanitização do nome de arquivo.
- **FR-005**: O cliente ImgBB MUST implementar timeout seguro, controle de aborto (`AbortSignal`), e retry inteligente (máx. 2-3 tentativas com backoff) exclusivo para erros transitórios (HTTP 408, 429, 5xx e quedas de rede), ignorando erros 4xx permanentes.
- **FR-006**: O serviço Supabase Storage fallback MUST manter a organização de paths estruturada por domínio (`motorcycles/{id}/{uuid}.ext`, `sell-requests/{id}/{uuid}.ext`, etc.) e respeitar as regras de RLS do Supabase.
- **FR-007**: A persistência no banco de dados (`motorcycle_images`, `sell_request_images`, etc.) MUST armazenar o discriminador de provedor (`provider: 'imgbb' | 'supabase'`), a URL pública (`public_url`), metadados auxiliares (`display_url`, `thumbnail_url`, `delete_url` quando aplicável) e preservar o `storage_path` para itens do Supabase.
- **FR-008**: O Next.js (`next.config.ts`) MUST estar configurado com `remotePatterns` específicos para os domínios do ImgBB (`i.ibb.co`, `image.ibb.co`) e do Supabase Storage do projeto, sem wildcards genéricos permissivos.
- **FR-009**: O componente visual de upload MUST fornecer feedback em tempo real (progresso, estados de loading, prévias, indicação transparente de fallback e mensagens claras em português).
- **FR-010**: O sistema MUST garantir 100% de retrocompatibilidade com as imagens legadas armazenadas no Supabase Storage sem exigir migração forçada de arquivos antigos.
- **FR-011**: A exclusão de imagens MUST remover os arquivos do Supabase Storage quando o provedor for `'supabase'` e limpar os registros do banco de dados com segurança, promovendo nova imagem principal quando necessário.
- **FR-012**: Endpoints de upload públicos MUST possuir proteções contra abuso, rate limiting e sanitização de dados recebidos.

---

### Key Entities

- **UploadImageInput**: Estrutura de dados contendo o arquivo binário/blob, contexto operacional (`motorcycle`, `sell_request`, `site_settings`), identificador de entidade opcional, nome original e sinal de cancelamento.
- **UploadedImage**: Objeto retornado após upload com sucesso, contendo o provedor efetivo (`imgbb` ou `supabase`), `publicUrl`, `displayUrl`, `thumbnailUrl`, `storagePath`, `deleteUrl`, tipo MIME e tamanho em bytes.
- **MotorcycleImage**: Entidade de banco que mapeia uma imagem de moto, incluindo campos estendidos: `provider`, `public_url`, `display_url`, `thumbnail_url`, `delete_url`, `sort_order` e `is_primary`.
- **SellRequestImage / LeadImage**: Entidade ou anexo de fotos enviadas em propostas públicas de venda/anúncio de motos com referência ao provedor e URL.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Redução de mais de 90% do consumo de novos dados no Supabase Storage em produção quando o ImgBB estiver ativo.
- **SC-002**: Taxa de sucesso de upload superior a 99% mesmo em cenários de indisponibilidade pontual do ImgBB (graças ao fallback automático e transparente).
- **SC-003**: 0% de quebra de exibição de fotos existentes no catálogo (retrocompatibilidade total com fotos já cadastradas no bucket Supabase).
- **SC-004**: Zero vazamento de chave de API em bundles de cliente, logs ou mensagens de erro inspecionáveis no navegador.
- **SC-005**: Tempo de resposta de upload no ImgBB com feedback imediato de preview e conclusão média em menos de 2.5 segundos em conexões padrão.

---

## Assumptions

- O ImgBB disponibilizará uma chave de API válida configurada na variável `IMGBB_API_KEY` no ambiente de produção/deploy.
- O bucket `motorcycle-images` do Supabase continuará ativo e com permissões RLS configuradas para servir como fallback e hospedar fotos legadas.
- Não haverá migração física em massa de imagens antigas do Supabase para o ImgBB no momento do rollout (apenas novos uploads adotarão o fluxo primário).
- A tabela `motorcycle_images` e correlatas receberão colunas opcionais adicionais de metadados (`provider`, `public_url`, `display_url`, `thumbnail_url`, `delete_url`) através de migration idempotente.

---

# Documento de Especificação Técnica & Arquitetura de Entrega (21 Entregáveis)

### 1. Diagnóstico do Upload Atual
Atualmente, o projeto possui dois padrões principais de upload:
- **Painel Administrativo (`components/gallery/image-uploader.tsx`)**: Utiliza a Server Action `uploadMotorcycleImageAction` em `lib/actions/images.ts`, que envia direto para o bucket Supabase `motorcycle-images` no path `motorcycles/{motorcycleId}/{uuid}.ext` e salva em `public.motorcycle_images` apenas o `storage_path`.
- **Formulário Público (`components/forms/anunciar-moto-form.tsx`)**: Faz upload direto via cliente Supabase no browser para `sell-requests/{timestamp}-{rand}.ext` no bucket `motorcycle-images` e passa os paths para `createSellRequestAction`.
- **Gargalos atuais**: Consome a cota do Supabase Storage para qualquer foto e expõe operações de storage diretamente no front-end em formulários públicos.

---

### 2. Inventário de Todos os Pontos de Upload

| Local / Componente | Tipo de Upload | Provedor Atual | Tabela Destino | Campos Afetados | Deve Migrar? |
|---|---|---|---|---|---|
| `components/gallery/image-uploader.tsx` | Fotos de Motos (Admin) | Supabase Storage (`uploadMotorcycleImageAction`) | `motorcycle_images` | `storage_path`, `is_primary`, `sort_order` | **SIM (Prioridade 1)** |
| `components/forms/anunciar-moto-form.tsx` | Fotos de Proposta de Venda (Público) | Supabase Storage (Client SDK) | `sell_requests`, `leads` | `metadata.images`, `sell_request_images` | **SIM (Prioridade 2)** |
| `components/admin/settings-form.tsx` | Logo / Favicon da Loja | URL Manual / JSONB | `site_settings` | `settings.logo` | **SIM (Compatibilidade)** |
| `lib/actions/motorcycles.ts` | Exclusão em Lote na Remoção de Moto | Supabase Storage (`.remove`) | `motorcycle_images` | Cascade Delete / Storage clean | **SIM (Adaptar p/ Provider)** |
| `lib/queries/motorcycles.ts` | Resolução de URLs públicas | `getPublicImageUrl()` | N/A (Leitura) | Mapeamento de URL | **SIM (Suporte a URLs ImgBB)** |

---

### 3. Arquitetura do Serviço Central

A arquitetura será unificada no diretório `lib/uploads/`:
```text
lib/uploads/
├── types.ts              # Contratos e tipos TypeScript
├── constants.ts          # Limites, MIME types permitidos, timeouts, domínios
├── validation.ts         # Validações de arquivo, extensão, tamanho e MIME
├── errors.ts             # Classes de erro normalizadas (UploadError, FallbackTriggeredError)
├── imgbb.ts              # Cliente ImgBB seguro (server-side, retry, timeouts, backoff)
├── supabase-storage.ts   # Cliente de fallback Supabase Storage com paths organizados
├── url.ts                # Helper universal de resolução de URLs (legadas e novas)
└── upload-image.ts       # Função mestre uploadImage() com orquestração do fallback
```

---

### 4. Contratos TypeScript

```typescript
export type ImageUploadProvider = 'imgbb' | 'supabase';

export type UploadContext =
  | 'motorcycle'
  | 'sell_request'
  | 'consignment_request'
  | 'site_settings'
  | 'profile'
  | 'other';

export interface UploadImageInput {
  file: File | Blob;
  context: UploadContext;
  entityId?: string;
  fileName?: string;
  altText?: string;
  signal?: AbortSignal;
}

export interface UploadedImage {
  provider: ImageUploadProvider;
  publicUrl: string;
  displayUrl?: string | null;
  thumbnailUrl?: string | null;
  storagePath?: string | null;
  deleteUrl?: string | null;
  mimeType: string;
  sizeBytes: number;
  originalName?: string | null;
}

export interface UploadImageResult {
  success: boolean;
  image?: UploadedImage;
  error?: string;
  fallbackTriggered?: boolean;
}
```

---

### 5. Fluxo ImgBB

```text
[Input File] 
  ──> Validação Local / Server (MIME, Size, Ext)
  ──> Recupera IMGBB_API_KEY do process.env (Server Only)
  ──> Monta FormData (image: binary/base64)
  ──> POST https://api.imgbb.com/1/upload?key={KEY} (Timeout 15s)
  ──> Valida { success: true, data: { url: "..." } }
  ──> Sucesso: Retorna UploadedImage { provider: 'imgbb', publicUrl: data.url, ... }
```

---

### 6. Fluxo de Fallback

```text
ImgBB Falhou (Timeout / HTTP 5xx / 429 / Chave ausente / Resposta inválida)
  ──> Registra aviso seguro no log do servidor (sem vazar credenciais)
  ──> Executa fallback transparente no Supabase Storage
  ──> Gera path canônico: {context}s/{entityId}/{uuid}.{ext}
  ──> Upload para bucket 'motorcycle-images' via Supabase Client autenticado
  ──> Gera publicUrl pelo Supabase Storage
  ──> Sucesso Fallback: Retorna UploadedImage { provider: 'supabase', storagePath, publicUrl }
  ──> Se Supabase também falhar: Lança UploadError padronizado "Não foi possível enviar a imagem. Tente novamente."
```

---

### 7. Estratégia de Persistência

Na tabela `public.motorcycle_images` e tabelas de solicitações, adicionam-se colunas que aceitam URLs externas sem quebrar o modelo legado:
- `provider`: `'imgbb'` | `'supabase'` (default `'supabase'`)
- `public_url`: `TEXT` (URL direta no ImgBB ou Supabase)
- `display_url`: `TEXT` (URL intermediária do ImgBB)
- `thumbnail_url`: `TEXT` (Miniatura do ImgBB)
- `delete_url`: `TEXT` (URL de exclusão do ImgBB para uso administrativo futuro)
- `storage_path`: Permanece preenchido quando `provider = 'supabase'` ou como referência histórica.

---

### 8. Estratégia de Exclusão

- **Quando `provider == 'supabase'`**: Executa `supabase.storage.from('motorcycle-images').remove([storage_path])` e deleta o registro no banco.
- **Quando `provider == 'imgbb'`**:
  - Se houver `delete_url`, o backend pode disparar a chamada de exclusão no servidor de forma assíncrona/segura.
  - Se a exclusão externa falhar ou não for suportada, remove o vínculo no banco e loga aviso de auditoria sem bloquear a deleção no catálogo.

---

### 9. Estratégia para Imagens Antigas

- **Zero Breaking Changes**: Imagens antigas possuem `storage_path` relativo (ex.: `motorcycles/id/uuid.jpg`).
- O helper universal `getImageSource(image)` verifica:
  ```typescript
  if (image.public_url) return image.public_url;
  if (image.storage_path?.startsWith('http')) return image.storage_path;
  return getSupabasePublicUrl(image.storage_path);
  ```
- Nenhum arquivo é movido forçadamente. O bucket existente continua intacto.

---

### 10. Configuração do `next.config.ts`

Atualização dos `remotePatterns` permitindo apenas os domínios oficiais:
```typescript
images: {
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'i.ibb.co',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: 'image.ibb.co',
      pathname: '/**',
    },
    {
      protocol: 'https',
      hostname: '**.supabase.co',
      pathname: '/storage/v1/object/public/**',
    },
    {
      protocol: 'https',
      hostname: 'images.unsplash.com',
    },
  ],
}
```

---

### 11. Variáveis de Ambiente

No `.env` e `.env.example`:
```env
# Chave de API privada do ImgBB (Apenas Servidor - NUNCA usar NEXT_PUBLIC_)
IMGBB_API_KEY=
```

---

### 12. Proteções de Segurança

1. **Server-Side Exclusivity**: A chave nunca é enviada ao cliente ou impressa em erros/JSON responses.
2. **Sanitização de Nomes e Extensões**: Geração de UUIDs aleatórios no servidor para impedir directory traversal ou colisão de nomes.
3. **MIME Verification**: Verificação estrita dos bytes e tipos permitidos (`image/jpeg`, `image/png`, `image/webp`, `image/avif`). Bloqueio estrito de SVGs e executáveis.
4. **Session / RLS Guards**: Uploads administrativos exigem sessão autenticada com role admin; uploads públicos passam por validação rigorosa de payload.

---

### 13. Rate Limiting e Proteção Contra Abuso

- Uploads públicos limitados por IP e por sessão nos endpoints / Server Actions (máx. 10 uploads por minuto por IP em formulários públicos).
- Limite máximo de tamanho de arquivo de 10MB por foto no cliente e 15MB no servidor.
- Limite de até 10 fotos por proposta no formulário de anúncio.

---

### 14. UX dos Uploads

- **Componente de Upload Admin & Público**:
  - Exibição de preview imediato (ObjectURL).
  - Indicador de barra de progresso / spinner elegante.
  - Toast de sucesso ou erro amigável em português.
  - Fallback transparente (sem mensagens assustadoras; apenas se ambos falharem o usuário é orientado a tentar novamente).
  - Capacidade de definir capa, ordenar e excluir fotos com feedback instantâneo.

---

### 15. RLS (Row Level Security) Necessária

- Tabelas `motorcycle_images`: Leitura pública (`SELECT true`), Escrita restrita a administradores (`auth.role() = 'authenticated'` e `is_admin()`).
- Tabelas `sell_requests` / `sell_request_images`: Inserção pública permitida (`INSERT true`), leitura/atualização restrita a administradores.

---

### 16. Migration SQL Completa (Idempotente)

Arquivo a ser preparado: `supabase/migrations/00024_add_external_image_metadata.sql`

```sql
-- Migration: 00024_add_external_image_metadata.sql
-- Adiciona suporte a provedores externos de imagens (ImgBB) com fallback Supabase

-- 1. motorcycle_images
ALTER TABLE public.motorcycle_images
  ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'supabase',
  ADD COLUMN IF NOT EXISTS public_url text,
  ADD COLUMN IF NOT EXISTS display_url text,
  ADD COLUMN IF NOT EXISTS thumbnail_url text,
  ADD COLUMN IF NOT EXISTS delete_url text;

-- Atualizar registros existentes para garantir provider = 'supabase'
UPDATE public.motorcycle_images
SET provider = 'supabase'
WHERE provider IS NULL;

-- 2. sell_request_images (se a tabela existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sell_request_images') THEN
    ALTER TABLE public.sell_request_images
      ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'supabase',
      ADD COLUMN IF NOT EXISTS public_url text,
      ADD COLUMN IF NOT EXISTS delete_url text;
  END IF;
END $$;

-- 3. consignment_request_images (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'consignment_request_images') THEN
    ALTER TABLE public.consignment_request_images
      ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'supabase',
      ADD COLUMN IF NOT EXISTS public_url text,
      ADD COLUMN IF NOT EXISTS delete_url text;
  END IF;
END $$;

-- 4. Criar índices para otimização de busca por provider
CREATE INDEX IF NOT EXISTS idx_motorcycle_images_provider ON public.motorcycle_images(provider);
```

---

### 17. Plano de Rollout

1. Configurar `IMGBB_API_KEY` no ambiente (`.env.local` e no painel de deploy).
2. Executar a migration SQL idempotente `00024_add_external_image_metadata.sql` no Supabase.
3. Implantar o serviço central `lib/uploads/` e atualizar `next.config.ts`.
4. Atualizar as Server Actions e formulários (Admin e Público) para consumirem `uploadImage()`.
5. Validar uploads de teste no Admin e no formulário público.
6. Monitorar taxa de sucesso e ativação do ImgBB vs Fallback Supabase.

---

### 18. Plano de Rollback

- Se a chave do ImgBB expirar ou for revogada, o sistema ativa automaticamente o fallback Supabase sem necessidade de novo deploy.
- Se for necessário desligar o ImgBB completamente, basta remover ou esvaziar a variável `IMGBB_API_KEY`, e todo o tráfego volta a usar 100% o Supabase Storage.
- As colunas adicionadas na migration são opcionais (`NULLABLE`) e não impedem a leitura ou escrita do formato anterior.

---

### 19. Testes

- **Unitários**: Validação de MIME types, cálculo de limites de tamanho, formatação de nomes e retry logic com mocks de rede.
- **Integração ImgBB**: Mock de sucesso com URL pública; mock de erro 500 acionando fallback Supabase; mock de timeout acionando retry.
- **End-to-End**: Upload de 3 fotos pelo formulário de edição admin; upload de proposta com fotos no formulário `/anunciar-sua-moto`; exclusão de foto principal com eleição da próxima foto de capa.

---

### 20. Critérios de Aceitação

- [ ] Uploads novos de motos no painel admin utilizam primariamente o ImgBB e salvam `public_url` e `provider = 'imgbb'`.
- [ ] Formulário `/anunciar-sua-moto` processa fotos via serviço central sem usar chamadas diretas inseguras do browser para o storage.
- [ ] Fallback automático para o Supabase Storage funciona de forma transparente quando `IMGBB_API_KEY` não existe ou a API do ImgBB falha.
- [ ] Todas as fotos legadas continuam sendo carregadas perfeitamente sem links quebrados.
- [ ] Imagens renderizam via `next/image` sem erros de domínio inválido (`i.ibb.co` configurado).
- [ ] `IMGBB_API_KEY` permanece 100% segura no servidor.

---

### 21. Pendências e Próximos Passos

1. Executar `/speckit-plan` para detalhar o plano de implementação técnico por fases e arquivos.
2. Gerar checklist de tarefas e testes automatizados.
3. Validar a chave de API fornecida pelo usuário no `.env.local` antes da fase de execução.
