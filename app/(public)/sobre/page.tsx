import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicSiteSettings } from '@/lib/settings/server-queries';
import { AboutHero } from '@/components/about/about-hero';
import { AboutDifferentials } from '@/components/about/about-differentials';
import { AboutLocation } from '@/components/about/about-location';
import { AboutContact } from '@/components/about/about-contact';

export const revalidate = 60; // Revalida a cada 1 minuto (Incremental Static Regeneration)

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPublicSiteSettings();
  
  if (!settings || (settings.about && !settings.about.isPublished)) {
    return {
      title: 'Sobre - AF Motos',
    };
  }

  const seo = settings.about?.seo;
  const title = seo?.title || `Sobre a ${settings.siteName}`;
  const description = seo?.description || settings.description;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: seo?.ogImageUrl ? [seo.ogImageUrl] : undefined,
    },
    alternates: {
      canonical: seo?.canonicalUrl || undefined,
    },
  };
}

export default async function SobrePage() {
  const settings = await getPublicSiteSettings();

  // Se não houver configurações de 'about' ou a página não estiver publicada, podemos exibir um notFound
  // (ou você poderia renderizar uma página "Em breve" padronizada)
  if (!settings || !settings.about || !settings.about.isPublished) {
    notFound();
  }

  const { about } = settings;

  return (
    <div className="flex flex-col min-h-screen">
      <AboutHero
        title={about.heroTitle}
        subtitle={about.heroSubtitle}
        description={about.description}
        additionalText={about.additionalText}
        storeImages={about.storeImages}
      />
      
      {about.differentials && about.differentials.length > 0 && (
        <AboutDifferentials differentials={about.differentials} />
      )}
      
      <AboutLocation
        address={settings.address}
        mapsUrl={settings.mapsUrl}
        locationSettings={about.location}
        siteName={settings.siteName}
        logoUrl={settings.logo?.src}
      />
      
      <AboutContact
        phone={settings.phone}
        email={settings.email}
        socialLinks={settings.socialLinks}
        businessHours={settings.businessHours}
      />
    </div>
  );
}
