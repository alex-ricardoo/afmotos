# Quickstart & Manual Testing Guide: Compartilhamento Público de Laudos

**Feature Directory**: `specs/023-compartilhamento-publico-laudo-veicular`  
**Created**: 2026-09-01  
**Status**: Ready for Verification  

---

## 1. Guia Passo a Passo para Administradores

### 1.1. Gerar Link Público para o Cliente
1. Acesse o painel administrativo da AF Motos em `/admin/consulta-placa`.
2. Abra um laudo existente na listagem de histórico ou realize uma nova consulta por placa.
3. No painel de detalhes do laudo (`/admin/consulta-placa/[id]`), localize a seção **"Compartilhamento com Cliente"**.
4. Clique no botão **"Gerar Link de Compartilhamento"**.
5. No modal aberto, visualize a URL gerada (exemplo: `https://afmotos.com.br/laudos/veicular/vt_7d9KxL...`).
6. Clique em **"Copiar Link"** (o sistema exibe uma notificação toast de sucesso).
7. Envie o link copiado para o cliente via WhatsApp ou e-mail.

### 1.2. Revogar um Link Ativo
1. No painel de detalhes do laudo compartilhado, clique no botão **"Revogar Link"**.
2. Informe o motivo da revogação (exemplo: *"Negociação encerrada com o cliente"*) no diálogo de confirmação.
3. Clique em **"Confirmar Revogação"**.
4. Observe que o status do card muda para **"Revogado"** e o acesso ao link é imediatamente interrompido.

### 1.3. Gerar um Novo Link para Laudo com Compartilhamento Anterior
1. Caso o laudo já possua um link revogado ou queira substituir o link ativo, clique em **"Gerar Novo Link"**.
2. Confirme a substituição.
3. Um novo token criptográfico será criado e o anterior será definitivamente invalidado.

---

## 2. Roteiro de Testes e Validação de Segurança

### 2.1. Teste de Acesso sem Login (Modo Anônimo)
- **Ação**: Abra uma janela anônima (Incognito/Private Window) no navegador.
- **Ação**: Cole o link público copiado (`/laudos/veicular/[shareToken]`).
- **Validação**:
  - [ ] A página é renderizada imediatamente sem exigir login, cadastro ou senha.
  - [ ] A identidade visual da AF Motos é carregada perfeitamente.
  - [ ] A placa Mercosul é exibida de forma elegante e nítida.
  - [ ] Todas as abas de dados cadastrais, débitos e restrições são navegáveis.

### 2.2. Teste de Download e Impressão de PDF
- **Ação**: Na página pública do laudo, clique no botão **"Baixar PDF"**.
- **Validação**:
  - [ ] O arquivo PDF é baixado diretamente no navegador com nome formatado (ex: `laudo-veicular_ABC1234.pdf`).
  - [ ] O conteúdo do PDF corresponde aos dados sanitizados do laudo.
  - [ ] Ao clicar em **"Imprimir"**, a tela de impressão nativa do navegador abre com formatação limpa e sem elementos indesejados.

### 2.3. Teste de Custo Zero (Zero Chamadas à API Brasil)
- **Ação**: Abra o link público 10 vezes consecutivas e baixe o PDF 3 vezes.
- **Validação**:
  - [ ] Verifique o log de rede do servidor: nenhuma requisição HTTP externa para `apibrasil.com.br` foi disparada.
  - [ ] O saldo da conta de API da AF Motos permanece inalterado.
  - [ ] O banco de dados apenas atualizou os campos `access_count` e `pdf_download_count`.

### 2.4. Teste de Blindagem de Dados Sensíveis e LGPD
- **Ação**: Inspecione o HTML da página pública, o código-fonte e o PDF gerado.
- **Validação**:
  - [ ] Chassi aparece mascarado: `8AJZZZ******3456`.
  - [ ] RENAVAM aparece mascarado: `******1222`.
  - [ ] Número de motor aparece mascarado: `******3456`.
  - [ ] Documentos de proprietários anteriores aparecem mascarados (`***.***.***-12`).
  - [ ] Nomes completos, endereços e telefones de terceiros foram **100% removidos**.
  - [ ] Valores de custos pagos pela AF Motos e saldo de API não aparecem em nenhuma parte do DOM ou do payload.
  - [ ] Nenhum JSON bruto é enviado ao navegador.

### 2.5. Teste de Inexistência de Token Puro no Banco de Dados
- **Ação**: Execute uma query no Supabase SQL Editor:
  ```sql
  SELECT id, consultation_id, token_hash, status FROM public.vehicle_report_shares;
  ```
- **Validação**:
  - [ ] A coluna `token_hash` contém apenas strings hexadecimais SHA-256 de 64 caracteres.
  - [ ] O token original (`vt_...`) **NÃO** está gravado em nenhuma coluna da tabela nem nos metadados.

### 2.6. Teste de Revogação Imediata
- **Ação**: Após revogar o link no painel admin, tente recarregar a página pública na janela anônima.
- **Validação**:
  - [ ] O servidor retorna a página 404 neutra: *"Este laudo não está disponível ou o link é inválido."*
  - [ ] A tentativa de download de PDF via API retorna status HTTP 404.
  - [ ] Nenhum dado interno ou identificador do laudo é revelado ao visitante.

### 2.7. Teste de Prevenção de Enumeração e Rate Limiting
- **Ação**: Tente acessar URLs com tokens inexistentes sucessivas vezes (ex: `/laudos/veicular/vt_invalido1`, `/laudos/veicular/vt_invalido2`).
- **Validação**:
  - [ ] Todas as requisições recebem resposta 404 idêntica em tempo constante.
  - [ ] Ao atingir o limiar de taxa (15 tentativas em 10 minutos pelo mesmo IP), o servidor retorna HTTP 429 (Too Many Requests).

### 2.8. Teste de Headers de Privacidade e Anti-Indexação
- **Ação**: Execute um comando `curl -I` para a URL pública:
  ```bash
  curl -I https://dominio.com.br/laudos/veicular/vt_exemplo...
  ```
- **Validação**:
  - [ ] `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`
  - [ ] `Cache-Control: private, no-store, max-age=0, must-revalidate`
  - [ ] `Referrer-Policy: no-referrer`
  - [ ] O arquivo `robots.txt` contém a linha `Disallow: /laudos/`.
  - [ ] O arquivo `sitemap.xml` não lista nenhuma URL sob `/laudos/`.

### 2.9. Teste de Laudo em Modo Mock
- **Ação**: Gere um link para uma consulta realizada com fixture de teste (`is_mock = true`).
- **Ação**: Abra o link público.
- **Validação**:
  - [ ] Um banner proeminente em tom âmbar é exibido:  
    *“Este relatório é uma simulação de ambiente de testes e demonstração institucional.”*
  - [ ] O cliente é claramente informado de que se trata de uma simulação.
