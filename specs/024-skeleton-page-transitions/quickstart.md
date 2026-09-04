# Quickstart & Validation Guide: Skeleton Loaders em Transições de Página

**Feature**: `024-skeleton-page-transitions`  
**Status**: Concluído  
**Date**: 2026-09-04  

---

## 1. Pré-Requisitos e Ambiente de Execução

- Node.js 20+ e npm instalados.
- Servidor de desenvolvimento Next.js em execução (`npm run dev`).
- Navegador Google Chrome / Chromium com DevTools aberto.

---

## 2. Roteiro de Validação Prática

### 2.1 Cenário 1: Transição Instantânea para o Catálogo de Motos (`/motos`)

1. Abra o navegador em `http://localhost:3000/`.
2. No DevTools do Chrome:
   - Abra a aba **Network** (Rede).
   - Configure o Throttling para **Fast 3G** ou **Slow 4G**.
3. Na barra de navegação superior, clique no link **"Estoque"** ou no botão da Home **"Ver Todas as Motos"**.
4. **Resultado Esperado**:
   - Em menos de 100ms, o esqueleto de `/motos` é desenhado na tela.
   - O cabeçalho e rodapé continuam perfeitamente estáveis.
   - Uma barra de busca/filtros cinza em formato esqueleto e uma grade com 6 cards estilizados com shimmer aparecem.
   - Quando os dados chegam, os cards reais preenchem os mesmos containers sem nenhum pulo na tela.

---

### 2.2 Cenário 2: Transição para a Página de Detalhe da Moto (`/motos/[slug]`)

1. Estando em `http://localhost:3000/motos` (com Fast 3G ativo no Network).
2. Clique no card de qualquer motocicleta.
3. **Resultado Esperado**:
   - Imediatamente aparece o esqueleto da página de detalhe:
     - Trilha de breadcrumb no topo.
     - Container da foto com proporção `aspect-[16/10]` e cantos arredondados.
     - Grade de especificações técnicas (ano, km, cilindrada, câmbio).
     - Card lateral com espaço do preço e botão de contato comercial.
   - A transição substitui os dados sem empurrar os botões ou quebrar a leitura.

---

### 2.3 Cenário 3: Validação Mobile-First (Viewport 375px - iPhone SE / 390px - iPhone 14)

1. No Chrome DevTools, ative o **Device Toolbar** (`Ctrl + Shift + M`).
2. Selecione **iPhone SE (375x667)** ou **iPhone 14 Pro (393x852)**.
3. Navegue entre `/`, `/motos`, `/motos/[slug]`, `/aluguel` e `/venda-sua-moto`.
4. **Resultado Esperado**:
   - Os skeletons ocupam 100% da largura útil sem overflow horizontal (`scroll horizontal indesejado = 0`).
   - Os cards de moto ficam em coluna única vertical e espaçamentos ergonômicos.
   - Altura do esqueleto de foto preserva o espaço real da imagem final.

---

### 2.4 Cenário 4: Medição de Cumulative Layout Shift (CLS = 0)

1. No DevTools, abra a aba **Performance** ou utilize o painel **Lighthouse**.
2. Realize uma análise de navegação da página de detalhe e catálogo.
3. **Resultado Esperado**:
   - Métrica **CLS < 0.05** (classificada como 'Good' / Verde no Core Web Vitals).
   - Ausência de eventos de "Layout Shift" reportados no console do navegador.

---

### 2.5 Cenário 5: Acessibilidade e Movimento Reduzido (`prefers-reduced-motion`)

1. No Chrome DevTools, pressione `Ctrl + Shift + P` (Command Menu).
2. Digite `Emulate CSS prefers-reduced-motion: reduce` e pressione Enter.
3. Navegue por qualquer página com skeleton.
4. **Resultado Esperado**:
   - A animação shimmer/gradiente para completamente; o esqueleto exibe um fundo estático suave e uniforme.
   - Nenhum movimento ou translação reflexiva ocorre na tela.

---

### 2.6 Cenário 6: Validação Automatizada de Tipagem e Build

Execute os comandos de verificação de sanidade do código:

```bash
# Validação de tipagem estrita
npm run typecheck

# Validação de linting e boas práticas
npm run lint
```
