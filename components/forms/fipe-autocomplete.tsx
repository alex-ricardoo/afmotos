'use client';

import React, { useState, useEffect } from 'react';
import { useFipex } from '@/hooks/use-fipex';
import { FipeQuote } from '@/lib/fipex/types';
import { Button } from '@/components/ui/button';
import { Loader2, Search, CheckCircle2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FipeAutocompleteData {
  brand: string;
  model: string;
  year: number;
  fipe_price: number;
  quote?: FipeQuote;
}

interface FipeAutocompleteProps {
  onSuccess?: (data: FipeAutocompleteData) => void;
}

export function FipeAutocomplete({ onSuccess }: FipeAutocompleteProps) {
  const {
    types,
    allBrands,
    allModels,
    years,
    loadingPrelude,
    loadingBrands,
    loadingModels,
    loadingDetail,
    loadingPrice,
    fetchBrandsForType,
    fetchModelsForBrand,
    fetchModelDetail,
    fetchFipePrice,
  } = useFipex();

  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedYearVal, setSelectedYearVal] = useState<string>('');
  const [selectedFuelId, setSelectedFuelId] = useState<string>('');

  // Inicializar tipo quando os types carregarem
  useEffect(() => {
    let isMounted = true;
    if (types.length > 0 && !selectedTypeId) {
      const motoType = types.find(
        (t) => t.slug === 'motocicletas' || t.name.toLowerCase().includes('moto'),
      );
      const defaultId = motoType ? motoType.id : types[0]?.id || '';
      if (defaultId && isMounted) {
        Promise.resolve().then(() => {
          if (isMounted) {
            setSelectedTypeId(defaultId);
            fetchBrandsForType(defaultId);
          }
        });
      }
    }
    return () => {
      isMounted = false;
    };
  }, [types, selectedTypeId, fetchBrandsForType]);

  const handleBrandChange = (brandId: string) => {
    setSelectedBrandId(brandId);
    setSelectedModelId('');
    setSelectedYearVal('');
    setSelectedFuelId('');
    if (selectedTypeId) {
      fetchModelsForBrand(brandId, selectedTypeId);
    }
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    setSelectedYearVal('');
    setSelectedFuelId('');
    fetchModelDetail(modelId);
  };

  const handleYearChange = (yearVal: string) => {
    setSelectedYearVal(yearVal);
    const yOpt = years.find((y) => y.value === yearVal);
    if (yOpt) {
      setSelectedFuelId('1');
    }
  };

  const handleApply = async () => {
    if (!selectedModelId || !selectedYearVal) return;
    const priceData = await fetchFipePrice(selectedModelId, selectedYearVal, selectedFuelId || '1');
    if (priceData && onSuccess) {
      const brand = allBrands.find((b) => b.id === selectedBrandId);
      const model = allModels.find((m) => m.id === selectedModelId);
      const type = types.find((t) => t.id === selectedTypeId);

      const priceReais = priceData.price_cents ? priceData.price_cents / 100 : 0;
      const modelYear =
        selectedYearVal === 'zero' ? new Date().getFullYear() : Number(selectedYearVal);

      const quote: FipeQuote = {
        provider: 'fipex',
        providerLabel: 'fipeX',
        vehicleTypeId: selectedTypeId,
        vehicleTypeLabel: type?.name || 'Motocicletas',
        brandId: selectedBrandId,
        brandName: brand?.name || '',
        modelId: selectedModelId,
        modelName: model?.name || '',
        modelSlug: model?.slug || '',
        versionName: null,
        year: selectedYearVal === 'zero' ? null : Number(selectedYearVal),
        isZeroKm: selectedYearVal === 'zero',
        fuelId: selectedFuelId || '1',
        fuelName: 'Gasolina',
        fuelAcronym: 'g',
        referencePeriodId: '',
        referenceMonth: new Date().getMonth() + 1,
        referenceYear: new Date().getFullYear(),
        referenceLabel: `${new Date().getFullYear()}`,
        fipeCode: priceData.fipe_code || '',
        priceReais,
        currency: 'BRL',
        rawResponse: priceData,
      };

      onSuccess({
        brand: brand?.name || '',
        model: model?.name || '',
        year: modelYear,
        fipe_price: priceReais,
        quote,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border/40">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-[#c9a44c]" />
          <h4 className="text-sm font-semibold text-foreground">
            Preenchimento Automático via FIPE
          </h4>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Marca */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Marca</label>
          <Select
            value={selectedBrandId}
            onValueChange={(val) => {
              if (val) handleBrandChange(val);
            }}
            disabled={loadingPrelude || loadingBrands}
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue
                placeholder={loadingBrands ? 'Carregando marcas...' : 'Selecione a marca'}
              />
            </SelectTrigger>
            <SelectContent>
              {allBrands.map((brand) => (
                <SelectItem key={brand.id} value={brand.id}>
                  {brand.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Modelo */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Modelo</label>
          <Select
            value={selectedModelId}
            onValueChange={(val) => {
              if (val) handleModelChange(val);
            }}
            disabled={!selectedBrandId || loadingModels}
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue
                placeholder={loadingModels ? 'Carregando modelos...' : 'Selecione o modelo'}
              />
            </SelectTrigger>
            <SelectContent>
              {allModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ano Modelo */}
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Ano / Versão</label>
          <Select
            value={selectedYearVal}
            onValueChange={(val) => {
              if (val) handleYearChange(val);
            }}
            disabled={!selectedModelId || loadingDetail}
          >
            <SelectTrigger className="w-full h-10">
              <SelectValue placeholder={loadingDetail ? 'Carregando anos...' : 'Selecione o ano'} />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y.value} value={y.value}>
                  {y.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button
          type="button"
          onClick={handleApply}
          disabled={!selectedModelId || !selectedYearVal || loadingPrice}
          className="bg-[#c9a44c] hover:bg-[#e3c56c] text-[#050505] font-bold"
        >
          {loadingPrice ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Buscando Dados FIPE...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Aplicar Dados FIPE
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
