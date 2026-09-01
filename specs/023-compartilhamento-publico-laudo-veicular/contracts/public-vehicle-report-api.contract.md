# Interface Contract: Public Vehicle Report API & View

**Feature**: `023-compartilhamento-publico-laudo-veicular`  
**Status**: Approved Contract  
**Protocol**: HTTPS (Server Component & REST Route Handler)  

---

## 1. Rota de Visualização Pública do Laudo

### Endpoint
`GET /laudos/veicular/[shareToken]`

### Parâmetros de Rota
| Parâmetro | Tipo | Descrição | Validação |
| :--- | :--- | :--- | :--- |
| `shareToken` | `string` | Token criptográfico de acesso | Deve iniciar com `vt_`, conter ~46 caracteres alfanuméricos (`base64url`). |

### Headers de Resposta HTTP Obrigatórios
```http
HTTP/1.1 200 OK
Content-Type: text/html; charset=utf-8
X-Robots-Tag: noindex, nofollow, noarchive, nosnippet
Cache-Control: private, no-store, max-age=0, must-revalidate
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
```

### Respostas Possíveis
- `200 OK`: Renderiza o Server Component com o DTO sanitizado `PublicVehicleReportDto`.
- `404 Not Found`: Token inexistente, malformado ou revogado (renderiza `app/laudos/veicular/[shareToken]/not-found.tsx`).
- `429 Too Many Requests`: Limite de taxa excedido por IP em tentativas inválidas.

---

## 2. Rota de Download de PDF Público sob Demanda

### Endpoint
`GET /api/public/laudos/veicular/[shareToken]/pdf`

### Parâmetros de Rota
| Parâmetro | Tipo | Descrição |
| :--- | :--- | :--- |
| `shareToken` | `string` | Token criptográfico de acesso |

### Headers de Resposta HTTP
```http
HTTP/1.1 200 OK
Content-Type: application/pdf
Content-Disposition: inline; filename="laudo-veicular_ABC1234.pdf"
Cache-Control: private, no-store, max-age=0, must-revalidate
X-Robots-Tag: noindex, nofollow, noarchive, nosnippet
```

### Respostas Possíveis
- `200 OK`: Stream binário do documento PDF institucional gerado via `@react-pdf/renderer`.
- `404 Not Found`: `{ "error": "Laudo indisponível ou link inválido." }`
- `429 Too Many Requests`: `{ "error": "Limite de requisições excedido. Tente novamente mais tarde." }`
- `500 Internal Server Error`: `{ "error": "Falha na geração do PDF." }`

---

## 3. Estrutura do DTO Sanitizado (`PublicVehicleReportDto`)

```typescript
export interface PublicVehicleReportDto {
  // Identificação Pública
  share_id?: string;
  consulted_at: string;
  plate_display: string; // Ex: 'ABC-1234' ou 'BRA2E19'
  
  // Ficha Técnica
  brand: string;
  model: string;
  version?: string;
  vehicle_type: string;
  year_manufacture: number | null;
  year_model: number | null;
  color: string;
  fuel: string;
  power?: string;
  displacement?: string;
  engine_capacity: string;
  city_state: string; // Ex: 'Recife / PE'
  
  // Identificadores Parcialmente Mascarados (LGPD)
  chassis_masked: string; // Ex: '8AJZZZ******3456'
  renavam_masked: string;  // Ex: '******1222'
  engine_masked: string;   // Ex: '******3456'
  
  // Veredito e Matriz de Procedência
  procedural_verdict: 'APPROVED' | 'ATTENTION' | 'RESTRICTED';
  verdict_label: string;
  verdict_description: string;
  verdict_bullets: string[];
  risk_score?: number;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  
  // Riscos Resumidos
  risk_summary: {
    theft_robbery_clear: boolean;
    judicial_clear: boolean;
    financial_clear: boolean;
    auction_clear: boolean;
    accident_clear: boolean;
    recall_clear: boolean;
    debts_clear: boolean;
  };
  
  // Débitos Consolidados
  debts_summary?: {
    total_debts: number;
    ipva_pending: number;
    licensing_pending: number;
    fines_pending: number;
    fines_count?: number;
  };
  
  // Restrições e Gravames
  gravamen_details?: {
    has_active_gravamen: boolean;
    status_label: string;
    agent?: string;
    financial_restriction?: string;
    judicial_restriction?: string;
  };
  
  // Histórico de Proprietários Anonimizado
  owners_history?: {
    owners_count: number;
    records: Array<{
      state?: string;
      period?: string;
      document_type?: 'PF' | 'PJ';
      masked_document?: string; // '***.***.***-12'
    }>;
  };
  
  // FIPE e Histórico
  fipe_reference?: {
    code: string;
    model: string;
    price: number;
    reference_month: string;
  };
  
  // Flags Institucionais
  is_mock: boolean;
  disclaimer: string;
  issuer: {
    company_name: string;
    trade_name: string;
    cnpj: string;
    city: string;
    state: string;
  };
}
```
