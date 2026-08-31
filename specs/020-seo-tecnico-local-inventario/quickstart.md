# Quickstart & Verification Guide: SEO Técnico, Local e de Inventário

Este guia descreve os passos operacionais para testar, validar e monitorar o SEO da AF Motos em ambiente local, de homologação e produção.

---

## 1. Configuração da Variável de Domínio

No arquivo `.env.local` (ou nas variáveis de ambiente da Vercel para produção), defina a URL canônica oficial:

```env
NEXT_PUBLIC_SITE_URL=https://aflocacoesevendas.com.br
```

*Importante: Em produção, utilize o domínio oficial sem barra no final.*

---

## 2. Como Testar Localmente

### 2.1 Testando o `robots.txt`
Inicie a aplicação (`npm run dev`) e acesse no navegador ou via curl:
```bash
curl http://localhost:3000/robots.txt
```
**O que verificar:**
- Presença de `User-agent: *` e `Allow: /`.
- Bloqueio explícito de `Disallow: /admin/`, `Disallow: /api/`, `Disallow: /login`.
- Linha final apontando para o sitemap: `Sitemap: http://localhost:3000/sitemap.xml` (ou domínio canônico configurado).

---

### 2.2 Testando o `sitemap.xml`
Acesse no navegador ou via curl:
```bash
curl http://localhost:3000/sitemap.xml
```
**O que verificar:**
- XML válido formatado segundo o protocolo `sitemaps.org/schemas/sitemap/0.9`.
- Todas as rotas públicas listadas com URLs absolutas.
- Motos ativas em estoque presentes com tags `<lastmod>` preenchidas.
- Motos com status `SOLD` ou `HIDDEN` e rotas de `/admin/` ausentes.

---

### 2.3 Validando Metadados e Tags Open Graph
1. Abra qualquer página pública no navegador (ex: `http://localhost:3000/motos/honda-cg-160-start-2024`).
2. Clique com botão direito e selecione **Exibir código-fonte da página** (`Ctrl + U` / `Cmd + Option + U`).
3. Inspecione a tag `<head>` e confirme:
   - `<title>` exclusivo e informativo.
   - `<meta name="description" content="..." />` com texto humanizado.
   - `<link rel="canonical" href="https://[dominio]/motos/honda-cg-160-start-2024" />`.
   - `<meta property="og:title" content="..." />`.
   - `<meta property="og:image" content="..." />` apontando para a foto principal da moto em HTTPS.
   - `<meta name="twitter:card" content="summary_large_image" />`.

---

### 2.4 Validando Dados Estruturados (JSON-LD)
No código-fonte da página, procure pela tag:
```html
<script type="application/ld+json">...</script>
```

#### Ferramentas Oficiais do Google:
1. **Google Rich Results Test**:  
   Acesse [https://search.google.com/test/rich-results](https://search.google.com/test/rich-results), cole o snippet de código HTML ou a URL pública e valide se `Product`, `Offer` ou `BreadcrumbList` são detectados sem erros.
2. **Schema Markup Validator**:  
   Acesse [https://validator.schema.org/](https://validator.schema.org/) e cole o código para validar a conformidade dos nós `AutoDealer`, `PostalAddress` e `Product`.

---

### 2.5 Testando Moto Vendida ou Inativa
1. Altere o status de uma moto de teste para `SOLD` (Vendida).
2. Acesse a URL pública da moto.
3. **O que verificar:**
   - A página responde HTTP 200 (não 404).
   - Exibe o badge destacado "Vendido / Negociado".
   - Contém a meta tag `<meta name="robots" content="noindex, follow" />`.
   - Exibe a seção de "Motos Semelhantes em Estoque".
   - A URL não aparece no `sitemap.xml`.

---

## 3. Procedimento Operacional Pós-Deploy

### 3.1 Google Search Console
1. Acesse [https://search.google.com/search-console](https://search.google.com/search-console).
2. Adicione a propriedade usando o domínio canônico (recomendado: validação via registro DNS TXT).
3. Vá no menu **Sitemaps** e envie: `https://[dominio-oficial]/sitemap.xml`.
4. Utilize a ferramenta **Inspeção de URL** para testar:
   - Homepage (`https://[dominio-oficial]/`)
   - Catálogo (`https://[dominio-oficial]/motos`)
   - Uma página de moto ativa.
5. Solicite a indexação inicial da Homepage.

---

### 3.2 Google Meu Negócio (Google Business Profile)
1. Acesse [https://business.google.com/](https://business.google.com/).
2. Reivindique ou crie o perfil da **AF Motos**.
3. Preencha os dados rigorosamente idênticos aos cadastrados no site:
   - **Nome**: `AF Motos`
   - **Categoria Principal**: `Loja de motocicletas` / `Concessionária de motos usadas`
   - **Endereço**: `Rua Milton Adolfo de Jesus, 68, Loja, São Francisco, Cabo de Santo Agostinho - PE, 54350-655`
   - **Telefone/WhatsApp**: O mesmo número oficial informado no site.
   - **Horário de Funcionamento**: Sincronizado com os horários exibidos no rodapé.
   - **Website**: URL canônica oficial.
   - **Fotos Reais**: Fachada da loja, ambiente interno e motos do estoque.
