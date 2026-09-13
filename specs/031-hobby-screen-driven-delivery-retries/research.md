# Research & Architecture Decisions: Hobby Screen-Driven Delivery Retries

## 1. Limitações da Vercel Hobby para Cron Jobs

A Vercel documenta que no plano Hobby:
- Cron jobs são limitados a no máximo **1 execução por dia**.
- Expressões como `* * * * *` (1 min) ou `*/5 * * * *` (5 min) resultam em erro no deploy: `Error: Cron schedule ... is not supported on the Hobby plan`.
- Upgrade para Vercel Pro não é uma opção autorizada neste momento.

## 2. Alternativas Avaliadas

| Abordagem | Viabilidade | Vantagens | Desvantagens | Decisão |
|---|---|---|---|---|
| Fila em memória / `setTimeout` no servidor | Nula | Fácil de codificar | Processos serverless congelam após resposta HTTP; jobs são perdidos em cold starts | **Rejeitada** |
| Worker externo (ex: QStash / Trigger.dev) | Média | Execução independente | Requer nova conta, credenciais, dependência externa e configuração extra | **Postergada para futuro** |
| Screen-Driven Delivery (Frontend + DB Locks) | **Alta** | Utiliza infraestrutura existente (Supabase + Next.js), zero custos adicionais, atômico, resiliente a reload | Retries ocorrem enquanto cliente mantiver tela aberta ou ao reabrir a consulta | **Aprovada (Arquitetura Oficial)** |

## 3. Garantias de Idempotência e Concorrência

1. **Lock no Supabase**:
   O endpoint `POST /api/cliente/consultas/[consultationId]/process-delivery` executa claim atômico via procedure `claim_next_delivery_jobs` ou atualização condicional com `locked_at` e lease de 5 minutos.
2. **Duas abas abertas pelo mesmo usuário**:
   A primeira obtém o lock e processa. A segunda recebe status `processing` ou `retry_not_due` e não efetua nenhuma requisição externa duplicada para a API Brasil.
3. **Cache-First**:
   Mesmo se o cliente recarregar a tela após o provedor ter gerado o laudo, o banco intercepta na primeira linha via cache e encerra com `status: completed`.
4. **Proteção de Estorno**:
   Nunca executa novo estorno se `status` for `requested`, `pending` ou `confirmed`.
