# Descomissionamento de Variáveis de Ambiente — Mercado Pago

**Data**: 2026-09-12  
**Status**: Documentação de Inativação e Recomendações de Segurança

---

## 1. Variáveis de Ambiente Tornadas Inativas

Com a remoção do módulo Mercado Pago do código da aplicação, as seguintes variáveis de ambiente deixam de ser lidas ou referenciadas pelo runtime:

| Variável | Escopo Anterior | Status Atual | Ação Imediata Recomendada |
|---|---|---|---|
| `NEXT_PUBLIC_MERCADO_PAGO_PUBLIC_KEY` | Cliente (Browser) | **Inativa** | Não é mais carregada ou exposta no frontend. |
| `MERCADO_PAGO_ACCESS_TOKEN` | Servidor (Secrets) | **Inativa** | **Rotacionar imediatamente** no painel do Mercado Pago. |
| `MERCADO_PAGO_WEBHOOK_SECRET` | Servidor (Secrets) | **Inativa** | **Rotacionar imediatamente** no painel do Mercado Pago. |
| `MERCADO_PAGO_PROVIDER_ADAPTER` | Servidor | **Inativa** | Nenhuma ação requerida. |
| `ENABLE_DEV_PAYMENT_SIMULATION` | Servidor / Cliente | **Inativa** | Nenhuma ação requerida. |
| `ENABLE_MP_DIAGNOSTIC_TESTS` | Servidor | **Inativa** | Nenhuma ação requerida. |
| `MERCADO_PAGO_WEBHOOK_URL` | Servidor | **Inativa** | Desativar webhook correspondente no painel MP. |
| `INTERNAL_OPS_TOKEN` | Servidor | **Inativa** (se criada para diagnósticos) | Pode ser revogada se não utilizada por outros crons. |

---

## 2. Recomendações Críticas de Segurança

### 2.1 Rotação Obrigatória de Credenciais no Mercado Pago
As credenciais `MERCADO_PAGO_ACCESS_TOKEN` e `MERCADO_PAGO_WEBHOOK_SECRET` foram manipuladas e utilizadas em ambientes de teste/desenvolvimento e diagnósticos.  
**Recomendação prioritária:**
1. Acessar o portal de desenvolvedores do Mercado Pago (https://www.mercadopago.com.br/developers).
2. Gerar novo par de credenciais (Public Key e Access Token) para Produção e Testes.
3. Revogar o Access Token antigo.
4. Remover ou desativar o endpoint de webhook cadastrado no painel do Mercado Pago que apontava para o domínio da AF Motos.

### 2.2 Política de Remoção no Vercel
- **Não remover as variáveis do Vercel antecipadamente.**
- Procedimento seguro:
  1. Realizar o deploy da branch de rollback em ambiente de homologação/preview para validação.
  2. Efetuar o deploy em produção sem o código Mercado Pago.
  3. Somente após a confirmação de que a versão em produção está estável e sem chamadas Mercado Pago, remover as variáveis no painel da Vercel (`Project Settings` > `Environment Variables`).
