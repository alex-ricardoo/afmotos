'use client';

import { MapPin, Navigation } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LocationSettings } from '@/types/site-settings';

function GoogleMapsEmbed({
  address,
  latitude,
  longitude,
  siteName,
}: {
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  siteName?: string;
}) {
  const query = latitude != null && longitude != null
    ? `${latitude},${longitude}`
    : address;
  const embedUrl = `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;

  return (
    <iframe
      title={`Localização de ${siteName || 'estabelecimento'}`}
      src={embedUrl}
      className="h-full w-full border-0"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      allowFullScreen
    />
  );
}

interface AboutLocationProps {
  address: string;
  mapsUrl: string | null;
  locationSettings?: LocationSettings;
  siteName?: string;
}

export function AboutLocation({ address, mapsUrl, locationSettings, siteName }: AboutLocationProps) {
  if (!address && !mapsUrl) return null;

  const resolvedMapsUrl = mapsUrl;

  return (
    <section className="w-full bg-white dark:bg-zinc-950 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-center md:items-start">
          
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2 mb-4">
                <MapPin className="w-6 h-6 text-red-600 dark:text-red-500" />
                Onde estamos
              </h2>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {address}
              </p>
            </div>
            
            {locationSettings?.instructions && (
              <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-xl border border-zinc-100 dark:border-zinc-800">
                <h3 className="font-semibold text-zinc-900 dark:text-white mb-2">
                  Como chegar
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 whitespace-pre-line">
                  {locationSettings.instructions}
                </p>
              </div>
            )}

            {resolvedMapsUrl && (
              <a 
                href={resolvedMapsUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className={cn(buttonVariants({ size: 'lg' }), "w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white gap-2")}
              >
                <Navigation className="w-4 h-4" />
                Abrir no Google Maps
              </a>
            )}
          </div>

          <div className="flex-1 w-full relative">
            <div className="aspect-square md:aspect-[4/3] w-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center relative">
              {address || (locationSettings?.latitude && locationSettings?.longitude) ? (
                <GoogleMapsEmbed
                  latitude={locationSettings?.latitude} 
                  longitude={locationSettings?.longitude}
                  address={address}
                  siteName={siteName}
                />
              ) : (
                /* Fallback de mapa estático quando não houver lat/lng */
                <div className="text-center p-6 text-zinc-500 dark:text-zinc-400">
                  <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Mapa interativo não configurado.</p>
                  <p className="text-sm mt-1">Configure a latitude e longitude no painel.</p>
                  {resolvedMapsUrl && (
                    <a 
                      href={resolvedMapsUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), "mt-4")}
                    >
                      Abrir no Google Maps
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
