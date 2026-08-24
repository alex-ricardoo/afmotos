'use client';

import { useState } from 'react';
import { Upload, Trash2, Loader2, ImagePlus } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { uploadSiteBrandingAction } from '@/lib/actions/settings';
import { StoreImage } from '@/types/site-settings';
import { Button } from '@/components/ui/button';
import { compressImage } from '@/lib/utils/image-compression';

interface SiteImageUploaderProps {
  images?: StoreImage[];
  onImagesChange: (images: StoreImage[]) => void;
  maxImages?: number;
}

export function SiteImageUploader({ images = [], onImagesChange, maxImages = 5 }: SiteImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast.error(`Você pode enviar no máximo ${maxImages} imagens.`);
      return;
    }

    setUploading(true);

    const filesArray = Array.from(files);
    let successCount = 0;
    const updatedList = [...images];

    for (const file of filesArray) {
      let fileToUpload = file;
      try {
        const { file: compressed } = await compressImage(file, {
          maxDimension: 1920,
          quality: 0.82,
          outputFormat: 'auto',
        });
        fileToUpload = compressed;
      } catch (err) {
        console.warn('Erro ao comprimir imagem da galeria institucional:', err);
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('type', 'about-gallery');

      try {
        const result = await uploadSiteBrandingAction(formData);

        if (!result.success || !result.url) {
          toast.error(`Erro ao enviar ${file.name}: ${result.error || 'Falha desconhecida'}`);
        } else {
          successCount++;
          updatedList.push({
            url: result.url,
            provider: result.provider || 'supabase',
            isActive: true,
          });
          onImagesChange([...updatedList]);
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

  const handleDelete = (index: number) => {
    const remaining = [...images];
    remaining.splice(index, 1);
    onImagesChange(remaining);
  };

  return (
    <div className="space-y-4">
      {images.length === 0 && !uploading && (
        <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center text-zinc-500 bg-zinc-900/20">
          <ImagePlus className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
          <p className="text-sm font-medium">Nenhuma foto adicionada ainda.</p>
          <p className="text-xs mt-1">
            Adicione até {maxImages} fotos da loja para exibir na página Sobre.
          </p>
        </div>
      )}

      {images.length < maxImages && (
        <div className="w-full">
          <label
            className={`flex items-center justify-center gap-2 w-full p-4 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 transition-all cursor-pointer shadow-sm ${
              uploading ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
                <span className="text-sm font-semibold text-white">Enviando...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 text-zinc-400" />
                <span className="text-sm font-semibold text-white">
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
              disabled={uploading}
            />
          </label>
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="group relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-zinc-800 bg-zinc-950 transition-all hover:border-zinc-500"
            >
              {img.url ? (
                <Image
                  src={img.url}
                  alt={`Imagem ${idx + 1}`}
                  fill
                  sizes="(max-width: 640px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : null}

              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

              <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleDelete(idx)}
                  className="h-7 w-7 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-md cursor-pointer"
                  title="Excluir esta foto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
