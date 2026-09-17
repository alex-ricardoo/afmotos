# Contrato de Segurança & RLS — Documentos Legais e LGPD (Spec 038)

## 1. Padrão Canônico de Autorização Administrativa

Todas as validações de perfil administrativo seguem estritamente a convenção canônica do projeto:

```sql
EXISTS (
  SELECT 1 FROM public.admin_profiles
  WHERE admin_profiles.auth_user_id = auth.uid()
    AND admin_profiles.is_active = true
    AND admin_profiles.role IN ('admin', 'super_admin')
)
```

> [!CAUTION]
> **NUNCA** comparar `admin_profiles.id = auth.uid()`. A chave primária da tabela de perfis não coincide necessariamente com o UID da sessão Supabase Auth.

---

## 2. Políticas RLS por Tabela

### 2.1 `legal_documents`
- **SELECT**: Permitido para `anon` e `authenticated`. Qualquer visitante pode conhecer quais tipos de documentos existem.
- **INSERT/UPDATE/DELETE**: Restrito a `public.is_active_admin()`.

### 2.2 `legal_document_versions`
- **SELECT**:
  - `status = 'published'`: Permitido para `anon` e `authenticated`.
  - `status IN ('draft', 'archived')`: Permitido apenas para `public.is_active_admin()`.
- **INSERT**: Permitido apenas para `public.is_active_admin()`.
- **UPDATE**:
  - Apenas versões com `status = 'draft'` podem ser editadas por administradores.
  - Versões com `status = 'published'` são estritamente **imutáveis**.
- **DELETE**: Desabilitado / restrito a `public.is_active_admin()` para drafts apenas.

### 2.3 `legal_document_acceptances`
- **SELECT**:
  - Clientes: Permitido apenas onde `auth.uid() = user_id`.
  - Administradores: Permitido para `public.is_active_admin()` (auditoria global).
- **INSERT**:
  - Permitido para usuários autenticados inserindo o próprio `auth.uid() = user_id`.
- **UPDATE / DELETE**: Estritamente **bloqueado**. A tabela é append-only.

### 2.4 `privacy_requests`
- **SELECT**:
  - Clientes: Permitido apenas onde `auth.uid() = user_id`.
  - Administradores: Permitido para `public.is_active_admin()`.
- **INSERT**:
  - Permitido para usuários autenticados onde `auth.uid() = user_id`.
- **UPDATE**:
  - Permitido apenas para `public.is_active_admin()` para atualização de status e anotações.
- **DELETE**: Bloqueado.
