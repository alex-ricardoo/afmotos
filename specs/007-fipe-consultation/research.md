# Research: Consulta Tabela FIPE

**Feature**: 007-fipe-consultation
**Date**: 2026-08-22

## 1. fipeX API — Endpoint Confirmation

### Decision: Usar os seguintes endpoints confirmados

Os endpoints foram verificados diretamente na OpenAPI spec (`https://api.fipex.com.br/v1/openapi.yaml`, versão 2.12.1).

### Endpoints necessários para o fluxo progressivo

| Step | Endpoint | Parâmetros-chave | Resposta |
|---|---|---|---|
| Dados iniciais | `GET /v1/prelude` | — | `fuels[]`, `types[]`, `periods[]`, `stats` |
| Tipos de veículo | `GET /v1/vehicle-types` | — | `data[].{id, name, slug}` |
| Marcas | `GET /v1/makes` | `type_id`, `limit=50`, `page` | `data[].{id, name, slug}` |
| Modelos | `GET /v1/models` | `make_id`, `type_id`, `limit=50`, `page` | `data[].{id, name, make_id, slug}` |
| Anos (por modelo) | `GET /v1/models/{model_id}/years` | `fuel_id?` | `data[].{value, is_zero_km}` |
| Combustíveis | `GET /v1/fuels` | — | `data[].{id, acronym, name}` |
| Preço expandido | `GET /v1/prices/expanded` | `model_id`, `fuel_id`, `year` | `data.{price, analytics, history, available_years}` |
| Preço simples | `GET /v1/prices` | `model_id`, `fuel_id`, `year`, `ref_id?` | `data.{price_cents, formatted_price, make, model, fuel, reference, ...}` |
| Histórico | `GET /v1/prices/history` | `model_id`, `fuel_id`, `year` | `data[].{year, month, market_price_cents, formatted_price}` |
| Períodos | `GET /v1/reference-periods` | `year?`, `month?`, `limit=50` | `data[].{id, month, month_name, year}` |

### Rationale
- `/v1/prelude` retorna tipos, combustíveis e períodos de referência recentes numa única chamada — ideal para inicializar o formulário.
- `/v1/prices/expanded` é preferível a `/v1/prices` porque inclui analytics (depreciação, volatilidade) e histórico numa única chamada.
- Os combustíveis vêm no detalhe do modelo (`GET /v1/models/{id}` → `year_fuels[].fuels[]`), o que é mais preciso para o formulário progressivo do que listar todos os combustíveis globais.
- Todos os IDs são UUIDs v7.
- Preços são retornados em centavos (`price_cents: uint32`) e formatados (`formatted_price: string`).

### Alternatives considered
- **FIPE oficial**: Sem API pública documentada. Descartada.
- **Parallelum FIPE API**: API alternativa, mas fipeX tem documentação OpenAPI completa, CORS aberto, sem auth, e dados mais ricos (analytics, histórico).

---

## 2. Fluxo do formulário progressivo

### Decision: Tipo → Marca (paginado) → Modelo (paginado) → Ano → Combustível → Consultar

O fluxo ideal mapeado aos endpoints:

```
1. GET /v1/prelude → preenche tipos de veículo (de `types[]`)
2. Seleciona tipo → GET /v1/makes?type_id={typeId}&limit=50 → marcas
3. Seleciona marca → GET /v1/models?make_id={makeId}&type_id={typeId}&limit=50 → modelos
4. Seleciona modelo → GET /v1/models/{modelId} → retorna year_fuels (anos com combustíveis)
5. Seleciona ano → filtra combustíveis disponíveis para aquele ano (do year_fuels)
6. Seleciona combustível → GET /v1/prices/expanded?model_id={modelId}&fuel_id={fuelId}&year={year}
```

### Rationale
- `GET /v1/models/{id}` retorna `year_fuels[]`, que já contém os anos disponíveis com os combustíveis correspondentes. Isso elimina a necessidade de uma chamada separada a `/v1/models/{id}/years` + `/v1/fuels`.
- Marcas e modelos são paginados (max 50/página). Para a maioria dos tipos de moto, 1-2 páginas são suficientes. Implementar scroll infinito ou "carregar mais" se necessário.

### Alternatives considered
- Usar `/v1/search` com facets: mais complexo, desnecessário para consulta pontual.
- Listar combustíveis globalmente com `/v1/fuels`: não filtra por modelo/ano, pode mostrar opções inválidas.

---

## 3. Estratégia de cache

### Decision: Cache em memória com TTL por tipo de dado

| Dado | TTL | Chave | Justificativa |
|---|---|---|---|
| Prelude (tipos, combustíveis, períodos) | 1 hora | `prelude` | Dados constantes, servidos de memória pelo servidor fipeX |
| Marcas por tipo | 15 min | `makes:{typeId}` | Lista estável, raramente muda |
| Modelos por marca+tipo | 15 min | `models:{makeId}:{typeId}` | Lista estável |
| Detalhe do modelo (year_fuels) | 15 min | `model:{modelId}` | Dados do catálogo |
| Preço expandido | **Sem cache** | — | Preço é o dado principal; deve ser sempre fresco |
| Histórico de preços | 5 min | `history:{modelId}:{fuelId}:{year}` | Muda mensalmente, cache curto OK |

### Rationale
- Cache em memória (Map com TTL) é suficiente para single-admin. Não precisa de Redis.
- Preços nunca são cacheados para garantir que o administrador sempre vê o valor mais recente.
- Os dados de catálogo (marcas, modelos, anos) mudam no máximo mensalmente quando a FIPE publica novos períodos.

### Alternatives considered
- Redis/Upstash: Overkill para single-admin, adiciona dependência.
- Next.js fetch cache: Funciona para Server Components, mas o formulário é Client-side; `unstable_cache` poderia ser usado para Server Actions, mas a simplicidade de um Map com TTL é preferível.

---

## 4. Estratégia de erro e timeout

### Decision: Timeout de 10s, retry 1x em 5xx, error boundary por seção

| Cenário | Tratamento |
|---|---|
| Timeout (>10s) | Abort com `AbortController`, mensagem "O serviço de consulta está temporariamente indisponível." |
| HTTP 429 (rate limit) | Aguardar 2s e retentar 1x, depois exibir mensagem |
| HTTP 5xx | Retentar 1x após 1s, depois exibir mensagem |
| HTTP 4xx (exceto 429) | Não retentar; exibir mensagem contextual |
| JSON inválido | Catch no parse, exibir "Não foi possível processar a resposta." |
| Resposta incompleta (sem campos esperados) | Validação Zod falha, exibir mensagem genérica |
| Rede indisponível | fetch falha, exibir "Verifique sua conexão." |

### Rationale
- 10s é razoável para uma API com p95 < 200ms. Se o servidor demorar mais, provavelmente está com problemas.
- Retry 1x é suficiente para erros transientes sem sobrecarregar a API (limite de 10 req/s).
- `AbortController` permite cancelar requests obsoletas quando o administrador troca uma seleção no formulário.

---

## 5. RLS e segurança

### Decision: Usar `public.is_admin()` com policies explícitas por operação

A função `is_admin()` já existe (migration 00020) e verifica `admin_profiles.role IN ('admin', 'super_admin') AND is_active = true`.

| Operação | Policy |
|---|---|
| SELECT | `is_admin()` |
| INSERT | `is_admin() AND created_by = auth.uid()` |
| UPDATE | `is_admin() AND created_by = auth.uid()` (somente notas) |
| DELETE | `is_admin()` |

### Rationale
- Mais restritivo que o padrão existente (00017 usa `auth.role() = 'authenticated'`), mas correto para dados que devem ser acessíveis apenas a admins.
- `created_by = auth.uid()` no INSERT garante que o campo não pode ser forjado pelo cliente.
- UPDATE restrito ao criador previne edição de consultas de outro admin (futuro multi-admin).

### Alternatives considered
- Usar `auth.role() = 'authenticated'` como as outras tabelas: Menos seguro, permite qualquer usuário autenticado ver/criar consultas.
- Service role para mutations: Desnecessário; o Supabase client com anon key + RLS é suficiente quando as policies estão corretas.

---

## 6. Nome da rota administrativa

### Decision: `/admin/fipe`

### Rationale
- Curto, direto, consistente com as rotas existentes (`/admin/motos`, `/admin/propostas`, `/admin/configuracoes`).
- O mapeamento no filesystem: `app/admin/(protected)/fipe/page.tsx`.

### Alternatives considered
- `/admin/consultas-fipe`: Mais descritivo, mas desnecessariamente longo. O título da página já diz "Consulta Tabela FIPE".
- `/admin/tabela-fipe`: Mistura conceito (tabela é da FIPE) com rota.

---

## 7. Armazenamento de preço

### Decision: `fipe_price numeric(12,2)` em reais, convertido de centavos

A API retorna `price_cents` (uint32) e `formatted_price` (string). Armazenar em `numeric(12,2)` para precisão, convertendo `price_cents / 100`.

### Rationale
- `numeric(12,2)` suporta até R$ 9.999.999.999,99 — mais que suficiente para motos.
- Converter de centavos para reais na camada de mapper evita confusão nos queries e na UI.
- O `response_snapshot` (JSONB) guarda o valor original em centavos para auditoria.

### Alternatives considered
- Armazenar em centavos (integer): Funciona, mas exige conversão em todo lugar que exibe o valor. O modelo de dados do projeto (`motorcycles.price`) já usa decimal.

---

## 8. Permissão de exclusão do histórico

### Decision: Permitir exclusão por admin, com confirmação

### Rationale
- O administrador é o único usuário. Não há razão para impedir que ele limpe seu próprio histórico.
- Confirmação via dialog previne exclusão acidental.
- A policy RLS de DELETE usa apenas `is_admin()` (qualquer admin pode excluir qualquer consulta).

---

## 9. Edição de notas

### Decision: Permitir edição de notas via UPDATE restrito

O campo `notes` é o único campo editável após a criação. O `response_snapshot` e os dados da consulta são imutáveis.

### Rationale
- Notas são um campo de trabalho para o administrador registrar observações durante negociações.
- Restringir o UPDATE ao `created_by` previne que um futuro segundo admin edite notas de outro.

---

## 10. Modelo de detalhe do modelo (year_fuels)

### Decision: Usar `GET /v1/models/{id}` para obter anos e combustíveis numa única chamada

O endpoint retorna:
```json
{
  "data": {
    "id": "uuid",
    "name": "CG 160 Fan",
    "slug": "cg-160-fan",
    "make": { "id": "uuid", "name": "Honda", "slug": "honda" },
    "type": { "id": "uuid", "name": "Motocicletas", "slug": "motocicletas" },
    "year_fuels": [
      {
        "model_year": 2022,
        "fuels": [
          { "id": "uuid", "acronym": "g", "name": "Gasolina" }
        ]
      }
    ]
  }
}
```

### Rationale
- Uma chamada retorna tudo: anos disponíveis + combustíveis por ano. Evita 2 requests separados.
- Os dados de `year_fuels` permitem filtrar combustíveis quando o administrador seleciona o ano.
