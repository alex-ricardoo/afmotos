"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  normalizeBrazilianPlate,
  isValidBrazilianPlate,
  formatBrazilianPlate,
} from "@/lib/vehicle-lookup/plate";
import { buildVehicleHistoryWhatsAppUrl } from "@/lib/utils/whatsapp";

interface VehicleHistoryContextValue {
  plate: string;
  formattedPlate: string;
  isValid: boolean;
  setPlateInput: (value: string) => void;
  clearPlate: () => void;
  scrollToSection: (elementId: string) => void;
  openWhatsAppCheckout: (customMessage?: string) => void;
}

const STORAGE_KEY = "af_motos_consultation_plate";

const VehicleHistoryContext = createContext<VehicleHistoryContextValue | null>(null);

export function VehicleHistoryProvider({ children }: { children: React.ReactNode }) {
  const [plate, setPlate] = useState<string>("");

  // Restore persisted plate on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        setPlate(normalizeBrazilianPlate(saved));
      }
    } catch {
      // Ignore storage errors in private browsing/restricted environments
    }
  }, []);

  const setPlateInput = useCallback((value: string) => {
    const cleaned = normalizeBrazilianPlate(value).slice(0, 7);
    setPlate(cleaned);
    try {
      if (cleaned) {
        sessionStorage.setItem(STORAGE_KEY, cleaned);
      } else {
        sessionStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const clearPlate = useCallback(() => {
    setPlate("");
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const scrollToSection = useCallback((elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const openWhatsAppCheckout = useCallback((customMessage?: string) => {
    const targetPlate = plate.length === 7 && isValidBrazilianPlate(plate) ? plate : undefined;
    const url = buildVehicleHistoryWhatsAppUrl({
      plate: targetPlate,
    });
    if (customMessage) {
      // If custom message is supplied, extract phone and rewrite query param
      const phoneMatch = url.match(/wa\.me\/([^?]+)/);
      const phone = phoneMatch ? phoneMatch[1] : "5511999999999";
      const customUrl = `https://wa.me/${phone}?text=${encodeURIComponent(customMessage)}`;
      window.open(customUrl, "_blank", "noopener,noreferrer");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }, [plate]);

  const valid = plate.length === 7 && isValidBrazilianPlate(plate);
  const formatted = plate ? formatBrazilianPlate(plate) : "";

  return (
    <VehicleHistoryContext.Provider
      value={{
        plate,
        formattedPlate: formatted,
        isValid: valid,
        setPlateInput,
        clearPlate,
        scrollToSection,
        openWhatsAppCheckout,
      }}
    >
      {children}
    </VehicleHistoryContext.Provider>
  );
}

export function useVehicleHistory() {
  const context = useContext(VehicleHistoryContext);
  if (!context) {
    throw new Error("useVehicleHistory must be used within VehicleHistoryProvider");
  }
  return context;
}

