'use client';

import { useState } from 'react';
import { Upload, Trash2, Loader2, Star, ImagePlus, Info, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  uploadMotorcycleImageAction,
  deleteMotorcycleImageAction,
  setPrimaryMotorcycleImageAction,
} from '@/lib/actions/images';
import { MotorcycleImage } from '@/types/database';
import { getImageSource } from '@/lib/uploads/image-url';
import { Button } from '@/components/ui/button';

interface ImageUploaderProps {
  motorcycleId?: string;
  images?: MotorcycleImage[];
  onImagesChange?: (images: MotorcycleImage[]) => void;
  disabled?: boolean;
}

export function ImageUploader({
  motorcycleId,
  images = [],
  onImagesChange,
  disabled = false,
}: ImageUploaderProps) {
  const [localImages, setLocalImages] = useState<MotorcycleImage[]>(images);
  const [uploading, setUploading] = useState(false);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  // Sync internal state if prop updates externally
  const currentImages = localImages;

  const updateImagesState = (newImages: MotorcycleImage[]) => {
    setLocalImages(newImages);
    if (onImagesChange) {
      onImagesChange(newImages);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (!motorcycleId) {
      toast.error('Salve os dados da motocicleta primeiro para habilitar o envio de fotos.');
      return;
    }

    setUploading(true);

    const filesArray = Array.from(files);
    let successCount = 0;
    let updatedList = [...currentImages];

    for (const file of filesArray) {
      const formData = new FormData();
      formData.append('motorcycleId', motorcycleId);
      formData.append('file', file);

      try {
        const result = await uploadMotorcycleImageAction(formData);

        if (!result.success || !result.image) {
          toast.error(`Erro ao enviar ${file.name}: ${result.error || 'Falha desconhecida'}`);
        } else {
          successCount++;
          // If this is the first image or returned as primary, update other images in local state
          if (result.image.is_primary) {
            updatedList = updatedList.map((img) => ({ ...img, is_primary: false }));
          }
          updatedList.push(result.image);
          updateImagesState([...updatedList]);
        }
      } catch (err) {
        console.error('Upload error:', err);
        toast.error(`Falha no envio de ${file.name}`);
      }
    }

    if (successCount > 0) {
      toast.success(
        successCount === 1
          ? '1 foto adicionada com sucesso!'
          : `${successCount} fotos adicionadas com sucesso!`,
      );
    }

    setUploading(false);
    e.target.value = ''; // Reset file input
  };

  const handleDelete = async (image: MotorcycleImage) => {
    if (activeActionId) return;
    setActiveActionId(image.id);

    try {
      const result = await deleteMotorcycleImageAction(image.id);
      if (result.error) {
        toast.error(`Erro ao remover foto: ${result.error}`);
      } else {
        // Remove locally
        let remaining = currentImages.filter((img) => img.id !== image.id);
        // If the removed image was primary and there are remaining images, make the first one primary locally
        if (image.is_primary && remaining.length > 0) {
          remaining = remaining.map((img, idx) => ({
            ...img,
            is_primary: idx === 0,
          }));
        }
        updateImagesState(remaining);
        toast.success('Foto removida com sucesso');
      }
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Erro ao remover imagem');
    } finally {
      setActiveActionId(null);
    }
  };

  const handleSetPrimary = async (image: MotorcycleImage) => {
    if (image.is_primary || activeActionId || !motorcycleId) return;
    setActiveActionId(image.id);

    try {
      const result = await setPrimaryMotorcycleImageAction(image.id, motorcycleId);
      if (result.error) {
        toast.error(`Erro ao definir foto principal: ${result.error}`);
      } else {
        const updated = currentImages.map((img) => ({
          ...img,
          is_primary: img.id === image.id,
        }));
        updateImagesState(updated);
        toast.success('Foto definida como principal (capa)');
      }
    } catch (err) {
      console.error('Set primary error:', err);
      toast.error('Erro ao atualizar foto principal');
    } finally {
      setActiveActionId(null);
    }
  };

  if (!motorcycleId) {
    return (
      <div className="rounded-xl border border-dashed border-amber-500/30 bg-amber-500/5 p-6 text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground">
            Cadastro de Fotos Disponível Após Salvar
          </h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
            Preencha os dados da motocicleta e clique em &quot;Cadastrar moto&quot;. Em seguida,
            você poderá fazer upload e organizar todas as fotos no painel de edição.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {currentImages.length === 0 && !uploading && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground bg-muted/20">
          <ImagePlus className="w-10 h-10 mx-auto mb-3 text-muted-foreground/60" />
          <p className="text-sm font-medium">Nenhuma foto adicionada ainda.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Adicione fotos da motocicleta para atrair mais compradores. A primeira foto será usada
            como capa.
          </p>
        </div>
      )}

      {/* Upload Button Box for Mobile First */}
      <div className="w-full">
        <label
          className={`flex items-center justify-center gap-2 w-full p-4 rounded-xl border border-border bg-card hover:bg-muted/40 transition-all cursor-pointer shadow-sm ${
            uploading || disabled ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          {uploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-[#c9a44c]" />
              <span className="text-sm font-semibold text-foreground">Enviando...</span>
            </>
          ) : (
            <>
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">
                Tirar Foto / Galeria
              </span>
            </>
          )}
          <input
            type="file"
            className="hidden"
            accept="image/png, image/jpeg, image/webp, image/avif"
            multiple
            capture="environment"
            onChange={handleFileChange}
            disabled={uploading || disabled}
          />
        </label>
      </div>

      <div className="flex overflow-x-auto gap-4 pb-2 snap-x snap-mandatory hide-scrollbar">
        {currentImages.map((img) => {
          const isBusy = activeActionId === img.id;

          return (
            <div
              key={img.id}
              className={`group relative w-32 shrink-0 aspect-[4/3] snap-start rounded-xl overflow-hidden border-2 bg-zinc-950 transition-all ${
                img.is_primary
                  ? 'border-[#c9a44c] shadow-[0_0_15px_rgba(201,164,76,0.25)] ring-1 ring-[#c9a44c]'
                  : 'border-border hover:border-zinc-500'
              }`}
            >
              {(() => {
                const src = getImageSource(img);
                return src ? (
                  <Image
                    src={src}
                    alt={img.alt_text || 'Foto da motocicleta'}
                    fill
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                    Sem prévia
                  </div>
                );
              })()}

              {/* Overlay on hover / active */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

              {/* Primary Badge */}
              {img.is_primary ? (
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#c9a44c] text-black text-[10px] font-extrabold shadow-sm">
                  <Star className="w-3 h-3 fill-black" />
                  <span>Capa</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSetPrimary(img)}
                  disabled={isBusy || disabled}
                  title="Definir como foto de capa principal"
                  className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 hover:bg-[#c9a44c] text-white hover:text-black text-[10px] font-semibold backdrop-blur-md border border-white/20"
                >
                  <Star className="w-3 h-3" />
                  <span>Tornar Capa</span>
                </button>
              )}

              {/* Action Buttons (Bottom Right) */}
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 opacity-100 transition-opacity duration-200">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(img)}
                  disabled={isBusy || disabled}
                  className="h-7 w-7 rounded-full bg-red-500/80 backdrop-blur-md hover:bg-red-600 text-white shadow-md cursor-pointer border border-white/10"
                  title="Excluir esta foto"
                >
                  {isBusy ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>

              {/* Loading Overlay if this item is being processed */}
              {isBusy && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-20">
                  <Loader2 className="w-6 h-6 animate-spin text-[#c9a44c]" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
