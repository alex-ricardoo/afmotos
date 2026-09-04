"use client";

import React from "react";
import { MessageCircle, ShieldCheck } from "lucide-react";
import { useVehicleHistory } from "./vehicle-history-context";

export function VehicleHistoryStickyWhatsApp() {
  const { plate, isValid, formattedPlate, openWhatsAppCheckout } = useVehicleHistory();

  const handleClick = () => {
    if (isValid) {
      openWhatsAppCheckout(
        `Olá! Estou na página de consulta veicular com a placa ${formattedPlate} e gostaria de tirar uma dúvida antes de finalizar.`
      );
    } else {
      openWhatsAppCheckout(
        "Olá! Tenho uma dúvida sobre a consulta do histórico veicular e gostaria de falar com um especialista."
      );
    }
  };

  return (
    <aside
      aria-label="Atendimento rápido via WhatsApp"
      className="fixed bottom-5 right-4 z-50 flex items-center gap-2 group sm:bottom-6 sm:right-6"
    >
      {/* Dynamic contextual tooltip on desktop */}
      <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-500/30 bg-neutral-900/90 px-3.5 py-2 text-xs font-medium text-emerald-300 shadow-xl backdrop-blur-md transition-all duration-300 group-hover:scale-105">
        <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
        <span>
          {isValid ? (
            <>
              Dúvidas sobre a placa <strong className="text-white font-mono">{formattedPlate}</strong>?
            </>
          ) : (
            "Dúvidas? Fale com nosso especialista agora"
          )}
        </span>
      </div>

      {/* Floating Action Button with min 48px touch target */}
      <button
        type="button"
        onClick={handleClick}
        id="btn-sticky-whatsapp-historico"
        aria-label="Chamar especialista de histórico no WhatsApp"
        className="relative flex h-14 w-14 min-h-[48px] min-w-[48px] items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-500 text-white shadow-2xl shadow-emerald-600/40 transition-all duration-300 hover:scale-110 hover:shadow-emerald-500/50 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/50 cursor-pointer"
      >
        {/* Pulsing online badge */}
        <span className="absolute top-0.5 right-0.5 flex h-3.5 w-3.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
          <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-neutral-900 bg-emerald-400" />
        </span>

        <MessageCircle className="h-7 w-7 transition-transform group-hover:rotate-6" />
      </button>
    </aside>
  );
}
