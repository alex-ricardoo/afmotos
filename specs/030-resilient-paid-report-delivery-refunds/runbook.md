# Operational Runbook: Paid Report Delivery & Refunds

**Feature**: Entrega resiliente de laudo pós-pagamento, retry persistido, auditoria e estorno seguro  
**Feature Branch**: `030-resilient-paid-report-delivery-refunds`  
**Date**: 2026-09-13

---

## 1. Incidente: API Brasil sem Saldo (`APIBRASIL_INSUFFICIENT_CREDITS`)

### Sintomas
- Logs da Vercel indicando:  
  `[VEHICLE_DELIVERY] {"event": "vehicle_delivery.failed_permanent", "failureCode": "APIBRASIL_INSUFFICIENT_CREDITS"}`
- Alerta em auditoria: `support_attention_required` com detalhe: *"Ação necessária: recarregar saldo da API Brasil"*.
- Consultas de clientes caindo em `failed_permanent` e ordens de refund sendo abertas automaticamente.

### Procedimento de Resolução
1. Acesse o painel da API Brasil: [https://app.apibrasil.io](https://app.apibrasil.io).
2. Efetue a recarga de saldo via PIX para restabelecimento imediato dos créditos corporativos.
3. Após a confirmação do saldo no painel do fornecedor, novos pagamentos de clientes voltarão a ser atendidos normalmente.
4. Para as consultas que falharam durante o período de desabastecimento de saldo:
   - Se o estorno já tiver sido solicitado e processado no Mercado Pago, **não intervenha no banco**; o cliente já foi ressarcido e poderá comprar novamente quando desejar.
   - Se houver algum job marcado para `manual_review` que ainda não foi estornado, utilize a rota administrativa ou execute o script de reprocessamento manual.

---

## 2. Incidente: API Brasil Indisponível / Instabilidade de Rede

### Sintomas
- Logs indicando timeouts (>120s) ou erros HTTP 500/502/503/504.
- Jobs de entrega entrando no estado `retry_scheduled`.

### Procedimento de Resolução
1. Nenhuma ação imediata é necessária para incidentes pontuais: o sistema retentará automaticamente com backoff progressivo (1m, 5m, 15m, 30m).
2. Verifique o status da API Brasil nos canais oficiais do provedor.
3. Se a indisponibilidade persistir por mais de 1 hora, os jobs que atingirem a 5ª tentativa serão automaticamente convertidos em `failed_permanent` e o estorno será disparado sem causar prejuízo aos clientes.

---

## 3. Incidente: Token da API Brasil Inválido ou Ausente (`APIBRASIL_AUTH_ERROR`)

### Sintomas
- Logs indicando erro HTTP 401 ou 403 da API Brasil.
- Mensagem: *"Token da API Brasil expirado ou inválido"*.

### Procedimento de Resolução
1. Acesse o painel da API Brasil ([https://app.apibrasil.io](https://app.apibrasil.io)) e gere um novo token de autenticação.
2. Acesse as configurações de ambiente no painel da Vercel:
   - Projeto AF Motos ──► Settings ──► Environment Variables.
   - Atualize o valor da variável `APIBRASIL_TOKEN`.
3. Dispare um Redeploy no painel da Vercel para propagar o novo token para as Serverless Functions.

---

## 4. Incidente: Jobs Presos com Lock Expirado

### Sintomas
- Jobs de entrega permanecem no status `processing` por mais de 10 minutos sem avançar para `completed` nem para `retry_scheduled`.

### Procedimento de Resolução
1. A procedure PostgreSQL `claim_next_delivery_jobs` possui recuperação automática: qualquer job com status `processing` cujo `lock_expires_at` seja menor que `now()` é considerado abandonado e recuperado no próximo ciclo do cron.
2. Se necessário forçar a liberação manual via SQL administrativo:
   ```sql
   UPDATE public.consultation_delivery_jobs
   SET status = 'retry_scheduled', locked_at = NULL, locked_by = NULL, next_retry_at = now()
   WHERE status = 'processing' AND lock_expires_at < now();
   ```

---

## 5. Incidente: Estorno Pendente no Mercado Pago (`payment_refunds.status = 'pending'`)

### Sintomas
- A ordem de estorno foi enviada ao Mercado Pago, mas o status não atualizou para `confirmed` após 15 minutos.

### Procedimento de Resolução
1. O cron `/api/cron/reconcile-pending-refunds` roda periodicamente para consultar a API oficial do Mercado Pago e atualizar o status.
2. Para forçar uma verificação manual via rota interna:
   ```bash
   curl -X POST https://afmotos.vercel.app/api/cron/reconcile-pending-refunds \
     -H "Authorization: Bearer $CRON_SECRET"
   ```
3. Se o Mercado Pago retornar que o pagamento ainda está em processo de estorno bancário, aguarde o ciclo de compensação da instituição emissora.

---

## 6. Procedimento de Comunicação com o Cliente

Ao prestar suporte a um cliente via WhatsApp sobre problemas com o laudo:
1. **Nunca informe termos técnicos**, como "API Brasil", "token expirado", "erro 500" ou "falta de saldo".
2. **Mensagem padrão para instabilidade temporária**:
   > *"Olá! Identificamos uma breve oscilação na conexão com os registros oficiais de trânsito para a placa consultada. Nosso sistema já está tentando novamente de forma automática. Em breve seu laudo estará disponível na área Minhas Consultas."*
3. **Mensagem padrão para cancelamento com estorno**:
   > *"Olá! Devido a uma indisponibilidade temporária na base de dados dos órgãos emissores, não foi possível concluir a geração do laudo neste momento. Para sua total segurança, solicitamos o estorno integral do valor pago diretamente no Mercado Pago. O comprovante e a devolução já foram processados."*
