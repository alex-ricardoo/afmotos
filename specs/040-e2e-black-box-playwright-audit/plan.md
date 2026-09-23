# Implementation Plan: E2E Black-Box Audit with Playwright MCP

## Technical Context

A auditoria de caixa-preta e a base de testes automatizados E2E da AF Motos operam sobre uma aplicação full-stack moderna e estruturada, avaliando a integridade das regras de negócio, interfaces e segurança sem modificar lógicas produtivas nem executar mutações destrutivas.

- **Framework Web**: Next.js `16.3.2` (App Router com Server Components, Server Actions e Route Handlers).
- **Linguagem & Tipagem**: TypeScript `^5` em modo estrito (`strict: true`), com suporte a path aliases (`@/*`).
- **Framework de UI & Estilização**: React `19.2.8`, Tailwind CSS `v4` (`@tailwindcss/postcss: ^4`), Lucide React, Radix UI Primitives (`@radix-ui/react-label`, `@radix-ui/react-slot`), Sonner (toasts).
- **Camada de Dados & Autenticação**: Supabase (`@supabase/supabase-js: ^2.112.3`, `@supabase/ssr: ^0.12.4`) com Supabase Auth, Row Level Security (RLS) e PostgreSQL.
- **Integrações Externas**:
  - Provedor Veicular: API Brasil (`VEHICLE_LOOKUP_MODE` com modos `live` e `mock`).
  - Gateway de Pagamento: Mercado Pago Checkout Pro (`mercadopago: 2.12.0`, `MERCADO_PAGO_CHECKOUT_MODE=test` ou `production`).
  - IA / OCR: Gemini (`GEMINI_API_KEY`) e OpenRouter.
- **Infraestrutura de Testes Existente**:
  - Node Test Runner nativo (`node --experimental-strip-types --test lib/**/__tests__/*.test.ts`) para testes unitários.
  - `@playwright/test: ^1.63.0` já presente em `devDependencies` do `package.json`, pronto para estruturação da suíte E2E.
- **Hospedagem & Deploy**: Vercel com Preview Deployments automáticos por branch e ambiente de produção no domínio `afmotos.vercel.app`.
- **Ferramental MCP**:
  - `playwright`: Automação e navegação real via browser (Chromium/Webkit) com snapshots de acessibilidade, captura de telas e inspeção de rede.
  - `supabase-mcp-server`: Inspeção em modo estritamente somente leitura (`SELECT`) para validação pós-teste.
  - `vercel`: Consulta de build/runtime logs e status de deployments.

---

## Current-State Findings

A inspeção detalhada do repositório revelou a arquitetura atual e as superfícies de teste:

1. **Rotas Públicas (`app/(public)`)**:
   - Home (`/`), Catálogo de motos (`/motos`), Detalhe de moto (`/motos/[slug]`), Histórico Veicular (`/historico-veicular`), Sobre (`/sobre`), Anunciar sua moto (`/anunciar-sua-moto`), Política de Privacidade (`/politica-de-privacidade`), Termos de Uso (`/termos-de-uso`), e redirects canônicos (`/termos` → `/termos-de-uso`, `/venda-sua-moto` → `/anunciar-sua-moto`).
2. **Rotas de Autenticação e Cliente (`app/cliente`)**:
   - `/cliente/login`: Autenticação via e-mail/senha e suporte a Google OAuth.
   - `/cliente/cadastro`: Criação de conta vinculada a aceite dos termos/privacidade.
   - `/cliente` (Dashboard): Exibe histórico de consultas e saldo de créditos (`CustomerDashboardPage`).
   - `/cliente/perfil`: Gestão de dados cadastrais.
   - `/cliente/consultas`: Histórico e nova consulta por placa com validação de formato.
   - `/cliente/creditos`: Extrato de créditos e botão de uso de créditos.
   - `/cliente/pacotes`: Catálogo de pacotes de crédito com cálculo de economia e link WhatsApp para pacotes corporativos.
   - `/cliente/pagamento`: Tela de checkout individual Mercado Pago com retorno seguro.
3. **Rotas Administrativas Protegidas (`app/admin`)**:
   - `/admin/login`: Login restrito com guard de admin em `lib/auth/admin-guard.ts` validando tabela `admin_profiles`.
   - `/admin`: Dashboard gerencial.
   - `/admin/motos`: Cadastro, edição e listagem de estoque.
   - `/admin/clientes`: Listagem e detalhes de clientes cadastrados.
   - `/admin/creditos` & `/admin/creditos-consultas`: Concessão manual de créditos com exigência de motivo e bloqueio de saldo negativo.
   - `/admin/pagamentos-consultas`: Central de pagamentos, estornos e conciliação.
   - `/admin/relatorios` & `/admin/historico-veicular`: Relatórios de faturamento, informe contábil e configuração de preços.
4. **Proteções de RLS e Autorização**:
   - Separação entre cliente e admin em Server Components e Server Actions.
   - Endpoints de entrega de laudos exigem ownership (`auth.uid() = user_id`) ou permissão de admin.
5. **Estado dos Componentes**:
   - A maioria das telas utiliza seletores acessíveis baseados em rótulos (`label`, `aria-label`, headings semânticos) e shadcn/ui primitives. Alguns botões e containers ainda não possuem `data-testid`, o que direciona a estratégia inicial para seletores baseados em papéis acessíveis (`getByRole`, `getByLabel`, `getByText`).

---

## Test Environment Strategy

Para prevenir qualquer dano operacional ou financeiro em produção, a auditoria adota isolamento absoluto de ambientes.

### Matriz de Ambientes e Ações

| Componente / Fluxo | Ambiente Obrigatório | Ambiente Proibido | Regra de Execução |
| :--- | :--- | :--- | :--- |
| **Navegação Pública** | Vercel Preview ou Localhost | Produção para mutações | Somente leitura de conteúdo e SEO |
| **Login / Autenticação** | Usuário E2E em Preview / Local | Usuário real pessoal | Uso de credenciais de teste isoladas |
| **Cadastro de Novo Usuário** | Supabase Staging/Branch | Produção compartilhada | Bloqueado se não houver base descartável |
| **Mercado Pago Checkout** | Sandbox / Test Mode | Produção (Live Credentials) | Bloqueado sem credenciais de teste |
| **Consulta Veicular** | API Brasil Mock / Simulação | API Brasil Live com saldo real | Simulação via flags server-side |
| **Gestão de Créditos** | Contas E2E em Preview | Clientes reais de produção | Bloqueado sem flags explícitas |
| **Mutação Admin de Motos** | Dados com prefixo `E2E_` | Motos reais em estoque | Exige `E2E_RUN_ADMIN_MUTATION_TESTS=true` |
| **Estorno / Refund** | Sandbox simulado | Estorno bancário real | Bloqueado em produção |

### Guardrails de Segurança para `E2E_BASE_URL`

- O arquivo de configuração `playwright.config.ts` e as fixtures do sistema devem inspecionar `process.env.E2E_BASE_URL`.
- Se a URL contiver `afmotos.vercel.app` e qualquer teste destrutivo for solicitado (`E2E_ALLOW_DESTRUCTIVE=true`), o runner de teste deve lançar um erro fatal imediatamente, abortando a execução antes de abrir qualquer página.

---

## Data Safety and Isolation Strategy

### Política de Dados e Nomenclatura

1. **Prefixo Obrigatório**: Toda entidade criada por testes deve conter o prefixo `E2E_` (ex.: Nome: `E2E_Cliente_Teste`, Moto: `E2E_Yamaha_Fazer_250`, Placa: `E2E1A23`).
2. **Identificador de Execução (`E2E_RUN_ID`)**:
   - Cada sessão de teste gera um token temporal único no padrão: `e2e-YYYYMMDD-HHMM-XXXX` (ex.: `e2e-20260918-0915-a7b2`).
   - Esse identificador é incorporado aos metadados de notas, referências de pedidos e descrições para rastreabilidade e limpeza seletiva.
3. **Placas Fictícias Homologadas**:
   - Para testes sintáticos e de integração mock: `E2E1A23`, `E2E2B34`, `E2E3C45`.
   - Jamais utilizar placas de veículos reais de terceiros ou de clientes da loja.

### Arquivo `.env.e2e.example`

```env
# Alvo de Execução E2E (Usar Vercel Preview ou Localhost)
E2E_BASE_URL=https://af-motos-git-test-e2e-black-box-audit-alex-ricardoo.vercel.app

# Credenciais de Teste Isoladas (NUNCA USAR CONTAS REAIS DE PRODUÇÃO)
E2E_TEST_CUSTOMER_EMAIL=e2e_customer@afmotos.test
E2E_TEST_CUSTOMER_PASSWORD=E2E_SecurePassword123!

E2E_TEST_ADMIN_EMAIL=e2e_admin@afmotos.test
E2E_TEST_ADMIN_PASSWORD=E2E_AdminPassword123!

# Flags de Segurança e Permissões de Mutação
E2E_ALLOW_DESTRUCTIVE=false
E2E_RUN_CREDIT_TESTS=false
E2E_RUN_PAYMENT_SIMULATION=false
E2E_RUN_ADMIN_MUTATION_TESTS=false
E2E_RUN_CLEANUP=false
```

---

## Playwright MCP Exploration Strategy

A exploração inicial de caixa-preta utiliza ativamente o **Playwright MCP** para validação orgânica no navegador antes da consolidação dos testes automáticos.

### Fluxo Operacional com Playwright MCP

1. **Abertura do Ambiente**: Navegar para a URL de teste validando código HTTP e renderização inicial.
2. **Auditoria de Acessibilidade & DOM**: Executar snapshots de acessibilidade (`browser_snapshot`) nas rotas-chave para identificar falhas estruturais, falta de labels e quebras de contraste.
3. **Exploração de Fluxos Públicos**:
   - Navegação por menu principal, links de rodapé, catálogo de seminovas e landing de Histórico Veicular.
   - Verificação de comportamento responsivo alterando viewports (`browser_resize`).
4. **Auditoria de Autenticação**:
   - Testar login com dados inválidos, verificando anúncios visuais e sonoros de erro.
   - Login com usuário E2E cliente e validação de redirecionamento.
5. **Auditoria da Área do Cliente**:
   - Inspeção de saldo de créditos, tabela de consultas anteriores e validação de máscara no formulário de placa.
6. **Auditoria do Painel Administrativo**:
   - Testar bloqueio de rota `/admin` para anônimos e para perfil de cliente comum.
   - Login como admin E2E e navegação pelas abas de motos, clientes e relatórios.
7. **Critérios Estritos de Captura de Screenshot**:
   - Screenshots (`browser_take_screenshot`) são geradas apenas em evidências de erros de layout, falhas de validação, erros de console ou comprovação de bloqueios de segurança.
   - Nenhuma captura conterá tokens, senhas ou dados pessoais.

---

## Playwright Test Architecture

A suíte automatizada versionada utiliza `@playwright/test` como runner nativo, configurada em `playwright.config.ts`.

### Diretrizes de Configuração

- **Navegador Padrão**: Chromium em modo headless para velocidade e estabilidade. Firefox e WebKit configurados como projetos opcionais.
- **Workers**: 1 worker para testes de crédito/pagamento/admin (evita conflitos de concorrência e race conditions) e múltiplos workers para testes públicos de leitura.
- **Retries**: 0 em ambiente local, 2 em pipeline de CI.
- **Evidências Automatizadas**:
  - `screenshot: 'only-on-failure'`
  - `video: 'retain-on-failure'`
  - `trace: 'on-first-retry'`
- **Reporters**: `list` (console) + `html` (gerado em `playwright-report/`, ignorado no Git).
- **Projetos**:
  - `smoke`: Cenários rápidos de alta prioridade (público, login, status básico).
  - `e2e`: Bateria completa funcional e de segurança.

---

## Repository Structure

```text
playwright.config.ts
.env.e2e.example

tests/
└── e2e/
    ├── README.md
    ├── fixtures/
    │   ├── auth.fixture.ts        # Fixture para autenticação limpa e injeção de sessão
    │   ├── test-data.ts           # Geradores de dados padronizados com prefixo E2E_
    │   ├── test-users.ts          # Contas e personas de teste
    │   ├── environment.ts         # Validador de segurança do ambiente
    │   ├── cleanup.ts             # Funções de limpeza segura baseadas em E2E_RUN_ID
    │   └── assertions.ts          # Custom assertions para laudos e status
    │
    ├── page-objects/
    │   ├── public-pages.page.ts   # Mapeamento da Home, Catálogo e Institucional
    │   ├── login.page.ts          # Form de login e validações
    │   ├── signup.page.ts         # Form de cadastro e aceite de termos
    │   ├── customer-dashboard.page.ts # Painel do cliente e histórico
    │   ├── vehicle-history.page.ts    # Consulta veicular e visualização de laudo
    │   ├── credit-packages.page.ts    # Vitrine de pacotes e checkout
    │   ├── payment.page.ts            # Telas de retorno e status de pagamento
    │   ├── admin-dashboard.page.ts    # Dashboard gerencial
    │   ├── admin-motorcycles.page.ts  # CRUD de motos
    │   ├── admin-credits.page.ts      # Concessão e ajuste de créditos
    │   ├── admin-payments.page.ts     # Central de pagamentos e estornos
    │   └── admin-reports.page.ts      # Relatórios contábeis e de margem
    │
    ├── public/
    │   ├── home.spec.ts
    │   ├── historico-veicular.spec.ts
    │   ├── privacy-policy.spec.ts
    │   ├── terms-of-use.spec.ts
    │   ├── navigation.spec.ts
    │   └── responsive-public-pages.spec.ts
    │
    ├── auth/
    │   ├── login.spec.ts
    │   ├── signup.spec.ts
    │   ├── logout.spec.ts
    │   ├── password-recovery.spec.ts
    │   ├── legal-acceptance.spec.ts
    │   └── route-protection.spec.ts
    │
    ├── customer/
    │   ├── profile.spec.ts
    │   ├── consultation-create.spec.ts
    │   ├── consultation-status.spec.ts
    │   ├── payment-individual.spec.ts
    │   ├── credit-balance.spec.ts
    │   ├── pay-with-credit.spec.ts
    │   ├── credit-packages.spec.ts
    │   ├── package-checkout.spec.ts
    │   ├── report-access.spec.ts
    │   └── customer-rbac.spec.ts
    │
    ├── admin/
    │   ├── admin-access.spec.ts
    │   ├── dashboard.spec.ts
    │   ├── motorcycle-create.spec.ts
    │   ├── motorcycle-edit.spec.ts
    │   ├── customer-management.spec.ts
    │   ├── credit-management.spec.ts
    │   ├── payment-refund-center.spec.ts
    │   ├── package-offers.spec.ts
    │   ├── vehicle-history-reports.spec.ts
    │   ├── pricing-settings.spec.ts
    │   └── admin-rbac.spec.ts
    │
    ├── security/
    │   ├── price-tampering.spec.ts
    │   ├── credit-concurrency.spec.ts
    │   ├── authorization-boundaries.spec.ts
    │   ├── payment-return-security.spec.ts
    │   ├── mock-report-protection.spec.ts
    │   └── sensitive-data-exposure.spec.ts
    │
    └── smoke/
        ├── public-smoke.spec.ts
        ├── auth-smoke.spec.ts
        ├── customer-smoke.spec.ts
        └── admin-smoke.spec.ts

docs/testing/
├── e2e-test-environment.md
├── e2e-data-policy.md
├── e2e-test-matrix.md
├── e2e-test-report.md
├── e2e-known-issues.md
├── e2e-risk-register.md
├── e2e-manual-checklist.md
└── screenshots/
```

---

## Authentication Test Strategy

- **Login Negativo**: Submissão sem preenchimento, e-mail malformatado e senha incorreta. Avaliar mensagens acessíveis e preservação de foco.
- **Login Positivo**: Injeção de credenciais E2E via variáveis de ambiente, verificação de redirecionamento seguro para `/cliente` ou `/admin`.
- **Proteção de Rotas & Sessão**:
  - Usuário anônimo acessando `/cliente/perfil` → redirecionado para `/cliente/login`.
  - Usuário anônimo acessando `/admin` → redirecionado para `/admin/login`.
  - Cliente comum autenticado acessando `/admin` → redirecionado para `/admin/login?error=unauthorized` com bloqueio de perfil.
- **Persistência de Sessão**: Armazenamento seguro de estados de autenticação em `playwright/.auth/customer.json` e `playwright/.auth/admin.json` (ignorados pelo Git).
- **Conformidade Legal**: Validação da exigência de checkbox de aceite de Termos de Uso e Política de Privacidade na tela de cadastro.

---

## Public Experience Test Strategy

- **Home & Vitrine**: Renderização dos banners hero, grid de motos em destaque, chamada para simulação de financiamento e formulário de captação de lead.
- **Histórico Veicular**: Exibição dos benefícios da checagem veicular, tabela comparativa de pacotes e campo de consulta prévia.
- **Políticas e Termos**: Carregamento íntegro das rotas `/politica-de-privacidade` e `/termos-de-uso` com verificação de metadados canônicos e ausência de links quebrados.
- **Tratamento 404**: Acesso a URL inexistente (`/rota-inexistente-e2e`) deve exibir a página de erro amigável (`app/not-found.tsx`) com link de retorno à Home.
- **Performance & SEO Visual**: Verificação de headings semânticos (`h1`, `h2`), tags OpenGraph e meta tags obrigatórias conforme a Constituição da AF Motos.

---

## Customer Experience Test Strategy

- **Painel & Perfil**: Validação de exibição do nome do cliente, e-mail e status de conformidade LGPD. Testar edição de telefone sem permissão de alteração indevida de e-mail/identificador.
- **Consulta Veicular**:
  - Validação sintática do input de placa (rejeição de caracteres especiais ou tamanhos inválidos, aceitação do padrão Mercosul e cinza).
  - Verificação de exibição dos estados de loading e feedback de busca.
- **Visualização de Laudos**:
  - Garantir que o laudo renderize apenas informações de consultas pagas ou autorizadas.
  - Comprovar que o cliente não tem acesso visual ao laudo de outro cliente via adulteração de UUID na URL.
- **Suporte WhatsApp**: Validação de links externos para WhatsApp garantindo codificação adequada da mensagem sem dados sensíveis na URL.

---

## Credit and Package Test Strategy

Executado exclusivamente em ambiente seguro com `E2E_RUN_CREDIT_TESTS=true`:

- **Exibição do Botão "Usar 1 Crédito"**: Deve aparecer visível e acionável somente se o saldo do cliente for maior que zero.
- **Isolamento Transacional**: O consumo de crédito para consulta veicular deve gerar movimentação no ledger interno de créditos sem emitir cobrança nem Preference no Mercado Pago.
- **Concorrência e Idempotência**:
  - Testar envio concorrente de duas solicitações no mesmo milissegundo pelo mesmo cliente com saldo de apenas 1 crédito.
  - Validar que uma reserva é confirmada e a outra é recusada com mensagem de saldo insuficiente, impedindo saldo negativo no ledger.
- **Falhas de Provedor**:
  - Em falha definitiva de consulta (ex.: placa inexistente ou provedor offline), validar que o crédito reservado é devolvido ao saldo disponível do cliente.

---

## Payment and Refund Test Strategy

Executado exclusivamente com credenciais de teste do Mercado Pago (`MERCADO_PAGO_CHECKOUT_MODE=test`):

- **Integridade de Valores**:
  - Comprovar que os valores cobrados são definidos canonicamente pelo backend. Qualquer alteração de payload enviada pelo cliente no checkout deve ser ignorada ou rejeitada.
- **Manipulação de Retorno via URL**:
  - Tentar acessar `/cliente/pagamento?status=approved&collection_id=123` diretamente no navegador. O sistema DEVE validar o estado real da transação no banco e não liberar créditos ou laudos apenas pelo parâmetro de query string.
- **Webhooks & Idempotência**:
  - Envio simulado de webhook do Mercado Pago com e sem assinatura criptográfica `x-signature`. Webhooks inválidos devem retornar erro 401/400.
  - Reenvio do mesmo webhook aprovado não deve conceder créditos adicionais.
- **Proteção contra Estornos Indevidos**:
  - Consultas pagas com crédito de consulta não devem possuir opção nem gatilho de estorno financeiro via Mercado Pago.

---

## Administrative Experience Test Strategy

Executado com dados `E2E_` e flag `E2E_RUN_ADMIN_MUTATION_TESTS=true`:

- **Gestão de Estoque de Motos**:
  - Cadastro de moto `E2E_` com validação de campos obrigatórios.
  - Tentativa de cadastro com preço negativo ou valor zero deve ser rejeitada pela validação de esquema.
  - Edição de moto existente garantindo atualização correta de status (disponível, reservada, vendida).
- **Gestão de Clientes e Créditos**:
  - Pesquisa de clientes por nome e e-mail.
  - Concessão de créditos manual por administrador exigindo motivo explícito e registrando histórico de auditoria.
  - Bloqueio de ajuste manual que resulte em saldo de créditos negativo.
- **Relatórios Gerenciais**:
  - Visualização de resumos de consultas, despesas e margem operacional.
  - Validação de que exportações de dados respeitam autorização estrita de admin.

---

## Security and Authorization Test Strategy

- **Controle de Acesso Baseado em Papéis (RBAC)**:
  - Verificação de que tokens de usuários com papel de cliente não conseguem executar Server Actions administrativas nem invocar endpoints sob `/api/admin/*`.
- **Prevenção de IDOR (Insecure Direct Object References)**:
  - Cliente A tenta carregar a consulta ou laudo do Cliente B alterando o ID na URL. O sistema deve retornar 404 ou 403.
- **Proteção contra Adulteração de Preços**:
  - O endpoint de criação de pedidos de pacotes não deve aceitar campos de preço ou desconto enviados pelo frontend.
- **Vazamento de Segredos**:
  - Inspecionar o código-fonte gerado no DOM e respostas de requisições de rede para garantir que `MERCADO_PAGO_ACCESS_TOKEN`, `APIBRASIL_TOKEN` e `SUPABASE_SERVICE_ROLE_KEY` nunca sejam vazados para o cliente.

---

## Accessibility and Responsive Test Strategy

- **Navegação por Teclado**:
  - Formulários de login, cadastro e modais de confirmação devem ser 100% navegáveis via tecla `Tab`, permitindo acionamento via `Enter`/`Space` e fechamento via `Escape`.
- **Rótulos e Semântica**:
  - Todos os campos de formulário devem possuir `<label>` associado ou atributo `aria-label` descritivo.
  - Hierarquia correta de headings com um único `<h1>` por página.
- **Responsividade Mobile**:
  - Testes com emulação de viewport mobile (375x667 e 412x915).
  - Verificação de menus hambúrguer, tabelas com scroll horizontal ou visualização em cartões, e áreas de toque mínimas para botões (mínimo de 44x44px).

---

## Supabase Validation Strategy

- **Acesso Estritamente de Leitura**: Todas as inspeções no banco de dados Supabase via MCP ou scripts de verificação devem ser executadas com consultas `SELECT`, sem mutações ad-hoc não rastreadas.
- **Tabelas Monitoradas**:
  - `customer_profiles`, `customer_plate_consultations`, `payment_transactions`, `payment_refunds`, `customer_credit_balances`, `customer_credit_ledger`, `customer_credit_reservations`.
- **Mascaramento em Evidências**: Identificadores pessoais, CPFs e e-mails reais eventualmente inspecionados em consultas devem ser devidamente ofuscados nos relatórios (ex.: `c***@afmotos.test`).

---

## Vercel Observability Strategy

- **Inspeção de Deployments**: Consulta do status do Preview Deployment associado à branch `test/e2e-black-box-audit` para garantir estado `READY`.
- **Análise de Runtime Logs**: Em caso de erros 500 ou falhas de requisição durante os testes E2E, inspecionar logs da Vercel para identificar stack traces no servidor sem expor segredos nos relatórios de teste.

---

## Evidence and Documentation Strategy

Todos os artefatos de documentação serão mantidos sob `docs/testing/`:

1. `e2e-test-environment.md`: Especificação completa do ambiente, commit, variáveis ativas e matriz de permissões.
2. `e2e-data-policy.md`: Regras de criação, uso e descarte de dados sintéticos de teste com prefixo `E2E_`.
3. `e2e-test-matrix.md`: Matriz contendo todos os cenários dos Grupos A a I com rastreamento de status e evidências.
4. `e2e-known-issues.md`: Catálogo detalhado de todos os bugs e fragilidades encontrados.
5. `e2e-risk-register.md`: Matriz de riscos operacionais, técnicos e de conformidade.
6. `e2e-manual-checklist.md`: Procedimentos manuais para cenários que exigem validação assistida ou dependem de serviços externos não automatizados.
7. `e2e-test-report.md`: Relatório executivo final compilando estatísticas, diagnósticos e recomendações.

---

## Issue Triage and Severity Model

| Severidade | Critérios de Classificação | Exemplo |
| :--- | :--- | :--- |
| **Crítica** | Vulnerabilidade de segurança, perda financeira, concessão indevida de crédito, estorno incorreto, vazamento de chaves ou quebra de RLS. | Cliente consome laudo de terceiro; query string libera crédito sem pagamento aprovado. |
| **Alta** | Fluxo operacional essencial bloqueado sem alternativa; falha de autenticação; admin impedido de operar estoque. | Erro 500 ao abrir lista de clientes; falha no cálculo de pacotes. |
| **Média** | Comportamento incorreto de interface com contorno disponível; inconsistência visual relevante; falha de responsividade parcial. | Tabela desformatada em telas pequenas; mensagem de erro genérica em falha externa. |
| **Baixa** | Ajustes cosméticos, melhorias de contraste secundário, ortografia ou refinamento de microcópia. | Espaçamento incorreto de ícone; link secundário com foco visual sutil. |

**Regra Estrita**: Nenhum bug encontrado será corrigido no código da aplicação durante esta feature. Todos os achados serão apenas documentados e categorizados.

---

## Test Execution Phases

### Fase 0: Setup e Verificação do Ambiente Seguro
- Configurar branch `test/e2e-black-box-audit`.
- Validar `E2E_BASE_URL` garantindo que não aponta para o domínio de produção.
- Criar `.env.e2e.example` e documentar premissas em `docs/testing/e2e-test-environment.md`.

### Fase 1: Fundação do Playwright Test
- Criar `playwright.config.ts`.
- Adicionar scripts de teste ao `package.json` mantendo os scripts existentes intactos.
- Atualizar `.gitignore` com pastas de relatórios e dados de autenticação.
- Estruturar diretórios em `tests/e2e/` (fixtures, page objects e specs).

### Fase 2: Exploração de Caixa-Preta via Playwright MCP
- Executar navegação real pelo navegador via Playwright MCP nas rotas públicas, de autenticação, cliente e admin.
- Capturar snapshots de acessibilidade e registrar primeiros comportamentos anômalos.

### Fase 3: Implementação dos Testes Automatizados Públicos e de Autenticação
- Implementar Page Objects (`public-pages.page.ts`, `login.page.ts`, `signup.page.ts`).
- Codificar e validar specs de rotas públicas e autenticação/RBAC.

### Fase 4: Implementação dos Testes de Cliente e Consultas
- Implementar Page Objects de área do cliente e consulta veicular.
- Codificar specs funcionais de validação de placa, histórico e laudos.

### Fase 5: Validação de Fluxos Financeiros e Segurança
- Implementar specs de integridade de preços, concorrência de créditos e proteção de rotas.
- Documentar cenários que dependem de sandbox indisponível como bloqueados.

### Fase 6: Validação de Acessibilidade e Responsividade
- Codificar testes de navegação por teclado e auditoria de contraste e viewports móveis.

### Fase 7: Consolidação de Relatórios e Evidências
- Consolidar a matriz de testes (`e2e-test-matrix.md`), relatório executivo (`e2e-test-report.md`) e backlog de problemas (`e2e-known-issues.md`).

---

## CI and Preview Strategy

- **Pipelines em Pull Requests**:
  - Execução obrigatória de lint e typecheck (`npm run lint`, `npm run typecheck`).
  - Execução automática da suíte smoke (`npm run test:e2e:smoke`) apontada para o Preview Deployment da Vercel gerado no PR.
- **Testes Abrangentes em QA / Manual**:
  - Bateria completa (`npm run test:e2e`) executada de forma agendada ou sob demanda em ambiente de staging isolado com credenciais de teste configuradas.

---

## Test Data Cleanup Strategy

- Todos os dados gerados em testes mutáveis contêm o token único `E2E_RUN_ID`.
- A limpeza de dados deve ser executada apenas quando explicitamente habilitada (`E2E_RUN_CLEANUP=true`).
- O script de limpeza (`tests/e2e/fixtures/cleanup.ts`) opera com filtros rígidos: `WHERE name LIKE 'E2E_%' AND metadata->>'run_id' = '...'`.
- Registros de auditoria financeira ou de segurança não são excluídos silenciosamente.

---

## Risks and Open Questions

1. **Disponibilidade de Banco Supabase Staging Isolado**: O projeto atualmente utiliza o banco de dados configurado no `.env.local` / Vercel. Caso não haja um branch database isolado, os testes de criação de novos usuários deverão ser catalogados como bloqueados para não poluir a base compartilhada.
2. **Configuração do Modo Teste do Mercado Pago**: O ambiente de Preview precisa estar configurado com `MERCADO_PAGO_CHECKOUT_MODE=test` e credenciais válidas de sandbox para testes de checkout end-to-end.
3. **Simulação da API Brasil**: Testes de consulta devem rodar com `VEHICLE_LOOKUP_MODE=mock` no servidor para não consumir saldos reais de consulta veicular.
4. **Google OAuth em Automação Headless**: Fluxos de OAuth externo com Google geralmente exigem resolução de CAPTCHA ou telas de consentimento complexas, recomendando-se teste manual assistido ou mock de sessão.
