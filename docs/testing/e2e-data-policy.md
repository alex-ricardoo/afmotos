# Política de Governança e Isolamento de Dados de Teste: AF Motos E2E

**Feature**: Auditoria E2E de Caixa-Preta e Base de Testes Reproduzíveis  
**Data de Aprovação**: 2026-09-18  
**Status**: Homologado  
**Referência**: [plan.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/040-e2e-black-box-playwright-audit/plan.md) | [data-model.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/040-e2e-black-box-playwright-audit/data-model.md)

---

## 1. Princípios de Proteção de Dados e Isolamento

Para garantir que a base de dados compartilhada, o ambiente de preview e os logs de auditoria jamais sejam corrompidos por execuções de testes automatizados, as seguintes regras são inegociáveis:

### 1.1 Prefixo Obrigatório `E2E_`
Qualquer registro, entidade de banco, mock de cliente ou motocicleta gerada em testes DEVE iniciar com o prefixo `E2E_`.
- Exemplos: `E2E_Cliente_Silva`, `E2E_Yamaha_Fazer_250`.

### 1.2 Identificador de Execução Temporal (`E2E_RUN_ID`)
Toda sessão de testes instancia um identificador no formato padronizado:
`e2e-YYYYMMDD-HHMM-XXXX` (ex.: `e2e-20260918-0915-a7b2`).
Esse identificador deve ser injetado em metadados de observabilidade, campos de notas e logs de execução.

### 1.3 Placas Fictícias Homologadas
É expressamente proibido submeter placas reais de clientes da AF Motos ou veículos de terceiros. As placas autorizadas para validação sintática e testes mock são:
- `E2E1A23` (Formato Mercosul válido)
- `E2E2B34` (Formato Legado / Cinza válido)
- `E2E3C45` (Consulta com retorno simulado sem débitos)
- `E2E9Z99` (Consulta com retorno simulado com impedimento)

---

## 2. Política de Descarte e Limpeza (`E2E_RUN_CLEANUP`)

1. **Default Seguro**: A flag `E2E_RUN_CLEANUP` permanece configurada como `false` por padrão.
2. **Execução de Limpeza**: Quando explicitamente ativada (`E2E_RUN_CLEANUP=true`), a rotina `tests/e2e/fixtures/cleanup.ts` realiza expurgo seletivo filtrando rigorosamente por `name LIKE 'E2E_%'` e pelo `run_id` da execução.
3. **Preservação de Logs**: Registros de auditoria de segurança ou eventos de falha jamais são deletados automaticamente.

---

## 3. Prevenção de Vazamento de Segredos e PII

- Nenhuma credencial pessoal de operadores da loja deve ser cadastrada nos arquivos `.env.e2e`.
- O relatório de testes e os snapshots HTML do Playwright mascaram CPFs, telefones e e-mails de clientes reais eventualmente inspecionados em consultas prévias.
