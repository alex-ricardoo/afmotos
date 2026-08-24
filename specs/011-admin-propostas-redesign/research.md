# Research & Architecture Decisions: Central de Propostas e CRM (AF Motos)

## 1. Unified Data Strategy & Aggregation

- **Decision**: Manter a tabela `leads` como o hub unificado de agregação para visualização no CRM e sincronizar mutações com tabelas de origem (`sell_requests`, `consignment_requests`) através de Server Actions tipadas.
- **Rationale**: Quando um usuário envia uma proposta de venda ou consignação pública, o sistema já gera o registro em `sell_requests` e uma entrada enriquecida correspondente em `leads` com `metadata.sell_request_id` e snapshot completo de fotos e FIPE. A consulta centralizada em `leads` com mapeamento para `ProposalViewModel` garante tempo de carregamento < 200ms sem N+1 queries, simplifica a paginação/filtros e mantém ordenação cronológica estrita.
- **Alternatives Considered**: Fazer `UNION` manual ou 3 queries assíncronas separadas a cada requisição de página. Rejeitado por aumentar latência de rede, complicar ordenação por data, filtros e paginação no PostgreSQL.

## 2. Image Pipeline & Multi-Provider Resilience

- **Decision**: Unificar a extração de imagens no helper `getProposalImages(proposal)` suportando links diretos ImgBB, URLs públicas Supabase Storage e caminhos relativos legados.
- **Rationale**: Propostas públicas recentes salvam imagens no ImgBB (com URLs em `metadata.images`), enquanto cadastros antigos ou internos podem usar Supabase Storage. O helper normaliza tudo para `ProposalImage[]` com detecção de foto principal, contagem total e thumbnail seguro sem quebra caso uma URL falhe.
- **Alternatives Considered**: Fazer download/re-upload de todas as imagens antigas para um único bucket. Rejeitado para evitar complexidade e custo operacional desnecessário.

## 3. WhatsApp Deep Linking & Personalized Message Presets

- **Decision**: Utilizar o gerador unificado `generateWhatsAppLink(phone, message)` e `generateProposalWhatsAppMessage(proposal)` com sanitização de telefone para formato E.164 brasileiro (`55 + DDD + 9 dígitos`) e 4 presets de resposta rápida no detalhe: Padrão, Pedir Fotos/Docs, Agendar Visita e Contraproposta.
- **Rationale**: Permite ao vendedor responder ao cliente em 1 clique mantendo o tom comercial da AF Motos, eliminando digitação manual repetitiva e garantindo que nenhum dado sensível interno (CPF, margens internas) seja enviado.
- **Alternatives Considered**: Integração de WhatsApp API bot direto no servidor. Rejeitado por custo e complexidade neste momento; o deep link com o aplicativo oficial do WhatsApp atende perfeitamente ao time de atendimento humano da concessionária.

## 4. Status Mutation with Optimistic UI & Server Actions

- **Decision**: Implementar a alteração de status via Server Action `updateLeadStatus` com atualização otimista na interface do cliente (React `useState`) e reversão imediata com notificação Sonner Toast em caso de falha de conexão.
- **Rationale**: O vendedor obtém feedback visual instantâneo (< 50ms) ao mover o lead de status ("Novo contato" → "Em atendimento" → "Qualificado" → "Convertido"), mantendo a contagem dos indicadores em tempo real.
- **Alternatives Considered**: Recarregar a página inteira a cada mudança de status (`window.location.reload`). Rejeitado por causar cintilação e prejudicar a experiência em celulares.

## 5. Responsive Hybrid Layout (Desktop Dialog vs Mobile Bottom Sheet)

- **Decision**: Utilizar `useMediaQuery('(min-width: 768px)')` para renderizar `Dialog` amplo e imersivo no desktop e `Sheet` (Bottom Sheet) no mobile, com suporte a visualizador de imagens em tela cheia (`ImageFullscreen`).
- **Rationale**: No mobile, gavetas inferiores têm alcance ergonômico ideal para o polegar, enquanto no desktop um modal amplo de até 5 colunas aproveita o espaço horizontal para comparar a moto com a FIPE e inspecionar fotos.

## 6. Security & Row Level Security (RLS)

- **Decision**: Assegurar que todas as queries e Server Actions do painel administrativo executem no contexto autenticado do usuário admin, mantendo RLS ativado nas tabelas `leads`, `sell_requests`, `consignment_requests` e `sell_request_images`.
- **Rationale**: Impede qualquer vazamento de dados de clientes para usuários anônimos ou sem perfil administrativo na plataforma.
