# Pesquisa Técnica & Jurídica — Feature 038: Política de Privacidade, Termos de Uso e Registro de Aceite LGPD

## 1. Contexto do Projeto e Escopo do Sistema

### 1.1 Stack Tecnológico
- **Framework**: Next.js 16 (App Router com React 19)
- **Linguagem**: TypeScript 5
- **Banco de Dados & Autenticação**: Supabase PostgreSQL + Supabase Auth + Supabase RLS
- **Estilização**: Tailwind CSS v4 + shadcn/ui
- **Integrações de Terceiros**:
  - **Mercado Pago SDK**: Processamento de pagamentos (PIX, Cartão, Checkout Pro).
  - **API Brasil**: Consulta de dados cadastrais veiculares públicos (placas, débitos, multas, restrições).
  - **WhatsApp**: Comunicação comercial e de suporte iniciada voluntariamente pelo usuário.

### 1.2 Mapeamento de Dados Tratados no Sistema
A AF Motos coleta e processa categorias específicas de dados pessoais e veiculares:
1. **Dados de Cadastro e Autenticação**:
   - Nome completo, e-mail, telefone/WhatsApp, data de nascimento, senha criptografada (gerenciada pelo Supabase Auth) e foto de perfil (quando fornecida).
2. **Dados de Negociação e Serviços**:
   - Venda de motos, propostas comerciais, anúncios e consignações, contatos via formulário.
3. **Dados de Consultas de Histórico Veicular**:
   - Placa consultada, Renavam, Chassi (mascarados nos laudos públicos e salvos conforme a consulta contratada), histórico de proprietários anteriores (com documentos anonimizados/mascarados), restrições financeiras e judiciais.
4. **Dados Financeiros e de Pagamento**:
   - Valores de transação, pacotes de créditos B2B contratados, IDs de transação no Mercado Pago, status de pagamento. **Nenhum dado sensível de cartão de crédito é armazenado nos servidores da AF Motos** (processamento delegado integralmente ao gateway PCI-DSS do Mercado Pago).
5. **Dados Técnicos de Navegação e Auditoria**:
   - Data/hora de acesso (UTC), user-agent categorizado, hash criptográfico de IP (via SHA-256 com salt) para registros de auditoria e logs de segurança, conforme exigido pelo Marco Civil da Internet (Lei nº 12.965/2014, Art. 15).

---

## 2. Auditoria de Cookies e Rastreadores

Após inspeção minuciosa do código-fonte (`app/layout.tsx`, `package.json`, scripts públicos e componentes de layout):
- **Não existem scripts analíticos de terceiros instalados** (sem Google Analytics, sem Meta Pixel, sem Vercel Analytics, sem ferramentas de heatmap ou remarketing).
- **Cookies em uso**:
  - Cookies estritamente necessários para gerenciamento de sessão e autenticação segura via Supabase Auth (`sb-access-token`, `sb-refresh-token`, cookies de PKCE para OAuth).
- **Diretriz de Conformidade**:
  - De acordo com as diretrizes da ANPD e o Guia Orientativo de Cookies, cookies estritamente necessários para a prestação do serviço contratado independem de consentimento prévio, exigindo-se apenas transparência informada na Política de Privacidade.
  - Não há necessidade de exibir banner invasivo de bloqueio de cookies enquanto não houver cookies analíticos ou de marketing. A interface disponibilizará uma seção transparente em "Preferências de Privacidade", preparada para ativação granular de consentimento caso novos serviços sejam integrados no futuro.

---

## 3. Diretrizes da LGPD (Lei nº 13.709/2018) e Bases Legais Aplicadas

### 3.1 Não Dependência Exclusiva de Consentimento
O consentimento é apenas uma das 10 bases legais previstas no Art. 7º da LGPD. Tratar todas as operações como baseadas em consentimento geraria insegurança jurídica. O sistema estrutura as bases legais correspondentes a cada finalidade:
- **Execução de Contrato e Procedimentos Preliminares (Art. 7º, V)**:
  - Criação de conta de cliente, emissão de relatórios veiculares solicitados, disponibilização e abatimento de créditos B2B, intermediação de compra/venda de motos.
- **Cumprimento de Obrigação Legal ou Regulatória (Art. 7º, II)**:
  - Guarda de registros de acesso a aplicações de internet (Marco Civil da Internet, 6 meses); emissão de notas fiscais e obrigações contábeis/fiscais.
- **Exercício Regular de Direitos em Processo Judicial, Administrativo ou Arbitral (Art. 7º, VI)**:
  - Manutenção de logs de auditoria, comprovantes de transação e histórico de aceites para defesa em eventuais litígios.
- **Legítimo Interesse (Art. 7º, IX)**:
  - Prevenção a fraudes, segurança da informação, melhoria técnica da plataforma.
- **Consentimento (Art. 7º, I)**:
  - Comunicações de marketing opcionais ou tratamentos suplementares não essenciais.

### 3.2 Direitos dos Titulares (Art. 18 da LGPD)
O titular possui direito a:
1. Confirmação da existência de tratamento.
2. Acesso aos dados.
3. Correção de dados incompletos, inexatos ou desatualizados.
4. Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade.
5. Portabilidade dos dados a outro fornecedor de serviço.
6. Eliminação dos dados tratados com consentimento (observadas as hipóteses de retenção legal).
7. Informação sobre entidades públicas e privadas com as quais o controlador compartilhou dados.
8. Informação sobre a possibilidade de não fornecer consentimento e sobre as consequências da negativa.
9. Revogação do consentimento.

O sistema fornecerá aos usuários autenticados um canal formal de solicitação com geração de protocolo (`privacy_requests`).

---

## 4. Arquitetura de Versionamento e Integridade Criptográfica

1. **Imutabilidade de Documentos Publicados**:
   - Nenhuma linha de versão com `status = 'published'` pode ser alterada via `UPDATE`. Qualquer modificação de redação exige a criação de uma nova versão (`draft`) e subsequente publicação.
2. **Integridade via SHA-256**:
   - No momento da publicação, o backend calcula o hash SHA-256 do conteúdo em Markdown do documento e o armazena na coluna `content_hash`.
3. **Registro de Aceite Append-Only**:
   - A tabela `legal_document_acceptances` é estritamente append-only. Aceites não podem ser editados ou excluídos por usuários.
   - Idempotência garantida pela restrição única `UNIQUE(user_id, document_version_id)`.
4. **Proteção de Dados nos Registros de Aceite**:
   - Em vez de armazenar o endereço IP bruto no registro de auditoria, o sistema aplica um salt institucional persistente e calcula o hash SHA-256 do IP (`hashClientIp`).
   - O User-Agent é classificado em categorias legíveis (ex.: `desktop-chrome`, `mobile-safari`, `unknown`) evitando armazenamento desnecessário de fingerprints de hardware.
