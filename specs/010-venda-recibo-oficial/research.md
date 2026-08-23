# Research: Refatoração de Venda de Veículos, Dados Fiscais/Cadastrais e Recibo Oficial A4

**Feature**: `010-venda-recibo-oficial` | **Date**: 2026-08-23

---

## 1. Contexto & Objetivos Técnicos

O objetivo é estruturar uma solução robusta, moderna e de alto rigor visual para o fechamento de vendas de motocicletas na AF Motos, com três frentes articuladas:
1. **Modelagem de Dados & Migration**: Suporte granular a dados cadastrais (endereço separado por logradouro, número, bairro, cidade, UF, CEP), dados veiculares fiscais (Renavam 11 dígitos, Chassi 17 caracteres, KM no ato da entrega) e composição financeira (Total, Entrada, Financiado/Troca, Forma de Pagamento e Aceite Legal).
2. **Formulário Administrativo Inteligente (UX/UI)**: Interface reativa com máscaras dinâmicas (CPF/CNPJ, WhatsApp, CEP com preenchimento automático se desejado, Renavam, Chassi com uppercase instantâneo), sugestão automática de termos de entrega técnica e validação de consistência monetária.
3. **Template de Recibo Oficial A4 Premium**: Renderização institucional de alta fidelidade visual para visualização web, impressão nativa nítida (`window.print` + `@media print` com layout de 1 folha sem quebra) e compatibilidade com geração de PDF (`@react-pdf/renderer`).

---

## 2. Decisões Arquiteturais

### Decisão 1: Estratégia de Persistência e Idempotência no Supabase (PostgreSQL)
- **Decisão**: Criar migration com `ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS ...` e `ALTER TABLE public.motorcycles ADD COLUMN IF NOT EXISTS ...`.
- **Campos adicionados em `sales`**:
  - `renavam text` (11 dígitos)
  - `chassi text` (17 caracteres)
  - `delivery_km integer`
  - `entry_amount numeric(12,2) DEFAULT 0`
  - `financed_amount numeric(12,2) DEFAULT 0`
  - `trade_amount numeric(12,2) DEFAULT 0`
  - `legal_terms_accepted boolean DEFAULT true`
  - `buyer_cep text`
  - `buyer_street text`
  - `buyer_number text`
  - `buyer_neighborhood text`
  - `buyer_city text`
  - `buyer_state text`
  - `buyer_complement text`
- **Campos adicionados em `motorcycles`**:
  - `renavam text`
  - `chassi text`
- **Rationale**: Permite que o veículo armazene seu Renavam e Chassi de forma permanente no estoque, e que a venda congele esses dados juntamente com o KM exato de entrega e o endereço completo no momento da transação.

---

### Decisão 2: Formatação de Impressão A4 vs. Download PDF
- **Decisão**: Implementar uma abordagem híbrida:
  1. Componente React renderizado na web com `@media print` estilizado em Tailwind CSS puro para o diálogo de impressão do navegador (`Ctrl+P` / `window.print()`).
  2. Atualização correspondente no gerador `@react-pdf/renderer` existente em `lib/pdf/sale-receipt.tsx` para permitir download direto de arquivo `.pdf`.
- **Rationale**: Garante flexibilidade máxima para o administrador (imprimir direto na impressora física com fidelidade A4 ou enviar o PDF digital assinado pelo WhatsApp para o cliente).

---

### Decisão 3: Validação & Máscaras no Client-Side (React Hook Form + Zod)
- **Decisão**: Utilizar utilitários de máscara puros e sem dependências pesadas externas (`cpfCnpjMask`, `phoneMask`, `cepMask`, `renavamMask`, `chassiFormat`), integrados diretamente ao `react-hook-form` com validação de runtime no Zod schema.
- **Rationale**: Máximo desempenho, zero conflito de dependências e controle fino de input para preenchimento ágil no mobile e no desktop.

---

### Decisão 4: Cláusulas Jurídicas e Termos Oficiais do Recibo
- **Decisão**: Incluir formalmente no recibo:
  1. **Vistoria Mecânica e Estética**: Declaração de ciência e aprovação do estado de conservação do veículo usado.
  2. **Transferência DETRAN**: Obrigação legal de transferência de propriedade no prazo de 30 dias, conforme o Art. 123 do Código de Trânsito Brasileiro (CTB).
  3. **Responsabilidade por Infrações**: Responsabilidade civil e penal do adquirente por quaisquer infrações de trânsito a partir da data e hora da entrega física do veículo.
- **Rationale**: Resguardo legal completo para a AF Motos e transparência para o comprador.

---

## 3. Matriz de Alternativas Avaliadas

| Aspecto | Alternativa Escolhida | Alternativa Rejeitada | Motivo da Rejeição |
|---|---|---|---|
| **Layout A4** | CSS `@media print` modular + `@react-pdf/renderer` | Biblioteca terceira pesada de Canvas/HTML2PDF | HTML2PDF rasteriza fontes e gera arquivos pesados/borrados em impressão física. |
| **Máscaras de Input** | Helpers de formatação customizados em TypeScript | `react-input-mask` descontinuado | Incompatibilidade com React 19 / Server Components e warnings no console. |
| **Endereço do Comprador** | Campos granulares (`buyer_street`, `buyer_number`, `buyer_cep`, etc.) | String única `buyer_address` concatenada | Dificulta emissão de contratos fiscais estruturados e pesquisas futuras. |
