'use client';

import React from 'react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { buttonVariants } from '@/components/ui/button';
import { generateWhatsAppLink, generateMotorcycleInterestMessage } from '@/lib/utils/whatsapp';
import { CONSTANTS } from '@/lib/utils/constants';
import { cn } from '@/lib/utils';

interface WhatsAppButtonProps {
  phone?: string;
  message?: string;
  motorcycle?: {
    brand: string;
    model: string;
    year_model: number;
    price?: number | null;
  };
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isFloating?: boolean;
  settings?: any;
}

export function WhatsAppButton({
  phone,
  settings,
  message,
  motorcycle,
  className,
  children,
  variant = 'default',
  size = 'default',
  isFloating = true,
}: WhatsAppButtonProps) {
  const contactPhone = phone || settings?.whatsapp_phone || CONSTANTS.CONTACT_PHONE;
  const siteName = settings?.site_name || CONSTANTS.STORE_NAME;

  const finalMessage =
    message ||
    (motorcycle
      ? `Olá! Vim pelo site da ${siteName} e gostaria de saber mais sobre a ${motorcycle.brand} ${motorcycle.model}${motorcycle.year_model ? `, ano ${motorcycle.year_model}` : ""}.`
      : `Olá! Vim pelo site da ${siteName} e gostaria de saber mais sobre as motos disponíveis.`);

  const link = generateWhatsAppLink(contactPhone, finalMessage);

  if (isFloating && !children) {
    return (
      <div className="fixed bottom-6 right-6 z-40 flex items-center group pointer-events-none">
        {/* Tooltip on Desktop hover */}
        <span className="hidden md:inline-block mr-3 px-3 py-1.5 rounded-full bg-[#0B0D0F] text-white text-xs font-semibold shadow-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
          Falar no WhatsApp
        </span>

        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Falar conosco pelo WhatsApp"
          className={cn(
            'pointer-events-auto relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-xl hover:bg-[#20BD5A] hover:scale-105 active:scale-95 transition-all duration-300',
            className,
          )}
        >
          {/* Subtle pulse ring */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-75 animate-[ping_2.8s_cubic-bezier(0,0,0.2,1)_infinite] -z-10 group-hover:animate-none" />

          <WhatsAppIcon className="w-7 h-7 fill-current" />

          {/* Online badge */}
          <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
        </a>
      </div>
    );
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant, size }), className)}
    >
      <WhatsAppIcon className="mr-2 h-5 w-5 fill-current" />
      {children || 'Tenho interesse'}
    </a>
  );
}
