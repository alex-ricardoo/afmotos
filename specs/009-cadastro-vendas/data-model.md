# Data Strategy & Data Model

## Entidades e Tabelas

### `public.sales` (Extendida)

A tabela já existe. Uma migration adicionará as colunas marcadas com `[NOVO]`.

- `id`: uuid (PK)
- `motorcycle_id`: uuid (FK -> motorcycles.id) [UNIQUE Constraint existente]
- `sale_price`: numeric
- `sale_date`: date
- `buyer_name`: text
- `buyer_phone`: text
- `notes`: text
- `created_at`: timestamptz
- `updated_at`: timestamptz
- `payment_method`: text [NOVO] (Enum: 'PIX', 'DINHEIRO', 'TRANSFERENCIA', 'CARTAO', 'OUTRO')
- `payment_status`: text [NOVO] (Enum: 'PENDING', 'PARTIAL', 'PAID') - *Default: 'PENDING'*
- `amount_paid`: numeric [NOVO] - *Default: 0*
- `receipt_number`: text [NOVO] (Único, gerado no momento do PDF ou da venda)
- `receipt_notes`: text [NOVO] (Notas que devem sair no documento PDF)
- `buyer_document`: text [NOVO] (CPF/CNPJ - Opcional)
- `buyer_address`: text [NOVO] (Opcional)

**Nota LGPD:** Os dados pessoais (`buyer_document`, `buyer_address`) serão criptografados ou, caso não seja possível no Supabase via PGCrypto facilmente agora, serão estritamente protegidos via RLS e NUNCA expostos a queries anônimas ou de leitura de listagem pública de motos.

### Relacionamentos & Queries

A tela de vendas fará um join com `motorcycles` e `motorcycle_images` para evitar múltiplas requisições.

```ts
// Estrutura de Query Conceitual
const { data, error } = await supabase
  .from("sales")
  .select(`
    *,
    motorcycle:motorcycles(
      brand,
      model,
      version,
      year_model,
      year_manufacture,
      price,
      status,
      license_plate,
      images:motorcycle_images(public_url, is_primary)
    )
  `)
  .order("sale_date", { ascending: false });
```

## Row Level Security (RLS) Policies (Novas / Verificação)

- **Policy 1**: `Admins can view all sales` -> `USING (is_admin())`
- **Policy 2**: `Admins can insert sales` -> `WITH CHECK (is_admin())`
- **Policy 3**: `Admins can update sales` -> `USING (is_admin())`

*Nenhuma policy para anônimos (anon) será criada na tabela sales.*
