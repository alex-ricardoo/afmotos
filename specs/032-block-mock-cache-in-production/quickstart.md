# Quickstart: Validação e Testes do Bloqueio de Cache Mock

---

## 1. Verificação Rápida de Variáveis de Ambiente

No arquivo `.env.local` ou no painel da Vercel (Production):
```env
# Modo Obrigatório para Produção
VEHICLE_LOOKUP_MODE=live

# Token da API Brasil (Server-Only, nunca expor com NEXT_PUBLIC_)
APIBRASIL_TOKEN=<seu_token_real_da_apibrasil>

# Base URL (opcional, padrão configurado)
APIBRASIL_BASE_URL=https://gateway.apibrasil.io/api/v2/consulta/veiculos/credits
```

---

## 2. Execução dos Testes Automatizados

Executar a suíte de testes de entrega e elegibilidade de cache:
```bash
# Executa todos os testes unitários do Node.js
npm test

# Executa especificamente a nova suíte de bloqueio de mock
npm test -- lib/vehicle-delivery/__tests__/mock-cache-blocking.test.ts

# Validação estrita de tipagem TypeScript
npm run typecheck

# Validação de formatação e lint
npm run lint
```

---

## 3. Reprocessamento Seguro da Transação Afetada

Para reprocessar a consulta que recebeu mock em produção:
```bash
# Executar o script de reprocessamento passando o transactionId
npx tsx scripts/reprocess-mocked-paid-consultation.ts edaf3e59-fb2e-48ee-aa0d-c652bfedd886
```

O script:
1. Valida o pagamento no Mercado Pago.
2. Invalida o snapshot de mock anterior.
3. Dispara a chamada live à API Brasil.
4. Conclui com laudo oficial autêntico ou estorna caso a API falhe definitivamente.
