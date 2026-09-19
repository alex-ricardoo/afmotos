import React from 'react';
import { Metadata } from 'next';
import { buildPageMetadata, JsonLd, buildBreadcrumbsSchema, SEO_CONFIG } from '@/lib/seo';
import { getSettings } from '@/lib/actions/settings';
import { getPublishedDocument } from '@/lib/legal/queries';
import { LegalDocumentView, LegalSection } from '@/components/legal/legal-document-view';
import { formatPhoneForDisplay } from '@/lib/utils/whatsapp';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = settings?.site_name || SEO_CONFIG.defaultStoreName;

  return buildPageMetadata({
    title: `Termos de Uso | ${siteName}`,
    description: `Termos e Condições Gerais de Uso da Plataforma, serviços veiculares e pacotes de crédito da ${siteName}.`,
    path: '/termos-de-uso',
  });
}

export default async function TermosDeUsoPage() {
  const settings = await getSettings();
  const doc = await getPublishedDocument('terms_of_use');

  const siteName = settings?.site_name || doc.institution.siteName || 'AF Motos';
  const whatsappPhone = settings?.whatsapp_phone || doc.institution.whatsappPhone;
  const contactEmail = settings?.contact_email || doc.institution.contactEmail;
  const cnpj = settings?.cnpj || doc.institution.cnpj;
  const address = settings?.address || doc.institution.address;

  const breadcrumbsSchema = buildBreadcrumbsSchema([
    { name: 'Início', path: '/' },
    { name: 'Termos de Uso', path: '/termos-de-uso' },
  ]);

  const sections: LegalSection[] = [
    {
      id: 'objeto-e-funcionamento',
      title: 'Objeto e funcionamento da plataforma',
      content: (
        <>
          <p>
            Estes Termos e Condições Gerais de Uso (&quot;Termos&quot;) regem a navegação,
            contratação de serviços, compra de créditos e utilização das ferramentas
            disponibilizadas pela <strong>{siteName}</strong> em seu website e Portal do Cliente.
          </p>
          <p>
            A plataforma opera como um ecossistema digital para anúncio, venda, consignação e
            locação de motocicletas, além de fornecer serviços especializados de consulta veicular
            por placa e emissão de laudos de procedência.
          </p>
          <p>
            Ao criar uma conta ou utilizar os serviços disponíveis, o usuário declara ter lido,
            compreendido e aceito integralmente estes Termos e a nossa Política de Privacidade.
          </p>
        </>
      ),
    },
    {
      id: 'cadastro-e-seguranca-de-conta',
      title: 'Cadastro e responsabilidade pelas informações',
      content: (
        <>
          <p>
            Para acessar a área do cliente e usufruir dos serviços de consulta e créditos, o usuário
            deve realizar cadastro fornecendo dados verdadeiros, exatos e atualizados.
          </p>
          <p>
            É expressamente vedada a criação de contas com dados falsos, documentos de terceiros ou
            identidades simuladas.
          </p>
          <p>
            O usuário é o único responsável pela guarda de suas credenciais de acesso (e-mail e
            senha). Qualquer ação realizada na plataforma com credenciais válidas do usuário será
            juridicamente imputada a ele. Em caso de perda, furto ou suspeita de uso indevido, o
            usuário deve alterar a senha imediatamente ou notificar o suporte da {siteName}.
          </p>
        </>
      ),
    },
    {
      id: 'uso-legitimo-de-consultas-veiculares',
      title: 'Uso legítimo de consultas de histórico veicular',
      content: (
        <>
          <p>
            As consultas de histórico veicular por placa destinam-se exclusivamente a apoiar tomadas
            de decisão comerciais lícitas, verificação preventiva de procedência mecânica/documental
            e proteção contra fraudes em negociações automotivas.
          </p>
          <p>
            O usuário compromete-se a utilizar os dados obtidos em consonância com a boa-fé e com os
            princípios da Lei Geral de Proteção de Dados (LGPD). É estritamente proibido o uso das
            informações para perseguição pessoal, vigilância ilícita, assédio ou qualquer atividade
            lesiva a terceiros.
          </p>
        </>
      ),
    },
    {
      id: 'praticas-proibidas-e-seguranca',
      title: 'Proibição de uso ilícito, fraude, scraping e engenharia reversa',
      content: (
        <>
          <p>É terminantemente vedado ao usuário:</p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-zinc-300">
            <li>
              Empregar robôs, spiders, crawlers, scripts automatizados ou scrapers para extração
              maciça de dados da plataforma.
            </li>
            <li>
              Burlar mecanismos de autenticação, taxas de limite (rate limits), tokens de
              compartilhamento ou permissões RLS.
            </li>
            <li>
              Praticar engenharia reversa, descompilação ou cópia indevida dos códigos-fonte e
              componentes da {siteName}.
            </li>
            <li>
              Revender relatórios veiculares de forma fraudulenta ou repassar acessos a terceiros
              não autorizados.
            </li>
            <li>
              Injetar vírus, malwares ou executar ataques de negação de serviço (DDoS) contra nossa
              infraestrutura.
            </li>
          </ul>
        </>
      ),
    },
    {
      id: 'pagamentos-creditos-e-pacotes',
      title: 'Pagamentos, créditos e pacotes B2B',
      content: (
        <>
          <p>
            Os serviços podem ser adquiridos mediante pagamento avulso ou por meio de Pacotes de
            Créditos B2B disponibilizados na área do cliente.
          </p>
          <p>
            Todos os pagamentos são intermediados de forma segura pelo gateway Mercado Pago (PIX,
            Cartão de Crédito, Débito ou Saldo Mercado Pago, conforme disponibilidade). A liberação do laudo ou a adição de saldo à carteira do usuário
            ocorre de forma automática e instantânea logo após a confirmação irrevogável do
            pagamento enviada pela instituição bancária.
          </p>
          <p>
            Os créditos adquiridos em pacotes corporativos são de titularidade da conta contratante
            e possuem condições claras de vigência e consumo discriminadas no momento da compra.
          </p>
        </>
      ),
    },
    {
      id: 'entrega-de-laudos-e-bases-externas',
      title: 'Condições de entrega de laudos e dependência de fornecedores externos',
      content: (
        <>
          <p>
            Os relatórios veiculares gerados dependem diretamente dos dados catalogados pelos órgãos
            públicos governamentais (Senatran, Detrans estaduais, Renajud e Polícia Rodoviária
            Federal) através de provedores integrados de dados.
          </p>
          <p>
            A <strong>{siteName}</strong> empenha os melhores recursos técnicos para processar e
            formatar as informações com máxima agilidade. Contudo, a plataforma atua como prestadora
            de tecnologia integradora e não pode ser responsabilizada por falhas, incorreções,
            imprecisões cadastrais ou inconsistências originadas exclusivamente nos cadastros
            mantidos pelos órgãos governamentais emissores.
          </p>
        </>
      ),
    },
    {
      id: 'indisponibilidade-retries-e-estornos',
      title: 'Indisponibilidade temporária, retries e estornos',
      content: (
        <>
          <p>
            Se por motivo de instabilidade passageira nos servidores dos órgãos de trânsito uma
            consulta paga sofrer atraso, nosso sistema ativará automaticamente uma rotina resiliente
            de retentativas (retries) para concluir a entrega do laudo.
          </p>
          <p>
            <strong>Política de Estorno:</strong> Caso ocorra uma falha técnica definitiva e
            permanente do provedor sem a entrega do laudo solicitado, o valor pago será
            integralmente estornado via Mercado Pago ou o crédito consumido será imediatamente
            restabelecido na carteira do cliente.
          </p>
          <p>
            Não haverá estorno caso o laudo tenha sido regularmente processado e disponibilizado
            para download, mesmo que o veículo pesquisado não possua débitos ou restrições
            registradas na base oficial.
          </p>
        </>
      ),
    },
    {
      id: 'limitacoes-do-servico',
      title: 'Limitações do serviço e boa-fé',
      content: (
        <p>
          O relatório veicular constitui instrumento complementar e informativo para auxílio em
          negociações. Ele não substitui a vistoria presencial da moto, checagem física de gravação
          de chassi/motor em oficina especializada ou a consulta formal junto ao Detran no ato de
          transferência civil do veículo.
        </p>
      ),
    },
    {
      id: 'propriedade-intelectual',
      title: 'Propriedade intelectual',
      content: (
        <p>
          Todos os elementos visuais, marcas, logotipos, layouts, estruturas de banco de dados,
          textos e códigos-fonte da plataforma pertencem exclusivamente à{' '}
          <strong>{siteName}</strong> ou a seus licenciantes. É vedada a reprodução, distribuição ou
          exploração comercial de qualquer conteúdo do site sem prévia e expressa autorização por
          escrito.
        </p>
      ),
    },
    {
      id: 'suporte-e-atendimento',
      title: 'Suporte e canais de atendimento',
      content: (
        <p>
          Disponibilizamos canais de suporte técnico e comercial através do WhatsApp oficial e
          e-mail institucional durante o horário comercial para esclarecimento de dúvidas sobre
          laudos, compras de crédito e motos em estoque.
        </p>
      ),
    },
    {
      id: 'suspensao-e-encerramento-de-conta',
      title: 'Suspensão e encerramento de conta por abuso',
      content: (
        <p>
          A <strong>{siteName}</strong> reserva-se o direito de suspender cautelarmente ou encerrar
          em definitivo o acesso de qualquer usuário que descumprir as regras destes Termos, violar
          a LGPD, tentar fraudar sistemas de pagamento ou adotar comportamentos incompatíveis com a
          segurança e lisura da plataforma, sem prejuízo da adoção das medidas jurídicas cabíveis.
        </p>
      ),
    },
    {
      id: 'responsabilidade-do-usuario-no-uso-de-dados',
      title: 'Responsabilidade do usuário no uso de dados e relatórios',
      content: (
        <p>
          O usuário assume integral e exclusiva responsabilidade pela custódia, utilização e
          compartilhamento dos laudos e relatórios gerados em sua conta. O compartilhamento público
          via link de laudo deve ser restrito às partes interessadas na negociação, sendo vedada a
          exposição indiscriminada ou difamatória de dados.
        </p>
      ),
    },
    {
      id: 'alteracoes-dos-termos',
      title: 'Alterações destes termos e vigência',
      content: (
        <p>
          Estes Termos de Uso poderão ser modificados a qualquer tempo para acompanhar a evolução
          dos serviços ou adaptações legais. As alterações entrarão em vigor a partir de sua
          publicação. Quando houver alterações substantivas que exijam nova concordância expressa,
          os usuários serão convidados a aceitar a nova versão vigente ao acessarem a plataforma.
        </p>
      ),
    },
    {
      id: 'disposicoes-finais-e-contato',
      title: 'Disposições finais e canal de contato',
      content: (
        <div className="space-y-3">
          <p>
            A eventual tolerância quanto a qualquer descumprimento destes Termos não implicará
            renúncia de direitos ou novação. Estes Termos regem-se pela legislação brasileira.
          </p>
          <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1 text-xs text-zinc-300">
            <p>
              <strong className="text-white">Empresa Responsável:</strong> {siteName}
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
                <strong className="text-white">E-mail:</strong> {contactEmail}
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
      <JsonLd data={breadcrumbsSchema} id="terms-breadcrumbs-schema" />
      <LegalDocumentView
        documentType="terms"
        title="Termos e Condições de Uso"
        subtitle={`Regras, direitos, responsabilidades e condições contratuais para utilização da plataforma e serviços veiculares da ${siteName}.`}
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
