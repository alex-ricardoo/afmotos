'use client';

import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Smartphone,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  getPublicMotorcycleUrl,
  executeWebShare,
  ShareableMotorcycle,
} from '@/lib/utils/share';

import { CONSTANTS } from '@/lib/utils/constants';

interface MotorcycleShareDialogProps {
  motorcycle: ShareableMotorcycle;
  isOpen: boolean;
  onClose: () => void;
  whatsappPhone?: string;
  siteName?: string;
}

export function MotorcycleShareDialog({
  motorcycle,
  isOpen,
  onClose,
  siteName = CONSTANTS.STORE_NAME,
}: MotorcycleShareDialogProps) {
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
      toast.error('Não foi possível copiar o link automaticamente.');
    }
  };

  const handleNativeShare = async () => {
    const success = await executeWebShare({
      title: `${title} | ${siteName}`,
      text: `Confira ${title} à venda na ${siteName}:`,
      url: shareUrl,
    });

    if (success) {
      onClose();
    } else {
      handleCopyLink();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 rounded-3xl p-6 shadow-2xl backdrop-blur-2xl">
        <DialogHeader className="text-left space-y-1.5 pb-3 border-b border-zinc-800/80">
          <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#c9a44c]" />
            <span>Compartilhar Moto</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            {title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Opção 1: Compartilhar no Celular (WhatsApp, Instagram, etc) */}
          <Button
            type="button"
            onClick={handleNativeShare}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-black font-extrabold text-sm shadow-[0_0_20px_rgba(201,164,76,0.25)] active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2.5"
          >
            <Smartphone className="w-4 h-4" />
            <span>Compartilhar pelo Celular</span>
          </Button>

          {/* Opção 2: Copiar Link Direto */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
              Ou copie o link direto:
            </span>
            <div className="flex items-center gap-2 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="bg-transparent text-xs text-zinc-300 flex-1 px-2.5 py-1.5 outline-none font-mono truncate select-all"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCopyLink}
                className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-semibold shrink-0 cursor-pointer h-9 px-3.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 mr-1" />
                    <span>Copiar</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
