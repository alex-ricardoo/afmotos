# Quickstart & Verification Guide: Central de Relatórios Gerenciais

**Feature**: `017-central-relatorios-gerenciais`  
**Target URL**: `http://localhost:3000/admin/relatorios`

---

## 1. Acesso & Navegação

1. Inicie a aplicação:
   ```bash
   npm run dev
   ```
2. Faça login como administrador em `/admin/login`.
3. No menu lateral desktop ou no menu inferior mobile (clicando em "Mais"), selecione o item **Relatórios**.
4. A página inicial carregará a aba **Visão Geral** com o período padrão **Este Mês**.

---

## 2. Guia de Operação para o Gestor

### Alternando Períodos de Análise
1. Clique no botão de período no topo da página (ex.: `Este Mês`).
2. Selecione qualquer uma das opções rápidas:
   - *Hoje*, *Últimos 7 dias*, *Este mês*, *Mês anterior*, *Este trimestre*, *Últimos 3 meses*, *Este semestre*, *Últimos 6 meses*, *Este ano*, *Últimos 12 meses*.
3. Para um intervalo específico, selecione **Personalizado**, defina a data inicial e final e clique em **Aplicar**.
4. Observe que a URL reflete o filtro (ex.: `/admin/relatorios?period=this_quarter`) permitindo compartilhar o link com outro gestor ou recarregar sem perder a seleção.

### Interpretando a Confiabilidade das Métricas
- 🟢 **Confirmado**: O valor reflete com precisão os lançamentos concluídos no banco (ex.: faturamento de vendas pagas, total de despesas lançadas).
- 🟡 **Estimado**: O valor resulta de cálculo aproximado ou dado operacional parcial (ex.: margem estimada antes de despesas fixas indiretas, tempo médio de pátio).
- ⚪ **Indisponível**: A informação requer dados adicionais que ainda não foram preenchidos (ex.: lucro líquido oficial com apuração contábil/fiscal).

---

## 3. Exportação para o Contador

1. Acesse a aba **Contador** ou clique no botão **Exportar Relatório** no cabeçalho.
2. Escolha o tipo de demonstrativo desejado:
   - **Vendas do Período (CSV)**: Ideal para conferência de receita e formas de recebimento.
   - **Despesas e Centros de Custo (CSV)**: Detalha fornecedores, categorias e gastos vinculados a motos.
   - **Pasta de Trabalho Consolidada (XLSX)**: Planilha completa contendo abas separadas de Vendas, Gastos, Estoque e Resumo.
   - **Relatório Executivo (PDF)**: Documento oficial visual formatado com logotipo e resumo para impressão.
3. Se o contador necessitar de dados cadastrais completos (CPF/CNPJ do comprador para emissão de documentos), marque a caixa de seleção *"Incluir documentos de identificação"* no modal de confirmação.
4. Clique em **Baixar Arquivo**. O download iniciará instantaneamente.

---

## 4. Roteiro de Testes e Validação

### Teste 1: Consistência de Filtros e URLs
- **Ação**: Selecione o período "Este Ano" e mude para a aba "Estoque".
- **Resultado Esperado**: A URL deve conter `?period=this_year&tab=inventory`, e os dados de estoque devem ser atualizados.

### Teste 2: Validação de Período sem Dados (Empty State)
- **Ação**: Selecione uma data personalizada no passado distante (ex.: 2020-01-01 a 2020-01-31).
- **Resultado Esperado**: Os cards devem exibir R$ 0,00 e as tabelas devem apresentar estado vazio amigável com mensagem explicativa, sem erros de console ou divisões por zero.

### Teste 3: Validação de Segurança & RLS
- **Ação**: Abra uma janela anônima e tente acessar diretamente `/api/admin/reports/export?format=csv&type=vendas`.
- **Resultado Esperado**: O servidor deve retornar `HTTP 401 Não Autorizado`.

### Teste 4: Verificação de Responsividade Mobile
- **Ação**: Abra o DevTools (F12), simule uma tela de smartphone (375x667px).
- **Resultado Esperado**: Todas as abas são roláveis horizontalmente, os filtros abrem em Drawer/Sheet inferior e não há quebra de layout.
