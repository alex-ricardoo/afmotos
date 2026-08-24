# Quickstart & Validation Guide: Venda sua Moto para a AF Motos

**Feature**: `013-venda-sua-moto`  
**Date**: 2026-08-23  
**Status**: Ready

Este guia descreve os cenários de teste e validação ponta a ponta para garantir o correto funcionamento da página pública `/venda-sua-moto`, do simulador FIPE e da integração com o painel administrativo.

---

## 1. Pré-requisitos & Ambiente

1. Servidor de desenvolvimento rodando: `npm run dev`.
2. Variáveis de ambiente configuradas no `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `IMGBB_API_KEY`).
3. Migration aplicada no banco de dados.

---

## 2. Cenários de Validação

### Cenário 1: Navegação Inicial a partir da Home (`/`)

1. Abra o navegador em `http://localhost:3000/`.
2. Role até a seção de serviços no card **"Venda sua Moto pra Nós"**.
3. Clique em **"Quero Vender Minha Moto"**.
4. **Resultado Esperado**: O usuário é direcionado para `http://localhost:3000/venda-sua-moto`, visualizando o Hero com identidade própria de compra direta, o Stepper em 5 etapas e os cards de confiança.

---

### Cenário 2: Preenchimento da Moto & Consulta / Simulação FIPE

1. Na etapa 1 de `/venda-sua-moto`:
   - Selecione a marca: `Honda`.
   - Selecione o modelo: `CG 160 Fan`.
   - Selecione o ano: `2023`.
   - Informe a quilometragem: `25000`.
   - Clique em **"Avançar para Simulação"**.
2. Na etapa 2 (Simulador FIPE):
   - Verifique a exibição do valor de referência oficial FIPE (ex: `R$ 17.800,00`) e do período de referência.
   - Clique nos percentuais de simulação (`70%`, `80%`, `85%`, `90%`, `95%`, `100%`).
   - Verifique que o valor estimado atualiza instantaneamente com a formatação `R$ XX.XXX,XX`.
   - Digite uma expectativa do proprietário (ex: `16500`).
   - Verifique a presença visível da advertência de que a proposta final depende de avaliação física.
   - Clique em **"Avançar para Dados de Contato"**.

---

### Cenário 3: Dados do Proprietário e Upload de Fotos

1. Na etapa 3 (Contato):
   - Preencha o Nome Completo: `Carlos Eduardo da Silva`.
   - Preencha o WhatsApp: `81988776655`.
   - Selecione a Cidade: `Caruaru`.
   - Clique em **"Avançar para Fotos"**.
2. Na etapa 4 (Fotos):
   - Arraste ou selecione até 3 fotos de teste.
   - Verifique a exibição das miniaturas e remova 1 foto para testar a exclusão.
   - Clique em **"Avançar para Revisão"**.

---

### Cenário 4: Revisão, Submissão e Tela de Sucesso

1. Na etapa 5 (Revisão):
   - Verifique se todos os dados aparecem corretamente agrupados (Moto, FIPE, Simulação, Contato, Fotos).
   - Marque a caixa de confirmação da veracidade das informações.
   - Clique em **"Enviar proposta para a AF Motos"**.
2. **Resultado Esperado**:
   - O botão exibe estado de loading e fica desabilitado.
   - A tela de sucesso é exibida com mensagem de confirmação, dados resumidos e CTA para atendimento rápido via WhatsApp.

---

### Cenário 5: Recepção e Ações no Painel Administrativo (`/admin/propostas`)

1. Acesse `http://localhost:3000/admin/propostas` (autenticado como administrador).
2. Localize a proposta recém-enviada por "Carlos Eduardo da Silva".
3. Verifique:
   - Badge "Venda de moto" / "Venda para a AF Motos".
   - Valor FIPE e valor estimado em destaque.
   - Clique para abrir a gaveta de detalhes (`ProposalDetail`).
   - Inspecione as fotos enviadas e a simulação FIPE detalhada.
   - Clique em **"Conversar no WhatsApp"** e verifique a mensagem contextual gerada.
   - Altere o status da proposta para **"Em atendimento"** (`CONTACTED`) e confirme o toast de sucesso e persistência imediata.

---

## 3. Validação de Qualidade de Código

Execute no terminal:

```bash
npm run lint
npm run typecheck
npm run build
```

**Resultado Esperado**: Todos os comandos devem finalizar com status de saída `0` sem avisos ou erros impeditivos.
