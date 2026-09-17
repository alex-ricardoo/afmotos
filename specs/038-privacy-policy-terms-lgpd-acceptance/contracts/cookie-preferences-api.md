# Contrato de API & Especificação — Cookies e Preferências de Privacidade (Spec 038)

## 1. Classificação Técnica dos Cookies no Projeto

### 1.1 Cookies Essenciais (Estritamente Necessários)
Cookies indispensáveis para o funcionamento e segurança da aplicação:
- `sb-access-token`: Token JWT de sessão de autenticação do Supabase.
- `sb-refresh-token`: Token de renovação de sessão segura.
- `next-auth.pkce.code_verifier`: Verificador PKCE para fluxos de autenticação OAuth.

*Base legal*: Execução de Contrato / Procedimentos Preliminares e Legítimo Interesse (Segurança da Informação). Dispensa banner de bloqueio prévio.

### 1.2 Cookies Não Essenciais (Analíticos / Marketing)
- **Status Atual**: Inexistentes no código da AF Motos.
- **Preparação de Arquitetura**:
  - Se futuramente scripts como Google Analytics ou Meta Pixel forem adicionados, o consentimento será condicional ao opt-in do usuário via `CookiePreferences`.

---

## 2. Tipagem de Preferências de Privacidade

```typescript
export interface CookiePreferences {
  essential: true;       // Sempre true e bloqueado para desativação
  analytics: boolean;    // Default: false
  marketing: boolean;    // Default: false
  updatedAt: string;     // ISO timestamp
}
```

O cliente pode visualizar suas preferências ativas em `/cliente/perfil` na aba "Privacidade e Documentos".
