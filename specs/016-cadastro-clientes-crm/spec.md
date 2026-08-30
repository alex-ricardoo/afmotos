# Feature Specification: Cadastro e CRM de Clientes

**Feature Branch**: `016-cadastro-clientes-crm`

**Created**: 2026-08-29

**Status**: Draft

**Input**: User description: "Cadastro e CRM de Clientes — AF Motos — criar uma carteira central de clientes para a loja, unificando pessoas que chegam por diferentes canais e que podem se relacionar com múltiplos segmentos do negócio."

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Cadastro Manual de Cliente (Priority: P1)

Como administrador, quero cadastrar um cliente avulso com nome e telefone para construir a carteira de clientes da loja mesmo antes de qualquer negociação, possibilitando um relacionamento futuro.

**Why this priority**: É a base de toda a feature — sem a entidade cliente central e o CRUD básico, nenhum outro fluxo pode funcionar. É o MVP mínimo viável que entrega valor imediato.

**Independent Test**: Pode ser testado criando um cliente pela rota `/admin/clientes/novo`, verificando que ele aparece na listagem e pode ser visualizado em `/admin/clientes/[id]`.

**Acceptance Scenarios**:

1. **Given** o admin autenticado na rota `/admin/clientes/novo`, **When** preenche nome completo e telefone e clica em "Salvar cliente", **Then** o sistema cria o registro, exibe toast de sucesso e redireciona para a página de detalhes do cliente.
2. **Given** o admin não preenche nome ou telefone, **When** clica em "Salvar cliente", **Then** o sistema exibe mensagens de validação inline sem submeter o formulário.
3. **Given** o admin preenche um CPF inválido (dígitos verificadores incorretos), **When** tenta salvar, **Then** o sistema bloqueia o salvamento e exibe mensagem de erro específica no campo CPF.
4. **Given** o admin preenche um CPF válido que já existe na base, **When** tenta salvar, **Then** o sistema bloqueia a criação duplicada e exibe link para o cliente existente.
5. **Given** o admin preenche um telefone que já existe na base, **When** tenta salvar, **Then** o sistema exibe alerta de possível duplicidade com opção de "Ver cliente existente", sem bloquear a criação.

---

### User Story 2 — Listagem, Busca e Filtros (Priority: P1)

Como administrador, quero listar, buscar e filtrar clientes por diferentes critérios (nome, telefone, e-mail, CPF, origem, sexo, status e tipo de vínculo) para encontrar rapidamente a pessoa certa durante o atendimento.

**Why this priority**: Sem listagem e busca funcional, a carteira de clientes não tem utilidade operacional. É parte essencial do MVP junto com o cadastro.

**Independent Test**: Pode ser testado acessando `/admin/clientes` com dados pré-existentes e validando filtros, busca textual e paginação de forma independente.

**Acceptance Scenarios**:

1. **Given** clientes cadastrados na base, **When** o admin acessa `/admin/clientes`, **Then** a listagem exibe clientes paginados com nome, contato, origem, badges de relacionamento e data de cadastro.
2. **Given** a listagem carregada, **When** o admin digita um nome parcial na busca, **Then** a lista filtra apenas clientes cujo nome contém o termo, com debounce e paginação server-side.
3. **Given** a listagem carregada, **When** o admin aplica filtro por origem "Site — venda de moto", **Then** apenas clientes com essa origem são exibidos.
4. **Given** filtros ativos, **When** o admin clica em "Limpar filtros", **Then** todos os filtros são removidos e a listagem volta ao estado inicial.
5. **Given** filtros aplicados, **When** o admin recarrega a página, **Then** os filtros são preservados via query params na URL.
6. **Given** nenhum resultado encontrado, **When** a busca retorna vazio, **Then** o sistema exibe estado vazio com mensagem amigável e sugestão de ação.

---

### User Story 3 — Seleção e Criação de Cliente na Venda (Priority: P1)

Como administrador, quero buscar e selecionar um cliente existente ao registrar uma venda, ou criar um novo rapidamente durante o fluxo de venda, para evitar redigitar dados e manter o histórico centralizado.

**Why this priority**: Este é o ponto de integração mais crítico — a venda é o coração do negócio. Sem essa integração, o módulo de clientes fica isolado e não atende ao problema central de duplicação.

**Independent Test**: Pode ser testado na rota `/admin/vendas/nova`, buscando um cliente existente e verificando o preenchimento automático dos campos de comprador, ou criando um novo via modal e verificando a vinculação.

**Acceptance Scenarios**:

1. **Given** o admin na tela de nova venda, **When** digita um nome/telefone no campo de busca de cliente, **Then** resultados assíncronos aparecem mostrando nome, telefone, e-mail e CPF parcialmente mascarado.
2. **Given** resultados de busca exibidos, **When** o admin seleciona um cliente, **Then** os campos de comprador (nome, telefone, e-mail, CPF, endereço) são preenchidos automaticamente a partir do cadastro do cliente.
3. **Given** nenhum cliente encontrado, **When** o admin clica em "Cadastrar novo cliente", **Then** um modal/drawer abre com campos mínimos (nome, telefone, e-mail, CPF) e origem preenchida como "Registro de venda".
4. **Given** o modal de criação rápida, **When** o admin salva o novo cliente, **Then** o modal fecha, o cliente é selecionado automaticamente e os campos da venda são preenchidos.
5. **Given** um cliente selecionado, **When** o admin conclui a venda, **Then** o registro de venda é gravado com `customer_id` vinculado e os campos de snapshot (buyer_name, buyer_phone, etc.) são preservados de forma independente.
6. **Given** o admin digitou dados de comprador manualmente sem selecionar cliente, **When** conclui a venda, **Then** o sistema busca duplicata por CPF/telefone; se encontrar, pede confirmação de vinculação; se não encontrar, cria novo cliente com origem "Registro de venda".

---

### User Story 4 — Detalhes e Histórico do Cliente (Priority: P2)

Como administrador, quero ver no perfil do cliente todas as motos, propostas, vendas, anúncios, consignações e demais vínculos para entender todo o relacionamento comercial da pessoa com a loja.

**Why this priority**: Entrega a visão 360° do CRM, mas depende da existência de dados vinculados que só surgem após os fluxos P1 estarem operacionais.

**Independent Test**: Pode ser testado acessando `/admin/clientes/[id]` de um cliente que possua vendas e propostas vinculadas, verificando a exibição correta de cada aba/seção.

**Acceptance Scenarios**:

1. **Given** um cliente com vendas vinculadas, **When** o admin acessa a aba "Vendas e compras", **Then** as vendas são listadas com moto, valor, data e status, com link para o detalhe de cada venda.
2. **Given** um cliente com sell_requests vinculados, **When** o admin acessa a aba "Propostas e solicitações", **Then** as solicitações são listadas com status e link para o detalhe relevante.
3. **Given** um cliente sem nenhum vínculo, **When** o admin acessa a página de detalhes, **Then** é exibido estado vazio elegante com CTAs relevantes (Registrar venda, Ver propostas, Editar cliente).
4. **Given** a página de detalhes, **When** o admin clica no telefone, **Then** pode ligar, abrir WhatsApp ou copiar o número.

---

### User Story 5 — Associação de Clientes de Formulários do Site (Priority: P2)

Como administrador, quero que clientes originados de formulários públicos do site (vender moto, consignação, aluguel, contato) sejam associados a uma ficha única de cliente para não precisar cadastrá-los manualmente.

**Why this priority**: Automatiza a captação de leads como clientes, mas pode ser implementada incrementalmente após o CRUD principal.

**Independent Test**: Pode ser testado enviando um formulário público do site e verificando que um registro de cliente foi criado ou vinculado na base.

**Acceptance Scenarios**:

1. **Given** um visitante envia o formulário "Venda sua moto" com nome e telefone, **When** o sistema processa a solicitação, **Then** um cliente é criado (ou encontrado por deduplicação) com origem "website_sell_request" e vinculado ao sell_request.
2. **Given** o mesmo visitante envia outro formulário de contato, **When** o sistema processa, **Then** o cliente existente é encontrado por telefone e reutilizado sem duplicação; a nova solicitação é vinculada ao mesmo cliente.
3. **Given** um formulário enviado sem telefone válido, **When** o sistema processa, **Then** o sistema não cria cliente (dados insuficientes) e o lead/solicitação permanece sem customer_id.

---

### User Story 6 — Proteção contra Duplicidade (Priority: P2)

Como administrador, quero ser alertado sobre CPF, telefone ou e-mail já cadastrados antes de criar um novo cliente para manter uma base limpa e confiável.

**Why this priority**: Fundamental para integridade dos dados, mas a deduplicação é mais um refinamento da criação básica (P1).

**Independent Test**: Pode ser testado tentando criar clientes com CPF/telefone duplicados e verificando os alertas e bloqueios.

**Acceptance Scenarios**:

1. **Given** um cliente existente com CPF 123.456.789-09, **When** o admin tenta criar outro com o mesmo CPF, **Then** o sistema bloqueia a criação e mostra link "Ver cliente existente".
2. **Given** um cliente existente com telefone (81) 99999-1234, **When** o admin tenta criar outro com o mesmo telefone, **Then** o sistema exibe alerta de possível duplicidade com opção de "Ver cliente existente" ou "Criar mesmo assim".
3. **Given** um cliente existente com e-mail joao@email.com, **When** o admin tenta criar outro com o mesmo e-mail mas telefone diferente, **Then** o sistema exibe aviso informativo de possível duplicata sem bloquear a criação.

---

### User Story 7 — Edição e Inativação de Clientes (Priority: P3)

Como administrador, quero editar dados de um cliente existente e inativar clientes que não são mais relevantes, sem perder o histórico de negociações vinculadas.

**Why this priority**: Funcionalidade complementar ao CRUD — edição e soft-delete são esperados mas não bloqueiam o uso inicial.

**Independent Test**: Pode ser testado editando um cliente e verificando que as alterações são salvas sem impactar snapshots históricos de vendas.

**Acceptance Scenarios**:

1. **Given** um cliente existente, **When** o admin edita o telefone e salva, **Then** o telefone é atualizado no cadastro do cliente e `updated_at` é atualizado, mas os registros de vendas anteriores mantêm o telefone original no snapshot.
2. **Given** um cliente com vendas vinculadas, **When** o admin tenta inativar o cliente, **Then** o sistema confirma a ação em dialog, define `is_active = false` e o cliente deixa de aparecer na busca de venda por padrão.
3. **Given** um cliente inativo, **When** o admin reativa o cliente, **Then** `is_active` volta a `true` e o cliente reaparece na busca padrão.

---

### User Story 8 — Cliente sem Vínculo (Priority: P3)

Como administrador, quero criar e manter um cliente avulso sem venda, anúncio ou proposta associada para poder relacioná-lo a uma negociação futura.

**Why this priority**: Funcionalidade simples que já é coberta pelo cadastro manual (P1), aqui se reforça como caso de uso válido.

**Independent Test**: Pode ser testado criando um cliente sem vínculo e verificando que ele existe na listagem e tem estado vazio adequado na tela de detalhes.

**Acceptance Scenarios**:

1. **Given** o admin cria um cliente apenas com nome e telefone, **When** acessa o perfil do cliente, **Then** todas as abas de vínculo mostram estado vazio elegante com mensagem e CTAs.

---

### Edge Cases

- O que acontece se dois admins criam o mesmo cliente simultaneamente com o mesmo CPF? O constraint unique parcial no banco deve impedir a segunda inserção, retornando erro tratado.
- O que acontece se o admin cola um telefone com formatação estrangeira? O campo deve aceitar e normalizar, removendo caracteres não numéricos antes de persistir.
- O que acontece se o formulário público envia dados com telefone no formato internacional (+55)? A normalização deve tratar consistentemente o DDI.
- Como o sistema lida com clientes cujos dados de vendas antigas (antes da feature) não possuem `customer_id`? Essas vendas continuam funcionais, exibindo apenas os campos de snapshot; a vinculação pode ser feita manualmente no futuro ou via migração de dados.
- O que acontece ao buscar cliente na venda com campo vazio? O componente não deve disparar busca com string vazia, exibindo placeholder instrucionando o admin.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema MUST criar uma tabela central `customers` no Supabase com campos para dados pessoais, contato, documentos, endereço, origem e status.
- **FR-002**: O sistema MUST permitir que admins autenticados criem clientes manualmente com nome completo e telefone como campos obrigatórios.
- **FR-003**: O sistema MUST armazenar versões normalizadas de telefone (somente dígitos), e-mail (lowercase trimmed) e CPF (somente dígitos) para deduplicação.
- **FR-004**: O sistema MUST impedir a criação de dois clientes com o mesmo CPF válido, utilizando constraint unique parcial sobre `cpf_normalized` quando não nulo.
- **FR-005**: O sistema MUST alertar sobre possível duplicidade quando telefone ou e-mail já existirem na base, sem bloquear a criação automaticamente.
- **FR-006**: O sistema MUST validar CPF com algoritmo de dígitos verificadores quando o campo for preenchido.
- **FR-007**: O sistema MUST oferecer listagem paginada server-side com busca por nome, telefone, e-mail e CPF.
- **FR-008**: O sistema MUST oferecer filtros por sexo, data de entrada, origem, status e tipo de relacionamento, refletidos em query params na URL.
- **FR-009**: O sistema MUST permitir seleção de cliente existente no formulário de nova venda, com busca assíncrona e preenchimento automático dos campos de comprador.
- **FR-010**: O sistema MUST permitir criação rápida de cliente durante a venda via modal com campos mínimos.
- **FR-011**: O sistema MUST preservar campos de snapshot (buyer_name, buyer_phone, etc.) em `sales` de forma independente do cadastro central do cliente.
- **FR-012**: O sistema MUST adicionar `customer_id` nullable à tabela `sales` para vincular vendas a clientes sem quebrar registros legados.
- **FR-013**: O sistema MUST exibir na página de detalhes do cliente os vínculos com vendas, sell_requests, leads, consignments, rental_requests e rentals quando existirem.
- **FR-014**: O sistema MUST permitir inativação (soft-delete) de clientes sem exclusão física quando houver vínculos.
- **FR-015**: O sistema MUST rastrear a origem inicial do cliente (manual, site, venda, proposta, etc.) sem sobrescrevê-la em vínculos futuros.
- **FR-016**: O sistema MUST aplicar RLS na tabela `customers` permitindo acesso somente a admins autenticados (via `public.is_admin()`).
- **FR-017**: O sistema MUST criar ou vincular clientes de forma idempotente nos formulários públicos do site (sell_requests, rental_requests, leads), baseando-se no serviço central `findOrCreateCustomer`.
- **FR-018**: O sistema MUST exibir a seção "Clientes" no menu lateral do painel administrativo, posicionada entre "Vendas" e "Contatos & Propostas".
- **FR-019**: O sistema MUST apresentar a interface em português do Brasil, mobile-first, com design consistente ao painel existente.

### Key Entities

- **Customer (Cliente)**: Pessoa física central da carteira. Possui dados de identificação (nome, CPF, RG), contato (telefone, WhatsApp, e-mail), endereço, origem de captação, notas internas e status ativo/inativo. Pode ter múltiplos papéis (comprador, proprietário, consignante, locatário, lead).
- **Sale**: Transação de venda existente. Receberá FK nullable `customer_id` apontando para `customers`, preservando os campos de snapshot do comprador.
- **SellRequest**: Solicitação do site para vender/anunciar moto. Receberá FK nullable `customer_id` para associar o solicitante.
- **Lead**: Hub de propostas e contatos. Receberá FK nullable `customer_id` para associar o contato.
- **Consignment**: Contrato de consignação existente (via `motorcycle_owners`). A vinculação será avaliada via `motorcycle_owners` → `customers`.
- **RentalRequest**: Solicitação de aluguel. Receberá FK nullable `customer_id` para associar o interessado.
- **Rental**: Contrato de locação existente. Receberá FK nullable `customer_id` para associar o locatário.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: O administrador consegue cadastrar um cliente completo (nome, telefone, CPF, endereço) em menos de 90 segundos no celular.
- **SC-002**: A busca por nome/telefone na listagem retorna resultados em menos de 2 segundos para uma base de até 5.000 clientes.
- **SC-003**: A seleção de cliente na venda (busca + preenchimento automático) é concluída em menos de 15 segundos.
- **SC-004**: Nenhum cliente duplicado com o mesmo CPF válido pode existir simultaneamente na base.
- **SC-005**: 100% das vendas criadas após a feature possuem `customer_id` vinculado quando há dados suficientes de comprador.
- **SC-006**: Vendas e recibos anteriores à feature continuam exibindo seus dados históricos sem alteração.
- **SC-007**: A listagem de clientes é funcional e visualmente adequada em telas a partir de 320px de largura.
- **SC-008**: Nenhuma informação de CPF completo é exibida em URLs, logs de console ou mensagens de erro.

## Assumptions

- O público-alvo são clientes pessoa física; suporte a pessoa jurídica (CNPJ, razão social) pode ser adicionado futuramente, mas está fora do escopo inicial.
- A maioria dos leads de motocicleta chega via WhatsApp, portanto telefone é obrigatório e e-mail é opcional no cadastro de cliente.
- O sistema de autenticação e RLS existente (via `admin_profiles` e `public.is_admin()`) será reutilizado para controlar acesso à tabela de clientes.
- A integração com ViaCEP para busca de endereço por CEP já existe no formulário de venda e será reutilizada no cadastro de clientes.
- Os formatters já existentes (`formatCpf`, `formatPhone`, `formatCep`, `cleanNumeric`) serão reutilizados e estendidos com novos utilitários (`normalizePhone`, `normalizeCpf`, `normalizeEmail`, `isValidCpf`).
- Não haverá portal de login externo para clientes nesta versão — o acesso é exclusivamente via painel admin.
- A timeline/histórico agregado na tela de detalhes será construída a partir de consultas às tabelas existentes, sem uma tabela de eventos dedicada no MVP.
- A migração de dados legados (vincular vendas e solicitações antigas a clientes) será planejada mas não executada automaticamente nesta feature.
