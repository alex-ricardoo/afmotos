# Data Model: Central de Propostas e CRM (AF Motos)

## 1. Entities & Type Definitions

### 1.1 ProposalViewModel

Representa o modelo de apresentação unificado consumido pela interface administrativa (`/admin/propostas`):

```typescript
export type ProposalSource = 'lead' | 'sell_request' | 'consignment_request';

export type ProposalStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'CONVERTED'
  | 'LOST'
  | 'CLOSED';

export type ProposalType =
  | 'MOTORCYCLE_INTEREST'
  | 'SELL_MOTORCYCLE'
  | 'CONSIGNMENT'
  | 'RENTAL'
  | 'MOTORCYCLE_REQUEST'
  | 'GENERAL_CONTACT';

export interface ProposalImage {
  id?: string;
  url: string;
  thumbnailUrl?: string | null;
  altText?: string | null;
  provider?: 'imgbb' | 'supabase' | null;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface ProposalMotorcycle {
  id: string | null;
  brand: string | null;
  model: string | null;
  version: string | null;
  year: number | null;
  yearManufacture?: number | null;
  yearModel?: number | null;
  mileage: number | null;
  color: string | null;
  desiredPrice: number | null;
  fipePrice: number | null;
  fipeCode?: string | null;
}

export interface ProposalViewModel {
  id: string;
  source: ProposalSource;
  sourceId: string;
  type: ProposalType;
  typeLabel: string;
  status: ProposalStatus;
  statusLabel: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  state: string | null;
  message: string | null;
  notes?: string | null;
  createdAt: string;
  motorcycle: ProposalMotorcycle | null;
  images: ProposalImage[];
  metadata: Record<string, unknown>;
}
```

### 1.2 Status State Machine & Labels

```text
[NEW: Novo Lead] ──► [CONTACTED: Em atendimento] ──► [QUALIFIED: Qualificado]
                             │                                 │
                             ▼                                 ▼
                     [LOST: Perdido]                  [CONVERTED: Convertido]
                             │                                 │
                             └──────────► [CLOSED: Encerrado] ◄┘
```

| Status Key | Rótulo em Português | Cor da Badge | Indicador Visual |
|---|---|---|---|
| `NEW` | Novo Lead | Esmeralda / Verde | Ponto pulsante verde |
| `CONTACTED` | Em atendimento | Azul / Ciano | Ponto azul contínuo |
| `QUALIFIED` | Qualificado | Roxo / Magenta | Ponto roxo |
| `CONVERTED` | Convertido | Dourado AF Motos | Ponto dourado |
| `LOST` | Perdido | Rosa / Vermelho | Ponto vermelho |
| `CLOSED` | Encerrado | Grafite / Zinco | Ponto cinza |

### 1.3 Contact Types & Labels

| Type Key | Rótulo em Português | Ícone Temático | Cor de Destaque |
|---|---|---|---|
| `MOTORCYCLE_INTEREST` | Interesse em Moto | `Bike` | Esmeralda |
| `SELL_MOTORCYCLE` | Venda de Moto | `Tag` | Âmbar |
| `CONSIGNMENT` | Anunciar / Consignar | `KeyRound` | Roxo |
| `RENTAL` | Aluguel de Moto | `Calendar` | Azul |
| `GENERAL_CONTACT` | Contato Geral | `MessageSquare` | Zinco |

## 2. Validation & Business Rules

1. **Higienização de Telefone**: O telefone recebido de formulários pode conter formatações diversas. O ViewModel preserva o número bruto enquanto o helper `formatPhoneForDisplay` formata como `(81) 9 8590-1175` e `generateWhatsAppLink` extrai apenas os dígitos com o DDI `55`.
2. **Comparativo FIPE**: Se `desiredPrice` e `fipePrice` estiverem disponíveis e `fipePrice > 0`, a diferença percentual é calculada como `((desiredPrice - fipePrice) / fipePrice) * 100`.
3. **Persistência de Status**: A Server Action `updateLeadStatus(id, status, source, sourceId)` valida a autenticação de administrador, atualiza `public.leads` e sincroniza `public.sell_requests` ou `public.consignment_requests` quando `sourceId` for fornecido.
