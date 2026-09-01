'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, ShieldCheck, Loader2 } from 'lucide-react';
import { getSiteLogo, getSiteName, getSiteInitials } from '@/lib/site-settings';

interface PublicReportHeaderProps {
  shareToken: string;
  plateDisplay: string;
  settings?: any;
  isDownloading?: boolean;
  onDownloadPdf?: () => void;
}

export function PublicReportHeader({
  shareToken,
  plateDisplay,
  settings,
  isDownloading = false,
  onDownloadPdf,
}: PublicReportHeaderProps) {
  const [logoError, setLogoError] = useState(false);

  const logoInfo = getSiteLogo(settings);
  const siteName = getSiteName(settings);
  const initials = getSiteInitials(
    siteName,
    settings?.settings?.shortName || settings?.settings?.short_name
  );

  return (
    <header className="flex items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
      {/* Brand Logo & Document Title */}
      <div className="flex items-center gap-3">
        <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-900 shadow-md shrink-0 flex items-center justify-center">
          {!logoError && logoInfo.src ? (
            <Image
              src={logoInfo.src}
              alt={siteName}
              fill
              className="object-cover"
              priority
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="font-black text-sm text-emerald-400 font-mono tracking-wider">
              {initials}
            </span>
          )}
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{siteName} • Laudo Oficial</span>
          </div>
          <h1 className="text-lg sm:text-2xl font-black text-slate-100 tracking-tight leading-tight">
            Histórico Veicular
          </h1>
        </div>
      </div>

      {/* Action Buttons (Desktop & Tablet) */}
      <div className="hidden md:flex items-center gap-2.5 print:hidden">
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={onDownloadPdf}
          disabled={isDownloading}
          className="gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-9 px-4 shadow-lg shadow-emerald-950/50"
        >
          {isDownloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Gerando PDF...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Baixar Laudo Oficial (PDF)</span>
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
