# Feature Specification: Checkout Pro para Pacotes de Créditos B2B com Gestão Administrativa

**Feature Branch**: `feat/mercadopago-credit-package-checkout`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "Checkout Pro para Pacotes de Créditos B2B com Gestão Administrativa"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Compra Direta de Pacote Pré-configurado via Checkout Pro (Priority: P1)

Como um cliente corporativo ou lojista autenticado na plataforma, quero acessar a área de pacotes de consultas veiculares, escolher um pacote pré-configurado ativo (ex: 5, 15 ou 30 consultas) e pagar diretamente através de um fluxo seguro de checkout, para que meus créditos sejam liberados e creditados no meu saldo imediatamente após a confirmação autoritativa do pagamento.

**Why this priority**: É o valor central da funcionalidade comercial, permitindo autoatendimento e aquisição instantânea de créditos 24/7 sem necessidade de atendimento manual humano.

**Independent Test**: Pode ser testado de ponta a ponta iniciando uma compra com usuário autenticado, completando o fluxo de pagamento com aprovação autoritativa do provedor de pagamento, e verificando que o saldo de créditos do cliente foi creditado exatamente com a quantidade estipulada pelo pacote.

**Acceptance Scenarios**:

1. **Given** um cliente autenticado na tela de pacotes de créditos com saldo inicial de 0 créditos, **When** ele seleciona o pacote comercial ativo de 5 consultas e inicia a compra, **Then** o sistema gera uma ordem de pedido com valor canônico e redireciona o cliente para o checkout oficial.
2. **Given** um cliente que completou o pagamento no provedor oficial, **When** a confirmação autoritativa do pagamento (status aprovado) é recebida pelo sistema com valor e identificadores correspondentes, **Then** a ordem é marcada como paga, um novo pacote de créditos com origem rastreada é criado, o saldo do cliente é incrementado em 5 créditos e o extrato (ledger) registra a concessão.
3. **Given** um cliente que clica múltiplas vezes rapidamente no botão de compra ou reenviou a mesma requisição, **When** a chave de idempotência é detectada, **Then** o sistema reutiliza a ordem pendente existente sem duplicar registros financeiros ou gerar múltiplos pedidos.

---

### User Story 2 - Direcionamento Exclusivo ao WhatsApp para Pacotes Personalizados (Priority: P1)

Como um cliente de grande porte (frotas massivas ou concessionárias) visualizando a opção de volume customizado (ex: 50+ consultas), quero ser direcionado para negociação humana via canal de atendimento direto (WhatsApp), garantindo que propostas personalizadas não passem pelo checkout automatizado de preço fixo.

**Why this priority**: Evita que pacotes com preços sob demanda, faturamento corporativo ou regras flexíveis sejam processados por um fluxo inadequado de preço fixo padrão.

**Independent Test**: Testar selecionando o pacote customizado na interface do cliente e verificando que nenhum pedido de checkout automatizado pode ser criado, abrindo em vez disso o canal de atendimento com mensagem pré-preenchida.

**Acceptance Scenarios**:

1. **Given** um cliente visualizando os pacotes disponíveis, **When** ele clica na opção do pacote customizado (50+ consultas), **Then** o sistema abre o canal de WhatsApp oficial da empresa com mensagem contextualizada contendo o nome e identificador do cliente.
2. **Given** uma requisição direta tentando iniciar checkout automatizado informando o identificador de um pacote marcado como personalizado/somente contato, **When** o sistema valida a requisição, **Then** a operação é expressamente rejeitada com erro de política comercial.

---

### User Story 3 - Proteção Estrita Contra Manipulação de Preços e Quantidades (Priority: P1)

Como plataforma e proprietário do negócio, quero que o backend seja a fonte única da verdade para todos os preços, descontos e quantidades de créditos, de modo que nenhuma informação enviada pelo navegador do usuário possa adulterar o valor cobrado ou a quantidade creditada.

**Why this priority**: Blindagem crítica contra fraudes financeiras e perdas comerciais decorrentes de adulteração de requisições no lado do cliente.

**Independent Test**: Testar enviando intencionalmente parâmetros alterados (ex: preço = R$ 1,00, créditos = 1000) e verificar que o sistema ignora integralmente esses valores e processa a ordem unicamente com os dados oficiais ativos configurados no banco de dados.

**Acceptance Scenarios**:

1. **Given** um usuário mal-intencionado que envia na requisição de compra parâmetros de preço ou desconto adulterados, **When** o backend processa a criação da ordem, **Then** os parâmetros enviados são ignorados e a ordem é criada utilizando unicamente o preço em centavos e a quantidade de créditos da oferta cadastrada no sistema.
2. **Given** um pacote inativo, despublicado ou excluído logicamente, **When** um usuário tenta submeter uma ordem de compra para essa oferta, **Then** o sistema recusa a transação informando que o pacote não está disponível para aquisição.

---

### User Story 4 - Retorno Transparente e Concessão Idempotente de Créditos (Priority: P2)

Como um cliente retornando ao sistema após concluir o pagamento no provedor externo, quero ver uma tela de acompanhamento que consulte o status oficial e seguro da minha compra e me informe o momento exato em que os créditos foram adicionados ao meu saldo, sem depender de parâmetros inseguros na URL.

**Why this priority**: Proporciona clareza e tranquilidade ao cliente durante o tempo de processamento assíncrono do pagamento, mantendo total rigor de segurança.

**Independent Test**: Testar acessando a página de retorno com status simulado na URL e verificar que os créditos só são mostrados como disponíveis após a verificação autoritativa do servidor.

**Acceptance Scenarios**:

1. **Given** um cliente que retorna da plataforma de pagamento com a notificação ainda em processamento, **When** a tela de retorno é carregada, **Then** o cliente visualiza o estado "Confirmando pagamento" e um botão para atualizar o status sem necessidade de recarregar a sessão.
2. **Given** que o webhook oficial ou a verificação ativa confirmou a aprovação do pagamento, **When** a concessão é disparada, **Then** o saldo é atualizado, a tela exibe confirmação de sucesso com o novo saldo e tentativas subsequentes de reprocessar o mesmo evento retornam sucesso sem duplicar créditos.

---

### User Story 5 - Gestão Administrativa de Ofertas Comerciais de Pacotes (Priority: P2)

Como administrador do sistema, quero cadastrar, editar, ativar, desativar, ordenar e destacar ofertas de pacotes comerciais na área administrativa, definindo preços finais em moeda nacional e quantidade de créditos, para que a vitrine de clientes reflita imediatamente as estratégias comerciais vigentes.

**Why this priority**: Dá autonomia para a gestão comercial criar promoções e ajustar preços sem necessidade de alteração de código ou reimplantação de software.

**Independent Test**: Testar o cadastro de um novo pacote na área administrativa e verificar que ele passa a ser exibido na área do cliente com o preço, desconto calculado e regras de visualização configuradas.

**Acceptance Scenarios**:

1. **Given** um administrador autenticado com perfil ativo, **When** ele cadastra uma nova oferta informando nome, 10 créditos, preço final de R$ 320,00 e marca como ativa, **Then** a oferta é salva, auditada e o sistema calcula automaticamente o preço por unidade e o percentual de desconto comparativo.
2. **Given** uma oferta existente que já possui compras registradas, **When** o administrador altera o preço da oferta para vendas futuras, **Then** as novas compras adotam o novo preço e todos os pedidos anteriores mantêm seus valores históricos imutáveis.

---

### User Story 6 - Gestão de Pedidos, Reconciliação e Política de Estorno (Refund) (Priority: P3)

Como administrador do sistema, quero visualizar a listagem completa de pedidos de pacotes (distinguindo pagamentos via checkout automatizado de concessões manuais), com capacidade de forçar reconciliação de status e aplicar estornos de acordo com o nível de consumo dos créditos.

**Why this priority**: Permite controle financeiro, resolução de eventuais divergências e cumprimento de regras de reembolso e cancelamento de forma transparente e segura.

**Independent Test**: Testar uma solicitação de estorno em pacote sem uso (cancelando o saldo total) e em pacote parcialmente usado (bloqueando créditos restantes e encaminhando para revisão manual).

**Acceptance Scenarios**:

1. **Given** um pedido de pacote pago cujos créditos nunca foram utilizados, **When** um estorno é aprovado e confirmado, **Then** o pacote de créditos é cancelado, os créditos disponíveis são revogados no extrato e o registro financeiro é atualizado para estornado.
2. **Given** um pacote cujos créditos já foram parcialmente consumidos em laudos veiculares entregues, **When** uma notificação de estorno ocorre, **Then** os créditos restantes são bloqueados, o pacote é marcado para "revisão manual" e um alerta de auditoria é registrado sem apagar o histórico de laudos já realizados.

---

### Edge Cases

- **Webhook duplicado ou fora de ordem**: O sistema deve receber a notificação, registrar o recebimento e, detectando que o pedido já foi processado e creditado, responder com confirmação de sucesso sem conceder créditos novamente.
- **Divergência de valor monetário ou moeda**: Se o valor efetivamente capturado no provedor de pagamento for diferente do valor registrado na ordem no momento da criação, a ordem não deve ser aprovada e os créditos não devem ser concedidos, gerando alerta de divergência para análise.
- **Falha de conexão com o provedor na tela de retorno**: Caso a consulta de reconciliação falhe temporariamente por instabilidade externa, a tela deve exibir orientação amigável e permitir nova tentativa sem corromper o estado do pedido.
- **Exclusão ou desativação de pacote enquanto cliente está no checkout**: Se uma oferta for desativada enquanto o cliente realiza o pagamento, pedidos já emitidos antes da desativação com identificador válido devem ser honrados normalmente no recebimento do webhook.
- **Usuário tenta adquirir pacote com créditos zerados ou preço zero**: O sistema deve impedir a geração de ordens com quantidade de créditos menor ou igual a zero ou com valor financeiro menor ou igual a zero para pacotes vendáveis.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema DEVE manter uma tabela independente de catálogo comercial de ofertas de pacotes (`credit_package_offers`), separando o catálogo de venda das instâncias de pacotes efetivamente concedidos a clientes.
- **FR-002**: Cada oferta de pacote DEVE conter nome, identificador textual amigável (slug), tipo de pacote, quantidade de créditos maior que zero, preço final em centavos maior que zero para ofertas vendáveis, indicador de ativação, indicador de destaque comercial, ordem de exibição e sinalizadores de "somente contato / WhatsApp".
- **FR-003**: A área de pacotes do cliente DEVE carregar dinamicamente as ofertas ativas e publicadas a partir do backend, calculando e exibindo preço final, valor unitário por consulta e desconto comparativo.
- **FR-004**: O frontend NUNCA DEVE ser a fonte de verdade para preços, quantidades ou percentuais de desconto; requisições de checkout DEVEM enviar exclusivamente o identificador da oferta e uma chave de idempotência.
- **FR-005**: Ao iniciar um checkout de pacote, o backend DEVE verificar a validade e o estado ativo da oferta, recuperar seu preço oficial persistido e criar uma ordem de compra de pacote (`credit_package_orders`) com registro imutável do valor e quantidade no momento da criação.
- **FR-006**: O sistema DEVE registrar uma transação financeira associada na tabela de transações (`payment_transactions`) identificando a finalidade como aquisição de pacote de créditos (`purpose = credit_package`), garantindo unicidade e referência externa vinculada ao identificador da ordem.
- **FR-007**: A preferência de pagamento enviada ao provedor externo DEVE conter o título do pacote, quantidade unitária igual a 1, o valor canônico em centavos convertido para a moeda oficial, referência externa e metadados contextuais estritos (ordem, oferta, usuário e quantidade de créditos).
- **FR-008**: Pacotes comerciais marcados como "somente contato / WhatsApp" DEVEM exibir exclusivamente o botão de direcionamento para o canal de atendimento e DEVEM ser rejeitados caso haja tentativa de envio para o fluxo de checkout automatizado.
- **FR-009**: O webhook e o mecanismo de reconciliação DEVEM verificar a autenticidade criptográfica da notificação, consultar o status oficial do pagamento na API do provedor e validar a correspondência exata do identificador do pedido, moeda e valor monetário em centavos.
- **FR-010**: A concessão de créditos DEVE ser realizada de forma atômica e estritamente idempotente somente após confirmação autoritativa de pagamento aprovado, gerando o pacote comprado com origem de compra automatizada (`mercadopago_package`), lançando entrada no livro contábil (ledger) e atualizando o balanço de créditos do cliente.
- **FR-011**: Nenhuma concessão de créditos DEVE ocorrer exclusivamente com base no retorno do navegador do cliente ou em parâmetros contidos na URL da página de retorno.
- **FR-012**: A página de retorno do cliente DEVE consultar o status do pedido no servidor e exibir estados claros de processamento: "Aguardando confirmação", "Pagamento aprovado e créditos liberados", "Pagamento recusado" ou "Necessidade de nova verificação".
- **FR-013**: Em caso de estorno (refund) total antes de qualquer consumo de créditos do pacote adquirido, o sistema DEVE cancelar o pacote, revogar os créditos correspondentes no livro contábil e atualizar o balanço do cliente.
- **FR-014**: Em caso de solicitação de estorno de pacote cujos créditos já foram consumidos parcialmente, o sistema DEVE bloquear o saldo remanescente não consumido, marcar o pacote para revisão manual e alertar o administrador, preservando a integridade dos laudos já emitidos.
- **FR-015**: A área administrativa DEVE disponibilizar módulo para gerenciar o catálogo de ofertas (criar, editar, ativar, desativar, reordenar) com auditoria de alterações, e visualizar todos os pedidos de pacotes com seus status de pagamento, liberação de créditos e opções de reconciliação.
- **FR-016**: Toda operação sensível de cadastro de oferta, concessão de créditos, alteração de status financeiro e estorno DEVE registrar evento imutável na trilha de auditoria do sistema, contendo identificadores mascarados, ator da ação, valores monetários e carimbo de tempo.

### Key Entities

- **Oferta de Pacote de Créditos (`credit_package_offers`)**: Representa o modelo comercial de pacote exibido na vitrine e disponível para contratação. Contém identificador, slug, nome comercial, descrição, tipo, quantidade de créditos concedida, preço final de venda em centavos, preço de referência comparativo, sinalizadores de controle (ativo, destaque, somente WhatsApp), validade em dias e ordenação.
- **Pedido de Pacote de Créditos (`credit_package_orders`)**: Representa a intenção de compra e o ciclo de vida financeiro de um pedido de pacote por um cliente. Contém o cliente solicitante, oferta de origem, snapshot congelado de quantidade e valor em centavos, status do pedido (pendente, em processo, pago, rejeitado, cancelado, estornado, revisão manual), chaves de idempotência, referência externa, e identificadores da preferência e do pagamento oficial.
- **Pacote de Crédito Comprado (`customer_credit_packages`)**: Instância real de créditos concedida à conta do cliente. Representa o lote de créditos disponível para consumo em consultas de placas. Vincula-se à oferta original e ao pedido financeiro aprovado quando adquirido via checkout automatizado.
- **Lançamento Contábil de Créditos (`customer_credit_ledger`)**: Registro contábil append-only que atesta qualquer movimentação no balanço do cliente (concessão, reserva, consumo, estorno ou expiração), garantindo auditabilidade incontestável.
- **Saldo Agregado de Créditos (`customer_credit_balances`)**: Visão consolidada em tempo real dos créditos disponíveis, reservados e consumidos por usuário, permitindo bloqueios atômicos contra gastos duplos.
- **Transação de Pagamento (`payment_transactions`)**: Registro financeiro da tentativa de pagamento no gateway, unificando a rastreabilidade monetária para consultas individuais e compras de pacotes de crédito.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: O cliente autenticado consegue selecionar um pacote comercial e ser redirecionado para o checkout em menos de 3 segundos a partir do clique de compra.
- **SC-002**: 100% dos pacotes comprados com pagamento aprovado pelo provedor têm seus créditos liberados e visíveis no saldo do cliente sem intervenção humana manual.
- **SC-003**: 0% de divergência de valores: nenhum pedido pode ser gerado ou aprovado com valor monetário ou quantidade de créditos diferente da configuração oficial ativa no momento da compra.
- **SC-004**: 100% de prevenção de crédito duplicado diante de retransmissões de webhooks, cliques múltiplos de usuários ou chamadas repetidas de reconciliação.
- **SC-005**: 100% das ofertas com a opção "somente contato / WhatsApp" ativada direcionam para o atendimento humano sem permitir acionamento de checkout automatizado.
- **SC-006**: Administradores conseguem cadastrar, atualizar preços e alterar visibilidade de ofertas comerciais com propagação imediata para a área de clientes sem necessidade de deploy.
- **SC-007**: 100% dos eventos de checkout, aprovação, concessão de crédito, falha e estorno possuem registro imutável em logs estruturados de auditoria sem exposição de credenciais ou dados sigilosos.

## Assumptions

- O cliente já possui conta criada e autenticada na plataforma para poder adquirir pacotes de créditos pré-pagos.
- A integração com a API oficial do provedor de pagamento (Mercado Pago Checkout Pro) e o webhook existente com validação de assinatura HMAC serão reaproveitados e adaptados para rotear eventos por finalidade.
- A moeda padrão das transações e dos pacotes de consulta veicular é o Real Brasileiro (BRL).
- Os créditos adquiridos por clientes são de uso individual na conta do titular, consumidos no fluxo de consultas veiculares na proporção de 1 crédito por laudo concluído com sucesso.
- Negociações personalizadas e customizadas continuam ocorrendo via canal humano no WhatsApp e, caso acordado, o administrador pode continuar utilizando a funcionalidade de concessão manual de créditos existente no painel administrativo.
