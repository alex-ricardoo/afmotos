# Contract: Official Report Presentation & PDF Download

---

## 1. Regras de Exibição na UI (`CustomerVehicleDetail`)

```ts
const isOfficialReport =
  consultation.status === 'completed' &&
  consultation.payment_status === 'paid' &&
  dto?.is_mock === false &&
  dto?.mode === 'live';
```

- **Quando `isOfficialReport === true`**:
  - Exibe badge esmeralda: `"Laudo Oficial Emitido"`.
  - Exibe badge dourado: `"Base Senatran"`.
  - Botão de ação: `"Baixar Laudo Oficial PDF"`.

- **Quando `dto?.is_mock === true`**:
  - Oculta completamente `"Laudo Oficial Emitido"` e `"Base Senatran"`.
  - Exibe badge de alerta/aviso: `"Dados de demonstração (Ambiente de Teste)"`.
  - Botão de ação: `"Baixar Prévia de Demonstração"`.

---

## 2. Regras da Rota de Download do PDF (`/api/cliente/consultas/[id]/pdf`)

- Se `process.env.VERCEL_ENV === 'production'`:
  - Se a consulta possuir `dto.is_mock === true`:
    - Responde HTTP 403 Forbidden:
      ```json
      {
        "error": "Laudo oficial indisponível para registros de demonstração em produção."
      }
      ```
  - Se `dto.is_mock === false`:
    - Gera o PDF com selo oficial e procedência Senatran.
