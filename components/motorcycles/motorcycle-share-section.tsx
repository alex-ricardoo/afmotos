'use client';

import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Smartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  getPublicMotorcycleUrl,
  executeWebShare,
  ShareableMotorcycle,
} from '@/lib/utils/share';

import { CONSTANTS } from '@/lib/utils/constants';

interface MotorcycleShareSectionProps {
  motorcycle: ShareableMotorcycle;
  whatsappPhone?: string;
  siteName?: string;
}

export function MotorcycleShareSection({
  motorcycle,
  siteName = CONSTANTS.STORE_NAME,
}: MotorcycleShareSectionProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = getPublicMotorcycleUrl(motorcycle);
  const title = `${motorcycle.brand} ${motorcycle.model}${motorcycle.year_model ? ` (${motorcycle.year_model})` : ''}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Não foi possível copiar o link.');
    }
  };

  const handleNativeShare = async () => {
    const success = await executeWebShare({
      title: `${title} | ${siteName}`,
      text: `Confira ${title} disponível na ${siteName}:`,
      url: shareUrl,
    });

    if (!success) {
      handleCopyLink();
    }
  };

  return (
    <div className="bg-[#151515] rounded-3xl p-5 sm:p-6 border border-[#c9a44c]/30 shadow-lg space-y-4">
      <div className="flex items-center justify-between gap-3 border-b border-[#c9a44c]/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#c9a44c]/10 border border-[#c9a44c]/20 text-[#e3c56c] flex items-center justify-center shrink-0">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">Compartilhe esta Moto</h3>
            <p className="text-xs text-[#a6a6a1]">Divulgue pelo WhatsApp, Instagram, Facebook ou copie o link</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Ação 1: Compartilhar no Celular / Apps */}
        <Button
          type="button"
          onClick={handleNativeShare}
          className="w-full h-11 rounded-xl bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-black font-extrabold text-sm shadow-[0_0_15px_rgba(201,164,76,0.25)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Smartphone className="w-4 h-4" />
          <span>Compartilhar pelo Celular</span>
        </Button>

        {/* Ação 2: Copiar Link */}
        <Button
          type="button"
          variant="outline"
          onClick={handleCopyLink}
          className="w-full h-11 rounded-xl border-zinc-800 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 hover:text-white font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400">Link Copiado!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-[#e3c56c]" />
              <span>Copiar Link</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
