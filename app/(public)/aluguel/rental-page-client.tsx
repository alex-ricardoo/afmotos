'use client';

import React, { useRef, useState } from 'react';
import { RentalMotorcycleCard } from '@/components/motorcycles/rental-motorcycle-card';
import { RentalLeadForm } from '@/components/forms/rental-lead-form';
import { Handshake } from 'lucide-react';

export function RentalPageClient({
  motorcycles,
  whatsappPhone,
  siteName,
}: {
  motorcycles: any[];
  whatsappPhone: string;
  siteName?: string;
}) {
  const formRef = useRef<HTMLDivElement>(null);
  const [selectedMotorcycleId, setSelectedMotorcycleId] = useState<string | undefined>(undefined);
  const [visibleCount, setVisibleCount] = useState(6);

  const handleSelectMotorcycle = (id: string) => {
    setSelectedMotorcycleId(id);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      {/* Vitrine de Motos para Locação */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
            Motos Disponíveis para Locação
          </h2>
          <p className="text-[#a6a6a1] text-sm mt-1">
            Escolha a sua moto e solicite uma proposta diretamente pelo formulário.
          </p>
        </div>

        {motorcycles.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {motorcycles.slice(0, visibleCount).map((moto) => (
                <RentalMotorcycleCard
                  key={moto.id}
                  motorcycle={moto}
                  onSelect={handleSelectMotorcycle}
                />
              ))}
            </div>
            {visibleCount < motorcycles.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 6)}
                  className="px-6 py-2.5 rounded-xl border border-[#c9a44c]/30 text-[#e3c56c] font-bold text-sm hover:bg-[#c9a44c]/10 transition-colors"
                >
                  Carregar Mais Motos
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-[#151515] p-12 text-center rounded-2xl border border-[#c9a44c]/20">
            <p className="text-[#a6a6a1]">
              Nenhuma motocicleta disponível para locação no momento. Volte em breve!
            </p>
          </div>
        )}
      </div>

      {/* Formulário Único & Inteligente */}
      <div ref={formRef} className="scroll-mt-24">
        <div className="bg-[#151515] rounded-3xl border border-[#c9a44c]/20 shadow-xs overflow-hidden max-w-4xl mx-auto">
          <div className="p-6 sm:p-8 bg-[#0d0d0d] border-b border-[#c9a44c]/20 space-y-2 relative">
            <div className="absolute top-6 right-6 hidden md:flex w-12 h-12 rounded-full bg-[#1a1a1a] border border-[#c9a44c]/30 items-center justify-center text-[#e3c56c]">
              <Handshake className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white font-heading pr-12">
              Solicitação de Aluguel
            </h2>
            <p className="text-sm text-[#a6a6a1] max-w-xl">
              Preencha os dados abaixo de forma rápida. Entraremos em contato pelo WhatsApp com a proposta personalizada.
            </p>
          </div>

          <div className="p-6 sm:p-8">
            <RentalLeadForm 
              defaultMotorcycleId={selectedMotorcycleId}
              availableMotorcycles={motorcycles.map(m => ({ id: m.id, brand: m.brand, model: m.model, version: m.version }))}
              whatsappPhone={whatsappPhone}
              siteName={siteName}
            />
          </div>
        </div>
      </div>
    </>
  );
}
