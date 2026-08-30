'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  createMotorcycleAction,
  updateMotorcycleAction,
  generateMotorcycleAiDescriptionAction,
} from '@/lib/actions/motorcycles';
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
import { MotorcycleDocumentOcr } from '@/components/admin/motorcycle-document-ocr';
import {
  MotorcycleOcrConflictModal,
  OcrFieldConflict,
} from '@/components/admin/motorcycle-ocr-conflict-modal';
import { MotorcycleOcrResult } from '@/lib/ocr/schemas';
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

import { formatRenavam, formatChassi, formatCurrency, formatKm } from '@/lib/utils/formatters';
import {
  MOTORCYCLE_STATUS_OPTIONS,
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

const POPULAR_BRANDS = new Set([
  'HONDA',
  'YAMAHA',
  'KAWASAKI',
  'SUZUKI',
  'BMW',
  'TRIUMPH',
  'DUCATI',
  'HARLEY-DAVIDSON',
  'ROYAL ENFIELD',
  'BAJAJ',
  'SHINERAY',
  'DAFRA',
]);

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

const currentYearVal = new Date().getFullYear();
const MANUFACTURE_YEAR_OPTIONS = Array.from(
  { length: currentYearVal + 2 - 1980 },
  (_, i) => currentYearVal + 1 - i
);

const motorcycleSchema = z
  .object({
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
      .max(new Date().getFullYear() + 2, 'Ano inválido'),
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
  })
  .refine((data) => data.year_model >= data.year_manufacture, {
    message: 'O ano do modelo deve ser igual ou maior que o ano de fabricação.',
    path: ['year_model'],
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

const AiFieldBadge = ({
  fieldName,
  isAiFilled,
  confidence,
}: {
  fieldName: string;
  isAiFilled?: boolean;
  confidence?: number;
}) => {
  if (!isAiFilled) return null;
  const isLowConfidence = confidence !== undefined && confidence < 0.75;

  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider transition-colors ${
        isLowConfidence
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
      }`}
      title={
        isLowConfidence
          ? 'Identificado pela IA com confiança moderada. Confira com atenção!'
          : 'Preenchido automaticamente pela leitura do documento.'
      }
    >
      <Sparkles className="w-2.5 h-2.5" />
      <span>{isLowConfidence ? 'IA • Conferir' : 'IA'}</span>
    </span>
  );
};

export function MotorcycleForm({ initialData }: MotorcycleFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStepParam = searchParams.get('step');
  const fromClientParam = searchParams.get('from_client');
  const proposalIdParam = searchParams.get('proposal_id');

  const [currentStep, setCurrentStep] = useState<number>(initialStepParam === 'fotos' ? 4 : 1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [images, setImages] = useState<MotorcycleImage[]>(initialData?.images || []);

  // Estados de OCR Inteligente
  const [ocrFilledFields, setOcrFilledFields] = useState<Record<string, boolean>>({});
  const [ocrConfidenceMap, setOcrConfidenceMap] = useState<Record<string, number>>({});
  const [ocrWarnings, setOcrWarnings] = useState<string[]>([]);
  const [pendingOcrResult, setPendingOcrResult] = useState<MotorcycleOcrResult | null>(null);
  const [ocrConflicts, setOcrConflicts] = useState<OcrFieldConflict[]>([]);
  const [showOcrConflictModal, setShowOcrConflictModal] = useState(false);

  const isEditing = !!initialData?.id;

  const form = useForm<MotorcycleFormValues>({
    resolver: zodResolver(motorcycleSchema) as any,
    defaultValues: {
      brand: initialData?.brand || searchParams.get('brand') || '',
      model: initialData?.model || searchParams.get('model') || '',
      version: initialData?.version || searchParams.get('version') || '',
      year_manufacture:
        initialData?.year_manufacture ||
        (searchParams.get('year_manufacture')
          ? Number(searchParams.get('year_manufacture'))
          : new Date().getFullYear()),
      year_model:
        initialData?.year_model ||
        (searchParams.get('year_model')
          ? Number(searchParams.get('year_model'))
          : new Date().getFullYear()),
      mileage:
        initialData?.mileage ||
        (searchParams.get('mileage') ? Number(searchParams.get('mileage')) : 0),
      engine_capacity: initialData?.engine_capacity || 0,
      fuel: normalizeFuel(initialData?.fuel),
      transmission: normalizeTransmission(initialData?.transmission),
      color: initialData?.color || searchParams.get('color') || '',
      price:
        initialData?.price ||
        (searchParams.get('price') ? Number(searchParams.get('price')) : 0),
      fipe_price:
        initialData?.fipe_price ||
        (searchParams.get('fipe_price') ? Number(searchParams.get('fipe_price')) : null),
      description: initialData?.description || '',
      ownership_type: normalizeOwnership(
        initialData?.ownership_type || searchParams.get('ownership_type'),
      ),
      operation_type: normalizeOperation(initialData?.operation_type),
      status: initialData?.status || 'AVAILABLE',
      featured: initialData?.featured || false,
      license_plate: initialData?.license_plate || searchParams.get('license_plate') || '',
      renavam: initialData?.renavam || '',
      chassi: initialData?.chassi || '',
    },
  });

  // Pre-load images from query param if available (from a converted proposal)
  useEffect(() => {
    if (isEditing) return;
    const imagesParam = searchParams.get('images');
    if (imagesParam && images.length === 0) {
      try {
        let parsedUrls: string[] = [];
        if (imagesParam.startsWith('[')) {
          parsedUrls = JSON.parse(imagesParam);
        } else {
          parsedUrls = imagesParam
            .split(',')
            .map((u) => u.trim())
            .filter(Boolean);
        }
        if (Array.isArray(parsedUrls) && parsedUrls.length > 0) {
          const preloadedImages: MotorcycleImage[] = parsedUrls.map((url, idx) => ({
            id: `proposal-img-${idx}-${Date.now()}`,
            motorcycle_id: '',
            storage_path: url,
            public_url: url,
            display_url: url,
            thumbnail_url: url,
            url: url,
            is_primary: idx === 0,
            sort_order: idx,
            alt_text: `Foto ${idx + 1}`,
            created_at: new Date().toISOString(),
          }));
          setImages(preloadedImages);
        }

      } catch (err) {
        console.warn('Falha ao processar imagens pré-carregadas da proposta:', err);
      }
    }
  }, [searchParams, isEditing, images.length]);


  const applyOcrValues = (result: MotorcycleOcrResult, overwriteAll: boolean) => {
    const current = form.getValues();
    const newFilledFields: Record<string, boolean> = { ...ocrFilledFields };

    const setField = (fieldKey: keyof MotorcycleFormValues, val: any) => {
      if (val === null || val === undefined || val === '') return;
      const currentVal = current[fieldKey];
      const isCurrentlyEmpty =
        currentVal === null ||
        currentVal === undefined ||
        currentVal === '' ||
        (typeof currentVal === 'number' &&
          (currentVal === 0 || currentVal === new Date().getFullYear()));

      if (overwriteAll || isCurrentlyEmpty) {
        form.setValue(fieldKey as any, val, { shouldDirty: true, shouldValidate: true });
        newFilledFields[fieldKey] = true;
      }
    };

    if (result.brand) {
      setField('brand', result.brand);
      const matchingBrand = fipe.allBrands.find(
        (b) => b.name.toLowerCase() === result.brand?.toLowerCase(),
      );
      if (matchingBrand) {
        setSelectedBrandId(matchingBrand.id);
        if (fipeMotoTypeId) {
          fipe.fetchModelsForBrand(matchingBrand.id, fipeMotoTypeId);
        }
      }
    }
    if (result.model) setField('model', result.model);
    if (result.version) setField('version', result.version);
    if (result.yearManufacture) setField('year_manufacture', result.yearManufacture);
    if (result.yearModel) setField('year_model', result.yearModel);
    if (result.licensePlate) setField('license_plate', result.licensePlate);
    if (result.renavam) setField('renavam', result.renavam);
    if (result.chassi) setField('chassi', result.chassi);
    if (result.color) setField('color', result.color);
    if (result.fuel) setField('fuel', result.fuel);
    if (result.engineCapacity) setField('engine_capacity', result.engineCapacity);

    setOcrFilledFields(newFilledFields);
    if (result.confidence) setOcrConfidenceMap(result.confidence);
    if (result.warnings) setOcrWarnings(result.warnings);
  };

  const handleOcrSuccess = (result: MotorcycleOcrResult) => {
    const current = form.getValues();
    const conflicts: OcrFieldConflict[] = [];

    const checkConflict = (fieldKey: string, fieldLabel: string, currentVal: any, newVal: any) => {
      if (
        newVal !== null &&
        newVal !== undefined &&
        newVal !== '' &&
        currentVal !== null &&
        currentVal !== undefined &&
        currentVal !== '' &&
        String(currentVal).trim().toLowerCase() !== String(newVal).trim().toLowerCase()
      ) {
        conflicts.push({
          fieldKey,
          fieldLabel,
          currentValue: currentVal,
          newValue: newVal,
        });
      }
    };

    checkConflict('brand', 'Marca', current.brand, result.brand);
    checkConflict('model', 'Modelo', current.model, result.model);
    checkConflict('version', 'Versão', current.version, result.version);
    checkConflict(
      'year_manufacture',
      'Ano de Fabricação',
      current.year_manufacture,
      result.yearManufacture,
    );
    checkConflict('year_model', 'Ano do Modelo', current.year_model, result.yearModel);
    checkConflict('license_plate', 'Placa', current.license_plate, result.licensePlate);
    checkConflict('renavam', 'RENAVAM', current.renavam, result.renavam);
    checkConflict('chassi', 'Chassi', current.chassi, result.chassi);
    checkConflict('color', 'Cor', current.color, result.color);
    checkConflict('fuel', 'Combustível', current.fuel, result.fuel);
    checkConflict('engine_capacity', 'Cilindrada', current.engine_capacity, result.engineCapacity);

    if (conflicts.length > 0) {
      setPendingOcrResult(result);
      setOcrConflicts(conflicts);
      setShowOcrConflictModal(true);
    } else {
      applyOcrValues(result, true);
    }
  };

  const handleConfirmOcrOverwrite = () => {
    if (pendingOcrResult) {
      applyOcrValues(pendingOcrResult, true);
    }
    setShowOcrConflictModal(false);
    setPendingOcrResult(null);
    setOcrConflicts([]);
  };

  const handleKeepManualOcr = () => {
    if (pendingOcrResult) {
      applyOcrValues(pendingOcrResult, false);
    }
    setShowOcrConflictModal(false);
    setPendingOcrResult(null);
    setOcrConflicts([]);
  };

  const handleCancelOcrConflicts = () => {
    setShowOcrConflictModal(false);
    setPendingOcrResult(null);
    setOcrConflicts([]);
  };

  const [isGeneratingAiDesc, setIsGeneratingAiDesc] = useState(false);

  const generateAiDescription = async () => {
    const values = form.getValues();
    if (!values.brand || !values.model) {
      toast.error('Preencha ao menos a marca e o modelo da moto para gerar a descrição com IA.');
      return;
    }

    setIsGeneratingAiDesc(true);
    try {
      const res = await generateMotorcycleAiDescriptionAction(values);
      if (res?.success && res.description) {
        form.setValue('description', res.description, { shouldValidate: true, shouldDirty: true });
        if (res.isFallback) {
          toast.info('Descrição comercial gerada com sucesso baseada nos dados da moto.');
        } else {
          toast.success('Descrição comercial persuasiva gerada com IA (Gemini)!');
        }
      } else {
        toast.error('Não foi possível gerar a descrição no momento.');
      }
    } catch (err) {
      console.error('Erro ao gerar descrição com IA:', err);
      toast.error('Ocorreu um erro ao conectar com o serviço de IA.');
    } finally {
      setIsGeneratingAiDesc(false);
    }
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
        const cached = fipexCache.get<{
          vehicleTypes: { id: string; slug: string; name: string }[];
        }>('prelude');
        let motoTypeId = '';
        if (cached) {
          const motoType = cached.vehicleTypes.find(
            (t) => t.slug === 'motocicletas' || t.name.toLowerCase().includes('moto'),
          );
          if (motoType) motoTypeId = motoType.id;
        } else {
          const raw = await fipexFetch<RawApiResponse<RawPreludeData>>('/v1/prelude');
          const mapped = mapPrelude(raw.data);
          fipexCache.set('prelude', mapped, FIPEX_CACHE_TTL.PRELUDE);
          const motoType = mapped.vehicleTypes.find(
            (t) => t.slug === 'motocicletas' || t.name.toLowerCase().includes('moto'),
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
    return () => {
      isMounted = false;
    };
  }, [fipe.fetchBrandsForType]);

  const filteredBrands = fipe.allBrands.filter((b) => {
    if (onlyPopularBrands && !POPULAR_BRANDS.has(b.name.toUpperCase())) return false;
    return b.name.toLowerCase().includes(brandSearchTerm.toLowerCase());
  });

  const filteredModels = fipe.allModels.filter((m) =>
    m.name.toLowerCase().includes(modelSearchTerm.toLowerCase()),
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
          (item) => item.year === yearOpt.year || (item.isZeroKm && yearOpt.isZeroKm),
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
        isEditing
          ? 'Motocicleta atualizada com sucesso!'
          : 'Motocicleta cadastrada com sucesso! Abrindo galeria de fotos...',
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

      {/* Banner de Dados Importados da Proposta Comercial */}
      {!isEditing && (fromClientParam || proposalIdParam) && (
        <div className="bg-gradient-to-r from-amber-500/15 via-zinc-900 to-zinc-950 border border-amber-500/35 rounded-2xl p-4 flex items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-amber-400 text-sm block">
                Dados importados da proposta de {fromClientParam || 'Venda'}
              </span>
              <span className="text-zinc-400 text-xs">
                Marca, modelo, anos, cor, quilometragem e fotos foram preenchidos automaticamente. Revise os campos e complete os dados para salvar no estoque.
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 text-[10px] uppercase tracking-wider shrink-0 hidden sm:inline-block">
            Importado da Proposta
          </span>
        </div>
      )}


      {/* STEPPER WIZARD SUPERIOR (DESIGN MODERNO & MOBILE FIRST) */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xl">
        {/* Visual Mobile: Progresso compacto */}
        <div className="sm:hidden space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <span>Etapa {currentStep} de 4:</span>
              <span className="text-white font-semibold">
                {WIZARD_STEPS[currentStep - 1].label}
              </span>
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
                      Tire foto do documento para preenchimento com IA ou pesquise na FIPE oficial.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-400">
                  Passo 1/4
                </span>
              </div>

              {/* Componente de Leitura Inteligente por Documento com Google Gemini */}
              <MotorcycleDocumentOcr onOcrSuccess={handleOcrSuccess} disabled={loading} />

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
                          <FormLabel className="text-slate-300 font-medium flex items-center gap-2">
                            <span>
                              Marca <span className="text-rose-500">*</span>
                            </span>
                            <AiFieldBadge
                              fieldName="brand"
                              isAiFilled={ocrFilledFields['brand']}
                              confidence={ocrConfidenceMap['brand']}
                            />
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
                              <span
                                className={displayValue ? 'font-bold text-white' : 'text-slate-500'}
                              >
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
                                      <p className="font-medium text-white">
                                        Nenhuma marca na lista.
                                      </p>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs h-8 border-slate-700 text-slate-200"
                                        onClick={() => {
                                          form.setValue('brand', brandSearchTerm, {
                                            shouldValidate: true,
                                          });
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
                                        {selectedBrandId === b.id && (
                                          <Check className="h-3.5 w-3.5" />
                                        )}
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
                          <FormLabel className="text-slate-300 font-medium flex items-center gap-2">
                            <span>
                              Modelo <span className="text-rose-500">*</span>
                            </span>
                            <AiFieldBadge
                              fieldName="model"
                              isAiFilled={ocrFilledFields['model']}
                              confidence={ocrConfidenceMap['model']}
                            />
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
                              <span
                                className={displayValue ? 'font-bold text-white' : 'text-slate-500'}
                              >
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
                                      <p className="font-medium text-white">
                                        Nenhum modelo na lista FIPE.
                                      </p>
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs h-8 border-slate-700 text-slate-200"
                                        onClick={() => {
                                          form.setValue('model', modelSearchTerm, {
                                            shouldValidate: true,
                                          });
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
                                        {selectedModelId === m.id && (
                                          <Check className="h-3.5 w-3.5" />
                                        )}
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
                      <FormLabel className="text-slate-300 font-medium flex items-center gap-2">
                        <span>Versão / Edição Especial (Opcional)</span>
                        <AiFieldBadge
                          fieldName="version"
                          isAiFilled={ocrFilledFields['version']}
                          confidence={ocrConfidenceMap['version']}
                        />
                      </FormLabel>
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
                        <FormLabel className="text-slate-300 font-medium text-xs sm:text-sm flex items-center gap-2">
                          <span>
                            Ano Fab. <span className="text-rose-500">*</span>
                          </span>
                          <AiFieldBadge
                            fieldName="year_manufacture"
                            isAiFilled={ocrFilledFields['year_manufacture']}
                            confidence={ocrConfidenceMap['yearManufacture']}
                          />
                        </FormLabel>
                        <FormControl>
                          <Select
                            value={field.value ? String(field.value) : ''}
                            onValueChange={(val: string | null) => {
                              if (!val) return;
                              const yearNum = parseInt(val, 10);
                              field.onChange(yearNum);

                              // Regra: O ano do modelo tem que ser igual ou maior que o de fabricação
                              const currentYearModel = form.getValues('year_model');
                              if (!currentYearModel || currentYearModel < yearNum) {
                                form.setValue('year_model', yearNum, { shouldValidate: true });
                              }
                            }}
                          >
                            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500 font-mono">
                              <SelectValue placeholder="Ano Fab..." />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 max-h-60">
                              {MANUFACTURE_YEAR_OPTIONS.map((y) => (
                                <SelectItem key={y} value={String(y)} className="cursor-pointer font-mono">
                                  {y}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="year_model"
                    render={({ field }) => {
                      const selectedFab = form.watch('year_manufacture') || currentYearVal;

                      // Se estiver usando FIPE, filtra opções para que ano do modelo >= ano de fabricação
                      const filteredFipeYears = fipe.years.filter((y) => {
                        const parsedYear = parseInt(y.label || y.value, 10);
                        if (isNaN(parsedYear)) return true;
                        return parsedYear >= selectedFab;
                      });

                      // Se não estiver usando FIPE, cria lista a partir de selectedFab
                      const maxModelYear = Math.max(currentYearVal + 2, selectedFab + 2);
                      const modelYearOptions = Array.from(
                        { length: maxModelYear - selectedFab + 1 },
                        (_, i) => selectedFab + i
                      );

                      return (
                        <FormItem>
                          <FormLabel className="text-slate-300 font-medium text-xs sm:text-sm flex items-center gap-2">
                            <span>
                              Ano Mod. <span className="text-rose-500">*</span>
                            </span>
                            <AiFieldBadge
                              fieldName="year_model"
                              isAiFilled={ocrFilledFields['year_model']}
                              confidence={ocrConfidenceMap['yearModel']}
                            />
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
                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 max-h-60">
                                  {filteredFipeYears.map((y) => (
                                    <SelectItem
                                      key={y.value}
                                      value={y.value}
                                      className="cursor-pointer font-mono"
                                    >
                                      {y.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Select
                                value={field.value ? String(field.value) : ''}
                                onValueChange={(val: string | null) => {
                                  if (!val) return;
                                  field.onChange(parseInt(val, 10));
                                }}
                              >
                                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500 font-mono">
                                  <SelectValue placeholder="Ano Mod..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 max-h-60">
                                  {modelYearOptions.map((y) => (
                                    <SelectItem
                                      key={y}
                                      value={String(y)}
                                      className="cursor-pointer font-mono"
                                    >
                                      {y}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
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
                        <FormLabel className="text-slate-300 font-medium text-xs sm:text-sm flex items-center gap-2">
                          <span>Placa</span>
                          <AiFieldBadge
                            fieldName="license_plate"
                            isAiFilled={ocrFilledFields['license_plate']}
                            confidence={ocrConfidenceMap['licensePlate']}
                          />
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ABC-1234"
                            {...fieldProps}
                            value={value || ''}
                            onChange={(e) => {
                              const v = e.target.value
                                .toUpperCase()
                                .replace(/[^A-Z0-9]/g, '')
                                .slice(0, 7);
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
                          <span className="flex items-center gap-2">
                            <span>Renavam</span>
                            <AiFieldBadge
                              fieldName="renavam"
                              isAiFilled={ocrFilledFields['renavam']}
                              confidence={ocrConfidenceMap['renavam']}
                            />
                          </span>
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
                          <span className="flex items-center gap-2">
                            <span>Chassi (VIN)</span>
                            <AiFieldBadge
                              fieldName="chassi"
                              isAiFilled={ocrFilledFields['chassi']}
                              confidence={ocrConfidenceMap['chassi']}
                            />
                          </span>
                          <span className="text-[11px] text-slate-500 font-normal">
                            17 caracteres
                          </span>
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
                    render={({ field }) => {
                      const isKnownColor =
                        field.value &&
                        MOTORCYCLE_COLORS.includes(field.value) &&
                        field.value !== 'Outra';
                      const isOtherSelected =
                        field.value === 'Outra' || (field.value && !isKnownColor);

                      return (
                        <FormItem>
                          <FormLabel className="text-slate-300 font-medium flex items-center gap-2">
                            <span>Cor</span>
                            <AiFieldBadge
                              fieldName="color"
                              isAiFilled={ocrFilledFields['color']}
                              confidence={ocrConfidenceMap['color']}
                            />
                          </FormLabel>
                          <div className="space-y-2">
                            <Select
                              value={
                                isKnownColor
                                  ? field.value
                                  : isOtherSelected
                                    ? 'Outra'
                                    : ''
                              }
                              onValueChange={(val) => {
                                if (val === 'Outra') {
                                  field.onChange('Outra');
                                } else {
                                  field.onChange(val);
                                }
                              }}
                            >
                              <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500">
                                <SelectValue placeholder="Selecione a cor..." />
                              </SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 max-h-60">
                                {MOTORCYCLE_COLORS.map((c) => (
                                  <SelectItem key={c} value={c} className="cursor-pointer">
                                    {c}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {isOtherSelected && (
                              <Input
                                placeholder="Digite a cor personalizada..."
                                value={field.value === 'Outra' ? '' : field.value || ''}
                                onChange={(e) => field.onChange(e.target.value || 'Outra')}
                                className="bg-slate-950 border-slate-800 text-slate-200 h-11 rounded-xl focus:border-amber-500 text-sm mt-1.5"
                              />
                            )}
                          </div>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control as any}
                    name="engine_capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-300 font-medium flex items-center gap-2">
                          <span>Cilindrada (cc)</span>
                          <AiFieldBadge
                            fieldName="engine_capacity"
                            isAiFilled={ocrFilledFields['engine_capacity']}
                            confidence={ocrConfidenceMap['engineCapacity']}
                          />
                        </FormLabel>
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
                        <FormLabel className="text-slate-300 font-medium flex items-center gap-2">
                          <span>Combustível</span>
                          <AiFieldBadge
                            fieldName="fuel"
                            isAiFilled={ocrFilledFields['fuel']}
                            confidence={ocrConfidenceMap['fuel']}
                          />
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'gasolina'}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500">
                              <SelectValue placeholder="Selecione o combustível...">
                                {fuelLabels[field.value] || field.value}
                              </SelectValue>
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
                        <FormLabel className="text-slate-300 font-medium">
                          Câmbio / Transmissão
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || 'manual'}>
                          <FormControl>
                            <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500">
                              <SelectValue placeholder="Selecione o câmbio...">
                                {transmissionLabels[field.value] || field.value}
                              </SelectValue>
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
                          value={
                            value !== undefined && value !== null && value !== ''
                              ? formatCurrency(value)
                              : ''
                          }
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
                      <FormLabel className="text-slate-300 font-medium">
                        Preço Tabela FIPE Oficial
                      </FormLabel>
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
                      label="Veículo de Cliente"
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
                      <FormLabel className="text-slate-300 font-medium">
                        Status do Estoque
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500">
                            <SelectValue placeholder="Selecione o status...">
                              {motorcycleStatusLabels[field.value] ||
                                motorcycleStatusLabels[field.value?.toUpperCase()] ||
                                field.value}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                          {Object.entries(MOTORCYCLE_STATUS_OPTIONS).map(([k, v]) => (
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
                    <h2 className="text-lg font-bold text-white">
                      Descrição & Conteúdo do Anúncio
                    </h2>
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
                    disabled={isGeneratingAiDesc}
                    onClick={generateAiDescription}
                    className="border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 rounded-xl flex items-center gap-1.5 text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {isGeneratingAiDesc ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                        <span>Gerando com IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Gerar Descrição com IA</span>
                      </>
                    )}
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
                      {watchedValues.brand || 'Marca'} {watchedValues.model || 'Modelo'}{' '}
                      {watchedValues.version || ''}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Ano {watchedValues.year_manufacture}/{watchedValues.year_model} •{' '}
                      {formatKm(watchedValues.mileage)} • Placa:{' '}
                      <strong className="text-slate-200">
                        {watchedValues.license_plate || 'Sem placa'}
                      </strong>
                    </p>
                  </div>
                </div>

                <div className="text-center sm:text-right shrink-0">
                  <span className="text-[11px] text-slate-400 uppercase font-mono block">
                    Preço de Venda
                  </span>
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
                      <span>
                        {isEditing
                          ? 'Salvar Alterações da Moto'
                          : 'Cadastrar Motocicleta no Estoque'}
                      </span>
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

      {/* Modal de confirmação para conflitos de preenchimento do OCR */}
      <MotorcycleOcrConflictModal
        isOpen={showOcrConflictModal}
        conflicts={ocrConflicts}
        onConfirmOverwrite={handleConfirmOcrOverwrite}
        onKeepManual={handleKeepManualOcr}
        onCancel={handleCancelOcrConflicts}
      />
    </div>
  );
}
