# Contrato de API — Gestão de Documentos Legais (Spec 038)

## 1. Endpoints & Funções de Consulta Pública

### 1.1 `getPublishedDocument(slug: string)`
Recupera a versão vigente publicada de um documento legal (`'privacy_policy'` ou `'terms_of_use'`), mesclando dinamicamente os dados institucionais da loja (`site_settings`).

- **Parâmetros**:
  - `slug`: `'privacy_policy' | 'terms_of_use' | 'cookie_policy'`
- **Retorno**:
  ```typescript
  interface PublishedDocumentDto {
    id: string;
    slug: string;
    title: string;
    version: string;
    summary: string | null;
    contentMarkdown: string;
    contentHash: string;
    publishedAt: string;
    effectiveAt: string;
    lastUpdatedAt: string;
    institution: {
      siteName: string;
      cnpj: string | null;
      contactEmail: string | null;
      whatsappPhone: string;
      address: string | null;
    };
  }
  ```
- **Comportamento**:
  - Se não houver versão publicada cadastrada no banco, retorna o documento padrão incorporado estaticamente no código com hash e metadados institucionais (resiliência contra falhas de rede do banco).

---

## 2. Server Actions Administrativas

### 2.1 `adminCreateDraftVersionAction(payload: CreateDraftPayload)`
Permite que administradores ativos rascunhem uma nova versão de documento legal.

- **Autenticação**: Exige `admin_profiles.auth_user_id = auth.uid()` com `is_active = true` e `role IN ('admin', 'super_admin')`.
- **Payload**:
  ```typescript
  interface CreateDraftPayload {
    documentSlug: string;
    version: string; // Ex: '1.1.0'
    title: string;
    summary?: string;
    contentMarkdown: string;
    requiresReacceptance: boolean;
  }
  ```
- **Resposta**:
  ```typescript
  type ActionResult<T> = { success: true; data: T } | { success: false; error: string };
  ```

### 2.2 `adminPublishVersionAction(payload: PublishVersionPayload)`
Publica formalmente uma versão de documento legal, tornando-a imutável.

- **Payload**:
  ```typescript
  interface PublishVersionPayload {
    versionId: string;
    confirmationWord: string; // Deve ser exatamente 'PUBLICAR'
    effectiveAt?: string;
  }
  ```
- **Regras**:
  - Valida a palavra-chave de confirmação.
  - Calcula o hash SHA-256 definitivo do texto Markdown.
  - Arquiva a versão anteriormente publicada (`status = 'archived'`).
  - Atualiza a versão alvo para `status = 'published'` com `published_at = now()`.
  - Registra log de auditoria estruturado `[LEGAL_DOCUMENTS] legal_document.version_published`.
