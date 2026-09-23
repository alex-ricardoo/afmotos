# Catálogo de Problemas Conhecidos e Fragilidades E2E

**Feature**: Auditoria E2E de Caixa-Preta e Base de Testes Reproduzíveis  
**Data**: 2026-09-18  
**Regra Estrita**: Nenhuma anomalia foi corrigida no código da aplicação durante esta auditoria. Todos os achados estão catalogados para priorização e resolução em sprint dedicada.  
**Referência**: [plan.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/040-e2e-black-box-playwright-audit/plan.md) | [data-model.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/040-e2e-black-box-playwright-audit/data-model.md)

---

## 1. Issue E2E-001: Next.js Image com `fill` em Container com Posição Estática

- **Severidade**: Baixa
- **Módulo**: Rotas Públicas (Home)
- **Ambiente**: Localhost / Preview
- **URL**: `http://localhost:3001/`
- **Pré-condições**: Acessar a Home com console do navegador aberto.
- **Passos para Reproduzir**:
  1. Abrir a página principal `/`.
  2. Inspecionar o console do navegador (`browser_console_messages`).
  3. Observar aviso emitido pelo runtime do Next.js.
- **Comportamento Observado**: Warning no console: `Image with src "https://i.ibb.co/..." has "fill" and parent element with invalid "position". Provided "static" should be one of absolute,fixed,relative.`
- **Comportamento Esperado**: O container pai da imagem deve possuir classe `relative`, `absolute` ou `fixed` no CSS/Tailwind para evitar problemas de layout shift.
- **Evidência**: Log do console capturado na exploração assistida Playwright MCP.
- **Impacto**: Não quebra a renderização, mas pode gerar inconsistência de dimensionamento de banner em determinadas resoluções.
- **Hipótese Técnica**: O container que envolve a imagem externa não incluiu a classe `relative` no Tailwind.
- **Recomendação**: Adicionar `relative` ao container em futura task de frontend.
- **Status**: Aberto

---

## 2. Issue E2E-002: Ausência de Atributos `data-testid` em Elementos de Ação Dinâmica

- **Severidade**: Baixa
- **Módulo**: Portal do Cliente / Dashboard
- **Ambiente**: Todos
- **URL**: `/cliente`, `/cliente/consultas`
- **Pré-condições**: Inspeção de DOM para automação de testes.
- **Passos para Reproduzir**:
  1. Analisar os componentes de listagem e botões de ação na área do cliente.
  2. Notar ausência de atributos `data-testid` consistentes.
- **Comportamento Observado**: A automação precisa recorrer a seletores de texto ou classes CSS para localizar determinados cards e botões.
- **Comportamento Esperado**: Presença de `data-testid="consultation-card"`, `data-testid="credit-balance"`, facilitando a robustez dos testes contra refatorações visuais.
- **Evidência**: Snapshot de acessibilidade obtido via Playwright MCP.
- **Impacto**: Maior sensibilidade dos testes automatizados a mudanças cosméticas de cópia.
- **Hipótese Técnica**: Componentes construídos prioritariamente com shadcn/ui e rótulos acessíveis, sem instrumentação explícita de teste.
- **Recomendação**: Instrumentar gradualmente `data-testid` sem alterar comportamento visual.
- **Status**: Aberto

---

## 3. Issue E2E-003: Automação Headless Bloqueada para Fluxo de Consentimento Google OAuth

- **Severidade**: Média
- **Módulo**: Autenticação
- **Ambiente**: Preview / Staging
- **URL**: `/cliente/login`
- **Pré-condições**: Executar teste E2E automatizado de login via Google em modo headless.
- **Passos para Reproduzir**:
  1. Acionar o botão "Entrar com o Google".
  2. Tentar automatizar a tela externa `accounts.google.com`.
- **Comportamento Observado**: O Google detecta automação headless e apresenta telas de consentimento complexas ou desafios de segurança.
- **Comportamento Esperado**: Login social é desenhado para interação humana no navegador real.
- **Evidência**: Documentado no roteiro de testes manuais (`docs/testing/e2e-manual-checklist.md`).
- **Impacto**: Impossibilidade de rodar login social 100% autônomo em pipelines de CI sem mocks dedicados de sessão.
- **Hipótese Técnica**: Políticas padrão de bot-detection do Google Identity Services.
- **Recomendação**: Adotar mocks de sessão Supabase (`auth.fixture.ts`) em CI e manter validação manual em homologação.
- **Status**: Aberto (Tratado como limitação externa conhecida)

---

## 4. Issue E2E-004: Necessidade de Branch Database Supabase para Mutações de Cadastro em CI

- **Severidade**: Média
- **Módulo**: Banco de Dados / CI
- **Ambiente**: Preview / CI
- **URL**: `/cliente/cadastro`
- **Pré-condições**: Rodar suíte de testes completa sem poluir o banco compartilhado.
- **Passos para Reproduzir**:
  1. Executar múltiplos cadastros automatizados em ambiente de preview apontado para banco único.
- **Comportamento Observado**: Risco de acúmulo de usuários descartáveis na tabela `auth.users` e `customer_profiles`.
- **Comportamento Esperado**: Execução isolada em branch database temporário descartado ao final do PR.
- **Evidência**: Princípio V da Constituição AF Motos e isolamento de segurança em `e2e-data-policy.md`.
- **Impacto**: Exige que testes de cadastro permaneçam condicionados ou executados manualmente até disponibilização de infraestrutura de branching de banco.
- **Hipótese Técnica**: Ambiente de preview atualmente compartilha instância de Supabase.
- **Recomendação**: Implementar Supabase Database Branching no pipeline do GitHub Actions / Vercel.
- **Status**: Aberto
