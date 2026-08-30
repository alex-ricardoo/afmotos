# API & Export Contract: Central de Relatórios Gerenciais

**Feature**: `017-central-relatorios-gerenciais`  
**Endpoint**: `GET /api/admin/reports/export`  
**Auth**: Supabase Session Authenticated (Admin role via `public.is_admin()`)

---

## Query Parameters

| Parameter | Type | Required | Default | Description | Example |
|---|---|---|---|---|---|
| `format` | `enum` | Sim | `csv` | Formato do arquivo (`csv`, `xlsx`, `pdf`) | `format=csv` |
| `type` | `enum` | Sim | `consolidado` | Tipo de relatório (`vendas`, `despesas`, `estoque`, `clientes`, `consolidado`) | `type=vendas` |
| `preset` | `enum` | Não | `this_month` | Preset de período rápido | `preset=this_quarter` |
| `startDate` | `string` | Não | Início do mês | Data inicial no formato ISO (`YYYY-MM-DD`) | `startDate=2026-01-01` |
| `endDate` | `string` | Não | Data atual | Data final no formato ISO (`YYYY-MM-DD`) | `endDate=2026-12-31` |
| `includePII` | `boolean`| Não | `false` | Se `true`, inclui CPF e endereço completo para contador | `includePII=true` |

---

## Response Headers

### Para CSV:
```http
HTTP/1.1 200 OK
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="af-motos-vendas_2026-01-01_a_2026-12-31.csv"
Cache-Control: no-cache, no-store, must-revalidate
```

### Para XLSX:
```http
HTTP/1.1 200 OK
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="af-motos-relatorio-consolidado_2026-01-01_a_2026-12-31.xlsx"
Cache-Control: no-cache, no-store, must-revalidate
```

### Para PDF:
```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: attachment; filename="af-motos-relatorio-executivo_2026.pdf"
Cache-Control: no-cache, no-store, must-revalidate
```

---

## Status Codes & Erros

- `200 OK`: Arquivo gerado e transmitido com sucesso.
- `400 Bad Request`: Parâmetros inválidos (ex.: `startDate > endDate` ou formato não suportado).
- `401 Unauthorized`: Usuário não autenticado ou sem permissão administrativa (`public.is_admin() = false`).
- `500 Internal Server Error`: Falha ao compilar planilha ou documento PDF.
