import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { SEO_CONFIG, getBaseSiteUrl, shouldBlockIndexing } from '@/lib/seo';
import './globals.css';

const geistSans = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});


import { getPublicSiteSettings } from '@/lib/settings/server-queries';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  const siteName = settings?.siteName || SEO_CONFIG.defaultStoreName;
  const description =
    settings?.description ||
    `Encontre veículos e motos seminovas na ${siteName}, em Cabo de Santo Agostinho - PE. Consulta oficial de histórico veicular por placa, procedência checada e atendimento direto pelo WhatsApp.`;
  const logoUrl = settings?.logo?.src || `${getBaseSiteUrl()}/logo.png`;

  return {
    title: {
      default: `${siteName} | Veículos, Motos e Histórico Veicular em Cabo de Santo Agostinho - PE`,
      template: `%s | ${siteName}`,
    },
    description,
    metadataBase: new URL(getBaseSiteUrl()),
    applicationName: siteName,
    authors: [{ name: siteName }],
    generator: 'Next.js',
    keywords: [
      'histórico veicular',
      'consulta veicular por placa',
      'consulta de placa',
      'laudo veicular',
      'laudo cautelar',
      'consulta placa leilão',
      'AF Veículos',
      'AF Veículos PE',
      'AF Motos',
      'veículos seminovos Cabo de Santo Agostinho',
      'motos usadas Cabo de Santo Agostinho',
      'motos seminovas Pernambuco',
      'comprar moto Recife',
      'venda de motos usadas',
      siteName,
      'consignação de veículos PE',
    ],
    openGraph: {
      title: `${siteName} | Veículos, Motos e Histórico Veicular em Cabo de Santo Agostinho - PE`,
      description,
      url: getBaseSiteUrl(),
      siteName,
      locale: SEO_CONFIG.locale,
      type: 'website',
      images: [
        {
          url: logoUrl,
          width: 1200,
          height: 630,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteName} | Veículos, Motos e Histórico Veicular em Cabo de Santo Agostinho - PE`,
      description,
      images: [logoUrl],
    },
    icons: {
      icon: '/icon.png',
      apple: '/icon.png',
    },
    verification: {
      google: 'google543d5b2965f85aa8',
    },
    robots: shouldBlockIndexing()
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-snippet': -1,
            'max-video-preview': -1,
          },
        },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#050505] text-[#f4f4f2] font-sans selection:bg-[#c9a44c] selection:text-black">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}

