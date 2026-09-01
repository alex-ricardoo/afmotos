'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FipeVehicleType,
  FipeBrand,
  FipeModel,
  FipeModelDetail,
  FipeYearOption,
  FipeFuel,
  FipeExpandedResult,
  FipeQuote,
  RawApiResponse,
  RawMake,
  RawModel,
  RawModelDetail,
  RawExpandedPriceData,
  RawPreludeData,
} from '@/lib/fipex/types';
import { fipexFetch } from '@/lib/fipex/client';
import {
  mapPrelude,
  mapBrand,
  mapModel,
  mapModelDetail,
  mapExpandedPrice,
  buildFipeQuote,
} from '@/lib/fipex/mappers';
import { fipexCache, FIPEX_CACHE_TTL } from '@/lib/fipex/cache';
import { getFriendlyErrorMessage } from '@/lib/fipex/errors';
import {
  Search,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Bike,
  Check,
  ChevronsUpDown,
  X,
  Filter,
} from 'lucide-react';

// Marcas principais selecionadas para foco no AF Motos
const POPULAR_BRANDS = new Set([
  'HONDA',
  'YAMAHA',
  'SHINERAY',
  'BMW',
  'KAWASAKI',
  'SUZUKI',
  'ROYAL ENFIELD',
  'BAJAJ',
  'AVELLOZ',
  'VOLTZ',
  'MOTTU',
]);

interface FipeSearchFormProps {
  onResult: (result: FipeExpandedResult, quote: FipeQuote) => void;
  onLoadingChange?: (loading: boolean) => void;
  onClear?: () => void;
  initialPayload?: Record<string, unknown> | null;
}

export function FipeSearchForm({
  onResult,
  onLoadingChange,
  onClear,
  initialPayload,
}: FipeSearchFormProps) {
  // Dados de catálogo
  const [types, setTypes] = useState<FipeVehicleType[]>([]);
  const [allBrands, setAllBrands] = useState<FipeBrand[]>([]);
  const [allModels, setAllModels] = useState<FipeModel[]>([]);
  const [modelDetail, setModelDetail] = useState<FipeModelDetail | null>(null);
  const [years, setYears] = useState<FipeYearOption[]>([]);
  const [fuels, setFuels] = useState<FipeFuel[]>([]);

  // Seleções do formulário
  const [selectedTypeId, setSelectedTypeId] = useState<string>('');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedFuelId, setSelectedFuelId] = useState<string>('');

  // Autocomplete Marca
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [isBrandOpen, setIsBrandOpen] = useState(false);
  const [onlyPopularBrands, setOnlyPopularBrands] = useState(true);
  const brandComboboxRef = useRef<HTMLDivElement>(null);

  // Autocomplete Modelo
  const [modelSearchTerm, setModelSearchTerm] = useState('');
  const [isModelOpen, setIsModelOpen] = useState(false);
  const modelComboboxRef = useRef<HTMLDivElement>(null);

  // Estados de loading
  const [loadingPrelude, setLoadingPrelude] = useState<boolean>(false);
  const [loadingBrands, setLoadingBrands] = useState<boolean>(false);
  const [loadingModels, setLoadingModels] = useState<boolean>(false);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Estados de erro
  const [error, setError] = useState<string | null>(null);

  // AbortController para requisições em andamento
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (brandComboboxRef.current && !brandComboboxRef.current.contains(event.target as Node)) {
        setIsBrandOpen(false);
      }
      if (modelComboboxRef.current && !modelComboboxRef.current.contains(event.target as Node)) {
        setIsModelOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Função auxiliar para carregar marcas (com suporte a paginação)
  const fetchBrandsForType = useCallback(async (typeId: string) => {
    if (!typeId) {
      setAllBrands([]);
      return;
    }

    setLoadingBrands(true);
    setError(null);

    const cacheKey = `makes_all:${typeId}`;
    const cached = fipexCache.get<FipeBrand[]>(cacheKey);
    if (cached) {
      setAllBrands(cached);
      setLoadingBrands(false);
      return;
    }

    try {
      const rawPage1 = await fipexFetch<RawApiResponse<RawMake[]>>('/v1/makes', {
        type_id: typeId,
        limit: 50,
        page: 1,
        order_by: 'name',
      });

      let combinedMakes = (rawPage1.data || []).map(mapBrand);

      const totalPages = rawPage1.pagination?.pages || 1;
      if (totalPages > 1) {
        const remainingPages = [];
        for (let page = 2; page <= Math.min(totalPages, 5); page++) {
          remainingPages.push(
            fipexFetch<RawApiResponse<RawMake[]>>('/v1/makes', {
              type_id: typeId,
              limit: 50,
              page,
              order_by: 'name',
            }),
          );
        }

        const additionalResults = await Promise.allSettled(remainingPages);
        additionalResults.forEach((res) => {
          if (res.status === 'fulfilled' && res.value.data) {
            combinedMakes = combinedMakes.concat(res.value.data.map(mapBrand));
          }
        });
      }

      const uniqueMakesMap = new Map<string, FipeBrand>();
      combinedMakes.forEach((m) => uniqueMakesMap.set(m.id, m));
      const finalMakes = Array.from(uniqueMakesMap.values());

      fipexCache.set(cacheKey, finalMakes, FIPEX_CACHE_TTL.BRANDS);
      setAllBrands(finalMakes);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoadingBrands(false);
    }
  }, []);

  // Função auxiliar para carregar todos os modelos da marca selecionada
  const fetchModelsForBrand = useCallback(async (brandId: string, typeId: string) => {
    if (!brandId || !typeId) {
      setAllModels([]);
      return;
    }

    setLoadingModels(true);
    setError(null);

    const cacheKey = `models_all:${brandId}:${typeId}`;
    const cached = fipexCache.get<FipeModel[]>(cacheKey);
    if (cached) {
      setAllModels(cached);
      setLoadingModels(false);
      return;
    }

    try {
      const rawPage1 = await fipexFetch<RawApiResponse<RawModel[]>>('/v1/models', {
        make_id: brandId,
        type_id: typeId,
        limit: 50,
        page: 1,
        order_by: 'name',
      });

      let combinedModels = (rawPage1.data || []).map(mapModel);

      const totalPages = rawPage1.pagination?.pages || 1;
      if (totalPages > 1) {
        const remainingPages = [];
        for (let page = 2; page <= Math.min(totalPages, 8); page++) {
          remainingPages.push(
            fipexFetch<RawApiResponse<RawModel[]>>('/v1/models', {
              make_id: brandId,
              type_id: typeId,
              limit: 50,
              page,
              order_by: 'name',
            }),
          );
        }

        const additionalResults = await Promise.allSettled(remainingPages);
        additionalResults.forEach((res) => {
          if (res.status === 'fulfilled' && res.value.data) {
            combinedModels = combinedModels.concat(res.value.data.map(mapModel));
          }
        });
      }

      const uniqueModelsMap = new Map<string, FipeModel>();
      combinedModels.forEach((m) => uniqueModelsMap.set(m.id, m));
      const finalModels = Array.from(uniqueModelsMap.values());

      fipexCache.set(cacheKey, finalModels, FIPEX_CACHE_TTL.MODELS);
      setAllModels(finalModels);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoadingModels(false);
    }
  }, []);

  // Função auxiliar para carregar detalhe do modelo (anos e combustíveis)
  const fetchModelDetail = useCallback(async (modelId: string) => {
    if (!modelId) {
      setModelDetail(null);
      setYears([]);
      return;
    }

    setLoadingDetail(true);
    setError(null);

    const cacheKey = `model:${modelId}`;
    const cached = fipexCache.get<FipeModelDetail>(cacheKey);
    if (cached) {
      setModelDetail(cached);
      applyYears(cached);
      setLoadingDetail(false);
      return;
    }

    try {
      const raw = await fipexFetch<RawApiResponse<RawModelDetail>>(`/v1/models/${modelId}`);

      const mapped = mapModelDetail(raw.data);
      fipexCache.set(cacheKey, mapped, FIPEX_CACHE_TTL.MODEL_DETAIL);
      setModelDetail(mapped);
      applyYears(mapped);
    } catch (err) {
      setError(getFriendlyErrorMessage(err));
    } finally {
      setLoadingDetail(false);
    }

    function applyYears(detail: FipeModelDetail) {
      const yearOptions: FipeYearOption[] = detail.yearFuels.map((yf) => {
        const isZero = yf.isZeroKm || yf.year === 0 || yf.year === null;
        return {
          value: isZero ? 'zero' : String(yf.year),
          label: isZero ? '0km (Novo)' : String(yf.year),
          year: isZero ? null : yf.year,
          isZeroKm: isZero,
        };
      });

      yearOptions.sort((a, b) => {
        if (a.isZeroKm) return -1;
        if (b.isZeroKm) return 1;
        return (b.year || 0) - (a.year || 0);
      });

      setYears(yearOptions);
    }
  }, []);

  // 1. Carregar Prelude inicial
  useEffect(() => {
    let isMounted = true;

    async function loadPrelude() {
      setLoadingPrelude(true);
      setError(null);

      try {
        const cached = fipexCache.get<{ vehicleTypes: FipeVehicleType[] }>('prelude');
        if (cached) {
          if (isMounted) {
            setTypes(cached.vehicleTypes);
            const motoType = cached.vehicleTypes.find(
              (t) => t.slug === 'motocicletas' || t.name.toLowerCase().includes('moto'),
            );
            const defaultId = motoType ? motoType.id : cached.vehicleTypes[0]?.id || '';
            setSelectedTypeId(defaultId);
            if (defaultId) {
              fetchBrandsForType(defaultId);
            }
          }
          return;
        }

        const raw = await fipexFetch<RawApiResponse<RawPreludeData>>('/v1/prelude');
        const mapped = mapPrelude(raw.data);

        fipexCache.set('prelude', mapped, FIPEX_CACHE_TTL.PRELUDE);

        if (isMounted) {
          setTypes(mapped.vehicleTypes);
          const motoType = mapped.vehicleTypes.find(
            (t) => t.slug === 'motocicletas' || t.name.toLowerCase().includes('moto'),
          );
          const defaultId = motoType ? motoType.id : mapped.vehicleTypes[0]?.id || '';
          setSelectedTypeId(defaultId);
          if (defaultId) {
            fetchBrandsForType(defaultId);
          }
        }
      } catch (err) {
        if (isMounted) {
          setError(getFriendlyErrorMessage(err));
        }
      } finally {
        if (isMounted) {
          setLoadingPrelude(false);
        }
      }
    }

    loadPrelude();

    return () => {
      isMounted = false;
    };
  }, [fetchBrandsForType]);

  // Handlers de mudança com reset em cascata
  const handleTypeChange = (newTypeId: string) => {
    setSelectedTypeId(newTypeId);
    setSelectedBrandId('');
    setSelectedModelId('');
    setSelectedYear('');
    setSelectedFuelId('');
    setBrandSearchTerm('');
    setModelSearchTerm('');
    setAllModels([]);
    setModelDetail(null);
    setYears([]);
    setFuels([]);
    if (newTypeId) {
      fetchBrandsForType(newTypeId);
    } else {
      setAllBrands([]);
    }
  };

  const handleBrandSelect = (brand: FipeBrand) => {
    setSelectedBrandId(brand.id);
    setIsBrandOpen(false);
    setSelectedModelId('');
    setSelectedYear('');
    setSelectedFuelId('');
    setModelSearchTerm('');
    setModelDetail(null);
    setYears([]);
    setFuels([]);
    if (brand.id && selectedTypeId) {
      fetchModelsForBrand(brand.id, selectedTypeId);
    } else {
      setAllModels([]);
    }
  };

  const handleModelSelect = (model: FipeModel) => {
    setSelectedModelId(model.id);
    setIsModelOpen(false);
    setSelectedYear('');
    setSelectedFuelId('');
    setFuels([]);
    if (model.id) {
      fetchModelDetail(model.id);
    } else {
      setModelDetail(null);
      setYears([]);
    }
  };

  const handleYearChange = (newYear: string) => {
    setSelectedYear(newYear);
    if (!newYear || !modelDetail) {
      setFuels([]);
      setSelectedFuelId('');
      return;
    }

    const isZero = newYear === 'zero' || newYear === '0';
    const yearNum = isZero ? null : parseInt(newYear, 10);

    const yearFuelEntry = modelDetail.yearFuels.find((yf) => {
      if (isZero) return yf.isZeroKm || yf.year === 0 || yf.year === null;
      return yf.year === yearNum;
    });

    if (yearFuelEntry && yearFuelEntry.fuels.length > 0) {
      setFuels(yearFuelEntry.fuels);
      setSelectedFuelId(yearFuelEntry.fuels[0].id);
    } else {
      setFuels([]);
      setSelectedFuelId('');
    }
  };

  // Suporte a preenchimento por initialPayload (reconsulta)
  useEffect(() => {
    if (!initialPayload || Object.keys(initialPayload).length === 0) return;

    async function applyPayload() {
      const pType = initialPayload?.type_id ? String(initialPayload.type_id) : selectedTypeId;
      const pMake = initialPayload?.make_id ? String(initialPayload.make_id) : '';
      const pModel = initialPayload?.model_id ? String(initialPayload.model_id) : '';
      const pYear = initialPayload?.year !== undefined ? String(initialPayload.year) : '';
      const pFuel = initialPayload?.fuel_id ? String(initialPayload.fuel_id) : '';

      if (pType) {
        setSelectedTypeId(pType);
        await fetchBrandsForType(pType);
      }
      if (pMake && pType) {
        setSelectedBrandId(pMake);
        await fetchModelsForBrand(pMake, pType);
      }
      if (pModel) {
        setSelectedModelId(pModel);
        await fetchModelDetail(pModel);
      }
      if (pYear) {
        setSelectedYear(pYear);
      }
      if (pFuel) {
        setSelectedFuelId(pFuel);
      }
    }

    applyPayload();
  }, [initialPayload, selectedTypeId, fetchBrandsForType, fetchModelsForBrand, fetchModelDetail]);

  // Filtragem de marcas (Principais vs Todas + Busca textual do autocomplete)
  const isPopularBrand = (name: string) => {
    const upper = name.trim().toUpperCase();
    return POPULAR_BRANDS.has(upper);
  };

  const filteredBrands = allBrands.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(brandSearchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (onlyPopularBrands) {
      return isPopularBrand(b.name);
    }

    return true;
  });

  // Filtragem de modelos (Busca textual do autocomplete)
  const filteredModels = allModels.filter((m) =>
    m.name.toLowerCase().includes(modelSearchTerm.toLowerCase()),
  );

  // Objetos atualmente selecionados
  const selectedBrand = allBrands.find((b) => b.id === selectedBrandId);
  const selectedModel = allModels.find((m) => m.id === selectedModelId);

  // Handler de submissão da consulta
  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      if (!selectedModelId || !selectedYear || !selectedFuelId) {
        setError('Preencha todos os campos antes de consultar.');
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setSubmitting(true);
      if (onLoadingChange) onLoadingChange(true);
      setError(null);

      const isZero = selectedYear === 'zero' || selectedYear === '0';
      const yearParam = isZero ? 'zero' : selectedYear;

      const selectedBrandObj = allBrands.find((b) => b.id === selectedBrandId);
      const selectedModelObj = allModels.find((m) => m.id === selectedModelId);
      const selectedFuelObj = fuels.find((f) => f.id === selectedFuelId);
      const selectedTypeObj = types.find((t) => t.id === selectedTypeId);

      const queryPayload = {
        type_id: selectedTypeId,
        type_name: selectedTypeObj?.name || 'Motocicletas',
        make_id: selectedBrandId,
        brand_name: selectedBrandObj?.name || '',
        model_id: selectedModelId,
        model_name: selectedModelObj?.name || '',
        year: yearParam,
        fuel_id: selectedFuelId,
        fuel_name: selectedFuelObj?.name || '',
      };

      try {
        const raw = await fipexFetch<RawApiResponse<RawExpandedPriceData>>(
          '/v1/prices/expanded',
          {
            model_id: selectedModelId,
            fuel_id: selectedFuelId,
            year: yearParam,
          },
          { signal: controller.signal },
        );

        const mapped = mapExpandedPrice(raw.data);
        const quote = buildFipeQuote(mapped, queryPayload, raw.data);

        onResult(mapped, quote);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setError(getFriendlyErrorMessage(err));
      } finally {
        setSubmitting(false);
        if (onLoadingChange) onLoadingChange(false);
      }
    },
    [
      selectedTypeId,
      selectedBrandId,
      selectedModelId,
      selectedYear,
      selectedFuelId,
      allBrands,
      allModels,
      fuels,
      types,
      onResult,
      onLoadingChange,
    ],
  );

  const handleClear = () => {
    setSelectedBrandId('');
    setSelectedModelId('');
    setSelectedYear('');
    setSelectedFuelId('');
    setBrandSearchTerm('');
    setModelSearchTerm('');
    setError(null);
    if (onClear) onClear();
  };

  const isFormComplete = Boolean(
    selectedTypeId && selectedBrandId && selectedModelId && selectedYear && selectedFuelId,
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-5 sm:p-7 shadow-sm space-y-6"
    >
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#c9a44c]/10 text-[#c9a44c] border border-[#c9a44c]/20">
            <Bike className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-white">Formulário de Consulta</h3>
            <p className="text-xs text-zinc-400">
              Selecione as especificações da motocicleta na base oficial
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-zinc-400 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Limpar</span>
        </button>
      </div>

      {/* Alerta de erro se houver */}
      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-rose-200">Não foi possível consultar</p>
            <p className="leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* 1. Tipo de Veículo */}
        <div className="hidden">
          <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
            Tipo de veículo
          </label>
          <select
            value={selectedTypeId}
            onChange={(e) => handleTypeChange(e.target.value)}
            disabled={loadingPrelude || types.length === 0}
            className="w-full min-h-[48px] rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm font-medium text-zinc-200 focus:border-[#c9a44c] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="" disabled>
              {loadingPrelude ? 'Carregando tipos...' : 'Selecione o tipo'}
            </option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Marca (Chips Rápidos + Select com Auto-Complete) */}
        <div ref={brandComboboxRef} className="relative">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-zinc-300">Marca</label>
            <div className="flex items-center gap-2">
              {loadingBrands && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#e3c56c]">
                  <Loader2 className="h-3 w-3 animate-spin" /> Carregando marcas...
                </span>
              )}
            </div>
          </div>

          {/* Chips Rápidos */}
          <div className="flex flex-wrap gap-2 mb-3">
            {['HONDA', 'YAMAHA', 'BMW', 'SUZUKI', 'SHINERAY'].map((brandName) => {
              const brandObj = allBrands.find((b) => b.name.toUpperCase() === brandName);
              if (!brandObj) return null;
              
              const isSelected = selectedBrandId === brandObj.id;
              
              return (
                <button
                  key={brandObj.id}
                  type="button"
                  onClick={() => handleBrandSelect(brandObj)}
                  className={`min-h-[40px] px-3.5 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] border-[#c9a44c] text-zinc-950 shadow-md shadow-amber-500/20'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-300 hover:border-[#c9a44c]/50 hover:text-white'
                  }`}
                >
                  {brandName}
                </button>
              );
            })}
          </div>

          {/* Gatilho Visual do Select Marca */}
          <div
            onClick={() => {
              if (!loadingBrands && allBrands.length > 0 && selectedTypeId) {
                setIsBrandOpen((prev) => !prev);
              }
            }}
            className={`w-full min-h-[48px] flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm cursor-pointer transition-all bg-zinc-900 ${
              isBrandOpen
                ? 'border-[#c9a44c] ring-2 ring-[#c9a44c]/20'
                : 'border-zinc-800 hover:border-[#c9a44c]/50'
            } ${
              !selectedTypeId || loadingBrands || allBrands.length === 0
                ? 'opacity-50 cursor-not-allowed pointer-events-none'
                : ''
            }`}
          >
            <span className={selectedBrand ? 'font-bold text-white' : 'text-zinc-500'}>
              {selectedBrand
                ? selectedBrand.name
                : !selectedTypeId
                  ? 'Selecione o tipo primeiro'
                  : loadingBrands
                    ? 'Carregando marcas...'
                    : allBrands.length === 0
                      ? 'Nenhuma marca encontrada'
                      : 'Pesquisar marca (ex: Honda, Yamaha...)'}
            </span>
            <ChevronsUpDown className="h-4 w-4 text-zinc-400 shrink-0" />
          </div>

          {/* Dropdown Auto-Complete Marca */}
          {isBrandOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={brandSearchTerm}
                  onChange={(e) => setBrandSearchTerm(e.target.value)}
                  placeholder="Digite para filtrar marca..."
                  autoFocus
                  className="w-full min-h-[44px] rounded-xl border border-zinc-800 bg-zinc-900 pl-8 pr-8 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-[#c9a44c] outline-none"
                />
                {brandSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setBrandSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between px-1 text-[11px] text-zinc-400 border-b border-zinc-800 pb-1.5">
                <span>
                  {filteredBrands.length} {filteredBrands.length === 1 ? 'marca' : 'marcas'}
                </span>
                <button
                  type="button"
                  onClick={() => setOnlyPopularBrands((prev) => !prev)}
                  className="text-[#e3c56c] hover:underline cursor-pointer font-medium"
                >
                  {onlyPopularBrands ? 'Ver todas' : 'Filtrar principais'}
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                {filteredBrands.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-400 space-y-1">
                    <p className="font-medium text-white">
                      Nenhuma marca encontrada para &ldquo;{brandSearchTerm}&rdquo;
                    </p>
                    {onlyPopularBrands && (
                      <button
                        type="button"
                        onClick={() => setOnlyPopularBrands(false)}
                        className="text-[#e3c56c] hover:underline cursor-pointer block mx-auto text-[11px] mt-1"
                      >
                        Buscar em todas as marcas
                      </button>
                    )}
                  </div>
                ) : (
                  filteredBrands.map((b) => {
                    const isSelected = selectedBrandId === b.id;
                    return (
                      <div
                        key={b.id}
                        onClick={() => handleBrandSelect(b)}
                        className={`flex items-center justify-between min-h-[38px] px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#c9a44c] text-zinc-950 font-bold'
                            : 'text-zinc-200 hover:bg-[#c9a44c]/15 hover:text-[#e3c56c]'
                        }`}
                      >
                        <span>{b.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* 3. Modelo (Select com Auto-Complete) */}
        <div ref={modelComboboxRef} className="relative">
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-zinc-300">Modelo</label>
            {loadingModels && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#e3c56c]">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Carregando modelos...</span>
              </span>
            )}
          </div>

          {/* Gatilho Visual do Select Modelo */}
          <div
            onClick={() => {
              if (!loadingModels && allModels.length > 0 && selectedBrandId) {
                setIsModelOpen((prev) => !prev);
              }
            }}
            className={`w-full min-h-[48px] flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm cursor-pointer transition-all bg-zinc-900 ${
              isModelOpen
                ? 'border-[#c9a44c] ring-2 ring-[#c9a44c]/20'
                : 'border-zinc-800 hover:border-[#c9a44c]/50'
            } ${
              !selectedBrandId || loadingModels || allModels.length === 0
                ? 'opacity-50 cursor-not-allowed pointer-events-none'
                : ''
            }`}
          >
            <span className={selectedModel ? 'font-bold text-white' : 'text-zinc-500'}>
              {selectedModel
                ? selectedModel.name
                : !selectedBrandId
                  ? 'Selecione a marca primeiro'
                  : loadingModels
                    ? 'Carregando modelos...'
                    : allModels.length === 0
                      ? 'Nenhum modelo encontrado'
                      : 'Pesquisar modelo (ex: CG 160, Biz, Fazer...)'}
            </span>
            <ChevronsUpDown className="h-4 w-4 text-zinc-400 shrink-0" />
          </div>

          {/* Dropdown Auto-Complete Modelo */}
          {isModelOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl p-2.5 space-y-2 animate-in fade-in zoom-in-95 duration-150">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                <input
                  type="text"
                  value={modelSearchTerm}
                  onChange={(e) => setModelSearchTerm(e.target.value)}
                  placeholder="Digite para filtrar modelo (ex: 160, Fan, Biz...)"
                  autoFocus
                  className="w-full min-h-[44px] rounded-xl border border-zinc-800 bg-zinc-900 pl-8 pr-8 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-[#c9a44c] outline-none"
                />
                {modelSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setModelSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="px-1 text-[11px] text-zinc-400 border-b border-zinc-800 pb-1.5">
                <span>
                  {filteredModels.length} {filteredModels.length === 1 ? 'modelo' : 'modelos'}
                </span>
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                {filteredModels.length === 0 ? (
                  <div className="p-4 text-center text-xs text-zinc-400">
                    Nenhum modelo encontrado para &ldquo;{modelSearchTerm}&rdquo;
                  </div>
                ) : (
                  filteredModels.map((m) => {
                    const isSelected = selectedModelId === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => handleModelSelect(m)}
                        className={`flex items-center justify-between min-h-[38px] px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#c9a44c] text-zinc-950 font-bold'
                            : 'text-zinc-200 hover:bg-[#c9a44c]/15 hover:text-[#e3c56c]'
                        }`}
                      >
                        <span>{m.name}</span>
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. Grid de Ano e Combustível */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Ano */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-300">Ano/modelo</label>
              {loadingDetail && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[#e3c56c]">
                  <Loader2 className="h-3 w-3 animate-spin" /> Carregando...
                </span>
              )}
            </div>
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              disabled={loadingDetail || years.length === 0 || !selectedModelId}
              className="w-full min-h-[48px] rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm font-medium text-zinc-200 focus:border-[#c9a44c] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {!selectedModelId
                  ? 'Selecione o modelo'
                  : loadingDetail
                    ? 'Carregando anos...'
                    : 'Selecione o ano'}
              </option>
              {years.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>

          {/* Combustível */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              Combustível
            </label>
            <select
              value={selectedFuelId}
              onChange={(e) => setSelectedFuelId(e.target.value)}
              disabled={fuels.length === 0 || !selectedYear}
              className="w-full min-h-[48px] rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2.5 text-sm font-medium text-zinc-200 focus:border-[#c9a44c] outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">
                {!selectedYear ? 'Selecione o ano' : 'Selecione o combustível'}
              </option>
              {fuels.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Botão de Consulta */}
      <button
        type="submit"
        disabled={!isFormComplete || submitting}
        className="w-full min-h-[50px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-zinc-950 px-5 py-3 text-sm sm:text-base font-bold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-4"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-zinc-950" />
            <span>Consultando tabela FIPE...</span>
          </>
        ) : (
          <>
            <Search className="h-4 w-4 text-zinc-950" />
            <span>Consultar Tabela FIPE</span>
          </>
        )}
      </button>
    </form>
  );
}
