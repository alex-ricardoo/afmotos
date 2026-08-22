"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { generateWhatsAppLink, generateMotorcycleInterestMessage } from "@/lib/utils/whatsapp";
import { CONSTANTS } from "@/lib/utils/constants";

interface WhatsAppCTAProps {
  motorcycle: {
    brand: string;
    model: string;
    year_model: number;
    price?: number | null;
  };
  className?: string;
}

export function WhatsAppCTA({ motorcycle, className }: WhatsAppCTAProps) {
  const handleContact = () => {
    const message = generateMotorcycleInterestMessage(motorcycle);
    // Replace with actual contact phone from constants or settings
    const phone = CONSTANTS?.CONTACT_PHONE || "11999999999"; 
    const url = generateWhatsAppLink(phone, message);
    window.open(url, "_blank");
  };

  return (
    <Button 
      onClick={handleContact}
      className={`w-full bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 py-6 text-lg font-semibold ${className || ""}`}
    >
      <MessageCircle className="w-6 h-6" />
      Chamar no WhatsApp
    </Button>
  );
}
