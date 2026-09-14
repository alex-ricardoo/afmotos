# Quickstart: Relatório Financeiro e Operacional de Histórico Veicular

**Feature Directory**: `specs/037-vehicle-history-financial-accountant-reports`  
**Audience**: Administradores, Gestores e Engenheiros da AF Motos  

---

## 1. O que é esta funcionalidade?

Esta funcionalidade entrega à AF Motos:
1. **Configuração Unificada e Versionada de Precificação**: O administrador configura o preço de venda da consulta avulsa e o custo unitário cobrado pela API Brasil em um só lugar (`/admin/configuracoes`), com histórico imutável que nunca recalcula consultas passadas.
2. **Central de Relatórios de Histórico Veicular**: Localizada em `/admin/relatorios?tab=historico-veicular`, exibe cards com faturamento bruto, estornos confirmados, receita líquida, custos da API Brasil, margem bruta estimada e tabelas detalhadas.
3. **Informe Anual para o Contador**: Uma visualização consolidada do ano fiscal com detalhamento mês a mês e botão de download de **CSV Padronizado**, pronto para ser enviado ao contador.

---

## 2. Como usar no dia a dia?

### 2.1 Reajustar o Preço de Venda ou Custo da API Brasil
1. Acesse o menu administrativo: **Configurações > Histórico Veicular**.
2. Localize a seção **"Precificação e Custo do Histórico Veicular"**.
3. Altere o Preço de Venda (ex.: de `R$ 39,90` para `R$ 49,90`) ou o Custo da API Brasil (ex.: de `R$ 30,00` para `R$ 35,00`).
4. Note que a **Margem Bruta Estimada** é calculada automaticamente na tela.
5. Digite uma justificativa no campo "Motivo da alteração" e clique em **"Salvar Nova Tabela"**.
6. Confirme a alteração na modal. Uma nova versão vigente entrará em vigor para novas consultas. As consultas antigas manterão o custo com o qual foram processadas.

### 2.2 Consultar o Desempenho Financeiro e Operacional
1. Acesse o menu administrativo: **Relatórios**.
2. Selecione a aba **Histórico Veicular**.
3. Escolha o período desejado no filtro de topo (ex.: "Mês Atual" ou "Últimos 7 dias").
4. Analise os cards de KPI:
   - **Receita Líquida**: Pagamentos aprovados menos estornos confirmados.
   - **Custo API Brasil**: Total de custos cobrados em consultas live reais.
   - **Margem Bruta Estimada**: Ganho operacional efetivo.
   - **Cache Hits**: Consultas entregues sem custo adicional de provedor.
5. Navegue pelas 3 visões analíticas:
   - **Consultas e Custo**: laudos gerados, custos snapshots e status do provedor.
   - **Pagamentos e Estornos**: conciliação de transações Mercado Pago e refunds.
   - **Pacotes e Créditos**: controle de consumo e faturamento de agências parceiras.

### 2.3 Gerar o Informe Anual para o Contador
1. Na Central de Relatórios de Histórico Veicular, clique na sub-aba **"Informe Anual do Contador"**.
2. Selecione o ano fiscal de referência (ex.: `2026`).
3. Revise o resumo anual e a distribuição mês a mês das receitas, estornos e despesas de API Brasil.
4. Clique em **"Exportar CSV Anual"** para baixar a planilha estruturada.
5. Encaminhe o arquivo CSV ao contador da loja acompanhado do disclaimer de apoio gerencial.
