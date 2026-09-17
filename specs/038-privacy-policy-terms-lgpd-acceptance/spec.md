# Especificação Funcional — Feature 038: Política de Privacidade, Termos de Uso e Registro de Aceite LGPD

## 1. Visão Geral e Objetivos de Negócio

A plataforma **AF Motos** oferece serviços integrados de compra, venda, consignação e locação de motocicletas, além de consultas veiculares por placa, laudos cautelares oficiais e pacotes de créditos B2B com processamento de pagamentos pelo Mercado Pago e consulta a dados da API Brasil.

Para operar com total integridade, transparência e responsabilidade jurídica em conformidade com a **Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD)** e o **Marco Civil da Internet (Lei nº 12.965/2014)**, este projeto formaliza:
1. Uma **Política de Privacidade** aprofundada, elegante e de fácil leitura, com 23 seções explicativas, índice navegável e botão de impressão.
2. Uma nova rota de **Termos de Uso** (`/termos-de-uso`) com regras equilibradas de utilização, responsabilidade de dados e limites operacionais.
3. Um **motor de versionamento imutável** de documentos legais baseado em hashes criptográficos SHA-256.
4. O **registro auditável e obrigatório de aceite** no fluxo de cadastro, com reaceite condicional para usuários existentes e Google OAuth.
5. Uma **Central de Privacidade do Cliente** na Área do Cliente (`/cliente/perfil`) com histórico de versões aceitas e protocolo formal de solicitações LGPD (Art. 18).
6. Um **Painel Administrativo** para gestão de versões, rascunhos, publicação assistida, dados de DPO e atendimento a solicitações de titulares.

---

## 2. Casos de Uso & Requisitos Funcionais

### US1 — Acesso e Leitura Pública de Documentos Legais
- **FR-001**: O sistema MUST disponibilizar a rota pública `/politica-de-privacidade` com o design system da AF Motos (tema escuro `#050505`, tipografia hierárquica, detalhes em dourado `#c9a44c`, responsivo em mobile).
- **FR-002**: A Política de Privacidade MUST conter cabeçalho institucional com versão vigente, data de última atualização, resumo executivo em linguagem acessível, botão nativo de impressão e índice âncora navegável com 23 seções temáticas.
- **FR-003**: O sistema MUST disponibilizar a rota pública `/termos-de-uso` desfazendo qualquer redirect prévio e fornecendo cláusulas contratuais claras para a utilização da plataforma e consultas de histórico veicular.
- **FR-004**: O rodapé da aplicação (`components/layout/footer.tsx`) MUST incluir links permanentes e visíveis para `/politica-de-privacidade` e `/termos-de-uso`.

### US2 — Versionamento e Integridade Criptográfica
- **FR-005**: O sistema MUST persistir versões em `legal_document_versions`. Versões com status `'published'` são imutáveis.
- **FR-006**: Ao publicar qualquer versão, o sistema MUST calcular e persistir o hash SHA-256 do conteúdo (`content_hash`).
- **FR-007**: Qualquer alteração textual subsequente MUST ser criada como um novo rascunho (`status = 'draft'`) com número de versão incremental.

### US3 — Registro de Aceite no Cadastro e Login
- **FR-008**: O formulário de cadastro de clientes (`components/customer/auth-form.tsx`) MUST exibir checkbox desmarcado por padrão com a redação: `"Li e concordo com os Termos de Uso e com a Política de Privacidade da AF Motos."` com links diretos abrindo em nova aba.
- **FR-009**: O cadastro MUST falhar tanto no frontend quanto no backend (Zod schema e Server Action) caso o checkbox não seja explicitamente marcado.
- **FR-010**: Ao registrar o usuário com sucesso, o sistema MUST criar registros em `legal_document_acceptances` associando o ID do usuário às versões publicadas vigentes de Termos e Privacidade, com `acceptance_source = 'signup'`.
- **FR-011**: O formulário de login de clientes MUST exibir aviso informativo discreto no rodapé: `"Ao acessar a plataforma, você declara estar ciente da nossa Política de Privacidade e dos Termos de Uso aplicáveis."` com links correspondentes.
- **FR-012**: Usuários existentes ou que realizem login via Google OAuth sem aceite registrado das versões vigentes obrigatórias MUST ser redirecionados para a tela de aceite `/cliente/aceite-documentos`.
- **FR-013**: O registro de aceite MUST ser idempotente (`UNIQUE(user_id, document_version_id)`).

### US4 — Central de Privacidade do Cliente & Solicitações LGPD (Art. 18)
- **FR-014**: Na tela de perfil do cliente (`/cliente/perfil`), o sistema MUST disponibilizar a seção "Privacidade e Documentos" exibindo as versões vigentes e as versões aceitas pelo usuário com carimbo de data/hora no padrão brasileiro (`dd/MM/yyyy HH:mm`).
- **FR-015**: O cliente MUST poder acionar a modal "Solicitar atendimento sobre meus dados" para registrar pedidos formais com base no Art. 18 da LGPD (Acesso, Correção, Anonimização/Eliminação, Revogação de Consentimento, Informações sobre Compartilhamento), recebendo número de protocolo com formato `LGPD-YYYYMM-XXXX`.
- **FR-016**: O cliente MUST poder acompanhar o status de suas solicitações (`Pendente`, `Em análise`, `Concluído`, `Rejeitado`) na própria interface.

### US5 — Painel Administrativo de Documentos Legais
- **FR-017**: O sistema MUST disponibilizar a tela `/admin/configuracoes/documentos-legais` restrita a administradores ativos (`is_active_admin()`).
- **FR-018**: O administrador MUST poder visualizar versões, criar rascunhos, editar conteúdo em Markdown e publicar novas versões.
- **FR-019**: A publicação de versões MUST exigir confirmação reforçada mediante digitação da palavra `"PUBLICAR"`.
- **FR-020**: O administrador MUST poder consultar e responder às solicitações de titulares de dados da LGPD.

---

## 3. Critérios de Sucesso e Não-Funcionais

1. **SC-001**: 100% dos fluxos de cadastro rejeitam criação de conta sem aceite do checkbox de termos e privacidade.
2. **SC-002**: 0 registros de IP bruto são salvos nos logs ou tabelas de auditoria (utilização estrita de SHA-256 com salt).
3. **SC-003**: Acessibilidade WCAG 2.2 AA nos formulários, navegação por teclado e contraste visual nos links dourados.
4. **SC-004**: Todas as Server Actions validam permissões de autenticação e RLS no servidor.
