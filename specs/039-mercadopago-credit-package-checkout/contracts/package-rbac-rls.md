# Contract: Package RBAC & RLS Security Matrix

## 1. Matriz de Controle de Acesso Baseado em Papéis (RBAC)

| Recurso / Operação | Cliente Anônimo | Cliente Autenticado | Administrador Ativo (`is_active=true`) | Service Role (Webhook/Worker) |
|---|---|---|---|---|
| **Visualizar Ofertas Ativas** | Permitido (`is_active=true`) | Permitido (`is_active=true`) | Permitido (todas) | Permitido |
| **Criar / Editar Ofertas** | Negado (401) | Negado (403) | Permitido | Permitido |
| **Iniciar Checkout de Pacote** | Negado (401) | Permitido (oferta ativa) | Permitido | Permitido |
| **Visualizar Pedido de Pacote** | Negado (401) | Permitido (apenas os seus) | Permitido (todos) | Permitido |
| **Executar Concessão de Créditos** | Negado (401) | Negado (403) | Negado direto (apenas via reconcile) | Permitido (exclusivo server-side) |
| **Forçar Reconciliação** | Negado (401) | Apenas status próprio | Permitido | Permitido |
| **Solicitar / Executar Estorno** | Negado (401) | Negado (403) | Permitido | Permitido |

---

## 2. Implementação das Políticas Row Level Security (RLS)

### `public.credit_package_offers`
```sql
ALTER TABLE public.credit_package_offers ENABLE ROW LEVEL SECURITY;

-- Clientes e público em geral só leem ofertas ativas
CREATE POLICY "Anyone can view active credit package offers"
    ON public.credit_package_offers FOR SELECT
    USING (is_active = true);

-- Apenas administradores ativos e com cargo autorizado podem gerenciar o catálogo
CREATE POLICY "Admins manage credit package offers"
    ON public.credit_package_offers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_profiles
            WHERE auth_user_id = auth.uid()
              AND is_active = true
              AND role IN ('admin', 'super_admin')
        )
    );
```

### `public.credit_package_orders`
```sql
ALTER TABLE public.credit_package_orders ENABLE ROW LEVEL SECURITY;

-- Clientes só visualizam seus próprios pedidos
CREATE POLICY "Customers view own credit package orders"
    ON public.credit_package_orders FOR SELECT
    USING (auth.uid() = user_id);

-- Admins ativos visualizam todos os pedidos
CREATE POLICY "Admins view all credit package orders"
    ON public.credit_package_orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.admin_profiles
            WHERE auth_user_id = auth.uid()
              AND is_active = true
              AND role IN ('admin', 'super_admin')
        )
    );
```

---

## 3. Diretrizes de Segurança da Aplicação

1. **Blindagem de Parâmetros**: Mutações em saldo de créditos são expressamente restritas a RPCs com `SECURITY DEFINER` e triggers que barram updates diretos no ledger.
2. **Sanitização de Logs**: Nenhum log de auditoria ou telemetria pode conter `MERCADOPAGO_ACCESS_TOKEN`, assinaturas HMAC completas, CPF ou dados bancários do pagador.
3. **Falha Segura**: Diante de qualquer erro de validação de assinatura ou divergência de valor monetário, a transação falha fechada, mantendo o pedido pendente e alertando os administradores.
