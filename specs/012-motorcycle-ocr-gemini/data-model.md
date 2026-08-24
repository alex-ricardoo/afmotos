# Data Model & Schema Specification: OCR de Documentos Veiculares

**Feature**: `012-motorcycle-ocr-gemini`  
**Date**: 2026-08-23  
**Status**: Completed  

---

## 1. Core OCR TypeScript & Zod Schema

```ts
import { z } from 'zod';

export const OcrConfidenceSchema = z.object({
  brand: z.number().min(0).max(1).default(1),
  model: z.number().min(0).max(1).default(1),
  version: z.number().min(0).max(1).default(1),
  yearManufacture: z.number().min(0).max(1).default(1),
  yearModel: z.number().min(0).max(1).default(1),
  licensePlate: z.number().min(0).max(1).default(1),
  renavam: z.number().min(0).max(1).default(1),
  chassi: z.number().min(0).max(1).default(1),
  color: z.number().min(0).max(1).default(1),
  fuel: z.number().min(0).max(1).default(1),
  engineCapacity: z.number().min(0).max(1).default(1),
});

export const MotorcycleOcrResultSchema = z.object({
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
  yearManufacture: z.number().int().nullable().optional(),
  yearModel: z.number().int().nullable().optional(),
  licensePlate: z.string().nullable().optional(),
  renavam: z.string().nullable().optional(),
  chassi: z.string().nullable().optional(),
  color: z.string().nullable().optional(),
  fuel: z.enum(['gasolina', 'etanol', 'flex', 'eletrico', 'diesel']).nullable().optional(),
  engineCapacity: z.number().int().positive().nullable().optional(),
  documentType: z.enum(['CRLV', 'CRV', 'UNKNOWN']).default('CRLV'),
  confidence: OcrConfidenceSchema.default({}),
  warnings: z.array(z.string()).default([]),
});

export type MotorcycleOcrResult = z.infer<typeof MotorcycleOcrResultSchema>;
export type OcrConfidenceMap = z.infer<typeof OcrConfidenceSchema>;
```

---

## 2. Field Normalization & Sanitization Rules

| Campo Extraído | Tipo Bruto | Regra de Normalização | Exemplo Entrada | Exemplo Saída |
|---|---|---|---|---|
| `brand` | string | `trim()`, Title Case / Upper padrão FIPE | `" honda "` | `"HONDA"` |
| `model` | string | `trim()`, remoção de quebras | `"CG 160 FAN\n"` | `"CG 160 Fan"` |
| `version` | string | `trim()`, null se vazio | `"ESD / FLEX"` | `"ESD / Flex"` |
| `licensePlate` | string | `toUpperCase()`, remove espaços e hífens, formato `AAA0A00` ou `AAA-0000` | `"abc-1d23 "` | `"ABC1D23"` |
| `renavam` | string | Mantém zeros à esquerda, remove caracteres não numéricos, string de 11 dígitos | `"00123456789"` | `"00123456789"` |
| `chassi` | string | `toUpperCase()`, remove caracteres não alfanuméricos, string de 17 caracteres | `"9c2kc0810pr000000"` | `"9C2KC0810PR000000"` |
| `yearManufacture` | number | Inteiro entre 1900 e Ano Atual + 1 | `2022` | `2022` |
| `yearModel` | number | Inteiro entre 1900 e Ano Atual + 1 | `2023` | `2023` |
| `engineCapacity` | number | Inteiro positivo em cilindradas cúbicas (cc) | `162.7` ou `"160"` | `162` |
| `fuel` | string | Enum: `'gasolina' \| 'etanol' \| 'flex' \| 'eletrico' \| 'diesel'` | `"GASOLINA / ALCOOL"` | `"flex"` |
| `color` | string | `trim()`, Capitalize | `"preta"` | `"Preto"` |

---

## 3. Form Field Mapping & Conflict Rules

```text
OCR Extracted Field     →   MotorcycleForm Field
-------------------------------------------------------
brand                   →   form.setValue('brand', value)
model                   →   form.setValue('model', value)
version                 →   form.setValue('version', value)
yearManufacture         →   form.setValue('year_manufacture', value)
yearModel               →   form.setValue('year_model', value)
licensePlate            →   form.setValue('license_plate', formattedPlate)
renavam                 →   form.setValue('renavam', formattedRenavam)
chassi                  →   form.setValue('chassi', formattedChassi)
color                   →   form.setValue('color', value)
fuel                    →   form.setValue('fuel', value)
engineCapacity          →   form.setValue('engine_capacity', value)
```

### Regras de Preenchimento e Conflito

1. **Campos Vazios no Formulário**: Preenchimento imediato sem necessidade de confirmação.
2. **Campos Já Digitados Manualmente**:
   - O sistema detecta a divergência entre o valor atual no formulário e o valor retornado pelo OCR.
   - Um modal de confirmação lista os campos com divergência (ex.: *"Placa atual: ABC-1234 → Documento: ABC-1D23"*).
   - O administrador escolhe se deseja:
     - **Substituir tudo**: Aplica os novos dados do OCR nos campos conflitantes.
     - **Manter apenas os valores vazios**: Preserva tudo o que já havia sido digitado manualmente e preenche apenas o que estava em branco.
     - **Cancelar**: Rejeita o preenchimento automático.
3. **Sinalização Visual de IA**:
   - Campos preenchidos via OCR recebem indicador visual suave (badge com ícone de faísca/IA e tooltip *"Preenchido pela leitura do documento"*).
   - Campos com `confidence < 0.75` ou presentes em `warnings` recebem destaque âmbar com alerta *"Confira este valor com atenção"*.
