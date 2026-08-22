"use client";

import * as React from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"

interface ImageFullscreenProps {
  images: { id: string; url: string; alt?: string }[];
  isOpen: boolean;
  onClose: () => void;
  initialSlide?: number;
}

export function ImageFullscreen({ images, isOpen, onClose, initialSlide = 0 }: ImageFullscreenProps) {
  const [api, setApi] = React.useState<CarouselApi>()

  React.useEffect(() => {
    if (api && isOpen) {
      api.scrollTo(initialSlide, true)
    }
  }, [api, initialSlide, isOpen])

  if (!images || images.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[100vw] max-h-[100vh] w-screen h-screen p-0 border-none bg-black/95">
        <VisuallyHidden>
          <DialogTitle>Galeria de Imagens</DialogTitle>
          <DialogDescription>Imagens em tela cheia</DialogDescription>
        </VisuallyHidden>
        <div className="relative w-full h-full flex flex-col justify-center items-center p-4">
          <Carousel setApi={setApi} className="w-full max-w-5xl mx-auto h-full flex items-center">
            <CarouselContent className="h-full">
              {images.map((image, index) => (
                <CarouselItem key={image.id} className="h-full flex items-center justify-center">
                  <div className="relative w-full h-[80vh]">
                    <Image
                      src={image.url}
                      alt={image.alt || `Imagem ${index + 1}`}
                      fill
                      className="object-contain"
                      sizes="100vw"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            {images.length > 1 && (
              <>
                <CarouselPrevious className="left-4 bg-background/50 hover:bg-background/80 border-none text-white" />
                <CarouselNext className="right-4 bg-background/50 hover:bg-background/80 border-none text-white" />
              </>
            )}
          </Carousel>
        </div>
      </DialogContent>
    </Dialog>
  )
}
