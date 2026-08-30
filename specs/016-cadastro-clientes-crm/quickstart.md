# Quickstart: Cadastro e CRM de Clientes

**Feature**: 016-cadastro-clientes-crm
**Created**: 2026-08-29

## Pré-requisitos

- Supabase CLI instalado e projeto local configurado
- Node.js / pnpm / npm instalado
- Acesso admin ao painel (perfil em `admin_profiles`)

## 1. Aplicar Migrations

```bash
# No diretório do projeto
cd supabase

# Aplicar migrations em ambiente de desenvolvimento
supabase db reset
# ou, se já possui dados locais que quer manter:
supabase migration up
```

Verifique que as tabelas foram criadas:

```sql
-- Verificar tabela customers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- Verificar FKs adicionadas
SELECT column_name FROM information_schema.columns
WHERE table_name = 'sales' AND column_name = 'customer_id';
```

## 2. Criar Cliente Manual

1. Faça login no painel admin (`/admin/login`).
2. Clique em **Clientes** no menu lateral.
3. Clique em **Novo cliente**.
4. Preencha:
   - **Nome completo**: `João Silva` (obrigatório)
   - **Telefone**: `(81) 99999-1234` (obrigatório)
   - Os demais campos são opcionais.
5. Clique em **Salvar cliente**.
6. Verifique o redirecionamento para `/admin/clientes/[id]`.

## 3. Testar Deduplicação

### CPF duplicado (bloqueio)
1. Crie um cliente com CPF `123.456.789-09`.
2. Tente criar outro cliente com o mesmo CPF.
3. **Esperado**: O sistema bloqueia e mostra link "Ver cliente existente".

### Telefone duplicado (alerta)
1. Crie um cliente com telefone `(81) 99999-1234`.
2. Tente criar outro cliente com o mesmo telefone.
3. **Esperado**: O sistema exibe alerta de possível duplicidade com opção de ver ou prosseguir.

### E-mail duplicado (aviso)
1. Crie um cliente com e-mail `joao@email.com`.
2. Tente criar outro com o mesmo e-mail mas telefone diferente.
3. **Esperado**: O sistema exibe aviso informativo sem bloquear.

## 4. Testar Filtros

1. Acesse `/admin/clientes`.
2. Teste cada filtro individualmente:
   - **Busca por texto**: Digite parte do nome → lista filtra.
   - **Filtro por sexo**: Selecione "Masculino" → apenas clientes masculinos.
   - **Filtro por data**: Selecione "Últimos 7 dias".
   - **Filtro por origem**: Selecione "Cadastro manual".
   - **Filtro por status**: Selecione "Inativos".
3. Verifique que filtros refletem na URL (query params).
4. Recarregue a página → filtros preservados.
5. Clique em "Limpar filtros" → tudo resetado.

## 5. Vincular Cliente a Venda

### Selecionar existente
1. Acesse `/admin/vendas/nova`.
2. Na seção "Comprador / Cliente", busque um cliente existente por nome ou telefone.
3. Selecione o cliente → campos de comprador preenchidos automaticamente.
4. Complete e salve a venda.
5. Verifique que `sales.customer_id` foi preenchido no banco.

### Criar durante a venda
1. Acesse `/admin/vendas/nova`.
2. Clique em "Cadastrar novo cliente".
3. Preencha nome e telefone no modal.
4. Salve → modal fecha, cliente selecionado automaticamente.
5. Complete e salve a venda.

### Entrada manual (sem selecionar)
1. Acesse `/admin/vendas/nova`.
2. Preencha os campos de comprador manualmente sem usar o seletor.
3. Salve a venda.
4. Verifique que um cliente foi criado ou vinculado automaticamente ao concluir.

## 6. Testar Criação por Formulário Público

1. Acesse a página pública "Venda sua moto".
2. Preencha e envie o formulário com nome e telefone.
3. Faça login como admin e acesse `/admin/clientes`.
4. Verifique que um cliente foi criado com origem "Site — venda de moto".
5. Acesse o detalhe do cliente → a sell_request deve aparecer nos vínculos.

## 7. Testar RLS

### Como admin autenticado
```sql
-- Deve retornar registros
SELECT * FROM customers LIMIT 5;
```

### Como usuário não-admin (ou anônimo)
```sql
-- Deve retornar 0 registros (RLS bloqueia)
SELECT * FROM customers LIMIT 5;
```

### Via API pública
```bash
# Deve retornar erro 401 ou array vazio
curl https://<supabase-url>/rest/v1/customers \
  -H "apikey: <anon-key>"
```

## 8. Validar Responsividade Mobile

1. Abra Chrome DevTools (F12).
2. Ative modo responsivo (Ctrl+Shift+M).
3. Teste em larguras: 320px, 375px, 414px, 768px.
4. Verifique:
   - `/admin/clientes`: Cards em mobile, tabela em desktop.
   - `/admin/clientes/novo`: Formulário em coluna única, campos usáveis.
   - `/admin/clientes/[id]`: Abas empilhadas, contatos acessíveis.
   - Filtros em drawer/sheet acessível.
   - Botão "Novo cliente" visível e acionável.
   - Sem scroll horizontal.

## 9. Validar Snapshots Históricos

1. Crie um cliente com telefone `(81) 99999-0000`.
2. Registre uma venda selecionando esse cliente.
3. Edite o cliente e altere o telefone para `(81) 88888-0000`.
4. Verifique o registro da venda no banco:
   - `sales.buyer_phone` deve continuar como `(81) 99999-0000` (snapshot original).
   - `sales.customer_id` aponta para o cliente atualizado.
5. Gere o recibo PDF → deve exibir `(81) 99999-0000` (snapshot).

## 10. Validar que Dados Legados Funcionam

1. Verifique que vendas antigas (sem `customer_id`) continuam aparecendo normalmente em `/admin/vendas`.
2. Verifique que o recibo de vendas antigas gera corretamente.
3. Verifique que a página de detalhes de uma venda antiga não exibe erro por `customer_id` nulo.
