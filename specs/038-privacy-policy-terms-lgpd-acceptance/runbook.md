# Runbook & Procedimentos Operacionais — Feature 038: Política de Privacidade, Termos de Uso e Registro de Aceite LGPD

## 1. Procedimento de Publicação de Nova Versão Legal

Quando a assessoria jurídica ou a administração da AF Motos solicitar a alteração da Política de Privacidade ou dos Termos de Uso:

1. **Criação do Rascunho**:
   - O administrador acessa `/admin/configuracoes/documentos-legais`.
   - Clica em "Novo Rascunho" selecionando o documento (`privacy_policy` ou `terms_of_use`).
   - Define a nova versão semântica (ex.: de `1.0.0` para `1.1.0` se aditivo menor, ou `2.0.0` se alteração estrutural).
   - Insere o conteúdo em Markdown e um resumo claro das mudanças.
   - Define se a versão exigirá novo aceite obrigatório (`requires_reacceptance = true`).
2. **Revisão e Validação**:
   - O rascunho fica salvo no banco com `status = 'draft'` e visível apenas para administradores.
   - Visualizar o preview formatado na tela.
3. **Publicação Homologada**:
   - Clicar no botão "Publicar Versão".
   - Confirmar digitando a palavra exata `"PUBLICAR"`.
   - O sistema gera automaticamente o hash SHA-256 do conteúdo, arquiva a versão anterior e atualiza a vigência.
   - Se `requires_reacceptance = true`, usuários existentes no próximo acesso à área do cliente serão redirecionados para `/cliente/aceite-documentos`.

---

## 2. Procedimento de Atendimento a Solicitações de Titulares (Art. 18 LGPD)

1. O titular registra uma solicitação pela sua área de perfil (`/cliente/perfil`).
2. A solicitação ingressa com status `pending` e número de protocolo `LGPD-YYYYMM-XXXX`.
3. O administrador/DPO visualiza a solicitação na aba "Solicitações de Titulares (LGPD)" em `/admin/configuracoes/documentos-legais`.
4. O administrador altera o status para `in_analysis` durante a investigação interna.
5. Após apuração (ex.: retificação de dado cadastral ou fornecimento de informações sobre compartilhamento), o administrador insere o parecer no campo de resposta e altera o status para `completed` ou `rejected` (com justificativa legal).
6. O titular visualiza a resposta e a data de conclusão em seu painel.

---

## 3. Plano de Contingência e Rollback

Se uma migração ou versão com erro for publicada:
- **Reversão de Documento Publicado**:
  - Como versões publicadas são imutáveis por segurança jurídica, a reversão de texto deve ser feita criando um novo rascunho com o conteúdo anterior homologado e publicando-o como uma nova versão com incremento de patch (ex.: `1.0.1`).
- **Rollback de Banco de Dados**:
  - Em ambiente de staging/desenvolvimento, se necessário reverter a migração:
    ```sql
    DROP TABLE IF EXISTS public.privacy_requests CASCADE;
    DROP TABLE IF EXISTS public.legal_document_acceptances CASCADE;
    DROP TABLE IF EXISTS public.legal_document_versions CASCADE;
    DROP TABLE IF EXISTS public.legal_documents CASCADE;
    ```
