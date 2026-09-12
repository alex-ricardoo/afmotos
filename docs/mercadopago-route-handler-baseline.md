# Baseline do Repositório e Ambiente: Feature 027

**Feature**: `027-mercadopago-payment-route-handler-compatibility`  
**Date**: 2026-09-12  
**Status**: Baseline Verified  

---

## 1. Identificação e Commits de Referência

- **Repositório AF Motos**: `alex-ricardoo/afmotos`
  - **Working Branch**: `fix/mercadopago-payment-brick-500`
  - **Commit SHA AF Motos**: `eb080da82c4b92a056de8fe542e58d7620679f08`
- **Repositório de Referência Moura’s Pizzas**: `alex-ricardoo/mouras-pizzas`
  - **Branch**: `main`
  - **Commit SHA Moura’s Pizzas**: `15407381c974c4406dd0f54f5cafc3cae675ec6f`

---

## 2. Versões de Ambiente e Runtime

- **Node.js Local**: `v22.14.0`
- **npm Local**: `10.9.2`
- **Next.js AF Motos**: `16.3.2` (com React `19.2.8`)
- **Next.js Moura’s Pizzas**: `16.2.1` (com React `19.2.4`)
- **SDK Node Mercado Pago AF Motos**: `mercadopago ^3.6.1`
- **SDK Node Mercado Pago Moura’s Pizzas**: `mercadopago ^2.12.0`
- **SDK Frontend Mercado Pago Moura’s Pizzas**: `@mercadopago/sdk-react ^1.0.7`
- **Vercel Runtime Target**: Node.js 20.x / 22.x

---

## 3. Inventário de Variáveis de Ambiente (Somente Nomes)

As seguintes variáveis foram inventariadas no projeto, mantendo os valores sensíveis estritamente preservados:

| Variável | Escopo | Finalidade |
|---|---|---|
| `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` | Cliente & Servidor | Chave pública para inicialização do Brick (`TEST-...` ou `APP_USR-...`) |
| `MERCADO_PAGO_ACCESS_TOKEN` | Apenas Servidor | Token de acesso para chamadas à API do Mercado Pago (`TEST-...` ou `APP_USR-...`) |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Apenas Servidor | Segredo para validação de assinatura HMAC no webhook |
| `MERCADO_PAGO_WEBHOOK_URL` | Apenas Servidor | URL pública HTTPS para recebimento de webhooks |
| `NEXT_PUBLIC_APP_URL` | Cliente & Servidor | URL base da aplicação (fallback para webhook se necessário) |
| `MERCADO_PAGO_PROVIDER_ADAPTER` | Apenas Servidor | Seleção do adapter ativo (`v2` ou `v3`, padrão: `v3`) |
| `ENABLE_MP_DIAGNOSTIC_TESTS` | Apenas Servidor | Habilita rota de diagnóstico local (`false` por padrão) |
| `ENABLE_DEV_PAYMENT_SIMULATION` | Apenas Servidor | Flag de simulação de pagamento (confirmada como `false`) |
| `INTERNAL_OPS_TOKEN` | Apenas Servidor | Token de autorização para o endpoint interno de health check |

---

## 4. Confirmação de Regras de Segurança e Blindagem

- **Nenhum segredo commitado**: Nenhuma chave privada, token de acesso, segredo de webhook ou token de cartão está em arquivos de código ou histórico recente.
- **Simulação desabilitada**: `ENABLE_DEV_PAYMENT_SIMULATION=false` comprovado. Nenhum mock ou aprovação artificial opera em produção ou preview.
- **Isolamento de Erros**: O tratamento em caso de falha do provedor mantém `provider_error` e não libera a consulta veicular.
