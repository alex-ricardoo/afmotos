# Modelo de Dados & Schema — Feature 038: Política de Privacidade, Termos de Uso e Registro de Aceite LGPD

## 1. Visão Geral das Entidades

```
+-----------------------------------+
|          legal_documents          |
+-----------------------------------+
| id (UUID, PK)                     |
| slug (TEXT, UNIQUE)               |
| name (TEXT)                       |
| description (TEXT)                |
| created_at, updated_at            |
+-----------------+-----------------+
                  | 1
                  |
                  | N
+-----------------v-----------------+
|      legal_document_versions      |
+-----------------------------------+
| id (UUID, PK)                     |
| document_id (UUID, FK)            |
| version (TEXT)                    |
| title (TEXT)                      |
| summary (TEXT)                    |
| content_markdown (TEXT)           |
| content_hash (TEXT SHA-256)       |
| status ('draft'|'published'|...)  |
| published_at (TIMESTAMPTZ)        |
| effective_at (TIMESTAMPTZ)        |
| requires_reacceptance (BOOLEAN)   |
| created_by, published_by          |
+-----------------+-----------------+
                  | 1
                  |
                  | N
+-----------------v-----------------+          +-----------------------------------+
|    legal_document_acceptances     |          |         privacy_requests          |
+-----------------------------------+          +-----------------------------------+
| id (UUID, PK)                     |          | id (UUID, PK)                     |
| user_id (UUID, FK auth.users)     |          | user_id (UUID, FK auth.users)     |
| document_version_id (UUID, FK)    |          | protocol_number (TEXT, UNIQUE)    |
| document_slug (TEXT)              |          | request_type (TEXT)               |
| version (TEXT)                    |          | status ('pending'|'in_analysis'..) |
| accepted_at (TIMESTAMPTZ)         |          | details (TEXT)                    |
| acceptance_source (TEXT)          |          | contact_email (TEXT)              |
| ip_hash (TEXT SHA-256)            |          | contact_phone (TEXT)              |
| user_agent_category (TEXT)        |          | response_notes (TEXT)             |
| locale (TEXT)                     |          | handled_by, handled_at            |
+-----------------------------------+          +-----------------------------------+
```

---

## 2. Estrutura Detalhada das Tabelas

### 2.1 `public.legal_documents`
Armazena os tipos canônicos de documentos legais do ecossistema AF Motos.

| Coluna | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Identificador único do documento. |
| `slug` | `TEXT` | `NOT NULL UNIQUE` | Identificador textual (`privacy_policy`, `terms_of_use`, `cookie_policy`). |
| `name` | `TEXT` | `NOT NULL` | Nome legível para exibição institucional. |
| `description` | `TEXT` | | Finalidade do documento legal. |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT true` | Se o documento está ativo no sistema. |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT now()` | Carimbo de criação. |
| `updated_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT now()` | Carimbo de última atualização. |

### 2.2 `public.legal_document_versions`
Armazena cada versão de um documento legal com integridade garantida por SHA-256.

| Coluna | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Identificador único da versão. |
| `document_id` | `UUID` | `NOT NULL REFERENCES legal_documents(id)` | Chave estrangeira do documento pai. |
| `version` | `TEXT` | `NOT NULL` | String de versão semântica (ex.: `1.0.0`). |
| `title` | `TEXT` | `NOT NULL` | Título formal do documento nesta versão. |
| `summary` | `TEXT` | | Resumo das principais alterações em linguagem simples. |
| `content_markdown` | `TEXT` | `NOT NULL` | Conteúdo integral formatado em Markdown sanitizado. |
| `content_hash` | `TEXT` | `NOT NULL` | Hash SHA-256 hexadecimal de 64 caracteres do conteúdo. |
| `status` | `TEXT` | `NOT NULL DEFAULT 'draft'` | `'draft'`, `'published'` ou `'archived'`. |
| `published_at` | `TIMESTAMPTZ`| | Data/hora em que a versão foi publicada. |
| `effective_at` | `TIMESTAMPTZ`| | Data/hora de início de vigência formal. |
| `requires_reacceptance` | `BOOLEAN` | `NOT NULL DEFAULT false` | Se exige novo aceite obrigatório dos usuários ativos. |
| `created_by` | `UUID` | `REFERENCES auth.users(id)` | ID do autor do rascunho. |
| `published_by` | `UUID` | `REFERENCES auth.users(id)` | ID do administrador que homologou a publicação. |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT now()` | Carimbo de criação. |
| `updated_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT now()` | Carimbo de alteração. |

- **Restrições**:
  - `CONSTRAINT uq_document_version UNIQUE(document_id, version)`
  - `CONSTRAINT chk_version_status CHECK (status IN ('draft', 'published', 'archived'))`

### 2.3 `public.legal_document_acceptances`
Registro append-only de cada manifestação de aceite com auditoria e comprovação de integridade.

| Coluna | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Identificador único do registro de aceite. |
| `user_id` | `UUID` | `NOT NULL REFERENCES auth.users(id)` | ID do usuário autenticado titular da conta. |
| `document_version_id` | `UUID` | `NOT NULL REFERENCES legal_document_versions(id)` | ID exato da versão aceita. |
| `document_slug` | `TEXT` | `NOT NULL` | Slug desnormalizado para consultas rápidas. |
| `version` | `TEXT` | `NOT NULL` | Número da versão desnormalizado. |
| `accepted_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT now()` | Carimbo temporal UTC do momento do aceite. |
| `acceptance_source` | `TEXT` | `NOT NULL` | Ponto de contato onde ocorreu o aceite. |
| `ip_hash` | `TEXT` | | Hash SHA-256 saltado do IP de origem (sem expor IP bruto). |
| `user_agent_category`| `TEXT` | | Categoria normalizada do navegador/dispositivo. |
| `locale` | `TEXT` | `DEFAULT 'pt-BR'` | Idioma e localidade do cliente. |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT now()` | Carimbo de inserção no banco. |

- **Restrições**:
  - `CONSTRAINT uq_user_document_version UNIQUE(user_id, document_version_id)` (garantia de idempotência)
  - `CONSTRAINT chk_acceptance_source CHECK (acceptance_source IN ('signup', 'login_reacceptance', 'account_settings', 'checkout', 'oauth_completion'))`

### 2.4 `public.privacy_requests`
Gerenciamento de solicitações formais de exercício de direitos dos titulares (Art. 18 da LGPD).

| Coluna | Tipo | Restrições | Descrição |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Identificador único do chamado. |
| `user_id` | `UUID` | `NOT NULL REFERENCES auth.users(id)` | ID do titular solicitante. |
| `protocol_number` | `TEXT` | `NOT NULL UNIQUE` | Número oficial de protocolo (ex.: `LGPD-202609-XYZ1`). |
| `request_type` | `TEXT` | `NOT NULL` | Tipo de direito pleiteado. |
| `status` | `TEXT` | `NOT NULL DEFAULT 'pending'` | Estado de atendimento do protocolo. |
| `details` | `TEXT` | `NOT NULL` | Descrição fornecida pelo titular. |
| `contact_email` | `TEXT` | `NOT NULL` | E-mail para retorno oficial. |
| `contact_phone` | `TEXT` | | Telefone/WhatsApp para contato. |
| `response_notes` | `TEXT` | | Parecer ou resposta do Encarregado de Dados. |
| `handled_by` | `UUID` | `REFERENCES auth.users(id)` | Administrador/DPO responsável pelo atendimento. |
| `handled_at` | `TIMESTAMPTZ`| | Data/hora de conclusão da resposta. |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT now()` | Data de abertura. |
| `updated_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT now()` | Data de atualização. |

- **Restrições**:
  - `CONSTRAINT chk_request_type CHECK (request_type IN ('confirmation', 'access', 'correction', 'anonymization_or_deletion', 'portability', 'sharing_info', 'consent_revocation', 'other'))`
  - `CONSTRAINT chk_request_status CHECK (status IN ('pending', 'in_analysis', 'completed', 'rejected'))`

---

## 3. Índices de Performance

```sql
CREATE INDEX idx_legal_doc_versions_doc_status ON public.legal_document_versions(document_id, status);
CREATE INDEX idx_legal_doc_acceptances_user ON public.legal_document_acceptances(user_id);
CREATE INDEX idx_legal_doc_acceptances_slug_version ON public.legal_document_acceptances(document_slug, version);
CREATE INDEX idx_privacy_requests_user ON public.privacy_requests(user_id);
CREATE INDEX idx_privacy_requests_status ON public.privacy_requests(status);
```
