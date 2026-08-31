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
    `Encontre motos usadas e seminovas na ${siteName}, em Cabo de Santo Agostinho - PE. Confira nosso estoque revisado, com laudo cautelar aprovado e garantia. Atendimento direto pelo WhatsApp.`;
  const logoUrl = settings?.logo?.src || `${getBaseSiteUrl()}/logo.jpg`;

  return {
    title: {
      default: `${siteName} | Motos usadas e seminovas em Cabo de Santo Agostinho - PE`,
      template: `%s | ${siteName}`,
    },
    description,
    metadataBase: new URL(getBaseSiteUrl()),
    applicationName: siteName,
    authors: [{ name: siteName }],
    generator: 'Next.js',
    keywords: [
      'motos usadas Cabo de Santo Agostinho',
      'motos seminovas Pernambuco',
      'comprar moto Recife',
      'venda de motos usadas',
      siteName,
      'consignação de motos PE',
    ],
    openGraph: {
      title: `${siteName} | Motos usadas e seminovas em Cabo de Santo Agostinho - PE`,
      description,
      url: getBaseSiteUrl(),
      siteName,
      locale: SEO_CONFIG.locale,
      type: 'website',
      images: [
        {
          url: logoUrl,
          width: 800,
          height: 800,
          alt: siteName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteName} | Motos usadas e seminovas em Cabo de Santo Agostinho - PE`,
      description,
      images: [logoUrl],
    },
    icons: {
      icon: '/icon.png',
      apple: '/icon.png',
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
