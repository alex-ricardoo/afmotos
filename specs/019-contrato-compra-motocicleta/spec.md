# Feature Specification: Contrato de Compra de Motocicleta pela AF Motos

**Feature Branch**: `019-contrato-compra-motocicleta`  
**Created**: 2026-08-31  
**Status**: Draft (Specification Ready for Review)  
**Input**: User description: "Contrato de Compra de Motocicleta pela AF Motos — formalização contratual para aquisição de veículos de particulares/clientes para o estoque próprio da loja, com reutilização literal do template visual oficial, placa Mercosul estilizada no topo, snapshot histórico imutável JSONB, controle rigoroso de quitação, prazos de transferência e proteção jurídica."

---

## 1. Executive Summary & Business Problem

Quando a **AF Motos** adquire uma motocicleta de uma pessoa física ou jurídica para compor seu **estoque próprio** (seja via compra direta, captação pelo site em "Venda sua moto", ou entrada em negociação com cliente), é indispensável formalizar a transação através de um **Instrumento Particular de Compra e Venda de Motocicleta**.

Atualmente, o sistema possui:
1. O gerador de **Acordo de Comissão/Intermediação** (`sale_agreements`), voltado exclusivamente para anúncios consignados de terceiros, no qual a loja apenas recebe comissão de intermediação e não adquire a propriedade do bem.
2. O **Comprovante/Recibo Oficial de Entrega** (`sales`), voltado para a saída do estoque (venda da loja para o cliente final).

A ausência de um documento oficial e automatizado para **entrada de estoque por compra própria** gera vulnerabilidades operacionais e jurídicas:
- Falta de prova documental inequívoca de quitação e tradição (entrega física da posse).
- Ausência de declarações formais do vendedor sobre a inexistência de gravames, roubo/furto, sinistro, leilão, multas anteriores ou vícios redibitórios.
- Insegurança na contagem de prazos para comunicação de venda e transferência documental perante os órgãos de trânsito (Detran/CTB).
- Risco de regressão visual se novos documentos forem construídos com layouts inconsistentes ou divergentes do padrão institucional já aprovado.

Esta especificação define a criação do **Contrato de Compra de Motocicleta pela AF Motos**, estabelecendo a modelagem de dados, a arquitetura de snapshot histórico imutável, o fluxo administrativo de preparação e geração, e a **reutilização literal de 100% da base visual, tipografia, faixa dourada/laranja e componente de Placa Mercosul** já existentes na plataforma.

---

## 2. Princípios Fundamentais & Diretrizes de Design

### 2.1 Reutilização Literal do Template Visual Existente (Paridade Visual 100%)
- O novo documento de compra **MUST** utilizar a mesma estrutura visual, fontes (`Helvetica` / `Helvetica-Bold`), paleta de cores (Slate escuro `#0f172a`, Dourado/Âmbar `#d97706` e `#fbbf24`, Cinza neutro `#f8fafc` e `#e2e8f0`), bordas, margens (24-28pt), espaçamentos e organização de seções do contrato atual.
- O cabeçalho institucional deve carregar automaticamente o logotipo da AF Motos, nome da loja, endereço completo, telefone/WhatsApp, e-mail e CNPJ (quando cadastrado em `site_settings`).
- **Tratamento Limpo de CNPJ**: Caso o CNPJ não esteja configurado, a linha é suprimida por completo, evitando qualquer placeholder visual ("CNPJ não informado").

### 2.2 Reutilização Fiel da Placa Mercosul no Topo Direito
- A insígnia de placa Mercosul estilizada (`MercosulPlateBadge`) presente no canto superior direito do contrato existente **MUST** ser reaproveitada de forma idêntica:
  - Tarja azul superior `#003399` com o texto em caixa alta `BRASIL` em letras brancas.
  - Corpo da placa em fundo branco com borda sólida escura e caracteres da placa em negrito com espaçamento entre letras.
  - Comportamento de fallback idêntico: caso a placa não esteja disponível no ato da geração, exibir o badge escuro (`#0f172a`) com borda dourada (`#d97706`) contendo a identificação do contrato.

### 2.3 Imutabilidade e Snapshot Histórico (JSONB)
- Cada contrato gerado grava um payload integral e auto-suficiente (`contract_snapshot jsonb`) na tabela `motorcycle_purchase_agreements`.
- Alterações posteriores nos dados do cliente, no cadastro da moto, na FIPE ou nas configurações da loja **NUNCA** modificarão contratos já emitidos.
- A reimpressão ou download posterior do PDF é gerada diretamente a partir do snapshot salvo, garantindo fidelidade probatória e custo computacional previsível.

### 2.4 Quitação Real e Integridade Comercial
- O contrato adapta suas cláusulas financeiras ao status real do pagamento.
- Se o pagamento for classificado como integral (`PAID_FULL`) e confirmado pelo operador, o documento emite cláusula expressa de quitação do preço pelo vendedor.
- Se o pagamento estiver pendente ou parcial, a cláusula de quitação integral é suprimida ou adaptada, evitando declarações falsas em documentos oficiais.

### 2.5 Segurança, RLS e Privacidade de Dados
- Todos os arquivos PDF são armazenados em bucket privado (`agreements`), e o acesso para download é concedido exclusivamente via URLs assinadas temporárias geradas para administradores autenticados.
- Nenhuma URL pública ou permissão anônima é concedida. Dados sensíveis (CPF, RG, endereço) não são expostos em listagens públicas ou logs de servidor.

---

## 3. Personas & Histórias de Usuário

### Personas
- **Alex / Administrador AF Motos**: Avalia e compra motocicletas para o estoque da loja. Precisa preencher os dados comerciais, validar as condições do veículo e emitir o contrato de compra formalizado em segundos para assinatura com o proprietário.
- **Vendedor / Proprietário da Motocicleta**: Pessoa física ou jurídica que está vendendo o veículo para a AF Motos. Recebe o contrato detalhado contendo a identificação da moto, a quitação do valor acordado e a data/hora exata em que transferiu a posse e guarda à loja.

---

### User Story 1 — Geração de Contrato de Compra a partir da Proposta (Priority: P1)
Como administrador da AF Motos, quero clicar em "Gerar Contrato de Compra" no drawer de uma proposta de venda direta, revisar os dados da moto e do proprietário em um formulário estruturado e gerar o contrato PDF com snapshot gravado no banco, para formalizar a aquisição sem retrabalho de digitação.

**Why this priority**: É o principal fluxo de conversão entre captação de motos ("Venda sua moto") e entrada de inventário no estoque.

**Acceptance Scenarios**:
1. **Given** uma proposta em `/admin/propostas` com dados de moto e proprietário, **When** o admin clica em "Gerar Contrato de Compra", **Then** o sistema abre o modal de preparação pré-preenchido com os dados da proposta e do cliente.
2. **Given** o formulário de preparação aberto, **When** o admin ajusta o valor final pago, seleciona a forma de pagamento (ex.: PIX) e marca as confirmações obrigatórias, **Then** o botão de geração é habilitado.
3. **Given** a submissão do formulário, **When** o backend processa a solicitação, **Then** grava a entidade `motorcycle_purchase_agreements` com `contract_snapshot`, faz upload do PDF no Storage e retorna o link assinado com mensagem de sucesso.

---

### User Story 2 — Geração de Contrato de Compra para Moto de Estoque Próprio (Priority: P1)
Como administrador, quero gerar o contrato de compra diretamente na tela de uma motocicleta de estoque próprio (`ownership_type = 'OWNED'`), vinculando um vendedor já cadastrado no CRM de Clientes, para formalizar aquisições presenciais feitas diretamente na loja.

**Why this priority**: Garante respaldo documental para motos que entraram no estoque por balcão ou troca presencial.

**Acceptance Scenarios**:
1. **Given** a página de detalhes de uma moto de estoque em `/admin/motos/[id]`, **When** o admin aciona a ação "Contrato de Aquisição", **Then** o sistema abre o fluxo de preparação permitindo selecionar ou buscar o cliente vendedor pelo nome ou CPF.
2. **Given** o vendedor selecionado, **When** o contrato é gerado, **Then** o vínculo `motorcycles.acquisition_agreement_id` e `motorcycles.seller_customer_id` é atualizado no banco.

---

### User Story 3 — Download e Reimpressão Histórica sem Alterações (Priority: P1)
Como administrador, quero visualizar a lista de contratos de compra emitidos, baixar o PDF a qualquer momento ou reimprimir a via original, tendo a certeza de que o documento mantém rigorosamente os valores e informações da data de emissão.

**Why this priority**: Garante segurança contábil, jurídica e auditoria fiscal em caso de fiscalização ou litígio.

**Acceptance Scenarios**:
1. **Given** um contrato emitido há 6 meses, **When** o admin clica em "Baixar PDF", **Then** o sistema gera o documento a partir do snapshot salvo ou serve o arquivo persistido no Storage, sem sofrer influência de edições recentes na moto ou na loja.
2. **Given** múltiplos cliques rápidos no botão de download/reimpressão, **When** a ação é disparada, **Then** o sistema não gera novos registros nem duplica registros no banco de dados.

---

### User Story 4 — Vínculo Opcional com Laudo de Consulta de Placa (Priority: P2)
Como administrador, quero referenciar no contrato de compra a consulta veicular oficial realizada na Spec 018 (se houver), registrando no histórico da compra que a análise cautelar e fiscal prévia foi executada.

**Why this priority**: Fortalece a comprovação de diligência e boa-fé da loja na aquisição do veículo.

**Acceptance Scenarios**:
1. **Given** uma moto com consulta de placa registrada em `vehicle_plate_consultations`, **When** o contrato de compra é gerado, **Then** o resumo da consulta (código interno, data e nível de risco) é incluído no snapshot e referenciado discretamente no contrato.

---

## 4. Requisitos Funcionais

### 4.1 Identificação das Partes e Dados Institucionais
- **FR-01**: O sistema **MUST** obter os dados da AF Motos a partir de `site_settings`, formatando Razão Social/Nome Fantasia, CNPJ, Endereço, WhatsApp e E-mail.
- **FR-02**: O sistema **MUST** omitir a linha do CNPJ se o campo estiver vazio ou nulo nas configurações da loja.
- **FR-03**: O sistema **MUST** validar e formatar os dados do vendedor (Nome Completo, CPF/CNPJ, RG, Telefone, E-mail e Endereço Completo com Cidade/UF).

### 4.2 Identificação da Motocicleta
- **FR-04**: O contrato **MUST** exibir Marca, Modelo, Versão, Ano Fabricação / Ano Modelo, Cor, Combustível, Cilindrada (se disponível), Quilometragem na entrega, Placa de Identificação, RENAVAM, Chassi e Número do Motor (se preenchido).
- **FR-05**: O contrato **MUST** renderizar o componente `MercosulPlateBadge` no canto superior direito do cabeçalho quando a placa estiver disponível.

### 4.3 Condições Comerciais, Pagamento e Quitação
- **FR-06**: O contrato **MUST** discriminar o Valor Total de Aquisição (R$), Valor Efetivamente Pago, Meio de Pagamento (PIX, TED, Dinheiro, etc.) e Data de Pagamento.
- **FR-07**: Quando o status for `PAID_FULL` e a confirmação de quitação estiver marcada, o contrato **MUST** incluir a cláusula formal de quitação integral pelo preço de compra.
- **FR-08**: Caso o pagamento não esteja integralmente quitado, o contrato **MUST** ajustar o texto, discriminando o saldo devedor e as condições de liquidação, sem emitir quitação prematura.

### 4.4 Tradição, Posse, Guarda e Responsabilidade
- **FR-09**: O contrato **MUST** registrar com precisão a data e hora da entrega física (tradição) da motocicleta à AF Motos.
- **FR-10**: O contrato **MUST** estabelecer que a posse direta, custódia e guarda da motocicleta passam à AF Motos a partir da data/hora de entrega documentada.
- **FR-11**: O contrato **MUST** explicitar que infrações de trânsito, multas, débitos fiscais (IPVA/Taxas) e ocorrências com fato gerador anterior à tradição permanecem sob responsabilidade do vendedor.

### 4.5 Transferência Documental e Obrigações CTB
- **FR-12**: O contrato **MUST** registrar o prazo para providências de transferência documental (com base no Art. 123 do CTB - 30 dias após assinatura/comunicação de venda).
- **FR-13**: O vendedor e a compradora **MUST** assumir obrigação de cooperação mútua para assinatura do ATPV-e e entrega da documentação de transferência.

### 4.6 Declarações Obrigatórias do Vendedor
- **FR-14**: O contrato **MUST** conter as declarações formais do vendedor sobre:
  1. Legítima propriedade e livre disposição do veículo;
  2. Inexistência ou discriminação expressa de multas, débitos e restrições tributárias;
  3. Inexistência de gravames financeiros, alienação fiduciária, restrições judiciais (Renajud) ou administrativas;
  4. Inexistência de histórico de roubo/furto, adulteração de motor/chassi, sinistro ou leilão não declarado;
  5. Responsabilidade civil e criminal pela veracidade das informações fornecidas.

### 4.7 Vistoria de Entrada e Itens Entregues
- **FR-15**: O contrato **MUST** conter seção resumida discriminando:
  - Quilometragem no odômetro no ato da entrega;
  - Quantidade de chaves entregues (chave principal, reserva);
  - Manual do proprietário (entregue / não entregue);
  - Documentos entregues (CRLV-e, ATPV-e, etc.);
  - Acessórios entregues;
  - Observações gerais do estado aparente.

### 4.8 Assinaturas e Rodapé
- **FR-16**: O contrato **MUST** conter espaço para assinatura das partes:
  - Compradora: AF Motos (Representante Legal);
  - Vendedor: Nome Completo e CPF/CNPJ;
  - Testemunhas: 2 campos para nome e CPF de testemunhas instrumentárias (reforço probatório).
- **FR-17**: O rodapé **MUST** conter Local e Data de emissão, identificador único do documento e texto institucional discreto.

### 4.9 Persistência e Idempotência
- **FR-18**: O sistema **MUST** salvar o snapshot JSONB completo em `motorcycle_purchase_agreements`, implementar trava contra múltiplos disparos (anti-double-click) e impedir a sobrescrita destrutiva de contratos emitidos.

---

## 5. Requisitos Não-Funcionais

1. **Performance**: A geração e renderização do PDF no servidor via `@react-pdf/renderer` deve ocorrer em menos de 2,5 segundos em condições normais.
2. **Segurança de Acesso**: Endpoint `/api/admin/purchase-agreements/generate` protegido por verificação de sessão Supabase Auth e perfil de administrador ativo (`is_admin()`).
3. **Resiliência e Fallbacks**: Ausência de campos opcionais (ex.: número do motor, RG, e-mail, CNPJ) não pode provocar exceções ou falhas na renderização do PDF.
4. **Isolamento de Dados Sensíveis**: Nenhum dado de vendedor ou documento de compra deve ser exposto publicamente na API ou em listagens externas.

---

## 6. Cláusulas Estruturadas Sugeridas para o Contrato

> [!IMPORTANT]
> As cláusulas abaixo representam a formulação padrão recomendada pela engenharia com base na legislação brasileira vigente (Código Civil e CTB). Antes do uso comercial em larga escala, recomenda-se a revisão periódica por assessoria jurídica.

```text
CLÁUSULA 1ª — DO OBJETO:
O presente instrumento tem por objeto a compra e venda da motocicleta descrita neste contrato, transferindo o VENDEDOR à COMPRADORA (AF Motos) a posse, guarda e propriedade do bem, livre e desembaraçado de quaisquer dúvidas, dívidas ou restrições, ressalvadas as disposições expressas deste contrato.

CLÁUSULA 2ª — DO PREÇO, PAGAMENTO E QUITAÇÃO:
Pela aquisição da motocicleta objeto deste contrato, a COMPRADORA pagará/pagou ao VENDEDOR a quantia líquida e certa discriminada no quadro resumo. O VENDEDOR, mediante o efetivo recebimento e compensação do valor pactuado, concede à COMPRADORA plena, geral, rasa e irrevogável quitação quanto ao preço de compra, nada mais tendo a reclamar a esse título em tempo algum.

CLÁUSULA 3ª — DA ENTREGA DA POSSE E RESPONSABILIDADE:
A entrega física da motocicleta (tradição), com seus respectivos documentos, chaves e acessórios discriminados, ocorre na data e horário registrados neste instrumento. A partir deste momento exato da entrega física, a COMPRADORA assume a posse direta, a guarda, a custódia e a responsabilidade civil e administrativa pela circulação e conservação do veículo.

CLÁUSULA 4ª — DOS DÉBITOS E FATOS GERADORES ANTERIORES:
O VENDEDOR declara expressamente e responsabiliza-se integral e exclusivamente por todos e quaisquer débitos de IPVA, taxas de licenciamento, DPVAT/SPVAT, multas de trânsito por infrações cometidas até a data e hora da entrega física, bem como por quaisquer encargos tributários, administrativos, cíveis ou criminais cujo fato gerador seja anterior à tradição, obrigando-se a ressarcir imediatamente a COMPRADORA caso esta venha a ser cobrada ou compelida a saldá-los.

CLÁUSULA 5ª — DAS DECLARAÇÕES E GARANTIAS DE TITULARIDADE:
O VENDEDOR declara, sob as penas da lei, que: (a) é o legítimo proprietário e possuidor da motocicleta e possui plena capacidade civil e poderes para aliená-la; (b) a motocicleta não possui impedimentos judiciais, restrições financeiras, gravames, bloqueios Renajud, alienação fiduciária não informada ou reserva de domínio; (c) o veículo não é produto de roubo, furto, estelionato, sinistro grave de perda total ou leilão não informado; (d) as numerações de chassi e motor são originais, íntegras e coincidem com o cadastro oficial nos órgãos de trânsito; (e) responde civil e criminalmente pela evicção de direito (Art. 447 do Código Civil) e pela veracidade de todas as informações prestadas.

CLÁUSULA 6ª — DA TRANSFERÊNCIA DOCUMENTAL E COOPERAÇÃO:
As partes comprometem-se a praticar todos os atos e assinar os documentos físicos ou eletrônicos necessários (em especial a ATPV-e / CRV) para a formalização da transferência de propriedade perante o DETRAN competente, dentro do prazo legal aplicável de até 30 (trinta) dias, contados da comunicação de venda e assinatura do documento.

CLÁUSULA 7ª — DO ESTADO DE CONSERVAÇÃO E VISTORIA:
A motocicleta é recebida pela COMPRADORA no estado de conservação aparente discriminado no quadro de vistoria deste contrato, respondendo o VENDEDOR por vícios redibitórios ocultos ou adulterações preexistentes que não pudessem ser identificados no exame preliminar de entrada.

CLÁUSULA 8ª — DA LEI APLICÁVEL E FORO:
O presente contrato é regido pelas leis da República Federativa do Brasil, em especial o Código Civil Brasileiro e o Código de Trânsito Brasileiro. Para dirimir quaisquer controvérsias oriundas deste instrumento, as partes elegem o foro da Comarca onde se localiza a sede da COMPRADORA, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
```

---

## 7. Critérios de Aceite & Sucesso (Mensuráveis e Agósticos de Tecnologia)

- [ ] Administradores conseguem gerar o contrato de compra completo a partir de uma proposta ou de uma moto de estoque em **menos de 3 cliques**.
- [ ] O contrato gerado reproduz com **100% de fidelidade visual** o template, logotipo, cabeçalho, faixa dourada/laranja e rodapé do contrato institucional já em operação.
- [ ] O componente de **Placa Mercosul** no topo direito é renderizado perfeitamente com os caracteres da placa da moto comprada (ou badge escuro institucional caso ausente).
- [ ] O contrato gerado armazena um snapshot imutável de dados, permitindo download e reimpressão idênticos mesmo após futuras edições no cadastro de motos ou clientes.
- [ ] O contrato adapta as cláusulas de pagamento conforme o status de quitação real, impedindo declarações de quitação integral se o valor não estiver pago.
- [ ] Arquivos PDF permanecem protegidos em ambiente seguro e privado, com acesso restrito a administradores autenticados.
- [ ] Não há qualquer regressão visual ou quebra funcional no gerador de acordos de comissão (`sale_agreements`) existente.
