'use client';

import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import Image from 'next/image';
import {
  CheckSquare,
  Bike,
  User,
  Camera,
  ArrowLeft,
  Loader2,
  Send,
  DollarSign,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { formatPhoneForDisplay } from '@/lib/utils/whatsapp';
import { CONSTANTS } from '@/lib/utils/constants';
import { SellRequestInput } from '@/lib/validations/sell-request';

interface Step5ReviewSubmitProps {
  form: UseFormReturn<SellRequestInput>;
  previews: string[];
  onPrev: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  siteName?: string;
}

export function Step5ReviewSubmit({
  form,
  previews,
  onPrev,
  onSubmit,
  isSubmitting,
  siteName,
}: Step5ReviewSubmitProps) {
  const [agreed, setAgreed] = useState(false);
  const values = form.getValues();
  const storeName = siteName || CONSTANTS.STORE_NAME;

  return (
    <div className="space-y-6">
      <div className="space-y-1 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <CheckSquare className="w-4 h-4" />
          <span>Etapa 4 de 4</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
          Revisão da sua Proposta
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Confira todos os dados antes de enviar para a equipe comercial da {storeName}.
        </p>
      </div>

      <div className="space-y-4">
        {/* Bloco 1: Moto */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Bike className="w-4 h-4" />
              <span>Dados da Motocicleta</span>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-zinc-500 block">Marca / Modelo</span>
              <span className="font-extrabold text-white text-sm">
                {values.brand} {values.model}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Ano Fab / Mod</span>
              <span className="font-bold text-zinc-200">
                {values.year_manufacture} / {values.year_model}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Quilometragem</span>
              <span className="font-bold text-zinc-200">
                {values.mileage ? `${values.mileage.toLocaleString('pt-BR')} km` : '0 km'}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Cor</span>
              <span className="font-bold text-zinc-200">{values.color || 'Não informada'}</span>
            </div>
          </div>
        </div>

        {/* Bloco 2: Contato e Expectativa */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <User className="w-4 h-4" />
              <span>Dados do Proprietário & Localização</span>
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-zinc-500 block">Nome</span>
              <span className="font-bold text-zinc-200">{values.name}</span>
            </div>
            <div>
              <span className="text-zinc-500 block">WhatsApp</span>
              <span className="font-bold text-emerald-400 font-mono">
                {formatPhoneForDisplay(values.phone)}
              </span>
            </div>
            <div>
              <span className="text-zinc-500 block">Localização</span>
              <span className="font-bold text-zinc-200">{values.city}, PE</span>
            </div>
          </div>

          {values.desired_price != null && values.desired_price > 0 && (
            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between bg-zinc-900/40 p-2.5 rounded-xl border border-zinc-800 text-xs">
              <span className="text-zinc-400 flex items-center gap-1.5 font-medium">
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                <span>Expectativa de valor informada pelo cliente:</span>
              </span>
              <span className="font-mono font-bold text-white text-sm">
                {formatCurrency(values.desired_price)}
              </span>
            </div>
          )}

          {values.notes && (
            <div className="pt-2 border-t border-zinc-800/60 text-xs">
              <span className="text-zinc-500 block mb-1">Observações</span>
              <p className="text-zinc-300 italic bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800">
                &quot;{values.notes}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Bloco 3: Fotos */}
        <div className="bg-zinc-950/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <Camera className="w-4 h-4" />
              <span>Fotos Anexadas ({previews.length})</span>
            </span>
          </div>
          {previews.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
              {previews.map((src, idx) => (
                <div
                  key={idx}
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-zinc-700 bg-zinc-900"
                >
                  <Image src={src} alt={`Miniatura ${idx + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500 italic">Nenhuma foto anexada.</p>
          )}
        </div>
      </div>

      {/* Consentimento Obrigatório */}
      <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-400 focus:ring-offset-zinc-950 cursor-pointer"
          />
          <span className="text-xs text-zinc-300 leading-relaxed">
            Confirmo que as informações fornecidas são verdadeiras e autorizo a{' '}
            <strong>{storeName}</strong> a entrar em contato via WhatsApp para apresentar a avaliação e
            proposta de compra.
          </span>
        </label>
      </div>

      {/* Navigation & Submit Buttons */}
      <div className="pt-4 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onPrev}
          className="h-12 px-5 rounded-xl border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Button>

        <Button
          type="button"
          disabled={!agreed || isSubmitting}
          onClick={onSubmit}
          className="h-12 px-8 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black text-sm shadow-[0_0_25px_rgba(245,158,11,0.35)] flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
              <span>Enviando Dados...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Enviar para Avaliação da Loja</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
