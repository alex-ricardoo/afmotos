# Matriz de Testes e Rastreabilidade E2E: AF Motos

**Feature**: Auditoria E2E de Caixa-Preta e Base de Testes Reproduzíveis  
**Data**: 2026-09-18  
**Ambiente**: Local / Vercel Preview  
**Versão**: 1.0.0

---

## Grupo A: Rotas Públicas, SEO e Navegação

| ID | Cenário | Tipo | Pré-condição | Ambiente | Dados | Passos | Resultado Esperado | Status | Evidência / Notas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **A-01** | Carregamento da Home e Vitrine | smoke | Servidor ativo | Preview/Local | N/A | Acessar `/` | HTTP 200, título presente, H1 renderizado | passou | `tests/e2e/public/home.spec.ts` |
| **A-02** | Catálogo de Motos Seminovas | functional | Servidor ativo | Preview/Local | N/A | Acessar `/motos` | HTTP 200, cards ou lista visíveis | passou | `tests/e2e/public/home.spec.ts` |
| **A-03** | Landing Histórico Veicular | functional | Servidor ativo | Preview/Local | N/A | Acessar `/historico-veicular` | Form de consulta e benefícios visíveis | passou | `tests/e2e/public/historico-veicular.spec.ts` |
| **A-04** | Política de Privacidade | functional | Servidor ativo | Preview/Local | N/A | Acessar `/politica-de-privacidade` | Conteúdo LGPD completo | passou | `tests/e2e/public/privacy-policy.spec.ts` |
| **A-05** | Termos de Uso | functional | Servidor ativo | Preview/Local | N/A | Acessar `/termos-de-uso` | Termos e regras de laudo visíveis | passou | `tests/e2e/public/terms-of-use.spec.ts` |
| **A-06** | Redirect Canônico `/termos` | functional | Servidor ativo | Preview/Local | N/A | Acessar `/termos` | Redireciona para `/termos-de-uso` | passou | `tests/e2e/public/terms-of-use.spec.ts` |
| **A-07** | Redirect Canônico `/venda-sua-moto` | functional | Servidor ativo | Preview/Local | N/A | Acessar `/venda-sua-moto` | Redireciona para `/anunciar-sua-moto` | passou | Validado via Playwright MCP |
| **A-08** | Erro 404 Amigável | functional | Servidor ativo | Preview/Local | N/A | Acessar rota inexistente | Exibe tela 404 com botão de retorno | passou | `tests/e2e/public/navigation.spec.ts` |

---

## Grupo B: Autenticação, Cadastro e Recuperação

| ID | Cenário | Tipo | Pré-condição | Ambiente | Dados | Passos | Resultado Esperado | Status | Evidência / Notas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **B-01** | Login com Senha Incorreta | functional | Servidor ativo | Preview/Local | E-mail cliente, senha errada | Submeter login | Exibe aviso de credenciais incorretas | passou | `tests/e2e/auth/login.spec.ts` |
| **B-02** | Botão Desabilitado com Campos Vazios | functional | Servidor ativo | Preview/Local | N/A | Acessar `/cliente/login` | Botão permanece desabilitado | passou | `tests/e2e/auth/login.spec.ts` |
| **B-03** | Validação Sintática de E-mail | functional | Servidor ativo | Preview/Local | E-mail inválido | Digitar e-mail sem @ | Validação acusa formato incorreto | passou | `tests/e2e/auth/password-recovery.spec.ts` |
| **B-04** | Bloqueio de Acesso Anônimo a `/cliente` | security | Sem sessão | Preview/Local | N/A | Acessar `/cliente` | Redireciona para `/cliente/login` | passou | `tests/e2e/auth/route-protection.spec.ts` |
| **B-05** | Aceite Mandatório de Termos | functional | Servidor ativo | Preview/Local | N/A | Inspecionar `/cliente/cadastro` | Links de termos e privacidade visíveis | passou | `tests/e2e/auth/legal-acceptance.spec.ts` |
| **B-06** | Encerramento de Sessão (Logout) | functional | Sem sessão | Preview/Local | N/A | Acessar `/cliente` sem cookie | Mantém redirecionamento para login | passou | `tests/e2e/auth/logout.spec.ts` |
| **B-07** | Login Social Google | manual | Conta Google | Preview | Credencial Google | Clicar em Entrar com Google | Exige consentimento e tela OAuth externa | bloqueado | Dependência de OAuth externo |
| **B-08** | Criação de Conta Nova | functional | Base descartável | Staging | E-mail sintético `E2E_` | Submeter cadastro | Criação em base descartável | bloqueado | Requer branch de DB descartável |

---

## Grupo C: Área do Cliente, Perfil e Consultas

| ID | Cenário | Tipo | Pré-condição | Ambiente | Dados | Passos | Resultado Esperado | Status | Evidência / Notas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **C-01** | Proteção da Rota de Perfil | security | Sem sessão | Preview/Local | N/A | Acessar `/cliente/perfil` | Redireciona para login | passou | `tests/e2e/customer/profile.spec.ts` |
| **C-02** | Proteção da Rota de Consultas | security | Sem sessão | Preview/Local | N/A | Acessar `/cliente/consultas` | Redireciona para login | passou | `tests/e2e/customer/consultation-status.spec.ts` |
| **C-03** | Validação Sintática de Placa | functional | Servidor ativo | Preview/Local | Placa inválida `INVALIDO99` | Submeter consulta | Erro de formato de placa inválida | passou | `tests/e2e/customer/consultation-create.spec.ts` |
| **C-04** | Proteção da Rota de Pagamento Individual | security | Sem sessão | Preview/Local | N/A | Acessar `/cliente/pagamento` | Redireciona para login | passou | `tests/e2e/customer/payment-individual.spec.ts` |
| **C-05** | Acesso ao Laudo com Validação de Ownership | security | Sem sessão | Preview/Local | UUID aleatório | Acessar `/cliente/consultas/[id]` | Redireciona para login ou 404 | passou | `tests/e2e/customer/report-access.spec.ts` |
| **C-06** | Isolamento de Dados Cadastrais | functional | Sessão cliente | Staging | Perfil cliente | Tentar mudar ID de cliente | Proibido alteração indevida | passou | Validado por RLS Supabase |
| **C-07** | Link de Contato WhatsApp com Mensagem Codificada | functional | Servidor ativo | Preview/Local | N/A | Clicar em link de WhatsApp | Abre URL `wa.me` sem PII exposta | passou | Validado via Playwright MCP |

---

## Grupo D: Gestão de Créditos e Pacotes

| ID | Cenário | Tipo | Pré-condição | Ambiente | Dados | Passos | Resultado Esperado | Status | Evidência / Notas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **D-01** | Proteção da Rota de Extrato de Créditos | security | Sem sessão | Preview/Local | N/A | Acessar `/cliente/creditos` | Redireciona para login | passou | `tests/e2e/customer/credit-balance.spec.ts` |
| **D-02** | Proteção da Vitrine de Pacotes | security | Sem sessão | Preview/Local | N/A | Acessar `/cliente/pacotes` | Redireciona para login | passou | `tests/e2e/customer/credit-packages.spec.ts` |
| **D-03** | Consumo de Crédito para Consulta | functional | `E2E_RUN_CREDIT_TESTS=true` | Staging | Saldo > 0 | Clicar Usar 1 Crédito | Deduz 1 crédito no ledger | bloqueado | Requer sandbox habilitado |
| **D-04** | Concorrência de Débito de Último Crédito | security | `E2E_RUN_CREDIT_TESTS=true` | Staging | Saldo = 1 | 2 requisições paralelas | 1 sucesso e 1 recusado | bloqueado | Requer sandbox habilitado |

---

## Grupo E: Integração de Pagamentos e Checkout

| ID | Cenário | Tipo | Pré-condição | Ambiente | Dados | Passos | Resultado Esperado | Status | Evidência / Notas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **E-01** | Proteção contra Query String Falsa de Retorno | security | Sem sessão | Preview/Local | `status=approved` falso | Acessar `/cliente/pagamento?status=approved` | Não libera créditos; redireciona | passou | `tests/e2e/security/payment-return-security.spec.ts` |
| **E-02** | Preços Canônicos Definidos pelo Servidor | security | Servidor ativo | Preview/Local | N/A | Inspecionar ofertas de consulta | Valores canônicos respeitados | passou | `tests/e2e/security/price-tampering.spec.ts` |
| **E-03** | Checkout Pro Mercado Pago Sandbox | functional | `MERCADO_PAGO_CHECKOUT_MODE=test` | Staging | Cartão de teste MP | Concluir pagamento | Transação aprovada e crédito liberado | bloqueado | Requer sandbox ativo no ambiente |

---

## Grupo F: Painel Administrativo e Estoque

| ID | Cenário | Tipo | Pré-condição | Ambiente | Dados | Passos | Resultado Esperado | Status | Evidência / Notas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **F-01** | Bloqueio de Acesso Anônimo a `/admin` | security | Sem sessão | Preview/Local | N/A | Acessar `/admin` | Redireciona para `/admin/login` | passou | `tests/e2e/admin/dashboard.spec.ts` |
| **F-02** | Bloqueio com Credenciais Inválidas | security | Servidor ativo | Preview/Local | Usuário incorreto | Submeter login em `/admin/login` | Permanece na tela com erro | passou | `tests/e2e/admin/admin-access.spec.ts` |
| **F-03** | Proteção da Rota de Motos | security | Sem sessão | Preview/Local | N/A | Acessar `/admin/motos` | Redireciona para `/admin/login` | passou | `tests/e2e/admin/admin-rbac.spec.ts` |
| **F-04** | Proteção da Rota de Clientes | security | Sem sessão | Preview/Local | N/A | Acessar `/admin/clientes` | Redireciona para `/admin/login` | passou | `tests/e2e/admin/customer-management.spec.ts` |
| **F-05** | Proteção da Rota de Créditos | security | Sem sessão | Preview/Local | N/A | Acessar `/admin/creditos` | Redireciona para `/admin/login` | passou | `tests/e2e/admin/credit-management.spec.ts` |
| **F-06** | Proteção da Central de Pagamentos | security | Sem sessão | Preview/Local | N/A | Acessar `/admin/pagamentos-consultas` | Redireciona para `/admin/login` | passou | `tests/e2e/admin/payment-refund-center.spec.ts` |
| **F-07** | Proteção dos Relatórios Gerenciais | security | Sem sessão | Preview/Local | N/A | Acessar `/admin/relatorios` | Redireciona para `/admin/login` | passou | `tests/e2e/admin/vehicle-history-reports.spec.ts` |
| **F-08** | Criação de Motos com Prefixo `E2E_` | functional | `E2E_RUN_ADMIN_MUTATION_TESTS=true` | Staging | Moto mock | Submeter cadastro de moto | Moto salva na base com `E2E_` | bloqueado | Requer flag de mutação ativada |

---

## Grupo G: Governança, RBAC e Segurança IDOR

| ID | Cenário | Tipo | Pré-condição | Ambiente | Dados | Passos | Resultado Esperado | Status | Evidência / Notas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **G-01** | Bloqueio de Cliente Comum no Admin | security | Sessão de cliente | Preview/Local | Conta cliente | Tentar acessar `/admin` | Redireciona para login/unauthorized | passou | `tests/e2e/customer/customer-rbac.spec.ts` |
| **G-02** | Proteção Contra IDOR em Relatórios | security | Sem sessão | Preview/Local | N/A | Acessar rotas financeiras | Bloqueio efetivo | passou | `tests/e2e/security/authorization-boundaries.spec.ts` |
| **G-03** | Proteção contra Exibição de Selo Oficial Fictício | security | Servidor ativo | Preview/Local | N/A | Acessar prévias veiculares | Não emite selo oficial falso | passou | `tests/e2e/security/mock-report-protection.spec.ts` |
| **G-04** | Auditoria de Segredos no DOM | security | Servidor ativo | Preview/Local | N/A | Inspecionar HTML de todas as rotas | Ausência de tokens e service role | passou | `tests/e2e/security/sensitive-data-exposure.spec.ts` |

---

## Grupo H: Responsividade Mobile e Acessibilidade

| ID | Cenário | Tipo | Pré-condição | Ambiente | Dados | Passos | Resultado Esperado | Status | Evidência / Notas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **H-01** | Responsividade Mobile (375x667) | responsive | Servidor ativo | Preview/Local | N/A | Setar viewport mobile na Home | Sem scroll horizontal quebrado | passou | `tests/e2e/public/responsive-public-pages.spec.ts` |
| **H-02** | Navegação por Teclado (Tab/Enter) | accessibility | Servidor ativo | Preview/Local | N/A | Navegar via teclado no login | Foco visível e acionável | passou | Validado em acessibilidade |

---

## Grupo I: Observabilidade, Resiliência e Integridade

| ID | Cenário | Tipo | Pré-condição | Ambiente | Dados | Passos | Resultado Esperado | Status | Evidência / Notas |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **I-01** | Guardrail Fatal em Produção | security | `E2E_ALLOW_DESTRUCTIVE=true` | Produção | N/A | Disparar runner contra afmotos.vercel.app | Aborta com CRITICAL SAFETY VIOLATION | passou | `tests/e2e/fixtures/environment.ts` |
| **I-02** | Smoke Test Público Completo | smoke | Servidor ativo | Preview/Local | N/A | Rodar `test:e2e:smoke` | Todas as rotas essenciais OK | passou | `tests/e2e/smoke/public-smoke.spec.ts` |
| **I-03** | Smoke Test de Autenticação | smoke | Servidor ativo | Preview/Local | N/A | Rodar smoke auth | Telas de login saudáveis | passou | `tests/e2e/smoke/auth-smoke.spec.ts` |
| **I-04** | Smoke Test Administrativo | smoke | Servidor ativo | Preview/Local | N/A | Rodar smoke admin | Login admin saudável | passou | `tests/e2e/smoke/admin-smoke.spec.ts` |
| **I-05** | Preservação de Dados (Sem Cleanup Indevido) | security | `E2E_RUN_CLEANUP=false` | Preview/Local | N/A | Rodar testes | Nenhum dado é deletado | passou | `tests/e2e/fixtures/cleanup.ts` |
