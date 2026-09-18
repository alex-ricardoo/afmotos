# Research Findings: E2E Black-Box Audit with Playwright MCP

## Overview

Este documento consolida as decisões arquiteturais e técnicas para a auditoria de caixa-preta e para a criação da base de testes automatizados E2E da AF Motos, alinhando as capacidades do Playwright MCP no Antigravity com a suíte `@playwright/test`.

---

## 1. Ferramenta de Testes Automatizados E2E

- **Decision**: Utilizar `@playwright/test` (já pré-instalado como dependência de desenvolvimento no `package.json` na versão `^1.63.0`).
- **Rationale**: 
  - Compatibilidade nativa com Next.js 16 e React 19.
  - Suporte de primeira classe para TypeScript sem compilação intermediária.
  - Recursos avançados de isolamento de contexto de browser, persistência de `storageState` para autenticação e trace viewer para inspeção detalhada de falhas.
  - Execução paralela e controle fino de serialização para fluxos financeiros que exigem ordenação estrita.
- **Alternatives considered**:
  - *Cypress*: Maior sobrecarga de configuração com Next.js App Router e menor flexibilidade para autenticação multi-aba/concorrência.
  - *Vitest Browser Mode*: Excelente para testes de componentes, mas menos maduro para fluxos de ponta a ponta complexos de caixa-preta envolvendo redirecionamentos e storage states.

---

## 2. Camada de Exploração: Playwright MCP vs. Testes Estáticos

- **Decision**: Adotar uma estratégia em duas camadas onde o **Playwright MCP** executa a exploração viva no navegador (interação assistida, verificação de DOM, snapshots de acessibilidade e captura pontual de evidências), seguido pela codificação dos cenários estáveis em specs do `@playwright/test`.
- **Rationale**:
  - Permite identificar falhas de experiência, comportamentos inesperados e regressões visuais em tempo real como um usuário autêntico interage.
  - Reduz drasticamente falsos positivos e seletores frágeis, pois a exploração inicial mapeia a árvore real de acessibilidade do navegador.
- **Alternatives considered**:
  - *Escrever specs diretamente sem exploração viva*: Risco elevado de criar testes desacoplados da realidade visual e de UX da aplicação.

---

## 3. Prevenção de Ações Destrutivas em Produção

- **Decision**: Implementar um guardrail automático em nível de configuração (`playwright.config.ts`) e em fixtures de ambiente (`environment.ts`) que analisa `E2E_BASE_URL`. Caso a URL aponte para `afmotos.vercel.app`, qualquer execução que tente mutações destrutivas é abortada com erro fatal explícito.
- **Rationale**:
  - Garante a integridade absoluta dos dados da loja física e dos clientes reais, mesmo em caso de erro acidental de configuração do desenvolvedor ou de esteiras de CI.
- **Alternatives considered**:
  - *Avisos no console*: Não impedem a execução e podem passar despercebidos.
  - *Depender apenas da atenção do operador*: Falível por erro humano.

---

## 4. Estratégia de Isolamento para API Brasil e Mercado Pago

- **Decision**: 
  - Para a **API Brasil**: Assegurar que os testes de consulta veicular rodem no modo `mock` (`VEHICLE_LOOKUP_MODE=mock`), utilizando fixtures seguras de placas fictícias (`E2E1A23`, `E2E2B34`, `E2E3C45`).
  - Para o **Mercado Pago**: Permitir fluxos de pagamento apenas com `MERCADO_PAGO_CHECKOUT_MODE=test` e credenciais de Sandbox. Qualquer teste sem ambiente de sandbox configurado deve ser catalogado formalmente como "bloqueado por segurança".
- **Rationale**:
  - Impede custos reais por consulta veicular na API Brasil.
  - Impede transações financeiras reais, cobranças de cartões e estornos bancários produtivos.
- **Alternatives considered**:
  - *Chamar APIs reais com cartões de teste em produção*: Inaceitável pelo risco de geração de cobranças e distorção contábil da loja.

---

## 5. Estratégia de Persistência de Autenticação

- **Decision**: Gerar arquivos de sessão isolados (`playwright/.auth/customer.json` e `playwright/.auth/admin.json`) através de um projeto de setup ou fixtures reutilizáveis, garantindo que estejam ignorados no `.gitignore`.
- **Rationale**:
  - Acelera a execução da suíte, evitando que cada caso de teste precise submeter o formulário de login repetidamente.
  - Permite testar cenários de sessão expirada ou inválida limpando o contexto sob demanda.
- **Alternatives considered**:
  - *Login via UI em cada teste*: Torna a suíte lenta e propensa a instabilidades de rede.
  - *Injeção direta de cookies no código*: Frágil a mudanças de tokens e chaves de criptografia de sessão do Supabase.
