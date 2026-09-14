# Contrato de Segurança: Autorização e Governança Administrativa

## 1. Princípios Gerais

1. **Acesso Exclusivo**: Nenhuma informação financeira, detalhe de pagamento, dado de cliente ou ação de estorno/reprocessamento pode ser acessada por usuários não autenticados ou clientes comuns.
2. **Defesa em Profundidade**: A verificação de privilégios administrativos ocorre:
   - Na renderização de páginas via middleware / layout server-side guard (`requireAdminUser`).
   - Em todos os Route Handlers (`app/api/admin/...`).
   - Em todas as Server Actions.
   - Nas políticas de Row Level Security (RLS) do Supabase via `public.is_admin()`.
3. **Imutabilidade e Rastreabilidade**: Toda ação administrativa que altere estados financeiros ou operacionais é gravada com `actor_type = 'admin'` e `actor_id` apontando para o usuário autenticado.

---

## 2. Especificação do Guard de Autorização

```ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export interface AdminAuthResult {
  isAuthorized: boolean;
  userId?: string;
  adminProfileId?: string;
  role?: 'admin' | 'super_admin';
  errorResponse?: NextResponse;
}

export async function authorizeAdminRequest(): Promise<AdminAuthResult> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      isAuthorized: false,
      errorResponse: NextResponse.json(
        { error: 'Não autenticado.', code: 'UNAUTHORIZED' },
        { status: 401 }
      ),
    };
  }

  const { data: adminProfile, error: profileError } = await supabase
    .from('admin_profiles')
    .select('id, auth_user_id, role, is_active')
    .eq('auth_user_id', user.id)
    .eq('is_active', true)
    .in('role', ['admin', 'super_admin'])
    .maybeSingle();

  if (profileError || !adminProfile) {
    return {
      isAuthorized: false,
      errorResponse: NextResponse.json(
        { error: 'Acesso restrito a administradores autorizados.', code: 'FORBIDDEN' },
        { status: 403 }
      ),
    };
  }

  return {
    isAuthorized: true,
    userId: user.id,
    adminProfileId: adminProfile.id,
    role: adminProfile.role,
  };
}
```

---

## 3. Matriz de Permissões por Ação

| Operação | Rota / Action | Privilégio Mínimo | Auditoria Obrigatória |
|---|---|---|---|
| Visualizar lista e indicadores | `GET /api/admin/payments` | `admin` | Log de acesso |
| Visualizar detalhes e timeline | `GET /api/admin/payments/[id]` | `admin` | Log de acesso |
| Solicitar estorno | `POST /api/admin/payments/[id]/refund` | `admin` | `consultation_audit_logs` + Log `[ADMIN_PAYMENTS]` |
| Reconciliar estorno | `POST /api/admin/payments/[id]/refund/reconcile` | `admin` | `consultation_audit_logs` + Log `[ADMIN_PAYMENTS]` |
| Reprocessar entrega | `POST /api/admin/payments/[id]/reprocess` | `admin` | `consultation_audit_logs` + Log `[ADMIN_PAYMENTS]` |

---

## 4. Política de Higienização de Dados e Logs

- **Tokens e Segredos**: `MERCADO_PAGO_ACCESS_TOKEN`, `APIBRASIL_TOKEN` e assinaturas HMAC nunca trafegam em respostas HTTP nem logs.
- **Identificadores em Logs**: Devem ser mascarados através do utilitário `maskId` (ex.: `4c8e****8e46`).
- **Dados Sensíveis do Pagador**: O CPF/CNPJ completo e dados de cartão não são expostos em endpoints públicos. No painel administrativo, o e-mail e nome do cliente são visíveis exclusivamente para fins de atendimento ao titular.
