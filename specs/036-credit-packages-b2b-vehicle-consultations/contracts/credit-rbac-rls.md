# Contract: RBAC & Row Level Security (RLS) Matrix for Credits

Este documento define rigorosamente as políticas de segurança a nível de linha (RLS) e regras de controle de acesso (RBAC) aplicadas a todas as tabelas do subsistema de créditos.

---

## 1. Princípios de Segurança

1. **Princípio do Menor Privilégio**:
   - Clientes finais autenticados (`authenticated`) têm permissão estritamente **read-only** (`SELECT`) sobre seus próprios dados (`auth.uid() = user_id`).
   - Nenhuma política permite que clientes executem `INSERT`, `UPDATE` ou `DELETE` diretamente em `customer_credit_balances`, `customer_credit_packages`, `customer_credit_reservations` ou `customer_credit_ledger`.
   - Toda mutação contábil ou de reserva ocorre única e exclusivamente via RPCs transacionais `SECURITY DEFINER` protegidas ou via `service_role`.
2. **Isolamento de Search Path**:
   - Todas as funções de banco possuem `SET search_path = ''` para erradicar qualquer vulnerabilidade de injeção de schema ou sequestro de identificador.
3. **Imutabilidade Contábil**:
   - O extrato `customer_credit_ledger` possui trigger explícito `BEFORE UPDATE OR DELETE` que dispara exceção incondicional caso ocorra qualquer tentativa de alteração direta, mesmo por DBAs descuidados.
4. **Validação de Administrador**:
   - Políticas administrativas utilizam a função canônica do projeto `public.is_admin()` que verifica `admin_profiles.auth_user_id = auth.uid()` com `is_active = true` e roles `admin` ou `super_admin`.

---

## 2. Matriz de Políticas RLS

### 2.1 Tabela `public.customer_credit_balances`

```sql
ALTER TABLE public.customer_credit_balances ENABLE ROW LEVEL SECURITY;

-- Leitura do próprio cliente
CREATE POLICY "customer_credit_balances_select_own"
ON public.customer_credit_balances
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Leitura de administradores
CREATE POLICY "customer_credit_balances_select_admin"
ON public.customer_credit_balances
FOR SELECT
TO authenticated
USING (public.is_admin());
```

---

### 2.2 Tabela `public.customer_credit_packages`

```sql
ALTER TABLE public.customer_credit_packages ENABLE ROW LEVEL SECURITY;

-- Leitura do próprio cliente
CREATE POLICY "customer_credit_packages_select_own"
ON public.customer_credit_packages
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Leitura de administradores
CREATE POLICY "customer_credit_packages_select_admin"
ON public.customer_credit_packages
FOR SELECT
TO authenticated
USING (public.is_admin());
```

---

### 2.3 Tabela `public.customer_credit_reservations`

```sql
ALTER TABLE public.customer_credit_reservations ENABLE ROW LEVEL SECURITY;

-- Leitura do próprio cliente
CREATE POLICY "customer_credit_reservations_select_own"
ON public.customer_credit_reservations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Leitura de administradores
CREATE POLICY "customer_credit_reservations_select_admin"
ON public.customer_credit_reservations
FOR SELECT
TO authenticated
USING (public.is_admin());
```

---

### 2.4 Tabela `public.customer_credit_ledger`

```sql
ALTER TABLE public.customer_credit_ledger ENABLE ROW LEVEL SECURITY;

-- Leitura do próprio cliente
CREATE POLICY "customer_credit_ledger_select_own"
ON public.customer_credit_ledger
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Leitura de administradores
CREATE POLICY "customer_credit_ledger_select_admin"
ON public.customer_credit_ledger
FOR SELECT
TO authenticated
USING (public.is_admin());
```

---

## 3. Matriz de Permissões de Execução (GRANT / REVOKE)

| Objeto / RPC | `anon` | `authenticated` | `service_role` | Condição em Runtime |
|---|---|---|---|---|
| `public.grant_credit_package` | REVOKE | REVOKE (PUBLIC) / GRANT para authenticated | GRANT | Executa apenas se `public.is_admin()` for verdadeiro |
| `public.adjust_credit_package` | REVOKE | REVOKE (PUBLIC) / GRANT para authenticated | GRANT | Executa apenas se `public.is_admin()` for verdadeiro |
| `public.reserve_credit_for_consultation` | REVOKE | GRANT | GRANT | Valida `user_id = auth.uid()` ou permissão server-side |
| `public.consume_reserved_credit` | REVOKE | REVOKE | GRANT | Chamado apenas pelo worker de entrega backend |
| `public.release_reserved_credit` | REVOKE | REVOKE | GRANT | Chamado apenas pelo pipeline de compensação ou admin |
