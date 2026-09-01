# Interface Contract: Admin Share Server Actions

**Feature**: `023-compartilhamento-publico-laudo-veicular`  
**Status**: Approved Contract  
**Protocol**: Next.js Server Actions (Autenticação Obrigatória: Administrador)  

---

## 1. Action: `createVehicleReportShareAction`

Cria um novo token de compartilhamento para uma consulta concluída.

### Assinatura
```typescript
export async function createVehicleReportShareAction(params: {
  consultationId: string;
  forceRevokeExisting?: boolean;
}): Promise<{
  success: boolean;
  data?: {
    shareId: string;
    shareToken: string; // Retornado UMA ÚNICA VEZ
    shareUrl: string;   // URL completa gerada
    createdAt: string;
  };
  error?: string;
}>
```

### Regras de Negócio e Validação
1. O usuário requisitante deve ser administrador autenticado (`public.is_admin()`).
2. A consulta `consultationId` deve existir e ter status `COMPLETED`.
3. Se já houver um link ativo para a consulta e `forceRevokeExisting = false`, retorna erro indicando que já existe link ativo. Se `forceRevokeExisting = true`, revoga o link anterior com motivo "Substituído por novo link" e prossegue com a geração.
4. Gera token de 256 bits (`vt_...`), calcula `token_hash = sha256(token)` e insere em `vehicle_report_shares`.
5. Retorna a URL completa para ser exibida no modal.

---

## 2. Action: `revokeVehicleReportShareAction`

Revoga um link de compartilhamento ativo.

### Assinatura
```typescript
export async function revokeVehicleReportShareAction(params: {
  shareId: string;
  reason?: string;
}): Promise<{
  success: boolean;
  error?: string;
}>
```

### Regras de Negócio e Validação
1. O usuário requisitante deve ser administrador autenticado (`public.is_admin()`).
2. Atualiza `vehicle_report_shares` definindo:
   - `status = 'revoked'`
   - `revoked_at = now()`
   - `revoked_by = auth.uid()`
   - `revoke_reason = params.reason || 'Revogado manualmente pelo administrador'`
3. Dispara evento de auditoria `SHARE_REVOKED` na tabela `vehicle_report_share_events`.

---

## 3. Action: `getVehicleReportShareDetailsAction`

Obtém o estado atual do compartilhamento para exibição na tela de detalhes do laudo.

### Assinatura
```typescript
export async function getVehicleReportShareDetailsAction(params: {
  consultationId: string;
}): Promise<{
  success: boolean;
  data?: {
    hasActiveShare: boolean;
    activeShare?: {
      id: string;
      status: 'active' | 'revoked' | 'expired';
      createdAt: string;
      createdByName?: string;
      lastAccessedAt: string | null;
      accessCount: number;
      lastPdfDownloadAt: string | null;
      pdfDownloadCount: number;
      lastPrintAt: string | null;
      printCount: number;
    };
    latestRevocation?: {
      revokedAt: string;
      revokedByName?: string;
      reason: string | null;
    };
  };
  error?: string;
}>
```
