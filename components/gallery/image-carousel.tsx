'use client';

import * as React from 'react';
import Image from 'next/image';
import { Maximize2, ImageIcon } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { ImageFullscreen } from './image-fullscreen';
import { cn } from '@/lib/utils';

interface ImageCarouselProps {
  images: { id: string; url: string; alt?: string; alt_text?: string }[];
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [api, setApi] = React.useState<CarouselApi>();
  const [current, setCurrent] = React.useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = React.useState(false);

  React.useEffect(() => {
    if (!api) return;
    const onSelect = () => {
      setCurrent(api.selectedScrollSnap());
    };
    api.on('select', onSelect);
    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[16/10] bg-zinc-900 rounded-2xl flex flex-col items-center justify-center text-zinc-500 gap-2 border border-border">
        <ImageIcon className="w-10 h-10 opacity-30" />
        <span className="text-sm font-medium">Fotos em preparação pela equipe técnica</span>
      </div>
    );
  }

  const handleThumbnailClick = (index: number) => {
    if (api) {
      api.scrollTo(index);
    }
  };

  return (
    <div className="space-y-3">
      {/* Main Carousel View */}
      <div className="relative group rounded-3xl overflow-hidden bg-zinc-950 border border-border shadow-md">
        <Carousel setApi={setApi} className="w-full">
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={image.id || index}>
                <div
                  className="relative aspect-[16/10] overflow-hidden cursor-pointer"
                  onClick={() => setIsFullscreenOpen(true)}
                >
                  <Image
                    src={image.url}
                    alt={image.alt || image.alt_text || `Foto ${index + 1} da motocicleta`}
                    fill
                    priority={index === 0}
                    sizes="(max-width: 768px) 100vw, 70vw"
                    className="object-cover"
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          {images.length > 1 && (
            <>
              <CarouselPrevious className="left-4 bg-black/60 hover:bg-black text-white border-white/20 h-10 w-10 opacity-80 group-hover:opacity-100 transition-opacity" />
              <CarouselNext className="right-4 bg-black/60 hover:bg-black text-white border-white/20 h-10 w-10 opacity-80 group-hover:opacity-100 transition-opacity" />
            </>
          )}
        </Carousel>

        {/* Counter Badge */}
        <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-semibold border border-white/10 shadow-xs tabular-nums">
          {current + 1} / {images.length}
        </div>

        {/* Fullscreen Trigger */}
        <button
          type="button"
          onClick={() => setIsFullscreenOpen(true)}
          className="absolute bottom-4 right-4 z-10 p-2.5 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-white border border-white/10 shadow-md transition-all cursor-pointer"
          aria-label="Expandir galeria em tela cheia"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
          {images.map((image, index) => {
            const isSelected = current === index;
            return (
              <button
                key={image.id || index}
                type="button"
                onClick={() => handleThumbnailClick(index)}
                className={cn(
                  'relative w-20 h-14 sm:w-24 sm:h-16 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer',
                  isSelected
                    ? 'border-[#c9a44c] ring-2 ring-[#c9a44c]/40 scale-95 shadow-sm'
                    : 'border-transparent opacity-60 hover:opacity-100'
                )}
              >
                <Image
                  src={image.url}
                  alt={`Miniatura ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      <ImageFullscreen
        images={images}
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        initialSlide={current}
      />
    </div>
  );
}
