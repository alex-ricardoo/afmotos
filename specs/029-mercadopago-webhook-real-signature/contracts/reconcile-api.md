# API Contract: Payment Reconciliation API

**Endpoint**: `POST /api/mp/transactions/[transactionId]/reconcile`  
**Authentication**: Sessão de Usuário Autenticado (Supabase Auth Cookie / Bearer)  
**Authorization**: Dono da transação (`transaction.user_id === user.id`) ou Administrador (`admin_profiles`)  

---

## 1. Descrição

Permite ao cliente (ou operador administrativo) forçar ativamente a reconciliação autoritativa do status de uma transação pendente junto à API do Mercado Pago. Caso o pagamento tenha sido aprovado no provedor mas o webhook tenha sofrido atraso ou falha de entrega, o endpoint aplica a mesma rotina transacional de confirmação e desbloqueio do laudo veicular, eliminando o bloqueio visual na tela de retorno.

---

## 2. Request

### Path Parameters
- `transactionId` (UUID): Identificador interno da transação em `payment_transactions`.

### Headers
```http
Content-Type: application/json
```

### Request Body
Vazio (`{}` ou sem corpo).

---

## 3. Fluxo de Reconciliação no Servidor

1. **Autenticação e Autorização**:
   - Obter usuário autenticado via Supabase Server Client.
   - Validar titularidade da transação (`user_id`).
   - Se não for proprietário nem administrador: responder HTTP 404 (para não vazar existência) ou HTTP 403.
2. **Busca da Transação**:
   - Carregar dados de `payment_transactions`.
   - Se status já for terminal (`approved` com laudo concluído): responder imediatamente sem chamada externa redundante.
3. **Localização do Pagamento no Mercado Pago**:
   - Se `mp_payment_id` já estiver gravado na transação: consultar diretamente via `Payment.get({ id: mp_payment_id })`.
   - Se `mp_payment_id` for nulo: executar busca autoritativa server-side no Mercado Pago via `Payment.search({ options: { external_reference: transactionId } })`.
4. **Validações de Consistência**:
   - Validar se `payment.external_reference === transactionId`.
   - Validar se valor e moeda coincidem com o registro do banco.
5. **Transição de Estado e Liberação de Laudo**:
   - Se status for `approved`:
     - Atualizar `payment_transactions` (`status = 'approved'`, `mp_payment_id`).
     - Acionar `releaseVerifiedPaidConsultation(transactionId)`.
     - Registrar em `consultation_audit_logs`.
   - Se status for `pending` / `in_process`:
     - Atualizar detalhes sem liberar o laudo.
6. **Controle de Taxa**:
   - Limitar chamadas consecutivas para a mesma transação (máximo 1 execução ativa a cada 3 segundos por cliente).

---

## 4. Responses

### Success - Reconciled & Approved (HTTP 200 OK)
```json
{
  "success": true,
  "transactionId": "54b419a6-053e-48fc-8afc-9aa3eaed39ad",
  "status": "approved",
  "statusDetail": "accredited",
  "reportUnlocked": true,
  "reportUrl": "/cliente/consultas/259d3e00-d00d-45ce-bcf2-935493b8eae8",
  "message": "Pagamento confirmado com sucesso. Seu laudo foi liberado!"
}
```

### Success - Still Pending (HTTP 200 OK)
```json
{
  "success": true,
  "transactionId": "54b419a6-053e-48fc-8afc-9aa3eaed39ad",
  "status": "pending",
  "statusDetail": "waiting_transfer",
  "reportUnlocked": false,
  "message": "Pagamento ainda não identificado no Mercado Pago. Aguarde alguns instantes."
}
```

### Unauthorized (HTTP 401 Unauthorized)
```json
{
  "error": "Autenticação obrigatória."
}
```

### Forbidden / Not Found (HTTP 404 Not Found)
```json
{
  "error": "Transação não encontrada."
}
```

### Rate Limited (HTTP 429 Too Many Requests)
```json
{
  "error": "Muitas verificações consecutivas. Aguarde alguns segundos antes de tentar novamente."
}
```
