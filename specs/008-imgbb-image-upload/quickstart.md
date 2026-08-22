# Quickstart & Validation Guide: Migração de Uploads para ImgBB

**Feature**: `008-imgbb-image-upload`  
**Date**: 2026-08-22  
**Status**: Ready

---

## 1. Pré-requisitos & Configuração

1. **Configurar variável de ambiente**:
   No arquivo `.env.local`:
   ```env
   IMGBB_API_KEY=your_actual_imgbb_api_key_here
   ```
2. **Executar a migration SQL**:
   Executar o script `supabase/migrations/00024_add_external_image_metadata.sql` no Supabase SQL Editor ou via CLI.

---

## 2. Cenários de Validação Ponta a Ponta

### Cenário 1: Upload com ImgBB Operacional (Caminho Feliz Admin)
1. Acessar o painel administrativo em `/admin/motos`.
2. Abrir uma moto existente para edição (`/admin/motos/[id]/editar`).
3. Anexar uma foto JPEG/PNG de teste.
4. **Resultado Esperado**:
   - Foto é enviada com sucesso.
   - Banco de dados registra `provider = 'imgbb'`, `public_url = 'https://i.ibb.co/...'` e `storage_path = NULL`.
   - Foto carrega no preview e no catálogo público sem erros de Next Image.

### Cenário 2: Fallback Transparente quando ImgBB Falha ou Chave Ausente
1. Temporariamente comentar a variável `IMGBB_API_KEY` em `.env.local` ou simular chave inválida.
2. Anexar uma foto na edição da moto.
3. **Resultado Esperado**:
   - Upload conclui com sucesso via Supabase Storage fallback.
   - Banco de dados registra `provider = 'supabase'`, `storage_path = 'motorcycles/[id]/[uuid].ext'` e `public_url = 'https://...supabase.co/...'`.
   - Usuário recebe toast de sucesso sem mensagens assustadoras de erro técnico.

### Cenário 3: Formulário Público de Anúncio (`/anunciar-sua-moto`)
1. Acessar `/anunciar-sua-moto` como visitante não autenticado.
2. Preencher os dados obrigatórios e anexar 2 fotos da moto.
3. Clicar em "Enviar Anúncio".
4. **Resultado Esperado**:
   - Fotos são validadas e enviadas via Server Action para o ImgBB (ou fallback Supabase).
   - Proposta é gravada na tabela `leads` / `sell_requests` com as URLs das fotos.
   - Mensagem de sucesso amigável é exibida.

### Cenário 4: Retrocompatibilidade com Fotos Antigas do Supabase
1. Acessar a página pública da loja `/motos` ou detalhe de uma moto cadastrada antes da migração.
2. **Resultado Esperado**:
   - Fotos antigas armazenadas no bucket Supabase continuam renderizando perfeitamente sem links quebrados.

---

## 3. Validação de Qualidade e Segurança

Execute no terminal:
```bash
npm run lint
npm run typecheck
npm run build
```
- Verificar que `process.env.IMGBB_API_KEY` não está presente no bundle client de produção.
- Verificar que não há erros de tipos no TypeScript strict mode.
