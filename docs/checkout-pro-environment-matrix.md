# Matriz de Ambientes: Mercado Pago Checkout Pro

**Projeto**: AF Motos  
**Data**: 2026-09-12  

---

## 1. Variáveis de Ambiente por Estágio

| Variável | Descrição | Local Development | Vercel Preview | Vercel Production |
|---|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | URL base da aplicação | `http://localhost:3000` | `https://<preview-branch>.vercel.app` | `https://afmotos.com.br` |
| `MERCADO_PAGO_ACCESS_TOKEN` | Token de API privado do MP | `TEST-...` | `TEST-...` | `APP_USR-...` |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Chave secreta para validação HMAC | Gerada no painel MP (Modo Teste) | Gerada no painel MP (Modo Teste) | Gerada no painel MP (Modo Produção) |
| `MERCADO_PAGO_CHECKOUT_MODE` | Indicador de ambiente de checkout | `test` | `test` | `production` |
| `MERCADO_PAGO_WEBHOOK_URL` | URL pública de notificação | `https://<tunnel>.ngrok.io/api/webhooks/mercadopago` | `https://<preview-domain>/api/webhooks/mercadopago` | `https://afmotos.com.br/api/webhooks/mercadopago` |

---

## 2. Diferenças Operacionais entre Ambientes

### Ambiente de Desenvolvimento Local (Localhost)
- **Túnel de Notificação**: Como o Mercado Pago não consegue enviar webhooks para `http://localhost`, é obrigatório o uso de um túnel HTTPS público (ngrok, cloudflared ou localtunnel) apontando para a porta 3000 local.
- **Modo Sandbox**: Utiliza credenciais `TEST-...`. As preferências geradas redirecionam o navegador para a URL `sandbox_init_point` do Mercado Pago.
- **Cartões de Teste**: Utilizar os números de cartão de teste e usuários de teste disponibilizados na documentação oficial do Mercado Pago.

### Ambiente Vercel Preview (Staging / PRs)
- **Modo Sandbox**: Mantém credenciais `TEST-...` e `sandbox_init_point`.
- **Webhooks em Preview**: Caso o domínio efêmero do Preview seja utilizado para testes de webhook, a URL deve ser registrada temporariamente no painel do Mercado Pago.
- **Segurança**: Variáveis de produção NUNCA devem ser configuradas no escopo de Preview do Vercel.

### Ambiente Vercel Produção
- **Credenciais de Produção**: `APP_USR-...` homologadas para a conta jurídica vendedora da AF Motos.
- **Redirecionamento Oficial**: As preferências utilizam `init_point` padrão do Mercado Pago.
- **Webhooks Oficiais**: Apontam permanentemente para `https://afmotos.com.br/api/webhooks/mercadopago`.

---

## 3. Variáveis e Chaves Descontinuadas (Não Mais Utilizadas)

As seguintes variáveis configuradas no passado para a integração do Checkout Bricks estão **inativas** e não devem ser consumidas pelo código do Checkout Pro:

- `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` (Chave pública do frontend - não necessária no Checkout Pro)
- `MERCADO_PAGO_PROVIDER_ADAPTER` (Antigo alternador de SDK)
- `ENABLE_DEV_PAYMENT_SIMULATION` (Simulador de aprovação sem gateway)
- `ENABLE_MP_DIAGNOSTIC_TESTS` (Rotas de teste direto de tokenização)
