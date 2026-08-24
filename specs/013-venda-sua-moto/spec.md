# Feature Specification: Página "Venda sua Moto para a AF Motos"

**Feature Branch**: `013-venda-sua-moto`

**Created**: 2026-08-23

**Status**: Draft

**Input**: User description: "Página 'Venda sua moto para a AF Motos' — Criar uma nova página pública para o usuário oferecer sua motocicleta diretamente para a AF Motos comprar (/venda-sua-moto), com fluxo próprio em etapas, consulta FIPE, simulador de proposta percentual com aviso de estimativa inicial, dados do proprietário, upload de fotos em sell_request_images, persistência segura em sell_requests e leads, e visualização enriquecida no painel administrativo."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Consulta FIPE e Simulação de Proposta de Compra (Priority: P1)

Como um proprietário de motocicleta em Pernambuco, quero acessar uma página dedicada para vender minha moto diretamente para a AF Motos, consultar o valor de referência oficial na Tabela FIPE e simular uma estimativa de proposta percentual em tempo real, para entender a projeção inicial de valor antes de enviar minha proposta.

**Why this priority**: É o diferencial central do produto frente à página de anúncio convencional (`/anunciar-sua-moto`). Dá transparência imediata ao cliente, estabelece expectativas reais de mercado e atrai leads qualificados prontos para negociar com a loja.

**Independent Test**: Pode ser testado acessando `/venda-sua-moto`, selecionando Marca, Modelo e Ano da moto, visualizando o valor oficial FIPE retornado, interagindo com o seletor percentual de simulação (70% a 100%) e verificando o cálculo correto da estimativa em moeda brasileira (BRL) juntamente com os alertas explicativos de que se trata de uma estimativa sujeita à avaliação física.

**Acceptance Scenarios**:

1. **Given** um visitante na rota `/venda-sua-moto`, **When** ele seleciona marca (ex: Honda), modelo (ex: CG 160 Fan) e ano (ex: 2023), **Then** o sistema consulta e exibe o valor de referência FIPE (ex: R$ 18.500,00), o período de referência (ex: Agosto de 2026) e habilita o simulador de proposta.
2. **Given** um valor FIPE carregado no formulário, **When** o usuário escolhe um percentual (ex: 85%), **Then** a interface calcula e exibe em tempo real a estimativa de proposta (ex: R$ 15.725,00) mantendo visível a advertência comercial de que a proposta final depende do estado de conservação, documentação e análise física da loja.
3. **Given** o card "Venda sua Moto pra Nós" na página inicial (`/`), **When** o visitante clica no botão "Quero Vender Minha Moto", **Then** ele é direcionado diretamente para `/venda-sua-moto` com identidade visual e proposta de valor de compra direta.

---

### User Story 2 - Cadastro do Proprietário, Envio de Fotos e Submissão da Proposta (Priority: P2)

Como proprietário interessado em vender sua moto, quero preencher meus dados de contato (Nome, WhatsApp, Cidade/PE), informar minha quilometragem e expectativa de valor opcional, anexar fotos reais do veículo, revisar todas as informações e enviar a solicitação com segurança e confirmação imediata.

**Why this priority**: Conclui o funil de conversão público coletando todos os dados cadastrais, técnicos e visuais necessários para a equipe comercial avaliar a motocicleta sem fricção e sem retrabalho.

**Independent Test**: Pode ser testado preenchendo todos os campos da etapa de dados pessoais e técnicos, anexando até 5 imagens reais, passando pela etapa de revisão visual com resumo financeiro, enviando o formulário e confirmando a exibição da tela de sucesso com número de protocolo/resumo e botão de WhatsApp.

**Acceptance Scenarios**:

1. **Given** a etapa de dados do proprietário, **When** o usuário preenche nome, WhatsApp válido com DDD de Pernambuco e seleciona um município pernambucano, **Then** o formulário valida os campos conforme as regras de negócio e avança para a etapa de fotos.
2. **Given** a etapa de fotos, **When** o usuário arrasta ou seleciona até 5 fotos (frente, laterais, painel, motor), **Then** o sistema exibe miniaturas com opção de exclusão individual e valida tipo MIME e tamanho máximo por arquivo (5MB).
3. **Given** o formulário totalmente preenchido e revisado, **When** o usuário clica em "Enviar proposta para a AF Motos", **Then** o botão é desabilitado contra duplo clique, o servidor recalcula a simulação, persiste o registro em `sell_requests`, salva as fotos em `sell_request_images`, vincula a proposta na central `leads` e redireciona para a tela de sucesso com orientações claras dos próximos passos.

---

### User Story 3 - Recepção e Gestão Comercial no Painel Administrativo (Priority: P3)

Como administrador da AF Motos, quero visualizar na central `/admin/propostas` as propostas recebidas identificadas com o badge "Venda para a AF Motos", inspecionar a moto, fotos, snapshot FIPE, percentual simulado e expectativa do cliente, e iniciar atendimento no WhatsApp com mensagem contextual pré-formatada ou atualizar o status da proposta.

**Why this priority**: Fecha o ciclo de negócio, permitindo que os operadores da loja negociem com agilidade, entrem em contato direto pelo WhatsApp sem perder contexto e façam a gestão do pipeline até o fechamento.

**Independent Test**: Pode ser testado autenticando como administrador em `/admin/propostas`, filtrando por propostas de "Venda de moto", abrindo a gaveta de detalhes de uma proposta enviada via `/venda-sua-moto`, confirmando a exibição dos blocos de simulação FIPE e fotos, acionando a mensagem pré-configurada de WhatsApp e alterando o status com persistência imediata e toast de sucesso.

**Acceptance Scenarios**:

1. **Given** um administrador autenticado em `/admin/propostas`, **When** ele visualiza a listagem de propostas, **Then** a solicitação de venda direta exibe o badge "Venda de moto" / "Venda para a AF Motos", dados da moto (marca, modelo, ano, km, cidade), valor FIPE e valor estimado.
2. **Given** o detalhe da proposta aberto no painel, **When** o administrador clica no botão "Conversar no WhatsApp", **Then** o sistema gera um link para o WhatsApp do cliente com mensagem personalizada contendo nome do cliente, dados da moto, referência FIPE e expectativa informada.
3. **Given** uma proposta com status `NEW`, **When** o administrador seleciona um novo status (ex: `CONTACTED` ou `QUALIFIED`), **Then** o status é sincronizado no banco de dados e na interface sem recarregar a página.

---

### User Story 4 - Resiliência e Fallbacks (Tabela FIPE Indisponível ou Falha de Upload) (Priority: P4)

Como um usuário com conexão instável ou buscando um modelo muito específico não indexado na FIPE, quero poder preencher a marca e modelo manualmente e concluir o envio da proposta mesmo se a consulta automática falhar.

**Why this priority**: Garante que nenhum cliente em potencial seja bloqueado de enviar sua moto por instabilidades de serviços externos ou limitações momentâneas de rede.

**Independent Test**: Pode ser testado desconectando a API FIPE ou acionando a opção "Digitar manualmente", inserindo dados manuais da moto e finalizando a submissão com sucesso sem travamentos.

**Acceptance Scenarios**:

1. **Given** uma falha ou ausência de dados na busca FIPE, **When** o usuário clica em "Digitar manualmente", **Then** os campos de texto livre são exibidos, permitindo preencher marca, modelo e ano, enquanto o simulador informa que a estimativa será realizada manualmente pela equipe da loja.
2. **Given** uma tentativa de submissão com upload de foto parcialmente falho, **When** o sistema detecta erro no envio da imagem, **Then** ele alerta o usuário de forma amigável e permite tentar novamente sem apagar os dados preenchidos.

---

### Edge Cases

- **Tentativa de envio duplicado**: Usuário clica repetidamente no botão de submissão em conexão lenta. O botão deve ser desabilitado durante o envio e a Server Action deve prevenir duplicação de requisições.
- **Valores discrepantes enviados pelo cliente**: Usuário manipula o DOM ou requisição enviando um `estimated_offer` irreal. O servidor SEMPRE recalcula a fórmula `estimated_offer = (fipe_price * offer_percentage) / 100` e valida os limites antes de persistir.
- **Upload de arquivos não-imagem ou gigantes**: Bloqueio prévio no cliente e validação rígida no servidor rejeitando arquivos que excedam 5MB ou com tipos MIME não permitidos (apenas JPEG, PNG e WebP).
- **Dados FIPE sem preço cadastrado**: Exibir mensagem clara de que o modelo não possui cotação recente e permitir preenchimento manual da expectativa do cliente.
- **Campos opcionais nulos**: Observações, expectativa de preço e fotos parciais devem ser tratados sem quebras de layout ou falhas de inserção no banco de dados.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema DEVE disponibilizar uma rota pública `/venda-sua-moto` com identidade comercial focada em compra direta pela AF Motos ("Venda sua moto para a AF Motos"), distinta da rota `/anunciar-sua-moto`.
- **FR-002**: O card "Venda sua Moto pra Nós" presente na página inicial (`/`) DEVE apontar o link de destino diretamente para `/venda-sua-moto`.
- **FR-003**: A página `/venda-sua-moto` DEVE apresentar um fluxo em etapas (Wizard/Stepper) com salvamento de estado local durante a navegação entre passos:
  1. Dados da Moto
  2. Consulta & Simulação FIPE
  3. Dados do Proprietário
  4. Fotos da Moto
  5. Revisão & Envio
- **FR-004**: No desktop, a interface DEVE apresentar layout em duas colunas com formulário à esquerda e card de resumo dinâmico (com dados da moto e simulação financeira) à direita.
- **FR-005**: No mobile, a interface DEVE apresentar stepper compacto, navegação ao alcance do polegar e botões de ação fixos ou sempre visíveis.
- **FR-006**: A etapa de dados da moto DEVE permitir seleção via comboboxes integrados à API da Tabela FIPE (`fipeX`) com suporte a fallback manual para marca e modelo.
- **FR-007**: Após a seleção do veículo e ano, o sistema DEVE permitir a consulta imediata do valor de referência FIPE, exibindo estado de loading, valor formatado em BRL e mês/ano de referência.
- **FR-008**: O simulador de proposta DEVE permitir a seleção de percentuais pré-configurados (70%, 75%, 80%, 85%, 90%, 95%, 100%) calculando a estimativa pela fórmula: `valor_estimado = (valor_fipe * percentual) / 100`.
- **FR-009**: O simulador DEVE exibir de forma destacada e obrigatória a advertência legal/comercial: "Esta é uma estimativa inicial com base no valor FIPE. A proposta final será definida após a análise da moto e da documentação pela AF Motos."
- **FR-010**: O sistema DEVE permitir que o cliente informe sua expectativa de valor (`desired_price`) de forma opcional e independente da simulação calculada.
- **FR-011**: A etapa de dados do proprietário DEVE validar obrigatoriamente Nome Completo, Telefone WhatsApp (10 ou 11 dígitos com DDD) e Município de Pernambuco (com combobox dos 185 municípios do estado).
- **FR-012**: O sistema NÃO DEVE solicitar dados confidenciais ou desnecessários no formulário público inicial (como senhas, dados bancários ou CPF obrigatório).
- **FR-013**: A etapa de fotos DEVE permitir o envio de até 5 fotos reais nos formatos JPEG, PNG e WebP com limite máximo de 5MB por arquivo, gerando pré-visualizações interativas.
- **FR-014**: A etapa de revisão DEVE exibir um resumo completo de todos os dados (dados técnicos da moto, valores FIPE e simulado, expectativa, dados de contato e miniaturas de fotos) com checkbox de confirmação da veracidade dos dados.
- **FR-015**: A submissão da proposta DEVE ser processada exclusivamente via Server Action segura, que recalcula a simulação, força o status inicial para `NEW` e rejeita qualquer tentativa de injeção de status administrativo pelo cliente.
- **FR-016**: O sistema DEVE persistir a solicitação na tabela `public.sell_requests`, salvando colunas tipadas de simulação (`offer_percentage`, `estimated_offer`), dados FIPE (`fipe_code`, `fipe_price`, `fipe_reference_period`, `fipe_snapshot`) e metadados adicionais em `motorcycle_data`.
- **FR-017**: As imagens enviadas DEVEM ser salvas na tabela `public.sell_request_images` associadas ao `sell_request_id`, utilizando o orquestrador centralizado de uploads (ImgBB / Supabase Storage).
- **FR-018**: A Server Action DEVE criar ou atualizar a entrada correspondente na tabela central `public.leads` com tipo `SELL_MOTORCYCLE`, metadados de simulação e contagem de fotos para visibilidade unificada no CRM.
- **FR-019**: O painel administrativo (`/admin/propostas`) DEVE exibir as propostas de compra direta com identificação clara, permitindo filtrar por "Venda de moto".
- **FR-020**: A gaveta/modal de detalhes da proposta (`ProposalDetail`) no painel administrativo DEVE apresentar de forma legível os dados do veículo, fotos em tela cheia, snapshot FIPE, percentual simulado, valor estimado e expectativa do cliente.
- **FR-021**: O painel DEVE fornecer ação de "Conversar no WhatsApp" com mensagem contextual formatada e ação rápida de copiar telefone.
- **FR-022**: O administrador DEVE conseguir atualizar o status da proposta entre os estados do pipeline (`NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `LOST`, `CLOSED`) com persistência imediata e revalidação.
- **FR-023**: As políticas de Row Level Security (RLS) DEVEM garantir que usuários anônimos/públicos possam apenas inserir propostas (`INSERT`), impedindo leitura, listagem ou alteração de propostas de terceiros, enquanto administradores autenticados mantêm acesso total.
- **FR-024**: A página pública `/venda-sua-moto` DEVE incluir metadados SEO completos (título, descrição, Open Graph, tags semânticas) otimizados para busca orgânica local em Pernambuco.
- **FR-025**: Toda a interface DEVE respeitar os padrões de acessibilidade WCAG (labels, estados de foco visíveis, atributos `aria-*`, teclado) e contraste visual dark luxury do AF Motos.

### Key Entities

- **SellRequest**: Registro central da proposta de venda (`id`, `name`, `phone`, `email`, `brand`, `model`, `year_manufacture`, `year_model`, `mileage`, `desired_price`, `fipe_price`, `fipe_code`, `fipe_reference_period`, `fipe_snapshot`, `offer_percentage`, `estimated_offer`, `city`, `state`, `notes`, `status`, `created_at`).
- **SellRequestImage**: Imagens vinculadas à proposta (`id`, `sell_request_id`, `public_url`, `provider`, `storage_path`, `delete_url`, `sort_order`, `created_at`).
- **OfferSimulation**: Objeto de cálculo da simulação contendo `fipe_price`, `offer_percentage`, `estimated_offer`, moeda `BRL` e timestamp do cálculo.
- **FipeSnapshot**: Snapshot imutável da cotação FIPE no momento da simulação contendo código FIPE, valor oficial, mês/ano de referência e dados do modelo.
- **ProposalViewModel**: Modelo de visualização unificado consumido pelo painel administrativo para listagem, filtros e renderização de detalhes.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: O usuário consegue preencher o formulário, consultar o valor FIPE, simular a proposta e submeter a solicitação em menos de 3 minutos em conexões móveis convencionais.
- **SC-002**: 100% das propostas submetidas através de `/venda-sua-moto` registram com exatidão matemática a simulação recalculada no servidor e criam vínculos íntegros nas tabelas `sell_requests`, `sell_request_images` e `leads`.
- **SC-003**: 100% das consultas FIPE bem-sucedidas armazenam o snapshot sanitizado com código e período de referência sem vazar credenciais ou dados brutos indesejados.
- **SC-004**: O painel administrativo exibe novas propostas em tempo real ou após atualização sem gerar consultas N+1, mantendo o tempo de renderização da lista abaixo de 200ms.
- **SC-005**: 100% das páginas e componentes criados passam nos testes de acessibilidade e renderizam sem quebra ou overflow horizontal nas resoluções mobile (320px a 430px) e desktop (1024px a 1440px).
- **SC-006**: Todos os scripts de validação de código (`npm run lint`, `npm run typecheck`, `npm run build`) executam com 0 erros.

## Assumptions

- A tabela `public.sell_requests` já suporta as colunas base de FIPE e fotos adicionadas na migração `20260822193000_enhance_sell_request_form.sql`. Caso as colunas tipadas `offer_percentage` e `estimated_offer` ainda não existam no banco, serão criadas via migration segura e idempotente sem quebrar registros legados.
- O público-alvo prioritário da AF Motos está situado no estado de Pernambuco (PE), mantendo a validação padrão de cidades pernambucanas com flexibilidade para o catálogo geral.
- A autenticação de administradores utiliza as sessões Supabase Auth existentes com verificação no servidor via `is_admin()` / `auth.role() = 'authenticated'`.
- O cálculo da simulação é puramente percentual e parametrizável (70% a 100%), sem aplicação de descontos automáticos opacos no primeiro contato, preservando total clareza na comunicação com o cliente.
