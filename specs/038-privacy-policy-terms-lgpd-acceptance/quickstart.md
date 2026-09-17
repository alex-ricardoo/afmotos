# Guia de Início Rápido — Feature 038: Política de Privacidade, Termos de Uso e Registro de Aceite LGPD

## 1. Verificação das Páginas Públicas
1. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
2. Acesse:
   - Política de Privacidade: [http://localhost:3000/politica-de-privacidade](http://localhost:3000/politica-de-privacidade)
   - Termos de Uso: [http://localhost:3000/termos-de-uso](http://localhost:3000/termos-de-uso)
3. Verifique o índice navegável com âncoras e o botão de impressão.

---

## 2. Teste do Fluxo de Cadastro e Aceite
1. Abra uma janela anônima e acesse [http://localhost:3000/cliente/cadastro](http://localhost:3000/cliente/cadastro).
2. Tente enviar o formulário preenchido sem marcar o checkbox de termos. O sistema bloqueará o envio com mensagem de erro.
3. Marque o checkbox e conclua o cadastro. O usuário será criado e os aceites de Termos e Política serão registrados no banco.

---

## 3. Teste da Central de Privacidade do Cliente
1. Acesse a área do cliente: [http://localhost:3000/cliente/perfil](http://localhost:3000/cliente/perfil).
2. Na seção "Privacidade e Documentos", verifique as versões aceitas e a versão vigente.
3. Clique em "Solicitar atendimento sobre meus dados" e submeta uma solicitação formal. Um número de protocolo (ex.: `LGPD-202609-AB12`) será gerado.

---

## 4. Teste do Painel Administrativo
1. Acesse com credenciais de administrador: [http://localhost:3000/admin/configuracoes/documentos-legais](http://localhost:3000/admin/configuracoes/documentos-legais).
2. Visualize as versões publicadas e o histórico de solicitações abertas por titulares.
3. Crie um rascunho e pratique a publicação assistida com a palavra `"PUBLICAR"`.
