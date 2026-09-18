# Especificação do Ambiente de Testes E2E: AF Motos

**Feature**: Auditoria E2E de Caixa-Preta e Base de Testes Reproduzíveis  
**Data da Auditoria**: 2026-09-18  
**Branch**: `playwright-tests`  
**Referência**: [plan.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/040-e2e-black-box-playwright-audit/plan.md) | [data-model.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/040-e2e-black-box-playwright-audit/data-model.md)

---

## 1. Configuração e Contexto de Execução

| Parâmetro | Valor Configurado | Descrição / Restrição |
| :--- | :--- | :--- |
| **URL Base (`E2E_BASE_URL`)** | `http://localhost:3000` | Ambiente local de desenvolvimento seguro (ou Vercel Preview) |
| **Runtime Web** | Next.js `16.3.2` / Node.js `20+` | App Router com Server Components e Server Actions |
| **Framework de Testes** | `@playwright/test` `^1.63.0` | Runner oficial com suporte a Chromium headless |
| **Banco de Dados** | Supabase (PostgreSQL) | Acesso MCP estritamente somente leitura (`SELECT`) |
| **Modo Mercado Pago** | Sandbox / `test` | Proibido transações reais com cartão ou chave PIX comercial |
| **Modo Consulta Veicular** | `mock` (`VEHICLE_LOOKUP_MODE=mock`) | Não consome saldo real na API Brasil |
| **Permissão Destrutiva** | `E2E_ALLOW_DESTRUCTIVE=false` | Bloqueio ativo contra mutações e exclusões |
| **Limpeza Automática** | `E2E_RUN_CLEANUP=false` | Preserva integridade de logs operacionais |

---

## 2. Guardrail de Proteção de Produção

Foi implementado e verificado guardrail ativo no `playwright.config.ts` e `tests/e2e/fixtures/environment.ts`. Se `E2E_BASE_URL` apontar para `afmotos.vercel.app` ou `*.afmotos.com.br` enquanto qualquer teste de mutação destrutiva for habilitado, o runner aborta sumariamente com código de erro fatal antes de abrir qualquer página no navegador.

---

## 3. Matriz de Permissões por Domínio

- **Rotas Públicas (Home, Catálogo, Histórico Veicular, Termos)**: 100% liberadas para leitura, SEO, responsividade e acessibilidade.
- **Autenticação**: Permitidos testes negativos de formulário, validação de campos e login com credenciais de teste isoladas.
- **Área do Cliente**: Permitida navegação pelas telas de perfil, listagem de consultas, tabela de pacotes e extrato de crédito.
- **Painel Administrativo**: Permitido teste de bloqueio RBAC (redirecionamento de usuários não autorizados) e visualização de dashboards em modo seguro.
- **Mutações**: Bloqueadas a menos que executadas com dados prefixados por `E2E_` e identificador temporal `E2E_RUN_ID`.
