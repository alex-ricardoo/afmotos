import React from "react";
import { buttonVariants } from "@/components/ui/button";
import { generateWhatsAppLink, generateMotorcycleInterestMessage } from "@/lib/utils/whatsapp";

interface WhatsAppButtonProps {
  phone?: string;
  message?: string;
  motorcycle?: any;
  className?: string;
  children?: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function WhatsAppButton({ 
  phone = "5511999999999", // Default phone
  message,
  motorcycle,
  className,
  children = "Tenho interesse",
  variant = "default",
  size = "default"
}: WhatsAppButtonProps) {
  const finalMessage = message || (motorcycle ? generateMotorcycleInterestMessage(motorcycle) : "Olá, gostaria de mais informações.");
  const link = generateWhatsAppLink(phone, finalMessage);

  return (
    <a href={link} target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant, size, className })}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-2 h-5 w-5"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
      {children}
    </a>
  );
}
