# Contract: Internal Mercado Pago Health API

**Route**: `GET /api/internal/mercadopago/health`  
**Feature**: `027-mercadopago-payment-route-handler-compatibility`  
**Date**: 2026-09-12  

---

## 1. Descrição do Endpoint

Endpoint administrativo e de monitoramento de infraestrutura que retorna o status operacional, credenciais ativas (em formato mascarado/fingerprint), versão do SDK em uso e configuração de webhook.

---

## 2. Autenticação & Autorização

- Exige sessão autenticada de usuário com perfil de administrador no Supabase, **OU**
- Cabeçalho de autorização interna `x-internal-ops-token` correspondente à variável `INTERNAL_OPS_TOKEN`.

---

## 3. Especificação do Request

```http
GET /api/internal/mercadopago/health
x-internal-ops-token: [INTERNAL_OPS_TOKEN]
```

---

## 4. Especificação da Resposta

### Sucesso (200 OK)
```json
{
  "sdk": {
    "activeAdapter": "v2",
    "activeVersion": "2.12.0",
    "supportedAdapters": ["v2", "v3"]
  },
  "environment": {
    "nodeEnv": "development",
    "vercelEnv": "local"
  },
  "credentials": {
    "mode": "test",
    "publicKeyPresent": true,
    "accessTokenPresent": true,
    "publicKeyFingerprint": "TEST-***-94c9",
    "accessTokenFingerprint": "TEST-***-8824"
  },
  "webhook": {
    "configured": true,
    "originAndPath": "https://afmotos.vercel.app/api/webhooks/mercadopago"
  },
  "paymentClientConstructed": true,
  "diagnosticsAllowed": false
}
```

### Não Autorizado (401 Unauthorized)
```json
{
  "error": "Acesso não autorizado ao health check interno."
}
```
