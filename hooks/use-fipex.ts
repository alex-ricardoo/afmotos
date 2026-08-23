import { useState, useCallback, useEffect } from 'react';
import {
  FipeVehicleType,
  FipeBrand,
  FipeModel,
  FipeModelDetail,
  FipeYearOption,
  FipeFuel,
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
} from '@/lib/fipex/mappers';
import { fipexCache, FIPEX_CACHE_TTL } from '@/lib/fipex/cache';

export function useFipex() {
  const [types, setTypes] = useState<FipeVehicleType[]>([]);
  const [allBrands, setAllBrands] = useState<FipeBrand[]>([]);
  const [allModels, setAllModels] = useState<FipeModel[]>([]);
  const [modelDetail, setModelDetail] = useState<FipeModelDetail | null>(null);
  const [years, setYears] = useState<FipeYearOption[]>([]);

  const [loadingPrelude, setLoadingPrelude] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const fetchBrandsForType = useCallback(async (typeId: string) => {
    if (!typeId) {
      setAllBrands([]);
      return;
    }
    setLoadingBrands(true);
    const cacheKey = `makes_all:${typeId}`;
    const cached = fipexCache.get<FipeBrand[]>(cacheKey);
    if (cached) {
      setAllBrands(cached);
      setLoadingBrands(false);
      return;
    }

    try {
      const rawPage1 = await fipexFetch<RawApiResponse<RawMake[]>>('/v1/makes', { type_id: typeId, limit: 50, page: 1, order_by: 'name' });
      let combined = (rawPage1.data || []).map(mapBrand);
      const totalPages = rawPage1.pagination?.pages || 1;
      
      if (totalPages > 1) {
        const remaining = [];
        for (let p = 2; p <= Math.min(totalPages, 5); p++) {
          remaining.push(fipexFetch<RawApiResponse<RawMake[]>>('/v1/makes', { type_id: typeId, limit: 50, page: p, order_by: 'name' }));
        }
        const results = await Promise.allSettled(remaining);
        results.forEach((r) => {
          if (r.status === 'fulfilled' && r.value.data) combined = combined.concat(r.value.data.map(mapBrand));
        });
      }
      
      const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
      fipexCache.set(cacheKey, unique, FIPEX_CACHE_TTL.BRANDS);
      setAllBrands(unique);
    } catch (e) {
      console.error('Error fetching brands', e);
    } finally {
      setLoadingBrands(false);
    }
  }, []);

  const fetchModelsForBrand = useCallback(async (brandId: string, typeId: string) => {
    if (!brandId || !typeId) {
      setAllModels([]);
      return;
    }
    setLoadingModels(true);
    const cacheKey = `models_all:${brandId}:${typeId}`;
    const cached = fipexCache.get<FipeModel[]>(cacheKey);
    if (cached) {
      setAllModels(cached);
      setLoadingModels(false);
      return;
    }

    try {
      const rawPage1 = await fipexFetch<RawApiResponse<RawModel[]>>('/v1/models', { make_id: brandId, type_id: typeId, limit: 50, page: 1, order_by: 'name' });
      let combined = (rawPage1.data || []).map(mapModel);
      const totalPages = rawPage1.pagination?.pages || 1;
      
      if (totalPages > 1) {
        const remaining = [];
        for (let p = 2; p <= Math.min(totalPages, 8); p++) {
          remaining.push(fipexFetch<RawApiResponse<RawModel[]>>('/v1/models', { make_id: brandId, type_id: typeId, limit: 50, page: p, order_by: 'name' }));
        }
        const results = await Promise.allSettled(remaining);
        results.forEach((r) => {
          if (r.status === 'fulfilled' && r.value.data) combined = combined.concat(r.value.data.map(mapModel));
        });
      }
      
      const unique = Array.from(new Map(combined.map(m => [m.id, m])).values());
      fipexCache.set(cacheKey, unique, FIPEX_CACHE_TTL.MODELS);
      setAllModels(unique);
    } catch (e) {
      console.error('Error fetching models', e);
    } finally {
      setLoadingModels(false);
    }
  }, []);

  const fetchModelDetail = useCallback(async (modelId: string) => {
    if (!modelId) {
      setModelDetail(null);
      setYears([]);
      return;
    }
    setLoadingDetail(true);
    const cacheKey = `model:${modelId}`;
    const cached = fipexCache.get<FipeModelDetail>(cacheKey);
    
    function applyYears(detail: FipeModelDetail) {
      const opts = detail.yearFuels.map(yf => {
        const isZero = yf.isZeroKm || yf.year === 0 || yf.year === null;
        return {
          value: isZero ? 'zero' : String(yf.year),
          label: isZero ? '0km (Novo)' : String(yf.year),
          year: isZero ? null : yf.year,
          isZeroKm: isZero,
        };
      });
      opts.sort((a, b) => {
        if (a.isZeroKm) return -1;
        if (b.isZeroKm) return 1;
        return (b.year || 0) - (a.year || 0);
      });
      setYears(opts);
    }

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
    } catch (e) {
      console.error('Error fetching model detail', e);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const fetchFipePrice = useCallback(async (modelId: string, yearParam: string, fuelId: string) => {
    if (!modelId || !yearParam || !fuelId) return null;
    setLoadingPrice(true);
    try {
      const raw = await fipexFetch<RawApiResponse<RawExpandedPriceData>>('/v1/prices/expanded', {
        model_id: modelId,
        year: yearParam,
        fuel_id: fuelId,
      });
      return raw.data.price;
    } catch (e) {
      console.error('Error fetching price', e);
      return null;
    } finally {
      setLoadingPrice(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadPrelude() {
      setLoadingPrelude(true);
      try {
        const cached = fipexCache.get<{ vehicleTypes: FipeVehicleType[] }>('prelude');
        if (cached) {
          if (mounted) setTypes(cached.vehicleTypes);
          return;
        }
        const raw = await fipexFetch<RawApiResponse<RawPreludeData>>('/v1/prelude');
        const mapped = mapPrelude(raw.data);
        fipexCache.set('prelude', mapped, FIPEX_CACHE_TTL.PRELUDE);
        if (mounted) setTypes(mapped.vehicleTypes);
      } catch (e) {
        console.error('Error loading prelude', e);
      } finally {
        if (mounted) setLoadingPrelude(false);
      }
    }
    loadPrelude();
    return () => { mounted = false; };
  }, []);

  return {
    types,
    allBrands,
    allModels,
    modelDetail,
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
  };
}
