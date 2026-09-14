# Contract: Financial Report RBAC & Security Rules

**File**: `specs/037-vehicle-history-financial-accountant-reports/contracts/financial-report-rbac.md`  
**Domain**: Regras de Autorização, Controle de Acesso e Proteção de Dados  

---

## 1. Matriz de Acesso e Permissões (RBAC)

| Recurso / Ação | Anônimo / Visitante | Cliente Comum (`customer`) | Operador / Vendedor | Administrador Ativo (`admin` / `super_admin`) |
| :--- | :---: | :---: | :---: | :---: |
| **Visualizar Preço Público de Venda** | ✅ Permitido | ✅ Permitido | ✅ Permitido | ✅ Permitido |
| **Visualizar Custo Unitário da API Brasil** | ❌ Proibido | ❌ Proibido | ❌ Proibido | ✅ Permitido |
| **Visualizar Margem de Lucro Bruta** | ❌ Proibido | ❌ Proibido | ❌ Proibido | ✅ Permitido |
| **Alterar Preço de Venda / Custo Provedor** | ❌ Proibido | ❌ Proibido | ❌ Proibido | ✅ Permitido |
| **Acessar Central de Relatórios Financeiros** | ❌ Proibido | ❌ Proibido | ❌ Proibido | ✅ Permitido |
| **Visualizar Relatório Anual do Contador** | ❌ Proibido | ❌ Proibido | ❌ Proibido | ✅ Permitido |
| **Exportar CSV / PDF com Custos** | ❌ Proibido | ❌ Proibido | ❌ Proibido | ✅ Permitido |
| **Visualizar Chaves de API / Tokens** | ❌ Proibido | ❌ Proibido | ❌ Proibido | ❌ NUNCA EXPOR (Server-only) |

---

## 2. Implementação Canônica de Autorização Server-Side

Todas as rotas de API, Server Actions e Server Components de relatórios e custos devem chamar estritamente:

```typescript
import { requireActiveAdmin } from '@/lib/admin/admin-auth';

export async function adminActionExample() {
  // Lança AdminAuthorizationError('UNAUTHENTICATED' | 'FORBIDDEN') se não for admin
  const adminCtx = await requireActiveAdmin();
  
  // adminCtx.user -> Supabase User autenticado
  // adminCtx.profile -> Registro de public.admin_profiles
  // adminCtx.adminId -> adminCtx.profile.id
  // adminCtx.authUserId -> adminCtx.user.id
}
```

### Regras Mandatórias de RLS no PostgreSQL
```sql
-- Padrão obrigatório para TODAS as novas políticas de relatórios e custos:
EXISTS (
    SELECT 1 FROM public.admin_profiles
    WHERE admin_profiles.auth_user_id = auth.uid()
      AND admin_profiles.is_active = true
      AND admin_profiles.role IN ('admin', 'super_admin')
)
```
**NUNCA USAR**: `admin_profiles.id = auth.uid()`.

---

## 3. Diretrizes de Prevenção de Vazamento de Segredos
1. **APIBRASIL_TOKEN**: Acessada exclusivamente no runtime do Node.js através de `process.env.APIBRASIL_TOKEN`. Nunca injetar em propriedades de componentes React com `'use client'`.
2. **Logs de Auditoria**: Em nenhuma hipótese registrar o header `Authorization`, `x-signature` ou payloads que contenham tokens em texto claro.
3. **Respostas da API**: A rota de sanitização `resolvePublicSiteSettings()` deve manter estrita filtragem, expondo somente `price` e `priceLabel`, sem expor nós internos de custo (`apiBrasilLiveCost`).
