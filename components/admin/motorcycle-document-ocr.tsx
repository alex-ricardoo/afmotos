'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Camera,
  FileUp,
  Sparkles,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FileText,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MotorcycleOcrResult, OcrApiResponse } from '@/lib/ocr/schemas';

interface MotorcycleDocumentOcrProps {
  onOcrSuccess: (result: MotorcycleOcrResult) => void;
  disabled?: boolean;
}

export function MotorcycleDocumentOcr({
  onOcrSuccess,
  disabled = false,
}: MotorcycleDocumentOcrProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<MotorcycleOcrResult | null>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validações no cliente
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('O arquivo selecionado é maior que o limite de 10 MB.');
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    const isPdfByName = file.name.toLowerCase().endsWith('.pdf');
    const isImageByName =
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg') ||
      file.name.toLowerCase().endsWith('.png') ||
      file.name.toLowerCase().endsWith('.webp');

    if (!validTypes.includes(file.type.toLowerCase()) && !isPdfByName && !isImageByName) {
      setErrorMessage('Formato de arquivo inválido. Selecione um arquivo JPEG, PNG, WebP ou PDF.');
      return;
    }

    setErrorMessage(null);
    setLastResult(null);
    setShowSuccessBanner(false);
    setSelectedFile(file);

    // Gera preview local
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Reset input value para permitir selecionar o mesmo arquivo novamente se desejar
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    setLastResult(null);
    setShowSuccessBanner(false);
  };

  const handleProcessOcr = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setShowSuccessBanner(false);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('/api/admin/motorcycles/ocr', {
        method: 'POST',
        body: formData,
      });

      const resData: OcrApiResponse = await response.json();

      if (!response.ok || !resData.success || !resData.data) {
        throw new Error(
          resData.error ||
            'Não foi possível interpretar o documento. Confira se o arquivo está nítido e tente novamente.',
        );
      }

      setLastResult(resData.data);
      setShowSuccessBanner(true);
      onOcrSuccess(resData.data);
    } catch (err: unknown) {
      const errObj = err instanceof Error ? err : new Error(String(err));
      console.error('Erro no OCR:', errObj);
      setErrorMessage(
        errObj.message ||
          'Ocorreu uma falha ao ler o documento. Tente novamente ou preencha os dados manualmente.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const isPdf =
    selectedFile?.type === 'application/pdf' || selectedFile?.name.toLowerCase().endsWith('.pdf');

  // Estado Minimizado / Recolhido
  if (!isExpanded) {
    return (
      <div
        onClick={() => setIsExpanded(true)}
        className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-amber-500/20 bg-slate-900/90 hover:bg-slate-900 hover:border-amber-500/40 transition-all cursor-pointer shadow-lg group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-white">
              Preenchimento Inteligente com IA
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Gemini
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(true);
          }}
          className="h-8 px-2.5 text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
        >
          <span className="hidden sm:inline mr-1">Expandir</span>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  // Estado Expandido
  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-slate-900 via-slate-900/95 to-amber-950/20 p-4 sm:p-6 shadow-xl space-y-4 animate-in fade-in-50 duration-200">
      {/* Header do Card */}
      <div className="space-y-2 border-b border-slate-800/80 pb-3 sm:pb-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">
                Preenchimento Inteligente com IA
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                Gemini
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(false)}
            className="h-8 px-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 shrink-0"
            title="Ocultar painel de IA"
          >
            <span className="hidden sm:inline mr-1">Ocultar</span>
            <ChevronUp className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-0.5">
          <p className="text-xs text-slate-400">
            Tire foto ou anexe o documento (CRLV/CRV em foto ou PDF) para autocompletar a moto.
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Documento seguro e temporário</span>
          </div>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isProcessing}
      />

      <input
        type="file"
        ref={fileInputRef}
        accept="image/jpeg,image/png,image/webp,application/pdf,.pdf"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isProcessing}
      />

      {/* Mensagem de Erro */}
      {errorMessage && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in-50">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Estado: Sem arquivo selecionado */}
      {!selectedFile && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* Botão Tirar Foto */}
          <button
            type="button"
            disabled={disabled || isProcessing}
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-slate-200 hover:text-white transition-all cursor-pointer group shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <Camera className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                Tirar foto do documento
              </div>
              <div className="text-[11px] text-slate-400 truncate">Câmera traseira do celular</div>
            </div>
          </button>

          {/* Botão Anexar Arquivo */}
          <button
            type="button"
            disabled={disabled || isProcessing}
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-slate-950/80 hover:bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-slate-200 hover:text-white transition-all cursor-pointer group shadow-sm"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0">
              <FileUp className="w-4 h-4" />
            </div>
            <div className="text-left min-w-0">
              <div className="text-xs font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                Anexar documento
              </div>
              <div className="text-[11px] text-slate-400 truncate">Foto ou PDF (máx. 10 MB)</div>
            </div>
          </button>
        </div>
      )}

      {/* Estado: Arquivo Selecionado */}
      {selectedFile && previewUrl && (
        <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-3.5 sm:p-4 space-y-3 animate-in fade-in-50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {/* Thumbnail / Ícone do Arquivo */}
              <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-800 bg-slate-900 shrink-0 flex items-center justify-center">
                {isPdf ? (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-rose-500/10 border border-rose-500/20 text-rose-400">
                    <FileText className="w-5 h-5" />
                    <span className="text-[8px] font-mono font-bold tracking-wider uppercase text-rose-300">
                      PDF
                    </span>
                  </div>
                ) : (
                  <Image
                    src={previewUrl}
                    alt="Documento selecionado"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>

              {/* Informações do Arquivo */}
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate max-w-[180px] xs:max-w-[220px] sm:max-w-[320px]">
                  {selectedFile.name}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {formatFileSize(selectedFile.size)} • Pronto para leitura
                </div>
              </div>
            </div>

            {/* Botão Remover */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              disabled={isProcessing}
              className="h-8 w-8 p-0 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 shrink-0"
              title="Remover documento"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Linha de Ações (Responsiva Mobile / Desktop) */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-slate-800/80">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="h-9 text-xs border-slate-800 hover:bg-slate-900 text-slate-300 justify-center"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Trocar arquivo
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleProcessOcr}
              disabled={isProcessing || disabled}
              className="h-9 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 flex-1 justify-center"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Lendo documento com IA...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                  Ler documento e preencher
                </>
              )}
            </Button>
          </div>

          {/* Feedback de Sucesso */}
          {showSuccessBanner && lastResult && !isProcessing && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between gap-2 animate-in fade-in-50">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">
                  Dados identificados com sucesso! Revise os campos abaixo.
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {lastResult.warnings && lastResult.warnings.length > 0 && (
                  <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30 font-medium">
                    {lastResult.warnings.length} aviso(s)
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowSuccessBanner(false)}
                  className="text-emerald-400 hover:text-emerald-200 p-0.5"
                  title="Fechar aviso"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
