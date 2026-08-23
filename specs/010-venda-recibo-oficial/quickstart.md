# Quickstart & Validation Guide: Refatoração de Venda de Veículos, Dados Fiscais/Cadastrais e Recibo Oficial A4

**Feature**: `010-venda-recibo-oficial` | **Date**: 2026-08-23

---

## 1. Pré-requisitos & Ambiente

- Node.js 18+ e dependências instaladas (`npm install`).
- Acesso ao Supabase ou banco PostgreSQL local configurado no `.env.local`.
- Servidor Next.js em execução (`npm run dev`).

---

## 2. Cenários de Validação Ponta a Ponta

### Cenário 1: Execução da Migration de Banco de Dados
1. Executar a migration `20260823010000_enhance_sales_official_receipt.sql` no banco de dados.
2. Verificar se as tabelas `public.sales` e `public.motorcycles` possuem as novas colunas (`chassi`, `renavam`, `delivery_km`, `entry_amount`, `financed_amount`, `trade_amount`, `legal_terms_accepted`, campos de endereço `buyer_cep`, `buyer_street`, etc.).
3. Confirmar que consultas a vendas e motos já existentes continuam funcionando sem regressão.

---

### Cenário 2: Preenchimento do Novo Formulário no Painel Admin
1. Acessar `/admin/vendas/nova` (ou selecionar "Vender" a partir da listagem de motos).
2. Testar máscaras interativas:
   - Digitar `12345678901` no Renavam → Máscara e validação numérica.
   - Digitar `9bwca41jx84000000` no Chassi → Conversão automática para maiúsculo `9BWCA41JX84000000` e trava em 17 dígitos.
   - Digitar CPF `11122233344` ou CNPJ `11222333000199` → Máscara dinâmica ajustada.
   - Digitar CEP `01310-100` e preencher Rua, Número, Bairro, Cidade e UF.
   - Selecionar Forma de Pagamento (ex: Financiamento) e discriminar Valor Total (R$ 25.000,00), Entrada (R$ 5.000,00) e Financiado (R$ 20.000,00).
   - Verificar texto padrão de termos técnicos e checkbox de aceite legal.
3. Submeter a venda e verificar o toast de sucesso e redirecionamento para o recibo.

---

### Cenário 3: Renderização do Recibo Oficial A4 e Impressão
1. Acessar a tela de recibo da venda `/admin/vendas/[id]/recibo` (ou modal de recibo).
2. Validar a presença das 5 seções institucionais:
   - **Cabeçalho**: Logo AF Motos, Razão Social, CNPJ, Contatos, Badge `AFM-2026-XXXX` e Data/Hora.
   - **Seção 1**: Identificação do Veículo em grid de 3 colunas (Marca/Modelo/Versão, Ano, Placa, Cor, Renavam, Chassi, KM de Entrega).
   - **Seção 2**: Identificação das Partes (Vendedora e Comprador com endereço completo formatado).
   - **Seção 3**: Condições de Pagamento e Quitação (Tabela discriminativa de valores e forma de liquidação).
   - **Seção 4**: Termos Legais & Cláusulas (Vistoria mecânica/estética, Art. 123 do CTB e responsabilidade por infrações).
   - **Seção 5**: Linhas formais de assinatura do Vendedor e Comprador.
3. Acionar o botão "Imprimir Recibo" (`window.print()`):
   - Verificar no preview do navegador se o documento cabe exatamente em **1 página A4**.
   - Conferir se não há cortes no rodapé nem quebra para uma segunda folha.
4. Acionar o botão "Baixar PDF" e verificar a consistência do documento gerado via `@react-pdf/renderer`.
