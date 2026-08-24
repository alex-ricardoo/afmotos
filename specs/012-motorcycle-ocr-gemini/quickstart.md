# Quickstart & Verification Guide: OCR de Documentos de Motos

**Feature**: `012-motorcycle-ocr-gemini`  
**Date**: 2026-08-23  
**Status**: Ready  

---

## 1. Setup & Environment Configuration

1. Obtenha uma chave gratuita da API do Google Gemini em [Google AI Studio](https://aistudio.google.com/).
2. Adicione ao seu arquivo `.env.local`:
   ```env
   GEMINI_API_KEY=AIzaSy...
   ```
3. Certifique-se de que a variável **NUNCA** possui o prefixo `NEXT_PUBLIC_`.
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

---

## 2. Manual Verification Workflow

### Teste 1: Fluxo Completo de Upload e Preenchimento Automático
1. Acesse `/admin/login` e faça login com credenciais de administrador.
2. Navegue até `/admin/motos/nova`.
3. No topo do **Passo 1 (Ficha Técnica & Identificação)**, localize o card **"Preenchimento inteligente por documento"**.
4. Clique em **"Anexar documento"** e selecione uma imagem de CRLV/CRV válida.
5. Verifique o preview imediato da imagem, com nome do arquivo, tamanho e opções de trocar/remover.
6. Clique no botão **"Ler documento"**.
7. Observe o estado de loading com texto indicativo (*"Lendo documento com IA..."*).
8. Ao concluir:
   - Verifique se os campos correspondentes (Marca, Modelo, Versão, Ano Fab, Ano Mod, Placa, RENAVAM, Chassi, Cor, Combustível, Cilindrada) foram preenchidos.
   - Verifique a presença do badge/ícone de identificação assistida ao lado dos campos preenchidos.
   - Verifique que a moto **NÃO** foi salva no banco de dados automaticamente.

### Teste 2: Câmera Mobile (Dispositivo Móvel)
1. Acesse `/admin/motos/nova` pelo smartphone ou simulador de dispositivo móvel.
2. Clique no botão **"Tirar foto"**.
3. Verifique que o app aciona o seletor nativo da câmera traseira (`capture="environment"`).
4. Fotografe o documento e confirme o envio.
5. Verifique a renderização do preview e o acionamento do OCR.

### Teste 3: Proteção de Dados Preexistentes (Detecção de Conflitos)
1. Digite manualmente uma placa e cor no formulário (ex.: Placa: `AAA-0000`, Cor: `Azul`).
2. Anexe um documento que contenha dados diferentes (ex.: Placa: `ABC-1D23`, Cor: `Preta`).
3. Clique em **"Ler documento"**.
4. Verifique que o modal de confirmação é exibido, apontando os campos divergentes.
5. Teste as opções de substituição e verifique se o comportamento respeita a escolha do operador.

### Teste 4: Isolamento e Privacidade de Dados
1. Após a leitura do documento no Passo 1, avance até o Passo 4 (Fotos do Veículo).
2. Verifique que a galeria de fotos da moto **NÃO** contém a imagem do documento veicular.
3. Anexe fotos reais da motocicleta na galeria e clique em **"Cadastrar moto"**.
4. Acesse a vitrine pública (`/motos/[slug]`) e verifique que apenas as fotos reais aparecem.

---

## 3. Automated Validation & Quality Checks

Execute os comandos de validação do repositório:

```bash
npm run lint
npm run typecheck
npm run build
```
