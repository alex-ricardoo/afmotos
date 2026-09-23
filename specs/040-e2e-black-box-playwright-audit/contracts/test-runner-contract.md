# Test Runner Contract: NPM Scripts & CLI Interface

Este contrato define os scripts de execução do runner `@playwright/test`, argumentos suportados e códigos de saída esperados.

---

## Scripts no `package.json`

Os scripts abaixo devem ser incorporados sem modificar os scripts de compilação ou testes unitários já existentes:

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:smoke": "playwright test --project=smoke",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:report": "playwright show-report"
  }
}
```

---

## Códigos de Saída (Exit Codes)

| Código | Significado | Comportamento Esperado |
| :---: | :--- | :--- |
| `0` | Sucesso | Todos os testes executados passaram; cenários bloqueados foram sinalizados sem quebrar o runner. |
| `1` | Falha de Teste | Um ou mais testes executados falharam na validação de asserções (`expect`). |
| `2` | Erro de Configuração | Falha ao inicializar o Playwright, variável `E2E_BASE_URL` inválida ou sintaxe incorreta em fixtures. |
| `130` | Interrupção | Execução cancelada pelo operador via `SIGINT` / `Ctrl+C`. |

---

## Formatos de Relatório

1. **Console (Line/List)**:
   - Apresenta o progresso de cada spec em tempo real, informando tempo de execução e status.
2. **HTML Report (`playwright-report/`)**:
   - Compilação navegável com gráficos de taxa de sucesso, lista de testes, traces de rede, vídeos e capturas de tela das falhas.
   - O diretório `playwright-report/` e `test-results/` devem constar obrigatoriamente no `.gitignore`.
