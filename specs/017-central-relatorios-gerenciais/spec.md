# Feature Specification: Central de Relatórios Gerenciais e Exportação Contábil

**Feature Branch**: `017-central-relatorios-gerenciais`  
**Created**: 2026-08-30  
**Status**: Draft  
**Input**: User description: "Central de Relatórios Gerenciais e Exportação Contábil — AF Motos — painel administrativo para acompanhamento de faturamento, despesas, margem estimada, giro de estoque, leads/clientes e exportação de demonstrativos de apoio contábil em CSV, XLSX e PDF."

---

## 1. Executive Summary & Business Problem

O proprietário da AF Motos necessita de visibilidade imediata, segura e consolidada sobre a saúde operacional, comercial e financeira da loja. Atualmente, os registros operacionais estão distribuídos em módulos isolados (`/admin/vendas`, `/admin/gastos`, `/admin/motos`, `/admin/clientes`, `/admin/propostas`). A ausência de um módulo central de inteligência gerencial impede respostas rápidas a perguntas estratégicas:
- Quanto foi vendido no período selecionado (mês, trimestre, semestre, ano ou personalizado)?
- Qual o ticket médio, lucro operacional estimado e margem gerencial?
- Quais foram os maiores centros de custo (despesas de loja vs. preparação de veículos)?
- Quanto tempo os veículos passam no estoque e quais motos estão imobilizadas há mais de 30, 60 ou 90 dias?
- Qual a taxa de atração de novos clientes e desempenho dos canais comerciais?
- Como extrair dados estruturados e limpos para suporte ao contador da empresa sem gerar riscos fiscais ou declarações incorretas?

A **Central de Relatórios Gerenciais** (`/admin/relatorios`) resolve essas dores centralizando indicadores, agregações server-side, gráficos intuitivos e rotinas de exportação em múltiplos formatos (CSV, XLSX e PDF).

---

## 2. Princípios Fundamentais & Escopo Fiscal

### 2.1 Classificação de Confiabilidade das Métricas
Toda métrica exibida na interface e nas exportações deve ser rotulada explicitamente em uma das 3 categorias:
1. **Confirmado**: Baseado em registros transacionais finalizados e validados no banco de dados (ex.: soma de vendas com `payment_status = 'PAID'`, total de despesas cadastradas, contagem de motos disponíveis).
2. **Estimado**: Baseado em aproximações matemáticas ou dados operacionais parciais (ex.: resultado operacional gerencial, margem estimada sem dedução de custos indiretos, tempo médio de estoque baseado na data de cadastro).
3. **Indisponível**: Indicadores que não possuem base de dados íntegra no momento (ex.: lucro líquido oficial com apuração tributária, conciliação bancária automatizada).

### 2.2 Isenção de Responsabilidade Fiscal e Contábil (Legal Disclaimer)
O sistema da AF Motos é uma plataforma de gestão operacional e comercial, **não** um sistema ERP contábil ou emissor de obrigações fiscais/tributárias.
- **NÃO calcula impostos devidos (IRPJ, CSLL, PIS, COFINS, Simples Nacional, ICMS, ISS).**
- **NÃO gera arquivos oficiais para Receita Federal, SPED, Sintegra, eSocial ou Detran.**
- Todas as telas de relatórios, exportações e PDFs devem conter a seguinte declaração:
  > *"Relatório gerencial de apoio operacional. Os dados apresentados são baseados nos lançamentos cadastrados no sistema AF Motos e devem ser revisados, conferidos e validados pelo contador responsável antes de qualquer utilização contábil, fiscal ou tributária."*

---

## 3. Personas & Histórias de Usuário

### Persona Principal
- **Alex (Proprietário / Gestor Geral da AF Motos)**: Precisa de um painel rápido, mobile-friendly e direto para conferir faturamento, despesas, estoque parado e resultados antes de tomar decisões de compra, precificação e envio de dados ao contador.
- **Contador Externo (Destinatário Indireto)**: Recebe planilhas CSV/XLSX organizadas e demonstrativos em PDF para conciliação contábil mensal e preparação do fechamento anual.

---

### User Story 1 — Visão Geral Executiva e Filtro Global de Período (Priority: P1)
Como administrador da AF Motos, quero acessar um dashboard executivo consolidado e filtrar por períodos predefinidos (Hoje, 7 dias, Este Mês, Mês Anterior, Este Trimestre, Últimos 3 Meses, Este Semestre, Últimos 6 Meses, Este Ano, Últimos 12 Meses, Personalizado) com comparativo ao período anterior, para avaliar a evolução geral da loja em tempo real.

**Why this priority**: É o ponto de entrada principal e a experiência central do gestor.

**Independent Test**: Acessar `/admin/relatorios`, alternar entre "Este Mês", "Este Trimestre" e "Este Ano", verificar se todos os KPIs e gráficos atualizam de forma síncrona/reativa e refletem os query parameters na URL.

**Acceptance Scenarios**:
1. **Given** o admin em `/admin/relatorios`, **When** a página carrega sem parâmetros, **Then** o período padrão é "Este Mês" (`start_date` = primeiro dia do mês atual, `end_date` = dia atual ou fim do mês).
2. **Given** o filtro de período, **When** o admin seleciona "Últimos 12 Meses", **Then** a URL atualiza com `?period=12_months` e os dados agregados são recalculados server-side em menos de 1 segundo.
3. **Given** o modo personalizado, **When** o usuário define data inicial maior que a data final, **Then** o sistema bloqueia a aplicação e exibe alerta amigável de validação.
4. **Given** o comparativo com período anterior ativado, **When** existirem dados no período anterior equivalente, **Then** cada KPI exibe badge de variação percentual (ex.: `+14.5% vs período anterior`) e status de confiabilidade.

---

### User Story 2 — Relatório Comercial e Desempenho de Vendas (Priority: P1)
Como administrador, quero analisar o detalhamento das vendas concluídas, ticket médio, distribuição por formas de pagamento (Pix, Financiamento, Troca, Entrada), marcas/modelos mais vendidos e volume financeiro comercial.

**Why this priority**: Vendas constituem a principal fonte de receita da empresa.

**Independent Test**: Acessar a aba "Vendas", verificar os totais de vendas confirmadas, os rankings de categorias/marcas e a tabela analítica de vendas com paginação e ordenação.

**Acceptance Scenarios**:
1. **Given** a aba "Vendas" aberta, **When** existirem vendas concluídas no período, **Then** são exibidos: Faturamento Bruto, Quantidade de Vendas, Ticket Médio, Maior Venda, Menor Venda e Composição das Entradas vs Financiado vs Troca.
2. **Given** o ranking de marcas e categorias, **When** houver vendas diversificadas, **Then** a interface exibe as marcas mais vendidas e categorias mais populares ordenadas por volume e receita.
3. **Given** a tabela detalhada de vendas, **When** o admin clica no identificador da venda ou da moto, **Then** é redirecionado para a página correspondente no painel (`/admin/vendas/[id]` ou `/admin/motos/[id]`).

---

### User Story 3 — Relatório Financeiro, Despesas e Margem Operacional Estimada (Priority: P1)
Como administrador, quero visualizar as despesas totais do período, agrupadas por categoria (Manutenção, Loja, Marketing, Documentação) e por tipo (Gastos de Moto vs. Gastos da Loja), confrontando com o faturamento para apurar o Resultado Operacional Estimado.

**Why this priority**: Sem controle de despesas e margem, o faturamento não reflete a saúde do negócio.

**Independent Test**: Acessar a aba "Financeiro", validar que o total de despesas bate com a soma em `/admin/gastos` para a mesma competência e que o cálculo de resultado `(Receitas - Despesas)` está claro e documentado.

**Acceptance Scenarios**:
1. **Given** a aba "Financeiro", **When** o período está selecionado, **Then** exibe: Receita Total Concluída, Despesas Totais Lançadas, Despesas de Motos, Despesas Operacionais da Loja e Resultado Operacional Estimado.
2. **Given** o gráfico de composição de despesas, **When** renderizado, **Then** exibe a distribuição percentual e em reais por categoria com tooltip detalhado.
3. **Given** o detalhamento de custos por veículo, **When** uma moto teve múltiplos gastos de oficina/estética, **Then** o sistema lista a moto com seu custo total acumulado de preparação.

---

### User Story 4 — Relatório de Estoque, Idade de Pátio e Alertas de Giro (Priority: P1)
Como administrador, quero monitorar a quantidade de motos ativas em estoque, o valor total imobilizado a preço de anúncio, a idade média dos veículos no pátio e identificar motos paradas há mais de 30, 60 e 90 dias com sugestões operacionais transparentes.

**Why this priority**: Evita capital parado e depreciação desnecessária de estoque.

**Independent Test**: Acessar a aba "Estoque", verificar contagem de motos disponíveis/reservadas/vendidas, gráfico de faixas de idade (0-30d, 31-60d, 61-90d, 90d+) e tabela de motos que exigem atenção.

**Acceptance Scenarios**:
1. **Given** a aba "Estoque", **When** carregada, **Then** exibe: Motos Ativas, Motos Reservadas, Motos Vendidas no Período, Valor Total Anunciado em Estoque e Idade Média do Pátio.
2. **Given** a tabela "Motos que Exigem Atenção", **When** uma moto está cadastrada há mais de 60 dias sem propostas ou com preço acima da FIPE, **Then** o sistema sinaliza com tag visual e sugestão clara (ex.: *"Avaliar reajuste de preço"*, *"Reforçar divulgação comercial"*).
3. **Given** motos vendidas no período, **When** calculada a média de dias até a venda (`sale_date - created_at`), **Then** exibe o Tempo Médio de Venda com o tamanho da amostra válida.

---

### User Story 5 — Relatório de Clientes, Captação de Leads e Origem Comercial (Priority: P2)
Como administrador, quero acompanhar a evolução da carteira de clientes, o volume de leads e propostas recebidas (site, venda de moto, propostas, aluguéis) e os principais canais de atração.

**Why this priority**: Dá clareza sobre o ROI de canais e crescimento da base de contatos.

**Independent Test**: Acessar a aba "Clientes e Comercial", validar as métricas de novos clientes, gráficos de origem e contagem de solicitações públicas.

**Acceptance Scenarios**:
1. **Given** a aba "Clientes e Comercial", **When** o filtro de período é aplicado, **Then** exibe: Novos Clientes Cadastrados, Total de Leads/Propostas, Solicitações de Venda/Anúncio de Terceiros e Solicitações de Aluguel.
2. **Given** a distribuição por origem (`source`), **When** existirem leads cadastrados, **Then** exibe gráfico de barras/donut agrupando canais (Site, Manual, Vendas, WhatsApp, Outros).
3. **Given** a métrica de Conversão de Proposta em Venda, **When** não houver relacionamento direto em 100% das vendas, **Then** o sistema exibe status *"Estimado"* com tooltip explicativo sobre o critério de atribuição.

---

### User Story 6 — Central do Contador e Exportação Estruturada (CSV / XLSX / PDF) (Priority: P1)
Como administrador, quero exportar relatórios granulares e consolidados do período nos formatos CSV (para planilhas/contador), XLSX (pasta de trabalho multi-abas) e PDF (demonstrativo executivo visual) com proteção de dados pessoais e aviso de suporte contábil.

**Why this priority**: Atende diretamente à necessidade contábil e fiscal da loja, economizando horas de compilação manual.

**Independent Test**: Na aba "Contador" ou no botão global "Exportar", solicitar a geração de CSV de Vendas, XLSX Consolidado e PDF Executivo; validar que os arquivos contêm dados fiéis ao período selecionado, formato UTF-8 compatível com Excel e cabeçalhos em português.

**Acceptance Scenarios**:
1. **Given** a aba "Contador", **When** o admin clica em "Exportar Vendas (CSV)", **Then** o download inicia imediatamente com arquivo nomeado no padrão `af-motos-vendas_YYYY-MM-DD_a_YYYY-MM-DD.csv`, contendo colunas limpas e delimitador compatível.
2. **Given** a exportação contábil, **When** gerada por padrão, **Then** documentos de identificação pessoal (CPF, RG) NÃO são expostos abertamente a menos que o admin marque a opção explícita "Incluir dados cadastrais/documentos para fins contábeis".
3. **Given** a geração de PDF Executivo, **When** requisitada, **Then** um documento estilizado via `@react-pdf/renderer` é gerado server-side contendo cabeçalho com logo oficial, CNPJ da AF Motos, resumo de KPIs, tabelas consolidadas e o disclaimer contábil obrigatório no rodapé.

---

### User Story 7 — Segurança, RLS e Responsividade Mobile-First (Priority: P1)
Como administrador, quero que todas as consultas e exportações sejam restritas a administradores autenticados via RLS e que a interface seja 100% responsiva para uso no smartphone no pátio da loja.

**Why this priority**: Garante sigilo financeiro dos dados da empresa e comodidade operacional.

**Independent Test**: Tentar acessar rotas de API de exportação sem sessão autenticada (deve retornar 401/403); navegar no mobile verificando que cards, tabs horizontais e tabelas se adaptam perfeitamente à tela pequena.

**Acceptance Scenarios**:
1. **Given** uma requisição para `/api/admin/reports/export` sem autenticação admin, **When** enviada, **Then** o servidor rejeita com status 401 Não Autorizado.
2. **Given** navegação em tela mobile (< 768px), **When** a página `/admin/relatorios` é aberta, **Then** os KPIs são dispostos em cards compactos de fácil leitura, os filtros abrem em Drawer/Sheet e as tabelas oferecem rolagem horizontal suave ou visão em lista de cards.

---

## 4. Requisitos Funcionais

| ID | Requisito | Tipo | Prioridade |
|---|---|---|---|
| **RF-01** | Disponibilizar rota `/admin/relatorios` no layout protegido do painel com item no menu lateral e drawer mobile. | Interface | P1 |
| **RF-02** | Oferecer Seletor de Período Global com opções rápidas (Hoje, 7d, Este Mês, Mês Anterior, Este Trimestre, 3 Meses, Este Semestre, 6 Meses, Este Ano, 12 Meses, Personalizado). | Filtros | P1 |
| **RF-03** | Persistir seleção de período e aba ativa na URL via search params (`?period=...&tab=...`). | Navegação | P1 |
| **RF-04** | Exibir indicador de comparativo percentual contra o período anterior equivalente em todos os KPIs elegíveis. | Analytics | P1 |
| **RF-05** | Estruturar a página em 6 abas temáticas: `Visão Geral`, `Vendas`, `Financeiro`, `Estoque`, `Clientes e Comercial`, `Contador`. | UX | P1 |
| **RF-06** | Identificar cada métrica com badge de confiabilidade: `Confirmado`, `Estimado` ou `Indisponível`. | Transparência | P1 |
| **RF-07** | Calcular e exibir KPIs na Visão Geral: Faturamento, Quantidade Vendida, Ticket Médio, Despesas, Resultado Operacional Estimado, Margem Estimada, Clientes Novos, Leads Recebidos, Estoque Ativo, Valor Total Anunciado e Tempo Médio de Venda. | Cálculos | P1 |
| **RF-08** | Apresentar gráficos interativos: Evolução Faturamento vs Despesas, Vendas por Mês, Distribuição de Formas de Pagamento e Idade de Estoque. | Visualização | P1 |
| **RF-09** | Exibir rankings de desempenho: Marcas mais vendidas, Categorias mais vendidas, Veículos de maior margem e Veículos com maior tempo de pátio. | Analytics | P1 |
| **RF-10** | Disponibilizar tabela de "Motos que Exigem Atenção" na aba de Estoque com regras claras de alerta (>60 dias, acima da FIPE, alto custo acumulado). | Alertas | P1 |
| **RF-11** | Listar na aba Financeiro o detalhamento de despesas agrupadas por categoria e rateadas entre Moto e Loja. | Custos | P1 |
| **RF-12** | Disponibilizar aba "Contador" com cards de exportação rápida para Vendas, Despesas, Estoque, Clientes e Consolidado. | Contabilidade | P1 |
| **RF-13** | Gerar arquivos CSV em UTF-8 com formatação numérica e de datas adaptada para Excel em português do Brasil. | Exportação | P1 |
| **RF-14** | Gerar pasta de trabalho XLSX estruturada com abas separadas (`Resumo`, `Vendas`, `Despesas`, `Estoque`, `Clientes`, `Notas`). | Exportação | P1 |
| **RF-15** | Gerar documento PDF Executivo via `@react-pdf/renderer` contendo identidade visual AF Motos, sumário executivo, tabelas resumidas e disclaimer fiscal. | Exportação | P1 |
| **RF-16** | Incluir disclaimer legal em todas as exportações e rodapés de relatórios contábeis. | Compliance | P1 |
| **RF-17** | Ocultar documentos sensíveis (CPF/RG) por padrão nas exportações, exigindo checkbox explícito de autorização. | LGPD / Privacidade | P1 |
| **RF-18** | Bloquear qualquer cálculo automatizado de tributos fiscais ou promessa de conformidade com declarações oficiais da Receita Federal. | Legal | P1 |
| **RF-19** | Proteger todas as consultas e endpoints de relatório garantindo acesso exclusivo a administradores autenticados. | Segurança | P1 |
| **RF-20** | Exibir estados vazios explicativos e amigáveis quando o período selecionado não contiver movimentações registradas. | UX | P1 |

---

## 5. Requisitos Não Funcionais & Qualidade

1. **Performance**: O carregamento inicial da Visão Geral deve ocorrer em menos de 800ms em conexões 4G estáveis através de consultas SQL agregadas server-side, sem carregar listas completas no cliente.
2. **Design System & Estética**: 100% de aderência ao visual dark premium do AF Motos (fundo `#08080a` / `#0c0c0f`, dourado `#c9a44c`, cinzas neutros zinc, tipografia limpa, bordas sutis e badges semânticos).
3. **Acessibilidade**: Contraste conforme WCAG 2.2 AA, rótulos textuais para todos os controles e gráficos com suporte a navegação por teclado e leitores de tela.
4. **Resiliência e Erros**: Tratamento gracioso de períodos sem dados, falhas de conexão ou valores nulos sem quebrar a renderização da tela (Error Boundaries e Skeletons dedicados).

---

## 6. Critérios de Sucesso (Tecnologicamente Agnósticos)

1. **Tempo de Análise Reduzido**: O proprietário da loja consegue consultar o faturamento, lucro operacional estimado e despesas de qualquer período em menos de 10 segundos.
2. **Identificação de Estoque Ocioso**: 100% das motocicletas disponíveis com mais de 60 dias de cadastro são visíveis imediatamente na aba de estoque com suas ações sugeridas.
3. **Autonomia Contábil**: O fechamento mensal de informações para o contador pode ser extraído em arquivo único (XLSX ou CSV) com 1 clique, eliminando planilhas manuais paralelas.
4. **Precisão e Transparência**: 0% de ocorrência de valores fiscais fictícios ou margens rotuladas incorretamente como oficiais.
5. **Adoção Mobile**: A visualização completa de relatórios e exportações funciona com agilidade em celulares, sem cortes ou quebra de layout.

---

## 7. Edge Cases & Tratamento de Exceções

1. **Período sem Vendas ou Gastos**: Exibir estado vazio ilustrado com mensagem explicativa e CTA sugerindo registrar movimentações, mantendo os cards com valor zero sem estourar divisões por zero (ex.: Ticket Médio = R$ 0,00).
2. **Moto Vendida sem Data de Cadastro Histórica**: Para cálculo de tempo médio de venda, ignorar registros que não possuam ambas as datas preenchidas e explicitar a quantidade de registros válidos utilizados na amostra.
3. **Datas Futuras no Filtro Personalizado**: Impedir seleção de `start_date` no futuro ou `start_date > end_date` desabilitando o botão de busca e emitindo mensagem de validação inline.
4. **Vendas Canceladas**: Excluir vendas com `payment_status = 'CANCELLED'` de todos os cálculos de faturamento e ticket médio.
5. **Despesas Previstas vs Pagas**: Na aba Financeiro, permitir alternar ou visualizar separadamente despesas com status `PAID` (realizadas) e `PENDING` (previstas), garantindo que o Resultado Operacional considere apenas as despesas efetivamente pagas.
