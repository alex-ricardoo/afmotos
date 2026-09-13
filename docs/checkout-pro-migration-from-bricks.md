# Guia de Migração: Transição de Checkout Bricks para Checkout Pro

**Projeto**: AF Motos  
**Data**: 2026-09-12  
**Autor**: Equipe de Engenharia AF Motos  
**Status**: Homologado  

---

## 1. Contexto Histórico e Justificativa

Durante as iterações anteriores na tentativa de implementar o pagamento direto de consultas veiculares na AF Motos, foi integrado o **Mercado Pago Checkout Bricks (Payment Brick)**. 

No entanto, a integração sofreu falhas sistemáticas de **`HTTP 500 internal_error`** emitidas diretamente pela API `Payment.create()` do Mercado Pago. Múltiplos cenários de teste isolados (Server Actions, Route Handlers, SDK v3.6.1, SDK v2.12.0, tokens novos gerados pelo frontend, idempotency keys e contas de teste homologadas) reproduziram o mesmo erro no provedor.

Diante do risco operacional e da experiência instável para os clientes, foi deliberada a **descontinuação completa do Checkout Bricks** e a adoção do **Mercado Pago Checkout Pro (Checkout Redirecionado)**.

---

## 2. Quadro Comparativo: Bricks vs Checkout Pro

| Aspecto | Checkout Bricks (Descontinuado) | Checkout Pro (Novo Padrão) |
|---|---|---|
| **Coleta de Dados** | Formulário de cartão renderizado dentro do site da AF Motos | Página segura hospedada diretamente no domínio do Mercado Pago |
| **Geração de Tokens** | Script JS do Mercado Pago roda no navegador do cliente | O cliente preenche seus dados diretamente no provedor |
| **Chamada `Payment.create`** | Feita pelo backend da AF Motos com token de cartão | Não existe no fluxo do cliente; o MP gerencia o pagamento internamente |
| **Superfície de Ataque PCI** | Requer cuidados com vazamento de cartão e scripts de terceiros | Nula: nenhum dado de cartão ou token trafega pelos servidores AF Motos |
| **Métodos de Pagamento** | Exigia suporte individual e renderização de layouts para Pix/Cartão | Suporte nativo a Pix, Cartão de Crédito/Débito, Boleto e Saldo Mercado Pago |
| **Sensibilidade a Erros 500 do Provedor** | Alta: qualquer rejeição de tokenização quebrava a compra do usuário | Mínima: o Mercado Pago lida internamente com retry e bandeiras |
| **Resiliência via Webhook** | Secundária (esperava retorno síncrono do `Payment.create`) | Primária: webhook é a fonte oficial da liquidação financeira |

---

## 3. Elementos Removidos Definitivamente do Código Ativo

Os seguintes componentes e lógicas foram ou devem ser expurgados do fluxo principal:
1. `Payment Brick` e scripts `<script src="https://sdk.mercadopago.com/js/v2">`.
2. Chamadas de `Payment.create()` disparadas por ações do cliente.
3. Cache local de tokens de cartão (`lib/mercadopago/token-cache.ts`).
4. Painéis ou endpoints de diagnóstico de tokenização de cartão (`/api/mp/diagnostics`, `/cliente/pagamento/diagnostico`).
5. Adapters experimentais de alternância de versão do SDK (`MERCADO_PAGO_PROVIDER_ADAPTER`).
6. Banners ou simulações falsas de aprovação local sem validação do provedor.

---

## 4. Novos Componentes Introduzidos no Checkout Pro

```text
app/
├── api/
│   ├── mp/
│   │   ├── checkout-pro/
│   │   │   └── preferences/
│   │   │       └── route.ts         # Criação segura de preferências (POST)
│   │   └── transactions/
│   │       └── [transactionId]/
│   │           └── status/
│   │               └── route.ts     # Status seguro e higienizado para o cliente (GET)
│   └── webhooks/
│       └── mercadopago/
│           └── route.ts             # Receptor oficial de webhook com HMAC
├── cliente/
│   └── pagamento/
│       ├── [consultationId]/
│       │   └── page.tsx             # Botão "Pagar com Mercado Pago" (server-driven)
│       └── retorno/
│           └── [transactionId]/
│               └── page.tsx         # Página de retorno do Checkout Pro com polling
lib/
└── mercadopago/
    ├── client.ts                    # Instanciação singleton e segura do SDK MP
    ├── preference-builder.ts        # Construtor do payload oficial da Preferência
    ├── webhook-service.ts           # Validação HMAC e reconciliação de pagamentos
    ├── payment-status-mapper.ts     # Mapeamento estrito de estados do MP
    └── security.ts                  # Higienização de dados e verificação de URLs
```

---

## 5. Estratégia de Rollback

Caso surja qualquer necessidade de contingência:
1. O fluxo de Checkout Pro é controlado via variáveis de ambiente e rotas dedicadas.
2. A remoção de Bricks não apagou tabelas do Supabase (`payment_transactions` e `consultation_audit_logs` foram preservadas), garantindo que todo o histórico contábil anterior continue auditável.
3. Caso a rota de pagamento precise ser temporariamente pausada para manutenção, a página `app/cliente/pagamento/[consultationId]/page.tsx` já dispõe de fallback visual amigável com suporte direto ao WhatsApp.
