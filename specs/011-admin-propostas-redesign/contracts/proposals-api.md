# Interface Contracts: Central de Propostas e CRM (AF Motos)

## 1. Server Actions

### 1.1 `getLeads(): Promise<ProposalViewModel[]>`

Recupera todas as propostas e contatos registrados no Supabase ordenados do mais recente para o mais antigo, mapeados para o `ProposalViewModel`.

- **Autenticação**: Requer sessão autenticada com perfil administrativo (`is_admin()`).
- **Retorno**: Lista de propostas normalizadas ou array vazio em caso de erro.

### 1.2 `updateLeadStatus(id: string, status: string, source?: string, sourceId?: string): Promise<{ success?: boolean; error?: string }>`

Atualiza o status de atendimento de uma proposta no banco de dados.

- **Parâmetros**:
  - `id` (string, obrigatório): ID do registro na tabela `leads`.
  - `status` (string, obrigatório): Novo status (`NEW`, `CONTACTED`, `QUALIFIED`, `CONVERTED`, `LOST`, `CLOSED`).
  - `source` (string, opcional): Origem (`lead`, `sell_request`, `consignment_request`).
  - `sourceId` (string, opcional): ID da tabela de origem para sincronização.
- **Retorno**: `{ success: true }` ou `{ error: string }`.

## 2. Utility Functions

### 2.1 `generateProposalWhatsAppMessage(proposal: ProposalViewModel): string`

Gera a mensagem introdutória de WhatsApp baseada no tipo de intenção (`MOTORCYCLE_INTEREST`, `SELL_MOTORCYCLE`, `CONSIGNMENT`, `RENTAL`, `GENERAL_CONTACT`), incluindo o nome do cliente e modelo da moto quando disponíveis.

### 2.2 `generateWhatsAppLink(phone: string, message: string): string`

Sanitiza o telefone (adicionando código de país `55` se omitido) e codifica o texto da mensagem via `encodeURIComponent` para criar a URL direta `https://wa.me/55...`.

### 2.3 `formatPhoneForDisplay(phone: string): string`

Converte uma string numérica de telefone em formato legível `(81) 9 8590-1175` ou `(81) 3456-7890`.
