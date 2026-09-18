# Feature Specification: Auditoria E2E de Caixa-Preta com Playwright MCP e Base de Testes Reproduzíveis

**Feature Branch**: `test/e2e-black-box-audit`

**Created**: 2026-09-18

**Status**: Draft

**Input**: User description: "Auditoria E2E de Caixa-Preta com Playwright MCP e Base de Testes Reproduzíveis para a aplicação AF Motos, cobrindo fluxos públicos, autenticação, área do cliente, consultas veiculares, créditos, pagamentos Mercado Pago, painel administrativo, segurança de permissões, acessibilidade e responsividade, sem executar ações destrutivas em produção e sem aplicar correções de código durante a auditoria."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Auditoria Segura de Caixa-Preta no Navegador via Browser Automation (Priority: P1)

Como engenheiro de qualidade e auditor de segurança, quero navegar e auditar a aplicação real pelo navegador utilizando automação de browser (Playwright MCP), simulando jornadas autênticas de visitantes, clientes e administradores, para diagnosticar comportamentos anômalos, inconsistências visuais, falhas de autorização e erros de console sem causar alterações destrutivas em produção.

**Why this priority**: É a essência da auditoria de caixa-preta: verificar o comportamento empírico do produto em tempo de execução exatamente como um usuário real interage, identificando riscos antes de qualquer lançamento ou refatoração.

**Independent Test**: Pode ser testado de ponta a ponta navegando pelas rotas públicas, formulários de autenticação, área do cliente e painel administrativo em ambiente seguro (Vercel Preview / Localhost isolado), gerando registros de navegação e snapshots de acessibilidade sem executar mutações destrutivas.

**Acceptance Scenarios**:

1. **Given** um ambiente seguro (Vercel Preview ou ambiente de teste isolado), **When** a ferramenta de automação acessa as páginas públicas (Home, Histórico Veicular, Termos e Privacidade), **Then** todas as páginas devem renderizar sem exceções de console, com navegação funcional e sem layout quebrado em resoluções desktop e mobile.
2. **Given** um usuário visitante não autenticado, **When** tenta acessar rotas restritas de `/cliente` ou `/admin`, **Then** o sistema deve redirecionar para a respectiva tela de login sem expor dados internos ou telas brancas.
3. **Given** um usuário autenticado com perfil de cliente comum, **When** tenta acessar o painel administrativo (`/admin`), **Then** o sistema deve negar o acesso e proteger os dados gerenciais.
4. **Given** qualquer ação com potencial de mutação financeira ou cadastral (checkout, concessão de crédito, estorno, cadastro de moto), **When** o ambiente apontar para produção (`afmotos.vercel.app`) ou flags destrutivas estiverem desativadas (`E2E_ALLOW_DESTRUCTIVE=false`), **Then** a ação deve ser estritamente bloqueada e catalogada como "bloqueada por segurança" no relatório.

---

### User Story 2 - Estrutura de Testes E2E Reproduzíveis com Page Objects e Fixtures (Priority: P2)

Como desenvolvedor e mantenedor do projeto AF Motos, quero dispor de uma suíte completa e versionada de testes ponta a ponta (Playwright Test) com Page Object Models, fixtures de dados isolados e scripts dedicados, para que a equipe possa executar regressões contínuas e checagens rápidas (smoke) em pipelines de integração contínua e ambientes de preview.

**Why this priority**: A auditoria manual/exploratória se perde se não for convertida em uma bateria automatizada reproduzível que garanta a permanência da qualidade a cada novo deploy.

**Independent Test**: Pode ser testado executando o comando de testes automatizados (`npm run test:e2e:smoke` ou `npm run test:e2e`) apontado para o ambiente de testes, verificando que os casos de teste executam de maneira determinística, geram relatórios consolidados e não deixam lixo residual não controlado.

**Acceptance Scenarios**:

1. **Given** a configuração de testes instalada, **When** o comando `npm run test:e2e:smoke` for invocado, **Then** os testes smoke de rotas públicas, autenticação e proteção de rotas devem executar em modo headless e reportar o resultado com reporter configurado.
2. **Given** testes de dados que necessitem criar entidades de teste, **When** executados em ambiente permitido, **Then** todos os identificadores, nomes e placas devem utilizar obrigatoriamente o prefixo `E2E_` (ex.: placas `E2E1A23`) conforme a política de dados estabelecida.
3. **Given** a execução da suíte E2E, **When** configurada a variável `E2E_BASE_URL` apontando para a URL de produção sem autorização explícita de destruição, **Then** o runner deve abortar a execução de mutações para impedir efeitos colaterais em produção.

---

### User Story 3 - Rastreabilidade, Evidências e Política de Privacidade de Testes (Priority: P3)

Como auditor de conformidade e segurança da informação, quero que todos os testes, evidências coletadas, screenshots e logs de execução respeitem regras estritas de não exposição de dados sensíveis (sem tokens, segredos, senhas reais, CPFs reais ou placas reais de terceiros), mantendo uma matriz de testes clara e rastreável.

**Why this priority**: Evita incidentes de segurança cibernética ou violações à LGPD durante a própria auditoria, garantindo conformidade operacional.

**Independent Test**: Pode ser testado inspecionando todos os arquivos gerados em `docs/testing/` e capturas de tela para assegurar ausência de dados pessoais, tokens de sessão ou chaves de API.

**Acceptance Scenarios**:

1. **Given** a execução de auditoria e testes, **When** evidências (screenshots, relatórios, snapshots de DOM) forem persistidas, **Then** nenhum segredo de API (Mercado Pago, API Brasil, Supabase Service Role) nem dado pessoal identificável real deve constar nos artefatos.
2. **Given** a matriz de testes `e2e-test-matrix.md`, **When** um cenário não puder ser executado por ausência de sandbox isolado, **Then** seu status deve constar explicitamente como "bloqueado" com a pré-condição faltante e o risco associado.

---

### User Story 4 - Backlog Priorizado de Vulnerabilidades e Inconsistências (Priority: P4)

Como gestor de produto e líder técnico, quero receber um inventário estruturado de todos os problemas encontrados durante a auditoria (bugs funcionais, riscos de integridade de crédito, falhas de autorização, acessibilidade e UX), com severidade classificada e sem correções automáticas de código aplicadas, para planejar features de correção de forma segura e contextualizada.

**Why this priority**: Permite que o time avalie o impacto das falhas de maneira analítica, separando melhorias visuais de vulnerabilidades críticas de negócio antes de realizar alterações cirúrgicas.

**Independent Test**: Pode ser testado validando o documento `docs/testing/e2e-known-issues.md` e o relatório final `docs/testing/e2e-test-report.md`, confirmando que nenhuma lógica de negócio ou migration foi modificada durante a auditoria.

**Acceptance Scenarios**:

1. **Given** um problema identificado durante a navegação exploratória ou automação, **When** catalogado no relatório de problemas, **Then** deve conter severidade padronizada (Crítica, Alta, Média, Baixa), passos de reprodução, impacto esperado, evidência observada e recomendação técnica.
2. **Given** o encerramento da auditoria, **When** inspecionado o diff da branch `test/e2e-black-box-audit`, **Then** nenhum arquivo de lógica da aplicação (`app/`, `lib/`, `supabase/migrations/`) deve ter sido alterado com correções de bugs, preservando a fidelidade da auditoria de caixa-preta.

---

### Edge Cases

- O que acontece se a URL de preview não estiver acessível ou retornar erro 500/502? A auditoria deve catalogar o incidente no relatório de ambiente, sinalizar o bloqueio dos testes dependentes e não tentar execução em produção como fallback.
- Como o sistema se comporta se o usuário testar a compra de pacote de créditos com manipulação de preço no cliente? O teste deve certificar se o backend rejeita a divergência de valor ou se gera preference com valor canônico.
- O que acontece se duas requisições concorrentes tentarem consumir o último crédito de consulta de um cliente simultaneamente? O teste de concorrência deve verificar se apenas uma reserva é efetivada sem gerar saldo negativo no ledger de créditos.
- Como a interface lida com a indisponibilidade ou falta de saldo no provedor externo de dados veiculares (API Brasil)? A auditoria deve verificar se o cliente recebe mensagem amigável sem exposição de dados técnicos, chaves de API ou falhas não tratadas.
- O que acontece se o usuário clicar repetidas vezes no botão de confirmação de pagamento ou uso de crédito? A interface e os testes devem validar presença de debounce/idempotência impedindo chamadas duplicadas.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema de testes DEVE suportar navegação automatizada e inspeção de página utilizando a integração com Playwright MCP para validação real no navegador.
- **FR-002**: O ambiente de execução DEVE validar a variável `E2E_BASE_URL` e impedir a realização de qualquer ação destrutiva caso o alvo seja o domínio de produção oficial (`afmotos.vercel.app`).
- **FR-003**: Toda e qualquer ação destrutiva ou de mutação (cadastro de usuário, concessão de crédito, checkout simulado, alteração de cadastro) DEVE estar condicionada a flags explícitas (`E2E_ALLOW_DESTRUCTIVE=true`, `E2E_RUN_PAYMENT_SIMULATION=true`, `E2E_RUN_CREDIT_TESTS=true`, `E2E_RUN_ADMIN_MUTATION_TESTS=true`).
- **FR-004**: O projeto DEVE disponibilizar arquivo `.env.e2e.example` contendo a especificação das variáveis necessárias para os testes E2E sem valores reais de segredos, senhas ou tokens.
- **FR-005**: O projeto DEVE incluir documentação prévia do ambiente de teste em `docs/testing/e2e-test-environment.md` declarando status de prontidão, runtime, branch, commit e ações permitidas/bloqueadas.
- **FR-006**: O projeto DEVE definir a política de manipulação de dados em `docs/testing/e2e-data-policy.md`, estabelecendo o uso estrito do prefixo `E2E_` para nomes, identificadores, veículos e clientes de teste.
- **FR-007**: A suíte de testes automatizados DEVE ser estruturada sob o diretório `tests/e2e/` com divisão por responsabilidade: `fixtures/`, `page-objects/`, `public/`, `auth/`, `customer/`, `admin/`, `security/` e `smoke/`.
- **FR-008**: O arquivo de configuração `playwright.config.ts` DEVE ser implementado no repositório configurando Chromium como navegador principal, timeouts resilientes, captura de traces e screenshots em caso de falha e relatórios em formato HTML e console.
- **FR-009**: O arquivo `package.json` DEVE disponibilizar scripts dedicados (`test:e2e`, `test:e2e:smoke`, `test:e2e:ui`, `test:e2e:headed`, `test:e2e:report`) sem sobrescrever nem remover os scripts de build e desenvolvimento já existentes.
- **FR-010**: A auditoria DEVE validar os cenários do **Grupo A (Smoke Público)**: renderização de Home, navegação principal, rodapé, landing de Histórico Veicular, CTAs seguros, Termos de Uso, Política de Privacidade, páginas de erro 404 e integridade responsiva.
- **FR-011**: A auditoria DEVE validar os cenários do **Grupo B (Autenticação)**: login com credenciais válidas e inválidas, validação de campos vazios, logout, redirecionamento pós-login, bloqueio de rotas protegidas para anônimos e para clientes comuns tentando acessar a área administrativa.
- **FR-012**: A auditoria DEVE registrar como bloqueado qualquer teste de criação de novo usuário em ambientes compartilhados que não possuam isolamento prévio de base de dados, detalhando os passos manuais correspondentes.
- **FR-013**: A auditoria DEVE validar os cenários do **Grupo C (Área do Cliente)**: carregamento do perfil, isolamento de dados de outros clientes, consulta e validação sintática de placas (aceitando formatos válidos e rejeitando inválidos), visualização de saldo e extrato de créditos.
- **FR-014**: A auditoria DEVE cobrir cenários de **Créditos de Consulta (Grupo D)** somente em ambientes com simulação segura, testando exibição do botão "Usar 1 crédito", idempotência de consumo, comportamento em falha e prevenção de duplo clique.
- **FR-015**: A auditoria DEVE verificar os cenários de **Checkout Pro e Pacotes (Grupo E)** exclusivamente em modo sandbox/teste do Mercado Pago, validando cálculo correto de preço por crédito, pacote personalizado via WhatsApp sem criação de checkout indevido, e rejeição de liberação de créditos puramente por manipulação de query string (`status=approved`).
- **FR-016**: A auditoria DEVE inspecionar cenários de **Consulta e Laudo (Grupo F)**, atestando que laudos de simulação (mock) jamais sejam exibidos com selo oficial em produção e que mensagens de falha externa de provedor sejam amigáveis e desprovidas de rastreamento técnico para o cliente.
- **FR-017**: A auditoria DEVE validar cenários do **Painel Administrativo (Grupo G)**, incluindo bloqueio de usuários não-admin, carregamento do dashboard, gestão de estoque de motos (sem permitir valores negativos ou códigos duplicados) e visualização de relatórios gerenciais e financeiros.
- **FR-018**: A auditoria DEVE verificar vetores de **Segurança e Limites (Grupo H)**: proteção contra enumeração de UUID de consultas de terceiros, proteção contra manipulação de preços em requisições de pagamento, verificação de assinatura de webhooks e ausência de tokens ou segredos em logs e no DOM.
- **FR-019**: A auditoria DEVE avaliar aspectos de **Acessibilidade e Responsividade (Grupo I)**: navegação completa por teclado em telas de autenticação e modais, labels acessíveis em inputs, feedback para leitores de tela e visualização adequada em viewports móveis.
- **FR-020**: Todo achado de inconsistência ou falha DEVE ser documentado em `docs/testing/e2e-known-issues.md` com metadados completos de reprodução, severidade (Crítica, Alta, Média, Baixa) e recomendação de remediação.
- **FR-021**: Ao término das atividades, a auditoria DEVE consolidar todos os resultados, escopo executado, cenários bloqueados e recomendações no relatório `docs/testing/e2e-test-report.md`.
- **FR-022**: O agente e os testes NÃO DEVEM aplicar nenhuma correção automática de código na aplicação (arquivos de regra de negócio, componentes visuais ou migrations de banco) durante esta feature.
- **FR-023**: Qualquer consulta de dados no Supabase para verificação de consistência pós-teste DEVE ser estritamente em modo de leitura (`SELECT`), sem invocar mutações em tabelas remotas não autorizadas.
- **FR-024**: Todo arquivo de evidência visual (screenshots) DEVE ser armazenado em `docs/testing/screenshots/` e mascarar ou omitir qualquer dado pessoal de terceiros ou dados financeiros reais.
- **FR-025**: A feature DEVE ser encapsulada e versionada na branch de trabalho `test/e2e-black-box-audit`.

### Key Entities _(include if feature involves data)_

- **TestEnvironmentContext**: Representa os metadados do ambiente auditado (URL base de teste, commit/branch de origem, runtime, modo de operação do gateway de pagamento, modo do provedor veicular e bandeiras de permissão destrutiva).
- **E2ETestMatrixItem**: Representa a unidade da matriz de rastreabilidade contendo identificador único (ex.: A-01, B-05, H-02), módulo, cenário, tipo de teste, pré-condição, dados mock empregados, resultado esperado, status da execução (passou, falhou, bloqueado) e severidade.
- **E2EIssueRecord**: Registro estruturado de problema catalogado contendo ID único do achado, severidade, rota/URL afetada, passos de reprodução determinísticos, comportamento esperado versus observado, impacto potencial e recomendação arquitetural.
- **E2ETestReport**: Documento mestre de auditoria compilando o resumo executivo, métricas de conformidade dos módulos, matriz consolidada de execuções e lista de verificação de segurança/privacidade.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% dos 9 grupos de cenários (Grupos A a I) descritos no escopo são cobertos pela matriz de testes, com cada item com status explicitamente declarado (passou, falhou, bloqueado com justificativa documentada).
- **SC-002**: 0 (zero) operações destrutivas ou requisições de faturamento real em produção durante todo o ciclo de auditoria.
- **SC-003**: 100% dos scripts e configurações de teste E2E criados (`tests/e2e/`, `playwright.config.ts`, `.env.e2e.example`) executam sem erros de sintaxe ou de dependência quando disparados via runner de testes.
- **SC-004**: Execução da suíte rápida de smoke (`npm run test:e2e:smoke`) conclui em menos de 3 minutos em ambiente local ou de preview.
- **SC-005**: 100% dos problemas detectados no navegador ou nos testes automatizados são documentados com todos os campos obrigatórios em `docs/testing/e2e-known-issues.md` sem nenhuma alteração não-autorizada nos arquivos-fonte da aplicação.
- **SC-006**: Todos os relatórios de teste gerados são validados quanto à conformidade de privacidade, com 0 (zero) segredos de API ou credenciais de produção expostos nos artefatos.

## Assumptions

- O ambiente prioritário para testes com mutação de dados é um Preview Deployment da Vercel ou ambiente de desenvolvimento local devidamente isolado do banco de produção.
- Caso não haja ambiente com isolamento total para criação de novos usuários no Supabase Auth ou checkout sandbox, os cenários correlatos serão classificados formalmente como "bloqueados por falta de ambiente seguro", documentando-se o procedimento de teste manual correspondente.
- A aplicação não terá suas regras de negócio nem seus componentes corrigidos nesta feature; a entrega foca exclusivamente na auditoria de caixa-preta, no levantamento do backlog de melhorias e na implantação da infraestrutura de testes automatizados reproduzíveis.
- As placas utilizadas em testes de validação sintática respeitarão o padrão Mercosul e nacional adotando formatos fictícios de teste pré-definidos (ex.: `E2E1A23`, `E2E2B34`, `E2E3C45`) para prevenir chamadas ou associações com veículos reais.
