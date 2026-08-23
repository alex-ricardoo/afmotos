'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProposalViewModel } from '@/lib/admin/proposal-view-model';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateProposalWhatsAppMessage, generateWhatsAppLink } from '@/lib/utils/whatsapp';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { useEffect, useState } from 'react';

export function useMediaQuery(query: string) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    const result = matchMedia(query);
    result.addEventListener('change', onChange);
    setValue(result.matches);

    return () => result.removeEventListener('change', onChange);
  }, [query]);

  return value;
}
import { cn } from '@/lib/utils';
import { proposalTypeLabels } from '@/lib/admin/proposal-labels';
import { ImageFullscreen } from '@/components/gallery/image-fullscreen';

interface ProposalDetailProps {
  proposal: ProposalViewModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeBadgeClass: string;
}

export function ProposalDetail({ proposal, open, onOpenChange, typeBadgeClass }: ProposalDetailProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  if (!proposal) return null;

  const typeLabel = proposalTypeLabels[proposal.type] || proposal.typeLabel;
  const whatsappLink = generateWhatsAppLink(
    proposal.phone,
    generateProposalWhatsAppMessage(proposal),
  );

  const Content = (
    <>
      <div className="space-y-6 py-4">
        {/* Contact Info Section */}
        <section className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dados do Contato</h4>
          <div className="bg-secondary/20 p-4 rounded-xl border border-border/40 text-sm space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Nome:</span>
              <span className="font-bold text-foreground">{proposal.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Telefone:</span>
              <span className="font-mono font-bold text-foreground">{proposal.phone}</span>
            </div>
            {proposal.email && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">E-mail:</span>
                <span className="font-bold text-foreground">{proposal.email}</span>
              </div>
            )}
            {proposal.city && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Localização:</span>
                <span className="font-bold text-foreground">
                  {proposal.city}{proposal.state ? ` - ${proposal.state}` : ''}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Motorcycle Info Section */}
        {proposal.motorcycle && (proposal.motorcycle.brand || proposal.motorcycle.model) && (
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Dados da Moto</h4>
            <div className="bg-secondary/20 p-4 rounded-xl border border-border/40 text-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Moto:</span>
                <span className="font-bold text-foreground">
                  {proposal.motorcycle.brand} {proposal.motorcycle.model}
                </span>
              </div>
              {proposal.motorcycle.year && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Ano:</span>
                  <span className="font-bold text-foreground">{proposal.motorcycle.year}</span>
                </div>
              )}
              {proposal.motorcycle.mileage != null && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Quilometragem:</span>
                  <span className="font-bold text-foreground">{proposal.motorcycle.mileage} km</span>
                </div>
              )}
              {proposal.motorcycle.desiredPrice != null && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor Desejado:</span>
                  <span className="font-bold text-[#c9a44c]">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.motorcycle.desiredPrice)}
                  </span>
                </div>
              )}
              {proposal.motorcycle.fipePrice != null && (
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Valor FIPE:</span>
                  <span className="font-bold text-blue-400">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.motorcycle.fipePrice)}
                  </span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Message Section */}
        {proposal.message && (
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mensagem</h4>
            <div className="bg-secondary/20 p-4 rounded-xl border border-border/40 text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {proposal.message}
            </div>
          </section>
        )}

        {/* Images Gallery */}
        {proposal.images && proposal.images.length > 0 && (
          <section className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
              Fotos <span>({proposal.images.length})</span>
            </h4>
            <div className="flex flex-wrap gap-3 pb-4">
              {proposal.images.map((img, idx) => (
                <button 
                  key={idx} 
                  type="button"
                  onClick={() => {
                    setSelectedImageIndex(idx);
                    setIsFullscreenOpen(true);
                  }}
                  className="relative rounded-xl overflow-hidden border border-border/40 h-28 w-28 sm:h-40 sm:w-40 bg-secondary/20 block hover:opacity-90 transition-opacity text-left cursor-zoom-in"
                >
                  <img src={img.url} alt={`Foto ${idx + 1}`} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );

  const ActionButtons = (
    <div className="flex flex-col gap-2 w-full">
      <a 
        href={whatsappLink} 
        target="_blank" 
        rel="noopener noreferrer"
        className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-xl h-12 shadow-[0_0_15px_rgba(37,211,102,0.2)] flex items-center justify-center transition-colors"
      >
        <WhatsAppIcon className="w-5 h-5 mr-2 fill-current" />
        Responder pelo WhatsApp
      </a>
    </div>
  );

  if (isDesktop) {
    return (
      <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-[#151515] border-[#c9a44c]/30 text-[#f4f4f2]">
          <DialogHeader className="px-6 py-5 border-b border-border/40 bg-card">
            <div className="flex items-center justify-between gap-4 pr-10">
              <DialogTitle className="text-2xl font-bold truncate text-white min-w-0 flex-1">{proposal.name}</DialogTitle>
              <Badge variant="outline" className={cn('uppercase text-[10px] font-bold px-2 py-0.5 whitespace-nowrap shrink-0', typeBadgeClass)}>
                {typeLabel}
              </Badge>
            </div>
            <DialogDescription className="text-[#a6a6a1]">
              Recebido em {format(new Date(proposal.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 overflow-y-auto flex-1">
            {Content}
          </div>
          <div className="px-6 py-4 border-t border-border/40 bg-card">
            {ActionButtons}
          </div>
        </DialogContent>
      </Dialog>
      {proposal.images && proposal.images.length > 0 && (
        <ImageFullscreen
          images={proposal.images.map((img, i) => ({ id: i.toString(), url: img.url }))}
          isOpen={isFullscreenOpen}
          onClose={() => setIsFullscreenOpen(false)}
          initialSlide={selectedImageIndex}
        />
      )}
    </>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[90vh] sm:max-w-md rounded-t-[20px] bg-[#151515] border-[#c9a44c]/30 p-0 text-[#f4f4f2]">
        <SheetHeader className="text-left border-b border-border/40 pb-4 p-4 pt-6">
          <div className="flex items-center justify-between gap-4 mb-1 pr-10">
            <SheetTitle className="text-xl font-bold truncate text-white min-w-0 flex-1">{proposal.name}</SheetTitle>
            <Badge variant="outline" className={cn('uppercase text-[10px] font-bold px-2 py-0.5 whitespace-nowrap shrink-0', typeBadgeClass)}>
              {typeLabel}
            </Badge>
          </div>
          <SheetDescription className="text-[#a6a6a1]">
            Recebido em {format(new Date(proposal.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {Content}
        </div>
        <SheetFooter className="border-t border-border/40 pt-4 pb-6 px-4">
          {ActionButtons}
          <SheetClose asChild>
            <Button variant="outline" className="w-full h-12 rounded-xl font-semibold mt-2">
              Fechar
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
      {proposal.images && proposal.images.length > 0 && (
        <ImageFullscreen
          images={proposal.images.map((img, i) => ({ id: i.toString(), url: img.url }))}
          isOpen={isFullscreenOpen}
          onClose={() => setIsFullscreenOpen(false)}
          initialSlide={selectedImageIndex}
        />
      )}
    </Sheet>
  );
}
