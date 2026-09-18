# Tasks: Auditoria E2E de Caixa-Preta com Playwright MCP e Base de Testes Reproduzíveis

**Feature Branch**: `test/e2e-black-box-audit`  
**Input**: [spec.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/040-e2e-black-box-playwright-audit/spec.md) | [plan.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/040-e2e-black-box-playwright-audit/plan.md)  
**Status**: Completed

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inicialização dos arquivos de configuração, scripts do package.json e guardrails essenciais do Playwright.

- [X] T001 Criar arquivo `.env.e2e.example` com template seguro de variáveis sem segredos em `.env.e2e.example`
- [X] T002 [P] Atualizar `.gitignore` adicionando pastas geradas `playwright-report/`, `test-results/` e `playwright/.auth/` em `.gitignore`
- [X] T003 Adicionar scripts de teste E2E (`test:e2e*`) preservando scripts existentes em `package.json`
- [X] T004 Criar configuração mestre do Playwright com guardrail de produção, Chromium default e reporters em `playwright.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Implementar fixtures compartilhadas de ambiente, dados de teste e persistência de sessão requeridas por todas as histórias de usuário.

**CRITICAL**: Nenhuma spec de teste ou automação pode ser executada sem a conclusão desta fase.

- [X] T005 [P] Implementar guardrail de ambiente seguro que aborta execução destrutiva em produção em `tests/e2e/fixtures/environment.ts`
- [X] T006 [P] Implementar gerador de identificadores temporais `E2E_RUN_ID` e dados mock com prefixo `E2E_` em `tests/e2e/fixtures/test-data.ts`
- [X] T007 [P] Implementar catálogo tipado de personas e credenciais de teste para cliente e admin em `tests/e2e/fixtures/test-users.ts`
- [X] T008 [P] Implementar rotina de limpeza de dados condicionada a `E2E_RUN_CLEANUP=true` em `tests/e2e/fixtures/cleanup.ts`
- [X] T009 [P] Implementar asserções customizadas para integridade de laudos, badges e erros em `tests/e2e/fixtures/assertions.ts`
- [X] T010 Implementar fixture de autenticação com armazenamento de sessão isolada em `tests/e2e/fixtures/auth.fixture.ts`

**Checkpoint**: Fundação pronta — fixtures validadas e seguras contra operações em produção.

---

## Phase 3: User Story 1 - Auditoria Segura de Caixa-Preta via Browser Automation (Priority: P1) ⭐ MVP

**Goal**: Executar exploração viva assistida no navegador utilizando o Playwright MCP instalado no Antigravity, registrando metadados do ambiente, navegando por fluxos públicos, autenticação, cliente e admin, e capturando evidências de anomalias sem qualquer ação destrutiva.

**Independent Test**: Executar a sessão de exploração via Playwright MCP na URL de preview/teste, confirmando que todos os fluxos foram acessados de verdade pelo navegador, gerando o relatório de ambiente e os registros preliminares sem modificar banco nem disparar cobranças.

- [X] T011 [US1] Criar documento inicial de prontidão e premissas do ambiente de testes em `docs/testing/e2e-test-environment.md`
- [X] T012 [US1] Navegar por rotas públicas (Home, Catálogo, Histórico Veicular, Termos e Políticas) usando Playwright MCP e inspecionar DOM e console
- [X] T013 [US1] Testar formulário de login com cenários negativos e autenticação de cliente E2E usando Playwright MCP
- [X] T014 [US1] Navegar pela área do cliente (Dashboard, Consultas, Extrato de Créditos e Pacotes) usando Playwright MCP
- [X] T015 [US1] Testar bloqueio de rota `/admin` para cliente e anônimo, e navegar como admin E2E usando Playwright MCP
- [X] T016 [US1] Capturar e salvar screenshots pontuais de anomalias visuais ou comportamentais em `docs/testing/screenshots/`

**Checkpoint**: Auditoria exploratória via Playwright MCP concluída com êxito e evidências registradas.

---

## Phase 4: User Story 2 - Estrutura de Testes E2E Reproduzíveis com Page Objects (Priority: P2)

**Goal**: Criar a suíte automatizada versionada em `@playwright/test`, implementando Page Object Models desacoplados e specs completas para regressão contínua em CI e Preview.

**Independent Test**: Executar `npm run test:e2e:smoke` e `npm run test:e2e`, verificando que todos os testes executam de forma reproduzível, utilizam Page Objects e geram relatórios consolidados.

### Page Objects (POM)
- [X] T017 [P] [US2] Implementar Page Object de páginas públicas e navegação em `tests/e2e/page-objects/public-pages.page.ts`
- [X] T018 [P] [US2] Implementar Page Object de login e validações em `tests/e2e/page-objects/login.page.ts`
- [X] T019 [P] [US2] Implementar Page Object de cadastro e aceite legal em `tests/e2e/page-objects/signup.page.ts`
- [X] T020 [P] [US2] Implementar Page Object do dashboard e perfil do cliente em `tests/e2e/page-objects/customer-dashboard.page.ts`
- [X] T021 [P] [US2] Implementar Page Object de consulta veicular e laudo em `tests/e2e/page-objects/vehicle-history.page.ts`
- [X] T022 [P] [US2] Implementar Page Object de pacotes de crédito e checkout em `tests/e2e/page-objects/credit-packages.page.ts`
- [X] T023 [P] [US2] Implementar Page Object de telas de retorno de pagamento em `tests/e2e/page-objects/payment.page.ts`
- [X] T024 [P] [US2] Implementar Page Object do dashboard admin em `tests/e2e/page-objects/admin-dashboard.page.ts`
- [X] T025 [P] [US2] Implementar Page Object de gestão de motos no admin em `tests/e2e/page-objects/admin-motorcycles.page.ts`
- [X] T026 [P] [US2] Implementar Page Object de gestão de créditos e clientes no admin em `tests/e2e/page-objects/admin-credits.page.ts`
- [X] T027 [P] [US2] Implementar Page Object da central de pagamentos e estornos no admin em `tests/e2e/page-objects/admin-payments.page.ts`
- [X] T028 [P] [US2] Implementar Page Object de relatórios gerenciais e contábeis no admin em `tests/e2e/page-objects/admin-reports.page.ts`

### Specs de Teste: Rotas Públicas e Smoke
- [X] T029 [P] [US2] Implementar spec da Home e vitrine em `tests/e2e/public/home.spec.ts`
- [X] T030 [P] [US2] Implementar spec da landing de Histórico Veicular em `tests/e2e/public/historico-veicular.spec.ts`
- [X] T031 [P] [US2] Implementar spec de Política de Privacidade em `tests/e2e/public/privacy-policy.spec.ts`
- [X] T032 [P] [US2] Implementar spec de Termos de Uso e redirects canônicos em `tests/e2e/public/terms-of-use.spec.ts`
- [X] T033 [P] [US2] Implementar spec de navegação e links de rodapé em `tests/e2e/public/navigation.spec.ts`
- [X] T034 [P] [US2] Implementar spec de responsividade pública em viewports desktop e mobile em `tests/e2e/public/responsive-public-pages.spec.ts`
- [X] T035 [P] [US2] Implementar smoke test público rápido em `tests/e2e/smoke/public-smoke.spec.ts`

### Specs de Teste: Autenticação e Autorização
- [X] T036 [P] [US2] Implementar spec de login com credenciais válidas e inválidas em `tests/e2e/auth/login.spec.ts`
- [X] T037 [P] [US2] Implementar spec de cadastro com aceite de termos em `tests/e2e/auth/signup.spec.ts`
- [X] T038 [P] [US2] Implementar spec de encerramento de sessão em `tests/e2e/auth/logout.spec.ts`
- [X] T039 [P] [US2] Implementar spec de recuperação de senha segura em `tests/e2e/auth/password-recovery.spec.ts`
- [X] T040 [P] [US2] Implementar spec de bloqueio de cadastro sem aceite legal em `tests/e2e/auth/legal-acceptance.spec.ts`
- [X] T041 [P] [US2] Implementar spec de proteção de rotas restritas para anônimos em `tests/e2e/auth/route-protection.spec.ts`
- [X] T042 [P] [US2] Implementar smoke test de autenticação em `tests/e2e/smoke/auth-smoke.spec.ts`

### Specs de Teste: Área do Cliente e Consultas
- [X] T043 [P] [US2] Implementar spec de perfil do cliente e isolamento de campos em `tests/e2e/customer/profile.spec.ts`
- [X] T044 [P] [US2] Implementar spec de validação sintática de placa para consulta em `tests/e2e/customer/consultation-create.spec.ts`
- [X] T045 [P] [US2] Implementar spec de acompanhamento de status de consulta em `tests/e2e/customer/consultation-status.spec.ts`
- [X] T046 [P] [US2] Implementar spec de tela de pagamento individual com valor canônico em `tests/e2e/customer/payment-individual.spec.ts`
- [X] T047 [P] [US2] Implementar spec de visualização e extrato de créditos em `tests/e2e/customer/credit-balance.spec.ts`
- [X] T048 [P] [US2] Implementar spec de uso de 1 crédito para consulta em `tests/e2e/customer/pay-with-credit.spec.ts`
- [X] T049 [P] [US2] Implementar spec de vitrine de pacotes de crédito em `tests/e2e/customer/credit-packages.spec.ts`
- [X] T050 [P] [US2] Implementar spec de checkout de pacote em modo teste em `tests/e2e/customer/package-checkout.spec.ts`
- [X] T051 [P] [US2] Implementar spec de acesso ao laudo veicular com ownership em `tests/e2e/customer/report-access.spec.ts`
- [X] T052 [P] [US2] Implementar spec de RBAC de cliente bloqueando acesso a admin em `tests/e2e/customer/customer-rbac.spec.ts`
- [X] T053 [P] [US2] Implementar smoke test da área do cliente em `tests/e2e/smoke/customer-smoke.spec.ts`

### Specs de Teste: Painel Administrativo
- [X] T054 [P] [US2] Implementar spec de controle de acesso ao painel admin em `tests/e2e/admin/admin-access.spec.ts`
- [X] T055 [P] [US2] Implementar spec de dashboard gerencial admin em `tests/e2e/admin/dashboard.spec.ts`
- [X] T056 [P] [US2] Implementar spec de criação de moto E2E_ com validações em `tests/e2e/admin/motorcycle-create.spec.ts`
- [X] T057 [P] [US2] Implementar spec de edição de moto e atualização de status em `tests/e2e/admin/motorcycle-edit.spec.ts`
- [X] T058 [P] [US2] Implementar spec de busca e listagem de clientes em `tests/e2e/admin/customer-management.spec.ts`
- [X] T059 [P] [US2] Implementar spec de concessão e ajuste de crédito com motivo em `tests/e2e/admin/credit-management.spec.ts`
- [X] T060 [P] [US2] Implementar spec de visualização da central de pagamentos e refunds em `tests/e2e/admin/payment-refund-center.spec.ts`
- [X] T061 [P] [US2] Implementar spec de visualização de ofertas ativas de pacotes em `tests/e2e/admin/package-offers.spec.ts`
- [X] T062 [P] [US2] Implementar spec de relatórios contábeis e de histórico veicular em `tests/e2e/admin/vehicle-history-reports.spec.ts`
- [X] T063 [P] [US2] Implementar spec de configuração de preço e custo do laudo em `tests/e2e/admin/pricing-settings.spec.ts`
- [X] T064 [P] [US2] Implementar spec de autorização RBAC avançada de admin em `tests/e2e/admin/admin-rbac.spec.ts`
- [X] T065 [P] [US2] Implementar smoke test do painel administrativo em `tests/e2e/smoke/admin-smoke.spec.ts`

### Specs de Teste: Segurança e Resiliência
- [X] T066 [P] [US2] Implementar spec de proteção contra adulteração de preço e desconto em `tests/e2e/security/price-tampering.spec.ts`
- [X] T067 [P] [US2] Implementar spec de concorrência no consumo de último crédito em `tests/e2e/security/credit-concurrency.spec.ts`
- [X] T068 [P] [US2] Implementar spec de validação de fronteiras de autorização (IDOR) em `tests/e2e/security/authorization-boundaries.spec.ts`
- [X] T069 [P] [US2] Implementar spec de bloqueio de aprovação fraudulenta via query string em `tests/e2e/security/payment-return-security.spec.ts`
- [X] T070 [P] [US2] Implementar spec garantindo que dados mock não recebam selo oficial em `tests/e2e/security/mock-report-protection.spec.ts`
- [X] T071 [P] [US2] Implementar spec auditando ausência de tokens ou segredos no DOM em `tests/e2e/security/sensitive-data-exposure.spec.ts`

**Checkpoint**: Suíte de testes automatizados completa e pronta para execução determinística.

---

## Phase 5: User Story 3 - Rastreabilidade, Evidências e Política de Dados (Priority: P3)

**Goal**: Documentar a política de dados sintéticos de teste, consolidar a matriz de rastreabilidade completa (cenários A-01 a I-12), o registro de riscos e o roteiro de testes manuais.

**Independent Test**: Verificar que todos os arquivos em `docs/testing/` foram gerados sem dados sensíveis e com 100% dos cenários mapeados com pré-condições, passos e resultados.

- [X] T072 [US3] Criar política de governança e isolamento de dados de teste em `docs/testing/e2e-data-policy.md`
- [X] T073 [US3] Elaborar matriz de testes E2E com todos os cenários dos Grupos A a I em `docs/testing/e2e-test-matrix.md`
- [X] T074 [US3] Criar matriz e registro de riscos técnicos e de segurança em `docs/testing/e2e-risk-register.md`
- [X] T075 [US3] Criar roteiro de checagem manual para cenários com dependências bloqueadas em `docs/testing/e2e-manual-checklist.md`

**Checkpoint**: Rastreabilidade e documentação de governança de testes concluídas.

---

## Phase 6: User Story 4 - Backlog Priorizado de Vulnerabilidades e Relatório (Priority: P4)

**Goal**: Consolidar o catálogo detalhado de anomalias encontradas sem corrigi-las automaticamente no código, e compilar o relatório executivo final de auditoria.

**Independent Test**: Conferir que `docs/testing/e2e-known-issues.md` e `docs/testing/e2e-test-report.md` categorizam os achados por severidade (Crítica, Alta, Média, Baixa) com evidências, mantendo o código-fonte intacto.

- [X] T076 [US4] Catalogar todos os problemas e inconsistências detectadas em `docs/testing/e2e-known-issues.md`
- [X] T077 [US4] Elaborar relatório executivo mestre de auditoria E2E em `docs/testing/e2e-test-report.md`

**Checkpoint**: Backlog de anomalias e relatório final de auditoria homologados.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentação de instrução aos desenvolvedores, execução dos testes smoke disponíveis e verificação final de segurança.

- [X] T078 [P] Criar guia de instruções e comandos em `tests/e2e/README.md`
- [X] T079 Executar a suíte de testes smoke (`npm run test:e2e:smoke`) apontada para o ambiente seguro e validar execução
- [X] T080 Auditar o diff do Git confirmando que nenhuma lógica de negócio ou migration da aplicação foi alterada e que nenhum segredo foi commitado

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: Sem dependências — execução imediata.
- **Foundational (Phase 2)**: Depende da conclusão do Setup — BLOQUEIA a execução das User Stories.
- **User Story 1 (Phase 3)**: Depende da conclusão de Foundational — exploração real com Playwright MCP (MVP).
- **User Story 2 (Phase 4)**: Depende da conclusão de Foundational — codificação dos Page Objects e specs.
- **User Story 3 (Phase 5)**: Depende dos resultados observados em US1 e US2 para preenchimento da matriz.
- **User Story 4 (Phase 6)**: Depende da consolidação de todos os achados de US1, US2 e US3.
- **Polish (Phase 7)**: Depende da conclusão das fases anteriores.

### Parallel Opportunities
- Tarefas T002, T005, T006, T007, T008, T009 em Foundational podem ser implementadas em paralelo.
- Todos os Page Objects (T017 a T028) podem ser implementados em paralelo por operarem em arquivos desacoplados.
- Todas as specs de teste (T029 a T071) podem ser codificadas em paralelo após a conclusão dos Page Objects correspondentes.
- Tarefas de documentação T072, T073, T074, T075 e T078 podem ser desenvolvidas em paralelo.

---

## Implementation Strategy

### MVP First (User Story 1 - Exploração MCP)
1. Concluir Setup (T001-T004).
2. Concluir Foundational (T005-T010).
3. Executar User Story 1 (T011-T016): Realizar a auditoria de caixa-preta navegando via Playwright MCP.
4. **VALIDAR MVP**: Inspecionar os logs do browser, capturar as evidências e verificar o comportamento sem alterar dados de produção.

### Incremental Delivery (User Story 2 a 4)
1. Com a exploração concluída, implementar os Page Objects e specs do Playwright Test (US2).
2. Formalizar as matrizes de dados e políticas (US3).
3. Consolidar o catálogo de issues e o relatório executivo (US4).
4. Executar smoke tests e validar integridade do repositório (Polish).
