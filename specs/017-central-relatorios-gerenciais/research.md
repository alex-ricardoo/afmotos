# Technical Research & Architectural Decisions: Central de Relatórios Gerenciais

**Feature**: `017-central-relatorios-gerenciais`  
**Date**: 2026-08-30  
**Author**: SpecKit Architecture & BI Analyst

---

## 1. Contexto & Objetivos da Pesquisa

Esta pesquisa estabelece as bases técnicas, matemáticas e de conformidade para a **Central de Relatórios Gerenciais da AF Motos**. O objetivo é garantir:
1. Agilidade de resposta (consultas server-side agregadas em < 800ms).
2. Consistência visual absoluta com o Design System existente no painel (`#08080a`, `#c9a44c`, zinc tokens).
3. Confiabilidade matemática e transparência sobre dados confirmados vs. estimados.
4. Exportações multi-formato (CSV, XLSX, PDF) com proteção de dados pessoais e disclaimer fiscal.

---

## 2. Decisões Arquiteturais & Trade-offs (Decision Records)

### Decisão 1: Abordagem de Gráficos e Visualização de Dados
- **Contexto**: A aplicação precisa exibir gráficos de evolução temporal (faturamento vs. despesas por mês/semana), barras de distribuição por formas de pagamento, faixas de idade de estoque e composição de categorias.
- **Opções Avaliadas**:
  1. *Biblioteca externa pesada (ex.: Recharts / Chart.js)*: Adiciona peso ao bundle cliente, pode apresentar instabilidades com React 19 Server Components.
  2. *Componentes de Gráficos SVG/HTML Tailwind Especializados (Padrão já adotado em `SalesAnalyticsChart`)*: Já implementado com sucesso em `components/admin/dashboard/sales-analytics-chart.tsx`. Apresenta performance excepcional, zero bundle externo, transições suaves, tooltips posicionados e 100% de aderência ao tema dark do projeto.
- **Decisão**: Utilizar **Componentes SVG/Tailwind Modulares Especializados** para gráficos de barras, linhas compostas, pirâmides de idade e barras horizontais de ranking. Para gráficos donuts simples de distribuição, utilizar SVGs paramétricos leves com CSS animations.
- **Consequências**: Renderização instantânea, zero incompatibilidade com React 19, facilidade de manutenção e consistência total com o design do AF Motos.

---

### Decisão 2: Estratégia de Exportação (CSV, XLSX e PDF)
- **Contexto**: O dono da loja precisa enviar dados ao contador em planilhas e gerar relatórios visuais executivos para reuniões e conferência.
- **Opções Avaliadas**:
  - **CSV**: Geração nativa server-side em Node.js com codificação `UTF-8 com BOM` (`\uFEFF`) e delimitador ponto-e-vírgula (`;`), garantindo que o Microsoft Excel em português do Brasil reconheça automaticamente colunas, acentuação e números sem corromper formatação.
  - **XLSX**: Geração server-side estruturada com abas múltiplas (`Resumo`, `Vendas`, `Despesas`, `Estoque`, `Clientes`). Usar `exceljs` no backend ou formatação XML OpenXML limpa.
  - **PDF**: Utilizar `@react-pdf/renderer` (já instalado e padronizado no projeto via `lib/pdf/sale-receipt.tsx` e `lib/pdf/technical-sheet.tsx`). Permite gerar PDFs com logotipo em alta resolução, cabeçalho oficial com CNPJ, tabelas alinhadas e disclaimer contábil no rodapé.
- **Decisão**: Implementar a rota centralizada `app/api/admin/reports/export/route.ts` que recebe os parâmetros de filtro e o formato desejado (`format=csv|xlsx|pdf&type=vendas|despesas|estoque|consolidado`), gerando a resposta em streaming ou buffer binário com headers de download direto (`Content-Disposition: attachment`).
- **Consequências**: Downloads rápidos, arquivos gerados no servidor com autenticação de sessão e sem persistência desnecessária de PII no storage público.

---

### Decisão 3: Camada de Consultas e Agregações de Dados
- **Contexto**: Calcular métricas de faturamento, despesas, margem e tempo de pátio não deve sobrecarregar o cliente com fetching de milhares de registros brutos.
- **Opções Avaliadas**:
  1. *Carregar todos os arrays no cliente e fazer `.reduce()`*: Inviável para escalabilidade, desperdiça banda e trava o navegador.
  2. *Views no PostgreSQL*: Simplificam SQLs repetidas, porém exigem migrações no banco para cada novo filtro dinâmico.
  3. *Camada de Queries Agregadas Server-Side em TypeScript com Supabase Client (`lib/reports/queries.ts`)*: Utiliza queries SQL otimizadas com `.select()`, `count: 'exact'`, filtros combinados e projeções de campos necessários, reaproveitando a conexão server do Next.js.
- **Decisão**: Implementar uma **camada de consultas server-side centralizada (`lib/reports/queries.ts`)**, que realiza consultas agregadas paralelas via `Promise.all()` e retorna payloads tipados estritamente com `ReportData`.
- **Consequências**: Altíssima performance (< 500ms), tipagem estrita de ponta a ponta e manutenção facilitada no código da aplicação.

---

### Decisão 4: Regras de Timezone e Períodos
- **Contexto**: O banco armazena timestamps em UTC com `timestamptz`. Os filtros de datas administrativas no Brasil operam no fuso `America/Sao_Paulo` (UTC-3).
- **Decisão**: Todas as datas de início e fim dos períodos devem ser normalizadas para o início do dia `00:00:00.000-03:00` e fim do dia `23:59:59.999-03:00` na camada de parsing de datas (`lib/reports/date-range.ts`).
- **Presets Suportados**:
  - `today`: Início e fim na data corrente.
  - `last_7_days`: Últimos 7 dias corridos.
  - `this_month`: 1º dia do mês corrente até a data atual.
  - `last_month`: 1º ao último dia do mês anterior.
  - `this_quarter`: Início do trimestre atual até a data atual.
  - `last_3_months`: Últimos 90 dias corridos.
  - `this_semester`: Início do semestre atual (Jan ou Jul) até a data atual.
  - `last_6_months`: Últimos 180 dias corridos.
  - `this_year`: 1º de janeiro do ano atual até a data atual.
  - `last_12_months`: Últimos 365 dias corridos.
  - `custom`: Intervalo arbitrário `start_date` a `end_date`.

---

## 3. Catálogo e Fórmulas de Métricas

### Métrica 1: Faturamento Bruto de Vendas
- **Classificação**: **Confirmado**
- **Objetivo**: Medir a receita total de vendas realizadas no período selecionado.
- **Fórmula**: $\sum \text{sales.sale\_price}$ onde $\text{sales.sale\_date} \in [\text{start\_date}, \text{end\_date}]$ e $\text{sales.payment\_status} = \text{'PAID'}$.
- **Tabelas / Campos**: `sales.sale_price`, `sales.sale_date`, `sales.payment_status`.
- **Exclusões**: Vendas canceladas (`status = 'CANCELLED'`), orçamentos ou rascunhos.

---

### Métrica 2: Quantidade de Motos Vendidas
- **Classificação**: **Confirmado**
- **Objetivo**: Volume físico de veículos comercializados.
- **Fórmula**: $\text{COUNT}(\text{sales.id})$ no período com pagamento confirmado.
- **Tabelas / Campos**: `sales.id`, `sales.sale_date`, `sales.payment_status`.

---

### Métrica 3: Ticket Médio de Venda
- **Classificação**: **Confirmado**
- **Objetivo**: Valor médio por transação de venda.
- **Fórmula**: $\frac{\text{Faturamento Bruto}}{\text{Quantidade de Vendas}}$, retornando `0` se quantidade for zero.

---

### Métrica 4: Total de Despesas do Período
- **Classificação**: **Confirmado**
- **Objetivo**: Total de saídas financeiras cadastradas.
- **Fórmula**: $\sum \text{expenses.amount}$ onde $\text{expenses.expense\_date} \in [\text{start\_date}, \text{end\_date}]$ e $\text{expenses.status} = \text{'PAID'}$.
- **Segmentação**:
  - *Despesas de Motos*: `expense_type = 'MOTO'` (oficina, peças, pintura, lavagem, documentação).
  - *Despesas da Loja*: `expense_type = 'LOJA'` (aluguel do ponto, energia, internet, marketing, contabilidade).

---

### Métrica 5: Resultado Operacional Estimado (Gerencial)
- **Classificação**: **Estimado**
- **Objetivo**: Indicador preliminar da sobra de caixa operacional antes de encargos fiscais complexos e depreciação.
- **Fórmula**: $(\text{Faturamento Bruto} + \text{Comissões de Acordos}) - \text{Total de Despesas Pagas}$.
- **Ressalva**: *Este número não constitui Demonstração de Resultado do Exercício (DRE) oficial contábil.*

---

### Métrica 6: Margem Operacional Estimada (%)
- **Classificação**: **Estimado**
- **Objetivo**: Proporção percentual do resultado sobre o faturamento.
- **Fórmula**: $\frac{\text{Resultado Operacional Estimado}}{\text{Faturamento Bruto}} \times 100$.

---

### Métrica 7: Estoque Ativo & Capital Imobilizado
- **Classificação**: **Confirmado**
- **Objetivo**: Quantidade de motos prontas para comercialização e valor total em carteira.
- **Fórmulas**:
  - *Motos Ativas*: $\text{COUNT}(\text{motorcycles.id})$ onde $\text{status} = \text{'AVAILABLE'}$.
  - *Capital Imobilizado (Preço Anunciado)*: $\sum \text{motorcycles.price}$ onde $\text{status} = \text{'AVAILABLE'}$.
  - *Motos Reservadas*: $\text{COUNT}(\text{motorcycles.id})$ onde $\text{status} = \text{'RESERVED'}$.

---

### Métrica 8: Idade Média do Estoque (Dias em Pátio)
- **Classificação**: **Estimado**
- **Objetivo**: Identificar a velocidade de renovação dos veículos.
- **Fórmula**: $\text{AVG}(\text{CURRENT\_DATE} - \text{motorcycles.created\_at})$ para motos disponíveis.
- **Faixas de Idade**:
  - 0 a 30 dias (Estoque Novo)
  - 31 a 60 dias (Estoque Regular)
  - 61 a 90 dias (Atenção Comercial)
  - Mais de 90 dias (Estoque Crítico / Imobilizado)

---

### Métrica 9: Tempo Médio para Venda
- **Classificação**: **Estimado**
- **Objetivo**: Medir quantos dias uma moto leva desde a entrada até a venda.
- **Fórmula**: $\text{AVG}(\text{sales.sale\_date} - \text{motorcycles.created\_at})$ para motos vendidas no período que possuam ambas as datas preenchidas e válidas.

---

### Métrica 10: Novos Clientes & Captação de Leads
- **Classificação**: **Confirmado**
- **Objetivo**: Crescimento da carteira de relacionamento e volume de contatos comerciais.
- **Fórmulas**:
  - *Novos Clientes*: $\text{COUNT}(\text{customers.id})$ com $\text{created\_at}$ no período.
  - *Total de Leads/Propostas*: $\text{COUNT}(\text{leads.id}) + \text{COUNT}(\text{sell\_requests.id}) + \text{COUNT}(\text{rental\_requests.id})$.

---

## 4. Política de Privacidade & LGPD nas Exportações

Ao gerar exportações de vendas, clientes ou demonstrativos contábeis:
1. **Anonimização Padrão**: Arquivos CSV e XLSX exportados por padrão NÃO incluem CPF completo, RG ou dados sensíveis de contato, apresentando apenas o nome do comprador e valor da transação.
2. **Exportação Estendida para Contabilidade**: Uma opção protegida por modal ("Exportação Cadastral para Contador") permite incluir CPF/CNPJ e endereço fiscal completo, mediante confirmação explícita de autoridade do administrador.
3. **Auditoria**: O sistema registra no log de execução os parâmetros da exportação (tipo, período, ID do admin, quantidade de registros) sem gravar PII nos logs.

---

## 5. Lacunas Identificadas no Banco & Recomendações Futuras

| Lacuna Identificada | Impacto no Relatório | Solução no MVP | Recomendação de Evolução Futura |
|---|---|---|---|
| Tabela `motorcycles` não possui coluna `purchase_cost` (Custo de Compra da moto pela loja). | O lucro bruto por moto individual considera apenas as despesas de preparação vinculadas na tabela `expenses`. | Rotular o lucro por moto como "Margem Operacional de Preparação (Estimada)". | Adicionar migration futura: `ALTER TABLE motorcycles ADD COLUMN IF NOT EXISTS purchase_cost numeric(12,2);` |
| Vendas criadas sem vínculo obrigatório com um `lead_id`. | Taxa de conversão de leads em vendas precisa ser estimada por correspondência de cliente (`customer_id`). | Exibir conversão com badge "Estimado" e explicativo transparente. | Vincular opcionalmente o `lead_id` no cadastro de venda em `/admin/vendas/nova`. |
| Regime de competência contábil vs data de pagamento. | Algumas despesas são lançadas por `expense_date` e outras por `competence_month`. | Oferecer nas opções avançadas do filtro a escolha entre "Data do Gasto" e "Mês de Competência". | Manter campos sempre sincronizados no módulo de gastos. |
