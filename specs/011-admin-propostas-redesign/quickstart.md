# Quickstart & Validation Guide: Central de Propostas e CRM (AF Motos)

## 1. Prerequisites

- Node.js 20+ e npm instalados.
- Servidor de desenvolvimento Next.js em execução (`npm run dev`).
- Acesso administrativo à rota `/admin/propostas`.

## 2. Test Scenarios

### Scenario 1: Acesso à Central de Propostas e Visualização em Cards

1. Acesse o painel administrativo em `http://localhost:3000/admin/propostas`.
2. Verifique se os 4 cards de métricas no topo ("Total de Contatos", "Novos Leads", "Em Atendimento", "Convertidos") exibem números reais da base de dados.
3. Observe se as propostas são renderizadas em cards estilizados no padrão escuro com dourado AF Motos, com fotos de capa e badges temáticas.

### Scenario 2: Filtros e Busca Rápida

1. Na barra de ferramentas, digite o nome de um cliente ou modelo de moto no campo de busca.
2. Verifique a filtragem em tempo real sem necessidade de pressionar Enter.
3. Clique em uma das abas de status ("Novos Leads", "Em atendimento", "Convertidos") e confira se a listagem filtra instantaneamente.
4. Alterne o modo de exibição entre "Cards" e "Tabela".

### Scenario 3: Atendimento e Abertura do WhatsApp

1. Em qualquer card de proposta, clique no botão "Falar no WhatsApp".
2. Verifique se a aba do WhatsApp Web / App é aberta com o número do cliente formatado (`55...`) e a mensagem pré-preenchida com o nome do cliente e a moto de interesse.
3. Clique no botão de cópia de telefone no card e verifique se o toast "Telefone copiado!" é disparado.

### Scenario 4: Alteração Otimista de Status

1. No rodapé do card, clique no dropdown de status e selecione "Qualificado" ou "Em atendimento".
2. Observe se o status visual e o ponto colorido mudam instantaneamente (< 50ms) e o toast de sucesso é exibido.
3. Recarregue a página (F5) para confirmar a persistência do status no Supabase.

### Scenario 5: Modal de Detalhes e Galeria de Fotos

1. Clique no corpo de qualquer card de proposta.
2. No desktop, verifique a abertura do Dialog amplo de 2 colunas com dados do cliente, especificações da moto, comparativo percentual FIPE, histórico da mensagem e templates de resposta WhatsApp.
3. Reduza a janela para largura mobile (< 768px) e verifique a abertura do Bottom Sheet adaptativo.
4. Se a proposta possuir fotos, clique em uma miniatura para testar a ampliação no visualizador em tela cheia (`ImageFullscreen`).

## 3. Automated Quality Verification

Execute a suíte de verificação:

```bash
npm run typecheck
npm run lint
```
