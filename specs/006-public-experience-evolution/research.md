# Research & Technical Decisions: AF Motos — Evolução da Experiência Pública

**Feature**: `006-public-experience-evolution`
**Date**: 2026-08-22

---

## 1. Estratégia da Hero (Visibilidade, Contraste e Imagem de Fundo)

### Contexto & Problema
A Hero original possuía camadas sobrepostas de gradiente escuro (`opacity-40` a `opacity-50` com gradiente preto de 80% a 100%), tornando a fotografia da moto praticamente invisível em monitores e smartphones com brilho padrão.

### Decisão Técnica
1. **Tratamento de Camadas (Layers)**:
   - Manter a imagem de fundo com `opacity-75` a `opacity-85` para máxima nitidez da motocicleta.
   - Aplicar gradiente linear direcional escuro focado no quadrante do texto (ex.: `bg-gradient-to-r from-[#050505]/90 via-[#050505]/65 to-transparent` em desktop e `bg-gradient-to-b from-[#050505]/85 via-[#050505]/60 to-[#050505]` em mobile).
   - Manter `object-position: center 30%` para garantir que o guidão e a silhueta da moto fiquem visíveis sob qualquer proporção de tela.
   - Adicionar fallback sólido elegante (`bg-[#0d0d0d]`) caso o carregamento da imagem falhe ou demore.
2. **Cópia & CTAs**:
   - Título: "Encontre sua próxima moto."
   - Subtítulo: "Veja as motos disponíveis ou anuncie a sua com a AF Motos."
   - CTAs: "Ver motos disponíveis" (link para `/motos`) e "Anunciar minha moto" (link para `/anunciar-sua-moto`).
   - Remoção total de números fictícios de clientes/vendas e promessas não comprovadas (financiamento, laudos, pagamento imediato).

### Alternativas Consideradas
- *Fundo de vídeo HTML5*: Descartado por consumo excessivo de dados em conexões 4G/5G mobile e atraso de LCP.
- *Imagem isolada ao lado do texto (Grid de 2 colunas)*: Válido para desktop, mas consome altura excessiva em telas mobile. O fundo fotográfico com gradiente direcional oferece o melhor equilíbrio visual.

---

## 2. Estratégia dos Filtros Dinâmicos (Catálogo e QuickSearch)

### Contexto & Problema
Os componentes `quick-search.tsx` e `motorcycle-filters.tsx` utilizavam constantes fixas em código (`const BRANDS = ['Honda', 'Yamaha', 'BMW', ...]`, `PRICE_RANGES`, `YEARS`), exibindo opções de marcas que não existem no banco de dados e termos em inglês ("All").

### Decisão Técnica
1. **Cálculo Dinâmico das Facetas (Derivação Baseada em Dados Reais)**:
   - Implementar a função `getMotorcycleFilterFacets()` no arquivo [`lib/queries/motorcycles.ts`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/lib/queries/motorcycles.ts).
   - Para a escala atual do estoque (catálogo de porte local), a query consulta as motos com status ativo (`status != 'HIDDEN'`) selecionando `brand`, `model`, `category_id`, `year_model`, `price` e deriva em memória no servidor:
     - `brands`: lista ordenada alfabeticamente de marcas únicas existentes.
     - `categories`: lista de categorias com motos associadas.
     - `years`: lista decrescente de anos modelo reais.
     - `priceRange`: `{ min: number, max: number }` com base nos preços reais.
     - `priceTiers`: faixas de preço calculadas proporcionalmente aos preços cadastrados.
2. **Tradução e Internacionalização dos Filtros**:
   - `all` internamente no formulário/URL, mas renderizado na interface como:
     - "Todas as marcas"
     - "Todos os modelos"
     - "Todas as categorias"
     - "Todos os anos"
     - "Qualquer valor"
     - "Menor preço" / "Maior preço" / "Mais recentes"
3. **Sincronização na URL**:
   - Os parâmetros continuam na query string (`?brand=Honda&maxPrice=30000&minYear=2022`), permitindo compartilhamento de links de busca no WhatsApp.

### Alternativas Consideradas
- *Postgres RPC com `GROUP BY` individual*: Descartado pela simplicidade da escala atual (onde 1 query leve ou agregação direta é mais rápida, sem overhead de migrations adicionais).

---

## 3. Redesign do Card de Motos (Destaque e Catálogo)

### Contexto & Problema
O card precisa ser refinado para estética premium, altura consistente, badges em português e integração contextual direta com WhatsApp.

### Decisão Técnica
1. **Hierarquia Visual**:
   - 1. Foto principal (com `aspect-[16/10]`, `next/image` otimizado e fallback para motos sem imagem cadastrada).
   - 2. Badge de status traduzido ("Disponível", "Reservada", "Vendida", "Alugada", "Em revisão").
   - 3. Marca em Brand Gold (`#c9a44c`) + Modelo em destaque (`text-white font-extrabold`).
   - 4. Versão (se preenchida) ou omissão limpa sem texto falso.
   - 5. Grid de atributos essenciais em container escuro de alto contraste: Ano (Fabricação/Modelo), Quilometragem (`XX.XXX km`), Cilindrada (`XXXcc`).
   - 6. Preço em Reais (`R$ XX.XXX`) formatado com `tabular-nums`.
   - 7. CTA de WhatsApp com mensagem contextualizada: `Olá! Tenho interesse na moto [Marca] [Modelo] [Ano] (R$ [Preço]) anunciada no site da AF Motos.`
2. **Remoção de Dados Administrativos**:
   - Proibida a exibição de placa, histórico de custo interno ou promessas fictícias ("Laudo Cautelar Aprovado").

---

## 4. Sistema Centralizado de Toasts, Tooltips e Feedback

### Contexto & Problema
Alguns formulários usavam feedback misto, ausência de feedback acessível ou risco de múltiplos cliques.

### Decisão Técnica
1. **Toaster (Sonner) Global**:
   - Integrar o componente `Toaster` do Sonner no `RootLayout` e `PublicLayout` com tema dark, cores da marca (`#c9a44c`, emerald para sucesso, rose para erro).
   - Toasts com `role="status"` ou `role="alert"`, duração padrão de 4 segundos e opção de fechar manual.
2. **Estados de Formulários**:
   - Desabilitar botão de submissão enquanto `isSubmitting`/`loading` estiver ativo.
   - Validações com React Hook Form + Zod emitindo mensagens em português sob os respectivos campos.
   - Proibição absoluta de `window.alert()`.

---

## 5. Política de Privacidade & Remoção de Termos de Uso

### Contexto & Problema
O site brasileiro precisa de uma Política de Privacidade clara e aderente à LGPD (Lei 13.709/2018), sem exibir links quebrados ou referências desnecessárias a "Termos de Uso".

### Decisão Técnica
1. **Criação da Rota**:
   - Nova rota Server Component em [`app/(public)/politica-de-privacidade/page.tsx`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/app/%28public%29/politica-de-privacidade/page.tsx).
   - Seções: Identificação do Controlador, Dados Coletados, Finalidade (Atendimento via WhatsApp e Negociação), Armazenamento Seguro (Supabase), Compartilhamento Estrito, Direitos do Titular (LGPD Art. 18), Canal de Contato do Encarregado/DPO.
   - Placeholders editáveis destacados: `[RAZÃO SOCIAL / AF MOTOS]`, `[CNPJ / CPF]`, `[CIDADE/UF]`, `[E-MAIL DE PRIVACIDADE]`, `[DATA DE ATUALIZAÇÃO]`.
2. **Remoção de Termos de Uso**:
   - Remover links de "Termos de Uso" no [`components/layout/footer.tsx`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/layout/footer.tsx).
   - Configurar redirecionamento no `next.config.mjs` de `/termos-de-uso` e `/termos` para `/politica-de-privacidade`.

---

## 6. Unificação do Fluxo "Anuncie sua Moto" vs "Venda sua Moto"

### Contexto & Problema
Existiam duas páginas quase idênticas (`/consignar-moto` e `/venda-sua-moto`), gerando duplicidade e confusão ao usuário sobre os termos "consignação" e "venda".

### Decisão Técnica
1. **Página Principal**:
   - Criar [`app/(public)/anunciar-sua-moto/page.tsx`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/app/%28public%29/anunciar-sua-moto/page.tsx) como a rota primária e amigável.
   - Título: "Anuncie sua moto com a AF Motos" / "Quer vender sua moto?".
   - Explicação em 4 passos simples e transparentes.
   - Formulário completo com upload de fotos (preview, limite de tamanho e formatos aceitos).
2. **Compatibilidade & Redirecionamentos**:
   - As rotas legadas `/consignar-moto` e `/venda-sua-moto` realizam redirect permanente ou utilizam a mesma página/componente unificado para não quebrar links compartilhados.
3. **Persistência**:
   - Submissão via Server Action gravando em `leads` (com `type: 'SELL_MOTORCYCLE'` ou `type: 'CONSIGNMENT'`) e na tabela `sell_requests` para auditoria detalhada.

---

## 7. Locação de Motos e Solicitação de Plano Personalizado

### Contexto & Problema
A página de aluguel possuía apenas planos fixos (diária/semanal/mensal) e não permitia aos clientes solicitar cotações de prazos médios ou longos (3 meses, 6 meses, 1 ano).

### Decisão Técnica
1. **Nova Seção "Precisa alugar por mais tempo?"**:
   - Adicionar bloco na página [`app/(public)/aluguel/page.tsx`](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/app/%28public%29/aluguel/page.tsx).
   - Texto: "Se você precisa de uma moto por 6 meses, 1 ano ou outro período, fale com a gente para montarmos uma condição personalizada."
   - Formulário dedicado de proposta de locação: nome, WhatsApp, e-mail opcional, modelo/tipo pretendido, data de início, período desejado (1 mês, 2 meses, 3 meses, 6 meses, 12 meses, outro) e observações.
2. **Persistência Segura**:
   - Persistir em `leads` com `type: 'RENTAL'` e metadados detalhados de locação (`custom_period`, `start_date`, `preferred_model`).
   - Proibido criar registros antecipados na tabela `rentals` (que é restrita a contratos operacionais efetivados no painel admin).
