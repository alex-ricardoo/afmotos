import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicSiteSettings } from '@/lib/settings/server-queries';
import { VehicleHistoryProvider } from '@/components/vehicle-history/vehicle-history-context';
import { VehicleHistoryStickyWhatsApp } from '@/components/vehicle-history/vehicle-history-sticky-whatsapp';
import { VehicleHistoryHero } from '@/components/vehicle-history/vehicle-history-hero';
import { VehicleHistoryStats } from '@/components/vehicle-history/vehicle-history-stats';
import { VehicleHistoryBenefits } from '@/components/vehicle-history/vehicle-history-benefits';
import { VehicleHistoryReportMockup } from '@/components/vehicle-history/vehicle-history-report-mockup';
import { VehicleHistoryHowItWorks } from '@/components/vehicle-history/vehicle-history-how-it-works';
import { VehicleHistoryPricing } from '@/components/vehicle-history/vehicle-history-pricing';
import { VehicleHistoryReasons } from '@/components/vehicle-history/vehicle-history-reasons';
import { VehicleHistoryDisclaimer } from '@/components/vehicle-history/vehicle-history-disclaimer';
import { VehicleHistoryFaq } from '@/components/vehicle-history/vehicle-history-faq';
import { VEHICLE_HISTORY_FAQS } from '@/components/vehicle-history/vehicle-history-faq-data';
import { VehicleHistoryCtaFinal } from '@/components/vehicle-history/vehicle-history-cta-final';
import { buildPageMetadata, JsonLd, SEO_CONFIG } from '@/lib/seo';
import { buildVehicleHistoryServiceSchema } from '@/lib/seo/schemas/vehicle-history';
import { getVehicleHistorySettings } from '@/lib/site-settings';

export const revalidate = 60; // Revalida a cada 1 minuto (ISR)

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const vehicleHistory = settings?.vehicleHistory;

  if (!settings || (vehicleHistory && !vehicleHistory.isEnabled)) {
    return {
      title: `Histórico Veicular | ${settings?.siteName || SEO_CONFIG.defaultStoreName}`,
      robots: { index: false, follow: false },
    };
  }

  const siteName = settings.siteName || SEO_CONFIG.defaultStoreName;
  const priceFormatted = (vehicleHistory?.price || 39.99).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const title = `Consulta Veicular Oficial | Qualquer Veículo por Placa | ${siteName}`;
  const description = `Não caia em golpes. Consulte histórico completo de leilão, sinistro, gravames, multas e débitos para motos, carros, caminhões e utilitários em todo o Brasil por apenas ${priceFormatted} na ${siteName}. Laudo oficial imediato em PDF no WhatsApp.`;

  return buildPageMetadata({
    title,
    description,
    path: '/historico-veicular',
    ogImage: settings.logo?.src,
  });
}

export default async function HistoricoVeicularPage() {
  const settings = await getPublicSiteSettings();

  if (!settings) {
    notFound();
  }

  const vehicleHistory = settings.vehicleHistory || getVehicleHistorySettings(null);

  if (!vehicleHistory.isEnabled) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16 bg-[#080B11]">
        <div className="p-8 rounded-3xl bg-[#131A26] border border-[#1F293D] max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-white">Serviço Temporariamente Indisponível</h1>
          <p className="text-sm text-zinc-400">
            O serviço de Histórico Veicular está em manutenção temporária. Por favor, volte mais tarde ou fale conosco pelo WhatsApp principal.
          </p>
        </div>
      </div>
    );
  }

  const schemas = buildVehicleHistoryServiceSchema({
    siteName: settings.siteName,
    price: vehicleHistory.price,
    currency: vehicleHistory.currency,
    description: vehicleHistory.heroSubtitle,
    faqs: VEHICLE_HISTORY_FAQS.map((f) => ({
      question: f.question,
      answer: f.answer,
    })),
  });

  return (
    <VehicleHistoryProvider>
      <div className="flex flex-col min-h-screen bg-[#080B11] text-zinc-100 selection:bg-amber-400 selection:text-slate-950 font-sans relative">
        {/* Structured Data (Schema.org) */}
        <JsonLd data={schemas} id="vehicle-history-schemas" />

        {/* Dedicated High-Conversion Floating Sticky WhatsApp Button */}
        <VehicleHistoryStickyWhatsApp />

        {/* A. Hero Section com Headline Direta, Input de Placa e CTA Dourado */}
        <VehicleHistoryHero
          settings={vehicleHistory}
          siteName={settings.siteName}
          defaultPhone={settings.phone}
        />

        {/* B. Barra de Prova Social & Métricas de Alto Impacto */}
        <VehicleHistoryStats siteShortName={settings.shortName} />

        {/* C. O que o Laudo Revela (6 Pilares com Badges de Alerta) */}
        <VehicleHistoryBenefits />

        {/* D. Demonstração Visual do Produto (Preview Real com Zoom nos Alertas) */}
        <VehicleHistoryReportMockup siteName={settings.siteName} />

        {/* E. Como Funciona (3 Passos Simples) */}
        <VehicleHistoryHowItWorks siteName={settings.siteName} />

        {/* F. Seção de Oferta & Checkout Transparente (Preço Ancorado + Oferta Limitada) */}
        <VehicleHistoryPricing
          settings={vehicleHistory}
          siteName={settings.siteName}
          defaultPhone={settings.phone}
        />

        {/* G. Vantagens na Negociação (Compra e Venda) */}
        <VehicleHistoryReasons />

        {/* H. Transparência & Limitações do Serviço */}
        <VehicleHistoryDisclaimer customDisclaimer={vehicleHistory.disclaimerText} />

        {/* I. Perguntas Frequentes (FAQ Limpo e Focado) */}
        <VehicleHistoryFaq
          siteName={settings.siteName}
          phone={vehicleHistory.whatsappPhoneOverride || settings.phone}
          price={vehicleHistory.price}
        />

        {/* J. CTA Final de Fechamento */}
        <VehicleHistoryCtaFinal
          settings={vehicleHistory}
          siteName={settings.siteName}
          defaultPhone={settings.phone}
        />
      </div>
    </VehicleHistoryProvider>
  );
}

