# Data Model: E2E Black-Box Audit Entities

Este documento especifica o modelo de dados dos artefatos de controle, rastreabilidade e governança da auditoria de testes E2E.

---

## 1. TestEnvironmentContext

Representa o estado e as configurações do ambiente sob auditoria.

| Campo | Tipo | Descrição | Regras de Validação |
| :--- | :--- | :--- | :--- |
| `baseUrl` | `string` | URL base do ambiente testado | Deve ser URL válida; proibido `afmotos.vercel.app` para mutações |
| `branch` | `string` | Nome da branch Git ativa | Ex.: `test/e2e-black-box-audit` |
| `commitSha` | `string` | Hash do commit inspecionado | 7 ou 40 caracteres hexadecimais |
| `runtime` | `string` | Provedor de runtime e versão | Ex.: `Vercel / Node.js 20` |
| `mercadoPagoMode` | `'test' \| 'production'` | Modo do gateway de pagamento | Obrigatório `'test'` para testes de checkout |
| `vehicleLookupMode` | `'mock' \| 'live'` | Modo da integração veicular | Obrigatório `'mock'` para testes automatizados |
| `allowDestructive` | `boolean` | Flag mestre para mutações | Padrão `false` |
| `runId` | `string` | Identificador único da sessão de testes | Padrão `e2e-YYYYMMDD-HHMM-XXXX` |

---

## 2. E2ETestMatrixItem

Representa uma linha individual na matriz de testes e rastreabilidade (`docs/testing/e2e-test-matrix.md`).

| Campo | Tipo | Descrição | Regras de Validação |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Código do cenário | Formato `[A-I]-[0-9]{2}` (ex.: `A-01`, `B-06`) |
| `module` | `string` | Módulo funcional | `Público`, `Auth`, `Cliente`, `Admin`, `Créditos`, `Pagamentos`, `Segurança`, `Acessibilidade` |
| `scenario` | `string` | Descrição do caso de teste | Texto claro e conciso |
| `type` | `string` | Categoria do teste | `smoke`, `functional`, `security`, `accessibility`, `responsive`, `manual` |
| `precondition` | `string` | Estado prévio necessário | Requisitos de usuário, sessão ou dados |
| `allowedEnvironment` | `string` | Onde pode ser executado | `Preview`, `Local`, `Staging`, `Bloqueado em Produção` |
| `testData` | `string` | Dados e fixtures utilizados | Devem utilizar prefixo `E2E_` quando aplicável |
| `steps` | `string[]` | Passos determinísticos | Sequência de ações do usuário |
| `expectedResult` | `string` | Resultado esperado | Critério de validação |
| `observedResult` | `string` | Resultado verificado na prática | Preenchido após execução |
| `evidencePath` | `string?` | Caminho do arquivo de evidência | Referência relativa a `docs/testing/screenshots/` ou logs |
| `status` | `'passou' \| 'falhou' \| 'bloqueado' \| 'não_executado'` | Status do cenário | Obrigatório |
| `severityOnFailure` | `'Crítica' \| 'Alta' \| 'Média' \| 'Baixa'` | Impacto caso o teste falhe | Padronizado conforme modelo de severidade |
| `notes` | `string?` | Observações contextuais | Justificativa em caso de bloqueio ou limitações |

---

## 3. E2EIssueRecord

Representa um problema, bug ou fragilidade catalogado no documento `docs/testing/e2e-known-issues.md`.

| Campo | Tipo | Descrição | Regras de Validação |
| :--- | :--- | :--- | :--- |
| `issueId` | `string` | Identificador único do achado | Formato `E2E-[0-9]{3}` (ex.: `E2E-001`) |
| `title` | `string` | Título objetivo da anomalia | Resumo do defeito em poucas palavras |
| `severity` | `'Crítica' \| 'Alta' \| 'Média' \| 'Baixa'` | Severidade do problema | Classificado de acordo com impacto no negócio |
| `module` | `string` | Módulo afetado | Nome da área correspondente |
| `environment` | `string` | Ambiente onde foi observado | Ex.: `Vercel Preview (commit a1b2c3d)` |
| `url` | `string` | Rota ou URL afetada | Ex.: `/cliente/creditos` |
| `preconditions` | `string` | Pré-requisitos para reprodução | Estado prévio da conta/dados |
| `reproductionSteps` | `string[]` | Lista numerada de passos | Passos reproduzíveis sem ambiguidades |
| `expectedResult` | `string` | Comportamento correto esperado | Baseado em regras de negócio e UX |
| `observedResult` | `string` | Comportamento incorreto verificado | Evidência empírica |
| `evidence` | `string` | Link para captura ou snapshot | Caminho para arquivo de evidência |
| `impact` | `string` | Consequência para o negócio/usuário | Análise de risco e usabilidade |
| `technicalHypothesis` | `string` | Causa provável do problema | Hipótese arquitetural sem alteração de código |
| `recommendation` | `string` | Sugestão de remediação futura | Ação recomendada para feature posterior |
| `status` | `'aberto' \| 'bloqueado' \| 'reproduzido' \| 'resolvido'` | Ciclo de vida da issue | Inicialmente `'aberto'` ou `'reproduzido'` |

---

## 4. E2ERiskRecord

Representa um risco catalogado no registro de riscos (`docs/testing/e2e-risk-register.md`).

| Campo | Tipo | Descrição | Regras de Validação |
| :--- | :--- | :--- | :--- |
| `riskId` | `string` | Identificador do risco | Ex.: `RISK-01` |
| `description` | `string` | Descrição do evento de risco | O que pode acontecer |
| `probability` | `'Alta' \| 'Média' \| 'Baixa'` | Probabilidade de ocorrência | Estimativa técnica |
| `impact` | `'Crítico' \| 'Alto' \| 'Médio' \| 'Baixo'` | Impacto caso se materialize | Gravidade potencial |
| `module` | `string` | Módulo associado | Domínio afetado |
| `mitigation` | `string` | Estratégia de mitigação adotada | Medida de contingência ou isolamento |
| `owner` | `string` | Papel responsável | Ex.: `Engenheiro de QA / Auditor E2E` |
| `status` | `'Ativo' \| 'Mitigado' \| 'Monitorado'` | Estado do risco | Obrigatório |
