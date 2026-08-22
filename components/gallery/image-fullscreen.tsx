'use client';

import * as React from 'react';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageFullscreenProps {
  images: { id: string; url: string; alt?: string }[];
  isOpen: boolean;
  onClose: () => void;
  initialSlide?: number;
}

export function ImageFullscreen({
  images,
  isOpen,
  onClose,
  initialSlide = 0,
}: ImageFullscreenProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialSlide);

  React.useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialSlide);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, initialSlide]);

  const handleNext = React.useCallback(() => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images]);

  const handlePrev = React.useCallback(() => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleNext, handlePrev]);

  if (!isOpen || !images || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-between bg-black/95 backdrop-blur-md select-none animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between p-4 md:px-8 z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-semibold border border-white/10 tabular-nums">
          {currentIndex + 1} / {images.length}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          aria-label="Fechar galeria"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Main Image Display */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center p-4">
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 md:left-8 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/10 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
            aria-label="Imagem anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        <div className="relative w-full h-full max-w-6xl max-h-[82vh] flex items-center justify-center">
          <Image
            key={currentImage.id || currentImage.url || currentIndex}
            src={currentImage.url}
            alt={currentImage.alt || `Imagem ${currentIndex + 1}`}
            fill
            sizes="100vw"
            priority
            className="object-contain duration-200 transition-all"
          />
        </div>

        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 md:right-8 z-20 p-3 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/10 shadow-lg transition-all cursor-pointer hover:scale-105 active:scale-95"
            aria-label="Próxima imagem"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div className="p-4 z-10 bg-gradient-to-t from-black/80 to-transparent flex justify-center">
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 scrollbar-thin px-4">
            {images.map((image, index) => {
              const isSelected = currentIndex === index;
              return (
                <button
                  key={image.id || index}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    'relative w-16 h-12 md:w-20 md:h-14 shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer',
                    isSelected
                      ? 'border-[#c9a44c] ring-2 ring-[#c9a44c]/50 scale-105'
                      : 'border-transparent opacity-50 hover:opacity-100',
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
        </div>
      )}
    </div>
  );
}
