import Image from 'next/image';
import { StoreImage } from '@/types/site-settings';
import { CONSTANTS } from '@/lib/utils/constants';

interface AboutHeroProps {
  title?: string;
  subtitle?: string;
  description?: string;
  additionalText?: string;
  storeImages?: StoreImage[];
  siteName?: string;
}

export function AboutHero({ title, subtitle, description, additionalText, storeImages = [], siteName }: AboutHeroProps) {
  const displayTitle = title || `Sobre a ${siteName || CONSTANTS.STORE_NAME}`;
  const activeImages = storeImages.filter(img => img.isActive && img.url);
  const hasImages = activeImages.length > 0;
  const isSingleImage = activeImages.length === 1;
  
  return (
    <section className="w-full bg-white dark:bg-zinc-950">
      {/* Imagem de Destaque - Única */}
      {isSingleImage && (
        <div className="relative w-full h-[30vh] md:h-[50vh] bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
          <Image
            src={activeImages[0].url!}
            alt={activeImages[0].alt || displayTitle}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-md text-center px-4">
              {displayTitle}
            </h1>
          </div>
        </div>
      )}

      {/* Mosaico - Múltiplas Imagens */}
      {!isSingleImage && hasImages && (
        <div className="w-full bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
          <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-2 gap-2 md:gap-4 h-[40vh] md:h-[60vh]">
              {/* Imagem Principal (maior) */}
              <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden group">
                <Image
                  src={activeImages[0].url!}
                  alt={activeImages[0].alt || displayTitle}
                  fill
                  priority
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end">
                  <h1 className="text-3xl md:text-5xl font-bold text-white p-6 tracking-tight drop-shadow-md">
                    {displayTitle}
                  </h1>
                </div>
              </div>
              
              {/* Imagens secundárias */}
              {activeImages.slice(1, 5).map((img, idx) => (
                <div key={idx} className="relative rounded-2xl overflow-hidden group">
                  <Image
                    src={img.url!}
                    alt={img.alt || `${displayTitle} - ${idx + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        {!hasImages && (
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 dark:text-white tracking-tight mb-8">
            {displayTitle}
          </h1>
        )}
        
        {subtitle && (
          <h2 className="text-xl md:text-2xl font-semibold text-zinc-700 dark:text-zinc-300 mb-6">
            {subtitle}
          </h2>
        )}

        {description && (
          <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed whitespace-pre-line">
            {description}
          </div>
        )}

        {additionalText && (
          <div className="prose prose-zinc dark:prose-invert max-w-none text-zinc-600 dark:text-zinc-400 text-base leading-relaxed mt-6 whitespace-pre-line">
            {additionalText}
          </div>
        )}
      </div>
    </section>
  );
}
