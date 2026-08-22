# Quickstart: Consulta Tabela FIPE

**Feature**: 007-fipe-consultation
**Date**: 2026-08-22

## Prerequisites

- Node.js 18+
- `npm install` executado
- Supabase CLI instalado (`npx supabase --version`)
- Projeto Supabase configurado (ref: `zeebjgiiaeojnyyfgztb`)
- Variáveis de ambiente configuradas em `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Usuário admin existente em `admin_profiles`
- Dev server rodando (`npm run dev`)

## Ordem de Implementação

```text
1. Migration (banco)
2. Tipos e schemas (lib/fipex/types.ts, schemas.ts)
3. Cliente HTTP (lib/fipex/client.ts)
4. Mappers (lib/fipex/mappers.ts)
5. Erros (lib/fipex/errors.ts)
6. Cache (lib/fipex/cache.ts)
7. Função pura (lib/domain/fipe-price.ts)
8. Validações Zod (lib/validations/fipe-consultation.ts)
9. Queries (lib/queries/fipe-consultations.ts)
10. Server Actions (lib/actions/fipe-consultations.ts)
11. Tipos do database (types/database.ts)
12. Componentes UI (components/admin/fipe/*)
13. Página (app/admin/(protected)/fipe/page.tsx)
14. Sidebar (components/admin/admin-sidebar.tsx)
```

---

## Validation Scenarios

### Cenário 1: Consulta FIPE completa (P1)

**Setup**: Dev server rodando, admin logado

**Steps**:
1. Acessar `http://localhost:3000/admin/fipe`
2. Verificar que o formulário é exibido com apenas "Tipo de veículo" habilitado
3. Selecionar tipo (ex: "Motocicletas")
4. Verificar que "Marca" é habilitada com opções carregadas
5. Selecionar marca (ex: "Honda")
6. Verificar que "Modelo" é habilitada com opções carregadas
7. Selecionar modelo (ex: "CG 160 Fan")
8. Verificar que "Ano" é habilitada com anos carregados
9. Selecionar ano (ex: "2022")
10. Verificar que "Combustível" é habilitada com opções filtradas
11. Selecionar combustível (ex: "Gasolina")
12. Clicar "Consultar valor"
13. Verificar card de resultado com preço, referência, código FIPE

**Expected outcome**: Card exibido com dados completos, aviso de referência visível, botões "Salvar" e "Vincular" disponíveis.

---

### Cenário 2: Salvar e consultar histórico (P2)

**Setup**: Cenário 1 concluído com resultado exibido

**Steps**:
1. Clicar "Salvar consulta"
2. Verificar toast: "Consulta salva no histórico."
3. Navegar até a seção "Histórico de consultas"
4. Verificar que a consulta aparece na lista
5. Clicar na consulta para abrir detalhes
6. Verificar que o card mostra os mesmos dados

**Expected outcome**: Consulta persistida no banco e recuperável integralmente.

---

### Cenário 3: Vincular a moto cadastrada (P3)

**Setup**: Cenário 2 concluído, pelo menos 1 moto em `motorcycles`

**Steps**:
1. Com resultado exibido, clicar "Vincular a uma moto"
2. Selecionar uma moto da lista
3. Verificar comparação: preço anunciado vs. valor de referência vs. diferença
4. Verificar que o preço da moto NÃO foi alterado

**Expected outcome**: Comparação exibida, nenhum dado de `motorcycles.price` alterado.

**Verify no side effects**:
```sql
SELECT id, price FROM public.motorcycles WHERE id = '<moto-id>';
-- Preço deve ser o mesmo de antes da vinculação
```

---

### Cenário 4: Cascata de formulário

**Steps**:
1. Preencher até "Modelo"
2. Trocar "Marca" para outra
3. Verificar que Modelo, Ano, Combustível foram limpos
4. Verificar que resultado anterior (se havia) foi removido

**Expected outcome**: Campos dependentes resetados, sem resultado stale.

---

### Cenário 5: API indisponível

**Steps**:
1. Simular indisponibilidade (desconectar rede ou bloquear domínio)
2. Tentar selecionar tipo de veículo
3. Verificar mensagem de erro amigável
4. Reconectar e tentar novamente
5. Verificar que funciona após reconexão

**Expected outcome**: Mensagem amigável sem stack trace, recuperação automática.

---

### Cenário 6: RLS — Acesso público

**Verify via SQL**:
```sql
-- Como anon
SET role anon;
SELECT count(*) FROM public.fipe_consultations;
-- Deve retornar 0 (policy impede leitura)

-- Como authenticated não-admin
SET role authenticated;
SET request.jwt.claims = '{"sub":"user-uuid-sem-admin-profile"}';
SELECT count(*) FROM public.fipe_consultations;
-- Deve retornar 0
```

---

### Cenário 7: Reconsulta

**Steps**:
1. Abrir uma consulta do histórico
2. Clicar "Consultar novamente"
3. Verificar que o formulário é preenchido com os mesmos parâmetros
4. Verificar que uma nova consulta é executada com dados atualizados
5. Verificar que a nova consulta pode ser salva como entrada separada

**Expected outcome**: Nova consulta executada, resultado atualizado, salvável como registro independente.

---

## Build Validation

```bash
npm run lint
npm run build
```

Ambos devem passar sem erros após a implementação completa.

---

## Referências

- Modelo de dados: [data-model.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/007-fipe-consultation/data-model.md)
- Contratos da API: [contracts/fipex-api.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/007-fipe-consultation/contracts/fipex-api.md)
- Contratos da UI: [contracts/ui-contracts.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/007-fipe-consultation/contracts/ui-contracts.md)
