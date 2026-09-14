# Contract: Report Export API (CSV & PDF)

**File**: `specs/037-vehicle-history-financial-accountant-reports/contracts/report-export-api.md`  
**Domain**: Exportação de Dados para Gestão e Contador  

---

## 1. Route Handler de Exportação CSV

### `GET /api/admin/reports/vehicle-history/export-csv`

Exporta o conjunto de registros detalhados em arquivo CSV formatado com BOM UTF-8 e ponto-e-vírgula como separador para compatibilidade imediata com o Excel brasileiro.

#### Query Parameters
- `year` (number, opcional): Exporta o ano-calendário completo.
- `startDate` (string, opcional): Filtro de data inicial (YYYY-MM-DD).
- `endDate` (string, opcional): Filtro de data final (YYYY-MM-DD).
- `coverageType` (string, opcional): 'all' | 'mercadopago' | 'platform_credit' | 'free'.
- `includeMock` (boolean, opcional, default `false`).

#### Headers de Resposta
```http
Content-Type: text/csv; charset=utf-8
Content-Disposition: attachment; filename="relatorio-historico-veicular-afmotos-[ANO-MES-DIA].csv"
Cache-Control: no-store, max-age=0
```

#### Colunas Obrigatórias do CSV
```csv
data_hora;ano;mes;consulta_id_curto;placa;cliente_nome;cliente_email;modalidade_cobertura;status_consulta;origem_laudo;api_brasil_status_http;api_brasil_custo_snapshot_reais;api_brasil_custo_efetivo_reais;api_brasil_status_custo;preco_venda_snapshot_reais;mp_transaction_id;mp_payment_id_mascarado;pagamento_status;valor_pagamento_reais;refund_status;valor_estornado_reais;receita_liquida_reais;pacote_b2b_nome;creditos_consumidos;margem_bruta_estimada_reais;observacao_operacional
```

#### Regras de Sanitização no CSV
1. **Anonimização e Segurança**:
   - `placa`: Exibida em formato limpo padrão Mercosul/antigo (ex.: `ABC1D23` ou `ABC-1234`).
   - `mp_payment_id`: Mascarado (ex.: `mp_pay_***8921`).
   - `APIBRASIL_TOKEN` e chaves do Mercado Pago: Terminantemente excluídos.
2. **Formatação Monetária**:
   - Valores convertidos de centavos para Reais com duas casas decimais e vírgula (`39,90`, `30,00`).
3. **Data e Hora**:
   - Formatada no timezone de Brasília (`America/Sao_Paulo`) no padrão `DD/MM/YYYY HH:mm:ss`.

---

## 2. Route Handler de Exportação PDF Gerencial

### `GET /api/admin/reports/vehicle-history/annual-pdf`

Gera um documento PDF sumarizado de apoio contábil contendo o cabeçalho oficial da loja, resumo anual dos números, tabela mensal e o disclaimer legal obrigatório.

#### Query Parameters
- `year` (number, obrigatório): Ano de competência (ex.: 2026).

#### Resposta
- Stream binário `application/pdf` com nome `informe-anual-historico-veicular-[ANO].pdf`.
- Contém obrigatoriamente no rodapé de cada página:
  *"Relatório gerencial de apoio contábil - AF Motos. Não substitui documentos fiscais oficiais."*
