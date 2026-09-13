# Modelo de Segurança: Mercado Pago Checkout Pro

**Projeto**: AF Motos  
**Data**: 2026-09-12  
**Classificação**: Documento Técnico de Arquitetura de Segurança  

---

## 1. Princípios Fundamentais de Segurança

A integração do Checkout Pro na AF Motos é regida pelos seguintes princípios inegociáveis:

1. **Zero Confiança no Navegador (Zero Trust Client)**:
   - Nenhum preço, moeda, e-mail de pagador, ID de transação ou status vindo do cliente é aceito como verdade.
   - O navegador apenas envia o identificador da consulta veicular (`consultationId`).
   - O backend deriva o preço oficial (`site_settings`), o proprietário da consulta e gera a chave de idempotência.

2. **Isolamento Total de Credenciais e Segredos**:
   - `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_WEBHOOK_SECRET` são variáveis de ambiente estritamente privadas do servidor.
   - Nenhuma variável privada pode possuir o prefixo `NEXT_PUBLIC_`.
   - Nenhuma resposta de API, payload ou log pode conter credenciais.

3. **Zero Manuseio de Dados de Cartão (PCI DSS Scope Reduction)**:
   - A AF Motos não possui campos de cartão de crédito/débito em seu HTML.
   - O cliente insere seus dados bancários exclusivamente no domínio protegido do Mercado Pago (`mercadopago.com.br`).
   - Nenhum número de cartão (PAN), data de validade, CVV ou token de cartão trafega na infraestrutura da AF Motos.

---

## 2. Validação Criptográfica de Webhooks

Toda requisição enviada pelo Mercado Pago para `/api/webhooks/mercadopago` é submetida a verificação antes de qualquer processamento:

```text
               Header x-signature: ts=..., v1=...
               Header x-request-id: ...
               Resource ID: data.id
                        │
                        ▼
      Template: id:{data.id};request-id:{x-request-id};ts:{ts};
                        │
                        ▼
            HMAC-SHA256(manifest, SECRET)
                        │
                        ▼
          crypto.timingSafeEqual(hash, v1)
                 ├─── Inválido ───► HTTP 401 (Log de auditoria como suspeito)
                 └─── Válido   ───► Busca pagamento oficial via API do MP
```

### Proteção Contra Timing Attacks:
A comparação da assinatura computada com a assinatura recebida utiliza `crypto.timingSafeEqual`, impedindo ataques de temporização baseados em tempo de resposta por caractere.

---

## 3. Prevenção de Confirmação Fraudulenta via URL de Retorno

O Mercado Pago redireciona o cliente para a URL configurada em `back_urls` ao final do pagamento, podendo enviar parâmetros como `collection_status=approved`.

**Ameaça Mitigada**: Um invasor poderia forjar uma chamada GET direta para `/cliente/pagamento/retorno/[transactionId]?collection_status=approved` tentando liberar um laudo veicular sem ter pago.

**Contramedida Aplicada**:
- A rota `/cliente/pagamento/retorno/[transactionId]` ignora sumariamente qualquer query parameter para tomada de decisão.
- A página consulta o banco de dados Supabase via RLS.
- O status só transita para `approved` quando o webhook oficial validado receber o evento do Mercado Pago e confirmar via `Payment.get()`.

---

## 4. Prevenção de Duplicação e Ataques de Concorrência

1. **Idempotency Key**:
   - Toda criação de preferência gera uma chave de idempotência UUID única vinculada à transação.
   - O servidor reutiliza preferências válidas em aberto para evitar a criação de múltiplos registros em cliques repetidos do usuário.
2. **Locking Atômico na Liberação da Consulta**:
   - A função `releaseVerifiedPaidConsultation` executa uma atualização atômica no banco (`payment_status = 'paid' WHERE payment_status = 'unpaid'`).
   - Se duas requisições chegarem ao mesmo tempo (ex.: retorno do usuário + webhook simultâneo), apenas uma adquire o direito de invocar o fornecedor de laudos veiculares.

---

## 5. Política de Higienização de Logs (Observability Masking)

Para cumprir a LGPD e boas práticas de segurança, os logs estruturados aplicam as seguintes regras de mascaramento:

| Dado | Política no Log | Exemplo |
|---|---|---|
| E-mail do cliente | Mascarado | `c***@email.com` |
| CPF do cliente | Ocultado completamente | `[MASKED]` |
| ID da transação | Permitido | UUID completo |
| ID do pagamento MP | Truncado | `12345***90` |
| Tokens / Segredos | Estritamente Proibido | Nunca logado |
| Payload bruto MP | Somente campos allowlist | `status`, `status_detail`, `payment_method_id` |
