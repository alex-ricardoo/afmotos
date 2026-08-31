# Contract: Vehicle History Settings Schema & Admin Action

**Scope**: Interface entre o Painel Administrativo (`/admin/configuracoes`), a Server Action de persistência (`saveSettingsAction`) e o leitor de configurações públicas (`getPublicSiteSettings`).

---

## 1. Schema do Contrato (`site_settings.settings.vehicleHistory`)

```typescript
export type VehicleHistoryPositioningMode = 
  | 'COMPETITIVE'
  | 'REGIONAL_BEST'
  | 'SPECIAL_OFFER'
  | 'CHEAPEST_MARKET'
  | 'CUSTOM';

export interface VehicleHistorySettingsPayload {
  isEnabled: boolean;
  price: number;
  currency: string;
  priceLabel?: string;
  positioningMode: VehicleHistoryPositioningMode;
  customPositioningText?: string | null;
  claimEvidenceText?: string | null;
  claimEvidenceDate?: string | null;
  whatsappPhoneOverride?: string | null;
  whatsappMessageTemplate?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  disclaimerText?: string;
  isPublishedInNav: boolean;
}
```

---

## 2. Invariantes de Validação

1. **Preço Válido**: `price` deve ser numérico, estritamente positivo (> 0) e menor que 1000.
2. **Conformidade Legal (CDC/CONAR)**:
   - Se `positioningMode === 'CHEAPEST_MARKET'`, os campos `claimEvidenceText` (mínimo 10 caracteres) e `claimEvidenceDate` (formato `YYYY-MM-DD`) são estritamente obrigatórios.
   - Caso contrário, a mutação falha no servidor com erro amigável ao operador.
3. **Imutabilidade de Rotas Privadas**: O endpoint e dados de `site_settings` não expõem credenciais ou tokens de APIs externas.
