# Plano de Trabalho — Feature 038: Política de Privacidade, Termos de Uso e Registro de Aceite LGPD

## 1. Fases de Execução

### Fase 1 — Modelagem e Banco de Dados (Supabase)
- Criar migração SQL `20260915100000_create_legal_documents_and_lgpd_acceptance.sql`:
  - Tabelas `legal_documents`, `legal_document_versions`, `legal_document_acceptances`, `privacy_requests`.
  - Índices e restrições únicas de integridade e idempotência.
  - Políticas RLS canônicas baseadas em `is_active_admin()` e `auth.uid() = user_id`.
  - Seed com as versões iniciais 1.0.0 oficiais de Termos de Uso e Política de Privacidade.

### Fase 2 — Módulo Lógico e Criptografia (`lib/legal/`)
- Implementar `lib/legal/types.ts`: Tipagem completa.
- Implementar `lib/legal/crypto.ts`: SHA-256 para content hashing e `hashClientIp`.
- Implementar `lib/legal/default-documents.ts`: Conteúdo oficial de contingência com 23 seções da Política e Termos de Uso balanceados.
- Implementar `lib/legal/queries.ts`: Buscas server-side seguras de documentos vigentes, status de aceitação do usuário e histórico.
- Implementar `lib/legal/actions.ts`: Server Actions para registro de aceite, protocolo de solicitações LGPD e operações administrativas.

### Fase 3 — Páginas Públicas (`/politica-de-privacidade` e `/termos-de-uso`)
- Ajustar `next.config.ts`: Remover redirect de `/termos-de-uso` para `/politica-de-privacidade`.
- Reformular `app/(public)/politica-de-privacidade/page.tsx`:
  - Design system refinado, badge LGPD, índice navegável, 23 seções transparentes, botão de impressão e ação para atendimento de dados.
- Criar `app/(public)/termos-de-uso/page.tsx`:
  - Cláusulas equilibradas de uso da plataforma, créditos, laudos e limites de responsabilidade.
- Atualizar `components/layout/footer.tsx`:
  - Adicionar links visíveis para ambos os documentos.

### Fase 4 — Fluxos de Aceite no Cadastro, Login e OAuth
- Atualizar `lib/customer/schemas.ts`: Adicionar validação de `accept_terms: true`.
- Atualizar `lib/customer/actions.ts`: Gravar aceites atômicos na criação de conta.
- Atualizar `components/customer/auth-form.tsx`:
  - Checkbox desmarcado no cadastro com links.
  - Texto informativo discreto no login.
- Criar `app/cliente/aceite-documentos/page.tsx`:
  - Tela de aceite amigável para usuários com pendência de versões obrigatórias.
- Atualizar `app/cliente/layout.tsx`:
  - Proteger a área de clientes com verificação de conformidade de aceite.

### Fase 5 — Área do Cliente (Central de Privacidade)
- Atualizar `app/cliente/perfil/page.tsx` e `components/customer/profile-form.tsx`:
  - Aba/Seção "Privacidade e Documentos".
  - Exibição de versões aceitas e vigentes.
  - Modal para registro de solicitações LGPD com protocolo.
  - Histórico de solicitações do titular.

### Fase 6 — Painel Administrativo de Documentos Legais
- Criar `app/admin/(protected)/configuracoes/documentos-legais/page.tsx`:
  - Gestão de versões e rascunhos em Markdown.
  - Publicação assistida com modal de confirmação `"PUBLICAR"` e hash SHA-256.
  - Central de atendimento a solicitações LGPD de titulares.
- Atualizar `components/admin/admin-sidebar.tsx`:
  - Inserir link para Documentos Legais.

### Fase 7 — Testes Automatizados e Homologação
- Criar testes unitários e de integração em `lib/legal/__tests__/`.
- Executar suíte completa: `npm test`, `npm run typecheck`, `npm run lint` e `npm run build`.
