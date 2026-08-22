"use client";

import * as React from "react"
import Image from "next/image"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { ImageFullscreen } from "./image-fullscreen"

interface ImageCarouselProps {
  images: { id: string; url: string; alt?: string }[];
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [isFullscreenOpen, setIsFullscreenOpen] = React.useState(false)
  const [initialSlide, setInitialSlide] = React.useState(0)

  if (!images || images.length === 0) {
    return (
      <div className="w-full aspect-[4/3] bg-muted rounded-xl flex items-center justify-center">
        <span className="text-muted-foreground">Sem imagem</span>
      </div>
    )
  }

  const handleImageClick = (index: number) => {
    setInitialSlide(index)
    setIsFullscreenOpen(true)
  }

  return (
    <>
      <Carousel className="w-full">
        <CarouselContent>
          {images.map((image, index) => (
            <CarouselItem key={image.id}>
              <div 
                className="relative aspect-[4/3] overflow-hidden rounded-xl cursor-pointer"
                onClick={() => handleImageClick(index)}
              >
                <Image
                  src={image.url}
                  alt={image.alt || `Imagem ${index + 1}`}
                  fill
                  className="object-cover transition-transform hover:scale-105"
                  priority={index === 0}
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        {images.length > 1 && (
          <>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
          </>
        )}
      </Carousel>

      <ImageFullscreen 
        images={images} 
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        initialSlide={initialSlide}
      />
    </>
  )
}
