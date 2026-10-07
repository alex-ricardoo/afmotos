# Arquitetura do Catálogo Público & Isolamento de Dados

Este documento descreve a arquitetura de leitura pública, segurança de dados, isolamento de privilégios e ciclo de revalidação de cache implementados para o catálogo de motocicletas da **AF Veículos PE (`alex-ricardoo/afmotos`)**.

---

## 1. Contexto do Problema & Causa Raiz

Anteriormente em produção:
1. As páginas públicas (`/motos`, `/motos/[slug]`, `/motos-vendidas` e `sitemap.xml`) consultavam diretamente a tabela interna `motorcycles` através do helper `createClient()` (com cookies de sessão).
2. Na migração RLS anterior, a tabela `motorcycles` teve Row Level Security ativado com uma policy estrita permitindo apenas administradores autenticados (`public.is_admin()`).
3. Por consequência, visitantes anônimos (Googlebot, navegadores sem login, abas anônimas) recebiam 0 linhas do Postgres (`anon`), caindo na mensagem "Estoque em Atualização". Usuários administradores logados viam todas as motos porque a sessão continha a claim administrativa.
4. Além disso, a view legada `public_motorcycles` exigia silenciosamente `published_at IS NOT NULL`, enquanto os fluxos de criação de moto não preenchiam essa coluna, escondendo motos mesmo que fossem marcadas como disponíveis.

---

## 2. Fonte de Dados Pública Sanitizada

Para eliminar qualquer dependência de autenticação e vazamento de dados internos, foi estabelecida uma fonte pública desacoplada:

### View SQL: `public.public_motorcycles`
- **Origem**: Migration versionada `supabase/migrations/20261007000000_secure_public_motorcycles_and_permissions.sql`.
- **Propriedades**:
  - `security_invoker = false` (executada com os privilégios seguros do proprietário da view `postgres`).
  - Permite leitura (`SELECT`) por `anon`, `authenticated` e `service_role`.
  - Agrega imagens públicas ordenadas via subquery JSON.
  - Vincula dados de categoria pública (`categories.name`, `categories.slug`).
  - Executa `NOTIFY pgrst, 'reload schema'` para propagação imediata na API PostgREST.

### View SQL: `public.public_motorcycle_images`
- Visão normalizada de imagens públicas associadas exclusivamente a motos elegíveis (`AVAILABLE` ou `SOLD`).

---

## 3. Regras de Elegibilidade Pública

A visibilidade na vitrine é governada por regras de elegibilidade explícitas e documentadas:

| Rota Pública | Status Elegível | Condição de Publicação | Exclusões Estritas |
| :--- | :--- | :--- | :--- |
| `/motos` | `AVAILABLE` | `published_at IS NULL OR published_at <= now()` | `RESERVED`, `RENTED`, `MAINTENANCE`, `UNAVAILABLE`, `HIDDEN` |
| `/motos-vendidas` | `SOLD` | `published_at IS NULL OR published_at <= now()` | Modelos ativos ou indisponíveis |
| `/motos/[slug]` | `AVAILABLE` ou `SOLD` | `published_at IS NULL OR published_at <= now()` | Slugs não publicados |
| `/` (Destaque) | `AVAILABLE` (featured) | `published_at IS NULL OR published_at <= now()` | Fallback para as mais recentes disponíveis se nenhuma moto estiver marcada como destaque |

> **Regra de `published_at`**: A migração realizou backfill de `published_at = created_at` para todos os registros pré-existentes. A condição `(published_at IS NULL OR published_at <= now())` garante que motos sem data agendada fiquem públicas imediatamente, e motos com agendamento futuro só apareçam após a data.

---

## 4. Campos Públicos vs. Dados Internos Confidenciais

A separação é rigorosa e aplicada em dois níveis (no Banco de Dados via View e na aplicação via DTO `PublicMotorcycle`):

### ✅ Campos Expostos Publicamente:
- `id`, `slug`, `brand`, `model`, `version`
- `year_manufacture`, `year_model`
- `mileage`, `engine_capacity`, `fuel`, `transmission`, `color`
- `price`, `description`, `status`, `featured`, `is_repasse`
- `published_at`, `category_id`, `category_name`, `category_slug`, `operation_type`
- `created_at`, `updated_at`
- `images` (array sanitizado com `id`, `url`, `thumbnailUrl`, `isPrimary`, `sortOrder`, `altText`)

### ❌ Campos Confidenciais (NUNCA Expostos):
- `license_plate` (Placa)
- `renavam`
- `chassi` / `chassis`
- `purchase_amount` (Valor de compra da loja)
- `purchase_date`
- `seller_customer_id` / Dados de clientes
- `acquisition_agreement_id`
- `ownership_type` interno
- ImgBB `delete_url`
- Tokens, senhas, cookies e credenciais administrativas

---

## 5. Modelo de Permissões e Princípio do Mínimo Privilégio

As permissões do PostgreSQL foram reestruturadas para remover qualquer superfície de ataque via API pública:

```sql
-- Revogar permissões perigosas de escrita das tabelas internas
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.motorcycles
FROM anon, authenticated;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.motorcycle_images
FROM anon, authenticated;

-- Revogar acesso direto do visitante anônimo às tabelas internas
REVOKE SELECT ON TABLE public.motorcycles FROM anon;
REVOKE SELECT ON TABLE public.motorcycle_images FROM anon;

-- Conceder SELECT exclusivamente nas views públicas sanitizadas
GRANT SELECT ON public.public_motorcycles TO anon, authenticated, service_role;
GRANT SELECT ON public.public_motorcycle_images TO anon, authenticated, service_role;

-- Revogar qualquer privilégio de mutação nas views
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.public_motorcycles
FROM anon, authenticated;
```

---

## 6. Cliente Público Desacoplado (`lib/supabase/public.ts`)

A camada pública utiliza um cliente Supabase específico:
- Instanciado sem cookies de requisição (`getPublicSupabaseClient()`).
- Injetado exclusivamente com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Sem leitura de `auth.getUser()`, sem cabeçalhos de autorização de usuário logado.
- Garante comportamento 100% idêntico para visitante anônimo, usuário cadastrado e administrador.

---

## 7. Política de Cache e Revalidação

Para aliar alta performance (Vercel CDN / Next.js Data Cache) com atualização instantânea ao alterar registros:

1. **Tag Centralizada**: `public-motorcycles`
2. **ISR**: As páginas públicas exportam `revalidate = 300` (5 minutos como teto defensivo).
3. **Invalidação Proativa (`lib/cache/revalidate-catalog.ts`)**:
   Invocada em todas as mutações no painel administrativo:
   - `createMotorcycle`, `updateMotorcycle`, `deleteMotorcycle`, `toggleMotorcycleStatus`
   - `createSale`, `updateSale`, `cancelSale`
   - `uploadMotorcycleImage`, `deleteMotorcycleImage`, `setPrimaryMotorcycleImage`, `reorderMotorcycleImages`
4. **Alvos Revalidados**:
   - `revalidateTag('public-motorcycles', 'max')`
   - `revalidatePath('/')`
   - `revalidatePath('/motos')`
   - `revalidatePath('/motos-vendidas')`
   - `revalidatePath('/sitemap.xml')`
   - `revalidatePath('/motos/[slug]')`

---

## 8. Observabilidade Sanitizada (`[PUBLIC_CATALOG]`)

Todas as consultas públicas registram eventos estruturados no servidor:
- `public_motorcycles_query`: Contabiliza rota, audiência, statusFilter, contagem de registros e tempo em ms (`durationMs`).
- `public_motorcycles_query_failed`: Registra código de erro e mensagem sanitizada via `sanitizeErrorMessage()` (com redação automática de tokens Bearer, chaves e senhas).
- Nenhum cabeçalho de autorização, cookie ou dado de cliente é impresso nos logs.

---

## 9. Como Validar Anon versus Authenticated (Checklist)

### Procedimento Manual:
1. **Aba Anônima (Visitante 100% deslogado)**:
   - Acessar `http://localhost:3000/motos`.
   - Verificar se as motos disponíveis aparecem normalmente na vitrine (sem mensagem de "Estoque em Atualização" quando há motos no estoque).
   - Acessar `http://localhost:3000/motos-vendidas`.
   - Verificar se o histórico de motos vendidas aparece por completo.
2. **Aba Autenticada (Usuário Comum ou Administrador)**:
   - Fazer login em `/admin` ou área do cliente.
   - Acessar `/motos` e `/motos-vendidas`.
   - **Comparar a contagem e os cards**: a lista de veículos públicos deve ser rigorosamente idêntica à visualizada na aba anônima.
3. **Inspeção de Payload (DevTools Network)**:
   - Abrir o DevTools (F12) -> aba Network.
   - Inspecionar requisições e SSR payload.
   - Confirmar ausência de campos confidenciais (`license_plate`, `chassi`, `renavam`, `purchase_amount`).
4. **Teste de Revalidação ao Alterar Status**:
   - No painel administrativo, alterar o status de uma moto de `AVAILABLE` para `SOLD`.
   - Recarregar `/motos` na aba anônima -> a moto não deve mais constar em `/motos`.
   - Recarregar `/motos-vendidas` na aba anônima -> a moto deve constar imediatamente em `/motos-vendidas`.

### Procedimento Automatizado:
Execute os testes do projeto no terminal:
```bash
npm test
npm run typecheck
```
Todos os 465 testes automatizados (incluindo a suíte `lib/queries/__tests__/public-motorcycles.test.ts`) devem passar com 0 falhas.
