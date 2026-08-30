# Feature Specification: Consulta de Placa com Snapshot JSONB, Cache Pago, Histórico e PDF — AF Motos

**Feature Branch**: `018-consulta-placa-historico-veicular`  
**Created**: 2026-08-30  
**Status**: Draft (Specification Ready for Review)  
**Input**: User description: "Consulta de Placa com Snapshot JSONB, Cache Pago, Histórico e PDF — AF Motos — painel administrativo para consulta veicular completa com modelo híbrido (JSONB raw + colunas resumidas indexadas), cache inteligente para evitar cobranças duplicadas, modo mock/live via feature flag, modal de confirmação explícita de custo, visualização por abas temáticas, geração de PDF profissional ilimitado e proteção de dados LGPD."

---

## 1. Executive Summary & Business Problem

A **AF Motos** realiza diariamente avaliações, compras de motocicletas usadas, captação de consignações e negociações com clientes. Para assegurar a idoneidade jurídica, mecânica, fiscal e procedência dos veículos que entram no inventário ou são negociados na loja, os administradores necessitam de consultas veiculares aprofundadas (histórico de roubo/furto, restrições financeiras e gravames, restrições judiciais/Renajud, débitos de IPVA/multas, histórico de leilão, sinistros, recall e dados da tabela FIPE).

No entanto, as consultas a provedores externos de dados veiculares (como API Brasil) são **serviços pagos e tarifados por chamada**. A ausência de um subsistema robusto de consulta veicular acarreta sérios riscos:
1. **Cobranças duplicadas desnecessárias**: Vários operadores consultando a mesma placa repetidas vezes ou gerando relatórios PDF que disparam novas chamadas pagas à API.
2. **Perda de histórico e auditoria**: Sem persistência do snapshot imutável, a loja perde a prova técnica do estado do veículo na data exata da compra/consignação.
3. **Rigidez e fragilidade de esquema de banco de dados**: Tentar criar centenas de colunas para acomodar payloads aninhados e mutáveis de APIs externas torna as migrações frágeis e inviabiliza a evolução dos dados.
4. **Vazamento de dados e custos**: Falta de isolamento entre dados brutos (que contêm saldo de conta da loja, tokens e dados sensíveis) e os relatórios entregues aos clientes finais.

O módulo **Consulta Veicular por Placa** (`/admin/consulta-placa`) resolve esses desafios por meio de uma **arquitetura híbrida com snapshot JSONB imutável**, **cache inteligente de consultas pagas**, **modal com confirmação explícita de débito**, **feature flag mock/live** e **gerador de PDF profissional institucional** reutilizável sem custo adicional.

---

## 2. Princípios Fundamentais & Diretrizes de Negócio

### 2.1 Modelo de Dados Híbrido (JSONB Raw + Colunas Resumidas)
- **Snapshot Imutável (`raw_response jsonb`)**: A resposta integral recebida do provedor é gravada sem mutações destrutivas, preservando 100% dos dados brutos, arrays aninhados (gravames, históricos, multas, FIPE, leilões) para visualização detalhada e emissão de PDFs.
- **Colunas Escalares Desnormalizadas**: Apenas dados essenciais para busca, ordenação, badges, controle financeiro, métricas de risco e listagem rápida são extraídos para colunas relacionais indexadas (`plate_normalized`, `brand`, `model`, `risk_level`, `mode`, `is_mock`, `charged_amount`).
- **Nenhum `raw_response` na Listagem**: As listagens e tabelas do painel carregam somente projeções resumidas (DTOs leves), economizando largura de banda e memória do servidor e cliente.

### 2.2 Política de Custo Zero para Reconsultas e PDFs
- Uma vez consultada uma placa com sucesso no modo `live`, o snapshot gravado torna-se a **fonte de verdade permanente**.
- Visualizações detalhadas, buscas subsequentes da mesma placa, compartilhamento interno e geração de PDFs são executados a partir do banco de dados local da AF Motos, consumindo **R$ 0,00 de saldo externo**.

### 2.3 Prevenção Rigorosa de Cobrança Duplicada e Concorrência
- Verificação obrigatória de cache no banco local antes de qualquer requisição externa.
- Bloqueio concorrente (índice único condicional e lock transacional por placa) para impedir que dois administradores aprovem consultas simultâneas para o mesmo veículo na mesma fração de segundo.
- Em caso de timeout ou erro de rede após o disparo da requisição paga, o registro é classificado como `CHARGE_STATUS_UNKNOWN`, bloqueando re-tentativas automáticas sem reconciliação administrativa prévia.

### 2.4 Feature Flag Segura (Mock por Padrão)
- O sistema opera com `VEHICLE_LOOKUP_MODE=mock` por padrão no desenvolvimento e homologação, utilizando fixtures estáticas realistas (`vehicle-total.mock.json`) e garantindo **consumo zero de créditos reais**.
- A ativação do modo `live` ocorre exclusivamente via variável de ambiente no servidor e requer confirmação explícita no painel antes de cada disparo.

### 2.5 Privacidade e Proteção de Dados (LGPD)
- **Isolamento de Credenciais**: O token da API e saldo da conta da AF Motos jamais são expostos ao frontend, logs de auditoria ou documentos gerados.
- **Mascaramento Seletivo**: CPF/CNPJ, chassi, motor e Renavam são mascarados em relatórios externos e DTOs de cliente, exibindo apenas dados públicos ou autorizados.
- **Acesso Restrito**: Somente administradores autenticados com função administrativa (`is_admin()`) possuem permissão RLS para visualizar, consultar e emitir relatórios.

---

## 3. Personas & Histórias de Usuário

### Personas
- **Alex / Administrador AF Motos**: Responsável pela avaliação técnica de motos para compra, consignação ou intermediação de vendas. Precisa verificar a placa rapidamente, entender o nível de risco e emitir o laudo veicular sem surpresas de custos.
- **Cliente Comprador / Proprietário (Destinatário do Laudo)**: Recebe o PDF de Histórico Veicular institucional impresso ou em arquivo para comprovar a procedência e transparência da negociação.

---

### User Story 1 — Busca Inteligente com Verificação Prévia de Cache (Priority: P1)
Como administrador da AF Motos, quero digitar a placa de um veículo (formato Mercosul ou antigo) e verificar instantaneamente se já existe um histórico veicular salvo no sistema, para reaproveitar os dados sem custos adicionais.

**Why this priority**: É a porta de entrada da funcionalidade e o mecanismo principal de economia de custos.

**Independent Test**: Digitar uma placa já consultada anteriormente no campo de busca de `/admin/consulta-placa`. O sistema deve exibir imediatamente o registro em cache com badge "Em Cache (Custo: R$ 0,00)" e botão para abrir o detalhe.

**Acceptance Scenarios**:
1. **Given** o admin em `/admin/consulta-placa`, **When** digita uma placa válida (ex.: `BRA2E19` ou `ABC-1234`), **Then** o sistema formata visualmente a placa em tempo real e normaliza a string para busca (`ABC1234` ou `BRA2E19`).
2. **Given** uma placa já consultada com sucesso em modo `live`, **When** o admin submete a busca, **Then** o sistema retorna os dados locais salvos, sem disparar requisições HTTP externas nem solicitar créditos.
3. **Given** uma placa sem histórico ou contendo apenas consulta simulada (`mock`), **When** o sistema está em modo `live`, **Then** exibe aviso informando a ausência de consulta real e oferece o botão para iniciar uma nova consulta oficial.

---

### User Story 2 — Modal de Confirmação Explícita de Custo e Execução Segura (Priority: P1)
Como administrador da AF Motos, quero visualizar um modal de confirmação com valor estimado, placa conferida e checkbox de ciência antes de disparar uma consulta veicular paga, para evitar cliques acidentais e cobranças indevidas.

**Why this priority**: Garante governança financeira e previne consultas incorretas por erro de digitação da placa.

**Independent Test**: Clicar em "Consultar Histórico Oficial" para uma placa não cadastrada. Verificar se o modal bloqueia a continuação até o preenchimento do checkbox e registra o consentimento no log de auditoria.

**Acceptance Scenarios**:
1. **Given** o modal de confirmação aberto, **When** o checkbox de confirmação não está marcado, **Then** o botão "Confirmar e Consultar" permanece desabilitado.
2. **Given** o modal preenchido com a placa `ABC-1234`, **When** o admin confirma a operação, **Then** o sistema envia o payload seguro com carimbo de tempo, usuário confirmador e placa confirmada ao backend.
3. **Given** o sistema em modo `mock`, **When** a consulta é executada, **Then** o sistema exibe badge destacado `Consulta Simulada (Ambiente de Teste)` e salva o registro com `is_mock = true` e `charged_amount = 0.00`.
4. **Given** o sistema em modo `live`, **When** a consulta externa é concluída, **Then** persiste o snapshot JSONB completo, extrai os campos de risco e redireciona o admin para `/admin/consulta-placa/[id]`.

---

### User Story 3 — Painel de Detalhes em Abas Temáticas (Priority: P1)
Como administrador, quero visualizar o relatório veicular completo dividido em abas organizadas (Resumo, Dados do Veículo, Situação & Débitos, Restrições & Gravames, Histórico, Preço & FIPE, Anúncios & Km, Dados Técnicos, JSON Técnico), para diagnosticar a motocicleta com clareza sem poluição visual.

**Why this priority**: Transforma payloads complexos de centenas de linhas em uma experiência de diagnóstico intuitiva e rápida para a tomada de decisão comercial.

**Independent Test**: Acessar `/admin/consulta-placa/[id]` e navegar entre todas as 9 abas, validando que os dados apresentados são derivados de DTOs tipados e que campos nulos exibem fallbacks elegantes ("Não informado" ou badge neutro).

**Acceptance Scenarios**:
1. **Given** a aba "Resumo", **When** o veículo possui restrição financeira ou gravame ativo, **Then** exibe badge de alerta em destaque (ex.: `Risco Elevado: Gravame Ativo`) e cartões com os principais indicadores (Roubo/Furto, Sinistro, Leilão, Débitos).
2. **Given** a aba "Preço e FIPE", **When** o retorno contiver múltiplos códigos e valores FIPE, **Then** exibe a listagem de versões com comparativo de valores de mercado e histórico de desvalorização.
3. **Given** a aba "JSON Técnico", **When** acessada por um administrador, **Then** exibe um visualizador de código formatado com botão "Copiar JSON" e busca por termos para auditoria técnica avançada.

---

### User Story 4 — Geração, Visualização e Download de Laudo em PDF Profissional (Priority: P1)
Como administrador, quero gerar e baixar um laudo veicular oficial da AF Motos em formato PDF (layout A4 estruturado, logotipo institucional, sem dados de terceiros e sem expor saldo/tokens), para imprimir ou enviar ao cliente comprador/vendedor.

**Why this priority**: O laudo impresso ou digital é a ferramenta tangível de credibilidade e transparência da AF Motos nas negociações.

**Independent Test**: Clicar em "Baixar Relatório PDF" na tela de detalhes da consulta. Validar que o arquivo é gerado instantaneamente via Route Handler a partir do snapshot local (`historico-veicular_{placa}_{consultaId}.pdf`), sem qualquer requisição externa.

**Acceptance Scenarios**:
1. **Given** o botão "Baixar PDF", **When** acionado, **Then** o sistema renderiza o PDF institucional utilizando `@react-pdf/renderer` contendo:
   - Cabeçalho oficial com logo AF Motos, CNPJ, Razão Social e identificador único da consulta.
   - Sumário executivo com status de riscos (Roubo, Judicial, Financeiro, Sinistro, Leilão).
   - Especificações cadastrais completas do veículo (Marca, Modelo, Ano Fab/Mod, Cor, Cilindrada, Combustível).
   - Dados financeiros consolidados (FIPE, Débitos estaduais somados).
   - Mascaramento estrito de dados sensíveis (CPF de proprietários anteriores, chassi parcial, motor parcial).
   - Disclaimer de responsabilidade legal informando que o documento reflete a base governamental/privada na data de emissão.
2. **Given** a geração do PDF, **When** concluída, **Then** o sistema incrementa o contador `pdf_generation_count` e atualiza `pdf_generated_at` para fins de auditoria.

---

### User Story 5 — Vínculo Direto com Motos do Inventário, Propostas e Vendas (Priority: P2)
Como administrador, quero associar uma consulta de placa existente a uma motocicleta do catálogo (`motorcycles`), proposta de venda de cliente (`sell_requests`) ou captação de consignação (`consignment_requests`), para consolidar o histórico de entrada do veículo no sistema.

**Why this priority**: Integra o diagnóstico veicular ao fluxo operacional de estoque e CRM da loja.

**Independent Test**: Na tela de detalhes da consulta, selecionar uma moto cadastrada no seletor de vínculo e salvar. Acessar a página da moto (`/admin/motos/[id]`) e confirmar que o card de laudo veicular agora aponta para a consulta vinculada.

**Acceptance Scenarios**:
1. **Given** uma consulta salva, **When** o admin vincula a uma moto do estoque via `motorcycle_id`, **Then** a tabela de motos exibe o badge de laudo veicular verificado.
2. **Given** uma solicitação em `/admin/propostas` contendo placa informada pelo cliente, **When** o admin clica em "Verificar Histórico", **Then** o sistema busca no cache e permite vincular a consulta diretamente à proposta (`sell_request_id`).

---

## 4. Requisitos Funcionais (RF)

| ID | Descrição | Módulo | Prioridade |
|---|---|---|---|
| **RF-01** | Normalizar e validar placas brasileiras em padrão antigo (`AAA-9999`) e Mercosul (`AAA9A99`), removendo caracteres especiais para armazenamento uniforme (`ABC1234`). | Core / Plate | P1 |
| **RF-02** | Buscar primeiramente na tabela local `vehicle_plate_consultations` por `plate_normalized` antes de qualquer execução de provedor externo. | Cache / DB | P1 |
| **RF-03** | Exibir modal obrigatório de confirmação com placa em destaque, custo estimado, modo de operação e checkbox de consentimento antes de executar nova consulta. | UX / Admin | P1 |
| **RF-04** | Suportar alternância entre `VEHICLE_LOOKUP_MODE=mock` e `live` via variável de ambiente no backend sem alteração de código. | Config / Env | P1 |
| **RF-05** | Em modo `mock`, carregar payload estático completo (`vehicle-total.mock.json`), salvar no banco com `is_mock=true`, `charged_amount=0.00` e exibir badge informativo de simulação. | Mock Engine | P1 |
| **RF-06** | Em modo `live`, realizar chamada segura server-side à API Brasil, autenticada via `APIBRASIL_TOKEN` sem expor cabeçalhos ao frontend ou logs. | Provider Engine | P1 |
| **RF-07** | Salvar a resposta integral e bruta do provedor na coluna `raw_response` (`jsonb`) de forma imutável, juntamente com `response_schema_version`. | DB / Storage | P1 |
| **RF-08** | Extrair automaticamente campos escalares para listagem e indexação: marca, modelo, anos, estado, cidade, nível de risco, flags de roubo, restrições judiciais/financeiras, leilão, sinistro e débitos. | Adapter Engine | P1 |
| **RF-09** | Garantir atomicidade e unicidade de consulta live por placa através de constraint/índice parcial e lock transacional pessimista/advisório para barrar concorrência. | DB / Concurrency | P1 |
| **RF-10** | Tratar timeouts de rede e respostas ambíguas em modo `live` com o status `CHARGE_STATUS_UNKNOWN`, impedindo re-tentativas automáticas sem intervenção manual. | Resiliency | P1 |
| **RF-11** | Disponibilizar listagem paginada e filtrável em `/admin/consulta-placa` sem carregar o campo `raw_response`, retornando apenas DTO resumido. | UI / List | P1 |
| **RF-12** | Renderizar a página de detalhes `/admin/consulta-placa/[id]` com 9 abas estruturadas alimentadas por DTOs seguros e tipados. | UI / Detail | P1 |
| **RF-13** | Gerar documento PDF em layout A4 profissional institucional via `@react-pdf/renderer` a partir do snapshot salvo no banco, sem nova chamada à API. | PDF Engine | P1 |
| **RF-14** | Mascarar dados sensíveis de terceiros (CPF/CNPJ, chassi e motor parciais) nos DTOs de exibição e no documento PDF. | LGPD / Security | P1 |
| **RF-15** | Permitir vincular a consulta a uma moto (`motorcycles`), solicitação de venda (`sell_requests`) ou proposta (`leads`). | Domain Linker | P2 |
| **RF-16** | Manter auditoria com identificação do usuário operador (`consulted_by`, `confirmed_by`), data da consulta e contadores de geração de PDF. | Audit | P1 |

---

## 5. Requisitos Não Funcionais (RNF)

| ID | Categoria | Descrição | Métrica / Critério |
|---|---|---|---|
| **RNF-01** | **Segurança** | Token da API Brasil e dados de conta jamais podem ser trafegados para o browser ou gravados no PDF. | 0 ocorrências em bundles, logs ou HTML. |
| **RNF-02** | **Performance** | Listagem da tabela de histórico com até 1.000 registros deve responder em menos de 300ms. | TTFB < 300ms via DTO resumido sem `raw_response`. |
| **RNF-03** | **Tolerância a Falhas** | Parsing do JSON do provedor não pode quebrar a aplicação caso novos campos sejam adicionados ou campos opcionais venham nulos. | Parsing seguro com schemas Zod parciais/tolerantes. |
| **RNF-04** | **Concorrência** | Duas requisições de consulta para a mesma placa disparadas no mesmo milissegundo não podem gerar duas cobranças na API. | Lock em banco / Unique Index parcial. |
| **RNF-05** | **Fidelidade Visual** | O PDF gerado deve ter diagramação perfeita em formato A4, pronto para impressão física ou envio digital. | Renderização vetorial nativa sem fontes borradas. |
| **RNF-06** | **Privacidade** | Conformidade com a LGPD (Lei 13.709/2018) através do mascaramento de dados identificáveis de terceiros em laudos compartilháveis. | CPF no formato `***.123.456-**`, Chassi `9BW***1234`. |

---

## 6. Critérios de Sucesso e Verificação

1. **Taxa de Reuso de Cache**: 100% das buscas e gerações de PDF para placas já consultadas em modo `live` devem utilizar exclusivamente o banco local sem chamadas HTTP externas.
2. **Prevenção de Cobrança Acidental**: 0 consultas são disparadas sem confirmação explícita no modal administrativo.
3. **Custo em Ambiente Dev/Staging**: R$ 0,00 consumidos em testes locais graças ao modo `mock` ativado por padrão.
4. **Resiliência do Schema**: Novas versões do retorno do provedor com campos adicionais não exigem migrações no banco de dados para serem armazenadas integralmente no `raw_response`.
5. **Autonomia de PDF**: Tempo de download do PDF veicular inferior a 1,5 segundos no servidor sem dependências externas.
