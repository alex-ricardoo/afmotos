# Quickstart & Scenario Validation Guide: AF Motos Experiência Pública

**Feature**: `006-public-experience-evolution`
**Date**: 2026-08-22

---

## 1. Pré-requisitos e Inicialização Local

```bash
# 1. Instalar dependências (caso novas)
npm install

# 2. Executar servidor de desenvolvimento Next.js
npm run dev

# 3. Validar tipagem e linting
npm run typecheck
npm run lint
```

---

## 2. Cenários de Validação Ponta a Ponta

### Cenário 1: Seção Hero com Imagem Nítida e Contraste Otimizado
- **Ação**: Acessar `http://localhost:3000/` em desktop (1920x1080) e em emulação mobile (iPhone 14 / 390px).
- **Validação Esperada**:
  - A imagem fotográfica da moto na Hero é perfeitamente visível (sem opacidade excessiva).
  - O texto "Encontre sua próxima moto" e o subtítulo possuem legibilidade cristalina via gradiente direcional.
  - CTAs "Ver motos disponíveis" (leva a `/motos`) e "Anunciar minha moto" (leva a `/anunciar-sua-moto`) funcionam com 1 clique.
  - Nenhuma contagem falsa de vendas ou promessas de financiamento aparecem na tela.

---

### Cenário 2: Filtros Dinâmicos Baseados no Estoque Real do Supabase
- **Ação**: Acessar o catálogo em `http://localhost:3000/motos` e a barra de QuickSearch na Home.
- **Validação Esperada**:
  - O seletor de Marcas lista apenas as marcas realmente presentes no banco de dados (ex.: Honda, Yamaha).
  - Nenhuma marca inexistente (ex.: Ducati, Harley-Davidson) aparece se não houver motos correspondentes.
  - Todos os seletores usam labels em português ("Todas as marcas", "Todos os anos", "Qualquer valor").
  - Aplicar um filtro atualiza a URL e recarrega os cards correspondentes.
  - O botão de "Limpar Filtros" reseta o estado instantaneamente.

---

### Cenário 3: Cards de Motos com Status em Português e CTA de WhatsApp
- **Ação**: Visualizar a listagem de motos na Home e em `/motos`.
- **Validação Esperada**:
  - Cada card exibe: Foto com proporção consistente (ou fallback elegante), Marca em Brand Gold, Modelo, Ano (Fab/Mod), KM e Preço formatado em Reais (`R$`).
  - Badges de status exibem "Disponível", "Reservada", "Vendida" (sem `AVAILABLE`, `SOLD`).
  - Clicar no botão de WhatsApp abre `https://wa.me/...` com mensagem pré-preenchida contendo os dados do modelo.

---

### Cenário 4: Formulário "Anuncie sua Moto" e Redirecionamento Unificado
- **Ação**: Acessar `http://localhost:3000/anunciar-sua-moto` (e testar acesso a `/consignar-moto` e `/venda-sua-moto`).
- **Validação Esperada**:
  - As URLs legadas redirecionam para a experiência unificada `/anunciar-sua-moto`.
  - O formulário valida campos obrigatórios (nome, WhatsApp, modelo, ano).
  - Ao submeter, o botão é desabilitado (prevenindo clique duplo) e um toast de sucesso da Sonner é exibido: *"Recebemos os dados da sua moto. Vamos analisar e falar com você."*
  - O lead é gravado no Supabase com sucesso.

---

### Cenário 5: Aluguel com Solicitação de Plano Personalizado
- **Ação**: Acessar `http://localhost:3000/aluguel` e navegar até a seção "Precisa alugar por mais tempo?".
- **Validação Esperada**:
  - Exibe opções de período de 1 a 12 meses e campo para período customizado.
  - Submeter a solicitação emite toast de confirmação e persiste em `leads` com `type: 'RENTAL'`, sem criar contrato prematuro em `rentals`.

---

### Cenário 6: Página de Política de Privacidade e Remoção de Termos de Uso
- **Ação**: Rolar até o rodapé do site em qualquer página.
- **Validação Esperada**:
  - O rodapé contém o link "Política de Privacidade" apontando para `/politica-de-privacidade`.
  - Nenhuma menção a "Termos de Uso" permanece no rodapé ou no cabeçalho.
  - A página `/politica-de-privacidade` renderiza com headings semânticos, texto claro em conformidade com a LGPD e placeholders identificados (`[RAZÃO SOCIAL]`, `[CNPJ]`, `[CONTATO]`).

---

### Cenário 7: Navegação com Item Explícito "Início"
- **Ação**: Testar o menu de navegação no desktop e no drawer mobile.
- **Validação Esperada**:
  - Primeiro link da lista é "Início" apontando para `/` com indicação visual de rota ativa quando na Home.
