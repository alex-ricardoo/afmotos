# API Contract: `/api/admin/motorcycles/ocr`

**Feature**: `012-motorcycle-ocr-gemini`  
**Endpoint**: `POST /api/admin/motorcycles/ocr`  
**Status**: Active  

---

## 1. Overview & Security

Este endpoint recebe um arquivo de imagem de documento veicular (CRLV/CRV), autentica o usuário via sessão Supabase, valida o papel administrativo em `admin_profiles`, processa a imagem com o Google Gemini no servidor e retorna os dados técnicos estruturados para preenchimento de formulário.

- **Autenticação**: Requer cookie de sessão Supabase (`sb-*-auth-token`).
- **Autorização**: Usuário deve pertencer a `admin_profiles` com status ativo (`is_admin() === true`).
- **Retenção de Arquivo**: Zero persistência. O arquivo é processado na memória e descartado.
- **CORS / Acesso Externo**: Proibido. Acesso restrito à mesma origem (Same-Origin).

---

## 2. Request Specification

- **HTTP Method**: `POST`
- **Content-Type**: `multipart/form-data`

### Form Data Fields

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `file` | `File` (Binary) | Sim | Arquivo de imagem do documento nos formatos `image/jpeg`, `image/png`, `image/webp`. Tamanho máximo: 10 MB (10.485.760 bytes). |

---

## 3. Response Specification

### 200 OK (Leitura Realizada com Sucesso)

Retorna o objeto estruturado com os dados encontrados, índices de confiança e avisos.

```json
{
  "success": true,
  "data": {
    "brand": "HONDA",
    "model": "CG 160",
    "version": "Fan",
    "yearManufacture": 2022,
    "yearModel": 2023,
    "licensePlate": "ABC1D23",
    "renavam": "00123456789",
    "chassi": "9C2KC0810PR000000",
    "color": "Preta",
    "fuel": "flex",
    "engineCapacity": 162,
    "documentType": "CRLV",
    "confidence": {
      "brand": 0.98,
      "model": 0.95,
      "version": 0.85,
      "yearManufacture": 0.96,
      "yearModel": 0.96,
      "licensePlate": 0.92,
      "renavam": 0.88,
      "chassi": 0.70,
      "color": 0.90,
      "fuel": 0.85,
      "engineCapacity": 0.82
    },
    "warnings": [
      "O chassi possui caracteres com nitidez moderada. Confira os dígitos finais."
    ]
  }
}
```

---

## 4. Error Responses

### 400 Bad Request (Arquivo Ausente ou Inválido)

```json
{
  "success": false,
  "error": "Arquivo inválido. Envie uma imagem nos formatos JPEG, PNG ou WebP com até 10 MB."
}
```

### 401 Unauthorized (Sessão Ausente ou Expirada)

```json
{
  "success": false,
  "error": "Você precisa estar autenticado para utilizar este recurso."
}
```

### 403 Forbidden (Usuário Sem Privilégios Administrativos)

```json
{
  "success": false,
  "error": "Você não tem permissão para usar este recurso."
}
```

### 422 Unprocessable Entity (Documento Ilegível ou Não Veicular)

```json
{
  "success": false,
  "error": "Não foi possível identificar dados veiculares na imagem enviada. Verifique se o documento está nítido e tente novamente."
}
```

### 503 Service Unavailable / 500 Internal Error (Serviço de IA Indisponível)

```json
{
  "success": false,
  "error": "O recurso de leitura automática está temporariamente indisponível. Preencha os dados manualmente ou tente novamente mais tarde."
}
```
