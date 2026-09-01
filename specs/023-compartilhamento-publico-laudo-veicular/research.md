# Technical & Security Research: Compartilhamento Público de Laudos Veiculares

**Feature Directory**: `specs/023-compartilhamento-publico-laudo-veicular`  
**Created**: 2026-09-01  
**Status**: Approved Architecture Decisions  

---

## 1. Decisões Arquiteturais e de Segurança

### Decisão 1: Token Criptográfico de Alta Entropia vs. Hash Previsível de ID

- **Decision**: Utilizar tokens opacos gerados no servidor com 256 bits de entropia criptográfica (`crypto.randomBytes(32).toString('base64url')`), com prefixo identificador `vt_` (ex: `vt_7d9KxL2mQp9vR...`).
- **Rationale**: 
  - Hashes derivados de IDs sequenciais (como `md5(id)` ou `sha256(id + salt_fraco)`) ou UUIDs sequenciais são vulneráveis a ataques de dicionário, rainbow tables e engenharia reversa caso o salt ou padrão vazem.
  - Um token aleatório de 256 bits oferece $2^{256}$ combinações possíveis, tornando a adivinhação por força bruta matematicamente impossível mesmo sob bilhões de tentativas por segundo.
  - O formato `base64url` é seguro para URLs sem necessidade de encoding adicional (`+` vira `-` e `/` vira `_`, sem caracteres `=` de padding).
- **Alternatives Considered**:
  - *IDs sequenciais diretos (`/laudo/123`)*: Rejeitado por permitir enumeração trivial de todos os laudos do sistema.
  - *UUIDv4 direto na URL (`/laudo/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11`)*: Rejeitado porque UUIDv4 pode ser inferido ou expor metadados internos se o ID do banco for o mesmo do link.
  - *JWT assinado na URL*: Rejeitado por ser longo demais, expor payload interno em base64 e dificultar a revogação instantânea sem blacklist no servidor.
- **Consequences**: Links com aproximadamente 46 caracteres, seguros, fáceis de compartilhar por WhatsApp e imunes a enumeração.

---

### Decisão 2: Persistência Exclusiva do Hash do Token (`token_hash`) no Banco

- **Decision**: O banco de dados persistirá **apenas o SHA-256** do token (`token_hash = sha256(token)`). O token puro será retornado uma única vez para o administrador no momento da geração e nunca gravado em disco ou banco.
- **Rationale**:
  - Segue o mesmo padrão de segurança adotado pela indústria para API keys e senhas (como no GitHub, Stripe e Supabase Auth).
  - Em caso de vazamento inadvertido de backup, dump SQL ou invasão de leitura no banco, nenhum invasor conseguirá reconstruir os links públicos válidos.
  - A busca na rota pública calcula o hash SHA-256 do token recebido e pesquisa pelo campo indexado `token_hash`.
- **Alternatives Considered**:
  - *Armazenar o token em texto puro no banco*: Rejeitado por expor os links de clientes em caso de visualização administrativa não autorizada ou exportação do banco.
  - *Criptografia simétrica bidirecional (AES-256)*: Rejeitada por adicionar complexidade de gestão de chaves mestre desnecessariamente, visto que o servidor nunca precisa converter o hash de volta para o token.
- **Consequences**: Se o admin perder o link copiado, ele poderá gerar um novo link (revogando o anterior) com total segurança.

---

### Decisão 3: Renderização Server-Side (Next.js Server Components)

- **Decision**: A página pública do laudo (`/laudos/veicular/[shareToken]`) será implementada como um **Server Component** assíncrono que consulta o banco no backend, valida o `token_hash` e injeta diretamente o DTO sanitizado na renderização.
- **Rationale**:
  - Elimina a necessidade de expor credenciais do Supabase ou service role keys no bundle do navegador.
  - Impede que o cliente acesse endpoints REST genéricos do Supabase (`supabase.from('vehicle_report_shares').select('*')`).
  - Permite gerar metadados de privacidade (`robots: noindex, nofollow`) dinamicamente antes do envio do HTML ao navegador.
  - Carregamento inicial ultrarrápido (FCP/LCP excelentes em conexões 4G/3G móveis).
- **Alternatives Considered**:
  - *Página Client-Side com SPA fetching*: Rejeitada por expor consultas via API e permitir inspeção de requisições de rede com potenciais vazamentos de payload.
- **Consequences**: Código mais coeso, seguro e com SEO/privacidade garantidos na raiz da requisição.

---

### Decisão 4: DTO Sanitizado (`toPublicVehicleReportDto`) e Princípio da Minimização de Dados (LGPD)

- **Decision**: Criar um adapter server-side dedicado (`toPublicVehicleReportDto`) que filtra o snapshot JSONB antes de qualquer transmissão ao cliente ou motor de PDF.
- **Rationale**:
  - O JSON bruto retornado por APIs de veículos contém PII de proprietários anteriores (nomes, CPFs/CNPJs, endereços), valores de taxas pagas pela loja e dados cadastrais que violam a LGPD se expostos integralmente a terceiros.
  - O adapter mascara dados essenciais de identificação (Chassi: `8AJZZZ******3456`, RENAVAM: `******1222`, CPF: `***.***.***-12`) e elimina integralmente custos internos da AF Motos e o JSON bruto original.
- **Alternatives Considered**:
  - *Reutilizar diretamente o DTO do painel admin (`InternalVehicleConsultationDto`)*: Rejeitado porque o DTO interno inclui abas técnicas com JSON bruto, custos tarifados e IDs de usuários internos.
- **Consequences**: Conformidade estrita com a LGPD e blindagem do segredo comercial da AF Motos.

---

### Decisão 5: Geração de PDF sob Demanda vs. Armazenamento em Bucket Privado

- **Decision**: Gerar o PDF institucional sob demanda no servidor (`renderToBuffer` com `@react-pdf/renderer`) a partir do snapshot salvo, transmitindo o buffer diretamente na resposta HTTP da rota `/api/public/laudos/veicular/[shareToken]/pdf`.
- **Rationale**:
  - O tempo de renderização do `@react-pdf/renderer` para o laudo é inferior a 350ms em ambiente Node.js.
  - Não ocupa armazenamento desnecessário no Supabase Storage.
  - A revogação do link cancela **instantaneamente** o download do PDF sem necessidade de invalidar ou expurgar arquivos físicos em buckets.
  - Não há risco de links permanentes ou vazamento de URLs assinadas.
- **Alternatives Considered**:
  - *Salvar PDFs em bucket público*: **Terminantemente rejeitado** (violaria a privacidade de todos os clientes).
  - *Bucket privado com Signed URLs temporárias*: Adiciona complexidade de gerenciamento de ciclo de vida e tempo de expiração sem benefícios claros sobre a renderização em memória.
- **Consequences**: Custo zero de armazenamento adicional, revogação 100% em tempo real e sem arquivos órfãos.

---

### Decisão 6: Política de Ciclo de Vida (1 Compartilhamento Ativo por Consulta no MVP)

- **Decision**: No MVP, cada consulta veicular terá no máximo **1 compartilhamento com status `active`**. Ao gerar um novo link, o sistema revoga automaticamente (ou mediante confirmação) o link anterior.
- **Rationale**:
  - Simplifica a gestão do administrador, evitando múltiplos links concorrentes para o mesmo veículo sem controle.
  - Facilita a auditoria de qual link está atualmente em circulação com o comprador.
  - Schema de dados preparado com chave e status flexíveis para permitir múltiplos links no futuro se surgir necessidade de negócio.
- **Alternatives Considered**:
  - *Permitir infinitos links ativos simultâneos*: Rejeitado no MVP para evitar confusão operacional da equipe de vendas.
- **Consequences**: Interface simples e intuitiva no painel de detalhes do laudo.

---

### Decisão 7: Cabeçalhos Anti-Indexação, Cache e Referrer

- **Decision**: Configurar cabeçalhos estritos de privacidade e robots no Next.js:
  - `X-Robots-Tag: noindex, nofollow, noarchive, nosnippet`
  - `Cache-Control: private, no-store, max-age=0, must-revalidate`
  - `Referrer-Policy: no-referrer`
  - `robots.txt`: `Disallow: /laudos/`
  - `sitemap.ts`: Exclusão explícita de qualquer rota de laudos compartilhados.
- **Rationale**:
  - Impede que motores de busca (Google, Bing) indexem os laudos mesmo que um link seja compartilhado em fóruns ou redes sociais.
  - O cabeçalho `no-store` impede que proxies públicos ou caches intermediários armazenem cópias de relatórios com dados de veículos.
  - `Referrer-Policy: no-referrer` impede que o token presente na URL vaze no cabeçalho `Referer` caso o cliente clique em algum link externo.
- **Alternatives Considered**:
  - *Apenas `<meta name="robots">` no HTML*: Insuficiente para requisições diretas de PDF ou bots que leem apenas headers HTTP.
- **Consequences**: Proteção multicamada contra indexação acidental ou vazamento por cabeçalhos.

---

### Decisão 8: Rate Limiting por IP e por Token

- **Decision**: Aplicar rate limiting no Route Handler e Middleware:
  - Tokens inválidos: Máximo de 15 erros por IP a cada 10 minutos (bloqueio 429).
  - Tokens válidos: Máximo de 60 requisições por minuto por token (suficiente para navegação humana, bloqueia loops e scraping).
- **Rationale**:
  - Mitiga tentativas de adivinhação automatizada (ataques de enumeração) e protege o servidor contra sobrecarga de CPU na geração de PDF.
- **Consequences**: Alta resiliência da infraestrutura contra ataques de negação de serviço ou varreduras.

---

### Decisão 9: Reutilização 100% do Snapshot Salvo (Zero Custo com API Brasil)

- **Decision**: Todas as rotas de visualização e geração de PDF utilizam única e exclusivamente a coluna `raw_response` (JSONB) da tabela `vehicle_plate_consultations`.
- **Rationale**:
  - Cada chamada à API Brasil em modo live possui custo financeiro por requisição.
  - A consulta já foi paga e armazenada no momento da pesquisa original pelo admin.
  - Garantia de que a AF Motos nunca terá surpresas na fatura decorrentes do acesso público de clientes.
- **Consequences**: Custo marginal zero para a loja ao compartilhar 1 ou 1.000 laudos.
