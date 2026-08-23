# Plano Técnico de Implementação — Vendas e Recibos

## 1. Auditoria Concluída
Ver arquivo `research.md`.

## 2. Modelo de Banco de Dados
Ver arquivo `data-model.md`. A tabela `sales` já existe e requer uma migration para adição dos novos campos.

## 3. Estratégia de Dados
- **Consultar Vendas:** Utilizar Supabase SDK no Server Component, realizando JOIN em `motorcycles` e `motorcycle_images` para minimizar round-trips.
- **Relacionamento:** A FK `motorcycle_id` assegura 1:1, combinada com constraint UNIQUE no banco para evitar motos vendidas duas vezes.
- **Transação no Cadastro:** Ao salvar uma venda e atualizar o status da moto, uma Server Action agrupará a operação num RPC (ou duas chamadas consecutivas com tratamento de compensação, revertendo a venda se a atualização da moto falhar).

## 4. Rotas e Navegação

**Rotas criadas:**
- `/admin/(protected)/vendas/page.tsx` (Dashboard + Histórico de Vendas)
- `/admin/(protected)/vendas/nova/page.tsx` (Formulário de Cadastro)

**Navegação:**
- Inclusão do link **Vendas** em `components/admin/sidebar.tsx`, com ícone adequado (ex: FileText ou DollarSign).

## 5. Tela de Histórico (`vendas/page.tsx`)

- **View Desktop:** Tabela listando [Foto (da relação com images), Moto, Comprador, Valor, Forma de Pagamento, Data, Ações (Detalhes, Gerar PDF)].
- **View Mobile:** Lista de Cards. Cada card prioriza a foto principal, comprador e valor, adaptando os botões para touch-targets maiores.
- **Filtros e Buscas:** Componente `sale-filters.tsx` contendo campo de texto para comprador/moto, dropdown de mês/ano e método de pagamento.

## 6. Indicadores (Cards Superiores)

Queries em `lib/queries/sales.ts` fornecerão:
- Total vendido na história e no mês atual (soma de `sale_price` no mês corrente).
- Quantidade de vendas no mês e totais.
Valores sempre renderizados com `Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })`.

## 7. Cadastro de Venda (`vendas/nova/page.tsx`)

Formulário gerenciado via **React Hook Form + Zod**:
- Seleção de Moto via Combobox/Select (Listando apenas motos `AVAILABLE` e `RESERVED`).
- Campos auto-populados ao escolher a moto: Marca, Modelo, Preço.
- Dados do Comprador: Nome, Telefone e Notas (Demais campos LGPD ocultos por padrão).
- Financeiro: Input monetário mascarado, data (default para hoje), método de pagamento (PIX, Dinheiro, Transferência, Cartão, Outro).

## 8. Hook Interceptador na Edição da Moto

Em `components/admin/motorcycle-form.tsx`:
- Ao submeter e o `status` for igual a `SOLD` e a moto era diferente de `SOLD`:
  - `e.preventDefault()` / interceptar fluxo.
  - Abrir um Modal de Dialog (`SaleConfirmationModal`).
  - Botões:
    - **Registrar Venda**: Navega para `/admin/vendas/nova?motorcycle_id=[id]`.
    - **Agora não**: Continua a mutação apenas de alteração do status.
    - **Cancelar**: Fecha o modal.

## 9. Migration: Expansão da Tabela Sales

A migration será em `supabase/migrations/[timestamp]_enhance_sales.sql`:
```sql
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'PENDING';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS amount_paid numeric(12, 2) DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS receipt_notes text;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS receipt_number text UNIQUE;
-- NENHUMA constraint extra será aplicada nas colunas sensíveis ausentes.
```

## 10. RLS e Segurança

- Revisar as roles para garantir que queries públicas (site) filtram fora `SOLD` ou simplesmente ignoram dados vinculados da tabela `sales`.
- Tabela `sales` blindada com policies baseadas na função `is_admin()`. Nenhum endpoint de cliente (navegador público sem auth) poderá bater na tabela.

## 11. Geração de PDF do Recibo

- **Biblioteca Escolhida**: `@react-pdf/renderer` (Roda no Node/Edge).
- **Rota**: `app/api/admin/sales/[id]/receipt/route.ts` (GET).
- Verifica sessão do Admin.
- Consulta banco para buscar todos os dados da venda + `site_settings`.
- Retorna um Buffer com os Headers (`Content-Type: application/pdf` e `Content-Disposition: attachment; filename="recibo-afmotos-[id].pdf"`).

## 12. Identidade Visual e Layout do PDF

- A logo virá da URL do storage salva em `site_settings.settings.logoUrl`. Se null, desenha o nome da loja como texto em tipografia serifada/dourada/grafite.
- Estrutura clara e limpa: View cabeçalho (logo, loja), linha horizontal, View Veículo (tabela), View Comprador (tabela), View Valores, Campo de Assinatura, Rodapé (paginação).
- Fonte padrão de segurança: Roboto ou Helvetica via `react-pdf`.

## 13. Sequencial de Numeração do Recibo

- Para evitar bloqueios pesados (transactions longas), a numeração `AFM-2026-0001` será gerada no momento de `insert` na tabela.
- Na migration será adicionada uma sequence (se a operação suportar transações puras PLPGSQL, senão um fallback para um timestamp + hexa aleatório no TypeScript ou UUID curto para MVP, com forte preferência pela Sequence Postgres caso possível).

## 14. Integração do WhatsApp (CRM Opcional)

- No Card ou na Linha da Venda, se o comprador tiver telefone:
- Renderiza tag `<a href="https://wa.me/55[NUMERO_LIMPO]?text=Olá...">` abrindo em `_blank`. Sem dados de valores na URL.

## 15. Estados da UI e Acessibilidade

- Carregamento através de `loading.tsx` e `Suspense`.
- Utilização de `Skeleton` no carregamento das vendas.
- Mensagens de brinde (Toasts) padronizadas em português (usando `sonner` se instalado).

## 16. Ordem de Execução Recomendada (Próxima Fase)

1. Geração e aplicação da Migration no Supabase local/remoto.
2. Atualização dos Types do TypeScript (Database Definitions).
3. Implementação de `lib/queries/sales.ts` e `lib/actions/sales.ts`.
4. UI da Tabela e Histórico.
5. Formulário de Nova Venda.
6. Interceptação da Modal na Moto.
7. Instalação e construção da API de Geração de PDF `@react-pdf/renderer`.
8. Layout responsivo e refinamento de Acessibilidade.

**Conclusão**: Todos os 26 requisitos foram diagnosticados e devidamente processados e desenhados. O plano técnico assegura implementação completa.
