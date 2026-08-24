# Research & Architecture Decisions: OCR Inteligente com Google Gemini

**Feature**: `012-motorcycle-ocr-gemini`  
**Date**: 2026-08-23  
**Status**: Completed  

---

## 1. Initial Audit Findings (Auditoria Inicial de Segurança e Arquitetura)

| Área | Arquivo / Recurso | Situação Atual | Risco Identificado | Solução Arquitetural |
|---|---|---|---|---|
| **Tela de Cadastro** | `app/admin/(protected)/motos/nova/page.tsx` & `components/admin/motorcycle-form.tsx` | Formulário wizard em 4 etapas (Passo 1: Ficha, 2: Preço/FIPE, 3: Descrição, 4: Fotos). Preenchimento manual + FIPE combo. | Cadastro de dados técnicos é demorado e suscetível a erros de digitação de Chassi/RENAVAM no pátio. | Adicionar componente de OCR no topo do Passo 1 com captura de câmera móvel (`capture="environment"`) e anexo de arquivo, preenchendo o formulário sob demanda. |
| **Segurança de Chaves** | `.env.example`, `.gitignore`, `process.env` | Nenhuma chave Gemini exposta. Variáveis privadas isoladas no servidor. | Risco de desenvolvedor expor `NEXT_PUBLIC_GEMINI_API_KEY` ou fazer chamadas Gemini no client bundle. | Forçar `GEMINI_API_KEY` exclusivamente em variáveis server-side. Chamar Gemini unicamente via Route Handler protegido (`/api/admin/motorcycles/ocr`). |
| **Autenticação & Autorização** | `lib/supabase/server.ts`, `admin_profiles`, `is_admin()` | Middleware e helpers verificam sessão Supabase e tabela `admin_profiles`. | Usuário anônimo ou visitante comum acionar rota de OCR gerando custos de API e vazamento. | O Route Handler valida sessão com `supabase.auth.getUser()` e perfil em `admin_profiles` (`role in ('admin', 'super_admin')` ou `is_admin()`), retornando 401/403. |
| **Privacidade do Documento** | Galeria de imagens (`motorcycle_images`) | Fotos da moto são enviadas via ImgBB/Supabase no Passo 4. | Foto do CRLV/CRV (que contém dados do antigo proprietário) ser salva na galeria pública do site. | A imagem do documento é **transitória** (recebida no Route Handler em memória via FormData, enviada em base64/inlineData para o Gemini e descartada sem gravar no banco de fotos da moto). |
| **Integridade de Dados** | `public.motorcycles` | Tabela possui `license_plate`, `renavam`, `chassi`, `brand`, `model`, `year_manufacture`, `year_model`, etc. | Alucinações da IA gravarem dados incorretos automaticamente no banco de dados. | **Human-in-the-loop obrigatório**: o OCR preenche apenas o formulário Client no navegador com badges de alerta; o salvamento continua sendo feito manualmente pelo administrador no Passo 4. |

---

## 2. Technical Decisions & Trade-offs

### Decisão 1: Abordagem de Integração com Google Gemini
- **Decisão**: Utilizar chamada REST direta com payload estruturado e `response_mime_type: "application/json"` para a API oficial do Google Gemini (`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent` / `gemini-1.5-flash`) via `fetch()` nativo no Node.js / Next.js Server Route Handler.
- **Racional**:
  - Evita dependências pesadas adicionais no `package.json`.
  - Controle total de timeout com `AbortController` (15 segundos).
  - Suporte nativo a envio de imagem base64 (`inline_data`) e JSON Schema estrito.
- **Alternativas Rejeitadas**:
  - *Chamar Gemini direto no navegador*: Rejeitada categoricamente por violar a Constituição de Segurança (exposição da chave privada de API).
  - *SDK de terceiros não oficial*: Rejeitada por risco de manutenção e dependência desnecessária.

### Decisão 2: Protocolo de Captura Mobile e Upload
- **Decisão**: Utilizar `<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" />` para a câmera traseira do celular e `<input type="file" accept="image/jpeg,image/png,image/webp" />` para anexar arquivos.
- **Racional**:
  - Funciona nativamente em iOS (Safari/Chrome) e Android (Chrome/Edge/Firefox) sem exigir permissões complexas de WebRTC/MediaStream.
  - Oferece preview imediato no cliente antes do upload.
  - Validação estrita de tamanho (máximo 10 MB) e MIME type tanto no cliente quanto no servidor.
- **Alternativas Rejeitadas**:
  - *WebRTC custom camera stream*: Adiciona complexidade excessiva, problemas com orientações de tela e permissões móveis.

### Decisão 3: Schema Estruturado e Normalização
- **Decisão**: O prompt do Gemini instrui a IA a retornar estritamente um JSON com campos em snake_case ou camelCase padronizados, pontuação de confiança (0.0 a 1.0) por campo e lista de `warnings`. A resposta é validada com Zod (`MotorcycleOcrResponseSchema`) antes de retornar ao cliente.
- **Racional**:
  - Zod garante Type Safety em tempo de execução, descartando dados mal formatados ou alucinações.
  - Normalizadores sanitizam placa (padrão Mercosul/Cinza em maiúsculas sem traço), RENAVAM (11 dígitos com zeros à esquerda), Chassi (17 caracteres maiúsculos) e cilindrada (número inteiro).
- **Alternativas Rejeitadas**:
  - *Texto livre / Markdown parse*: Frágil a inconsistências do modelo.

### Decisão 4: Política de Não Sobrescrita Sem Confirmação
- **Decisão**: Se o administrador já digitou campos manualmente e aciona o OCR, o componente detecta quais campos possuem valores conflitantes e exibe um diálogo de confirmação amigável antes de substituir.
- **Racional**:
  - Evita perda acidental de correções manuais já realizadas pelo operador.
  - Oferece total transparência e controle na experiência do usuário.

---

## 3. Gemini Prompt Specification

```text
Você é um sistema de OCR e extração estruturada de dados veiculares para documentos brasileiros de motocicletas (CRLV - Certificado de Registro e Licenciamento de Veículo, CRV físico ou digital).

Analise a imagem do documento fornecido e extraia com máxima precisão os dados cadastrais da motocicleta.

Regras Estritas:
1. Extraia APENAS o que estiver claramente legível no documento.
2. NUNCA invente ou adivinhe informações ausentes ou ilegíveis. Se um campo não estiver visível ou legível, retorne null.
3. Diferencie rigorosamente "Ano de Fabricação" (ANO FAB) de "Ano do Modelo" (ANO MOD).
4. No RENAVAM, preserve todos os dígitos e eventuais zeros à esquerda como string.
5. No CHASSI (VIN), preserve a sequência exata de 17 caracteres alfanuméricos em maiúsculas.
6. Na PLACA, extraia a combinação alfanumérica completa sem traços ou espaços.
7. Na CILINDRADA (CM3 / CC), extraia apenas o valor numérico inteiro da capacidade volumétrica do motor.
8. No COMBUSTÍVEL, classifique conforme: 'gasolina', 'etanol', 'flex', 'eletrico', 'diesel' ou null.
9. Atribua um valor numérico de confiança entre 0.0 (incerto) e 1.0 (alta nitidez) para cada campo extraído.
10. Se houver rasura, corte, desfoque ou ilegibilidade em qualquer campo, adicione uma mensagem clara no array de "warnings".
11. Retorne ESTRITAMENTE o JSON estruturado conforme o schema solicitado, sem blocos de texto ou explicações adicionais fora do JSON.
```

---

## 4. Security & Privacy Assurance Matrix

| Requisito de Segurança | Mecanismo de Garantia | Verificação |
|---|---|---|
| **Chave Gemini Segura** | `GEMINI_API_KEY` apenas em `.env.local` / Environment Variables da Vercel. Não usar `NEXT_PUBLIC_`. | Grep no build e CI garante que não existe no bundle cliente. |
| **Proteção de Rota** | `/api/admin/motorcycles/ocr` valida sessão de usuário e perfil de administrador com Supabase. | Retorna 401 para anônimos e 403 para não-admins. |
| **Descarte de Imagem** | A imagem do documento é recebida em buffer temporário na memória do servidor e nunca gravada no Storage ou banco de dados. | Storage bucket `motorcycle-images` recebe apenas as fotos comerciais enviadas no Passo 4. |
| **Prevenção de DoS / Abuso** | Limite de payload (10 MB), timeout de 15s e validação de MIME type no servidor. | Arquivos inválidos são rejeitados com HTTP 400 antes da chamada ao Gemini. |
| **Logs Sanitizados** | Logs de telemetria registram apenas eventos (`ocr_processed`, `duration_ms`, `success: boolean`), omitindo imagens e dados pessoais. | Nenhum dado confidencial ou imagem em base64 é logado. |
