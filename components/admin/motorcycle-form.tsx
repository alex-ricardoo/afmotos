'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { createMotorcycleAction, updateMotorcycleAction } from '@/lib/actions/motorcycles';
import { ImageUploader } from '@/components/gallery/image-uploader';
import {
  AlertCircle,
  CheckCircle2,
  Sparkles,
  CarFront,
  Tag,
  FileText,
  Camera,
  Check,
  Search,
  X,
  ChevronsUpDown,
  Loader2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Bike,
  Sparkle,
} from 'lucide-react';
import { MotorcycleImage } from '@/types/database';
import { SaleConfirmationModal } from '@/components/admin/sales/sale-confirmation-modal';
import { useFipex } from '@/hooks/use-fipex';
import { fipexFetch } from '@/lib/fipex/client';
import { mapPrelude } from '@/lib/fipex/mappers';
import { fipexCache, FIPEX_CACHE_TTL } from '@/lib/fipex/cache';
import { RawApiResponse, RawPreludeData } from '@/lib/fipex/types';

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
  formatRenavam,
  formatChassi,
  formatCurrency,
  formatKm,
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

const POPULAR_BRANDS = new Set(['HONDA', 'YAMAHA', 'KAWASAKI', 'SUZUKI', 'BMW', 'TRIUMPH', 'DUCATI', 'HARLEY-DAVIDSON', 'ROYAL ENFIELD', 'BAJAJ', 'SHINERAY', 'DAFRA']);

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

const RadioPill = ({
  label,
  value,
  selected,
  onClick,
}: {
  label: string;
  value: string;
  selected: boolean;
  onClick: (v: string) => void;
}) => (
  <button
    type="button"
    onClick={() => onClick(value)}
    className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all border cursor-pointer ${
      selected
        ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)] font-bold'
        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
    }`}
  >
    {label}
  </button>
);

const WIZARD_STEPS = [
  { id: 1, label: 'Veículo & Ficha', icon: CarFront, description: 'Dados cadastrais e técnicos' },
  { id: 2, label: 'Valores & Condições', icon: Tag, description: 'Preço, FIPE e modalidades' },
  { id: 3, label: 'Descrição & Anúncio', icon: FileText, description: 'Texto e destaques' },
  { id: 4, label: 'Fotos do Veículo', icon: Camera, description: 'Galeria e capa oficial' },
];

export function MotorcycleForm({ initialData }: MotorcycleFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStepParam = searchParams.get('step');

  const [currentStep, setCurrentStep] = useState<number>(
    initialStepParam === 'fotos' ? 4 : 1
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [images, setImages] = useState<MotorcycleImage[]>(initialData?.images || []);

  const isEditing = !!initialData?.id;

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
      location: initialData?.location || 'São Paulo, SP',
    },
  });

  const generateAiDescription = () => {
    const values = form.getValues();
    const kmStr = values.mileage ? formatKM(values.mileage) + ' km' : '0 km';
    const desc = `🏍️ ${values.brand} ${values.model} ${values.version || ''}

📅 Ano: ${values.year_manufacture}/${values.year_model}
🛣️ Quilometragem: ${kmStr}
🎨 Cor: ${values.color || 'Não informada'}
⚙️ Motor: ${values.engine_capacity ? `${values.engine_capacity}cc` : 'Não informada'}
${values.fipe_price ? `📊 Preço Tabela FIPE: ${formatCurrency(values.fipe_price)}\n` : ''}
✅ Moto revisada, documentação 100% em dia e garantia de procedência.
💳 Aceitamos seu veículo na troca e facilitamos pagamento.

Entre em contato com nossa equipe e agende um test ride!`;
    form.setValue('description', desc.trim(), { shouldDirty: true });
  };

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

  // Initialize FIPE
  useEffect(() => {
    let isMounted = true;
    async function loadFipeMotoBrands() {
      try {
        const cached = fipexCache.get<{ vehicleTypes: { id: string; slug: string; name: string }[] }>('prelude');
        let motoTypeId = '';
        if (cached) {
          const motoType = cached.vehicleTypes.find(
            (t) => t.slug === 'motocicletas' || t.name.toLowerCase().includes('moto')
          );
          if (motoType) motoTypeId = motoType.id;
        } else {
          const raw = await fipexFetch<RawApiResponse<RawPreludeData>>('/v1/prelude');
          const mapped = mapPrelude(raw.data);
          fipexCache.set('prelude', mapped, FIPEX_CACHE_TTL.PRELUDE);
          const motoType = mapped.vehicleTypes.find(
            (t) => t.slug === 'motocicletas' || t.name.toLowerCase().includes('moto')
          );
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
    
    fipe.fetchModelsForBrand(id, fipeMotoTypeId);
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
    form.setValue('year_manufacture', parseInt(val), { shouldValidate: true });
    
    if (selectedModelId) {
      const yearOpt = fipe.years.find((y) => y.value === val);
      if (yearOpt && fipe.modelDetail) {
        const yf = fipe.modelDetail.yearFuels.find(
          (item) => item.year === yearOpt.year || (item.isZeroKm && yearOpt.isZeroKm)
        );
        const fuelId = yf?.fuels?.[0]?.id;
        if (yf && fuelId) {
          const fetchedPriceData = await fipe.fetchFipePrice(selectedModelId, val, fuelId);
          if (fetchedPriceData && fetchedPriceData.price_cents) {
            const priceReais = fetchedPriceData.price_cents / 100;
            form.setValue('fipe_price', priceReais, { shouldValidate: true });
            if (!form.getValues('price') || form.getValues('price') === 0) {
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
        isEditing ? 'Motocicleta atualizada com sucesso!' : 'Motocicleta cadastrada com sucesso! Abrindo galeria de fotos...'
      );

      setTimeout(() => {
        if (!isEditing && result?.id) {
          router.push(`/admin/motos/${result.id}/editar?step=fotos`);
        } else {
          router.push('/admin/motos');
        }
        router.refresh();
      }, 1200);
    } catch (error: any) {
      console.error(error);
      setErrorMsg('Não foi possível salvar a motocicleta. Verifique os campos e tente novamente.');
      setLoading(false);
    }
  }

  async function onSubmit(data: MotorcycleFormValues) {
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

  const handleNextStep = async () => {
    let isValid = false;
    if (currentStep === 1) {
      isValid = await form.trigger(['brand', 'model', 'year_manufacture', 'year_model']);
    } else if (currentStep === 2) {
      isValid = await form.trigger(['price', 'status', 'operation_type', 'ownership_type']);
    } else if (currentStep === 3) {
      isValid = true;
    }

    if (isValid && currentStep < 4) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const watchedValues = form.watch();

  return (
    <div className="space-y-6 pb-28">
      {/* Alertas de Notificação */}
      {errorMsg && (
        <div className="bg-rose-500/10 text-rose-400 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 p-4 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {/* STEPPER WIZARD SUPERIOR (DESIGN MODERNO & MOBILE FIRST) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
        {/* Visual Mobile: Progresso compacto */}
        <div className="sm:hidden space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <span>Etapa {currentStep} de 4:</span>
              <span className="text-white font-semibold">{WIZARD_STEPS[currentStep - 1].label}</span>
            </span>
            <span className="text-slate-400 font-mono">{Math.round((currentStep / 4) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Visual Desktop: Stepper completo com ícones */}
        <div className="hidden sm:grid grid-cols-4 gap-2">
          {WIZARD_STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  // Permite clicar para navegar se for etapa anterior ou se estiver editando
                  if (step.id < currentStep || isEditing) {
                    setCurrentStep(step.id);
                  }
                }}
                disabled={step.id > currentStep && !isEditing}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left border ${
                  isCurrent
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)] cursor-default'
                    : isCompleted
                    ? 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 cursor-pointer'
                    : 'bg-slate-950/30 border-transparent text-slate-500 cursor-not-allowed opacity-60'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{step.label}</div>
                  <div className="text-[11px] text-slate-400 truncate">{step.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
          
          {/* ============================================================ */}
          {/* PASSO 1: DADOS DO VEÍCULO & FICHA TÉCNICA */}
          {/* ============================================================ */}
          {currentStep === 1 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <CarFront className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Ficha Técnica & Identificação</h2>
                    <p className="text-xs text-slate-400">
                      Pesquise a marca e modelo na FIPE oficial ou digite manualmente.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-400">
                  Passo 1/4
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* MARCA */}
                <FormField
                  control={form.control as any}
                  name="brand"
                  render={({ field }) => {
                    const selectedBrand = fipe.allBrands.find((b) => b.id === selectedBrandId);
                    const displayValue = selectedBrand?.name || field.value || '';

                    return (
                      <FormItem className="col-span-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <FormLabel className="text-slate-300 font-medium">
                            Marca <span className="text-rose-500">*</span>
                          </FormLabel>
                          {fipe.loadingBrands && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                              <Loader2 className="h-3 w-3 animate-spin" /> Carregando...
                            </span>
                          )}
                        </div>
                        <FormControl>
                          <div ref={brandComboboxRef} className="relative">
                            <div
                              onClick={() => {
                                if (!fipe.loadingBrands) setIsBrandOpen((p) => !p);
                              }}
                              className={`w-full min-h-[48px] flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm cursor-pointer transition-all bg-slate-950 ${
                                isBrandOpen
                                  ? 'border-amber-500 ring-2 ring-amber-500/20'
                                  : 'border-slate-800 hover:border-amber-500/50'
                              }`}
                            >
                              <span className={displayValue ? 'font-bold text-white' : 'text-slate-500'}>
                                {displayValue || 'Selecione a marca...'}
                              </span>
                              <ChevronsUpDown className="h-4 w-4 text-slate-400 shrink-0" />
                            </div>

                            {/* Dropdown de Busca de Marca */}
                            {isBrandOpen && (
                              <div className="absolute left-0 top-full mt-2 w-full z-50 rounded-xl border border-slate-800 bg-slate-900 p-2.5 shadow-2xl space-y-2">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                  <input
                                    autoFocus
                                    type="text"
                                    placeholder="Pesquisar marca..."
                                    value={brandSearchTerm}
                                    onChange={(e) => setBrandSearchTerm(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                                  />
                                  {brandSearchTerm && (
                                    <button
                                      type="button"
                                      onClick={() => setBrandSearchTerm('')}
                                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>

                                <div className="flex items-center justify-between px-1 text-[11px] text-slate-400 border-b border-slate-800 pb-1.5">
                                  <span>{filteredBrands.length} marcas</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOnlyPopularBrands((p) => !p);
                                    }}
                                    className="text-amber-400 hover:underline cursor-pointer font-medium"
                                  >
                                    {onlyPopularBrands ? 'Ver todas' : 'Filtrar principais'}
                                  </button>
                                </div>

                                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                                  {filteredBrands.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-slate-400 space-y-2">
                                      <p className="font-medium text-white">Nenhuma marca na lista.</p>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs h-8 border-slate-700 text-slate-200"
                                        onClick={() => {
                                          form.setValue('brand', brandSearchTerm, { shouldValidate: true });
                                          setSelectedBrandId('');
                                          setIsBrandOpen(false);
                                        }}
                                      >
                                        Usar &quot;{brandSearchTerm}&quot; manual
                                      </Button>
                                    </div>
                                  ) : (
                                    filteredBrands.map((b) => (
                                      <div
                                        key={b.id}
                                        onClick={() => handleBrandSelect(b.id, b.name)}
                                        className={`flex items-center justify-between min-h-[38px] px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                                          selectedBrandId === b.id
                                            ? 'bg-amber-500 text-slate-950 font-bold'
                                            : 'text-slate-200 hover:bg-amber-500/15 hover:text-amber-400'
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

                {/* MODELO */}
                <FormField
                  control={form.control as any}
                  name="model"
                  render={({ field }) => {
                    const selectedModel = fipe.allModels.find((m) => m.id === selectedModelId);
                    const displayValue = selectedModel?.name || field.value || '';

                    return (
                      <FormItem className="col-span-1">
                        <div className="flex items-center justify-between mb-1.5">
                          <FormLabel className="text-slate-300 font-medium">
                            Modelo <span className="text-rose-500">*</span>
                          </FormLabel>
                          {fipe.loadingModels && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                              <Loader2 className="h-3 w-3 animate-spin" /> Carregando...
                            </span>
                          )}
                        </div>
                        <FormControl>
                          <div ref={modelComboboxRef} className="relative">
                            <div
                              onClick={() => {
                                if (!fipe.loadingModels) setIsModelOpen((p) => !p);
                              }}
                              className={`w-full min-h-[48px] flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm cursor-pointer transition-all bg-slate-950 ${
                                isModelOpen
                                  ? 'border-amber-500 ring-2 ring-amber-500/20'
                                  : 'border-slate-800 hover:border-amber-500/50'
                              }`}
                            >
                              <span className={displayValue ? 'font-bold text-white' : 'text-slate-500'}>
                                {displayValue || 'Pesquisar ou selecionar modelo...'}
                              </span>
                              <ChevronsUpDown className="h-4 w-4 text-slate-400 shrink-0" />
                            </div>

                            {isModelOpen && (
                              <div className="absolute left-0 top-full mt-2 w-full z-50 rounded-xl border border-slate-800 bg-slate-900 p-2.5 shadow-2xl space-y-2">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                  <input
                                    autoFocus
                                    type="text"
                                    placeholder="Pesquisar modelo..."
                                    value={modelSearchTerm}
                                    onChange={(e) => setModelSearchTerm(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                                  />
                                  {modelSearchTerm && (
                                    <button
                                      type="button"
                                      onClick={() => setModelSearchTerm('')}
                                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  )}
                                </div>

                                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                                  {filteredModels.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-slate-400 space-y-2">
                                      <p className="font-medium text-white">Nenhum modelo na lista FIPE.</p>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs h-8 border-slate-700 text-slate-200"
                                        onClick={() => {
                                          form.setValue('model', modelSearchTerm, { shouldValidate: true });
                                          setSelectedModelId('');
                                          setIsModelOpen(false);
                                        }}
                                      >
                                        Usar &quot;{modelSearchTerm}&quot; manual
                                      </Button>
                                    </div>
                                  ) : (
                                    filteredModels.map((m) => (
                                      <div
                                        key={m.id}
                                        onClick={() => handleModelSelect(m.id, m.name)}
                                        className={`flex items-center justify-between min-h-[38px] px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                                          selectedModelId === m.id
                                            ? 'bg-amber-500 text-slate-950 font-bold'
                                            : 'text-slate-200 hover:bg-amber-500/15 hover:text-amber-400'
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

                {/* VERSÃO */}
                <FormField
                  control={form.control as any}
                  name="version"
                  render={({ field }) => (
                    <FormItem className="col-span-1 md:col-span-2">
                      <FormLabel className="text-slate-300 font-medium">Versão / Edição Especial (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: ABS, Rally, Special Edition, CBS"
                          {...field}
                          value={field.value || ''}
                          className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* ANO FABRICAÇÃO E ANO MODELO */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="year_manufacture"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 font-medium text-xs sm:text-sm">
                          Ano Fab. <span className="text-rose-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500 font-mono"
                          />
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
                        <FormLabel className="text-slate-300 font-medium text-xs sm:text-sm">
                          Ano Mod. <span className="text-rose-500">*</span>
                        </FormLabel>
                        <FormControl>
                          {selectedModelId && fipe.years.length > 0 ? (
                            <Select
                              value={String(field.value) || ''}
                              onValueChange={(val) => {
                                if (val) handleYearChange(val);
                              }}
                            >
                              <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500 font-mono">
                                <SelectValue placeholder="Ano FIPE..." />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                                {fipe.years.map((y) => (
                                  <SelectItem key={y.value} value={y.value} className="cursor-pointer">
                                    {y.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <Input
                              type="number"
                              {...field}
                              className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500 font-mono"
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* KM & PLACA */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="mileage"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 font-medium text-xs sm:text-sm">
                          Quilometragem
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="0 km"
                            {...fieldProps}
                            value={formatKM(value || 0)}
                            onChange={(e) => onChange(parseKM(e.target.value))}
                            className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl font-mono focus:border-amber-500"
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
                        <FormLabel className="text-slate-300 font-medium text-xs sm:text-sm">
                          Placa
                        </FormLabel>
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
                            className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl uppercase tracking-widest font-semibold focus:border-amber-500"
                            maxLength={8}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* RENAVAM & CHASSI */}
                <div className="grid grid-cols-1 md:grid-cols-2 col-span-1 md:col-span-2 gap-4 pt-2 border-t border-slate-800/80">
                  <FormField
                    control={form.control as any}
                    name="renavam"
                    render={({ field: { value, onChange, ...fieldProps } }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 text-xs font-medium flex items-center justify-between">
                          <span>Renavam</span>
                          <span className="text-[11px] text-slate-500 font-normal">11 dígitos</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="01234567890"
                            {...fieldProps}
                            value={value || ''}
                            onChange={(e) => onChange(formatRenavam(e.target.value))}
                            maxLength={11}
                            className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl font-mono focus:border-amber-500"
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
                        <FormLabel className="text-slate-300 text-xs font-medium flex items-center justify-between">
                          <span>Chassi (VIN)</span>
                          <span className="text-[11px] text-slate-500 font-normal">17 caracteres</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="9C2JC4100ER000001"
                            {...fieldProps}
                            value={value || ''}
                            onChange={(e) => onChange(formatChassi(e.target.value))}
                            maxLength={17}
                            className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl font-mono uppercase focus:border-amber-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* COR & CILINDRADA */}
                <div className="grid grid-cols-2 col-span-1 md:col-span-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 font-medium">Cor</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Preto, Vermelho Metálico"
                            {...field}
                            value={field.value || ''}
                            className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500"
                          />
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
                        <FormLabel className="text-slate-300 font-medium">Cilindrada (cc)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? 0}
                            className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl font-mono focus:border-amber-500"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* COMBUSTÍVEL & CÂMBIO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 col-span-1 md:col-span-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="fuel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 font-medium">Combustível</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'gasolina'}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500">
                              <SelectValue placeholder="Selecione o combustível..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                            {Object.entries(fuelLabels).map(([k, v]) => (
                              <SelectItem key={k} value={k} className="cursor-pointer">
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="transmission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 font-medium">Câmbio / Transmissão</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'manual'}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500">
                              <SelectValue placeholder="Selecione o câmbio..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                            {Object.entries(transmissionLabels).map(([k, v]) => (
                              <SelectItem key={k} value={k} className="cursor-pointer">
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Botão de Avanço do Passo 1 */}
              <div className="flex justify-end pt-4 border-t border-slate-800">
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-8 py-3 h-auto rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Avançar: Valores & Condições</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASSO 2: CONDIÇÃO COMERCIAL & VALORES */}
          {/* ============================================================ */}
          {currentStep === 2 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Valores & Condição Comercial</h2>
                    <p className="text-xs text-slate-400">
                      Defina o preço de venda, consulte a FIPE e configure a modalidade do anúncio.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-400">
                  Passo 2/4
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* PREÇO DE VENDA */}
                <FormField
                  control={form.control as any}
                  name="price"
                  render={({ field: { onChange, value, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 font-medium">
                        Preço de Venda <span className="text-rose-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...fieldProps}
                          value={value !== undefined && value !== null && value !== '' ? formatCurrency(value) : ''}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            onChange(val ? Number(val) / 100 : 0);
                          }}
                          className="bg-slate-950 border-slate-800 text-amber-400 font-bold text-xl h-14 rounded-xl focus:border-amber-500 font-mono"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* PREÇO FIPE */}
                <FormField
                  control={form.control as any}
                  name="fipe_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 font-medium">Preço Tabela FIPE Oficial</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            readOnly
                            value={field.value ? formatCurrency(field.value) : 'R$ 0,00'}
                            className="bg-slate-950/60 border-slate-800 text-slate-300 font-bold text-xl h-14 rounded-xl font-mono cursor-default"
                          />
                          {fipe.loadingPrice && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription className="text-[11px] text-slate-500">
                        Atualizado automaticamente ao selecionar a marca, modelo e ano na FIPE.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* TIPO DE OPERAÇÃO */}
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <FormLabel className="text-slate-300 font-medium">
                    Finalidade do Veículo <span className="text-rose-500">*</span>
                  </FormLabel>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <RadioPill
                      label="Venda"
                      value="SALE"
                      selected={watchedValues.operation_type === 'SALE'}
                      onClick={(v) => form.setValue('operation_type', v as any)}
                    />
                    <RadioPill
                      label="Aluguel"
                      value="RENTAL"
                      selected={watchedValues.operation_type === 'RENTAL'}
                      onClick={(v) => form.setValue('operation_type', v as any)}
                    />
                    <RadioPill
                      label="Venda & Aluguel (Ambos)"
                      value="SALE_AND_RENTAL"
                      selected={watchedValues.operation_type === 'SALE_AND_RENTAL'}
                      onClick={(v) => form.setValue('operation_type', v as any)}
                    />
                  </div>
                </div>

                {/* TIPO DE PROPRIEDADE */}
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <FormLabel className="text-slate-300 font-medium">
                    Tipo de Propriedade do Veículo <span className="text-rose-500">*</span>
                  </FormLabel>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <RadioPill
                      label="Estoque Próprio da Loja"
                      value="OWNED"
                      selected={watchedValues.ownership_type === 'OWNED'}
                      onClick={(v) => form.setValue('ownership_type', v as any)}
                    />
                    <RadioPill
                      label="Consignada (Veículo de Cliente)"
                      value="CONSIGNMENT"
                      selected={watchedValues.ownership_type === 'CONSIGNMENT'}
                      onClick={(v) => form.setValue('ownership_type', v as any)}
                    />
                  </div>
                </div>

                {/* STATUS DO ESTOQUE */}
                <FormField
                  control={form.control as any}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <FormLabel className="text-slate-300 font-medium">Status do Estoque</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500">
                            <SelectValue placeholder="Selecione o status..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                          {Object.entries(motorcycleStatusLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k} className="cursor-pointer">
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* DESTAQUE NA VITRINE */}
                <FormField
                  control={form.control as any}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="col-span-1 flex flex-row items-center justify-between rounded-xl border border-slate-800 bg-slate-950/80 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm font-bold text-white flex items-center gap-1.5 cursor-pointer">
                          <Sparkles className="w-4 h-4 text-amber-400" />
                          Destaque na Página Inicial
                        </FormLabel>
                        <FormDescription className="text-xs text-slate-400">
                          Exibir no carrossel de destaques do site público.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-amber-500"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Botões de Navegação do Passo 2 */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 h-11 px-5 rounded-xl cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  <span>Voltar</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-8 py-3 h-auto rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <span>Avançar: Descrição & Publicação</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASSO 3: DESCRIÇÃO & PUBLICAÇÃO */}
          {/* ============================================================ */}
          {currentStep === 3 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Descrição & Conteúdo do Anúncio</h2>
                    <p className="text-xs text-slate-400">
                      Gere o texto comercial persuasivo com IA ou escreva detalhes específicos.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-400">
                  Passo 3/4
                </span>
              </div>

              <div className="space-y-4">
                {/* Botão de IA para Gerar Descrição */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs text-slate-400">
                    Otimize seu anúncio para conversão e redes sociais:
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generateAiDescription}
                    className="border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 rounded-xl flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Gerar Descrição com IA</span>
                  </Button>
                </div>

                {/* TEXTAREA DESCRIÇÃO */}
                <FormField
                  control={form.control as any}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva a motocicleta, opcionais, estado de conservação, revisões, garantias e condições especiais de pagamento..."
                          {...field}
                          value={field.value || ''}
                          rows={8}
                          className="bg-slate-950 border-slate-800 text-slate-200 rounded-xl focus:border-amber-500 text-sm leading-relaxed p-4"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* LOCALIZAÇÃO */}
                <FormField
                  control={form.control as any}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 font-medium text-xs">
                        Cidade / Localização da Loja
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: São Paulo, SP"
                          {...field}
                          value={field.value || ''}
                          className="bg-slate-950 border-slate-800 text-slate-200 h-11 rounded-xl focus:border-amber-500 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Botões de Navegação do Passo 3 */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 h-11 px-5 rounded-xl cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  <span>Voltar</span>
                </Button>

                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-8 py-3 h-auto rounded-xl flex items-center gap-2 cursor-pointer"
                >
                  <span>Avançar: Fotos do Veículo</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* PASSO 4: GALERIA DE FOTOS & CONCLUSÃO */}
          {/* ============================================================ */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Card Resumo do Anúncio */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
                    <Bike className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-white">
                      {watchedValues.brand || 'Marca'} {watchedValues.model || 'Modelo'} {watchedValues.version || ''}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ano {watchedValues.year_manufacture}/{watchedValues.year_model} • {formatKm(watchedValues.mileage)} • Placa:{' '}
                      <strong className="text-slate-200">{watchedValues.license_plate || 'Sem placa'}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-right shrink-0">
                  <span className="text-[11px] text-slate-400 uppercase font-mono block">Preço de Venda</span>
                  <span className="text-xl font-black text-amber-400 font-mono">
                    {formatCurrency(watchedValues.price)}
                  </span>
                </div>
              </div>

              {/* Upload de Imagens */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Galeria de Fotos Oficiais</h2>
                      <p className="text-xs text-slate-400">
                        {isEditing
                          ? 'Envie fotos de alta qualidade e selecione a imagem de capa.'
                          : 'Conclua o cadastro para liberar o envio imediato das fotos.'}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-mono px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-400">
                    Passo 4/4
                  </span>
                </div>

                <ImageUploader
                  motorcycleId={initialData?.id}
                  images={images}
                  onImagesChange={setImages}
                />
              </div>

              {/* Botões de Ação Final */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between pt-2 border-t border-slate-800 gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="w-full sm:w-auto border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 h-12 px-6 rounded-xl cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  <span>Voltar para Descrição</span>
                </Button>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-9 py-3.5 h-auto rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Salvando Informações...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{isEditing ? 'Salvar Alterações da Moto' : 'Cadastrar Motocicleta no Estoque'}</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </form>
      </Form>

      {/* Modal de confirmação caso o status seja alterado para SOLD */}
      {showSaleModal && (
        <SaleConfirmationModal
          open={showSaleModal}
          onOpenChange={setShowSaleModal}
          onRegisterSale={handleRegisterSale}
          onSaveStatusOnly={handleSaveStatusOnly}
          motorcycleTitle={`${form.getValues('brand')} ${form.getValues('model')}`}
        />
      )}
    </div>
  );
}
