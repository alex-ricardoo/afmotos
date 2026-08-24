'use client';

import React, { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Bike, Calendar, Gauge, Palette, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FipeBrandCombobox } from '@/components/forms/fipe-brand-combobox';
import { FipeModelCombobox } from '@/components/forms/fipe-model-combobox';
import { FipeModelDetail } from '@/lib/fipex/types';
import { SellRequestInput } from '@/lib/validations/sell-request';

const currentYearVal = new Date().getFullYear();

const MANUFACTURE_YEAR_OPTIONS = Array.from(
  { length: currentYearVal + 2 - 1980 },
  (_, i) => currentYearVal + 1 - i,
);

const MOTORCYCLE_COLORS = [
  'Amarela',
  'Azul',
  'Bege',
  'Branca',
  'Cinza',
  'Dourada',
  'Laranja',
  'Marrom',
  'Prata',
  'Preta',
  'Roxa',
  'Verde',
  'Vermelha',
  'Vinho / Bordô',
  'Outra',
];

interface Step1MotorcycleDataProps {
  form: UseFormReturn<SellRequestInput>;
  onNext: () => void;
  fipeBrandId: string | null;
  setFipeBrandId: (id: string | null) => void;
  setFipeModelId: (id: string | null) => void;
  setFipeYearId: (id: string | null) => void;
  setFipeFuelId: (id: string | null) => void;
  setFipeFuelName: (name: string | null) => void;
}

export function Step1MotorcycleData({
  form,
  onNext,
  fipeBrandId,
  setFipeBrandId,
  setFipeModelId,
  setFipeYearId,
  setFipeFuelId,
  setFipeFuelName,
}: Step1MotorcycleDataProps) {
  const [customColor, setCustomColor] = useState('');
  const selectedBrand = form.watch('brand');
  const selectedYearFab = form.watch('year_manufacture') || currentYearVal;
  const selectedColor = form.watch('color') || '';

  const isKnownColor = MOTORCYCLE_COLORS.includes(selectedColor) && selectedColor !== 'Outra';
  const isOtherColor = selectedColor === 'Outra' || (selectedColor && !isKnownColor);

  // Model year options: cannot be lower than year_manufacture
  const maxModelYear = Math.max(currentYearVal + 2, selectedYearFab + 2);
  const modelYearOptions = Array.from(
    { length: maxModelYear - selectedYearFab + 1 },
    (_, i) => selectedYearFab + i,
  );

  const handleBrandSelect = (brandName: string, brandId?: string | null) => {
    setFipeBrandId(brandId || null);
    setFipeModelId(null);
    setFipeYearId(null);
    setFipeFuelId(null);
    setFipeFuelName(null);

    form.setValue('brand', brandName, { shouldValidate: true });
    form.setValue('brand_id', brandId || null);
    form.setValue('model', '', { shouldValidate: false });
    form.setValue('model_id', null);
    form.setValue('year_id', null);
    form.setValue('fuel_id', null);
    form.setValue('fuel_name', null);
  };

  const handleModelSelect = (
    modelName: string,
    modelId?: string | null,
    detail?: FipeModelDetail | null,
  ) => {
    setFipeModelId(modelId || null);
    form.setValue('model', modelName, { shouldValidate: true });
    form.setValue('model_id', modelId || null);

    if (detail && detail.yearFuels && detail.yearFuels.length > 0) {
      const latest = detail.yearFuels[0];
      const targetYear = latest.isZeroKm ? currentYearVal : (latest.year ?? currentYearVal);
      const primaryFuel = latest.fuels && latest.fuels.length > 0 ? latest.fuels[0] : null;

      const fabYear = targetYear;
      form.setValue('year_manufacture', fabYear, { shouldValidate: true });
      form.setValue('year_model', targetYear, { shouldValidate: true });
      form.setValue('year_id', latest.isZeroKm ? 'zero' : String(targetYear));

      if (primaryFuel) {
        form.setValue('fuel_id', primaryFuel.id);
        form.setValue('fuel_name', primaryFuel.name);
        setFipeFuelId(primaryFuel.id);
        setFipeFuelName(primaryFuel.name);
      }
    }
  };

  const handleAdvance = async () => {
    const isValid = await form.trigger([
      'brand',
      'model',
      'year_manufacture',
      'year_model',
      'mileage',
      'color',
    ]);
    if (isValid) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1 border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
          <Bike className="w-4 h-4" />
          <span>Etapa 1 de 4</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-heading">
          Identifique sua Motocicleta
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Informe a marca, modelo, anos, quilometragem e cor da moto que você quer vender.
        </p>
      </div>

      <div className="space-y-5">
        {/* Marca Combobox */}
        <FormField
          control={form.control}
          name="brand"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold text-zinc-300">
                Marca da Moto <span className="text-amber-500">*</span>
              </FormLabel>
              <FormControl>
                <FipeBrandCombobox
                  value={field.value}
                  brandId={fipeBrandId}
                  onSelect={handleBrandSelect}
                  error={Boolean(fieldState.error)}
                />
              </FormControl>
              <FormMessage className="text-xs text-rose-400" />
            </FormItem>
          )}
        />

        {/* Modelo Combobox */}
        <FormField
          control={form.control}
          name="model"
          render={({ field, fieldState }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold text-zinc-300">
                Modelo da Moto <span className="text-amber-500">*</span>
              </FormLabel>
              <FormControl>
                <FipeModelCombobox
                  value={field.value}
                  brandId={fipeBrandId}
                  brandName={selectedBrand}
                  onSelect={handleModelSelect}
                  disabled={!selectedBrand}
                  error={Boolean(fieldState.error)}
                />
              </FormControl>
              <FormMessage className="text-xs text-rose-400" />
            </FormItem>
          )}
        />

        {/* Grid de Anos (Selects) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="year_manufacture"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ano de Fabricação</span>
                  <span className="text-amber-500">*</span>
                </FormLabel>
                <FormControl>
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(val: string | null) => {
                      if (!val) return;
                      const yearNum = parseInt(val, 10);
                      field.onChange(yearNum);

                      // Regra de negócio: Ano do modelo não pode ser inferior ao ano de fabricação
                      const currentYearModel = form.getValues('year_model');
                      if (!currentYearModel || currentYearModel < yearNum) {
                        form.setValue('year_model', yearNum, { shouldValidate: true });
                      }
                    }}
                  >
                    <SelectTrigger className="h-11 bg-zinc-950/80 border-zinc-800 focus:border-amber-400 rounded-xl text-white text-sm font-mono">
                      <SelectValue placeholder="Selecione o ano..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-60">
                      {MANUFACTURE_YEAR_OPTIONS.map((y) => (
                        <SelectItem key={y} value={String(y)} className="cursor-pointer font-mono">
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="year_model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ano do Modelo</span>
                  <span className="text-amber-500">*</span>
                </FormLabel>
                <FormControl>
                  <Select
                    value={field.value ? String(field.value) : ''}
                    onValueChange={(val: string | null) => {
                      if (!val) return;
                      field.onChange(parseInt(val, 10));
                    }}
                  >
                    <SelectTrigger className="h-11 bg-zinc-950/80 border-zinc-800 focus:border-amber-400 rounded-xl text-white text-sm font-mono">
                      <SelectValue placeholder="Selecione o ano..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-60">
                      {modelYearOptions.map((y) => (
                        <SelectItem key={y} value={String(y)} className="cursor-pointer font-mono">
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />
        </div>

        {/* Quilometragem e Cor (Select) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="mileage"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span>Quilometragem (KM)</span>
                  <span className="text-amber-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    placeholder="Ex: 25000"
                    value={field.value === 0 ? '' : field.value || ''}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    className="h-11 bg-zinc-950/80 border-zinc-800 focus:border-amber-400 rounded-xl text-white text-sm"
                  />
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-amber-400" />
                  <span>Cor da Moto</span>
                  <span className="text-amber-500">*</span>
                </FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <Select
                      value={isKnownColor ? field.value : isOtherColor ? 'Outra' : ''}
                      onValueChange={(val: string | null) => {
                        if (!val) return;
                        if (val === 'Outra') {
                          field.onChange(customColor || 'Outra');
                        } else {
                          field.onChange(val);
                        }
                      }}
                    >
                      <SelectTrigger className="h-11 bg-zinc-950/80 border-zinc-800 focus:border-amber-400 rounded-xl text-white text-sm">
                        <SelectValue placeholder="Selecione a cor..." />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white max-h-60">
                        {MOTORCYCLE_COLORS.map((c) => (
                          <SelectItem key={c} value={c} className="cursor-pointer">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {isOtherColor && (
                      <Input
                        type="text"
                        placeholder="Digite a cor personalizada..."
                        value={customColor || (field.value !== 'Outra' ? field.value || '' : '')}
                        onChange={(e) => {
                          setCustomColor(e.target.value);
                          field.onChange(e.target.value);
                        }}
                        className="h-10 bg-zinc-950/80 border-zinc-800 focus:border-amber-400 rounded-xl text-white text-xs mt-2"
                      />
                    )}
                  </div>
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Botão de Avanço */}
      <div className="pt-4 flex justify-end">
        <Button
          type="button"
          onClick={handleAdvance}
          className="w-full sm:w-auto h-12 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 cursor-pointer transition-all"
        >
          <span>Avançar para Seus Dados</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
