'use client';

import React from 'react';
import { MapPin, Navigation, Compass, ExternalLink } from 'lucide-react';
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
  const query =
    latitude != null && longitude != null ? `${latitude},${longitude}` : address;
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

export function AboutLocation({
  address,
  mapsUrl,
  locationSettings,
  siteName,
}: AboutLocationProps) {
  if (!address && !mapsUrl) return null;

  const resolvedMapsUrl = mapsUrl;

  return (
    <section className="w-full bg-gradient-to-b from-zinc-950 via-zinc-900/40 to-zinc-950 py-16 md:py-24 border-t border-zinc-800/80 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-400">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Nossa Loja Física</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black text-white font-heading tracking-tight">
            Venha nos Visitar
          </h2>

          <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
            Estamos de portas abertas para receber você com um café especial e apresentar nossa frota de perto.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center lg:items-stretch">
          {/* Informações de Endereço e Como Chegar */}
          <div className="flex-1 w-full flex flex-col justify-between space-y-6">
            <div className="bg-zinc-900/70 backdrop-blur-xl p-6 sm:p-8 rounded-3xl border border-zinc-800/80 shadow-xl space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 shadow-md shadow-amber-500/10">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block mb-1">
                    Endereço Oficial
                  </span>
                  <p className="text-base sm:text-lg text-white font-medium leading-relaxed">
                    {address}
                  </p>
                </div>
              </div>

              {locationSettings?.instructions && (
                <div className="bg-zinc-950/80 p-5 rounded-2xl border border-zinc-800/80 space-y-1.5">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5" />
                    Ponto de Referência & Dicas
                  </span>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line">
                    {locationSettings.instructions}
                  </p>
                </div>
              )}

              {resolvedMapsUrl && (
                <div className="pt-2">
                  <a
                    href={resolvedMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 font-bold text-sm transition-all shadow-lg shadow-amber-500/15 active:scale-[0.98] cursor-pointer"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Traçar Rota no Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-60 ml-0.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Mapa Interativo Embed */}
          <div className="flex-1 w-full">
            <div className="aspect-square sm:aspect-[4/3] w-full rounded-3xl overflow-hidden bg-zinc-900 border border-zinc-800/80 shadow-2xl relative group">
              {address || (locationSettings?.latitude && locationSettings?.longitude) ? (
                <GoogleMapsEmbed
                  latitude={locationSettings?.latitude}
                  longitude={locationSettings?.longitude}
                  address={address}
                  siteName={siteName}
                />
              ) : (
                <div className="text-center p-8 text-zinc-400 flex flex-col items-center justify-center h-full">
                  <MapPin className="w-12 h-12 mx-auto mb-4 text-amber-500/40" />
                  <p className="font-semibold text-white">Mapa em configuração</p>
                  <p className="text-sm text-zinc-400 mt-1">{address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
