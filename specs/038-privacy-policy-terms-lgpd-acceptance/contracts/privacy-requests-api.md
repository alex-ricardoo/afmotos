# Contrato de API — Solicitações LGPD de Titulares de Dados (Spec 038)

## 1. Tipos de Direitos Atendidos (Art. 18 LGPD)

```typescript
export type PrivacyRequestType =
  | 'confirmation'               // Confirmação da existência de tratamento
  | 'access'                     // Acesso aos dados pessoais
  | 'correction'                 // Correção de dados incompletos ou desatualizados
  | 'anonymization_or_deletion'  // Eliminação, anonimização ou bloqueio
  | 'portability'                // Portabilidade dos dados
  | 'sharing_info'               // Informações de compartilhamento com terceiros
  | 'consent_revocation'         // Revogação de consentimento
  | 'other';                     // Outras solicitações relacionadas à privacidade
```

---

## 2. Ações do Cliente (Titular de Dados)

### 2.1 `createPrivacyRequestAction(payload: CreatePrivacyRequestInput)`
Permite que o titular autenticado registre uma solicitação formal.

- **Payload**:
  ```typescript
  interface CreatePrivacyRequestInput {
    requestType: PrivacyRequestType;
    details: string; // Mínimo 10 caracteres
    contactEmail: string;
    contactPhone?: string;
  }
  ```
- **Resposta**:
  ```typescript
  interface CreatePrivacyRequestResult {
    success: boolean;
    protocolNumber?: string; // Ex: 'LGPD-202609-AB12'
    createdAt?: string;
    error?: string;
  }
  ```

### 2.2 `listCustomerPrivacyRequestsAction()`
Lista todas as solicitações registradas pelo titular autenticado.

---

## 3. Ações do Administrador / Encarregado (DPO)

### 3.1 `adminListPrivacyRequestsAction(filters?: { status?: string })`
Lista solicitações com paginação e filtro por status (`'pending'`, `'in_analysis'`, `'completed'`, `'rejected'`).

### 3.2 `adminUpdatePrivacyRequestAction(payload: UpdatePrivacyRequestInput)`
Permite responder à solicitação e atualizar o status.

- **Payload**:
  ```typescript
  interface UpdatePrivacyRequestInput {
    requestId: string;
    status: 'in_analysis' | 'completed' | 'rejected';
    responseNotes: string;
  }
  ```
