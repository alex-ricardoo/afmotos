'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
  User,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  DollarSign,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PECityCombobox } from '@/components/forms/pe-city-combobox';
import { formatPhoneForDisplay } from '@/lib/utils/whatsapp';
import { SellRequestInput } from '@/lib/validations/sell-request';

interface Step3OwnerContactProps {
  form: UseFormReturn<SellRequestInput>;
  onNext: () => void;
  onPrev: () => void;
}

export function Step3OwnerContact({ form, onNext, onPrev }: Step3OwnerContactProps) {
  const handlePhoneChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (val: string) => void,
  ) => {
    const rawDigits = e.target.value.replace(/\D/g, '').slice(0, 11);
    onChange(rawDigits);
  };

  const handleAdvance = async () => {
    const isValid = await form.trigger(['name', 'phone', 'city', 'email', 'desired_price']);
    if (isValid) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <User className="w-4 h-4" />
          <span>Etapa 2 de 4</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
          Seus Dados para Contato
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Informe seu WhatsApp e cidade para nossa equipe analisar a moto e enviar a proposta
          diretamente para você.
        </p>
      </div>

      <div className="space-y-5">
        {/* Nome Completo */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>Nome Completo</span>
                <span className="text-amber-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Seu nome e sobrenome"
                  value={field.value || ''}
                  onChange={field.onChange}
                  className="h-11 bg-zinc-950/80 border-zinc-800 focus:border-amber-400 rounded-xl text-white text-sm"
                />
              </FormControl>
              <FormMessage className="text-xs text-rose-400" />
            </FormItem>
          )}
        />

        {/* WhatsApp & E-mail */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    <span>WhatsApp com DDD</span>
                    <span className="text-amber-500">*</span>
                  </span>
                  {field.value && field.value.length >= 10 && (
                    <span className="text-[11px] text-emerald-400 font-mono">
                      {formatPhoneForDisplay(field.value)}
                    </span>
                  )}
                </FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="(81) 98888-7777"
                    value={field.value ? formatPhoneForDisplay(field.value) : ''}
                    onChange={(e) => handlePhoneChange(e, field.onChange)}
                    className="h-11 bg-zinc-950/80 border-zinc-800 focus:border-amber-400 rounded-xl text-white text-sm font-medium"
                  />
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>E-mail (Opcional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="seu.email@exemplo.com"
                    value={field.value || ''}
                    onChange={field.onChange}
                    className="h-11 bg-zinc-950/80 border-zinc-800 focus:border-amber-400 rounded-xl text-white text-sm"
                  />
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />
        </div>

        {/* Cidade (Pernambuco) & Expectativa de Valor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>Município (PE)</span>
                  <span className="text-amber-500">*</span>
                </FormLabel>
                <FormControl>
                  <PECityCombobox
                    value={field.value}
                    onChange={(cityName: string) =>
                      form.setValue('city', cityName, { shouldValidate: true })
                    }
                    error={Boolean(fieldState.error)}
                  />
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="desired_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                    <span>Quanto você espera? (Opcional)</span>
                  </span>
                  <span className="text-[10px] text-zinc-500 font-normal">Expectativa</span>
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-xs text-zinc-400 font-bold">
                      R$
                    </span>
                    <Input
                      type="number"
                      min={0}
                      step={100}
                      placeholder="Ex: 18000"
                      value={field.value || ''}
                      onChange={(e) =>
                        field.onChange(e.target.value ? Number(e.target.value) : undefined)
                      }
                      className="h-11 pl-10 bg-zinc-950/80 border-zinc-800 focus:border-amber-400 rounded-xl text-white text-sm"
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />
        </div>

        {/* Observações Opcionais */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold text-zinc-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  <span>Observações sobre a moto (Opcional)</span>
                </span>
                <span className="text-[10px] text-zinc-500">
                  {field.value ? field.value.length : 0}/1000
                </span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Informe detalhes sobre estado dos pneus, revisões, acessórios instalados ou pendências de documento..."
                  value={field.value || ''}
                  onChange={field.onChange}
                  rows={3}
                  className="bg-zinc-950/80 border-zinc-800 focus:border-amber-400 rounded-xl text-white text-sm resize-none"
                />
              </FormControl>
              <FormMessage className="text-xs text-rose-400" />
            </FormItem>
          )}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="pt-4 flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onPrev}
          className="h-12 px-5 rounded-xl border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-sm flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </Button>

        <Button
          type="button"
          onClick={handleAdvance}
          className="h-12 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center gap-2 cursor-pointer transition-all"
        >
          <span>Avançar para Fotos</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
