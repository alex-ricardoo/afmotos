# Feature Specification: Consulta Tabela FIPE

**Feature Branch**: `007-fipe-consultation`

**Created**: 2026-08-22

**Status**: Draft

**Input**: User description: "Criar uma nova área no painel administrativo do AF Motos para consultar valores de referência de motocicletas usando a API fipeX. A funcionalidade deve permitir pesquisa por formulário intuitivo, visualização de dados, comparação com preços cadastrados, vínculo a motos existentes, salvamento de resultados e histórico de consultas."

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Consultar valor de referência de uma motocicleta (Priority: P1)

O administrador acessa a área "Tabela FIPE" no painel administrativo, preenche um formulário progressivo selecionando tipo de veículo, marca, modelo, ano e combustível, e obtém o valor de referência para o veículo consultado.

**Why this priority**: Esta é a funcionalidade central da feature. Sem ela, nenhuma outra funcionalidade dependente funciona. Entrega valor imediato ao permitir que o administrador consulte preços de referência durante negociações.

**Independent Test**: Pode ser testada completamente acessando a rota administrativa, preenchendo o formulário e verificando que o valor de referência é exibido corretamente com todos os dados técnicos.

**Acceptance Scenarios**:

1. **Given** o administrador está autenticado no painel, **When** acessa a rota da consulta FIPE, **Then** visualiza o formulário de consulta com o campo "Tipo de veículo" habilitado e os demais desabilitados.
2. **Given** o administrador selecionou o tipo de veículo, **When** o tipo é carregado com sucesso, **Then** o campo "Marca" é habilitado e exibe as marcas retornadas pela fonte de dados para aquele tipo.
3. **Given** o administrador selecionou tipo, marca, modelo, ano e combustível, **When** clica em "Consultar valor", **Then** o sistema exibe um card com marca, modelo, ano/modelo, combustível, código de referência, período de referência, valor formatado em reais, data/hora da consulta e fonte.
4. **Given** o administrador já fez uma consulta, **When** altera qualquer campo anterior no formulário, **Then** os campos dependentes são limpos e o resultado anterior é removido da tela.
5. **Given** a fonte de dados está indisponível, **When** o administrador tenta consultar, **Then** uma mensagem de erro amigável é exibida sem expor detalhes técnicos.

---

### User Story 2 — Salvar e consultar histórico de consultas (Priority: P2)

Após realizar uma consulta, o administrador pode salvar o resultado no banco de dados. Todas as consultas salvas ficam listadas em uma seção de histórico, podendo ser reabertas para visualização.

**Why this priority**: Permite ao administrador manter um registro das pesquisas de referência para uso futuro durante negociações, sem precisar repetir consultas. Complementa diretamente a consulta básica.

**Independent Test**: Pode ser testada realizando uma consulta, salvando-a, navegando até a seção de histórico e verificando que a consulta aparece listada com data, marca, modelo, ano e valor.

**Acceptance Scenarios**:

1. **Given** o administrador visualiza o resultado de uma consulta, **When** clica em "Salvar consulta", **Then** o resultado é persistido no banco de dados com todos os dados retornados, data/hora e identificação do usuário.
2. **Given** existem consultas salvas, **When** o administrador acessa a seção "Histórico de consultas", **Then** vê uma lista ordenada por data (mais recente primeiro) com data, marca, modelo, ano e valor de referência.
3. **Given** o administrador está na lista de histórico, **When** seleciona uma consulta anterior, **Then** os dados completos daquela consulta são exibidos no card de resultado.
4. **Given** o administrador visualiza uma consulta do histórico, **When** deseja atualizar o valor, **Then** pode realizar uma nova consulta com os mesmos parâmetros para obter dados atualizados.

---

### User Story 3 — Vincular consulta a uma motocicleta cadastrada (Priority: P3)

Após obter um resultado de consulta, o administrador pode vinculá-lo a uma motocicleta já cadastrada no sistema, visualizando uma comparação lado a lado entre o valor de referência e o preço de venda atual.

**Why this priority**: Adiciona contexto de negócio relevante ao conectar a consulta abstrata a um ativo real do inventário, mas depende das funcionalidades anteriores estarem funcionando.

**Independent Test**: Pode ser testada realizando uma consulta, selecionando a opção de vincular, escolhendo uma moto cadastrada, e verificando que a comparação de preços é exibida corretamente.

**Acceptance Scenarios**:

1. **Given** o administrador visualiza um resultado de consulta, **When** clica em "Vincular a uma moto cadastrada", **Then** visualiza uma lista de motos disponíveis no inventário para selecionar.
2. **Given** o administrador selecionou uma moto cadastrada, **When** o vínculo é estabelecido, **Then** o sistema exibe: preço cadastrado, valor de referência e diferença calculada entre os dois valores.
3. **Given** o administrador visualiza a comparação de preços, **When** deseja usar o valor de referência como base para negociação, **Then** existe uma ação "Usar como referência para negociação" que registra o interesse sem alterar automaticamente o preço.
4. **Given** o administrador opta por atualizar o preço da moto, **When** solicita a atualização, **Then** recebe uma confirmação mostrando valor atual e novo valor, e a alteração só é efetivada após confirmação explícita, registrando a origem da alteração.

---

### User Story 4 — Reconsultar dados atualizados (Priority: P4)

O administrador pode refazer uma consulta a qualquer momento para obter o valor de referência mais recente, seja a partir do formulário limpo ou a partir de uma consulta do histórico.

**Why this priority**: Complementa o fluxo de uso permitindo atualização de dados quando os preços de referência mudam mensalmente.

**Independent Test**: Pode ser testada abrindo uma consulta do histórico e selecionando "Consultar novamente" para verificar se os dados são atualizados com a referência mais recente.

**Acceptance Scenarios**:

1. **Given** o administrador visualiza uma consulta do histórico, **When** clica em "Consultar novamente", **Then** o formulário é preenchido com os mesmos parâmetros e uma nova consulta é executada automaticamente.
2. **Given** o valor de referência mudou desde a última consulta, **When** o administrador reconsulta, **Then** o novo valor é exibido e pode ser salvo como uma nova entrada no histórico.

---

### Edge Cases

- O que acontece quando o administrador seleciona um tipo de veículo e a fonte de dados retorna zero marcas para esse tipo? O sistema deve exibir uma mensagem informando que não há marcas disponíveis.
- O que acontece quando a fonte de dados está temporariamente fora do ar (timeout ou erro de rede)? O sistema deve exibir uma mensagem de erro amigável e permitir nova tentativa.
- O que acontece quando o administrador tenta vincular a consulta a uma moto que já possui uma consulta vinculada? O sistema deve permitir múltiplos vínculos, pois consultas diferentes em datas diferentes são válidas.
- O que acontece quando o administrador tenta salvar uma consulta idêntica (mesmos parâmetros, mesma referência)? O sistema deve permitir, pois a data/hora da consulta é diferente e o contexto de negócio pode ser outro.
- O que acontece quando o preço formatado retornado está em formato inesperado? O sistema deve usar o valor em centavos como fonte primária e formatar internamente.
- O que acontece quando a moto cadastrada vinculada não possui preço de venda definido? A comparação deve informar que o preço de venda não foi cadastrado e exibir apenas o valor de referência.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema MUST exibir uma nova seção "Tabela FIPE" no menu lateral do painel administrativo, acessível exclusivamente a usuários autenticados e autorizados.
- **FR-002**: O sistema MUST renderizar um formulário de consulta progressivo com campos dependentes na ordem: tipo de veículo → marca → modelo → ano/modelo → combustível.
- **FR-003**: O sistema MUST desabilitar cada campo até que o campo anterior seja preenchido, e limpar todos os campos dependentes quando um campo anterior for alterado.
- **FR-004**: O sistema MUST carregar as opções de cada campo a partir da fonte de dados externa sem usar opções fixas no código.
- **FR-005**: O sistema MUST exibir indicadores de carregamento enquanto busca opções para cada campo do formulário.
- **FR-006**: O sistema MUST impedir o envio da consulta quando o formulário estiver incompleto.
- **FR-007**: O sistema MUST exibir o resultado da consulta em um card destacado contendo: marca, modelo, ano/modelo, combustível, código de referência, período de referência, valor formatado em reais, data/hora da consulta e identificação da fonte.
- **FR-008**: O sistema MUST exibir permanentemente o aviso: "O valor exibido é uma referência e pode ser diferente do preço real de mercado."
- **FR-009**: O sistema MUST exibir a nota de fonte: "Fonte de referência: fipeX. Consulta utilizada apenas como apoio à negociação."
- **FR-010**: O sistema MUST permitir salvar o resultado de uma consulta no banco de dados, associado ao usuário que realizou a consulta e com data/hora de criação.
- **FR-011**: O sistema MUST exibir uma seção de histórico listando consultas salvas em ordem cronológica decrescente, com data, marca, modelo, ano e valor.
- **FR-012**: O sistema MUST permitir reabrir uma consulta do histórico, exibindo todos os dados originais no card de resultado.
- **FR-013**: O sistema MUST permitir vincular uma consulta a uma motocicleta existente no inventário (`public.motorcycles`), exibindo marca/modelo, ano, preço de venda atual, quilometragem e status da moto selecionada.
- **FR-014**: O sistema MUST calcular e exibir a diferença entre o preço de venda cadastrado e o valor de referência, apenas para visualização, sem alterar automaticamente nenhum preço.
- **FR-015**: O sistema MUST oferecer a ação "Usar como referência para negociação" que registra o interesse sem alterar preços.
- **FR-016**: Caso o administrador opte por atualizar o preço da moto, o sistema MUST solicitar confirmação explícita mostrando valor atual e novo valor, e registrar a origem da alteração.
- **FR-017**: O sistema MUST permitir limpar o formulário e reiniciar a consulta.
- **FR-018**: O sistema MUST tratar erros da fonte de dados (timeout, indisponibilidade, resposta inválida) com mensagens amigáveis ao usuário sem expor detalhes técnicos.
- **FR-019**: O sistema MUST centralizar a integração com a fonte de dados externa em um módulo de serviço dedicado, não espalhando chamadas diretamente por componentes de interface.
- **FR-020**: O sistema MUST exibir breadcrumb na rota: Admin > Tabela FIPE.
- **FR-021**: O sistema MUST funcionar corretamente em desktop (layout com coluna principal e coluna secundária) e em mobile (layout vertical sequencial).
- **FR-022**: O sistema MUST permitir reconsultar a partir de uma consulta do histórico, preenchendo automaticamente os parâmetros originais.

### Key Entities _(include if feature involves data)_

- **Consulta FIPE (fipe_consultation)**: Registro de uma consulta de valor de referência realizada pelo administrador. Contém os parâmetros da busca (tipo, marca, modelo, ano, combustível com seus identificadores e nomes), o valor de referência obtido (em centavos e formatado), o período de referência, o código de referência, a data/hora da consulta, e o usuário que a realizou.
- **Vínculo Consulta-Motocicleta**: Relação entre uma consulta FIPE e uma motocicleta cadastrada no inventário, incluindo o preço de venda no momento do vínculo para referência histórica.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: O administrador consegue completar uma consulta FIPE (do acesso ao formulário até a visualização do resultado) em menos de 30 segundos, assumindo conexão estável.
- **SC-002**: 100% das consultas realizadas podem ser salvas e recuperadas integralmente do histórico sem perda de dados.
- **SC-003**: O administrador consegue vincular uma consulta a uma moto cadastrada e visualizar a comparação de preços em no máximo 2 interações adicionais após a consulta.
- **SC-004**: Quando a fonte de dados externa está indisponível, o sistema exibe uma mensagem de erro amigável em no máximo 10 segundos (timeout configurável).
- **SC-005**: A tela de consulta FIPE é utilizável em dispositivos com largura de tela a partir de 320px (mobile) até telas widescreen (1920px+).
- **SC-006**: A seção de histórico exibe corretamente até 100 consultas anteriores sem degradação perceptível de desempenho na navegação.

## Assumptions

- O administrador possui conexão com a internet para acessar a fonte de dados de preços externa.
- A autenticação e autorização do painel administrativo já existem e serão reutilizadas sem modificação.
- O sistema de design (tokens visuais, componentes, sidebar) do painel administrativo já está implementado e será seguido.
- A fonte de dados externa (fipeX) é uma API pública, gratuita, sem necessidade de chave de autenticação, com CORS aberto.
- Os dados de preço da fonte de dados são atualizados mensalmente. A consulta retorna o período de referência mais recente disponível, salvo indicação contrária.
- O banco de dados Supabase (PostgreSQL) já está disponível e será usado para persistir as consultas e vínculos.
- A tabela `public.motorcycles` já contém os dados de motos cadastradas com campos de marca, modelo, ano, preço, quilometragem e status.
- A integração será centralizada em um módulo de serviço dedicado, seguindo os padrões de desacoplamento da constituição do projeto (Princípio VII — Integrações Desacopladas).
- O valor de referência nunca será apresentado como preço obrigatório, oficial ou garantia de venda — é exclusivamente uma referência para negociação.
- Mobile-first: a experiência será projetada primeiro para dispositivos móveis (Princípio II da constituição).
