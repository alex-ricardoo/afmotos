'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Camera, UploadCloud, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

interface Step4PhotosUploadProps {
  selectedFiles: File[];
  previews: string[];
  onFilesChange: (files: File[], previews: string[]) => void;
  onNext: () => void;
  onPrev: () => void;
}

export function Step4PhotosUpload({
  selectedFiles,
  previews,
  onFilesChange,
  onNext,
  onPrev,
}: Step4PhotosUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileValidationAndAdd = (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    const availableSlots = MAX_PHOTOS - selectedFiles.length;
    if (availableSlots <= 0) {
      toast.warning(`Limite de ${MAX_PHOTOS} fotos atingido.`);
      return;
    }

    const filesToProcess = fileArray.slice(0, availableSlots);

    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) {
        toast.error(`O arquivo "${file.name}" não é uma imagem válida.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`A foto "${file.name}" ultrapassa o limite de 5MB.`);
        continue;
      }

      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    if (validFiles.length > 0) {
      onFilesChange([...selectedFiles, ...validFiles], [...previews, ...validPreviews]);
      toast.success(`${validFiles.length} foto(s) adicionada(s).`);
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newFiles = selectedFiles.filter((_, idx) => idx !== index);
    const newPreviews = previews.filter((_, idx) => idx !== index);
    onFilesChange(newFiles, newPreviews);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileValidationAndAdd(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Camera className="w-4 h-4" />
          <span>Etapa 3 de 4</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
          Fotos da sua Motocicleta
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Envie fotos reais e nítidas para agilizar a análise do estado de conservação pela equipe.
        </p>
      </div>

      {/* Orientações de Fotos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-center space-y-1">
          <span className="text-amber-400 font-extrabold text-xs block">1. Frente</span>
          <span className="text-[10px] text-zinc-400">Farol, guidão e pneu dianteiro</span>
        </div>
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-center space-y-1">
          <span className="text-amber-400 font-extrabold text-xs block">2. Laterais</span>
          <span className="text-[10px] text-zinc-400">Lado direito e esquerdo da moto</span>
        </div>
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-center space-y-1">
          <span className="text-amber-400 font-extrabold text-xs block">3. Painel</span>
          <span className="text-[10px] text-zinc-400">Odômetro e luzes visíveis</span>
        </div>
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-center space-y-1">
          <span className="text-amber-400 font-extrabold text-xs block">4. Traseira & Motor</span>
          <span className="text-[10px] text-zinc-400">Escapamento, pneu e motor</span>
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      {selectedFiles.length < MAX_PHOTOS && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all flex flex-col items-center justify-center gap-3 cursor-pointer bg-zinc-950/60',
            isDragging
              ? 'border-amber-400 bg-amber-500/10 scale-[1.01]'
              : 'border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-900/60',
          )}
          onClick={() => document.getElementById('venda-moto-file-input')?.click()}
        >
          <input
            id="venda-moto-file-input"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files && handleFileValidationAndAdd(e.target.files)}
          />

          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg">
            <UploadCloud className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-white">Clique ou arraste as fotos da moto aqui</p>
            <p className="text-xs text-zinc-400">
              Formatos aceitos: JPG, PNG ou WebP (máx. 5MB por foto)
            </p>
          </div>

          <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            Você pode adicionar até {MAX_PHOTOS - selectedFiles.length} foto(s)
          </span>
        </div>
      )}

      {/* Miniaturas das Fotos Anexadas */}
      {previews.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>
              Fotos selecionadas ({previews.length}/{MAX_PHOTOS}):
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {previews.map((src, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-2xl overflow-hidden border border-zinc-700/80 group bg-zinc-900"
              >
                <Image
                  src={src}
                  alt={`Foto ${index + 1} da moto`}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemovePhoto(index);
                  }}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-zinc-950/80 border border-zinc-700 text-rose-400 hover:text-white hover:bg-rose-600 flex items-center justify-center transition-colors shadow-lg cursor-pointer"
                  title="Remover foto"
                  aria-label={`Remover foto ${index + 1}`}
                >
                  <X className="w-4 h-4" />
                </button>
                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-zinc-950/80 text-[10px] font-bold text-zinc-300 border border-zinc-800">
                  #{index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="pt-4 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          className="h-12 px-5 rounded-xl border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Button>

        <Button
          type="button"
          onClick={onNext}
          className="h-12 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center gap-2 cursor-pointer transition-all"
        >
          <span>Avançar para Revisão</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
