# Quickstart & Guia de Testes: Landing Page — Histórico Veicular

Este guia orienta o desenvolvedor e o administrador da **AF Motos** sobre como configurar, validar e testar a Landing Page de Histórico Veicular (`/historico-veicular`).

---

## 1. Como Ativar e Configurar o Serviço no Painel Admin

1. Acesse o painel administrativo da AF Motos em:
   ```text
   http://localhost:3000/admin/configuracoes
   ```
2. Clique na aba **"Histórico Veicular"**.
3. Verifique os campos:
   - **Serviço Ativo**: Deixe marcado como `Habilitado`.
   - **Preço da Consulta (R$)**: Informe o valor (padrão: `39,99`).
   - **Rótulo de Preço**: Ex.: `Consulta completa por R$ 39,99`.
   - **Posicionamento Comercial**: Selecione `Preço competitivo` ou `Um dos melhores preços da região`.
   - **Template da Mensagem de WhatsApp**: Verifique se a tag `{PLATE}` e `{PRICE}` estão presentes.
4. Clique em **"Salvar Alterações"**.

---

## 2. Como Testar o Fluxo Público e Conversão WhatsApp

### 2.1 Acessar a Landing Page
Abra o navegador em:
```text
http://localhost:3000/historico-veicular
```

### 2.2 Teste com Placa Mercosul
1. Na Hero Section, digite no campo da placa: `BRA2E19`.
2. Clique no botão **"Solicitar histórico pelo WhatsApp"**.
3. O navegador deve abrir uma nova aba com a URL do WhatsApp contendo:
   - O número oficial da AF Motos formatado internacionalmente (`55...`).
   - A mensagem com a placa `BRA2E19` e o valor configurado `R$ 39,99`.

### 2.3 Teste com Placa Antiga (Cinza)
1. Digite a placa: `KGU-4521` (ou `KGU4521`).
2. Clique em **"Solicitar histórico pelo WhatsApp"**.
3. O WhatsApp deve ser aberto com a placa formatada `KGU-4521`.

### 2.4 Teste com Placa Inválida
1. Digite apenas `123` ou caracteres aleatórios incorretos.
2. Clique em **"Solicitar histórico pelo WhatsApp"**.
3. O sistema deve exibir a mensagem de aviso: *"Informe uma placa brasileira válida para continuar."* sem abrir o WhatsApp e sem recarregar a página.

### 2.5 Teste de Dúvidas sem Placa
1. Deixe o campo de placa vazio e clique em **"Tirar dúvidas no WhatsApp"** (ou no botão do FAQ).
2. O sistema deve abrir o WhatsApp com mensagem acolhedora geral sobre o serviço.

---

## 3. Como Garantir Zero Chamadas à API Brasil e R$ 0,00 de Custo

1. Abra as Ferramentas do Desenvolvedor no navegador (F12) e acesse a aba **Network (Rede)**.
2. Filtre por `Fetch/XHR`.
3. Navegue por toda a página `/historico-veicular`, digite placas e interaja com os botões.
4. **Verificação**: Nenhuma requisição deve ser enviada para endpoints externos da API Brasil ou rotas com custo financeiro.

---

## 4. Como Validar SEO, Open Graph e Dados Estruturados (JSON-LD)

### 4.1 Validação de Meta Tags e Open Graph
1. Inspecione o `<head>` da página:
   - `<title>` deve conter `Histórico Veicular para Motos por Placa | AF Motos`.
   - `<meta name="description">` deve estar preenchida com a proposta de valor.
   - `<link rel="canonical">` deve apontar para `https://afmotos.com.br/historico-veicular`.
   - `<meta property="og:title">` e `<meta property="og:image">` devem estar definidos.

### 4.2 Validação de JSON-LD Schema
1. Procure no HTML pela tag `<script type="application/ld+json">`.
2. Cole o conteúdo no [Google Rich Results Test](https://search.google.com/test/rich-results) ou [Schema Markup Validator](https://validator.schema.org/).
3. Os tipos `Service`, `Offer`, `FAQPage` e `BreadcrumbList` devem ser detectados com sucesso.

### 4.3 Validação de Inclusão no Sitemap
1. Acesse:
   ```text
   http://localhost:3000/sitemap.xml
   ```
2. Verifique se a URL `/historico-veicular` está listada com prioridade `0.8`.

---

## 5. Como Testar Responsividade Mobile e Acessibilidade

1. No DevTools (F12), ative a emulação de dispositivos móveis (ex.: iPhone 14 / Samsung Galaxy).
2. Verifique:
   - A placa Mercosul estilizada se ajusta perfeitamente à largura da tela sem scroll horizontal.
   - Os cards de benefícios empilham-se em coluna única legível.
   - O FAQ pode ser navegado integralmente por toques e teclado.
   - Os botões possuem altura de toque superior a 44px.

---

## 6. Como Desativar o Serviço

1. No painel `/admin/configuracoes`, desmarque a opção **"Serviço Ativo"** e salve.
2. Ao recarregar `/historico-veicular`, a página não exibe mais botões de compra ou exibe o estado desativado com `noindex`.
3. A URL é removida dinamicamente de `sitemap.xml`.
