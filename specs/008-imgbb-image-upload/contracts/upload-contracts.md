# Technical Contracts: Upload Service & Provider APIs

**Feature**: `008-imgbb-image-upload`  
**Date**: 2026-08-22  
**Status**: Ready

---

## 1. Interface do Serviço Central (`lib/uploads/types.ts`)

```typescript
export type ImageUploadProvider = 'imgbb' | 'supabase';

export type UploadImageContext =
  | 'motorcycle'
  | 'sell_request'
  | 'consignment_request'
  | 'site_settings'
  | 'profile'
  | 'other';

export interface UploadImageInput {
  /** Arquivo bruto vindo de FormData ou Buffer */
  file: File | Blob;
  /** Contexto de negócio para determinar regras de path no fallback */
  context: UploadImageContext;
  /** ID da entidade relacionada (ex: motorcycleId ou requestId) */
  entityId?: string;
  /** Nome original do arquivo */
  fileName?: string;
  /** Texto alternativo opcional */
  altText?: string;
  /** Sinal para abortar requisição se o usuário cancelar */
  signal?: AbortSignal;
}

export interface UploadedImage {
  /** Provedor onde a imagem foi efetivamente gravada */
  provider: ImageUploadProvider;
  /** URL canônica pública utilizável no componente de imagem */
  publicUrl: string;
  /** URL de exibição intermediária (ImgBB) */
  displayUrl: string | null;
  /** URL de thumbnail (ImgBB) */
  thumbnailUrl: string | null;
  /** Path relativo no Supabase Storage (se provider == 'supabase') */
  storagePath: string | null;
  /** URL de exclusão administrativa (ImgBB) */
  deleteUrl: string | null;
  /** Nome original sanitizado */
  originalName: string | null;
  /** Tipo MIME validado */
  mimeType: string;
  /** Tamanho em bytes */
  sizeBytes: number;
}

export interface UploadServiceResult {
  success: boolean;
  image?: UploadedImage;
  error?: string;
  fallbackTriggered?: boolean;
}
```

---

## 2. Contrato da API Externa ImgBB (v1)

### Endpoint
`POST https://api.imgbb.com/1/upload?key={IMGBB_API_KEY}`

### Payload Enviado (Multipart FormData)
- `image`: Conteúdo binário do arquivo (ou base64)
- `name`: Nome base sanitizado (sem extensão)

### Resposta de Sucesso (HTTP 200)
```json
{
  "data": {
    "id": "2ndCYJK",
    "title": "c160-fan-2022",
    "url_viewer": "https://ibb.co/2ndCYJK",
    "url": "https://i.ibb.co/2ndCYJK/c160-fan-2022.jpg",
    "display_url": "https://i.ibb.co/2ndCYJK/c160-fan-2022.jpg",
    "width": 1200,
    "height": 900,
    "size": 154200,
    "time": 1755890000,
    "expiration": 0,
    "image": {
      "filename": "c160-fan-2022.jpg",
      "name": "c160-fan-2022",
      "mime": "image/jpeg",
      "extension": "jpg",
      "url": "https://i.ibb.co/2ndCYJK/c160-fan-2022.jpg"
    },
    "thumb": {
      "filename": "c160-fan-2022.jpg",
      "name": "c160-fan-2022",
      "mime": "image/jpeg",
      "extension": "jpg",
      "url": "https://i.ibb.co/2ndCYJK/c160-fan-2022.th.jpg"
    },
    "delete_url": "https://ibb.co/2ndCYJK/6f5a3b9c..."
  },
  "success": true,
  "status": 200
}
```

### Resposta de Erro (HTTP 4xx / 5xx)
```json
{
  "status_code": 400,
  "error": {
    "message": "Empty upload data.",
    "code": 100
  },
  "status_txt": "Bad Request"
}
```

---

## 3. Contratos de Server Actions Atualizadas

### `uploadMotorcycleImageAction(formData: FormData)`
- **Entrada**: `formData` contendo `motorcycleId` (UUID), `file` (File) e `altText` (string opcional).
- **Processamento**:
  1. Valida autenticação de administrador no Supabase.
  2. Valida arquivo via `validateImageFile(file)`.
  3. Chama `uploadImage({ file, context: 'motorcycle', entityId: motorcycleId })`.
  4. Insere registro em `public.motorcycle_images` com os metadados e `public_url`.
  5. Se insert falhar, reverte com segurança o arquivo gerado.
  6. Revalida rotas de cache do Next.js (`/admin/motos`, `/motos`, `/motos/[slug]`).
- **Saída**: `{ success: true, image: MotorcycleImage } | { success: false, error: string }`.

### `deleteMotorcycleImageAction(imageId: string)`
- **Entrada**: `imageId` (UUID).
- **Processamento**:
  1. Busca registro na tabela `motorcycle_images`.
  2. Se `provider === 'supabase'`, remove objeto pelo `storage_path`.
  3. Se `provider === 'imgbb'`, registra deleção de auditoria.
  4. Deleta linha do banco.
  5. Se a foto era principal, elege a próxima foto como capa (`is_primary = true`).
  6. Revalida rotas de cache.
- **Saída**: `{ success: true } | { success: false, error: string }`.
