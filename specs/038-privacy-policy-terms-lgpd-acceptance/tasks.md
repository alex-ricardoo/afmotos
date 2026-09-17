# Tarefas de Implementação — Feature 038: Política de Privacidade, Termos de Uso e Registro de Aceite LGPD

- [ ] **TSK-001**: Criar migração SQL `20260915100000_create_legal_documents_and_lgpd_acceptance.sql` com tabelas `legal_documents`, `legal_document_versions`, `legal_document_acceptances`, `privacy_requests`, constraints, RLS e seed inicial.
- [ ] **TSK-002**: Implementar módulo de utilitários criptográficos em `lib/legal/crypto.ts` (cálculo de SHA-256 e `hashClientIp`).
- [ ] **TSK-003**: Implementar tipos em `lib/legal/types.ts` e textos oficiais canônicos em `lib/legal/default-documents.ts`.
- [ ] **TSK-004**: Implementar consultas de leitura em `lib/legal/queries.ts` e Server Actions em `lib/legal/actions.ts`.
- [ ] **TSK-005**: Atualizar `next.config.ts` removendo o redirect de `/termos-de-uso` para `/politica-de-privacidade`.
- [ ] **TSK-006**: Reformular a página pública `app/(public)/politica-de-privacidade/page.tsx` com 23 seções, índice navegável, botão de impressão e dados institucionais.
- [ ] **TSK-007**: Criar a nova página pública `app/(public)/termos-de-uso/page.tsx` com cláusulas equilibradas e design consistente.
- [ ] **TSK-008**: Atualizar `components/layout/footer.tsx` com links para ambos os documentos.
- [ ] **TSK-009**: Atualizar `lib/customer/schemas.ts` e `lib/customer/actions.ts` com validação de aceite obrigatório no cadastro.
- [ ] **TSK-010**: Atualizar `components/customer/auth-form.tsx` com checkbox de aceite no cadastro e texto informativo no login.
- [ ] **TSK-011**: Criar página `app/cliente/aceite-documentos/page.tsx` e proteger `app/cliente/layout.tsx` para redirecionamento amigável de usuários com pendência de aceite.
- [ ] **TSK-012**: Adicionar seção "Privacidade e Documentos" em `app/cliente/perfil/page.tsx` e `components/customer/profile-form.tsx` com histórico de versões e abertura de solicitações LGPD.
- [ ] **TSK-013**: Criar painel administrativo em `app/admin/(protected)/configuracoes/documentos-legais/page.tsx` e adicionar link na `components/admin/admin-sidebar.tsx`.
- [ ] **TSK-014**: Escrever testes automatizados em `lib/legal/__tests__/legal-documents.test.ts`.
- [ ] **TSK-015**: Executar bateria de validação: `npm test`, `npm run typecheck`, `npm run lint` e `npm run build`.
