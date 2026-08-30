# Research & Architectural Decisions: Consulta de Placa com Snapshot JSONB, Cache Pago e PDF

**Feature**: `018-consulta-placa-historico-veicular`  
**Date**: 2026-08-30  
**Author**: Senior Full-Stack Engineer / SpecKit  

---

## 1. Por que usar JSONB + Colunas Resumidas (Modelo Híbrido)

A modelagem de dados para integrações com provedores veiculares (como API Brasil, Serpro, Detran) impõe um dilema clássico de engenharia de software:
- **Abordagem 100% Relacional (Centenas de Colunas)**: Criar colunas para cada atributo retornado.
  - *Problema*: O payload da API Brasil para "Veículos Total" possui mais de 180 campos, dezenas de nós aninhados, múltiplos arrays (histórico de gravames, histórico de proprietários, chamados de recall, fotos, múltiplos registros de leilão, tabelas FIPE de múltiplos anos/meses). Qualquer campo novo ou renomeação pelo provedor quebra a persistência ou exige uma migration de banco de dados.
- **Abordagem 100% Documental (Apenas JSONB)**: Salvar apenas `id`, `plate` e `payload jsonb`.
  - *Problema*: Consultas de listagem, ordenação por data, filtros por marca/modelo/ano, índices de risco, relatórios de custo e RLS tornam-se lentos e exigem queries complexas em JSONB que não aproveitam os índices B-Tree tradicionais do PostgreSQL. Além disso, retornar o JSON completo para popular uma tabela simples consome gigabytes de rede desnecessariamente.

### A Solução: Modelo Híbrido com Snapshot Imutável

Adotamos a **arquitetura híbrida**, combinando o melhor dos dois mundos:
1. **Uma coluna `raw_response jsonb not null`**:
   - Salva a resposta integral e exata retornada pela API externa.
   - Preserva 100% da fidelidade histórica na data e hora em que a consulta foi realizada.
   - Suporta arrays profundos e estruturas dinâmicas sem necessidade de migrações.
   - Permite que futuras telas ou melhorias no layout aproveitem dados já consultados sem gastar novos créditos.
   - Serve de base para a compilação do relatório PDF oficial e visualização em abas temáticas.
2. **Colunas Escalares Desnormalizadas Mínimas**:
   - Indexáveis e otimizadas para B-Tree.
   - Utilizadas exclusivamente para: cache (`plate_normalized`), listagem rápida, filtros administrativos (`brand`, `model`, `risk_level`, `mode`), auditoria de custos (`charged_amount`, `is_mock`), auditoria de confirmação e vínculos com o sistema (`motorcycle_id`, `sell_request_id`).

### O que NÃO deve ser duplicado em colunas relacionais
Para manter o banco de dados enxuto, manutenível e performático, os seguintes dados permanecem **exclusivamente dentro do `raw_response jsonb`**:
- Listas e históricos completos de gravames e contratos de financiamento.
- Histórico detalhado de proprietários e transferências anteriores.
- Histórico de quilometragem e registros de vistorias.
- Histórico de anúncios em portais e plataformas parceiras.
- Arrays de versões, códigos e variações de preço histórico da Tabela FIPE.
- Listas completas de equipamentos, opcionais e acessórios de fábrica.
- Restrições administrativas e judiciais detalhadas (número de processo, vara, órgão emissor).
- Dados detalhados de leilão (lote, comitente, pátio, fotos do leiloeiro, status de arrematação).
- Dados detalhados de sinistros (peças afetadas, classificação de monta, seguradora).
- Detalhes de chamados de recall pendentes e atendidos.
- Detalhamento de débitos estaduais (discriminação de multas por órgão autuador, guias de IPVA e taxas).
- Dados técnicos estendidos (eixos, CMT, PBT, tipo de carroceria, código Renavam/chassi complementares).
- Novos campos adicionados pelo provedor no futuro.

---

## 2. Prevenção de Cobrança Duplicada e Controle de Concorrência

Como as consultas ao provedor externo são tarifadas em moeda real, a concorrência de requisições e cliques repetidos representam um risco financeiro direto.

### 2.1 Estratégia de Três Camadas de Proteção

```text
[Frontend / Admin UI]
  └─ 1. Verificação local de cache antes do modal
  └─ 2. Modal com confirmação explícita (checkbox obrigatório)
  └─ 3. Botão desabilitado durante envio (evita double-click)
       │
[Server Action / Backend Gateway]
  └─ 4. Normalização estrita da placa (ABC-1234 -> ABC1234)
  └─ 5. Verificação no banco de consulta 'live' bem-sucedida existente
  └─ 6. Lock transacional por chave de placa (PostgreSQL Advisory Lock)
       │
[PostgreSQL Database]
  └─ 7. Partial Unique Index: Impede inserção concorrente de dois registros 'live' completados
```

### 2.2 Mecanismo de Bloqueio Concorrente (Advisory Lock)
No momento da execução da consulta no backend, o servidor adquire um *Advisory Transaction Lock* baseado no hash da placa normalizada:
```sql
SELECT pg_try_advisory_xact_lock(hashtext('vehicle_lookup_' || p_plate_normalized));
```
Se o lock não for adquirido imediatamente, significa que outro processo de consulta para a mesma placa está em andamento. A requisição concorrente aguarda ou retorna o resultado assim que a primeira transação for commitada, **evitando duas chamadas à API Brasil para a mesma placa simultaneamente**.

### 2.3 Índice Único Parcial
Garantia matemática no nível do banco de dados:
```sql
CREATE UNIQUE INDEX idx_vehicle_plate_live_unique 
  ON public.vehicle_plate_consultations (plate_normalized, consultation_type, provider) 
  WHERE (mode = 'live' AND status = 'COMPLETED');
```
- Consultas com erro (`status = 'FAILED'`) não impedem nova tentativa manual.
- Consultas simuladas (`mode = 'mock'`) podem coexistir com consultas reais.
- Uma consulta real completada (`mode = 'live' AND status = 'COMPLETED'`) torna-se única e reutilizável por padrão.

### 2.4 Tratamento de Incerteza de Cobrança (`CHARGE_STATUS_UNKNOWN`)
Se ocorrer um *timeout* de rede, queda de conexão ou erro HTTP 5xx do provedor **após** a requisição ter sido enviada:
1. O sistema **NÃO realiza retry automático**.
2. O registro é persistido com o status `CHARGE_STATUS_UNKNOWN`.
3. A interface do administrador exibe um alerta orientando a verificação manual no painel do provedor ou aguardo antes de nova tentativa, impedindo que o saldo seja consumido duas vezes por instabilidade temporária.

---

## 3. Estratégia de Feature Flag: Mock vs. Live

### 3.1 Variáveis de Ambiente
- `VEHICLE_LOOKUP_MODE`: Define o modo de operação do gateway (`mock` | `live`). Padrão: `mock`.
- `APIBRASIL_TOKEN`: Token de autenticação Bearer para o endpoint da API Brasil. Nunca é exposto ao cliente.

### 3.2 Comportamento em Modo Mock
- **Chamadas de Rede**: 0 requisições HTTP externas.
- **Fixture Estática**: Carrega `lib/vehicle-lookup/fixtures/vehicle-total.mock.json` contendo um payload veicular autêntico e completo (motocicleta com histórico FIPE, gravame, leilão, multas e dados cadastrais).
- **Persistência no Banco**:
  - `mode = 'mock'`
  - `is_mock = true`
  - `is_chargeable = false`
  - `charged_amount = 0.00`
  - `status = 'COMPLETED'`
- **Visualização**: Exibe badge proeminente `Consulta Simulada (Ambiente de Teste)` para transparência do operador.

### 3.3 Comportamento em Modo Live
- **Autenticação**: Envio seguro do token no header `Authorization: Bearer <APIBRASIL_TOKEN>`.
- **Persistência no Banco**:
  - `mode = 'live'`
  - `is_mock = false`
  - `is_chargeable = true`
  - `charged_amount = <valor cobrado retornado ou tabela de custo da loja>`
  - `provider_balance_before`, `provider_balance_after`, `provider_tax` gravados para auditoria contábil quando retornados pelo provedor.

---

## 4. Arquitetura de Adapters, DTOs e Sanitização (LGPD)

### 4.1 Isolamento Arquitetural (Princípio VII da Constituição AF Motos)
Nenhum componente de interface do Next.js deve acessar nós profundos do payload da API como:
`rawResponse.data.baseEstadual.restricaoJudicial`.

Toda a interação é mediada pela camada `lib/vehicle-lookup/`:
```text
lib/vehicle-lookup/
├── types.ts                                # Tipagens TypeScript do Provedor e de Domínio
├── schema.ts                               # Schemas Zod tolerantes e seguros
├── plate.ts                                # Normalizadores e formatadores de placa (Mercosul/Antiga)
├── config.ts                               # Configuração centralizada de flags e timeouts
├── service.ts                              # Orquestrador de consulta, cache e concorrência
├── adapters/
│   ├── apibrasil-vehicle-total.ts          # Parser do payload raw para entidade tipada
│   ├── vehicle-summary.ts                  # Extrator de colunas desnormalizadas para o DB
│   ├── vehicle-risk.ts                     # Cálculo de matriz e nível de risco (Baixo, Médio, Alto)
│   ├── vehicle-debts.ts                    # Consolidador de multas, IPVA, licenciamento e taxas
│   ├── vehicle-history.ts                  # Consolidador de proprietários, leilão e sinistros
│   └── vehicle-pdf.ts                      # Preparador de dados para o relatório institucional
├── sanitizers/
│   ├── mask-cpf.ts                         # Mascaramento de CPF (***.123.456-**)
│   ├── mask-cnpj.ts                        # Mascaramento de CNPJ (**.*45.678/0001-**)
│   ├── mask-chassis.ts                     # Mascaramento parcial de chassi (9BW***1234)
│   ├── mask-renavam.ts                     # Mascaramento de Renavam (*****1234)
│   └── mask-engine.ts                      # Mascaramento de número de motor
└── fixtures/
    └── vehicle-total.mock.json             # Fixture autêntica para desenvolvimento e testes
```

### 4.2 Camadas de DTOs

| DTO | Destino | Conteúdo | Regras de Privacidade / LGPD |
|---|---|---|---|
| `VehicleConsultationSummaryDto` | Listagens e Tabelas (`/admin/consulta-placa`) | Placa, Marca, Modelo, Ano, Status, Modo, Risco, Data, Custo. | Não inclui `raw_response`, não inclui dados pessoais. |
| `InternalVehicleConsultationDto` | Tela de Detalhes Admin (`/admin/consulta-placa/[id]`) | Estrutura completa em 9 abas: dados técnicos, débitos, gravames, leilões e visualizador do JSON técnico. | Chassi e motor completos para conferência física na oficina. Dados de token/saldo do provedor expurgados. |
| `CustomerVehicleReportDto` | Laudo PDF para Cliente | Identificação visual da moto, status de procedência (Aprovado / Atenção / Restrição), FIPE, ausência de sinistro/leilão/roubo. | **Mascaramento estrito de CPF/CNPJ de antigos donos**, chassi e motor truncados, sem menção a saldo da loja ou chaves de API. |

---

## 5. Estratégia de PDF com `@react-pdf/renderer`

### 5.1 Por que `@react-pdf/renderer`?
- Já é o padrão arquitetural consolidado no projeto (`lib/pdf/sale-receipt.tsx`, `lib/pdf/technical-sheet.tsx`, `lib/reports/pdf/executive-report.tsx`).
- Roda no servidor Node.js (Route Handler `app/api/admin/vehicle-lookup/[id]/pdf/route.ts`), gerando streams de bytes nativos com alta resolução tipográfica e vetorização.
- Não depende de navegadores headless pesados (como Puppeteer/Playwright) que consomem gigabytes de RAM em servidores de produção.

### 5.2 Estrutura do Documento PDF
1. **Cabeçalho Institucional**: Logo em alta resolução da AF Motos, Razão Social, CNPJ, Data/Hora da emissão e Código de Autenticidade do Laudo.
2. **Sumário Executivo de Procedência**: Cards visuais com ícones e status (Furto/Roubo, Restrição Judicial, Restrição Financeira, Sinistro, Leilão, Débitos Ativos).
3. **Ficha Técnica & Cadastral**: Marca, Modelo, Ano Fabricação/Modelo, Cor, Combustível, Cilindrada, Município/UF de registro.
4. **Valores de Mercado & Referência FIPE**: Código FIPE, valor oficial de referência e histórico comparativo.
5. **Situação Financeira & Débitos**: Resumo consolidado de débitos apurados na data da consulta.
6. **Histórico de Gravames & Restrições**: Situação de financiamento/alienação fiduciária com dados de terceiros devidamente protegidos.
7. **Termo de Responsabilidade & Disclaimer Legal**:
   > *"Este relatório reflete as informações disponibilizadas pelos órgãos oficiais e bases conveniadas na data e horário de sua consulta. A AF Motos não se responsabiliza por eventuais divergências decorrentes de atualizações posteriores nas bases governamentais."*
