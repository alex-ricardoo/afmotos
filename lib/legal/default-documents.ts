import { calculateContentHash } from './crypto.ts';

export interface DefaultDocumentDefinition {
  slug: 'privacy_policy' | 'terms_of_use';
  title: string;
  version: string;
  effectiveAt: string;
  summary: string;
  markdownTemplate: string;
}

export const DEFAULT_PRIVACY_POLICY_TEMPLATE = `
# Política de Privacidade e Proteção de Dados Pessoais — {{STORE_NAME}}

Última atualização em: {{LAST_UPDATED_DATE}}  
Versão vigente: {{VERSION}}  
Documento oficial registrado sob hash de integridade: \`{{CONTENT_HASH}}\`

---

## 1. Quem Somos e Escopo Desta Política

A presente Política de Privacidade e Proteção de Dados Pessoais ("Política") aplica-se a todos os serviços, sistemas e plataformas digitais disponibilizados pela **{{STORE_NAME}}** (referida como "nós", "nosso" ou "AF Motos"), incluindo nosso website institucional, o Portal do Cliente, os formulários de contato e propostas comerciais, as consultas de histórico veicular por placa e os canais oficiais de atendimento.

- **Razão Social / Identificação**: {{LEGAL_NAME}}
- **CNPJ**: {{CNPJ}}
- **Endereço**: {{ADDRESS}}
- **Canal de Atendimento / Encarregado (DPO)**: {{CONTACT_EMAIL}}
- **WhatsApp Oficial**: {{WHATSAPP}}

O objetivo deste documento é informar com absoluta transparência, lealdade e clareza como coletamos, tratamos, armazenamos e protegemos seus dados pessoais, em estrita conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 - LGPD), o Marco Civil da Internet (Lei nº 12.965/2014) e o Código de Defesa do Consumidor (Lei nº 8.078/1990).

> **Aviso Importante**: Esta Política descreve os padrões técnicos e operacionais praticados pela {{STORE_NAME}}. Ela não constitui promessa de blindagem jurídica irrestrita ou imunidade absoluta contra incidentes cibernéticos imprevistos, mas atesta o compromisso ético e técnico com as melhores práticas de governança e segurança da informação.

---

## 2. Quais Dados Pessoais Podemos Tratar

Tratamos apenas os dados estritamente adequados, pertinentes e limitados ao que é necessário para as finalidades para as quais são processados:

1. **Dados de Identificação e Cadastro**: Nome completo, endereço de e-mail, número de telefone celular / WhatsApp, data de nascimento e foto de perfil (quando fornecida voluntariamente).
2. **Dados de Autenticação e Conta**: Credenciais de acesso com senhas submetidas a funções de hashing irreversível (Argon2 / PBKDF2 através do Supabase Auth), tokens de sessão efêmeros e identificadores de conta.
3. **Dados de Negociação e Serviços**: Informações enviadas em formulários de interesse, proposta de compra de motocicletas, solicitação de anúncio, consignação ou aluguel de frotas.
4. **Dados de Consultas de Histórico Veicular**: Placa do veículo consultada, número de Chassi, número de Renavam, marca, modelo, ano de fabricação, histórico de débitos, multas e restrições. Dados de proprietários anteriores contidos nas bases de consulta são exibidos de forma mascarada/anonimizada.
5. **Dados de Faturamento e Transações**: Valor da transação, forma de pagamento escolhida (PIX, Cartão de Crédito), data/hora, identificador da transação no Mercado Pago e histórico de aquisição e consumo de créditos de consulta. **A {{STORE_NAME}} não coleta nem armazena números completos de cartão de crédito, códigos CVV ou senhas bancárias.**
6. **Registros Técnicos e Metadados**: Data e hora de acesso em UTC, endereço IP resumido em formato de hash criptográfico irreversível para fins de auditoria, categoria do dispositivo e navegador e logs operacionais.

---

## 3. Como Coletamos os Seus Dados

Seus dados pessoais chegam até nós pelos seguintes meios:
- **Diretamente fornecidos por você**: Ao preencher formulários de cadastro, solicitar contato sobre uma moto anunciada, efetuar uma compra ou enviar mensagens pelos nossos canais oficiais.
- **Gerados pela sua utilização da plataforma**: Histórico de consultas efetuadas na sua conta de cliente, saldo de créditos adquiridos e logs técnicos de sessão.
- **Obtidos a partir de integrações externas autorizadas**: Respostas a consultas públicas veiculares integradas via API Brasil e confirmações de transação enviadas pelo gateway Mercado Pago.
- **Autenticação Social**: Ao optar por se conectar através de conta Google (Google OAuth), recebemos apenas seu nome, e-mail e foto associada autorizada por você no consentimento OAuth.

---

## 4. Para que Usamos os Seus Dados (Finalidades)

Não utilizamos dados pessoais para finalidades distintas daquelas para as quais foram legitimamente coletados. Suas informações são tratadas para:
1. Criar, autenticar e gerenciar sua conta de acesso e perfil na plataforma.
2. Executar serviços contratados: processar consultas veiculares por placa, emitir laudos e disponibilizar download de relatórios em PDF.
3. Viabilizar operações de pagamento, cobrança e concessão de créditos de consulta veicular.
4. Prestar suporte técnico e atendimento comercial sobre motos do estoque, compras e consignações.
5. Garantir a segurança operacional, prevenir fraudes e proteger a integridade de nossos sistemas e usuários.
6. Cumprir obrigações legais e regulatórias (ex.: guarda de registros do Marco Civil da Internet e deveres fiscais/contábeis).
7. Exercer direitos em processos judiciais, administrativos ou arbitrais quando necessário.

---

## 5. Bases Legais do Tratamento (LGPD)

O tratamento de dados pessoais pela {{STORE_NAME}} fundamenta-se nas seguintes bases legais do Artigo 7º da LGPD:

| Finalidade | Base Legal Aplicável (Art. 7º LGPD) |
| :--- | :--- |
| Cadastro, login e gestão de conta | Execução de Contrato e procedimentos preliminares (Inciso V) |
| Processamento de pagamentos e entrega de relatórios | Execução de Contrato (Inciso V) |
| Guarda de registros de acesso por 6 meses | Cumprimento de Obrigação Legal - Marco Civil (Inciso II) |
| Emissão de notas fiscais e registros de faturamento | Cumprimento de Obrigação Legal / Fiscal (Inciso II) |
| Prevenção a fraudes, segurança da aplicação | Legítimo Interesse (Inciso IX) e Exercício Regular de Direitos (Inciso VI) |
| Atendimento e respostas a dúvidas do titular | Consentimento (Inciso I) ou Execução de Contrato (Inciso V) |

---

## 6. Dados de Cadastro e Autenticação

Ao se cadastrar no Portal do Cliente:
- Solicitamos nome, e-mail, telefone e data de nascimento para verificar a maioridade ou capacidade civil para contratar consultas pagas.
- A segurança das credenciais é assegurada por mecanismos criptográficos robustos providos pelo Supabase Auth.
- Você é responsável por manter a confidencialidade de sua senha e por todas as atividades realizadas sob sua conta.

---

## 7. Dados de Pagamentos e Transações Financeiras

- Os pagamentos realizados no site (para aquisição de consultas avulsas ou pacotes de crédito) são processados diretamente pela instituição de pagamento **Mercado Pago**.
- A {{STORE_NAME}} recebe unicamente as notificações de status (pendente, aprovado, estornado) e dados mínimos de identificação da transação para liberação do serviço.
- Dados de cartão de crédito e operações bancárias são tratados em ambiente com certificação PCI-DSS do provedor de pagamento, aplicando-se também as políticas de privacidade do próprio Mercado Pago.

---

## 8. Consultas de Histórico Veicular e Dados Vinculados à Placa

- As consultas veiculares têm por objetivo fornecer histórico cadastral, restrições financeiras/judiciais, histórico de roubo/furto e débitos estaduais de motocicletas e veículos.
- As informações retornadas têm origem em bases integradoras autorizadas e bancos de dados públicos governamentais (como Senatran, Detran e Renajud).
- A consulta é solicitada sob responsabilidade do usuário, devendo ser utilizada unicamente para finalidades lícitas, verificação preventiva de procedência em negociações e proteção contra golpes.
- Dados de terceiros (como nomes de proprietários anteriores) são exibidos com máscaras parciais para preservar a intimidade e privacidade dos indivíduos.

---

## 9. Pacotes de Crédito e Relacionamento Comercial B2B

- Os clientes que adquirem pacotes de crédito têm seus consumos e saldos registrados de forma auditável e transparente no Portal do Cliente.
- O histórico de utilização de créditos inclui data/hora e a placa consultada, permitindo a prestação de contas exata da conta corporativa ou profissional.

---

## 10. Compartilhamento com Operadores e Fornecedores

A {{STORE_NAME}} não comercializa, não aluga e não repassa listas de dados pessoais a terceiros para fins de marketing ou disparos em massa. O compartilhamento ocorre estritamente com os operadores necessários para o funcionamento da plataforma:

1. **Mercado Pago**: Processamento de pagamentos, cobrança e suporte a estornos.
2. **API Brasil**: Consulta e fornecimento automatizado de dados veiculares de fontes oficiais.
3. **Supabase Inc.**: Infraestrutura de nuvem, banco de dados PostgreSQL e autenticação segura.
4. **Vercel Inc.**: Hospedagem e entrega de borda (Edge Network) da aplicação web.
5. **Autoridades Judiciais e Policiais**: Mediante ordem judicial válida ou obrigação legal expressa.
6. **Assessoria Jurídica e Contábil**: Sob dever estrito de sigilo profissional para cumprimento de obrigações tributárias e defesa em litígios.

---

## 11. Mercado Pago

Ao efetuar um pagamento, você interage com a infraestrutura de pagamentos do Mercado Pago. Recomendamos a leitura dos termos e da política de privacidade da instituição em [https://www.mercadopago.com.br/privacidade](https://www.mercadopago.com.br/privacidade).

---

## 12. API Brasil e Provedores de Dados Veiculares

As consultas técnicas dependem da disponibilidade e das informações catalogadas pelos órgãos oficiais emissores através do fornecedor API Brasil. A {{STORE_NAME}} não altera os dados cadastrais emitidos pelos órgãos de trânsito.

---

## 13. Supabase, Hospedagem e Serviços de Tecnologia

Nossos bancos de dados e sistemas de autenticação operam sobre infraestrutura moderna em nuvem gerenciada pelo Supabase com Row Level Security (RLS) habilitado, garantindo que cada cliente apenas acesse suas próprias consultas e registros.

---

## 14. WhatsApp e Canais de Atendimento

Quando você clica nos botões de WhatsApp do site, a conversa é aberta no aplicativo WhatsApp do seu dispositivo. As mensagens trocadas são transmitidas com criptografia de ponta a ponta fornecida pela Meta Platforms / WhatsApp, sujeitas aos termos do aplicativo.

---

## 15. Cookies, Métricas e Tecnologias Similares

- **Cookies Estritamente Necessários**: Utilizamos apenas cookies essenciais para manter você autenticado no Portal do Cliente e proteger o tráfego da aplicação contra ataques CSRF e sequestro de sessão.
- **Rastreadores Analíticos / Marketing**: Não utilizamos Meta Pixel, Google Analytics ou cookies de publicidade direcionada.
- Caso ferramentas adicionais de métrica venham a ser implementadas no futuro, você terá a faculdade de aceitar ou rejeitar de forma granular em sua central de preferências.

---

## 16. Segurança e Medidas de Proteção

Adotamos salvaguardas técnicas e organizacionais adequadas para proteger os dados pessoais:
- Criptografia em trânsito (HTTPS / TLS 1.3) para todas as comunicações.
- Bancos de dados com isolamento por Row Level Security (RLS).
- Armazenamento de endereços IP de auditoria sob forma de hash irreversível com salt.
- Senhas protegidas com algoritmos de derivação de chaves de alta entropia.
- Controle rigoroso de acessos administrativos concedidos apenas a colaboradores ativos.

---

## 17. Retenção, Eliminação e Anonimização

- Os dados pessoais são mantidos apenas pelo tempo necessário para cumprir as finalidades legítimas descritas nesta Política, respeitados os prazos legais de guarda (como 6 meses para logs de acesso sob o Marco Civil da Internet e 5 anos para documentos fiscais e transacionais sob o Código Tributário Nacional e Código Civil).
- Findo o período de retenção necessário ou havendo solicitação legítima do titular, os dados serão eliminados com segurança ou anonimizados de forma irreversível, salvo quando a conservação for admitida por lei.

---

## 18. Seus Direitos como Titular de Dados (Art. 18 LGPD)

Você possui os seguintes direitos garantidos por lei:
1. **Confirmação e Acesso**: Saber se tratamos seus dados e solicitar cópia dos mesmos.
2. **Correção**: Solicitar a retificação de dados incompletos, inexatos ou desatualizados.
3. **Anonimização, Bloqueio ou Eliminação**: De dados desnecessários, excessivos ou desconformes.
4. **Portabilidade**: Solicitar a transferência de seus dados a outro fornecedor, observada a regulamentação da ANPD.
5. **Informação sobre Compartilhamento**: Conhecer as entidades com as quais compartilhamos informações.
6. **Revogação do Consentimento**: Retirar consentimentos concedidos anteriormente para finalidades específicas.
7. **Peticionamento perante a ANPD**: Fazer requerimentos perante a Autoridade Nacional de Proteção de Dados.

---

## 19. Como Exercer os Seus Direitos

Você pode exercer seus direitos de titular a qualquer momento através de duas vias oficiais:
1. **Pela Área do Cliente**: Acessando seu perfil em \`/cliente/perfil\` na seção "Privacidade e Documentos" e clicando em **"Solicitar atendimento sobre meus dados"**. Sua requisição receberá um número de protocolo oficial da LGPD.
2. **Por E-mail / Contato Direto**: Enviando uma mensagem para nosso Encarregado de Dados em **{{CONTACT_EMAIL}}** com o assunto "Solicitação de Direitos LGPD".

> Nós analisaremos e responderemos sua solicitação nos prazos e termos regulamentares da legislação aplicável.

---

## 20. Crianças e Adolescentes

A plataforma da {{STORE_NAME}} destina-se ao público maior de 14 anos com assistência e maior de 18 anos para contratações financeiras e consultas pagas. Não coletamos intencionalmente dados de crianças (menores de 12 anos). Caso tome conhecimento de cadastro indevido de menor de idade, contate nosso Encarregado para imediata exclusão.

---

## 21. Transferências Internacionais de Dados

Nossos servidores e provedores de infraestrutura (como Supabase e Vercel) operam centros de dados globais que podem envolver transferência internacional de dados para países com níveis adequados de proteção, sob cláusulas contratuais padrão e padrões corporativos rigorosos de segurança.

---

## 22. Alterações Nesta Política de Privacidade

Podemos atualizar esta Política de Privacidade periodicamente para refletir melhorias em nossos sistemas ou adequações legislativas.
- A data da última atualização será sempre informada no início deste documento.
- Quando forem promovidas alterações materiais de impacto substantivo nos seus direitos, nós informaremos no seu próximo acesso à plataforma e solicitaremos sua ciência/aceite da nova versão.

---

## 23. Contato do Controlador e do Encarregado de Dados

Para quaisquer dúvidas, solicitações ou comunicados relativos à proteção de dados:
- **Controlador**: {{STORE_NAME}} ({{LEGAL_NAME}})
- **CNPJ**: {{CNPJ}}
- **Encarregado de Proteção de Dados (DPO)**: {{CONTACT_EMAIL}}
- **WhatsApp**: {{WHATSAPP}}
- **Endereço**: {{ADDRESS}}
`;

export const DEFAULT_TERMS_OF_USE_TEMPLATE = `
# Termos e Condições de Uso da Plataforma — {{STORE_NAME}}

Última atualização em: {{LAST_UPDATED_DATE}}  
Versão vigente: {{VERSION}}  
Documento oficial registrado sob hash de integridade: \`{{CONTENT_HASH}}\`

---

## 1. Objeto e Aceitação dos Termos

1.1. Estes Termos e Condições de Uso ("Termos") regulam a utilização dos serviços digitais, website e Portal do Cliente operados pela **{{STORE_NAME}}** ({{LEGAL_NAME}}, inscrita no CNPJ sob o nº {{CNPJ}}, com endereço em {{ADDRESS}}).

1.2. Ao criar uma conta na plataforma ou utilizar os serviços disponíveis, o usuário declara ter lido, compreendido e concordado integralmente com estes Termos e com a nossa Política de Privacidade.

1.3. A aceitação destes Termos é requisito indispensável para o cadastro, aquisição de créditos e realização de consultas veiculares na plataforma.

---

## 2. Cadastro e Segurança de Credenciais

2.1. Para usufruir dos recursos da área autenticada, o usuário deverá preencher o formulário de cadastro com informações verdadeiras, exatas, atuais e completas.

2.2. É expressamente vedado o uso de dados de terceiros ou identidades falsas para criação de contas.

2.3. O usuário é o único responsável pela guarda, confidencialidade e uso de sua senha de acesso. Qualquer operação realizada com as credenciais válidas do usuário será atribuída a ele perante a plataforma e terceiros.

2.4. Em caso de extravio, furto ou suspeita de comprometimento da senha, o usuário compromete-se a redefini-la imediatamente ou comunicar o suporte da {{STORE_NAME}}.

---

## 3. Uso Permitido e Condições das Consultas Veiculares

3.1. A plataforma disponibiliza consultas cadastrais de histórico veicular por placa com a finalidade de apoiar decisões comerciais legítimas, análise preventiva de procedência e prevenção contra golpes em negociações automotivas.

3.2. O usuário concorda em utilizar as informações obtidas com estrito respeito à boa-fé, à legislação de trânsito, ao Código Civil e à Lei Geral de Proteção de Dados (LGPD).

3.3. As informações veiculares resultantes das consultas refletem os registros oficiais emitidos pelas bases públicas governamentais e provedores integrados no momento da consulta. A {{STORE_NAME}} atua como intermediadora tecnológica e não é responsável por eventuais atrasos ou inconsistências originadas nos sistemas das fontes governamentais ou estaduais (Detran, Senatran, Renajud).

---

## 4. Práticas Proibidas e Uso Abusivo

O usuário expressamente concorda que **NÃO** realizará as seguintes condutas:
1. Praticar qualquer ato ilícito, fraudulento, de violação de direitos autorais ou de violação de dados pessoais.
2. Utilizar mecanismos automatizados (bots, crawlers, scrapers ou scripts) para extração em massa de dados da plataforma sem autorização prévia por escrito.
3. Tentar violar a segurança, burlar autenticações, injetar código malicioso ou realizar engenharia reversa no software da {{STORE_NAME}}.
4. Comercializar, sublicenciar ou revender relatórios e laudos gerados em desacordo com as regras de pacotes autorizados.
5. Utilizar as consultas para práticas de perseguição pessoal, assédio, espionagem ilegítima ou qualquer finalidade estranha à análise veicular.

---

## 5. Pagamentos, Créditos e Políticas Financeiras

5.1. Os serviços de consulta podem ser contratados de forma avulsa ou por meio de Pacotes de Créditos B2B disponibilizados na plataforma.

5.2. O processamento de pagamentos é efetuado através do gateway de pagamento Mercado Pago, admitindo-se as modalidades homologadas na tela de checkout (como PIX e Cartão de Crédito).

5.3. A liberação das consultas ou a inclusão de saldo na conta do cliente ocorre de forma automática após a confirmação irrevogável do pagamento enviada pela instituição bancária ou gateway.

5.4. **Condições de Estorno e Reembolso**:
- Se uma consulta veicular sofrer falha técnica definitiva decorrente de indisponibilidade permanente do provedor sem a entrega do laudo contratado, a transação será submetida ao fluxo de retry automático e, persistindo a falha, o valor ou o crédito correspondente será integralmente estornado ou restituído na carteira de créditos do usuário, conforme as regras da plataforma.
- Não haverá reembolso após a emissão e entrega regular do relatório veicular completo solicitado pelo cliente.

---

## 6. Disponibilidade do Serviço e Limitações Técnicas

6.1. A {{STORE_NAME}} empenha os melhores esforços técnicos para manter a plataforma acessível 24 horas por dia, 7 dias por semana. No entanto, por depender de serviços de telecomunicação, servidores externos em nuvem e órgãos públicos de trânsito, não garante funcionamento 100% ininterrupto ou imune a instabilidades momentâneas.

6.2. Manutenções programadas ou emergências técnicas poderão suspender temporariamente o acesso a determinadas funcionalidades, ocasiões em que serão priorizadas correções ágeis.

---

## 7. Propriedade Intelectual

7.1. Todas as marcas, logotipos, layouts, elementos visuais, códigos-fonte, textos, gráficos e designs associados à {{STORE_NAME}} são de titularidade exclusiva de seus respectivos proprietários ou licenciados, protegidos pelas leis de propriedade intelectual.

7.2. É vedada a cópia, reprodução ou imitação comercial de elementos do site sem autorização expressa da empresa.

---

## 8. Suspensão e Cancelamento de Acesso

8.1. A {{STORE_NAME}} reserva-se o direito de suspender ou encerrar, a qualquer momento e sem aviso prévio, a conta de qualquer usuário que:
- Viole as disposições destes Termos ou da legislação em vigor;
- Pratique condutas lesivas à plataforma, a outros usuários ou a terceiros;
- Forneça dados cadastrais intencionalmente falsos ou fraudulentos.

---

## 9. Alterações Destes Termos

9.1. Estes Termos de Uso poderão ser alterados a qualquer momento pela {{STORE_NAME}} para adequação a novos recursos ou obrigações legais.

9.2. A versão atualizada entrará em vigor na data de sua publicação na plataforma.

9.3. Havendo alterações substanciais, o usuário será notificado e solicitado a manifestar sua concordância na próxima utilização do Portal do Cliente.

---

## 10. Disposições Finais e Canal de Contato

10.1. Caso qualquer cláusula destes Termos seja considerada inválida por decisão judicial competente, as demais cláusulas permanecerão plenamente vigentes e eficazes.

10.2. Para esclarecimentos, sugestões ou suporte sobre estes Termos, o usuário poderá contatar a equipe da {{STORE_NAME}} através do WhatsApp oficial ({{WHATSAPP}}) ou pelo e-mail institucional ({{CONTACT_EMAIL}}).
`;

/**
 * Returns merged document content with store settings applied to variables.
 */
export function renderLegalTemplate(
  template: string,
  variables: {
    siteName: string;
    cnpj?: string | null;
    contactEmail?: string | null;
    whatsappPhone?: string;
    address?: string | null;
    version: string;
    lastUpdatedDate: string;
    contentHash: string;
  },
): string {
  const storeName = variables.siteName || 'AF Motos';
  const cnpj = variables.cnpj || '[CNPJ da Loja — Configurar no Painel]';
  const email = variables.contactEmail || '[E-mail de Contato / DPO — Configurar no Painel]';
  const phone = variables.whatsappPhone || '(81) 98973-2070';
  const address =
    variables.address ||
    'Av. Historiador Pereira da Costa, 752 - Centro, Cabo de Santo Agostinho - PE';

  return template
    .replace(/\{\{STORE_NAME\}\}/g, storeName)
    .replace(/\{\{LEGAL_NAME\}\}/g, storeName)
    .replace(/\{\{CNPJ\}\}/g, cnpj)
    .replace(/\{\{CONTACT_EMAIL\}\}/g, email)
    .replace(/\{\{WHATSAPP\}\}/g, phone)
    .replace(/\{\{ADDRESS\}\}/g, address)
    .replace(/\{\{VERSION\}\}/g, variables.version)
    .replace(/\{\{LAST_UPDATED_DATE\}\}/g, variables.lastUpdatedDate)
    .replace(/\{\{CONTENT_HASH\}\}/g, variables.contentHash);
}

/**
 * Returns canonical default document structure with deterministic precomputed hashes.
 */
export function getDefaultDocumentDefinition(
  slug: 'privacy_policy' | 'terms_of_use',
  settings?: {
    site_name?: string;
    cnpj?: string | null;
    contact_email?: string | null;
    whatsapp_phone?: string;
    address?: string | null;
  },
): {
  id: string;
  slug: 'privacy_policy' | 'terms_of_use';
  title: string;
  version: string;
  summary: string;
  contentMarkdown: string;
  contentHash: string;
  publishedAt: string;
  effectiveAt: string;
  lastUpdatedAt: string;
  institution: {
    siteName: string;
    cnpj: string | null;
    contactEmail: string | null;
    whatsappPhone: string;
    address: string | null;
  };
} {
  const version = '1.0.0';
  const lastUpdatedDate = '15/09/2026';
  const publishedAt = '2026-09-15T00:00:00.000Z';
  const effectiveAt = '2026-09-15T00:00:00.000Z';

  const siteName = settings?.site_name || 'AF Motos';
  const cnpj = settings?.cnpj || null;
  const contactEmail = settings?.contact_email || null;
  const whatsappPhone = settings?.whatsapp_phone || '(81) 98973-2070';
  const address = settings?.address || null;

  const template =
    slug === 'privacy_policy' ? DEFAULT_PRIVACY_POLICY_TEMPLATE : DEFAULT_TERMS_OF_USE_TEMPLATE;
  const title =
    slug === 'privacy_policy'
      ? 'Política de Privacidade e Proteção de Dados'
      : 'Termos e Condições de Uso da Plataforma';
  const summary =
    slug === 'privacy_policy'
      ? 'Diretrizes completas de conformidade com a LGPD e tratamento transparente de dados pessoais.'
      : 'Regras de utilização dos serviços digitais, pacotes de créditos e laudos veiculares.';

  // Initial dummy hash placeholder to calculate final deterministic hash
  const initialRender = renderLegalTemplate(template, {
    siteName,
    cnpj,
    contactEmail,
    whatsappPhone,
    address,
    version,
    lastUpdatedDate,
    contentHash: 'CALCULANDO_INTEGRIDADE_SHA256',
  });

  const contentHash = calculateContentHash(initialRender);

  const finalContentMarkdown = renderLegalTemplate(template, {
    siteName,
    cnpj,
    contactEmail,
    whatsappPhone,
    address,
    version,
    lastUpdatedDate,
    contentHash,
  });

  return {
    id:
      slug === 'privacy_policy'
        ? '00000000-0000-0000-0000-000000000001'
        : '00000000-0000-0000-0000-000000000002',
    slug,
    title,
    version,
    summary,
    contentMarkdown: finalContentMarkdown,
    contentHash,
    publishedAt,
    effectiveAt,
    lastUpdatedAt: publishedAt,
    institution: {
      siteName,
      cnpj,
      contactEmail,
      whatsappPhone,
      address,
    },
  };
}
