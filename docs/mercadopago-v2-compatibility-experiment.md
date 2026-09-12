# Documento Técnico: Experimento de Compatibilidade Mercado Pago SDK v2 vs v3

**Feature**: `027-mercadopago-payment-route-handler-compatibility`  
**Date**: 2026-09-12  
**Status**: Active  

---

## 1. Contexto e Hipótese

O projeto AF Motos tem enfrentado sistematicamente o erro `MPServerError: HTTP 500 internal_error` da API do Mercado Pago ao criar pagamentos com cartão tokenizado via SDK `mercadopago@^3.6.1`.

Em contraste, o projeto `alex-ricardoo/mouras-pizzas` utilizava a versão `mercadopago@^2.12.0` com endpoint HTTP dedicado (`app/api/mp/process-payment/route.ts`) e processava transações de teste com sucesso.

### Hipótese Técnica Principal
A reescrita do cliente HTTP na versão `3.x` do SDK oficial Node do Mercado Pago alterou a serialização dos cabeçalhos (`X-Product-Id`, `User-Agent`, `X-Idempotency-Key`) ou o formato interno de transporte em chamadas `Payment.create()`, gerando falha interna de processamento no gateway do Mercado Pago Sandbox.

Para testar essa hipótese de forma científica, sem tentativa e erro e sem quebrar a base de código existente, estabelecemos este **Experimento de Compatibilidade**.

---

## 2. Desenho do Experimento

### 2.1 Aliasing Seguro de Dependências
Para comparar as duas versões sem downgrade destrutivo ou perda de tipagem, o projeto utiliza o mecanismo de alias do npm:

```json
{
  "dependencies": {
    "mercadopago": "^3.6.1",
    "mercadopago-v2": "npm:mercadopago@2.12.0"
  }
}
```

Dessa forma:
- O adapter `v3` consome `mercadopago` (`^3.6.1`).
- O adapter `v2` consome `mercadopago-v2` (`2.12.0`).
- Ambos os adaptadores implementam rigorosamente a mesma interface TypeScript: `MercadoPagoPaymentProvider`.

### 2.2 Controle de Chaveamento Server-Side
O chaveamento entre os adaptadores é estritamente controlado pela variável de ambiente:

```env
MERCADO_PAGO_PROVIDER_ADAPTER=v2 # ou v3
```

- **Default Seguro**: Se a variável estiver ausente ou inválida, o sistema utiliza o adapter padrão `v3`.
- **Isolamento Total**: O cliente frontend, o formulário do Brick e os parâmetros de URL não têm permissão ou capacidade de escolher o adapter.

---

## 3. Matriz de Diferenças de Transporte: v2 vs v3

| Aspecto | SDK v2 (`2.12.0`) | SDK v3 (`3.6.1`) |
|---|---|---|
| **Cliente HTTP Base** | Baseado no motor clássico `mercadopago/lib/mercadoPago` | Reescrito em TypeScript com `RestClient` moderno |
| **Cabeçalho de Idempotência** | Injetado diretamente via `requestOptions.idempotencyKey` | Injetado via `requestOptions.idempotencyKey` mapeado no `RestClient` |
| **Headers de Telemetria** | Padrão legado do Mercado Pago | Injeta `X-Product-Id: bc32b6ntrpp001u8nhkg` e `X-Tracking-Id` |
| **Formato de Exceções** | Lança `MPError` clássico | Lança `MPServerError` ou `MPResponseError` |
| **Payload do Body** | Recebe objeto JavaScript limpo | Recebe objeto JavaScript limpo |

---

## 4. Regras de Segurança e Blindagem do Experimento

1. **Sem Bypass ou Aprovações Simuladas**:
   - Sob nenhuma hipótese o sistema criará pagamentos aprovados falsos, IDs fictícios ou mocks em produção ou preview.
2. **Ambiente Controlado**:
   - Testes síncronos de criação com cartão devem ocorrer exclusivamente em ambiente local (`development`) com credenciais `TEST-...`.
3. **Tratamento de 500 Preservado**:
   - Caso qualquer adapter devolva HTTP 500, o sistema deve registrar `provider_error` ou `pending_reconciliation`, nunca liberar o laudo e nunca chamar a API Brasil.
4. **Proteção Contra Reutilização de Token**:
   - Cada tentativa com o adapter v2 ou v3 exige um token recém-gerado pelo Payment Brick.

---

## 5. Próximos Passos de Avaliação

1. Executar o fluxo com `MERCADO_PAGO_PROVIDER_ADAPTER=v2` utilizando o cartão de teste `5480 8328 0103 3311`.
2. Registrar o snapshot sanitizado da requisição.
3. Se o adapter `v2` retornar `200 approved` com ID real:
   - Fica comprovada a regressão/incompatibilidade do SDK `3.6.1` com o gateway sandbox do Mercado Pago.
   - O adapter `v2` torna-se a implementação estável oficial do AF Motos.
4. Se o adapter `v2` também retornar HTTP 500:
   - A causa raiz está confirmada fora da versão do SDK Node (ex.: restrição na conta Sandbox, bandeira do cartão de teste ou parâmetro específico do gateway antifraude).
