# Quickstart & Manual Validation Guide: Módulo Financeiro de Gastos

**Feature Branch**: `015-modulo-financeiro-gastos`

**Date**: 2026-08-24

## 1. Pré-requisitos & Configuração

1. **Executar a Migration do Banco de Dados**:
   Aplique a migration no ambiente local/Supabase para criar as tabelas `public.expense_categories` e `public.expenses`, juntamente com os índices, constraints e RLS:
   ```bash
   npx supabase migration up
   ```
   *Ou execute os scripts SQL das tabelas e seeds presentes em `data-model.md` no editor SQL do Supabase Console.*

2. **Servidor de Desenvolvimento**:
   Inicie o servidor Next.js:
   ```bash
   npm run dev
   ```

3. **Credenciais Admin**:
   Acesse o painel administrativo em `http://localhost:3000/admin/login` e faça login com uma conta com perfil de administrador.

---

## 2. Roteiro de Validação End-to-End

### Cenário 1: Navegação no Menu Admin
1. Navegue pelo menu lateral do painel admin em `http://localhost:3000/admin`.
2. Verifique a existência do novo item **"Gastos"** com ícone financeiro (`Wallet`/`Receipt`) entre "Locações/Vendas" e "Configurações".
3. Clique no item e confirme o redirecionamento para a rota `/admin/gastos`.

### Cenário 2: Lançamento de Gasto de Moto
1. Na tela `/admin/gastos`, clique no botão **"Adicionar gasto"**.
2. Selecione o tipo **"Gasto de moto"**.
3. Escolha uma motocicleta cadastrada na lista (verifique se exibe foto/marca/modelo/placa).
4. Selecione a categoria **"Óleo e Filtros"**, digite o valor `180,00`, escolha a data de hoje, status **"Pago"** e forma de pagamento **"PIX"**.
5. Clique em **"Salvar gasto"**.
6. **Resultado esperado**: O modal fecha, o gasto aparece na listagem com a identificação da moto e o indicador "Gastos com motos" e "Total do Mês" do dashboard são incrementados em R$ 180,00.

### Cenário 3: Lançamento de Gasto Geral da Loja
1. Clique em **"Adicionar gasto"**.
2. Selecione o tipo **"Gasto da loja"**.
3. Verifique que a seleção de motocicleta fica desabilitada/oculta.
4. Escolha a categoria **"Aluguel da Loja"**, valor `2500,00`, status **"Pendente"** e forma de pagamento **"Boleto"**.
5. Clique em **"Salvar gasto"**.
6. **Resultado esperado**: O gasto é cadastrado sem vínculo de moto, o indicador "Total Pendente" do mês aumenta em R$ 2.500,00.

### Cenário 4: Alteração de Status
1. Localize o gasto de aluguel marcado como "Pendente".
2. Clique no menu de ações e selecione **"Marcar como pago"**.
3. **Resultado esperado**: O status atualiza para "Pago" (com badge verde), o valor de R$ 2.500,00 sai do indicador "Pendente" e entra no indicador "Pago".

### Cenário 5: Filtros e Filtro por Mês de Competência
1. Altere o seletor de mês para um mês anterior (ex: Julho/2026).
2. Verifique se os totais do dashboard zera ou exibe apenas dados daquela competência.
3. Volte para o mês atual e digite o título no campo de busca. Confirme a filtragem instantânea na lista.

### Cenário 6: Validação de Responsividade Mobile
1. Abra as ferramentas de desenvolvedor do navegador e altere a visualização para resolução mobile (ex: iPhone 14 - 390px).
2. Verifique se a lista de gastos é apresentada em formato de Cards (sem barra de rolagem horizontal na página).
3. Teste a abertura do formulário de novo gasto (exibido como Drawer responsivo).

---

## 3. Validação de Build & Qualidade

Execute os comandos de verificação automatizada do projeto:

```bash
npm run lint
npm run typecheck
npm run build
```
