# Feature Specification: Skeleton Loaders em Transições de Página

**Feature Branch**: `024-skeleton-page-transitions`  
**Created**: 2026-09-04  
**Status**: Draft  
**Input**: User description: "/speckit-specify Skeleton Loaders em Transições de Página (af-motos) - Implementar skeleton loaders em todas as transições entre páginas do site principal de vendas, garantindo resposta imediata, sem layout shift (CLS), mobile-first, shimmer sutil e acessibilidade."

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Navegação Fluida no Catálogo de Motos Mobile-First (Priority: P1)

Um potencial comprador acessa a AF Motos pelo celular e toca no link "Estoque" ou "Ver Catálogo". Imediatamente após o toque (em menos de 100ms), a interface substitui a tela anterior por uma grade de skeletons reproduzindo a geometria exata do catálogo (barra de busca/filtros e cards de motocicletas com imagem em proporção 16:10, badges, títulos e valores). Quando os dados reais chegam do servidor, o conteúdo preenche os espaços sem nenhum pulo ou deslocamento visual brusco na rolagem.

**Why this priority**: A navegação da página inicial para a listagem de motos é a jornada de maior volume e conversão do e-commerce. A ausência de feedback instantâneo ou a ocorrência de layout shift em conexões móveis (3G/4G) causa sensação de lentidão e abandono precoce do site.

**Independent Test**: Pode ser testado navegando da Home (`/`) para `/motos` simulando throttling de rede (Fast 3G/Slow 4G). Deve-se verificar que o skeleton surge imediatamente, preserva a altura de cabeçalho e filtros, renderiza os cards com altura exata dos cards finais e transiciona para o conteúdo real sem deslocamento de layout (CLS = 0).

**Acceptance Scenarios**:
1. **Given** um usuário em dispositivo móvel na página inicial (`/`), **When** ele clica no link do menu ou botão "Ver Estoque" direcionando para `/motos`, **Then** o sistema exibe imediatamente a estrutura de skeleton correspondente com 100% de largura útil, cards na proporção 16:10 e shimmer sutil.
2. **Given** o skeleton da listagem de motos em exibição, **When** os dados reais das motocicletas terminam de carregar, **Then** os cards reais ocupam com precisão pixel-perfect as mesmas dimensões dos skeletons, mantendo a posição do scroll estável sem repintura ou salto de viewport.

---

### User Story 2 - Transição e Visualização Imediata no Detalhe da Moto (Priority: P1)

Um usuário navegando no catálogo de motos clica no card de uma motocicleta de seu interesse. Em vez de uma tela em branco ou spinner centralizado genérico, o usuário visualiza imediatamente a estrutura da página de detalhes: o container da galeria de fotos com aspect ratio idêntico, o bloco de preço, ano/quilometragem, tabela de especificações técnicas e o botão de ação rápida do WhatsApp.

**Why this priority**: A página de produto/detalhe (`/motos/[slug]`) é o ponto decisivo de contato onde o lead clica para falar com o consultor comercial. O carregamento com esqueleto visual contextual mantém a atenção e o engajamento do comprador na moto escolhida.

**Independent Test**: Clicar em qualquer card de moto no catálogo e verificar a transição para `/motos/[slug]`. O skeleton deve renderizar a galeria de imagens principal, o bloco de preço/reserva e a lista de especificações, eliminando spinners estáticos ou atrasos visuais perceptíveis.

**Acceptance Scenarios**:
1. **Given** um visitante selecionando uma moto na listagem, **When** a rota `/motos/[slug]` é solicitada, **Then** o layout exibe a prévia estrutural da galeria (aspect-ratio de foto idêntico ao carrossel real), bloco de título, valor e botões de contato.
2. **Given** a página de detalhe recebendo os dados do veículo, **When** a renderização do conteúdo for concluída, **Then** nenhuma seção da página desloca a posição do botão de ação ou da galeria.

---

### User Story 3 - Cobertura Estrutural nas Demais Rotas Comerciais e Institucionais (Priority: P2)

O cliente ou parceiro navega entre as seções comerciais da plataforma, tais como Locação (`/aluguel`), Venda/Consignação de Motos (`/venda-sua-moto`, `/consignar-moto`), Histórico Veicular (`/historico-veicular`) e Institucional (`/sobre`). Cada transição apresenta um esqueleto correspondente à arquitetura da respectiva página (seções de cards, formulários de proposta com inputs esqueleto, tabelas de planos).

**Why this priority**: Garante consistência em 100% da experiência de navegação do site público, eliminando discrepâncias onde algumas páginas carregavam com spinner clássico e outras com esqueleto moderno.

**Independent Test**: Percorrer cada link do header e footer público (`/aluguel`, `/venda-sua-moto`, `/historico-veicular`, `/sobre`) e confirmar a presença de feedback esqueleto consistente para cada seção.

**Acceptance Scenarios**:
1. **Given** um usuário clicando no menu "Aluguel", **When** a rota `/aluguel` estiver sendo carregada, **Then** o usuário visualiza o esqueleto dos planos de locação e cards de motos para alugar.
2. **Given** um usuário navegando para páginas de avaliação/consignação (`/venda-sua-moto`), **When** a rota estiver em transição, **Then** o layout apresenta a réplica em skeleton do formulário de etapas e chamadas de benefícios.

---

### User Story 4 - Animação Confortável, Anti-Flicker e Acessibilidade Inclusiva (Priority: P2)

Um usuário com sensibilidade a movimentos (ou utilizando leitor de telas / preferências de acessibilidade do sistema operacional) navega pelo site. A animação de shimmer é sutil, respeitando `prefers-reduced-motion` ao desativar movimentos contínuos. Para conexões ultrarrápidas, a transição não causa piscadas desconfortáveis na visão do usuário, e leitores de tela são formalmente notificados que o conteúdo está em processo de atualização estruturada.

**Why this priority**: Acessibilidade e conforto visual são premissas de um produto digital premium. Animações exageradas ou piscadas rápidas (<50ms) causam desconforto cognitivo e cansaço visual.

**Independent Test**: Ativar a flag do sistema operacional `prefers-reduced-motion: reduce` e testar navegação; o skeleton deve permanecer estático ou com pulso suave sem translação de gradiente. Testar com leitor de tela (NVDA/VoiceOver) verificando anúncio de status com `aria-busy="true"` e `role="status"`.

**Acceptance Scenarios**:
1. **Given** um dispositivo com preferência de movimento reduzido ativada, **When** qualquer skeleton loader for exibido, **Then** a animação de deslocamento do gradiente (shimmer) é desativada, exibindo uma tonalidade neutra estática.
2. **Given** um usuário navegando com tecnologia assistiva (leitor de tela), **When** uma transição de página com skeleton for disparada, **Then** o container anuncia adequadamente o estado de carregamento com marcação semântica acessível (`role="status"` e `aria-busy="true"`).

---

### User Story 5 - Resiliência em Conexões Móveis Degradadas (Priority: P3)

Um usuário em trânsito com oscilação severa de sinal (3G instável) realiza uma navegação que demora mais de 10 segundos para responder. O esqueleto permanece estável em tela sem falhar, evitando que o usuário pense que a página travou ou que a tela quebrou, fornecendo um indicativo discreto de resiliência após tempo prolongado.

**Why this priority**: Usuários mobile em redes celulares brasileiras enfrentam variações frequentes de conectividade em rodovias ou áreas com pouca cobertura.

**Independent Test**: Simular atraso artificial de 10 segundos na resposta de rota e verificar estabilidade contínua do esqueleto sem quebras de layout.

**Acceptance Scenarios**:
1. **Given** uma requisição de página que excede o tempo típico de resposta (>8s), **When** o skeleton continuar ativo, **Then** o sistema mantém a geometria intacta, sem tela branca ou encerramento abrupto.

---

### Edge Cases

- **Cache instantâneo / Navegação Back-Forward (bfcache)**: Quando a página já estiver pré-carregada ou em cache local do navegador, a transição deve ocorrer de forma limpa sem exibir um "flash" de esqueleto por menos de um frame perceptível.
- **Redimensionamento de tela ou rotação de orientação no celular (Portrait para Landscape)**: O esqueleto deve se adaptar fluidamente ao grid responsivo sem estourar as margens laterais.
- **Imagens externas com carregamento assíncrono**: O container reservado do esqueleto deve possuir `aspect-ratio` fixo idêntico ao container de imagem final para que o carregamento da mídia fotográfica não empurre o restante do texto para baixo.
- **Modais e Abas client-side sem troca de rota URL**: Seções internas dinâmicas (ex.: troca de abas de fotos ou simulação de financiamento) devem conter fallbacks locais de skeleton contextual, preservando a coerência visual.

---

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: O sistema DEVE disponibilizar um componente base reutilizável de esqueleto (`Skeleton`) com variantes pré-configuradas para representação de blocos estruturais: texto (`text`), imagem (`image`), card (`card`) e lista (`list`).
- **FR-002**: O componente de esqueleto DEVE suportar classes de customização dimensional (largura, altura, border-radius e aspect-ratio) para espelhar com exatidão o componente real correspondente.
- **FR-003**: Toda rota pública de vendas (`/`, `/motos`, `/motos/[slug]`, `/aluguel`, `/venda-sua-moto`, `/consignar-moto`, `/historico-veicular`, `/sobre`) DEVE possuir um arquivo de carregamento estruturado (`loading.tsx`) dedicado ou herdado com esqueleto sob medida.
- **FR-004**: O esqueleto da listagem de motos (`/motos`) DEVE reproduzir a barra de filtros superiores e uma grade responsiva de cards de veículos (1 coluna no mobile, 2 em tablets, 3 no desktop).
- **FR-005**: O esqueleto da página de detalhe da moto (`/motos/[slug]`) DEVE reproduzir com precisão a galeria fotográfica, o cabeçalho com nome e valor, o painel de especificações e o espaço do botão de contato comercial.
- **FR-006**: Todos os containers de imagem nos esqueletos DEVEM possuir a mesma proporção geométrica (`aspect-ratio`) utilizada no componente de exibição final, impedindo qualquer Layout Shift.
- **FR-007**: A animação dos esqueletos DEVE utilizar efeito visual de brilho/shimmer suave e sutil com ciclo entre 1.0s e 1.5s, empregando paleta neutra compatível com o tema escuro da marca AF Motos.
- **FR-008**: O sistema DEVE desativar a translação do gradiente animado quando o usuário tiver a diretiva `prefers-reduced-motion: reduce` habilitada no sistema operacional.
- **FR-009**: Os esqueletos DEVEM conter atributos semânticos de acessibilidade, incluindo `role="status"`, `aria-busy="true"` e rótulo acessível explicativo para tecnologias assistivas.
- **FR-010**: Os esqueletos em ambiente mobile DEVEM ocupar 100% da largura útil disponível (`w-full`), mantendo touch-targets e espaçamentos ergonômicos compatíveis com a navegação móvel.
- **FR-011**: A renderização dos arquivos de carregamento DEVE ser puramente declarativa no lado do servidor/cliente, sem dependências de chamadas assíncronas bloqueantes no próprio componente de fallback.
- **FR-012**: O sistema DEVE garantir que a substituição do esqueleto pelo conteúdo real ocorra sem saltos verticais na rolagem (Cumulative Layout Shift < 0.05).

---

### Key Entities

- **Skeleton Primitive**: Elemento atômico de apresentação que encapsula tokens visuais de carregamento, gradiente de shimmer, acessibilidade (`aria-busy`, `role="status"`) e regras de redução de movimento.
- **Route Loading Schema**: Composição de esqueletos específicos que reflete a árvore de layout de cada página comercial (Catálogo, Detalhes, Planos de Aluguel, Propostas e Institucional).
- **Page Transition State**: Estado transitório do ciclo de vida de navegação em que o cliente aguarda o streaming dos dados e renderiza os placeholders enquanto preserva a integridade espacial da página.

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: O Cumulative Layout Shift (CLS) em todas as páginas públicas de vendas durante a transição do esqueleto para o conteúdo final DEVE permanecer inferior a **0.05** (classificado como excelente no Google Core Web Vitals).
- **SC-002**: O tempo perceptível de reação visual ao toque ou clique em links internos DEVE ser inferior a **100ms**, apresentando a geometria preliminar da tela de destino imediatamente.
- **SC-003**: 100% das rotas públicas comerciais do site (`/`, `/motos`, `/motos/[slug]`, `/aluguel`, `/venda-sua-moto`, `/consignar-moto`, `/historico-veicular`, `/sobre`) DEVEM contar com apresentação estruturada de esqueleto sem telas em branco ou spinners globais isolados.
- **SC-004**: Redução para **0%** de quebras ou desvios de largura horizontal em telas de dispositivos móveis comuns (360px a 430px de viewport).
- **SC-005**: 100% de conformidade com preferências de acessibilidade de movimento (`prefers-reduced-motion`), garantindo que usuários com sensibilidade visual não sejam expostos a animações de alta frequência.
- **SC-006**: Aumento da percepção de velocidade e retenção de usuários mobile nas transições entre a home e os detalhes das motos no catálogo.

---

## Assumptions

- O projeto utiliza a arquitetura Next.js App Router, permitindo a convenção de arquivos `loading.tsx` automáticos com streaming via React Suspense.
- O tema principal da AF Motos é escuro (dark theme com tons de zinco, preto e acentos dourados/âmbar), exigindo que a paleta de cores dos skeletons adote tons neutros refinados (ex.: bases em `zinc-900`/`zinc-800` com shimmer em `zinc-700`/`zinc-600` ou toques sutis) para manter elegância e discrição.
- Transições de navegação interna utilizam componentes `<Link>` nativos do Next.js com prefetch automático padrão habilitado.
- Os dados reais das rotas são providos pelo Supabase e por queries do servidor, que já possuem caching e revalidação configurados.
