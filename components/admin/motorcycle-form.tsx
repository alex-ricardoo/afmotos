'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { createMotorcycleAction, updateMotorcycleAction } from '@/lib/actions/motorcycles';
import { ImageUploader } from '@/components/gallery/image-uploader';
import { AlertCircle, CheckCircle2, Sparkles, CarFront, Tag, FileText, Camera, Check, Search, X, ChevronsUpDown, Loader2 } from 'lucide-react';
import { MotorcycleImage } from '@/types/database';
import { SaleConfirmationModal } from '@/components/admin/sales/sale-confirmation-modal';
import { useFipex } from '@/hooks/use-fipex';
import { fipexFetch } from '@/lib/fipex/client';
import { mapPrelude } from '@/lib/fipex/mappers';
import { fipexCache, FIPEX_CACHE_TTL } from '@/lib/fipex/cache';
import { RawApiResponse, RawPreludeData } from '@/lib/fipex/types';
import { useEffect, useRef } from 'react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

import {
  formatRenavam,
  formatChassi,
  formatCurrency,
} from '@/lib/utils/formatters';
import {
  motorcycleStatusLabels,
  operationTypeLabels,
  ownershipTypeLabels,
} from '@/lib/utils/translations';

const fuelLabels: Record<string, string> = {
  gasolina: 'Gasolina',
  etanol: 'Etanol',
  flex: 'Flex',
  eletrico: 'Elétrico',
  diesel: 'Diesel',
};

const transmissionLabels: Record<string, string> = {
  manual: 'Manual',
  automatico: 'Automático',
  semiautomatico: 'Semiautomático',
  cvt: 'CVT',
};

const POPULAR_BRANDS = new Set(['HONDA', 'YAMAHA', 'KAWASAKI', 'SUZUKI', 'BMW', 'TRIUMPH', 'DUCATI', 'HARLEY-DAVIDSON']);

const motorcycleSchema = z.object({
  brand: z.string().min(2, 'Marca é obrigatória'),
  model: z.string().min(2, 'Modelo é obrigatório'),
  version: z.string().optional(),
  year_manufacture: z.coerce
    .number()
    .min(1900, 'Ano de fabricação inválido')
    .max(new Date().getFullYear() + 1, 'Ano inválido'),
  year_model: z.coerce
    .number()
    .min(1900, 'Ano do modelo inválido')
    .max(new Date().getFullYear() + 1, 'Ano inválido'),
  mileage: z.coerce.number().optional(),
  engine_capacity: z.coerce.number().optional(),
  fuel: z.enum(['gasolina', 'etanol', 'flex', 'eletrico', 'diesel']).optional().or(z.literal('')),
  transmission: z
    .enum(['manual', 'automatico', 'semiautomatico', 'cvt'])
    .optional()
    .or(z.literal('')),
  color: z.string().optional(),
  price: z.coerce.number().optional(),
  fipe_price: z.coerce.number().optional(),
  description: z.string().optional(),
  ownership_type: z.enum(['OWNED', 'CONSIGNMENT']),
  operation_type: z.enum(['SALE', 'RENTAL', 'SALE_AND_RENTAL']),
  status: z.enum([
    'AVAILABLE',
    'RESERVED',
    'SOLD',
    'MAINTENANCE',
    'RENTED',
    'UNAVAILABLE',
    'HIDDEN',
  ]),
  featured: z.boolean().default(false),
  license_plate: z.string().optional(),
  renavam: z.string().optional().nullable().or(z.literal('')),
  chassi: z.string().optional().nullable().or(z.literal('')),
  location: z.string().optional(),
});

type MotorcycleFormValues = z.infer<typeof motorcycleSchema>;

interface MotorcycleFormProps {
  initialData?: any;
}

function normalizeOwnership(val?: string): 'OWNED' | 'CONSIGNMENT' {
  if (val === 'CONSIGNMENT') return 'CONSIGNMENT';
  return 'OWNED';
}

function normalizeOperation(val?: string): 'SALE' | 'RENTAL' | 'SALE_AND_RENTAL' {
  if (val === 'RENTAL') return 'RENTAL';
  if (val === 'BOTH' || val === 'SALE_AND_RENTAL') return 'SALE_AND_RENTAL';
  return 'SALE';
}

function normalizeFuel(val?: string): 'gasolina' | 'etanol' | 'flex' | 'eletrico' | 'diesel' {
  if (!val) return 'gasolina';
  const lower = val.toLowerCase();
  if (lower === 'etanol') return 'etanol';
  if (lower === 'flex') return 'flex';
  if (lower === 'eletrico') return 'eletrico';
  if (lower === 'diesel') return 'diesel';
  return 'gasolina';
}

function normalizeTransmission(val?: string): 'manual' | 'automatico' | 'semiautomatico' | 'cvt' {
  if (!val) return 'manual';
  const lower = val.toLowerCase();
  if (lower === 'automatico') return 'automatico';
  if (lower === 'semiautomatico') return 'semiautomatico';
  if (lower === 'cvt') return 'cvt';
  return 'manual';
}

const formatKM = (value: number | string) => {
  const num = String(value).replace(/\D/g, '');
  if (!num) return '';
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const parseKM = (value: string) => {
  return Number(value.replace(/\D/g, ''));
};

const RadioPill = ({ label, value, selected, onClick }: { label: string; value: string; selected: boolean; onClick: (v: string) => void }) => (
  <button
    type="button"
    onClick={() => onClick(value)}
    className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all border ${
      selected
        ? 'bg-[#c9a44c]/20 border-[#c9a44c] text-[#c9a44c] shadow-[0_0_10px_rgba(201,164,76,0.15)]'
        : 'bg-background border-border text-muted-foreground hover:bg-muted'
    }`}
  >
    {label}
  </button>
);

export function MotorcycleForm({ initialData }: MotorcycleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [images, setImages] = useState<MotorcycleImage[]>(initialData?.images || []);

  const isEditing = !!initialData?.id;

  const generateAiDescription = () => {
    const values = form.getValues();
    const kmStr = values.mileage ? formatKM(values.mileage) + ' km' : '0 km';
    const desc = `🏍️ ${values.brand} ${values.model} ${values.version || ''}

📅 Ano: ${values.year_manufacture}/${values.year_model}
🛣️ Quilometragem: ${kmStr}
🎨 Cor: ${values.color || 'Não informada'}
⚙️ Motor: ${values.engine_capacity ? `${values.engine_capacity}cc` : 'Não informada'}
${values.fipe_price ? `📊 Preço Tabela FIPE: ${formatCurrency(values.fipe_price)}\n` : ''}
Moto revisada, documentação em dia.

Fale com nossa equipe e agende um test ride.`;
    form.setValue('description', desc.trim(), { shouldDirty: true });
  };

  const form = useForm<MotorcycleFormValues>({
    resolver: zodResolver(motorcycleSchema) as any,
    defaultValues: {
      brand: initialData?.brand || '',
      model: initialData?.model || '',
      version: initialData?.version || '',
      year_manufacture: initialData?.year_manufacture || new Date().getFullYear(),
      year_model: initialData?.year_model || new Date().getFullYear(),
      mileage: initialData?.mileage || 0,
      engine_capacity: initialData?.engine_capacity || 0,
      fuel: normalizeFuel(initialData?.fuel),
      transmission: normalizeTransmission(initialData?.transmission),
      color: initialData?.color || '',
      price: initialData?.price || 0,
      fipe_price: initialData?.fipe_price || null,
      description: initialData?.description || '',
      ownership_type: normalizeOwnership(initialData?.ownership_type),
      operation_type: normalizeOperation(initialData?.operation_type),
      status: initialData?.status || 'AVAILABLE',
      featured: initialData?.featured || false,
      license_plate: initialData?.license_plate || '',
      renavam: initialData?.renavam || '',
      chassi: initialData?.chassi || '',
      location: initialData?.location || '',
    },
  });

  // FIPE State & Refs
  const fipe = useFipex();
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  
  const [isBrandOpen, setIsBrandOpen] = useState(false);
  const [brandSearchTerm, setBrandSearchTerm] = useState('');
  const [onlyPopularBrands, setOnlyPopularBrands] = useState(true);
  const brandComboboxRef = useRef<HTMLDivElement>(null);

  const [isModelOpen, setIsModelOpen] = useState(false);
  const [modelSearchTerm, setModelSearchTerm] = useState('');
  const modelComboboxRef = useRef<HTMLDivElement>(null);
  
  const [fipeMotoTypeId, setFipeMotoTypeId] = useState<string>('');

  // Initialize FIPE (get type ID for motorcycles and load brands)
  useEffect(() => {
    let isMounted = true;
    async function loadFipeMotoBrands() {
      try {
        const cached = fipexCache.get<{ vehicleTypes: { id: string, slug: string, name: string }[] }>('prelude');
        let motoTypeId = '';
        if (cached) {
          const motoType = cached.vehicleTypes.find(t => t.slug === 'motocicletas' || t.name.toLowerCase().includes('moto'));
          if (motoType) motoTypeId = motoType.id;
        } else {
          const raw = await fipexFetch<RawApiResponse<RawPreludeData>>('/v1/prelude');
          const mapped = mapPrelude(raw.data);
          fipexCache.set('prelude', mapped, FIPEX_CACHE_TTL.PRELUDE);
          const motoType = mapped.vehicleTypes.find(t => t.slug === 'motocicletas' || t.name.toLowerCase().includes('moto'));
          if (motoType) motoTypeId = motoType.id;
        }
        
        if (isMounted && motoTypeId) {
          setFipeMotoTypeId(motoTypeId);
          fipe.fetchBrandsForType(motoTypeId);
        }
      } catch (err) {
        console.error('Failed to load FIPE prelude', err);
      }
    }
    loadFipeMotoBrands();
    return () => { isMounted = false; };
  }, [fipe.fetchBrandsForType]);

  const filteredBrands = fipe.allBrands.filter((b) => {
    if (onlyPopularBrands && !POPULAR_BRANDS.has(b.name.toUpperCase())) return false;
    return b.name.toLowerCase().includes(brandSearchTerm.toLowerCase());
  });

  const filteredModels = fipe.allModels.filter((m) => 
    m.name.toLowerCase().includes(modelSearchTerm.toLowerCase())
  );

  const handleBrandSelect = (id: string, name: string) => {
    setSelectedBrandId(id);
    form.setValue('brand', name, { shouldValidate: true });
    setIsBrandOpen(false);
    setBrandSearchTerm('');
    
    // reset model and year
    setSelectedModelId('');
    form.setValue('model', '');
    form.setValue('year_manufacture', new Date().getFullYear());
    form.setValue('year_model', new Date().getFullYear());
    form.setValue('fipe_price', 0);
    
    fipe.fetchModelsForBrand(id, fipeMotoTypeId); // Fetch models for Motos
  };

  const handleModelSelect = (id: string, name: string) => {
    setSelectedModelId(id);
    form.setValue('model', name, { shouldValidate: true });
    setIsModelOpen(false);
    setModelSearchTerm('');
    
    // reset year and price
    form.setValue('year_manufacture', new Date().getFullYear());
    form.setValue('year_model', new Date().getFullYear());
    form.setValue('fipe_price', 0);
    
    fipe.fetchModelDetail(id);
  };

  const handleYearChange = async (val: string) => {
    form.setValue('year_model', parseInt(val), { shouldValidate: true });
    form.setValue('year_manufacture', parseInt(val), { shouldValidate: true }); // Assume fab == model mostly
    
    if (selectedModelId) {
      // Let's find the matching year option
      const yearOpt = fipe.years.find(y => y.value === val);
      if (yearOpt && fipe.modelDetail) {
        // find fuel id
        const yf = fipe.modelDetail.yearFuels.find(yf => (yf.year === yearOpt.year || (yf.isZeroKm && yearOpt.isZeroKm)));
        const fuelId = yf?.fuels?.[0]?.id;
        if (yf && fuelId) {
           const fetchedPriceData = await fipe.fetchFipePrice(selectedModelId, val, fuelId);
           if (fetchedPriceData && fetchedPriceData.price_cents) {
             const priceReais = fetchedPriceData.price_cents / 100;
             form.setValue('fipe_price', priceReais, { shouldValidate: true });
             if (!form.getValues('price')) {
               form.setValue('price', priceReais, { shouldValidate: true });
             }
           }
        }
      }
    }
  };

  // Close comboboxes when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (brandComboboxRef.current && !brandComboboxRef.current.contains(event.target as Node)) {
        setIsBrandOpen(false);
      }
      if (modelComboboxRef.current && !modelComboboxRef.current.contains(event.target as Node)) {
        setIsModelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [showSaleModal, setShowSaleModal] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<MotorcycleFormValues | null>(null);

  async function executeSave(data: MotorcycleFormValues, redirectToSale = false) {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let result: any;
      if (isEditing) {
        result = await updateMotorcycleAction(initialData.id, data);
      } else {
        result = await createMotorcycleAction(data);
      }

      if (result?.error) {
        setErrorMsg(`Erro ao salvar: ${result.error}`);
        setLoading(false);
        return;
      }

      const motoId = isEditing ? initialData.id : result?.id;

      if (redirectToSale && motoId) {
        router.push(`/admin/vendas/nova?motorcycle_id=${motoId}`);
        return;
      }

      setSuccessMsg(
        isEditing ? 'Motocicleta atualizada com sucesso!' : 'Motocicleta cadastrada com sucesso! Redirecionando...',
      );

      setTimeout(() => {
        if (!isEditing && result?.id) {
          router.push(`/admin/motos/${result.id}/editar`);
        } else {
          router.push('/admin/motos');
        }
        router.refresh();
      }, 1500);
    } catch (error: any) {
      console.error(error);
      setErrorMsg('Não foi possível salvar a motocicleta. Verifique os campos e tente novamente.');
      setLoading(false);
    }
  }

  async function onSubmit(data: MotorcycleFormValues) {
    // Intercept if status is changed to SOLD
    if (data.status === 'SOLD' && initialData?.status !== 'SOLD') {
      setPendingFormData(data);
      setShowSaleModal(true);
      return;
    }

    await executeSave(data, false);
  }

  const handleSaveStatusOnly = async () => {
    setShowSaleModal(false);
    if (pendingFormData) {
      await executeSave(pendingFormData, false);
    }
  };

  const handleRegisterSale = async () => {
    setShowSaleModal(false);
    if (pendingFormData) {
      await executeSave(pendingFormData, true);
    } else if (initialData?.id) {
      router.push(`/admin/vendas/nova?motorcycle_id=${initialData.id}`);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {errorMsg && (
        <div className="bg-destructive/15 text-destructive border border-destructive p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-500/15 text-green-500 border border-green-500 p-4 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}



      {/* Imagens (Mobile First: Top) */}
      <div className="bg-card p-5 rounded-2xl shadow-sm border border-border space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Camera className="w-5 h-5 text-muted-foreground" />
          Imagens da Moto
        </h2>
        <ImageUploader
          motorcycleId={initialData?.id}
          images={images}
          onImagesChange={setImages}
        />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
          <Accordion 
            className="space-y-4"
          >
            {/* BLOCO 1: DADOS DO VEÍCULO & FICHA TÉCNICA */}
            <AccordionItem value="dados" className="bg-card border border-border rounded-2xl px-5 overflow-hidden">
              <AccordionTrigger className="hover:no-underline py-5">
                <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
                  <CarFront className="w-5 h-5 text-[#c9a44c]" />
                  Dados do Veículo & Ficha Técnica
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6 space-y-5">

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control as any}
                    name="brand"
                    render={({ field }) => {
                      const selectedBrand = fipe.allBrands.find(b => b.id === selectedBrandId);
                      const displayValue = selectedBrand?.name || field.value || '';
                      
                      return (
                        <FormItem className="col-span-1 md:col-span-2">
                          <div className="flex items-center justify-between mb-2">
                            <FormLabel>Marca <span className="text-destructive">*</span></FormLabel>
                            {fipe.loadingBrands && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#e3c56c]">
                                <Loader2 className="h-3 w-3 animate-spin" />
                              </span>
                            )}
                          </div>
                          <FormControl>
                            <div ref={brandComboboxRef} className="relative space-y-3">
                              {/* Quick Pills */}
                              <div className="flex flex-wrap gap-2">
                                {Array.from(POPULAR_BRANDS).map((brandName) => {
                                  const brandObj = fipe.allBrands.find(b => b.name.toUpperCase() === brandName);
                                  const isSelected = selectedBrandId === brandObj?.id || field.value.toUpperCase() === brandName;
                                  return (
                                    <button
                                      key={brandName}
                                      type="button"
                                      onClick={() => {
                                        if (brandObj) {
                                          handleBrandSelect(brandObj.id, brandObj.name);
                                        } else {
                                          form.setValue('brand', brandName, { shouldValidate: true });
                                        }
                                      }}
                                      className={`min-h-[40px] px-3.5 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                                        isSelected
                                          ? 'bg-amber-500 border-amber-500 text-zinc-950 shadow-sm'
                                          : 'bg-background border-border text-foreground hover:border-amber-500/50'
                                      }`}
                                    >
                                      {brandName}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Dropdown Trigger */}
                              <div
                                onClick={() => {
                                  if (!fipe.loadingBrands) setIsBrandOpen(p => !p);
                                }}
                                className={`w-full min-h-[48px] flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm cursor-pointer transition-all bg-background ${
                                  isBrandOpen ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-border hover:border-amber-500/50'
                                }`}
                              >
                                <span className={displayValue ? 'font-bold text-foreground' : 'text-muted-foreground'}>
                                  {displayValue || 'Pesquisar ou digitar marca...'}
                                </span>
                                <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                              </div>

                              {/* Dropdown Content */}
                              {isBrandOpen && (
                                <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-[#c9a44c]/40 bg-card/95 backdrop-blur-md shadow-2xl p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <input
                                      type="text"
                                      value={brandSearchTerm}
                                      onChange={(e) => setBrandSearchTerm(e.target.value)}
                                      placeholder="Digite para filtrar marca..."
                                      autoFocus
                                      className="w-full min-h-[48px] rounded-lg border border-border bg-background/80 pl-8 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-amber-500 outline-none"
                                    />
                                    {brandSearchTerm && (
                                      <button
                                        type="button"
                                        onClick={() => setBrandSearchTerm('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground border-b border-border/40 pb-1.5">
                                    <span>{filteredBrands.length} marcas</span>
                                    <button
                                      type="button"
                                      onClick={(e) => { e.stopPropagation(); setOnlyPopularBrands(p => !p); }}
                                      className="text-[#e3c56c] hover:underline cursor-pointer font-medium"
                                    >
                                      {onlyPopularBrands ? 'Ver todas' : 'Filtrar principais'}
                                    </button>
                                  </div>

                                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                                    {filteredBrands.length === 0 ? (
                                      <div className="p-4 text-center text-xs text-muted-foreground space-y-2">
                                        <p className="font-medium text-foreground">Nenhuma marca encontrada na FIPE.</p>
                                        <Button 
                                          type="button" 
                                          variant="outline" 
                                          size="sm"
                                          className="w-full text-[11px] h-8"
                                          onClick={() => {
                                            form.setValue('brand', brandSearchTerm, { shouldValidate: true });
                                            setSelectedBrandId('');
                                            setIsBrandOpen(false);
                                          }}
                                        >
                                          Usar "{brandSearchTerm}" manual
                                        </Button>
                                      </div>
                                    ) : (
                                      filteredBrands.map((b) => (
                                        <div
                                          key={b.id}
                                          onClick={() => handleBrandSelect(b.id, b.name)}
                                          className={`flex items-center justify-between min-h-[40px] px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                                            selectedBrandId === b.id ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-foreground hover:bg-amber-500/15 hover:text-amber-500'
                                          }`}
                                        >
                                          <span>{b.name}</span>
                                          {selectedBrandId === b.id && <Check className="h-3.5 w-3.5" />}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control as any}
                    name="model"
                    render={({ field }) => {
                      const selectedModel = fipe.allModels.find(m => m.id === selectedModelId);
                      const displayValue = selectedModel?.name || field.value || '';

                      return (
                        <FormItem className="col-span-1 md:col-span-2">
                          <div className="flex items-center justify-between mb-2">
                            <FormLabel>Modelo <span className="text-destructive">*</span></FormLabel>
                            {fipe.loadingModels && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#e3c56c]">
                                <Loader2 className="h-3 w-3 animate-spin" />
                              </span>
                            )}
                          </div>
                          <FormControl>
                            <div ref={modelComboboxRef} className="relative">
                              <div
                                onClick={() => {
                                  if (!fipe.loadingModels) setIsModelOpen(p => !p);
                                }}
                                className={`w-full min-h-[48px] flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm cursor-pointer transition-all bg-background ${
                                  isModelOpen ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-border hover:border-amber-500/50'
                                }`}
                              >
                                <span className={displayValue ? 'font-bold text-foreground' : 'text-muted-foreground'}>
                                  {displayValue || 'Pesquisar ou digitar modelo...'}
                                </span>
                                <ChevronsUpDown className="h-4 w-4 text-muted-foreground shrink-0" />
                              </div>

                              {isModelOpen && (
                                <div className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-[#c9a44c]/40 bg-card/95 backdrop-blur-md shadow-2xl p-2 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <input
                                      type="text"
                                      value={modelSearchTerm}
                                      onChange={(e) => setModelSearchTerm(e.target.value)}
                                      placeholder="Digite para filtrar modelo..."
                                      autoFocus
                                      className="w-full min-h-[48px] rounded-lg border border-border bg-background/80 pl-8 pr-8 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-amber-500 outline-none"
                                    />
                                    {modelSearchTerm && (
                                      <button
                                        type="button"
                                        onClick={() => setModelSearchTerm('')}
                                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    )}
                                  </div>

                                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1 mt-2">
                                    {filteredModels.length === 0 ? (
                                      <div className="p-4 text-center text-xs text-muted-foreground space-y-2">
                                        <p className="font-medium text-foreground">Nenhum modelo encontrado.</p>
                                        <Button 
                                          type="button" 
                                          variant="outline" 
                                          size="sm"
                                          className="w-full text-[11px] h-8"
                                          onClick={() => {
                                            form.setValue('model', modelSearchTerm, { shouldValidate: true });
                                            setSelectedModelId('');
                                            setIsModelOpen(false);
                                          }}
                                        >
                                          Usar "{modelSearchTerm}" manual
                                        </Button>
                                      </div>
                                    ) : (
                                      filteredModels.map((m) => (
                                        <div
                                          key={m.id}
                                          onClick={() => handleModelSelect(m.id, m.name)}
                                          className={`flex items-center justify-between min-h-[40px] px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                                            selectedModelId === m.id ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-foreground hover:bg-amber-500/15 hover:text-amber-500'
                                          }`}
                                        >
                                          <span>{m.name}</span>
                                          {selectedModelId === m.id && <Check className="h-3.5 w-3.5" />}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control as any}
                    name="version"
                    render={({ field }) => (
                      <FormItem className="col-span-1 md:col-span-2">
                        <FormLabel>Versão (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: ABS" {...field} value={field.value || ''} className="bg-background h-12 rounded-xl" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4 col-span-1 md:col-span-2">
                    <FormField
                      control={form.control as any}
                      name="year_manufacture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ano Fab. <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            <Input type="number" {...field} className="bg-background h-12 rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name="year_model"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ano Mod. <span className="text-destructive">*</span></FormLabel>
                          <FormControl>
                            {selectedModelId && fipe.years.length > 0 ? (
                              <Select 
                                value={String(field.value) || ''} 
                                onValueChange={(val) => {
                                  if (val) handleYearChange(val);
                                }}
                              >
                                <SelectTrigger className="bg-background h-12 rounded-xl">
                                  <SelectValue placeholder="Selecione o ano..." />
                                </SelectTrigger>
                                <SelectContent>
                                  {fipe.years.map((y) => (
                                    <SelectItem key={y.value} value={y.value}>
                                      {y.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input type="number" {...field} className="bg-background h-12 rounded-xl" />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control as any}
                    name="mileage"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel>Quilometragem (km)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0 km"
                            {...fieldProps}
                            value={formatKM(value || 0)}
                            onChange={(e) => onChange(parseKM(e.target.value))}
                            className="bg-background h-12 rounded-xl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control as any}
                    name="license_plate"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel>Placa</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ABC-1234"
                            {...fieldProps}
                            value={value || ''}
                            onChange={(e) => {
                              const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
                              if (v.length > 3) {
                                onChange(`${v.slice(0, 3)}-${v.slice(3)}`);
                              } else {
                                onChange(v);
                              }
                            }}
                            className="bg-background h-12 rounded-xl uppercase tracking-widest font-semibold"
                            maxLength={8}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Renavam & Chassi (Dados Fiscais/Detran) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control as any}
                      name="renavam"
                      render={({ field: { value, onChange, ...fieldProps } }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>Renavam</span>
                            <span className="text-[11px] text-muted-foreground font-normal">11 dígitos</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="01234567890"
                              {...fieldProps}
                              value={value || ''}
                              onChange={(e) => onChange(formatRenavam(e.target.value))}
                              maxLength={11}
                              className="bg-background h-12 rounded-xl font-mono text-foreground"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control as any}
                      name="chassi"
                      render={({ field: { value, onChange, ...fieldProps } }) => (
                        <FormItem>
                          <FormLabel className="flex items-center justify-between">
                            <span>Chassi (VIN)</span>
                            <span className="text-[11px] text-muted-foreground font-normal">17 caracteres</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="9C2JC4100ER000001"
                              {...fieldProps}
                              value={value || ''}
                              onChange={(e) => onChange(formatChassi(e.target.value))}
                              maxLength={17}
                              className="bg-background h-12 rounded-xl font-mono uppercase text-foreground"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control as any}
                      name="color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cor</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Preto" {...field} value={field.value || ''} className="bg-background h-12 rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control as any}
                      name="engine_capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cilindrada (cc)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} value={field.value ?? 0} className="bg-background h-12 rounded-xl" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* BLOCO 2: CONDIÇÃO COMERCIAL & VALORES */}
            <AccordionItem value="comercial" className="bg-card border border-border rounded-2xl px-5 overflow-hidden">
              <AccordionTrigger className="hover:no-underline py-5">
                <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
                  <Tag className="w-5 h-5 text-[#c9a44c]" />
                  Condição Comercial & Valores
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormField
                    control={form.control as any}
                    name="price"
                    render={({ field: { onChange, value, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel>Preço de Venda <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <Input
                            {...fieldProps}
                            value={value !== undefined && value !== null && value !== '' ? formatCurrency(value) : ''}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              onChange(val ? Number(val) / 100 : 0);
                            }}
                            className="bg-background h-14 rounded-xl text-xl font-bold tracking-tight text-amber-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="fipe_price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preço Tabela FIPE</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              readOnly
                              value={field.value ? formatCurrency(field.value) : ''}
                              placeholder="R$ 0,00"
                              className="bg-muted/50 h-14 rounded-xl text-lg font-semibold tracking-tight text-muted-foreground border-dashed"
                            />
                            {fipe.loadingPrice && (
                              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <Loader2 className="h-4 w-4 animate-spin text-[#c9a44c]" />
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormDescription className="text-[11px]">
                          Preenchido automaticamente ao selecionar o Ano Mod.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control as any}
                  name="operation_type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Operação <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <div className="flex gap-2 flex-wrap">
                          <RadioPill 
                            label="Venda" 
                            value="SALE" 
                            selected={field.value === 'SALE'} 
                            onClick={field.onChange} 
                          />
                          <RadioPill 
                            label="Aluguel" 
                            value="RENTAL" 
                            selected={field.value === 'RENTAL'} 
                            onClick={field.onChange} 
                          />
                          <RadioPill 
                            label="Ambos" 
                            value="SALE_AND_RENTAL" 
                            selected={field.value === 'SALE_AND_RENTAL'} 
                            onClick={field.onChange} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control as any}
                  name="ownership_type"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Tipo de Propriedade <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <RadioPill 
                            label="Própria" 
                            value="OWNED" 
                            selected={field.value === 'OWNED'} 
                            onClick={field.onChange} 
                          />
                          <RadioPill 
                            label="De um Cliente" 
                            value="CONSIGNMENT" 
                            selected={field.value === 'CONSIGNMENT'} 
                            onClick={field.onChange} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </AccordionContent>
            </AccordionItem>

            {/* BLOCO 3: DESCRIÇÃO & PUBLICAÇÃO */}
            <AccordionItem value="publicacao" className="bg-card border border-border rounded-2xl px-5 overflow-hidden">
              <AccordionTrigger className="hover:no-underline py-5">
                <div className="flex items-center gap-2 font-semibold text-lg text-foreground">
                  <FileText className="w-5 h-5 text-[#c9a44c]" />
                  Descrição & Publicação
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6 space-y-6">
                <FormField
                  control={form.control as any}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between mb-2">
                        <FormLabel className="mb-0">Descrição Comercial</FormLabel>
                        <Button 
                          type="button" 
                          variant="secondary" 
                          size="sm" 
                          onClick={generateAiDescription}
                          className="h-8 text-xs bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                          Criar Template de Descrição
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva a motocicleta em detalhes..."
                          className="resize-none bg-background rounded-xl min-h-[120px]"
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <FormField
                    control={form.control as any}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Status <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                          <div className="flex flex-wrap gap-2">
                            <RadioPill label="Disponível" value="AVAILABLE" selected={field.value === 'AVAILABLE'} onClick={field.onChange} />
                            <RadioPill label="Reservada" value="RESERVED" selected={field.value === 'RESERVED'} onClick={field.onChange} />
                            <RadioPill label="Vendida" value="SOLD" selected={field.value === 'SOLD'} onClick={field.onChange} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control as any}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-xl border border-border p-4 bg-background">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base font-semibold">Destaque na Página Inicial</FormLabel>
                          <FormDescription className="text-xs">
                            Exibir no carrossel principal do site.
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          {/* Floating Action Bar (Sticky Footer) */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800 p-3 px-4 md:px-8 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={loading}
              className="text-muted-foreground hover:text-foreground font-medium"
            >
              Cancelar
            </Button>
            
            <Button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-8 py-6 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.25)] active:scale-95 transition-all text-base"
              disabled={loading}
            >
              {loading
                ? (isEditing ? 'Salvando...' : 'Cadastrando...')
                : (isEditing ? 'Salvar Alterações' : 'Cadastrar Moto')}
            </Button>
          </div>
        </form>
      </Form>

      <SaleConfirmationModal
        open={showSaleModal}
        onOpenChange={setShowSaleModal}
        motorcycleTitle={`${form.getValues('brand') || ''} ${form.getValues('model') || ''}`.trim() || 'Motocicleta'}
        onRegisterSale={handleRegisterSale}
        onSaveStatusOnly={handleSaveStatusOnly}
        loading={loading}
      />
    </div>
  );
}
