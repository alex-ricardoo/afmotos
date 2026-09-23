# Guia de Testes E2E: AF Motos

Este diretório contém a suíte oficial de testes End-to-End (E2E) da AF Motos, implementada com `@playwright/test` e arquiteturada no padrão Page Object Model (POM).

---

## 1. Estrutura do Diretório

```text
tests/e2e/
├── fixtures/              # Fixtures de autenticação, dados de teste e guardrails
│   ├── assertions.ts      # Asserções customizadas de segurança e relatórios
│   ├── auth.fixture.ts    # Injeção de sessão e helpers de login
│   ├── cleanup.ts         # Rotinas de limpeza segura (E2E_RUN_CLEANUP)
│   ├── environment.ts     # Validação de variáveis e proteção de produção
│   ├── test-data.ts       # Gerador de placas fictícias e dados mock E2E_
│   └── test-users.ts      # Catálogo tipado de personas de teste
│
├── page-objects/          # Page Object Models desacoplados da interface
│   ├── admin-*.page.ts    # Telas administrativas
│   ├── customer-*.page.ts # Área restrita do cliente
│   ├── login.page.ts      # Login cliente e admin
│   ├── public-pages.page.ts # Home, Catálogo e Institucional
│   └── ...
│
├── public/                # Specs de páginas públicas, SEO e responsividade
├── auth/                  # Specs de autenticação, cadastro e proteção de rotas
├── customer/              # Specs da área do cliente, perfil e consultas
├── admin/                 # Specs de gestão e painel administrativo
├── security/              # Specs de integridade, IDOR e vazamento de segredos
└── smoke/                 # Bateria rápida de validação de rotas críticas
```

---

## 2. Como Executar os Testes

### Execução Rápida (Smoke Tests)
Ideal para validações em Pull Requests e deploys de Preview:
```bash
npm run test:e2e:smoke
```

### Bateria Completa E2E
Executa todas as specs funcionais, de segurança e de rotas:
```bash
npm run test:e2e
```

### Modo Interativo com UI
Abre o painel visual do Playwright com timeline e depuração:
```bash
npm run test:e2e:ui
```

### Visualização do Relatório HTML
Gera e abre a compilação de resultados:
```bash
npm run test:e2e:report
```

---

## 3. Configuração de Variáveis de Ambiente

Para customizar a execução local, crie o arquivo `.env.e2e` a partir do template:
```bash
cp .env.e2e.example .env.e2e
```

Parâmetros principais:
- `E2E_BASE_URL`: URL base do ambiente (padrão: `http://localhost:3000`).
- `E2E_ALLOW_DESTRUCTIVE`: Padrão `false`. Se ativado apontando para o domínio de produção, o sistema abortará imediatamente por segurança.
- `E2E_RUN_CREDIT_TESTS`: Permite testes com consumo de créditos em staging.
- `E2E_RUN_ADMIN_MUTATION_TESTS`: Permite testes de cadastro de motos em staging.
- `E2E_RUN_CLEANUP`: Ativa limpeza seletiva baseada em `E2E_RUN_ID`.
