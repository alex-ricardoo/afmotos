# Contrato de API — Registro de Aceite de Documentos Legais (Spec 038)

## 1. Endpoints & Funções de Verificação

### 1.1 `getUserAcceptanceStatus(userId: string)`
Verifica se o usuário autenticado possui aceites registrados para todas as versões obrigatórias vigentes.

- **Retorno**:
  ```typescript
  interface UserAcceptanceStatusDto {
    isCompliant: boolean;
    missingDocuments: Array<{
      slug: string;
      title: string;
      version: string;
      versionId: string;
      requiresReacceptance: boolean;
    }>;
    acceptances: Array<{
      slug: string;
      version: string;
      acceptedAt: string;
      acceptanceSource: string;
    }>;
  }
  ```

---

## 2. Server Actions de Aceite

### 2.1 `recordDocumentAcceptanceAction(payload: RecordAcceptancePayload)`
Registra a aceitação de uma ou mais versões vigentes por um usuário autenticado.

- **Payload**:
  ```typescript
  interface RecordAcceptancePayload {
    documentVersionIds: string[]; // Lista de IDs das versões aceitas
    acceptanceSource: 'signup' | 'login_reacceptance' | 'account_settings' | 'checkout' | 'oauth_completion';
  }
  ```
- **Regras do Servidor**:
  1. Identifica a sessão através de `auth.uid()`.
  2. Obtém IP a partir dos headers (`x-forwarded-for`, `x-real-ip`).
  3. Calcula hash seguro `ip_hash = SHA256(ip + salt)`. Nunca armazena o IP bruto.
  4. Extrai categoria de user-agent (desktop/mobile/tablet/bot).
  5. Insere registros com `ON CONFLICT (user_id, document_version_id) DO NOTHING` para garantir idempotência.
  6. Emite log de auditoria estruturado `[LEGAL_DOCUMENTS] legal_document.acceptance_recorded`.
- **Resposta**:
  ```typescript
  interface RecordAcceptanceResult {
    success: boolean;
    acceptedCount: number;
    error?: string;
  }
  ```
