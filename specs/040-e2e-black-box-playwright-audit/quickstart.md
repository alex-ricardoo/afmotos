# Quickstart Validation Guide: E2E Black-Box Audit

**Feature**: Auditoria E2E de Caixa-Preta com Playwright MCP  
**Branch**: `test/e2e-black-box-audit`  
**Referência**: [plan.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/040-e2e-black-box-playwright-audit/plan.md) | [environment-contract.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/040-e2e-black-box-playwright-audit/contracts/environment-contract.md)

Este guia orienta a execução prática da auditoria e a validação ponta a ponta da infraestrutura de testes em ambiente seguro.

---

## 1. Pré-requisitos

1. Node.js `20+` instalado.
2. Dependências do projeto instaladas (`npm install`).
3. Navegador Chromium instalado para o Playwright:
   ```bash
   npx playwright install chromium
   ```
4. Ambiente seguro ativo (servidor de desenvolvimento local ou URL de Vercel Preview):
   - Local: `http://localhost:3000`
   - Preview: URL gerada no deployment da Vercel.

---

## 2. Configuração do Ambiente de Testes

Copiar o arquivo de exemplo de variáveis e configurar a URL base segura:

```bash
cp .env.e2e.example .env.e2e
```

Editar `.env.e2e` para apontar para a URL segura (ex.: `E2E_BASE_URL=http://localhost:3000`).

> [!CAUTION]
> NUNCA aponte `E2E_BASE_URL` para `https://afmotos.vercel.app` com flags destrutivas ativadas.

---

## 3. Comandos de Validação e Execução

### Execução 1: Bateria Rápida de Smoke (Leitura e Rotas Públicas)

Executa os testes essenciais de carregamento e integridade pública:

```bash
npm run test:e2e:smoke
```

**Resultado esperado**:
- Todos os testes do grupo smoke executam e passam em menos de 3 minutos.
- Nenhum dado é modificado ou criado no banco de dados.

### Execução 2: Bateria Completa E2E

Executa a suíte completa de regressão e segurança:

```bash
npm run test:e2e
```

**Resultado esperado**:
- Testes públicos, de autenticação negativa, de proteção de rotas e de validação sintática passam.
- Testes que dependem de credenciais de sandbox não configuradas são ignorados ou finalizados com status de bloqueio documentado.

### Execução 3: Visualização do Relatório HTML

Abre o relatório detalhado no navegador:

```bash
npm run test:e2e:report
```

---

## 4. Exploração Interativa Assistida (Playwright MCP)

Para executar a exploração assistida via MCP:
1. Utilizar os comandos do `playwright` MCP para abrir a página inicial e rotas protegidas.
2. Capturar `browser_snapshot` para avaliar a árvore de acessibilidade.
3. Observar mensagens no console do navegador (`browser_console_messages`).
4. Registrar os achados identificados no documento `docs/testing/e2e-known-issues.md`.
