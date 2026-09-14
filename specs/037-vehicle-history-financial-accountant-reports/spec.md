# Feature Specification: Relatório Financeiro e Operacional de Histórico Veicular para Gestão e Contador

**Feature Directory**: `specs/037-vehicle-history-financial-accountant-reports`  
**Feature Branch**: `feat/vehicle-history-financial-accountant-reports`  
**Created**: 2026-09-14  
**Status**: Ready for Planning  
**Target Domain**: Relatórios Gerenciais, Operacionais e Financeiros de Histórico Veicular  

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Gestão Centralizada e Versionada de Precificação e Custo do Provedor (Priority: P1)

Como Administrador da AF Motos, desejo configurar o preço de venda da consulta avulsa e o custo unitário cobrado pelo provedor (API Brasil) na mesma interface administrativa de configurações do Histórico Veicular, com versionamento imutável e confirmação explícita, para que reajustes de preço ou aumento de custo pelo provedor afetem somente consultas futuras sem nunca recalcular retrospectivamente consultas já processadas no passado.

**Why this priority**: É a fundação do modelo financeiro confiável e a "regra de ouro" do negócio: nunca alterar o custo histórico das consultas ao reajustar a tabela vigente. Sem essa trava, qualquer relatório retroativo apresentaria margens distorcidas e violaria a integridade contábil.

**Independent Test**:
Pode ser testado de forma autônoma acessando `/admin/configuracoes` (aba Histórico Veicular), alterando o custo API Brasil de R$ 30,00 para R$ 35,00 e o preço de venda de R$ 39,90 para R$ 49,90 com nota de motivo. O sistema cria uma nova versão vigente, desativa a versão anterior, salva o snapshot na versão de precificação e novas consultas adotam o novo custo/preço, enquanto consultas passadas preservam seus custos originais (R$ 30,00).

**Acceptance Scenarios**:
1. **Given** que o administrador autenticado acessa a aba de Histórico Veicular nas configurações do sistema, **When** visualiza a seção "Precificação e Custo do Histórico Veicular", **Then** o sistema exibe o preço de venda atual (R$), o custo atual por consulta live do provedor (R$), a margem bruta estimada unitária e o histórico auditado de versões com vigência e responsável.
2. **Given** que o administrador altera o custo da API Brasil de R$ 30,00 para R$ 35,00, **When** submete o formulário com o motivo da alteração e confirma a modal reforçada, **Then** uma nova versão é ativada no banco com `effective_from = now()`, a versão anterior é encerrada (`effective_to = now()`), e um evento de auditoria imutável é registrado.
3. **Given** consultas veiculares concluídas no passado sob a vigência do custo de R$ 30,00, **When** a nova versão de R$ 35,00 entra em vigor, **Then** as consultas passadas mantêm rigorosamente o snapshot de custo de R$ 30,00 em todas as visualizações, somatórios e relatórios gerenciais.
4. **Given** uma tentativa de salvar valor negativo ou formato inválido para preço ou custo, **When** o administrador tenta submeter, **Then** a validação rejeita a operação com mensagem amigável e impede a gravação.
5. **Given** um usuário comum ou cliente final da loja, **When** tenta acessar ou consultar endpoints de configuração ou dados públicos de site_settings, **Then** o custo da API Brasil, a margem de lucro e os metadados de provedor nunca são expostos na API ou no DOM do cliente.

---

### User Story 2 - Central Administrativa de Relatórios Financeiros e Operacionais (Priority: P1)

Como Gestor Financeiro / Administrador, desejo acessar uma central analítica completa de Histórico Veicular na rota de relatórios gerenciais do painel, com cards de KPI consolidados, filtros por período e três visões tabulares detalhadas (Consultas & Custo, Pagamentos & Estornos, Pacotes & Créditos), para monitorar faturamento bruto, estornos confirmados, receita líquida, custos efetivos da API Brasil, margem bruta estimada e volume operacional.

**Why this priority**: Fornece visibilidade em tempo real sobre a saúde financeira e operacional do produto de histórico veicular, permitindo identificar gargalos de entrega, custos anômalos de provedor e discrepâncias entre receitas de cartão/Pix e consumo de pacotes.

**Independent Test**:
Pode ser testado acessando `/admin/relatorios?tab=historico-veicular`, aplicando filtros de período ("Mês Atual", "Últimos 7 dias", "Personalizado"), verificando se os cards superiores somam exatamente os valores exibidos nas três tabelas paginadas e validando a segregação entre receitas de pagamento avulso e entregas via créditos B2B.

**Acceptance Scenarios**:
1. **Given** um período selecionado no filtro global de relatórios, **When** a aba de Histórico Veicular é carregada, **Then** os cards superiores exibem: Receita Bruta Aprovada (Mercado Pago), Estornos Confirmados, Receita Líquida, Custo Total Efetivo API Brasil, Margem Bruta Estimada, Consultas Concluídas, Consultas Live Cobradas, Cache Hits (custo zero), Consultas via Crédito B2B, Créditos Consumidos, Falhas Permanentes e Estornos Pendentes.
2. **Given** uma consulta entregue via cache local (reaproveitamento de laudo prévio elegível), **When** visualizada na aba "Consultas e Custo", **Then** a coluna de custo efetivo exibe R$ 0,00 e status "Não Aplicável / Cache Hit", não somando custo no card de Custo API Brasil.
3. **Given** uma consulta live que gerou chamada cobrável à API Brasil, **When** visualizada na tabela, **Then** exibe o custo snapshot fixado na data da chamada, o status HTTP do provedor e a margem bruta calculada.
4. **Given** transações com status `pending`, `rejected` ou `cancelled`, **When** o relatório computa a receita bruta e líquida, **Then** esses pagamentos são desconsiderados dos totais de receita aprovada.
5. **Given** estornos confirmados (`status = confirmed` na tabela de refunds), **When** o relatório calcula a receita líquida, **Then** o valor exato dos estornos confirmados é subtraído da receita bruta aprovada.

---

### User Story 3 - Segregação Operacional e Financeira de Créditos e Pacotes B2B (Priority: P2)

Como Administrador da AF Motos, desejo visualizar detalhadamente os pacotes de créditos B2B negociados (agências, lojistas parceiros e revendedores), com acompanhamento de créditos concedidos, reservados, consumidos e devolvidos, canal de pagamento externo informado e custo API Brasil incorrido por cada parceiro, para separar entradas de caixa de consumo operacional.

**Why this priority**: Consultas realizadas via crédito não são novas entradas de dinheiro no gateway; o dinheiro foi pago previamente na negociação do pacote ou via Pix manual. Misturar créditos com receita de gateway causaria contabilidade duplicada.

**Independent Test**:
Pode ser testado gerando uma consulta via crédito para um cliente parceiro, verificando na aba "Pacotes e Créditos" que o consumo foi debitado do pacote correto, o custo API Brasil gerado na entrega foi atribuído ao parceiro, e o painel de pagamentos Mercado Pago não sofreu incremento espúrio de receita avulsa.

**Acceptance Scenarios**:
1. **Given** um pacote B2B com 10 créditos concedidos por R$ 300,00 via Pix manual, **When** o gestor acessa a aba "Pacotes e Créditos", **Then** o sistema exibe o cliente/agência, créditos totais, créditos consumidos, saldo restante, canal de pagamento, receita comercial informada e custo API Brasil acumulado das consultas realizadas por aquele cliente.
2. **Given** que uma consulta via crédito falha definitivamente após todas as tentativas, **When** o crédito é devolvido ao saldo disponível do cliente, **Then** o evento de estorno operacional é refletido na contagem de créditos devolvidos sem gerar estorno financeiro em gateways de pagamento.
3. **Given** pacotes promocionais ou de teste com valor comercial zero ou não informado, **When** o relatório é consolidado, **Then** o sistema alerta que o pacote possui valor comercial não classificado/pendente de conciliação e computa apenas os custos operacionais incorridos.

---

### User Story 4 - Informe Anual e Demonstrativo Gerencial para o Contador (Priority: P2)

Como Administrador ou Contador da AF Motos, desejo selecionar um ano-calendário (ex.: 2026) e gerar um demonstrativo anual estruturado com consolidação mensal de receitas de gateway, estornos confirmados, receitas de pacotes informadas, custos de provedores e volume de consultas, permitindo exportação em CSV padronizado e visualização gerencial com disclaimer de apoio contábil.

**Why this priority**: Simplifica drasticamente a rotina de fechamento de balanço e apuração anual da empresa com o contador externo, fornecendo dados higienizados e auditados sem depender de cruzamento manual em planilhas despadronizadas.

**Independent Test**:
Pode ser testado selecionando o ano "2026" na aba "Informe Anual", conferindo o resumo anual e o detalhamento mês a mês (Janeiro a Dezembro), clicando em "Exportar CSV Anual" e verificando que o arquivo gerado contém exatamente as colunas acordadas com todas as informações financeiras e cadastrais autorizadas, sem expor chaves secretas ou dados sensíveis.

**Acceptance Scenarios**:
1. **Given** o ano de exercício selecionado, **When** o demonstrativo anual é exibido, **Then** apresenta o resumo do período (Receita Bruta MP, Estornos, Receita Líquida MP, Receitas de Pacotes, Custos API Brasil, Margem Gerencial, Saldo de Créditos no Encerramento do Ano) e a grade mensal estruturada.
2. **Given** o arquivo CSV gerado na exportação, **When** aberto em software de planilhas, **Then** possui codificação UTF-8 com BOM, separadores padronizados, cabeçalhos descritivos em português, valores monetários em formato decimal seguro e identificadores anonimizados/mascarados conforme regras de proteção de dados.
3. **Given** a exibição ou impressão do relatório contábil, **When** o usuário visualiza o cabeçalho e rodapé do documento, **Then** o sistema estampa o aviso legal mandatório: "Este documento é um relatório gerencial de apoio à organização financeira e contábil. Não substitui notas fiscais, livros fiscais, extratos bancários, conciliação financeira ou declaração tributária oficial. Valide a apuração com seu contador."
4. **Given** consultas executadas em modo mock/teste, **When** o relatório anual oficial da empresa é compilado, **Then** dados de teste são estritamente excluídos dos números oficiais, a menos que um filtro específico de auditoria de testes seja deliberadamente ativado pelo administrador.

---

## Edge Cases

- **Provedor API Brasil sem saldo (HTTP 402 ou erro de saldo)**: A tentativa é interrompida antes de consumir créditos na API Brasil. O sistema registra a falha operacional, porém o custo da chamada é classificado como `not_incurred` (R$ 0,00) e não é computado como despesa no relatório financeiro.
- **Falha de rede / Timeout de 120s da API Brasil**: Caso a requisição sofra timeout ou caia antes de receber status de tarifação, o custo é registrado como `unknown` até conciliação ou reprocessamento, sendo segregado da coluna de custos efetivamente confirmados.
- **Múltiplos retries do Delivery Job para a mesma consulta**: O sistema garante através de chave de idempotência e vínculo único que apenas a chamada efetivamente cobrada pelo provedor gere registro de custo. Retries descartados antes da cobrança não duplicam custos.
- **Cache Hit de laudo prévio**: Quando o cliente compra uma consulta para uma placa cujo laudo válido já existe na base local (`vehicle_plate_consultations`), o sistema entrega o laudo em cache. O relatório registra a receita do cliente, mas registra custo do provedor igual a R$ 0,00 com badge explicativo de Cache Hit.
- **Reajuste de preço ou custo retroativo**: Caso o administrador altere o custo de R$ 30,00 para R$ 35,00 em 15/09/2026, todas as consultas executadas até 14/09/2026 permanecem imutáveis com custo de R$ 30,00. O recálculo retrospectivo é terminantemente bloqueado pelo banco e pela aplicação.
- **Estorno pendente vs. Estorno confirmado**: Um estorno com status `requested` ou `pending` no Mercado Pago não é abatido da receita líquida imediatamente, mas é destacado no card de alerta "Estornos Pendentes" para acompanhamento do gestor. Somente quando o status muda para `confirmed` a receita líquida é reduzida.
- **Pacote B2B negociado com pagamento a prazo ou não quitado**: O sistema permite cadastrar o valor total pactuado e o status de pagamento do pacote, mantendo o valor comercial claramente identificado como "gerencial sob conciliação".

---

## Requirements _(mandatory)_

### Functional Requirements

#### 1. Precificação e Custo do Histórico Veicular
- **FR-001**: O sistema MUST fornecer na interface administrativa de configurações do Histórico Veicular (`/admin/configuracoes`) um bloco unificado para configurar o Preço de Venda da Consulta Avulsa e o Custo Unitário da API Brasil por consulta live.
- **FR-002**: O sistema MUST armazenar as regras de precificação em estrutura versionada e imutável (`vehicle_history_pricing_versions`), onde cada alteração encerra a vigência da versão anterior (`effective_to`) e gera uma nova versão ativa (`effective_from`).
- **FR-003**: O sistema MUST garantir que em nenhum momento mais de uma versão de precificação esteja ativa simultaneamente para o serviço de histórico veicular.
- **FR-004**: O sistema MUST validar que os valores de preço de venda e custo de provedor sejam numéricos estritamente positivos (maiores que zero), rejeitando valores nulos, negativos ou formatos inválidos.
- **FR-005**: O sistema MUST calcular e exibir em tempo real no formulário a margem bruta estimada unitária (`preço de venda - custo API Brasil`) e a margem percentual correspondente.
- **FR-006**: O sistema MUST exigir confirmação reforçada e preenchimento opcional de nota de motivo antes de aplicar alterações nas tarifas vigentes.
- **FR-007**: O sistema MUST registrar evento estruturado de auditoria (`vehicle_history_pricing.updated`) contendo preço anterior, novo preço, custo anterior, novo custo, ID do administrador responsável, timestamp e nota de alteração.
- **FR-008**: O sistema MUST fornecer um helper server-side centralizado (`getVehicleHistoryPricingConfig()`) para leitura da versão ativa com cache controlado e fallback seguro, eliminando magic numbers (como 30, 30.00 ou 39.90) espalhados pelo código.

#### 2. Registro e Snapshot de Custo Efetivo
- **FR-009**: O sistema MUST associar a cada consulta veicular executada um snapshot de custo imutável (`cost_snapshot_cents`), capturado diretamente da versão de precificação vigente no momento exato do disparo da chamada.
- **FR-010**: O sistema MUST registrar o custo efetivo do provedor somente quando a consulta for executada em modo live, não for fixture de mock, houver chamada real ao gateway da API Brasil e a resposta indicar sucesso ou tarifação confirmada.
- **FR-011**: O sistema MUST classificar consultas entregues via cache local, fixtures de mock ou tentativas bloqueadas por falta de token como custo de provedor zero (`actual_cost_cents = 0` e status `not_applicable`).
- **FR-012**: O sistema MUST classificar chamadas interrompidas por saldo insuficiente no provedor (HTTP 402 ou mensagem de falta de saldo) como custo não incorrido (`charge_status = 'not_incurred'`).
- **FR-013**: O sistema MUST persistir o histórico de custos de provedores com chave de idempotência vinculada ao job de entrega ou requisição externa, impedindo que retries automáticos dupliquem o custo registrado.
- **FR-014**: O sistema NUNCA MUST atualizar ou recalcular retrospectivamente snapshots de custos de consultas já realizadas caso o administrador altere o custo configurado na tela de configurações.

#### 3. Central de Relatórios Administrativos
- **FR-015**: O sistema MUST disponibilizar a Central de Relatórios de Histórico Veicular na rota `/admin/relatorios?tab=historico-veicular`, integrada ao layout, design system e convenções do painel administrativo existente.
- **FR-016**: A central de relatórios MUST apresentar cards superiores consolidados com os seguintes indicadores do período: Receita Bruta Aprovada, Estornos Confirmados, Receita Líquida, Custo Total Efetivo API Brasil, Margem Bruta Estimada, Consultas Concluídas, Consultas Live Cobradas, Cache Hits, Consultas via Crédito B2B, Créditos Consumidos, Falhas Permanentes e Estornos Pendentes.
- **FR-017**: A central de relatórios MUST disponibilizar filtros server-side para: Período pré-definido (Hoje, Últimos 7 dias, Mês Atual, Mês Anterior, Ano Atual, Personalizado), Modalidade de Cobertura (Mercado Pago, Crédito B2B, Gratuito, Todos), Origem do Laudo (API Brasil Live, Cache, Mock/Teste, Todos), Status da Consulta, Status de Pagamento, Status de Estorno, Cliente/Agência e Placa.
- **FR-018**: A central de relatórios MUST organizar os dados em três abas especializadas:
  1. **Aba 1 - Consultas e Custo**: data/hora, ID da consulta, placa, cliente, modalidade, status, origem (live/cache/mock), status HTTP da API Brasil, custo snapshot, custo efetivo, status do custo, preço snapshot, margem estimada e link para visualização do laudo.
  2. **Aba 2 - Pagamentos e Estornos**: data/hora, transaction ID, payment ID mascarado, cliente, placa, valor bruto, status de pagamento, status de estorno, valor estornado, receita líquida e motivo do estorno.
  3. **Aba 3 - Pacotes e Créditos**: cliente/agência, nome do pacote, data de concessão, canal de pagamento, valor comercial informado, créditos concedidos, créditos disponíveis, créditos reservados, créditos consumidos, créditos devolvidos, validade, status do pacote, custo API Brasil acumulado e margem gerencial estimada.
- **FR-019**: Todas as tabelas de relatórios MUST ser paginadas no servidor, suportar ordenação por colunas relevantes, exibir skeletons durante o carregamento e estados vazios amigáveis quando nenhum dado for retornado.

#### 4. Relatório Anual e Exportação Contábil
- **FR-020**: O sistema MUST fornecer a visualização "Informe Anual — Histórico Veicular" com seletor de ano fiscal/exercício (ex.: 2026, 2027), consolidando números anuais e demonstrativo mês a mês (Janeiro a Dezembro).
- **FR-021**: O sistema MUST permitir a exportação do relatório consolidado e detalhado em formato CSV codificado em UTF-8 com BOM, contendo todos os campos financeiros e operacionais permitidos sem expor dados confidenciais ou de cartão.
- **FR-022**: O sistema MUST incluir de forma visível e indelével o aviso legal de natureza estritamente gerencial em todas as telas de informe contábil e exportações geradas.
- **FR-023**: O sistema NUNCA MUST calcular tributos devidos, DARFs, alíquotas de impostos (Simples Nacional, Lucro Presumido, etc.) ou se declarar como sistema contábil/fiscal oficial.
- **FR-024**: O sistema MUST excluir registros com `is_mock = true` ou fixtures de teste da apuração anual oficial por padrão, permitindo sua visualização apenas sob filtro explícito de auditoria técnica.

#### 5. Segurança, Controle de Acesso e Auditoria
- **FR-025**: O acesso a custos de provedor, margens financeiras, relatórios consolidados e configurações de preço MUST ser restrito a administradores ativos, validando rigorosamente `admin_profiles.auth_user_id = auth.uid() AND admin_profiles.is_active = true AND admin_profiles.role IN ('admin', 'super_admin')`.
- **FR-026**: O sistema NUNCA MUST comparar `admin_profiles.id = auth.uid()`, preservando a distinção entre a chave primária da tabela de perfis e o UID do Supabase Auth.
- **FR-027**: O sistema MUST registrar logs de auditoria imutáveis para toda operação de alteração de preço/custo, consulta de relatórios consolidados e exportação de relatórios anuais.
- **FR-028**: O sistema NUNCA MUST registrar em logs, tabelas de auditoria, CSVs ou payloads expostos ao cliente chaves secretas como `APIBRASIL_TOKEN`, `MERCADO_PAGO_ACCESS_TOKEN`, `x-signature` ou dados brutos de cartão de crédito.

---

### Key Entities _(include if feature involves data)_

- **VehicleHistoryPricingVersion (`vehicle_history_pricing_versions`)**: Representa uma vigência de precificação do produto de histórico veicular. Contém o preço público de venda ao cliente (em centavos), o custo unitário cobrado pela API Brasil em chamadas live (em centavos), a moeda (BRL), o período de vigência (`effective_from` e `effective_to`), o administrador responsável pela criação e notas de auditoria.
- **VehicleLookupProviderCost (`vehicle_lookup_provider_costs`)**: Representa o registro individual de custo incorrido em uma chamada ao provedor de dados veiculares. Relaciona-se com a consulta do cliente (`customer_plate_consultations`), a consulta do provedor (`vehicle_plate_consultations`) e o job de entrega (`consultation_delivery_jobs`). Contém o modo da requisição, a versão de precificação aplicada, o status de tarifação (`not_applicable`, `incurred`, `not_incurred`, `unknown`, `reversed`), o snapshot de custo, o custo efetivo apurado e a referência externa do provedor.
- **AdminVehicleHistoryFinancialView (`admin_vehicle_history_financial_view`)**: Visão consolidada de apoio ao painel administrativo que combina a consulta do cliente, status de pagamento, transação Mercado Pago, estorno, job de entrega, pacote de créditos e custos de provedor, expondo indicadores operacionais pré-computados com RLS.
- **AnnualAccountantReport (`annual_accountant_report`)**: Estrutura analítica agregada por ano e competência mensal, agrupando receitas de gateway, estornos, receitas de pacotes informadas, custos de provedor, margens brutas e volumes de consultas para prestação de contas com a contabilidade.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: O gestor administrativo consegue alterar o preço de venda e o custo unitário da API Brasil em menos de 1 minuto na mesma tela de configurações, com nova versão ativada e histórico mantido.
- **SC-002**: 100% das consultas veiculares processadas passam a registrar snapshot imutável de custo e preço vigente, com zero casos de recálculo retroativo de custos históricos após alteração de tabelas de preço.
- **SC-003**: 100% das consultas entregues via cache local ou fixtures de teste registram custo adicional de provedor de R$ 0,00, sem distorcer o custo real cobrado pela API Brasil.
- **SC-004**: O tempo de carregamento da Central de Relatórios na rota administrativa permanece inferior a 1,5 segundo para o período padrão (mês atual) com filtros server-side e paginação eficiente.
- **SC-005**: O arquivo CSV do informe anual é gerado em menos de 3 segundos para um volume de até 50.000 consultas no ano, com formatação homologada para abertura no Microsoft Excel e Google Sheets.
- **SC-006**: 0% de exposição de chaves privadas (`APIBRASIL_TOKEN`, tokens do Mercado Pago) ou custos internos de fornecedores para clientes finais ou usuários desautenticados em testes de penetração e inspeção de rede.
- **SC-007**: 100% de precisão matemática entre o somatório dos cards do topo da página e a soma analítica das linhas detalhadas das tabelas de pagamento, estorno e custo.

---

## Assumptions

- **Timezone Padronizado**: O negócio e a loja operam no fuso horário oficial de Brasília (`America/Sao_Paulo` - UTC-3), que é o mesmo padrão já empregado nas rotas e formatadores do módulo de relatórios existente (`lib/reports/formatters.ts`).
- **Natureza Gerencial do Relatório**: O sistema não substitui o sistema ERP, emissor de Notas Fiscais de Serviço Eletrônicas (NFS-e) ou a conciliação bancária da conta corrente da empresa. Trata-se de relatório gerencial interno de apoio contábil.
- **Reconhecimento de Receita de Pacotes**: Pacotes B2B negociados externamente (ex.: via WhatsApp ou Pix manual) possuem valor financeiro pactuado informado pelo administrador no momento do cadastro do pacote (`total_paid_cents`), servindo como base gerencial para a apuração anual até que o contador realize a conciliação definitiva.
- **Mecanismo de Autenticação Administrativa**: O sistema reutiliza o padrão oficial da aplicação estabelecido na migration `00001_admin_profiles.sql` e formalizado na Spec 036 (`lib/admin/admin-auth.ts`), verificando `admin_profiles.auth_user_id = auth.uid()`.
- **Elegibilidade de Cache e Provedor**: A consulta de histórico veicular reutiliza o laudo existente no banco (`vehicle_plate_consultations`) sempre que houver registro prévio concluído para a placa, de acordo com as políticas de elegibilidade vigentes.
