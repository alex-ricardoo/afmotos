# Feature Specification: Cadastro de Vendas e Recibo de Venda/Repasse

**Feature Branch**: `[009-cadastro-vendas]`

**Created**: 2026-08-22

**Status**: Draft

**Input**: User description: "Cadastro de vendas e recibo de venda/repasse — AF Motos..."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Registros e Fluxo Principal (Priority: P1)

Como administrador, quero marcar uma moto como vendida, registrar os detalhes financeiros e do comprador no momento da venda e gerar um recibo PDF, para ter controle oficial sobre a transação sem usar plataformas externas.

**Why this priority**: É o cerne da feature, permitindo formalizar o encerramento do ciclo de vida de uma moto no sistema e registrar os dados comerciais para emissão de documento.

**Independent Test**: Pode ser testado na tela de motos ao mudar o status, verificando se o fluxo salva as duas informações (status e dados da venda) de forma íntegra.

**Acceptance Scenarios**:

1. **Given** uma moto à venda, **When** o admin altera o status para SOLD, **Then** o sistema exibe um modal de confirmação ("Registrar venda", "Agora não", "Cancelar").
2. **Given** o modal de confirmação, **When** o admin escolhe "Registrar venda", **Then** o sistema abre um formulário pré-preenchido com os dados da moto e data atual.
3. **Given** o formulário de venda preenchido, **When** o admin salva, **Then** o sistema altera a moto para SOLD, grava a venda vinculada, atualiza o histórico e exibe feedback de sucesso oferecendo a geração do recibo.
4. **Given** o modal de confirmação, **When** o admin escolhe "Agora não", **Then** o sistema altera apenas o status da moto para SOLD sem criar um registro incompleto na tabela de vendas.

---

### User Story 2 - Consulta do Histórico de Vendas (Priority: P1)

Como administrador, quero uma área dedicada (`/admin/vendas`) para listar e buscar as vendas realizadas, podendo ver os detalhes no computador ou no celular de forma rápida.

**Why this priority**: Administradores precisam auditar vendas antigas, confirmar dados de compradores ou reemitir recibos a qualquer momento.

**Independent Test**: A tela deve carregar de forma isolada os dados estruturados de vendas e permitir filtros sem depender do fluxo de criação.

**Acceptance Scenarios**:

1. **Given** o acesso à rota `/admin/vendas`, **When** a página é carregada no desktop, **Then** os registros aparecem em formato de tabela com dados da moto e comprador.
2. **Given** o acesso à rota `/admin/vendas`, **When** a página é carregada no mobile, **Then** os registros aparecem como cards verticais exibindo foto, modelo, preço e data.
3. **Given** a tela de histórico, **When** o admin clica nos detalhes de uma venda, **Then** as informações completas, incluindo fotos, dados financeiros e observações, são exibidas, com botões para "Gerar Recibo" e interagir com o comprador.

---

### User Story 3 - Geração de Recibo PDF (Priority: P1)

Como administrador, quero baixar um recibo comercial em PDF utilizando a identidade visual da AF Motos, formatado em A4 e contendo as informações da transação, para enviá-lo ou entregá-lo assinado ao comprador.

**Why this priority**: Profissionaliza a entrega da motocicleta e documenta os termos combinados para ambas as partes.

**Independent Test**: A geração pode ser testada clicando em gerar recibo a partir de qualquer venda salva e validando se o arquivo baixa corretamente e obedece ao layout.

**Acceptance Scenarios**:

1. **Given** uma venda registrada, **When** o admin solicita o recibo, **Then** o sistema gera um PDF em A4 com a logo, número de recibo, dados do comprador, dados da moto e valores formatados.
2. **Given** uma venda com dados opcionais ausentes (ex: Renavam não preenchido), **When** o recibo é gerado, **Then** o documento oculta esses campos em vez de mostrá-los em branco ou `null`.
3. **Given** configurações da loja cadastradas, **When** o recibo é gerado, **Then** o documento exibe o cabeçalho e rodapé corretos (nome, contato e endereço da loja).

### Edge Cases

- O que acontece se a geração do PDF falhar (ex: falha de processamento de fonte ou imagem externa)? O sistema deve notificar o administrador elegantemente e não crashear a interface.
- O que acontece se a alteração do status da moto para SOLD falhar após a venda ser cadastrada? A operação deve atuar como uma transação (tudo ou nada) ou aplicar rollback / compensação para evitar inconsistência (venda criada para moto que consta como DISPONÍVEL).
- O que acontece se a moto não possui foto principal ou logotipo não estiver configurado? O sistema deve usar placeholders genéricos ou esconder a imagem, sem impedir a geração do recibo.
- O que acontece se houver tentativa de acesso público aos recibos? Políticas de segurança (RLS) impedirão o acesso não autorizado de não-administradores, rejeitando o download.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema MUST garantir que a tela de histórico e criação de vendas só possa ser acessada e mutada por usuários com perfil administrativo autenticado.
- **FR-002**: O sistema MUST exibir o histórico de vendas ordenado por padrão das vendas mais recentes para as mais antigas.
- **FR-003**: O sistema MUST oferecer filtros na listagem de vendas por data, comprador, marca, modelo e forma de pagamento.
- **FR-004**: O sistema MUST solicitar confirmação antes de alterar status de veículos e oferecer a opção de registrar os dados de venda ("Registrar", "Agora não", "Cancelar").
- **FR-005**: O sistema MUST popular automaticamente os campos relacionados à moto (Marca, Modelo, Ano, Preço) no formulário da nova venda.
- **FR-006**: O sistema MUST gerar um número de recibo único que não sofra problemas de colisão, exibido diretamente no documento PDF.
- **FR-007**: O sistema MUST gerar o recibo em formato PDF client-side ou server-side compatível com Vercel, otimizado para impressão A4, com valores formatados em moeda (BRL).
- **FR-008**: O sistema MUST permitir que um texto adicional de observações, definido pelo lojista, seja incluído no documento gerado.

### Key Entities

- **Sale**: Transação de venda. Representa o evento comercial, registrando os dados do comprador (nome, telefone, documentos se aprovados), preço real pago, método de pagamento, data e notas textuais. Relacionada unicamente a uma motocicleta (1:1).
- **Motorcycle**: Veículo sendo comercializado, do qual seus atributos fixos (ano, marca, modelo, chassi) são consultados e incorporados ao recibo.
- **SiteSettings**: Entidade já existente, de onde serão extraídos logo, endereço e informações da loja (AF Motos) para o cabeçalho/rodapé do PDF.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: O administrador consegue alterar o status de uma moto e completar o fluxo de venda (com todos os dados) em menos de 2 minutos pelo dispositivo móvel.
- **SC-002**: A geração do recibo PDF é concluída e iniciada no navegador em menos de 4 segundos a partir do clique.
- **SC-003**: A visualização do histórico de vendas adapta-se perfeitamente em telas móveis sem rolagem horizontal excessiva, priorizando navegação vertical baseada em cards.
- **SC-004**: 100% das transações concluídas via modal garantem sincronia entre `Motorcycle.status` (igual a `SOLD`) e registro em `Sale` quando as opções afirmativas são usadas.

## Assumptions

- O envio automatizado do PDF ao comprador (por email ou WhatsApp direto do servidor) está fora do escopo do MVP; o administrador fará o download/geração e compartilhará manualmente através do seu aparelho.
- As integrações com bases de dados da FIPE ou Detran não são acessadas nem revalidadas no momento da geração do recibo.
- O termo "Financiamento" pode não estar habilitado a depender da loja, mas os tipos de pagamento são previamente conhecidos.
- O texto presente no PDF é caracterizado como Recibo Comercial e os ajustes legais nele são de responsabilidade do lojista (com um disclaimer visual avisando sobre isso no painel).
