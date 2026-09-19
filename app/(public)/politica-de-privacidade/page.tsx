import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata, JsonLd, buildBreadcrumbsSchema, SEO_CONFIG } from '@/lib/seo';
import { getSettings } from '@/lib/actions/settings';
import { getPublishedDocument } from '@/lib/legal/queries';
import { LegalDocumentView, LegalSection } from '@/components/legal/legal-document-view';
import { formatPhoneForDisplay } from '@/lib/utils/whatsapp';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = settings?.site_name || SEO_CONFIG.defaultStoreName;

  return buildPageMetadata({
    title: `Política de Privacidade | ${siteName}`,
    description: `Política de Privacidade, Proteção de Dados e Direitos do Titular da ${siteName} em estrita conformidade com a LGPD (Lei nº 13.709/2018).`,
    path: '/politica-de-privacidade',
  });
}

export default async function PoliticaPrivacidadePage() {
  const settings = await getSettings();
  const doc = await getPublishedDocument('privacy_policy');

  const siteName = settings?.site_name || doc.institution.siteName || 'AF Veículos PE';
  const whatsappPhone = settings?.whatsapp_phone || doc.institution.whatsappPhone;
  const contactEmail = settings?.contact_email || doc.institution.contactEmail;
  const cnpj = settings?.cnpj || doc.institution.cnpj;
  const address = settings?.address || doc.institution.address;

  const breadcrumbsSchema = buildBreadcrumbsSchema([
    { name: 'Início', path: '/' },
    { name: 'Política de Privacidade', path: '/politica-de-privacidade' },
  ]);

  const sections: LegalSection[] = [
    {
      id: 'quem-somos-e-escopo',
      title: 'Quem somos e escopo da política',
      content: (
        <>
          <p>
            A presente Política de Privacidade e Proteção de Dados Pessoais regula a coleta,
            utilização, armazenamento, compartilhamento e proteção de informações pela{' '}
            <strong>{siteName}</strong> em todos os seus serviços físicos e digitais, incluindo o
            Portal do Cliente, consultas de histórico veicular por placa e canais de atendimento.
          </p>
          <p>
            Nosso compromisso é tratar dados com estrita lealdade, necessidade e transparência, em
            observância à Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD), ao Marco Civil
            da Internet (Lei nº 12.965/2014) e ao Código de Defesa do Consumidor (Lei nº
            8.078/1990).
          </p>
          <p className="text-xs text-amber-300/80 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
            <strong>Nota de responsabilidade:</strong> Esta política visa assegurar clareza e
            governança de dados. Ela não constitui declaração de imunidade absoluta contra ameaças
            cibernéticas imprevisíveis, mas atesta a implementação de salvaguardas técnicas e
            administrativas condizentes com o estado da arte.
          </p>
        </>
      ),
    },
    {
      id: 'quais-dados-podemos-tratar',
      title: 'Quais dados pessoais podemos tratar',
      content: (
        <>
          <p>
            Tratamos apenas os dados estritamente necessários para a prestação dos serviços
            contratados:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-300">
            <li>
              <strong>Identificação e Contato:</strong> Nome completo, e-mail, telefone
              celular/WhatsApp e data de nascimento.
            </li>
            <li>
              <strong>Autenticação:</strong> E-mail e senha criptografada gerenciados pelo Supabase
              Auth, além de tokens efêmeros de sessão.
            </li>
            <li>
              <strong>Negociações e Atendimento:</strong> Informações de motos oferecidas para
              compra, venda, anúncio ou consignação enviadas por formulário.
            </li>
            <li>
              <strong>Consultas Veiculares:</strong> Placa do veículo consultada, Renavam, Chassi e
              restrições públicas oficiais vinculadas ao automóvel.
            </li>
            <li>
              <strong>Dados de Faturamento:</strong> Valores transacionados, forma de pagamento e
              identificadores de transação do Mercado Pago.{' '}
              <em>Não armazenamos dados completos de cartão de crédito.</em>
            </li>
            <li>
              <strong>Registros Técnicos de Auditoria:</strong> Data/hora de acesso (UTC), hash de
              IP irreversível com salt institucional e categoria do dispositivo.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'como-coletamos-os-dados',
      title: 'Como coletamos os dados',
      content: (
        <>
          <p>Os dados tratados chegam até a plataforma através de:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-300">
            <li>
              <strong>Fornecimento direto por você:</strong> Ao criar sua conta, preencher propostas
              de compra/venda ou nos contatar via WhatsApp.
            </li>
            <li>
              <strong>Geração pela sua atividade:</strong> Consultas de placas realizadas em seu
              painel e movimentação de pacotes de crédito.
            </li>
            <li>
              <strong>Integrações de fontes públicas autorizadas:</strong> Dados veiculares oficiais
              retornados por provedores integrados (API Brasil) a seu pedido.
            </li>
            <li>
              <strong>Autenticação Google OAuth:</strong> Ao optar por login com Google, recebemos
              unicamente nome, e-mail e foto autorizados por você.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'para-que-usamos-os-dados',
      title: 'Para que usamos os dados',
      content: (
        <>
          <p>Utilizamos os dados pessoais com finalidades legítimas e bem definidas:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-300">
            <li>Autenticar seu acesso e gerenciar sua conta de cliente com segurança.</li>
            <li>
              Processar consultas veiculares por placa, gerar e disponibilizar laudos oficiais em
              PDF.
            </li>
            <li>Intermediar transações de compra, venda, anúncio e consignação de motos.</li>
            <li>
              Viabilizar pagamentos via Mercado Pago e controlar saldos de pacotes de créditos B2B.
            </li>
            <li>Prestar suporte técnico, responder dúvidas e atender chamados de pós-venda.</li>
            <li>Prevenir fraudes cibernéticas e proteger a infraestrutura do sistema.</li>
            <li>
              Cumprir obrigações legais, fiscais e regulatórias (Marco Civil da Internet e
              legislação tributária).
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'bases-legais-do-tratamento',
      title: 'Bases legais do tratamento',
      content: (
        <>
          <p>
            O tratamento de dados não repousa unicamente no consentimento. A LGPD estabelece 10
            bases legais no Art. 7º, e enquadramos cada atividade de forma precisa:
          </p>
          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs border border-zinc-800 rounded-xl overflow-hidden">
              <thead className="bg-zinc-900 text-amber-300">
                <tr>
                  <th className="p-2.5 border-b border-zinc-800">Finalidade Concreta</th>
                  <th className="p-2.5 border-b border-zinc-800">Base Legal Aplicada (LGPD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                <tr>
                  <td className="p-2.5">Cadastro, emissão de relatórios e créditos</td>
                  <td className="p-2.5">Execução de Contrato (Art. 7º, V)</td>
                </tr>
                <tr>
                  <td className="p-2.5">Guarda de registros de acesso por 6 meses</td>
                  <td className="p-2.5">Obrigação Legal - Marco Civil (Art. 7º, II)</td>
                </tr>
                <tr>
                  <td className="p-2.5">Prevenção a fraudes e segurança dos laudos</td>
                  <td className="p-2.5">
                    Legítimo Interesse (Art. 7º, IX) e Exercício de Direitos (Art. 7º, VI)
                  </td>
                </tr>
                <tr>
                  <td className="p-2.5">Atendimento de dúvidas voluntárias e marketing</td>
                  <td className="p-2.5">
                    Consentimento (Art. 7º, I) ou Procedimentos Preliminares (Art. 7º, V)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ),
    },
    {
      id: 'dados-de-cadastro-e-autenticacao',
      title: 'Dados de cadastro e autenticação',
      content: (
        <p>
          Ao registrar-se no Portal do Cliente, exigimos nome, e-mail, telefone e data de nascimento
          para assegurar a identificação do titular e a capacidade civil para contratar consultas
          pagas. As senhas são submetidas a hashing criptográfico de alta segurança pelo Supabase
          Auth. Você é responsável por manter a confidencialidade de suas credenciais.
        </p>
      ),
    },
    {
      id: 'dados-de-pagamentos-e-transacoes',
      title: 'Dados de pagamentos e transações',
      content: (
        <p>
          A <strong>{siteName}</strong> não armazena números de cartões de crédito, códigos de
          segurança ou senhas bancárias. Todo o processamento de pagamentos (PIX, cartão e saldo Mercado Pago) é
          operado pelo gateway homologado Mercado Pago sob certificação PCI-DSS. Recebemos apenas a
          confirmação de aprovação, IDs da transação e metadados necessários para liberação do
          serviço e emissão de comprovantes fiscais.
        </p>
      ),
    },
    {
      id: 'consultas-veiculares-e-dados-de-placa',
      title: 'Consultas de histórico veicular e dados relacionados à placa',
      content: (
        <>
          <p>
            As consultas por placa têm natureza cadastral e visam verificar a procedência veicular,
            histórico de roubo/furto, restrições judiciais e gravames. A pesquisa é solicitada sob a
            responsabilidade do usuário, devendo ser empregada com boa-fé para prevenção de fraudes
            em negociações automotivas legítimas.
          </p>
          <p>
            Informações que possam envolver dados pessoais de terceiros (como proprietários
            anteriores contidos nas bases de registro) são apresentadas de forma anonimizada ou
            mascarada nos laudos públicos, preservando a intimidade e a privacidade.
          </p>
        </>
      ),
    },
    {
      id: 'pacotes-de-credito-e-relacionamento-comercial',
      title: 'Pacotes de crédito e relacionamento comercial',
      content: (
        <p>
          Para clientes e lojistas que adquirem pacotes de créditos de consulta veicular, mantemos
          um extrato auditável de aquisições, vigência e consumo de créditos no Portal do Cliente,
          contendo o registro da placa consultada e data/hora para prestação de contas transparente.
        </p>
      ),
    },
    {
      id: 'compartilhamento-com-operadores-e-fornecedores',
      title: 'Compartilhamento com operadores e fornecedores',
      content: (
        <>
          <p>
            Não vendemos nem alugamos suas informações a terceiros. O compartilhamento ocorre
            exclusivamente com operadores essenciais para o funcionamento da plataforma:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-300">
            <li>
              <strong>Mercado Pago:</strong> Processamento de pagamentos, conciliação e suporte a
              estornos.
            </li>
            <li>
              <strong>API Brasil:</strong> Fornecimento de dados veiculares de órgãos oficiais de
              trânsito.
            </li>
            <li>
              <strong>Supabase Inc.:</strong> Infraestrutura de banco de dados PostgreSQL com RLS e
              autenticação.
            </li>
            <li>
              <strong>Vercel Inc.:</strong> Hospedagem em nuvem e distribuição de conteúdo.
            </li>
            <li>
              <strong>Autoridades Públicas:</strong> Mediante determinação judicial válida ou
              obrigação legal expressa.
            </li>
            <li>
              <strong>Assessoria Jurídica/Contábil:</strong> Para cumprimento de exigências fiscais
              e defesa em processos.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'mercado-pago',
      title: 'Mercado Pago',
      content: (
        <p>
          Ao realizar pagamentos, o titular interage com a infraestrutura de pagamentos do Mercado
          Pago. Os dados bancários fornecidos são tratados sob os padrões de segurança do provedor.
          Recomendamos consultar os termos do provedor em{' '}
          <a
            href="https://www.mercadopago.com.br/privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className="text-amber-400 hover:underline inline-flex items-center gap-1"
          >
            mercadopago.com.br/privacidade
          </a>
          .
        </p>
      ),
    },
    {
      id: 'api-brasil-e-provedores-veiculares',
      title: 'API Brasil e provedores de dados veiculares',
      content: (
        <p>
          As consultas dependem das bases integradas da API Brasil e dos registros oficiais de
          trânsito (Detran, Senatran, Renajud). A <strong>{siteName}</strong> não altera ou produz
          dados cadastrais dos veículos, atuando como intermediadora da visualização e emissão do
          laudo técnico.
        </p>
      ),
    },
    {
      id: 'supabase-hospedagem-e-tecnologia',
      title: 'Supabase, hospedagem e serviços de tecnologia',
      content: (
        <p>
          Nossos bancos de dados operam na nuvem gerenciada do Supabase com Row Level Security (RLS)
          habilitado no nível do motor PostgreSQL. Isso assegura que nenhum usuário comum tenha
          acesso a consultas ou cadastros de terceiros, mesmo diante de eventuais falhas lógicas da
          aplicação.
        </p>
      ),
    },
    {
      id: 'whatsapp-e-canais-de-atendimento',
      title: 'WhatsApp e canais de atendimento',
      content: (
        <p>
          O contato via WhatsApp é iniciado de forma voluntária pelo usuário ao clicar nos botões do
          site. As conversas trocadas no aplicativo ocorrem com criptografia de ponta a ponta
          fornecida pela Meta / WhatsApp, sendo os dados de contato utilizados exclusivamente para
          esclarecer dúvidas sobre motos, compras e consultas solicitadas.
        </p>
      ),
    },
    {
      id: 'cookies-e-tecnologias-similares',
      title: 'Cookies, métricas e tecnologias similares',
      content: (
        <>
          <p>
            Utilizamos <strong>exclusivamente cookies estritamente necessários</strong> para
            autenticação de sessão e segurança (via Supabase Auth e Next.js SSR), evitando fraudes e
            permitindo que você navegue conectado em sua conta.
          </p>
          <p>
            <strong>Não utilizamos rastreadores de publicidade de terceiros</strong> (como Meta
            Pixel ou Google Analytics). Se ferramentas analíticas não essenciais forem incorporadas
            no futuro, você poderá gerenciar seu consentimento de forma granular no Portal do
            Cliente.
          </p>
        </>
      ),
    },
    {
      id: 'seguranca-e-medidas-de-protecao',
      title: 'Segurança e medidas de proteção',
      content: (
        <ul className="list-disc list-inside space-y-1.5 pl-2 text-zinc-300">
          <li>Criptografia de ponta a ponta em trânsito com protocolo HTTPS/TLS 1.3 forçado.</li>
          <li>Controle de acesso rigoroso por RLS e privilégios mínimos no banco de dados.</li>
          <li>
            Armazenamento de endereços IP de auditoria sob formato de hash SHA-256 irreversível com
            salt.
          </li>
          <li>
            Isolamento de credenciais e senhas criptografadas com algoritmos de alta entropia.
          </li>
          <li>
            Controle estrito de privilégios de acesso restritos a administradores ativos
            comprovados.
          </li>
        </ul>
      ),
    },
    {
      id: 'retencao-eliminacao-e-anonimizacao',
      title: 'Retenção, eliminação e anonimização',
      content: (
        <p>
          Os dados são conservados pelo período necessário para atingir as finalidades para as quais
          foram coletados, observados os prazos legais e regulatórios expressos (como a guarda de
          logs por 6 meses conforme o Marco Civil da Internet e 5 anos para documentos com efeitos
          fiscais e contratuais sob o Código Civil). Esgotadas as finalidades ou havendo solicitação
          aplicável do titular, os dados serão eliminados com segurança ou anonimizados
          irreversivelmente.
        </p>
      ),
    },
    {
      id: 'direitos-do-titular-de-dados',
      title: 'Direitos do titular de dados (Art. 18 da LGPD)',
      content: (
        <>
          <p>A LGPD assegura a você, como titular de dados pessoais, os seguintes direitos:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-300">
            <li>
              <strong>Confirmação e Acesso:</strong> Confirmar a existência de tratamento e acessar
              seus dados.
            </li>
            <li>
              <strong>Correção:</strong> Solicitar a correção de dados incompletos, inexatos ou
              desatualizados.
            </li>
            <li>
              <strong>Anonimização ou Eliminação:</strong> De dados desnecessários ou tratados em
              desconformidade.
            </li>
            <li>
              <strong>Portabilidade:</strong> Solicitar a transferência de seus dados cadastrais
              conforme regulamento da ANPD.
            </li>
            <li>
              <strong>Informação sobre Compartilhamento:</strong> Saber com quais entidades seus
              dados foram compartilhados.
            </li>
            <li>
              <strong>Revogação do Consentimento:</strong> Revogar autorizações anteriormente
              concedidas.
            </li>
            <li>
              <strong>Peticionamento:</strong> Apresentar reclamação perante a Autoridade Nacional
              de Proteção de Dados (ANPD).
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'como-exercer-seus-direitos',
      title: 'Como exercer seus direitos',
      content: (
        <div className="space-y-3">
          <p>Você pode solicitar atendimento gratuito sobre seus dados a qualquer momento:</p>
          <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
            <span className="font-bold text-white block">Pelo Portal do Cliente:</span>
            <p className="text-xs text-zinc-400">
              Acesse seu perfil em <code>/cliente/perfil</code> na aba &quot;Privacidade e
              Documentos&quot; e clique no botão
              <strong> &quot;Solicitar atendimento sobre meus dados&quot;</strong> para gerar um
              protocolo oficial com rastreamento.
            </p>
            <div className="pt-2">
              <Link
                href="/cliente/perfil"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 underline"
              >
                Ir para o Portal do Cliente &rarr;
              </Link>
            </div>
          </div>
          {contactEmail && (
            <p className="text-xs text-zinc-400">
              Alternativamente, envie um e-mail com o assunto <em>&quot;Solicitação LGPD&quot;</em>{' '}
              para{' '}
              <a href={`mailto:${contactEmail}`} className="text-amber-400 underline">
                {contactEmail}
              </a>
              .
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'criancas-e-adolescentes',
      title: 'Crianças e adolescentes',
      content: (
        <p>
          Nossos serviços digitais são direcionados a pessoas com capacidade civil plena ou jovens a
          partir de 14 anos com assistência para consultas e pesquisas. Não realizamos coleta
          intencional de dados de crianças menores de 12 anos. Caso identifique cadastro indevido de
          menor de idade, favor contatar nossa equipe para imediata exclusão.
        </p>
      ),
    },
    {
      id: 'transferencias-internacionais',
      title: 'Transferências internacionais de dados',
      content: (
        <p>
          Nossos provedores de tecnologia em nuvem (Supabase e Vercel) operam servidores em centros
          de dados seguros localizados em conformidade com normas internacionais de proteção de
          dados, mediante salvaguardas contratuais adequadas e mecanismos de criptografia de ponta a
          ponta.
        </p>
      ),
    },
    {
      id: 'alteracoes-nesta-politica',
      title: 'Alterações nesta política',
      content: (
        <p>
          Esta Política de Privacidade poderá ser revisada periodicamente para acompanhar novas
          funcionalidades ou exigências legais. Quando houver alterações materiais que impactem os
          direitos dos usuários, exibiremos um aviso destacado no Portal do Cliente no próximo
          acesso com indicação clara da nova versão para ciência e aceite.
        </p>
      ),
    },
    {
      id: 'contato-do-controlador-e-encarregado',
      title: 'Contato do controlador e encarregado de dados',
      content: (
        <div className="space-y-3">
          <p>
            Para exercer seus direitos ou esclarecer quaisquer dúvidas sobre o tratamento de seus
            dados, contate nosso canal oficial:
          </p>
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1 text-xs text-zinc-300">
            <p>
              <strong className="text-white">Controlador:</strong> {siteName}
            </p>
            {cnpj && (
              <p>
                <strong className="text-white">CNPJ:</strong> {cnpj}
              </p>
            )}
            {address && (
              <p>
                <strong className="text-white">Endereço:</strong> {address}
              </p>
            )}
            {contactEmail && (
              <p>
                <strong className="text-white">Encarregado (DPO) / E-mail:</strong> {contactEmail}
              </p>
            )}
            {whatsappPhone && (
              <p>
                <strong className="text-white">WhatsApp Oficial:</strong>{' '}
                {formatPhoneForDisplay(whatsappPhone)}
              </p>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <JsonLd data={breadcrumbsSchema} id="privacy-breadcrumbs-schema" />
      <LegalDocumentView
        documentType="privacy"
        title="Política de Privacidade e Proteção de Dados"
        subtitle={`Transparência, integridade e governança de dados pessoais na ${siteName} em estrita conformidade com a LGPD (Lei nº 13.709/2018).`}
        version={doc.version}
        lastUpdatedDate={new Date(doc.lastUpdatedAt).toLocaleDateString('pt-BR')}
        contentHash={doc.contentHash}
        sections={sections}
        storeInfo={{
          siteName,
          cnpj,
          contactEmail,
          whatsappPhone,
          address,
        }}
      />
    </>
  );
}
