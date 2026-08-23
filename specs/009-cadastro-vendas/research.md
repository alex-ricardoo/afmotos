# Research & Auditoria — Gestão de Vendas e Recibos

## Diagnóstico Inicial (Por Arquivo/Área)

| Área | Arquivo / Tabela | Estado atual | Problema | Ação planejada |
|---|---|---|---|---|
| **Motos (UI)** | `app/admin/(protected)/motos/page.tsx`, `motorcycle-form.tsx` | Permite alterar status para `SOLD` diretamente no rádio/select. | Alterar o status para `SOLD` não pergunta se o admin quer registrar os dados da venda. | Adicionar Modal Interceptador ao selecionar `SOLD`. O modal perguntará: "Registrar venda", "Agora não", "Cancelar". |
| **Dashboard (UI)** | `lib/queries/dashboard.ts`, `admin-motorcycle-stock.tsx` | Conta as motos `SOLD` apenas usando `.eq('status', 'SOLD')`. | A contagem ignora a tabela de vendas e os valores financeiros faturados no mês. | Consultar `sales` para mostrar "Valor total vendido" e "Última venda". |
| **Config. (DB)** | `public.site_settings` (Tabela), `settings.ts` | Armazena dados da loja (logo, endereço). | Dados precisam ser puxados dinamicamente ao gerar o PDF. | Criar query em `lib/queries/settings.ts` se não houver uma otimizada para o PDF. |
| **Vendas (DB)** | `public.sales` (Tabela) | Existe com campos: `id, motorcycle_id, sale_price, sale_date, buyer_name, buyer_phone, notes`. | Falta rastrear o método de pagamento, status de pagamento, valor pago, e informações adicionais. | Criar migration estendendo a tabela com `payment_method, payment_status, amount_paid, receipt_number`. |
| **PDF** | N/A | Não há funcionalidade de PDF instalada no projeto. | Geração client-side pode expor lógica; geração server-side consome CPU. | Utilizar `@react-pdf/renderer` para renderizar via Route Handler ou Client side. |
| **Sidebar** | `components/admin/sidebar.tsx` (ou similar) | Não possui link para Vendas. | Funcionalidade isolada. | Adicionar link `/admin/vendas` abaixo ou próximo a Motos. |

## Avaliação das Regras de Segurança (RLS)

1. **Vendas**: Apenas `is_admin()` pode selecionar, inserir e atualizar a tabela `sales`.
2. **Settings**: Público pode ler, mas apenas `is_admin()` pode alterar. Ideal para o recibo.
3. **Motos**: Já acessíveis ao público (apenas disponíveis) e admin (todas).

## Estratégia de Migração (Sem perda de dados)
Nenhuma venda antiga (se existir) será apagada. A nova migration usará `ADD COLUMN IF NOT EXISTS` e definirá o status do pagamento como `PENDING` por padrão, garantindo retrocompatibilidade.
