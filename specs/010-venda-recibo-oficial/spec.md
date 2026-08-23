# Feature Specification: Refatoração de Venda de Veículos, Dados Fiscais/Cadastrais e Recibo Oficial A4

**Feature Branch**: `[010-venda-recibo-oficial]`

**Created**: 2026-08-23

**Status**: Draft

**Input**: User description: "Papel: Principal Product Designer, Senior Full-Stack Engineer & Database Architect. Objetivo: Refatorar o módulo de Venda de Veículos e Geração de Recibo/Comprovante Oficial da AF Motos, englobando melhorias de UX/UI no formulário de venda, redesenho do template de impressão A4 do recibo e a criação da migration de banco de dados para suportar todos os novos campos fiscais e cadastrais."

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Formulário Completo de Fechamento de Venda no Admin (Priority: P1)

Como administrador da loja, quero preencher um formulário estruturado e intuitivo com validação e máscaras automáticas ao concluir a venda de um veículo (incluindo Renavam, Chassi/VIN, KM de entrega, dados cadastrais e endereço completo do comprador, além da discriminação de entrada, financiamento/troca e termos legais), para garantir que todos os dados operacionais e fiscais sejam registrados de forma padronizada e sem erros de digitação.

**Why this priority**: É o ponto de entrada de dados essenciais da transação. Sem dados completos e validados na origem, o recibo oficial e o registro fiscal não podem ser emitidos com segurança jurídica.

**Independent Test**: Pode ser testado abrindo o modal/formulário de conclusão de venda no painel administrativo, preenchendo todos os novos campos com validação/máscara ativa e verificando a persistência íntegra dos dados cadastrais, veiculares e financeiros.

**Acceptance Scenarios**:

1. **Given** que o administrador inicia a conclusão de venda de um veículo, **When** ele digita o Renavam, **Then** o sistema aplica máscara numérica (11 dígitos) e impede caracteres inválidos.
2. **Given** o campo de Chassi (VIN), **When** o administrador digita letras minúsculas ou caracteres mistos, **Then** o sistema converte automaticamente para letras maiúsculas e limita a 17 caracteres alfanuméricos válidos.
3. **Given** os campos do comprador, **When** o tipo de documento for informado (CPF ou CNPJ), **Then** o sistema aplica dinamicamente a máscara correta (`000.000.000-00` ou `00.000.000/0000-00`), bem como a máscara telefônica `(00) 00000-0000` e campos estruturados de endereço (CEP com busca/máscara, Logradouro, Número, Bairro, Cidade e UF).
4. **Given** a seção de condições financeiras, **When** o administrador seleciona a forma de pagamento (PIX, Financiamento, Cartão de Crédito, Dinheiro, Moto na Troca), **Then** ele pode discriminar o Valor Total, Valor da Entrada e Valor Financiado/Troca com validação de consistência monetária.
5. **Given** o formulário preenchido com aceite de termos legais de vistoria e transferência, **When** o administrador submete a venda, **Then** o sistema atualiza o status do veículo para vendido, vincula os registros cadastrais/financeiros e disponibiliza a emissão imediata do recibo oficial.

---

### User Story 2 - Recibo Oficial e Comprovante de Entrega Premium A4 (Priority: P1)

Como administrador ou cliente comprador, quero emitir e imprimir um recibo oficial institucional da AF Motos em formato A4 perfeito (1 página sem quebras indesejadas, tipografia limpa, paleta grafite/dourado e blocos bem delimitados), contendo identificação completa da loja, do veículo, das partes, detalhamento financeiro, cláusulas legais de trânsito/vistoria e linhas formais de assinatura.

**Why this priority**: O recibo oficial é o documento legal e institucional que formaliza a entrega das chaves e resguarda a loja e o cliente perante o Código de Trânsito Brasileiro (CTB) e órgãos reguladores.

**Independent Test**: Pode ser testado acessando o recibo de uma venda salva, acionando a visualização/impressão e validando a disposição das 5 seções em folha A4 com cabeçalho institucional, dados fiscais, termos legais e campos de assinatura.

**Acceptance Scenarios**:

1. **Given** uma venda registrada com dados completos, **When** o recibo oficial é gerado para impressão ou exportação, **Then** o documento exibe o cabeçalho oficial com logotipo da AF Motos, Razão Social/Nome Fantasia, CNPJ, endereço completo, contatos e o badge com código único (ex.: `AFM-2026-XXXX`) e carimbo de data/hora de emissão.
2. **Given** o corpo do recibo, **When** renderizado em folha A4, **Then** exibe a Seção 1 (Identificação do Veículo em grid organizado com Marca/Modelo, Ano Fab/Mod, Placa, Cor, Renavam, Chassi e KM de Entrega) e Seção 2 (Identificação completa das Partes: Loja Vendedora e Comprador com documento e endereço completo formatado).
3. **Given** a Seção 3 de Condições de Pagamento, **When** visualizada, **Then** exibe a tabela discriminativa com Valor Total, Entrada, Saldo/Financiado/Troca, Forma de Pagamento e Status de Quitação destacados.
4. **Given** a Seção 4 de Termos Legais & Cláusulas, **When** o documento é impresso, **Then** constam os textos de aprovação de vistoria mecânica/estética, obrigação de transferência junto ao DETRAN em 30 dias (Art. 123 do CTB) e responsabilidade do comprador por infrações a partir da data/hora de entrega.
5. **Given** a Seção 5 de Assinaturas, **When** o recibo é emitido, **Then** apresenta as linhas de assinatura formal para o Representante Legal da AF Motos (com CNPJ) e para o Comprador (com Nome e CPF/CNPJ).
6. **Given** o comando de impressão (`@media print` ou PDF), **When** enviado para a impressora, **Then** o layout preserva proporções estritas de página única A4, fundo branco econômico com detalhes refinados e sem cortes de rodapé ou assinaturas.

---

### User Story 3 - Estrutura de Dados e Persistência Fiscal/Cadastral (Priority: P1)

Como desenvolvedor e arquiteto de banco de dados, quero garantir que a camada de persistência armazene com tipagem e integridade referencial todos os novos atributos de veículos, vendas e clientes (Chassi, Renavam, KM de Entrega, endereço granular, valores de entrada e financiamento, forma de pagamento e aceite dos termos), permitindo consultas rápidas e rastreabilidade total.

**Why this priority**: Sustenta todas as operações do formulário e do recibo, assegurando que migrações de banco de dados não quebrem dados históricos existentes e suportem campos nulos ou obrigatórios conforme a regra de negócio.

**Independent Test**: Pode ser validado executando a migration SQL/ORM, inserindo novos registros com os campos estendidos e consultando as relações de vendas com sucesso.

**Acceptance Scenarios**:

1. **Given** o esquema de banco de dados atualizado, **When** uma venda com dados cadastrais e fiscais é persistida, **Then** as colunas de `chassi`, `renavam`, `delivery_km`, `entry_amount`, `financed_amount`, `payment_method`, `legal_terms_accepted` e endereço completo são gravadas com sucesso.
2. **Given** registros legados ou vendas anteriores sem os novos campos, **When** a migration é executada, **Then** os dados pré-existentes permanecem íntegros sem erros de constraint ou violação de nulos.

---

### Edge Cases

- **Comprador Pessoa Jurídica (CNPJ)**: O formulário e o recibo devem alternar rótulos e máscaras adequadamente (Razão Social, CNPJ, Inscrição Estadual opcional).
- **Venda à Vista sem Entrada/Financiamento**: O recibo e o formulário devem exibir claramente "Valor Total Quitado à Vista" com valores de entrada/saldo ajustados sem exibir zeros confusos ou campos quebrados.
- **Veículo sem Renavam/Chassi pré-cadastrado no estoque**: O formulário de venda deve permitir preenchimento/atualização imediata desses dados no ato da venda caso tenham ficado pendentes no cadastro inicial do estoque.
- **Impressão com configurações de navegador divergentes**: O CSS de impressão A4 deve forçar margens seguras (ex.: 10-12mm), remoção de headers/footers automáticos do navegador e `page-break-inside: avoid` nas seções cruciais para impedir que a folha transborde para uma segunda página em branco.
- **Endereço sem complemento ou número**: O endereço deve formatar graciosamente quando campos como complemento ou número ("S/N") tiverem formatos variados.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema DEVE fornecer inputs com máscaras e validações em tempo real no formulário de venda para Renavam (11 dígitos numéricos), Chassi/VIN (17 caracteres alfanuméricos com auto-uppercase) e Quilometragem no momento da entrega.
- **FR-002**: O sistema DEVE coletar e validar os dados cadastrais do comprador: Nome/Razão Social, CPF/CNPJ com máscara dinâmica, Telefone/WhatsApp com formato brasileiro e Endereço Completo estruturado (Logradouro, Número, Complemento, Bairro, Cidade, UF e CEP).
- **FR-003**: O sistema DEVE permitir a seleção da forma de pagamento dentre as modalidades suportadas (PIX, Financiamento, Cartão de Crédito, Dinheiro, Moto na Troca) e registrar a discriminação dos valores (Valor Total, Valor de Entrada e Valor Financiado / da Troca).
- **FR-004**: O sistema DEVE disponibilizar campo de observações comerciais com texto pré-sugerido de entrega técnica (ex.: manual, chave reserva, termos de garantia e estado de conservação).
- **FR-005**: O sistema DEVE registrar o consentimento explícito dos termos legais de vistoria e responsabilidade de transferência pelo comprador.
- **FR-006**: O sistema DEVE gerar um Recibo Oficial A4 com layout institucional premium de página única, contendo: Cabeçalho completo da loja com badge identificador (`AFM-YYYY-XXXX`) e timestamp; Seção 1 (Identificação do Veículo em grid de 3 colunas); Seção 2 (Identificação das Partes); Seção 3 (Condições de Pagamento e Quitação); Seção 4 (Cláusulas legais sobre vistoria, transferência em 30 dias conforme Art. 123 do CTB e infrações pós-entrega); e Seção 5 (Linhas de assinatura formal do Vendedor e Comprador).
- **FR-007**: O template do recibo DEVE ser otimizado para impressão econômica e nítida (fundo claro, detalhes sofisticados em grafite e dourado, tipografia de alta legibilidade e sem elementos cortados em folha A4 padrão).
- **FR-008**: A camada de persistência DEVE suportar todos os novos campos nas entidades de vendas/veículos/clientes através de script de migration idempotente e seguro para dados já existentes.
- **FR-009**: O sistema DEVE permitir a reemissão e reimpressão do recibo oficial a qualquer momento através do histórico de vendas do painel administrativo.

---

### Key Entities _(include if feature involves data)_

- **Vehicle (Veículo)**: Motocicleta comercializada. Atributos chave: Marca, Modelo, Versão, Ano Fabricação/Modelo, Placa, Cor, Renavam, Chassi/VIN, Quilometragem Atual/Entrega e Status.
- **Customer (Comprador/Cliente)**: Adquirente do veículo. Atributos chave: Nome/Razão Social, CPF/CNPJ, Telefone/WhatsApp, CEP, Logradouro, Número, Complemento, Bairro, Cidade e UF.
- **Sale (Venda)**: Registro oficial da transação comercial. Atributos chave: Identificador Único do Recibo (`code`/`receipt_number`), Veículo vinculado, Comprador vinculado, Data/Hora da Venda, Valor Total, Valor de Entrada, Valor Financiado/Troca, Forma de Pagamento, Observações Comerciais, Aceite dos Termos Legais e Metadados de Emissão.
- **Store Settings (Dados Institucionais da Loja)**: Dados da AF Motos exibidos no cabeçalho e termos do recibo (Razão Social, Nome Fantasia, CNPJ, Endereço, Telefones, E-mail e Logotipo).

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: O tempo médio para um administrador preencher e concluir a venda de um veículo com todos os dados cadastrais e fiscais é inferior a 90 segundos.
- **SC-002**: 100% dos recibos gerados cabem exatamente em 1 página A4 na visualização/impressão padrão sem transbordar linhas de assinatura ou rodapés.
- **SC-003**: 0% de ocorrência de erros de formatação de Chassi, Renavam, CPF/CNPJ e Telefone no momento do envio graças às máscaras e validações integradas no formulário.
- **SC-004**: Redução a zero da necessidade de edição manual de minutas de recibos ou comprovantes externos fora da plataforma AF Motos.
- **SC-005**: 100% de compatibilidade e preservação dos registros de vendas e veículos já existentes no banco de dados após a execução da migration.

---

## Assumptions

- A loja "AF Motos" possui CNPJ e endereço fixo configurados nas configurações da plataforma (`site_settings`) que serão automaticamente incorporados ao cabeçalho do recibo.
- O formato de identificador do recibo segue o padrão institucional legível `AFM-{ANO}-{SEQUENCIAL/HASH}` (ex.: `AFM-2026-0042`).
- As cláusulas legais são baseadas na legislação brasileira padrão de compra e venda de veículos usados e Código de Trânsito Brasileiro (Art. 123 do CTB).
- A impressão pode ser realizada diretamente pelo diálogo nativo do navegador (`window.print` com estilização `@media print`) ou download de documento formatado.
