'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { getSiteLogo } from '@/lib/site-settings';
import { getPublicSiteSettings } from '@/lib/settings/server-queries';

// Fix for default Leaflet icons in Webpack/Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

import { CONSTANTS } from '@/lib/utils/constants';

interface LeafletMapProps {
  latitude?: number | null;
  longitude?: number | null;
  address: string;
  storeName?: string;
  logoUrl?: string;
}

export default function LeafletMap({ latitude, longitude, address, storeName = CONSTANTS.STORE_NAME, logoUrl }: LeafletMapProps) {
  const [position, setPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [loadingMap, setLoadingMap] = useState(!position);
  const [icon, setIcon] = useState<L.Icon | L.DivIcon | null>(null);

  useEffect(() => {
    async function fetchCoordinates() {
      if (position) return; // already have it
      if (!address) {
        setLoadingMap(false);
        return;
      }
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`);
        const data = await res.json();
        
        if (data && data.length > 0) {
          setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch (error) {
        console.error("Failed to geocode address:", error);
      } finally {
        setLoadingMap(false);
      }
    }
    
    fetchCoordinates();
  }, [address, position]);

  useEffect(() => {
    // If a logo is provided, create a custom DivIcon to render it as a rounded image marker
    if (logoUrl) {
      const customIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="width: 40px; height: 40px; border-radius: 50%; border: 3px solid #f59e0b; overflow: hidden; background-color: #09090b; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);">
            <img src="${logoUrl}" alt="${storeName}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20],
      });
      setIcon(customIcon);
    } else {
      setIcon(new L.Icon.Default());
    }
  }, [logoUrl, storeName]);

  if (loadingMap || !icon) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-zinc-500">
        <span className="text-sm">Buscando localização no mapa...</span>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-900 text-zinc-500 p-6 text-center">
        <span className="text-sm mb-2">Não foi possível localizar o endereço automaticamente no mapa.</span>
        <span className="text-xs">Por favor, configure a latitude e longitude no painel de administração.</span>
      </div>
    );
  }

  return (
    <MapContainer 
      center={position} 
      zoom={15} 
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%', borderRadius: '1rem', zIndex: 10 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} icon={icon}>
        <Popup>
          <div className="font-bold text-zinc-900">{storeName}</div>
          <div className="text-sm text-zinc-600 mt-1">{address}</div>
        </Popup>
      </Marker>
    </MapContainer>
  );
}
