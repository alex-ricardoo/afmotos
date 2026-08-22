'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import { uploadImageAction, deleteImageAction } from '@/lib/actions/images';

interface ImageUploaderProps {
  onUpload: (url: string, path: string) => void;
  onDelete?: (path: string) => void;
  pathPrefix?: string;
  images?: { url: string; path: string }[];
}

export function ImageUploader({
  onUpload,
  onDelete,
  pathPrefix = 'general',
  images = [],
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', pathPrefix);

      try {
        const result = await uploadImageAction(formData);
        if (result.error) {
          toast.error(result.error);
        } else if (result.url && result.path) {
          onUpload(result.url, result.path);
          toast.success('Imagem enviada com sucesso!');
        }
      } catch (err) {
        toast.error('Erro ao enviar imagem');
      }
    }

    setUploading(false);
    e.target.value = ''; // Reset input
  };

  const handleDelete = async (path: string) => {
    try {
      const result = await deleteImageAction(path);
      if (result.error) {
        toast.error(result.error);
      } else {
        if (onDelete) onDelete(path);
        toast.success('Imagem removida com sucesso');
      }
    } catch (err) {
      toast.error('Erro ao remover imagem');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {images.map((img, index) => (
          <div key={index} className="relative w-32 h-32 border rounded-md overflow-hidden group">
            <Image src={img.url} alt="Uploaded" fill className="object-cover" />
            <button
              type="button"
              onClick={() => handleDelete(img.path)}
              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
        <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500">
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            ) : (
              <>
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-xs font-medium">Adicionar Foto</span>
              </>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
