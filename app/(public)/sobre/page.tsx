import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicSiteSettings } from '@/lib/settings/server-queries';
import { AboutHero } from '@/components/about/about-hero';
import { AboutDifferentials } from '@/components/about/about-differentials';
import { AboutLocation } from '@/components/about/about-location';
import { AboutContact } from '@/components/about/about-contact';
import {
  buildPageMetadata,
  JsonLd,
  buildAutoDealerSchema,
  buildBreadcrumbsSchema,
  SEO_CONFIG,
} from '@/lib/seo';

export const revalidate = 60; // Revalida a cada 1 minuto (Incremental Static Regeneration)

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();

  if (!settings || (settings.about && !settings.about.isPublished)) {
    return {
      title: `Sobre | ${settings?.siteName || SEO_CONFIG.defaultStoreName}`,
      robots: { index: false, follow: true },
    };
  }

  const seo = settings.about?.seo;
  const title =
    seo?.title || `Sobre a ${settings.siteName} | Loja de Motos em Cabo de Santo Agostinho - PE`;
  const description =
    seo?.description ||
    settings.description ||
    `Conheça a história, compromisso e equipe da ${settings.siteName} em Cabo de Santo Agostinho - PE. Qualidade e transparência na compra e venda de motos.`;

  return buildPageMetadata({
    title,
    description,
    path: '/sobre',
    ogImage: seo?.ogImageUrl || settings.logo?.src,
  });
}

export default async function SobrePage() {
  const settings = await getPublicSiteSettings();

  if (!settings || !settings.about || !settings.about.isPublished) {
    notFound();
  }

  const { about } = settings;

  const autoDealerSchema = buildAutoDealerSchema({
    siteName: settings.siteName,
    description: about.description || settings.description,
    phone: settings.phone,
    email: settings.email,
    address: settings.address,
    detailedAddress: settings.detailedAddress,
    logoUrl: settings.logo?.src,
    socialLinks: settings.socialLinks,
    latitude: about.location?.latitude,
    longitude: about.location?.longitude,
  });

  const breadcrumbsSchema = buildBreadcrumbsSchema([
    { name: 'Início', path: '/' },
    { name: 'Sobre Nós', path: '/sobre' },
  ]);

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100">
      <JsonLd data={autoDealerSchema} id="about-autodealer-schema" />
      <JsonLd data={breadcrumbsSchema} id="about-breadcrumbs-schema" />
      <AboutHero
        title={about.heroTitle}
        subtitle={about.heroSubtitle}
        description={about.description}
        additionalText={about.additionalText}
        storeImages={about.storeImages}
        siteName={settings.siteName}
      />

      {about.differentials && about.differentials.length > 0 && (
        <AboutDifferentials differentials={about.differentials} siteName={settings.siteName} />
      )}

      <AboutLocation
        address={settings.address}
        mapsUrl={settings.mapsUrl}
        locationSettings={about.location}
        siteName={settings.siteName}
      />

      <AboutContact
        phone={settings.phone}
        email={settings.email}
        socialLinks={settings.socialLinks}
        businessHours={settings.businessHours}
        siteName={settings.siteName}
      />
    </div>
  );
}
