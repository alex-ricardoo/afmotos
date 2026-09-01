'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { toast } from 'sonner';

interface VehicleShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  plateDisplay: string;
}

export function VehicleShareModal({
  isOpen,
  onClose,
  shareUrl,
  plateDisplay,
}: VehicleShareModalProps) {
  const [copied, setCopied] = useState(false);

  const effectiveShareUrl = useMemo(() => {
    if (typeof window !== 'undefined' && window.location?.origin) {
      try {
        const parsed = new URL(shareUrl);
        return `${window.location.origin}${parsed.pathname}`;
      } catch {
        return shareUrl;
      }
    }
    return shareUrl;
  }, [shareUrl]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(effectiveShareUrl);
      setCopied(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Não foi possível copiar o link automaticamente.');
    }
  };

  const handleOpenLink = () => {
    window.open(effectiveShareUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareWhatsApp = () => {
    const message = `Olá! Segue o Laudo Oficial de Histórico e Procedência do veículo (${plateDisplay}):\n${effectiveShareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Link Seguro Gerado</span>
          </div>
          <DialogTitle className="text-lg font-bold">
            Compartilhar Laudo ({plateDisplay})
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            O cliente poderá visualizar o histórico sanitizado e baixar o PDF sem efetuar login por 30 dias.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={effectiveShareUrl}
              className="font-mono text-xs select-all bg-muted/50"
            />
            <Button
              type="button"
              variant={copied ? 'default' : 'outline'}
              size="sm"
              onClick={handleCopy}
              className="shrink-0 gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-300" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="w-full gap-2 text-xs bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border-[#25D366]/30 font-semibold"
            >
              <WhatsAppIcon className="h-4 w-4 fill-current" />
              <span>Enviar no WhatsApp</span>
            </Button>
          </div>

          <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-600 dark:text-amber-400 space-y-1">
            <div className="flex items-center gap-1.5 font-semibold">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              Segurança e Privacidade:
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Por segurança, este token é único e protegido. O cliente tem acesso liberado por 30 dias a partir da criação.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3 gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOpenLink}
            className="text-xs text-muted-foreground gap-1.5 hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Visualizar Página
          </Button>
          <Button type="button" onClick={onClose} size="sm">
            Concluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
