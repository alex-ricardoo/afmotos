# Feature Specification: Admin Panel Fixes

**Feature Branch**: `[005-admin-fixes]`

**Created**: 2026-08-21

**Status**: Draft

**Input**: User description: "/speckit-specify Você é um Principal Software Engineer..."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Diagnóstico Técnico e RLS (Priority: P1)

O administrador precisa conseguir editar e criar motos sem se deparar com erros de RLS.

**Why this priority**: Erros de RLS bloqueiam completamente as operações do painel administrativo, impedindo a gestão da plataforma.

**Independent Test**: Acessar o formulário de uma moto existente, alterar uma propriedade e salvar. Se salvar sem erro, a permissão está correta.

**Acceptance Scenarios**:

1. **Given** um usuário logado como Admin e o formulário preenchido de uma moto, **When** o admin submeter, **Then** a moto é persistida no Supabase sem erro "new row violates row-level security policy".
2. **Given** um usuário não autenticado ou sem permissões de Admin, **When** tenta editar dados, **Then** recebe mensagem de "Sua sessão expirou" ou erro de permissão tratada.

---

### User Story 2 - Formulários Administrativos e Design System (Priority: P1)

O administrador precisa visualizar um painel legível e funcional para distinguir modos de edição/criação, com a identidade visual da marca aplicada (Brand Black, Brand Gold).

**Why this priority**: A usabilidade atual e contraste estão comprometidos, e não se distingue adição de edição.

**Independent Test**: Navegar até "Nova Moto" e "Editar Moto" e validar o estado dos botões, os labels, o breadcrumb e a exibição consistente da interface.

**Acceptance Scenarios**:

1. **Given** a tela de criar moto, **When** o admin a acessa, **Then** os breadcrumbs mostram "Admin / Motos / Nova moto" e o título é "Cadastrar motocicleta".
2. **Given** a tela de editar, **When** o admin a acessa, **Then** o breadcrumb mostra "Editar Moto" e aparece o modelo da moto no cabeçalho com ID/Badge atualizado.
3. **Given** interações com o formulário, **Then** ele apresenta estados de Carregando, Salvando, Sucesso, e Alterações não salvas de forma clara, sem usar `alert()`.

---

### User Story 3 - Data Tables Legíveis e Funcionais (Priority: P2)

O administrador precisa visualizar tabelas de motos e propostas (leads) com contraste adequado, colunas responsivas, a logo do admin carregada das configurações, e botões de ação consistentes.

**Why this priority**: Visibilidade básica da listagem de dados comerciais.

**Independent Test**: Visualizar as listagens em desktop e mobile e validar se o scroll, botões, contrastes e loadings funcionam.

**Acceptance Scenarios**:

1. **Given** a listagem de motos ou leads, **When** o admin a acessa, **Then** a tabela está legível (sem linhas invisíveis ou textos brancos no branco) e exibe dados provenientes do banco.
2. **Given** a view mobile, **When** o dispositivo encolhe, **Then** as tabelas oferecem um responsive card view ou um scroll adequado.

---

### User Story 4 - Traduções Centralizadas (Priority: P2)

O administrador precisa ver termos como AVAILABLE, SOLD, RENTAL em português (Disponível, Vendida, Locação) nas tabelas, toasts e formulários.

**Why this priority**: Necessário para a legibilidade final por parte de operadores não-técnicos.

**Independent Test**: Checar tabela de listagem de leads e motos para confirmar as traduções de status e tipos.

**Acceptance Scenarios**:

1. **Given** motos listadas, **When** visualizadas na tabela, **Then** os status aparecem como "Disponível" e não "AVAILABLE".
2. **Given** formulários e badges, **When** alterando um estado, **Then** a UI exibe os labels em português, mantendo o en-US apenas no core DB.

---

### Edge Cases

- What happens when a imagem falha no upload? -> Exibe estado "Upload falhou" no preview da imagem.
- How does system handle RLS exception de fato? -> Ao invés de um erro genérico da interface ou crash, mostra um feedback visual "Não foi possível salvar. Você não tem permissão para realizar esta ação."
- How does system handle a moto não encontrada (ID inválido)? -> Renderiza estado de "Moto não encontrada" no formulário de edição.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema MUST resolver qualquer falha de Row-Level Security que cause erros na atualização ou criação de motos para perfis administrativos, garantindo que o admin execute operações livremente e público/anon não o faça.
- **FR-002**: O sistema MUST usar a logo carregada da tabela `site_settings` na sidebar, header administrativo e tela de login admin.
- **FR-003**: O sistema MUST exibir o Painel de Propostas/Leads com métricas reais, tabela de listagem de contatos e filtros.
- **FR-004**: O sistema MUST consolidar o Design System utilizando a paleta oficial da AF Motos (fundo escuro de alto contraste, elementos Brand Gold) no ambiente administrativo.
- **FR-005**: O sistema MUST separar claramente a operação Editar Moto de Cadastrar Moto, exibindo seções divididas (Identificação, Especificações, Comercial, Descrição, Imagens, Publicação).
- **FR-006**: O sistema MUST substituir quaisquer mock data e logs genéricos (alert()) por feedbacks de UI contextualizados e dados providos via consultas conectadas ao Supabase.
- **FR-007**: O sistema MUST aplicar as traduções em toda a UI usando um módulo ou dicionário central de status/operações/categorias.

### Key Entities

- **Motorcycle**: Registro do catálogo de motocicletas.
- **Lead / Proposal**: Leads comerciais, registros de contato para vendas ou locação.
- **Site Setting**: Configurações de plataforma que abrigam logo oficial e metadados.
- **Profile**: Tabela de perfis gerida pelo fluxo Auth para identificação de rules e controle do `is_admin()`.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Administrador consegue submeter e editar motos 100% das vezes sem erro RLS na policy.
- **SC-002**: As cores de fundo, textos secundários e primários atendem à taxa de contraste para usabilidade (legibilidade plena garantida nas tabelas e forms).
- **SC-003**: 100% dos status em inglês restritos à UI agora usam o módulo centralizado de traduções em português.
- **SC-004**: Data tables renderizam dados vivos com estados de "Carregando" / "Sucesso" / "Erro", sem mock data, comprovados por queries funcionais.
- **SC-005**: Lint, typecheck e pipeline de build do frontend concluem 100% sem erros após as refatorações.

## Assumptions

- O projeto já possui a infraestrutura Next.js (App Router) e as bibliotecas shadcn configuradas para o UI.
- Há um client Supabase disponível para as requisições (server/client).
- A tabela `site_settings` ou equivalentes possuem um campo (texto/JSON) capaz de armazenar URL da logo.
- O diagnóstico do erro de RLS implicará numa pequena migration de SQL sem apagar nenhum dado do banco de produção.
