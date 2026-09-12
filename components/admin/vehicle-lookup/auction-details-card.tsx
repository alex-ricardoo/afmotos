'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import type { AuctionRecord, AuctionScore, AuctionPhoto } from '@/lib/vehicle-lookup/types';
import {
  Gavel,
  ShieldAlert,
  Building2,
  Calendar,
  MapPin,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Camera,
  Percent,
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

interface AuctionDetailsCardProps {
  hasAuction: boolean;
  records: AuctionRecord[];
  score?: AuctionScore;
  photos?: AuctionPhoto[];
  description?: string;
  className?: string;
}

export function AuctionDetailsCard({
  hasAuction,
  records = [],
  score,
  photos = [],
  description,
  className = '',
}: AuctionDetailsCardProps) {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const hasRecords = records.length > 0;
  const hasPhotos = photos.length > 0;
  const isAuctionConfirmed = hasAuction || hasRecords;

  // Keyboard navigation for lightbox modal
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (selectedPhotoIndex === null) return;
      if (e.key === 'Escape') {
        setSelectedPhotoIndex(null);
      } else if (e.key === 'ArrowLeft') {
        setSelectedPhotoIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : photos.length - 1));
      } else if (e.key === 'ArrowRight') {
        setSelectedPhotoIndex((prev) => (prev !== null && prev < photos.length - 1 ? prev + 1 : 0));
      }
    },
    [selectedPhotoIndex, photos.length]
  );

  useEffect(() => {
    if (selectedPhotoIndex !== null) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPhotoIndex, handleKeyDown]);

  const activePhoto = selectedPhotoIndex !== null ? photos[selectedPhotoIndex] : null;

  // Format percent value nicely
  const formatRefPercent = (val?: string | number) => {
    if (val == null || val === '') return null;
    const str = String(val).trim();
    if (str.includes('%')) return str;
    return `${str}% da FIPE`;
  };

  // Determine acceptance badge color
  const getAcceptanceColor = (acc?: string) => {
    if (!acc) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    const lower = acc.toLowerCase();
    if (lower.includes('normal') || lower.includes('alta') || lower.includes('aceita')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (lower.includes('restrita') || lower.includes('baixa') || lower.includes('media')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    }
    return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
  };

  return (
    <div className={`rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${
            isAuctionConfirmed
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
          }`}>
            <Gavel className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-foreground text-base">Passagens por Leilão Oficial</h4>
            <p className="text-xs text-muted-foreground">
              {isAuctionConfirmed
                ? 'Histórico cadastrado nas bases de leiloeiros oficiais e seguradoras'
                : 'Consulta nas bases integradas de leiloeiros do Brasil'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAuctionConfirmed ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/40">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Consta Registro ({records.length > 0 ? `${records.length} passagem(ns)` : 'Ativo'})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sem Registro de Leilão
            </span>
          )}
        </div>
      </div>

      {!isAuctionConfirmed ? (
        <div className="flex items-center gap-2.5 text-xs text-emerald-500 font-medium py-3 px-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            {description || 'Nenhum registro de leilão ou arrematação identificado nas bases oficiais conveniadas para este veículo.'}
          </span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Auction Records List */}
          {hasRecords ? (
            <div className="space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
                Registros Oficiais de Leilão ({records.length})
              </h5>

              <div className="space-y-3">
                {records.map((auc, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-muted/40 border border-border/80 hover:border-border transition-colors space-y-3"
                  >
                    {/* Record Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border/50">
                      <div className="flex items-center gap-2 min-w-0">
                        <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Comitente / Origem</span>
                          <span className="font-bold text-foreground text-xs sm:text-sm truncate block">
                            {auc.bidder || auc.auctioneer || 'Leiloeiro Oficial'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {auc.condition && (
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                            {auc.condition}
                          </span>
                        )}
                        {auc.claim_type && (
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-muted text-muted-foreground border border-border/60">
                            {auc.claim_type}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Record Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-medium block">Leiloeiro</span>
                        <span className="font-bold text-foreground">{auc.auctioneer || 'Não informado'}</span>
                      </div>

                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-medium block">Data & Lote</span>
                        <span className="font-bold text-foreground">
                          {auc.auction_date || 'N/I'} {auc.lot ? `• Lote ${auc.lot}` : ''}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-medium block">Pátio</span>
                        <span className="font-bold text-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                          {auc.yard || 'N/I'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-medium block">Identificação</span>
                        <span className="font-mono text-muted-foreground text-[11px]">
                          {auc.plate ? `Placa: ${auc.plate}` : auc.chassis ? `Chassi: ${auc.chassis.slice(-6)}` : 'Conferido'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300">
              {description || 'Consta registro de leilão para o veículo informado nas bases consultadas.'}
            </div>
          )}

          {/* Market Acceptance & Score Card */}
          {score && (
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/5 via-muted/30 to-muted/10 border border-amber-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h5 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Score de Mercado & Segurabilidade
                </h5>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                {/* 1. Aceitação */}
                <div className="p-3 rounded-lg bg-background/60 border border-border/60 space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">Aceitação em Seguro</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold border ${getAcceptanceColor(score.acceptance)}`}>
                    {score.acceptance || 'Restrita'}
                  </span>
                  <p className="text-[10px] text-muted-foreground">Cobertura securitária</p>
                </div>

                {/* 2. Depreciação / % FIPE */}
                <div className="p-3 rounded-lg bg-background/60 border border-border/60 space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">Ref. de Mercado</span>
                  <span className="font-bold text-foreground text-sm flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-amber-400" />
                    {formatRefPercent(score.reference_percentage) || 'Sob consulta'}
                  </span>
                  <p className="text-[10px] text-muted-foreground">Depreciação estimada</p>
                </div>

                {/* 3. Vistoria Especial */}
                <div className="p-3 rounded-lg bg-background/60 border border-border/60 space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">Vistoria Especial</span>
                  <span className="font-bold text-foreground text-sm flex items-center gap-1">
                    <ClipboardCheck className="w-3.5 h-3.5 text-blue-400" />
                    {score.special_inspection_required != null ? String(score.special_inspection_required).toUpperCase() : 'Não'}
                  </span>
                  <p className="text-[10px] text-muted-foreground">Exigência cautelar</p>
                </div>

                {/* 4. Risco / Pontuação */}
                <div className="p-3 rounded-lg bg-background/60 border border-border/60 space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-medium block">Classificação de Risco</span>
                  <span className="font-bold text-rose-400 text-sm">
                    {score.score_label || (score.points ? `Pontos: ${score.points}` : 'Risco de Procedência')}
                  </span>
                  <p className="text-[10px] text-muted-foreground">Bases credenciadas</p>
                </div>
              </div>
            </div>
          )}

          {/* Photo Gallery with Lightbox */}
          {hasPhotos && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-primary" />
                  Galeria de Fotos do Lote ({photos.length})
                </h5>
                <span className="text-[11px] text-muted-foreground">
                  Clique na foto para expandir
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {photos.map((photo, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className="group relative aspect-4/3 rounded-xl overflow-hidden border border-border/80 bg-muted/40 hover:border-amber-500/60 transition-all duration-200 cursor-pointer text-left focus:outline-hidden focus:ring-2 focus:ring-amber-500/50"
                  >
                    {/* Thumbnail Image */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.preview_src}
                      alt={photo.description || `Foto do Leilão #${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Gradient Overlay & Zoom hint */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="p-2 rounded-full bg-black/60 backdrop-blur-xs text-white border border-white/20 shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Caption Tag */}
                    <div className="absolute bottom-2 left-2 right-2">
                      <span className="text-[10px] font-bold text-white drop-shadow-md truncate block bg-black/50 px-1.5 py-0.5 rounded backdrop-blur-xs">
                        {photo.description || `Foto #${idx + 1}`}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Senior Fullscreen Lightbox Modal via Portal to avoid stacking context & header clipping */}
      {isMounted &&
        selectedPhotoIndex !== null &&
        activePhoto &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-xl flex flex-col justify-between p-3 sm:p-6 animate-in fade-in duration-200 overflow-hidden"
            onClick={() => setSelectedPhotoIndex(null)}
          >
            {/* Botão Fechar Flutuante em Destaque Especial para Celular e Desktop */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPhotoIndex(null);
              }}
              className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[100002] flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full bg-zinc-900/95 hover:bg-zinc-800 text-white border border-zinc-700 shadow-2xl shadow-black/90 font-bold text-xs sm:text-sm tracking-wide transition-all cursor-pointer hover:scale-105 active:scale-95 group"
              aria-label="Fechar visualização da foto"
              title="Fechar (ESC)"
            >
              <X className="w-4 h-4 text-amber-400 group-hover:rotate-90 transition-transform" />
              <span>Fechar</span>
            </button>

            {/* Lightbox Topbar */}
            <div
              className="w-full max-w-5xl mx-auto flex items-center justify-between text-white pt-2 pb-2 shrink-0 pr-28 sm:pr-32"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-md border border-amber-400/20">
                  Foto {selectedPhotoIndex + 1} de {photos.length}
                </span>
                {activePhoto.description && (
                  <span className="text-xs text-zinc-300 truncate max-w-[140px] sm:max-w-md">
                    {activePhoto.description}
                  </span>
                )}
              </div>

              {activePhoto.url && (
                <a
                  href={activePhoto.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors text-xs cursor-pointer"
                  title="Abrir imagem original em nova aba"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Original</span>
                </a>
              )}
            </div>

            {/* Lightbox Image Stage with Centered Layout & Arrows */}
            <div
              className="relative w-full max-w-5xl mx-auto flex-1 flex items-center justify-center my-auto min-h-0 py-2 sm:py-4 select-none"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Prev Arrow */}
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPhotoIndex((prev) =>
                      prev !== null && prev > 0 ? prev - 1 : photos.length - 1
                    )
                  }
                  className="absolute left-2 sm:left-4 z-20 p-2.5 sm:p-3.5 rounded-full bg-black/75 hover:bg-black text-white border border-white/25 backdrop-blur-sm transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-xl"
                  title="Foto anterior"
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
              )}

              {/* Expanded Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activePhoto.preview_src}
                alt={activePhoto.description || `Foto do Leilão #${selectedPhotoIndex + 1}`}
                className="max-h-[62vh] sm:max-h-[76vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl border border-zinc-800/90 mx-auto"
              />

              {/* Next Arrow */}
              {photos.length > 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedPhotoIndex((prev) =>
                      prev !== null && prev < photos.length - 1 ? prev + 1 : 0
                    )
                  }
                  className="absolute right-2 sm:right-4 z-20 p-2.5 sm:p-3.5 rounded-full bg-black/75 hover:bg-black text-white border border-white/25 backdrop-blur-sm transition-all cursor-pointer hover:scale-110 active:scale-95 shadow-xl"
                  title="Próxima foto"
                  aria-label="Próxima foto"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </button>
              )}
            </div>

            {/* Lightbox Bottom Controls Strip */}
            <div
              className="w-full max-w-5xl mx-auto pt-2 pb-1 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-zinc-400 shrink-0 border-t border-zinc-800/60"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Navigation Controls */}
              {photos.length > 1 && (
                <div className="flex sm:hidden items-center justify-between w-full px-1 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPhotoIndex((prev) =>
                        prev !== null && prev > 0 ? prev - 1 : photos.length - 1
                      )
                    }
                    className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-semibold text-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </button>

                  <span className="text-xs font-bold text-amber-400 px-2 shrink-0">
                    {selectedPhotoIndex + 1} / {photos.length}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedPhotoIndex((prev) =>
                        prev !== null && prev < photos.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="flex-1 py-2 px-3 rounded-xl bg-zinc-900 border border-zinc-700 text-white font-semibold text-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <span>Próxima</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <span className="hidden sm:inline">
                Toque fora ou pressione <strong>ESC</strong> para fechar • <strong>← / →</strong> para navegar
              </span>

              <button
                type="button"
                onClick={() => setSelectedPhotoIndex(null)}
                className="sm:hidden w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <X className="w-4 h-4 text-amber-400" />
                <span>Fechar Visualização</span>
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
