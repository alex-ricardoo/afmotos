# Registro de Riscos Técnicos e de Segurança: Auditoria E2E

**Feature**: Auditoria E2E de Caixa-Preta e Base de Testes Reproduzíveis  
**Data**: 2026-09-18  
**Status**: Ativo e Monitorado  
**Referência**: [plan.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/040-e2e-black-box-playwright-audit/plan.md) | [data-model.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/040-e2e-black-box-playwright-audit/data-model.md)

---

## Tabela de Riscos Catalogados

| ID | Descrição do Risco | Probabilidade | Impacto | Módulo | Estratégia de Mitigação | Responsável | Status |
| :---: | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| **RISK-01** | Execução de testes de mutação destrutiva apontados acidentalmente para o domínio de produção (`afmotos.vercel.app`). | Baixa | Crítico | Infra / E2E | Guardrail fatal em tempo de configuração que aborta a execução do runner caso detecte produção. | Engenheiro QA | Mitigado |
| **RISK-02** | Consumo acidental de saldo financeiro real de consultas na API Brasil durante testes automatizados. | Média | Alto | Veicular | Exigência mandatória da flag `VEHICLE_LOOKUP_MODE=mock` nos ambientes de teste e preview. | Engenheiro Backend | Mitigado |
| **RISK-03** | Disparo de transações financeiras reais no Mercado Pago durante testes de checkout. | Baixa | Crítico | Pagamentos | Bloqueio de testes de checkout em ambiente de produção; exigência de credenciais Sandbox. | Auditor E2E | Mitigado |
| **RISK-04** | Poluição do estoque e catálogo público com motos ou clientes de teste. | Média | Médio | Admin / Estoque | Prefixo obrigatório `E2E_` em todas as entidades e flag `E2E_RUN_ADMIN_MUTATION_TESTS=false` por padrão. | Engenheiro QA | Mitigado |
| **RISK-05** | Vazamento acidental de chaves secretas (`SUPABASE_SERVICE_ROLE_KEY` ou tokens de pagamento) no relatório de testes ou no DOM. | Baixa | Crítico | Segurança | Asserções de teste automatizadas (`assertNoSensitiveDataExposed`) e exclusão de `.env.e2e` do Git. | Auditor E2E | Mitigado |
| **RISK-06** | Flakiness em testes de interface devido a transições assíncronas de Server Components no Next.js. | Média | Baixo | Runner E2E | Uso de Page Objects desacoplados com esperas explícitas (`waitForLoadState`) e retries controlados. | Engenheiro QA | Monitorado |
