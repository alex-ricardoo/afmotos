import React from 'react';
import { ShieldCheck, Lock, Eye, FileText, CheckCircle2 } from 'lucide-react';
import { CONSTANTS } from '@/lib/utils/constants';
import { getSettings } from '@/lib/actions/settings';
import { formatPhoneForDisplay } from '@/lib/utils/whatsapp';

import { Metadata } from 'next';
import { buildPageMetadata, JsonLd, buildBreadcrumbsSchema, SEO_CONFIG } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  const siteName = settings?.site_name || SEO_CONFIG.defaultStoreName;

  return buildPageMetadata({
    title: `Política de Privacidade | ${siteName}`,
    description: `Política de Privacidade e Proteção de Dados da ${siteName} em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).`,
    path: '/politica-de-privacidade',
  });
}

export default async function PoliticaPrivacidadePage() {
  const settings = await getSettings();
  const siteName = settings?.site_name || CONSTANTS.STORE_NAME;
  const whatsappPhone = settings?.whatsapp_phone || CONSTANTS.CONTACT_PHONE;

  const breadcrumbsSchema = buildBreadcrumbsSchema([
    { name: 'Início', path: '/' },
    { name: 'Política de Privacidade', path: '/politica-de-privacidade' },
  ]);

  return (
    <div className="bg-[#050505] min-h-screen pb-16 text-[#f4f4f2]">
      <JsonLd data={breadcrumbsSchema} id="privacy-breadcrumbs-schema" />
      {/* Header Hero */}
      <div className="bg-[#0d0d0d] text-white py-12 md:py-16 border-b border-[#c9a44c]/20">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151515] border border-[#c9a44c]/30 text-xs font-bold text-[#e3c56c]">
            <ShieldCheck className="w-4 h-4 text-[#e3c56c]" />
            <span>LGPD e Segurança da Informação</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-heading">
            Política de Privacidade
          </h1>

          <p className="text-base md:text-lg text-[#a6a6a1] leading-relaxed">
            Transparência sobre como tratamos seus dados pessoais em conformidade com a Lei Geral de
            Proteção de Dados (Lei nº 13.709/2018 - LGPD) e o Marco Civil da Internet (Lei nº
            12.965/2014).
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-6 py-12 max-w-4xl space-y-10">
        {/* Intro Card */}
        <div className="bg-[#151515] p-6 sm:p-8 rounded-3xl border border-[#c9a44c]/20 space-y-4 text-sm text-[#d1d5db] leading-relaxed">
          <p>
            A <strong>{siteName}</strong> preza pela segurança, privacidade e transparência no
            tratamento de informações de seus clientes e visitantes. Este documento explica de forma
            simples e clara quais dados coletamos, a finalidade do uso e quais são os seus direitos
            como titular de dados pessoais.
          </p>
          <p className="text-xs text-[#a6a6a1]">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8 text-sm text-[#d1d5db] leading-relaxed">
          {/* Section 1 */}
          <section className="bg-[#151515] p-6 sm:p-8 rounded-3xl border border-[#c9a44c]/20 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
              <Eye className="w-5 h-5 text-[#e3c56c]" />
              1. Quais Dados Coletamos
            </h2>
            <p>
              Coletamos apenas as informações estritamente necessárias para viabilizar o atendimento
              comercial solicitado por você em nosso site:
            </p>
            <ul className="list-disc list-inside space-y-1 text-[#a6a6a1] pl-2">
              <li>
                <strong>Identificação e Contato:</strong> Nome completo, número de telefone /
                WhatsApp e e-mail.
              </li>
              <li>
                <strong>Dados de Veículos:</strong> Marca, modelo, ano, quilometragem, valor
                pretendido e fotos da moto (quando preenchido o formulário de anúncio de moto).
              </li>
              <li>
                <strong>Dados de Navegação:</strong> Informações técnicas básicas de acesso (como
                IP, data e hora) para segurança da aplicação, conforme exigido pelo Marco Civil da
                Internet.
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-[#151515] p-6 sm:p-8 rounded-3xl border border-[#c9a44c]/20 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
              <FileText className="w-5 h-5 text-[#e3c56c]" />
              2. Finalidade do Tratamento de Dados
            </h2>
            <p>Os dados fornecidos são utilizados exclusivamente para as seguintes finalidades:</p>
            <ul className="list-disc list-inside space-y-1 text-[#a6a6a1] pl-2">
              <li>
                Responder a dúvidas e solicitações de compra, venda ou anúncio de motocicletas.
              </li>
              <li>
                Entrar em contato via WhatsApp ou telefone para fornecer detalhes de motos
                anunciadas.
              </li>
              <li>Avaliar informações enviadas para eventual anúncio de veículo.</li>
              <li>Cumprimento de obrigações legais e regulatórias.</li>
            </ul>
            <p className="pt-2 text-xs text-[#e3c56c] font-semibold">
              Importante: A {siteName} não comercializa, não aluga e não repassa seus dados pessoais
              a terceiros para fins publicitários ou disparos em massa.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-[#151515] p-6 sm:p-8 rounded-3xl border border-[#c9a44c]/20 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
              <Lock className="w-5 h-5 text-[#e3c56c]" />
              3. Armazenamento e Segurança
            </h2>
            <p>
              Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra
              acesso não autorizado, perda, alteração ou qualquer forma de tratamento inadequado. Os
              dados são armazenados em infraestrutura de nuvem segura com criptografia em trânsito
              (HTTPS/TLS).
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-[#151515] p-6 sm:p-8 rounded-3xl border border-[#c9a44c]/20 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
              <CheckCircle2 className="w-5 h-5 text-[#e3c56c]" />
              4. Seus Direitos como Titular (Art. 18 da LGPD)
            </h2>
            <p>Você tem total direito de, a qualquer momento e mediante solicitação gratuita:</p>
            <ul className="list-disc list-inside space-y-1 text-[#a6a6a1] pl-2">
              <li>Confirmar a existência de tratamento de seus dados.</li>
              <li>Acessar e corrigir dados incompletos ou desatualizados.</li>
              <li>Solicitar a exclusão ou anonimização de seus dados de nossa base de contatos.</li>
              <li>Revogar o consentimento para recebimento de comunicações.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="bg-[#151515] p-6 sm:p-8 rounded-3xl border border-[#c9a44c]/20 space-y-3">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
              <ShieldCheck className="w-5 h-5 text-[#e3c56c]" />
              5. Canal de Atendimento e Encarregado de Dados
            </h2>
            <p>
              Para exercer qualquer um de seus direitos ou esclarecer dúvidas sobre esta Política de
              Privacidade, você pode entrar em contato diretamente com nossa equipe:
            </p>
            <div className="bg-[#0d0d0d] p-4 rounded-xl border border-[#c9a44c]/15 space-y-1 text-xs text-[#a6a6a1]">
              <p>
                <strong className="text-white">Responsável:</strong> {siteName}
              </p>
              <p>
                <strong className="text-white">WhatsApp:</strong>{' '}
                {formatPhoneForDisplay(whatsappPhone)}
              </p>
              <p>
                <strong className="text-white">Atendimento:</strong> {CONSTANTS.OPENING_HOURS}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
