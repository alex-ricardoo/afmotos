'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Bike,
  Tag,
  KeyRound,
  Calendar,
  MessageSquare,
  Sparkles,
  Upload,
  Trash2,
  Loader2,
  CheckCircle2,
  Image as ImageIcon,
  User,
  Phone,
  Mail,
  MapPin,
  CircleDollarSign,
  FileText,
  ArrowRight,
  ArrowLeft,
  Search,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { compressImage } from '@/lib/utils/image-compression';
import {
  createManualProposalAction,
  uploadPublicSellRequestImageAction,
} from '@/lib/actions/leads';
import { ProposalType, ProposalStatus } from '@/lib/admin/proposal-labels';
import { FipeBrandCombobox } from '@/components/forms/fipe-brand-combobox';
import { FipeModelCombobox } from '@/components/forms/fipe-model-combobox';
import { FipeModelDetail, RawApiResponse, RawExpandedPriceData } from '@/lib/fipex/types';
import { fipexFetch } from '@/lib/fipex/client';

interface ManualProposalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  siteName?: string;
}

interface UploadedImageItem {
  id: string;
  url: string;
  provider?: string;
  storage_path?: string | null;
  delete_url?: string | null;
  altText?: string;
  isPrimary?: boolean;
}

const TYPE_OPTIONS: Array<{
  value: ProposalType;
  label: string;
  description: string;
  icon: React.ElementType;
  colorClass: string;
}> = [
  {
    value: 'SELL_MOTORCYCLE',
    label: 'Venda de Moto',
    description: 'Cliente quer vender para a loja',
    icon: Tag,
    colorClass: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
  },
  {
    value: 'CONSIGNMENT',
    label: 'Anunciar / Consignação',
    description: 'Cliente quer anunciar a moto',
    icon: KeyRound,
    colorClass: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
  },
  {
    value: 'MOTORCYCLE_INTEREST',
    label: 'Interesse em Compra',
    description: 'Cliente interessado no estoque',
    icon: Bike,
    colorClass: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
  },
  {
    value: 'RENTAL',
    label: 'Aluguel de Moto',
    description: 'Interesse no plano de locação',
    icon: Calendar,
    colorClass: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
  },
  {
    value: 'MOTORCYCLE_REQUEST',
    label: 'Pedido de Moto',
    description: 'Procura um modelo específico',
    icon: Sparkles,
    colorClass: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
  },
  {
    value: 'GENERAL_CONTACT',
    label: 'Contato Geral',
    description: 'Dúvidas e outros assuntos',
    icon: MessageSquare,
    colorClass: 'text-zinc-300 border-zinc-700 bg-zinc-800/40',
  },
];

const STATUS_OPTIONS: Array<{ value: ProposalStatus; label: string }> = [
  { value: 'NEW', label: 'Novo Lead' },
  { value: 'CONTACTED', label: 'Em Atendimento' },
  { value: 'QUALIFIED', label: 'Qualificado / Negociando' },
  { value: 'CONVERTED', label: 'Convertido / Ganho' },
  { value: 'CLOSED', label: 'Encerrado' },
];

const COMMON_COLORS = [
  'Preta',
  'Vermelha',
  'Azul',
  'Branca',
  'Cinza',
  'Prata',
  'Amarela',
  'Verde',
  'Laranja',
  'Dourada',
  'Outra',
];

const currentYearVal = new Date().getFullYear();

export function ManualProposalModal({
  open,
  onOpenChange,
  onSuccess,
  siteName = 'AF Motos',
}: ManualProposalModalProps) {
  // Step navigation state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState<string | null>(null);
  const [isLookingUpCep, setIsLookingUpCep] = useState(false);
  const [isFetchingFipe, setIsFetchingFipe] = useState(false);

  // Step 1: Type & Status
  const [type, setType] = useState<ProposalType>('SELL_MOTORCYCLE');
  const [status, setStatus] = useState<ProposalStatus>('NEW');

  // Step 2: Client & Full Address
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressNeighborhood, setAddressNeighborhood] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('PE');

  // Step 3: Motorcycle & FIPE Details
  const [brand, setBrand] = useState('');
  const [brandId, setBrandId] = useState<string | null>(null);
  const [model, setModel] = useState('');
  const [modelId, setModelId] = useState<string | null>(null);
  const [version, setVersion] = useState('');
  const [yearManufacture, setYearManufacture] = useState(String(currentYearVal));
  const [yearModel, setYearModel] = useState(String(currentYearVal));
  const [yearId, setYearId] = useState<string | null>(null);
  const [fuelId, setFipeFuelId] = useState<string | null>(null);
  const [fuelName, setFipeFuelName] = useState<string | null>(null);
  const [availableYears, setAvailableYears] = useState<
    Array<{ year: number | null; isZeroKm: boolean; yearId: string; fuelId?: string; fuelName?: string }>
  >([]);
  const [color, setColor] = useState('');
  const [customColor, setCustomColor] = useState('');
  const [mileage, setMileage] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [desiredPrice, setDesiredPrice] = useState('');
  const [fipePrice, setFipePrice] = useState('');
  const [fipeCode, setFipeCode] = useState('');
  const [fipeReferencePeriod, setFipeReferencePeriod] = useState('');
  const [fipeSnapshot, setFipeSnapshot] = useState<Record<string, unknown> | null>(null);

  // Rental State
  const [rentalDesiredPlan, setRentalDesiredPlan] = useState('');
  const [rentalExpectedStartDate, setRentalExpectedStartDate] = useState('');
  const [rentalHasCnhA, setRentalHasCnhA] = useState('Sim');
  const [rentalAge, setRentalAge] = useState('');

  // Step 4: Photos & Notes
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<UploadedImageItem[]>([]);

  // Formatters
  const formatPhoneInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneInput(e.target.value));
  };

  const formatCepInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 8);
    return digits.replace(/^(\d{5})(\d)/, '$1-$2');
  };

  // ViaCEP Automatic Address Lookup
  const handleCepLookup = async (value: string) => {
    const cepClean = value.replace(/\D/g, '');
    if (cepClean.length !== 8) return;

    setIsLookingUpCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepClean}/json/`);
      const data = await response.json();
      if (!response.ok || data.erro) {
        toast.error('CEP não encontrado. Preencha os campos manualmente.');
        return;
      }

      setAddressStreet(data.logradouro || '');
      setAddressNeighborhood(data.bairro || '');
      setCity(data.localidade || '');
      setState(data.uf || 'PE');
      toast.success('Endereço preenchido automaticamente pelo CEP!');
    } catch {
      toast.error('Não foi possível buscar o CEP automaticamente.');
    } finally {
      setIsLookingUpCep(false);
    }
  };

  // FIPE Brand Selection
  const handleBrandSelect = (bName: string, bId?: string | null) => {
    setBrand(bName);
    setBrandId(bId || null);
    setModel('');
    setModelId(null);
    setAvailableYears([]);
    setFipePrice('');
    setFipeCode('');
    setFipeReferencePeriod('');
    setFipeSnapshot(null);
  };

  // FIPE Model Selection
  const handleModelSelect = (
    mName: string,
    mId?: string | null,
    detail?: FipeModelDetail | null,
  ) => {
    setModel(mName);
    setModelId(mId || null);

    if (detail && detail.yearFuels && detail.yearFuels.length > 0) {
      const mapped = detail.yearFuels.map((yf) => ({
        year: yf.year ?? null,
        isZeroKm: Boolean(yf.isZeroKm),
        yearId: yf.isZeroKm ? 'zero' : String(yf.year ?? currentYearVal),
        fuelId: yf.fuels?.[0]?.id,
        fuelName: yf.fuels?.[0]?.name,
      }));
      setAvailableYears(mapped);

      const latest = mapped[0];
      const tYear = latest.isZeroKm ? currentYearVal : (latest.year ?? currentYearVal);
      setYearManufacture(String(tYear));
      setYearModel(String(tYear));
      setYearId(latest.yearId);
      setFipeFuelId(latest.fuelId || null);
      setFipeFuelName(latest.fuelName || null);

      if (mId) {
        fetchFipePrice(mId, latest.yearId, latest.fuelId);
      }
    } else {
      setAvailableYears([]);
    }
  };

  // FIPE Price Fetch
  const fetchFipePrice = async (mId: string, yParam: string, fId?: string | null) => {
    try {
      setIsFetchingFipe(true);
      const raw = await fipexFetch<RawApiResponse<RawExpandedPriceData>>('/v1/prices/expanded', {
        model_id: mId,
        year: yParam,
        fuel_id: fId || undefined,
      });

      if (raw?.data?.price) {
        const p = raw.data.price;
        const ref = p.reference ? `${p.reference.month_name} de ${p.reference.year}` : null;
        const priceReais = p.price_cents ? Number((p.price_cents / 100).toFixed(2)) : null;

        if (priceReais != null) {
          setFipePrice(
            new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
              priceReais,
            ),
          );
        }
        setFipeCode(p.fipe_code || '');
        setFipeReferencePeriod(ref || '');
        setFipeSnapshot({
          fipe_code: p.fipe_code || null,
          formatted_price: p.formatted_price || null,
          price_cents: p.price_cents || null,
          price_reais: priceReais,
          model_year: p.model_year ?? null,
          brand: p.make?.name || brand,
          model: p.model?.name || model,
          fuel: p.fuel?.name || fuelName || null,
          reference_period: ref,
          queried_at: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.warn('Aviso: Falha ao carregar preço da FIPE:', err);
    } finally {
      setIsFetchingFipe(false);
    }
  };

  // Year Selection in FIPE
  const handleYearChange = (targetYearId: string) => {
    setYearId(targetYearId);
    const match = availableYears.find((y) => y.yearId === targetYearId);
    if (match) {
      const yVal = match.isZeroKm ? currentYearVal : (match.year ?? currentYearVal);
      setYearModel(String(yVal));
      setYearManufacture(String(yVal));
      setFipeFuelId(match.fuelId || null);
      setFipeFuelName(match.fuelName || null);

      if (modelId) {
        fetchFipePrice(modelId, targetYearId, match.fuelId);
      }
    } else {
      setYearModel(targetYearId);
      setYearManufacture(targetYearId);
      if (modelId) {
        fetchFipePrice(modelId, targetYearId);
      }
    }
  };

  // Image Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImages(true);
    const filesArray = Array.from(files);
    const newUploaded: UploadedImageItem[] = [];

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      setUploadProgressText(`Otimizando foto ${i + 1} de ${filesArray.length}...`);

      let fileToUpload = file;
      try {
        const { file: compressed } = await compressImage(file, {
          maxDimension: 1920,
          quality: 0.84,
          outputFormat: 'auto',
        });
        fileToUpload = compressed;
      } catch (err) {
        console.warn('Compressão falhou, usando arquivo original:', err);
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('uploadRequestId', `manual-${crypto.randomUUID()}`);

      try {
        const res = await uploadPublicSellRequestImageAction(formData);
        if (res.success && res.image) {
          newUploaded.push({
            id: `img-${Date.now()}-${i}`,
            url: res.image.publicUrl,
            provider: res.image.provider,
            storage_path: res.image.storagePath || null,
            delete_url: res.image.deleteUrl || null,
            altText: `Foto ${images.length + newUploaded.length + 1}`,
            isPrimary: images.length === 0 && newUploaded.length === 0,
          });
        } else {
          toast.error(`Erro ao subir imagem: ${res.error || 'Falha no upload'}`);
        }
      } catch {
        toast.error('Erro de conexão no upload da imagem.');
      }
    }

    setImages((prev) => [...prev, ...newUploaded]);
    setIsUploadingImages(false);
    setUploadProgressText(null);
    e.target.value = '';
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => {
      const filtered = prev.filter((_, idx) => idx !== indexToRemove);
      return filtered.map((img, idx) => ({
        ...img,
        isPrimary: idx === 0,
      }));
    });
  };

  // Step Validation & Navigation
  const validateCurrentStep = () => {
    if (currentStep === 1) {
      return true;
    }
    if (currentStep === 2) {
      if (!name.trim()) {
        toast.error('Informe o nome completo do cliente.');
        return false;
      }
      const rawPhone = phone.replace(/\D/g, '');
      if (rawPhone.length < 10) {
        toast.error('Informe um telefone/WhatsApp válido com DDD.');
        return false;
      }
      return true;
    }
    if (currentStep === 3) {
      if (type !== 'GENERAL_CONTACT' && type !== 'RENTAL') {
        if (!brand.trim()) {
          toast.error('Informe a marca da moto.');
          return false;
        }
        if (!model.trim()) {
          toast.error('Informe o modelo da moto.');
          return false;
        }
      }
      return true;
    }
    return true;
  };

  const handleNextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleReset = () => {
    setCurrentStep(1);
    setType('SELL_MOTORCYCLE');
    setStatus('NEW');
    setName('');
    setPhone('');
    setEmail('');
    setPostalCode('');
    setAddressStreet('');
    setAddressNumber('');
    setAddressNeighborhood('');
    setAddressComplement('');
    setCity('');
    setState('PE');
    setBrand('');
    setBrandId(null);
    setModel('');
    setModelId(null);
    setVersion('');
    setYearManufacture(String(currentYearVal));
    setYearModel(String(currentYearVal));
    setYearId(null);
    setFipeFuelId(null);
    setFipeFuelName(null);
    setAvailableYears([]);
    setColor('');
    setCustomColor('');
    setMileage('');
    setLicensePlate('');
    setDesiredPrice('');
    setFipePrice('');
    setFipeCode('');
    setFipeReferencePeriod('');
    setFipeSnapshot(null);
    setRentalDesiredPlan('');
    setRentalExpectedStartDate('');
    setRentalHasCnhA('Sim');
    setRentalAge('');
    setNotes('');
    setImages([]);
  };

  // Submissão explícita apenas no último step via clique do usuário
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!name.trim()) {
      toast.error('Informe o nome do cliente.');
      setCurrentStep(2);
      return;
    }

    const rawPhone = phone.replace(/\D/g, '');
    if (rawPhone.length < 10) {
      toast.error('Informe um telefone/WhatsApp válido com DDD.');
      setCurrentStep(2);
      return;
    }

    setIsSubmitting(true);

    try {
      const effectiveColor = color === 'Outra' ? customColor.trim() : color.trim();
      const rawDesired = desiredPrice.replace(/\D/g, '');
      const numDesired = rawDesired
        ? Number(rawDesired) / (desiredPrice.includes(',') || desiredPrice.includes('.') ? 100 : 1)
        : null;

      const numFipe = fipePrice
        ? Number(fipePrice.replace(/\D/g, '')) / 100
        : null;

      const payload = {
        type,
        status,
        source: 'MANUAL',
        name: name.trim(),
        phone: rawPhone,
        email: email.trim() || null,
        postal_code: postalCode.replace(/\D/g, '') || null,
        address_street: addressStreet.trim() || null,
        address_number: addressNumber.trim() || null,
        address_neighborhood: addressNeighborhood.trim() || null,
        address_complement: addressComplement.trim() || null,
        city: city.trim() || null,
        state: state.trim() || 'PE',
        message: notes.trim() || null,
        notes: notes.trim() || null,
        brand: brand.trim() || null,
        brand_id: brandId || null,
        model: model.trim() || null,
        model_id: modelId || null,
        version: version.trim() || null,
        year_manufacture: yearManufacture ? Number(yearManufacture) : null,
        year_model: yearModel ? Number(yearModel) : null,
        year_id: yearId || null,
        fuel_id: fuelId || null,
        fuel_name: fuelName || null,
        color: effectiveColor || null,
        mileage: mileage ? Number(mileage.replace(/\D/g, '')) : null,
        license_plate: licensePlate.trim().toUpperCase() || null,
        desired_price: numDesired,
        fipe_price: numFipe,
        fipe_code: fipeCode || null,
        fipe_reference_period: fipeReferencePeriod || null,
        fipe_snapshot: fipeSnapshot || null,
        rental_desired_plan: type === 'RENTAL' ? rentalDesiredPlan.trim() || null : null,
        rental_expected_start_date:
          type === 'RENTAL' ? rentalExpectedStartDate.trim() || null : null,
        rental_has_cnh_a: type === 'RENTAL' ? rentalHasCnhA || null : null,
        rental_age: type === 'RENTAL' && rentalAge ? Number(rentalAge) : null,
        images: images.length > 0 ? images : undefined,
      };

      const result = await createManualProposalAction(payload);

      if (result.error) {
        toast.error(result.error);
        setIsSubmitting(false);
        return;
      }

      toast.success('Proposta cadastrada com sucesso!');
      handleReset();
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: unknown) {
      toast.error(
        'Erro ao salvar proposta: ' + ((err as Error)?.message || 'Tente novamente mais tarde.'),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const showMotorcycleSection = type !== 'GENERAL_CONTACT';
  const isRental = type === 'RENTAL';

  const stepsConfig = [
    { number: 1, title: 'Tipo & Status', icon: Tag },
    { number: 2, title: 'Cliente & Endereço', icon: User },
    { number: 3, title: isRental ? 'Dados do Aluguel' : 'Veículo & FIPE', icon: isRental ? Calendar : Bike },
    { number: 4, title: 'Fotos & Finalização', icon: Sparkles },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl lg:max-w-6xl w-[96vw] max-h-[92vh] overflow-hidden flex flex-col bg-[#0d0d10] border border-zinc-800 text-zinc-100 p-0 rounded-3xl shadow-2xl">
        {/* Top Gradient Stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] shrink-0" />

        {/* Modal Header */}
        <DialogHeader className="px-6 py-4.5 border-b border-zinc-800/80 bg-zinc-950/80 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#c9a44c]/10 border border-[#c9a44c]/25 flex items-center justify-center text-[#e3c56c] shrink-0 shadow-xs">
                <FileText className="w-5 h-5 text-[#c9a44c]" />
              </div>
              <div>
                <DialogTitle className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                  Cadastrar Nova Proposta
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400">
                  Preencha os dados em etapas para registrar o atendimento no sistema
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className="w-fit bg-[#c9a44c]/15 text-[#e3c56c] border-[#c9a44c]/30 font-bold text-xs px-3 py-1 flex items-center gap-1.5"
            >
              Origem: Manual
            </Badge>
          </div>
        </DialogHeader>

        {/* Stepper Progress Bar */}
        <div className="bg-zinc-950/90 border-b border-zinc-800/80 px-6 py-3.5 shrink-0 overflow-x-auto">
          <div className="flex items-center justify-between max-w-3xl mx-auto min-w-[500px]">
            {stepsConfig.map((s, index) => {
              const StepIcon = s.icon;
              const isCurrent = currentStep === s.number;
              const isDone = currentStep > s.number;

              return (
                <React.Fragment key={s.number}>
                  <button
                    type="button"
                    onClick={() => {
                      if (isDone || s.number < currentStep || validateCurrentStep()) {
                        setCurrentStep(s.number);
                      }
                    }}
                    className={cn(
                      'flex items-center gap-2.5 transition-all text-left group cursor-pointer',
                      isCurrent
                        ? 'text-white'
                        : isDone
                          ? 'text-[#e3c56c] hover:text-white'
                          : 'text-zinc-500 hover:text-zinc-300',
                    )}
                  >
                    <div
                      className={cn(
                        'w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-all shadow-xs shrink-0',
                        isCurrent
                          ? 'bg-[#c9a44c] text-zinc-950 ring-2 ring-[#c9a44c]/40 font-black'
                          : isDone
                            ? 'bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/40'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-400',
                      )}
                    >
                      {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <StepIcon className="w-4 h-4" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                        Passo {s.number}
                      </span>
                      <span className="text-xs font-extrabold whitespace-nowrap block">
                        {s.title}
                      </span>
                    </div>
                  </button>

                  {index < stepsConfig.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 mx-3 rounded-full transition-all',
                        currentStep > index + 1 ? 'bg-[#c9a44c]' : 'bg-zinc-800',
                      )}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Form Body with Steps */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (currentStep < totalSteps) {
              handleNextStep();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              e.preventDefault();
              if (currentStep < totalSteps) {
                handleNextStep();
              }
            }
          }}
          className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col justify-between"
        >
          <div className="space-y-6">
            {/* STEP 1: Tipo da Proposta & Status Inicial */}
            {currentStep === 1 && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#c9a44c]" />
                    Selecione o Tipo da Solicitação
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Identifique qual é o objetivo do lead recebido para ajustar os campos das próximas etapas.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = type === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setType(opt.value)}
                        className={cn(
                          'p-4 rounded-2xl border text-left transition-all flex flex-col gap-2.5 cursor-pointer relative',
                          isSelected
                            ? 'border-[#c9a44c] bg-zinc-900 shadow-lg ring-2 ring-[#c9a44c]/40'
                            : 'border-zinc-800/80 bg-zinc-950/60 hover:bg-zinc-900/60 hover:border-zinc-700',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={cn(
                              'w-9 h-9 rounded-xl flex items-center justify-center border',
                              opt.colorClass,
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-[#c9a44c]" />}
                        </div>
                        <div>
                          <span className="text-sm font-extrabold text-white block">{opt.label}</span>
                          <span className="text-xs text-zinc-400 mt-0.5 block leading-relaxed">
                            {opt.description}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="bg-zinc-950/70 p-4.5 rounded-2xl border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <Label htmlFor="step1-status" className="text-xs font-bold text-white block">
                      Status Inicial do Lead
                    </Label>
                    <span className="text-[11px] text-zinc-400 block mt-0.5">
                      Como este lead deve começar no CRM de propostas
                    </span>
                  </div>
                  <select
                    id="step1-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProposalStatus)}
                    className="h-10 px-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-bold text-zinc-200 outline-none focus:border-[#c9a44c] cursor-pointer min-w-[220px]"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* STEP 2: Dados do Cliente & Endereço Completo */}
            {currentStep === 2 && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <User className="w-4 h-4 text-[#c9a44c]" />
                    Dados do Cliente & Localização
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Preencha o contato e endereço completo para vincular automaticamente ao CRM.
                  </p>
                </div>

                {/* Informações Pessoais */}
                <div className="bg-zinc-950/70 p-5 rounded-2xl border border-zinc-800/80 space-y-4 shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-800/60 pb-2 flex items-center justify-between">
                    <span>Contato Principal</span>
                    <span className="text-[10px] text-red-400 font-bold">* Campos obrigatórios</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="step2-name" className="text-xs text-zinc-300 font-semibold">
                        Nome Completo do Cliente <span className="text-red-400">*</span>
                      </Label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <Input
                          id="step2-name"
                          required
                          placeholder="Ex: João da Silva"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10 h-11 bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="step2-phone" className="text-xs text-zinc-300 font-semibold">
                        WhatsApp / Telefone <span className="text-red-400">*</span>
                      </Label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9a44c]" />
                        <Input
                          id="step2-phone"
                          required
                          placeholder="(81) 99999-9999"
                          value={phone}
                          onChange={handlePhoneChange}
                          className="pl-10 h-11 bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs font-mono text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="step2-email" className="text-xs text-zinc-300 font-semibold">
                        E-mail (Opcional)
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <Input
                          id="step2-email"
                          type="email"
                          placeholder="cliente@email.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11 bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs text-white"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Endereço Completo */}
                <div className="bg-zinc-950/70 p-5 rounded-2xl border border-zinc-800/80 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#c9a44c]" />
                      Endereço Completo
                    </h4>
                    <span className="text-[10px] text-zinc-500">Busca rápida por CEP</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                    {/* CEP */}
                    <div className="sm:col-span-4 space-y-1.5">
                      <Label htmlFor="step2-cep" className="text-xs text-zinc-300 font-semibold">
                        CEP (com auto-preenchimento)
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <Input
                          id="step2-cep"
                          placeholder="50000-000"
                          maxLength={9}
                          value={postalCode}
                          onChange={(e) => {
                            const formatted = formatCepInput(e.target.value);
                            setPostalCode(formatted);
                            if (formatted.replace(/\D/g, '').length === 8) {
                              handleCepLookup(formatted);
                            }
                          }}
                          className="pl-10 pr-9 h-11 bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs font-mono text-white"
                        />
                        {isLookingUpCep && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#c9a44c]" />
                        )}
                      </div>
                    </div>

                    {/* Logradouro */}
                    <div className="sm:col-span-8 space-y-1.5">
                      <Label htmlFor="step2-street" className="text-xs text-zinc-300 font-semibold">
                        Rua / Logradouro
                      </Label>
                      <Input
                        id="step2-street"
                        placeholder="Ex: Av. Boa Viagem, Rua das Flores"
                        value={addressStreet}
                        onChange={(e) => setAddressStreet(e.target.value)}
                        className="h-11 bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs text-white"
                      />
                    </div>

                    {/* Número */}
                    <div className="sm:col-span-3 space-y-1.5">
                      <Label htmlFor="step2-number" className="text-xs text-zinc-300 font-semibold">
                        Número
                      </Label>
                      <Input
                        id="step2-number"
                        placeholder="123"
                        value={addressNumber}
                        onChange={(e) => setAddressNumber(e.target.value)}
                        className="h-11 bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs text-white"
                      />
                    </div>

                    {/* Bairro */}
                    <div className="sm:col-span-5 space-y-1.5">
                      <Label htmlFor="step2-neighborhood" className="text-xs text-zinc-300 font-semibold">
                        Bairro
                      </Label>
                      <Input
                        id="step2-neighborhood"
                        placeholder="Ex: Boa Viagem, Centro"
                        value={addressNeighborhood}
                        onChange={(e) => setAddressNeighborhood(e.target.value)}
                        className="h-11 bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs text-white"
                      />
                    </div>

                    {/* Complemento */}
                    <div className="sm:col-span-4 space-y-1.5">
                      <Label htmlFor="step2-complement" className="text-xs text-zinc-300 font-semibold">
                        Complemento (Opcional)
                      </Label>
                      <Input
                        id="step2-complement"
                        placeholder="Apto 402, Bloco B"
                        value={addressComplement}
                        onChange={(e) => setAddressComplement(e.target.value)}
                        className="h-11 bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs text-white"
                      />
                    </div>

                    {/* Cidade */}
                    <div className="sm:col-span-9 space-y-1.5">
                      <Label htmlFor="step2-city" className="text-xs text-zinc-300 font-semibold">
                        Cidade
                      </Label>
                      <Input
                        id="step2-city"
                        placeholder="Ex: Recife, Olinda, Cabo de Santo Agostinho"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="h-11 bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs text-white"
                      />
                    </div>

                    {/* UF */}
                    <div className="sm:col-span-3 space-y-1.5">
                      <Label htmlFor="step2-state" className="text-xs text-zinc-300 font-semibold">
                        Estado (UF)
                      </Label>
                      <Input
                        id="step2-state"
                        maxLength={2}
                        placeholder="PE"
                        value={state}
                        onChange={(e) => setState(e.target.value.toUpperCase())}
                        className="h-11 bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs font-mono text-white uppercase text-center font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Dados do Veículo (Tabela FIPE) ou Detalhes de Aluguel */}
            {currentStep === 3 && (
              <div className="space-y-6 max-w-4xl mx-auto">
                {showMotorcycleSection ? (
                  <>
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <Bike className="w-4 h-4 text-[#c9a44c]" />
                        Dados do Veículo & Consulta FIPE
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Consulte a tabela FIPE oficial para preenchimento de marca, modelo e valor de referência.
                      </p>
                    </div>

                    {/* FIPE Comboboxes & Card */}
                    <div className="bg-zinc-950/70 p-5 rounded-2xl border border-zinc-800/80 space-y-4 shadow-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Marca da Moto FIPE */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-zinc-300 font-semibold">
                            Marca da Moto (Tabela FIPE) <span className="text-red-400">*</span>
                          </Label>
                          <FipeBrandCombobox
                            value={brand}
                            brandId={brandId}
                            onSelect={handleBrandSelect}
                            id="step3-fipe-brand"
                          />
                        </div>

                        {/* Modelo da Moto FIPE */}
                        <div className="space-y-1.5">
                          <Label className="text-xs text-zinc-300 font-semibold">
                            Modelo da Moto (Tabela FIPE) <span className="text-red-400">*</span>
                          </Label>
                          <FipeModelCombobox
                            value={model}
                            brandId={brandId}
                            brandName={brand}
                            onSelect={handleModelSelect}
                            id="step3-fipe-model"
                          />
                        </div>
                      </div>

                      {/* FIPE Price Result Card */}
                      {(fipePrice || isFetchingFipe) && (
                        <div className="bg-gradient-to-r from-amber-500/10 via-zinc-900 to-zinc-950 p-4 rounded-xl border border-[#c9a44c]/30 flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-extrabold text-[#e3c56c] uppercase tracking-wider flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              Valor Tabela FIPE
                            </span>
                            <span className="text-xs text-zinc-400 block">
                              {fipeReferencePeriod ? `Mês Ref: ${fipeReferencePeriod}` : 'Referência oficial FIPE'}
                              {fipeCode && ` • Código: ${fipeCode}`}
                            </span>
                          </div>
                          <div className="text-right">
                            {isFetchingFipe ? (
                              <Loader2 className="w-5 h-5 animate-spin text-[#c9a44c] ml-auto" />
                            ) : (
                              <span className="text-xl font-black text-[#e3c56c] font-mono block">
                                {fipePrice}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Especificações do Veículo */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-zinc-800/60">
                        {/* Ano Modelo */}
                        <div className="space-y-1.5">
                          <Label htmlFor="step3-year-model" className="text-xs text-zinc-300 font-semibold">
                            Ano Modelo
                          </Label>
                          {availableYears.length > 0 ? (
                            <select
                              id="step3-year-model"
                              value={yearId || yearModel}
                              onChange={(e) => handleYearChange(e.target.value)}
                              className="w-full h-11 px-3 bg-zinc-900/90 border border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs font-mono text-white outline-none cursor-pointer"
                            >
                              {availableYears.map((y) => (
                                <option key={y.yearId} value={y.yearId}>
                                  {y.isZeroKm ? 'Zero KM' : y.year}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <Input
                              id="step3-year-model"
                              type="number"
                              placeholder="2024"
                              value={yearModel}
                              onChange={(e) => setYearModel(e.target.value)}
                              className="h-11 bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs font-mono text-white"
                            />
                          )}
                        </div>

                        {/* Ano Fabricação */}
                        <div className="space-y-1.5">
                          <Label htmlFor="step3-year-fab" className="text-xs text-zinc-300 font-semibold">
                            Ano Fabricação
                          </Label>
                          <Input
                            id="step3-year-fab"
                            type="number"
                            placeholder="2023"
                            value={yearManufacture}
                            onChange={(e) => setYearManufacture(e.target.value)}
                            className="h-11 bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs font-mono text-white"
                          />
                        </div>

                        {/* Versão */}
                        <div className="space-y-1.5">
                          <Label htmlFor="step3-version" className="text-xs text-zinc-300 font-semibold">
                            Versão (Opcional)
                          </Label>
                          <Input
                            id="step3-version"
                            placeholder="Ex: ABS, ESD, Flex"
                            value={version}
                            onChange={(e) => setVersion(e.target.value)}
                            className="h-11 bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs text-white"
                          />
                        </div>

                        {/* Cor */}
                        <div className="space-y-1.5">
                          <Label htmlFor="step3-color" className="text-xs text-zinc-300 font-semibold">
                            Cor da Moto
                          </Label>
                          <select
                            id="step3-color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="w-full h-11 px-3 bg-zinc-900/90 border border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs text-white outline-none cursor-pointer"
                          >
                            <option value="">Selecione a cor...</option>
                            {COMMON_COLORS.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Cor customizada se 'Outra' */}
                        {color === 'Outra' && (
                          <div className="space-y-1.5">
                            <Label htmlFor="step3-custom-color" className="text-xs text-zinc-300 font-semibold">
                              Especifique a Cor
                            </Label>
                            <Input
                              id="step3-custom-color"
                              placeholder="Ex: Grafite Metálico"
                              value={customColor}
                              onChange={(e) => setCustomColor(e.target.value)}
                              className="h-11 bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs text-white"
                            />
                          </div>
                        )}

                        {/* KM Rodados */}
                        <div className="space-y-1.5">
                          <Label htmlFor="step3-mileage" className="text-xs text-zinc-300 font-semibold">
                            KM Rodados
                          </Label>
                          <Input
                            id="step3-mileage"
                            placeholder="Ex: 15.000"
                            value={mileage}
                            onChange={(e) => setMileage(e.target.value)}
                            className="h-11 bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs font-mono text-white"
                          />
                        </div>

                        {/* Placa */}
                        <div className="space-y-1.5">
                          <Label htmlFor="step3-plate" className="text-xs text-zinc-300 font-semibold">
                            Placa (Opcional)
                          </Label>
                          <Input
                            id="step3-plate"
                            placeholder="ABC-1D23"
                            maxLength={8}
                            value={licensePlate}
                            onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                            className="h-11 bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs font-mono text-white uppercase"
                          />
                        </div>

                        {/* Valor Desejado / Pedido */}
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label htmlFor="step3-desired-price" className="text-xs text-zinc-300 font-semibold">
                            Valor Desejado / Pedido pelo Cliente (R$)
                          </Label>
                          <div className="relative">
                            <CircleDollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#c9a44c]" />
                            <Input
                              id="step3-desired-price"
                              placeholder="Ex: 18.500,00"
                              value={desiredPrice}
                              onChange={(e) => setDesiredPrice(e.target.value)}
                              className="pl-10 h-11 bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs font-mono text-[#e3c56c] font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : isRental ? (
                  /* Detalhes de Aluguel */
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-400" />
                        Dados da Locação / Aluguel
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Informe o plano de interesse e os requisitos do cliente.
                      </p>
                    </div>

                    <div className="bg-blue-950/20 p-5 rounded-2xl border border-blue-500/30 space-y-4 shadow-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="step3-rental-plan" className="text-xs text-zinc-300 font-semibold">
                            Plano Desejado
                          </Label>
                          <Input
                            id="step3-rental-plan"
                            placeholder="Ex: Semanal, Mensal, Anual"
                            value={rentalDesiredPlan}
                            onChange={(e) => setRentalDesiredPlan(e.target.value)}
                            className="h-11 bg-zinc-900/90 border-zinc-800 focus:border-blue-400 rounded-xl text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label
                            htmlFor="step3-rental-date"
                            className="text-xs text-zinc-300 font-semibold"
                          >
                            Início Previsto
                          </Label>
                          <Input
                            id="step3-rental-date"
                            type="date"
                            value={rentalExpectedStartDate}
                            onChange={(e) => setRentalExpectedStartDate(e.target.value)}
                            className="h-11 bg-zinc-900/90 border-zinc-800 focus:border-blue-400 rounded-xl text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="step3-rental-cnh" className="text-xs text-zinc-300 font-semibold">
                            Possui CNH Categoria A?
                          </Label>
                          <select
                            id="step3-rental-cnh"
                            value={rentalHasCnhA}
                            onChange={(e) => setRentalHasCnhA(e.target.value)}
                            className="w-full h-11 px-3 bg-zinc-900/90 border border-zinc-800 focus:border-blue-400 rounded-xl text-xs text-white outline-none cursor-pointer"
                          >
                            <option value="Sim">Sim, habilitado</option>
                            <option value="Não">Não possui CNH A</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="step3-rental-age" className="text-xs text-zinc-300 font-semibold">
                            Idade do Cliente
                          </Label>
                          <Input
                            id="step3-rental-age"
                            type="number"
                            placeholder="Ex: 28"
                            value={rentalAge}
                            onChange={(e) => setRentalAge(e.target.value)}
                            className="h-11 bg-zinc-900/90 border-zinc-800 focus:border-blue-400 rounded-xl text-xs font-mono text-white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Contato Geral */
                  <div className="bg-zinc-950/70 p-6 rounded-2xl border border-zinc-800/80 text-center space-y-2">
                    <MessageSquare className="w-8 h-8 text-[#c9a44c] mx-auto" />
                    <h4 className="text-sm font-bold text-white">Contato Geral Selecionado</h4>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto">
                      Não é necessário preencher dados veiculares para contatos gerais. Prossiga para adicionar as observações da conversa.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* STEP 4: Fotos (Opcional) & Observações da Conversa */}
            {currentStep === 4 && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <div className="space-y-1">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#c9a44c]" />
                    Fotos do Veículo & Observações
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Anexe as fotos enviadas pelo cliente ou prossiga com a foto padrão da loja.
                  </p>
                </div>

                {/* Upload de Fotos */}
                <div className="bg-zinc-950/70 p-5 rounded-2xl border border-zinc-800/80 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#c9a44c]" />
                      Fotos do Veículo (100% Opcional)
                    </h4>
                    <span className="text-[11px] text-zinc-400 font-medium">
                      {images.length > 0 ? `${images.length} foto(s) anexada(s)` : 'Sem fotos (utiliza imagem padrão)'}
                    </span>
                  </div>

                  {/* Área de Upload */}
                  <div>
                    <label
                      htmlFor="step4-photo-upload"
                      className={cn(
                        'flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all',
                        isUploadingImages
                          ? 'border-zinc-700 bg-zinc-900/40 opacity-70 pointer-events-none'
                          : 'border-zinc-800 hover:border-[#c9a44c]/60 bg-zinc-900/40 hover:bg-zinc-900/80',
                      )}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center text-[#c9a44c] mb-2.5 border border-zinc-800 shadow-xs">
                        {isUploadingImages ? (
                          <Loader2 className="w-6 h-6 animate-spin text-[#c9a44c]" />
                        ) : (
                          <Upload className="w-6 h-6" />
                        )}
                      </div>
                      <span className="text-xs font-bold text-white">
                        {isUploadingImages
                          ? uploadProgressText || 'Otimizando e enviando fotos...'
                          : 'Clique para anexar fotos recebidas no WhatsApp'}
                      </span>
                      <span className="text-[11px] text-zinc-500 mt-1">
                        JPEG, PNG ou WEBP • Pode selecionar múltiplos arquivos de uma vez
                      </span>
                      <input
                        id="step4-photo-upload"
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleImageUpload}
                        disabled={isUploadingImages}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Lista de Fotos ou Card de Fallback Padrão */}
                  {images.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      {images.map((img, idx) => (
                        <div
                          key={img.id}
                          className="relative group aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-xs"
                        >
                          <img
                            src={img.url}
                            alt={img.altText || `Foto ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="p-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white transition-colors cursor-pointer"
                              title="Remover foto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          {idx === 0 && (
                            <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-black/80 text-[9px] font-black text-[#e3c56c] border border-[#c9a44c]/30">
                              Capa
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80 flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shrink-0 p-1.5">
                        <img
                          src="/logo.png"
                          alt="Logo AF Motos"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#c9a44c]" />
                          Imagem Padrão Automática Ativada
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Nenhuma foto foi anexada. A proposta será salva com a logomarca oficial da {siteName} como foto de capa nos cards e listagens.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Observações & Detalhes da Negociação */}
                <div className="bg-zinc-950/70 p-5 rounded-2xl border border-zinc-800/80 space-y-2.5 shadow-xs">
                  <Label
                    htmlFor="step4-notes"
                    className="text-xs text-zinc-300 font-semibold flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#c9a44c]" />
                    Observações & Histórico da Conversa
                  </Label>
                  <Textarea
                    id="step4-notes"
                    rows={3}
                    placeholder="Ex: Cliente informou que a moto possui chave reserva, manual do proprietário e aceita negociar o valor..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] rounded-xl text-xs text-white leading-relaxed resize-none"
                  />
                </div>

                {/* Resumo Final para Conferência */}
                <div className="bg-zinc-900/40 p-4.5 rounded-2xl border border-zinc-800/60 space-y-2 text-xs">
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                    Resumo da Proposta (Revise antes de salvar)
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-zinc-300">
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Cliente:</span>
                      <span className="font-bold text-white truncate block">{name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Telefone:</span>
                      <span className="font-mono text-zinc-200">{phone || '-'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Moto:</span>
                      <span className="font-bold text-[#e3c56c] truncate block">
                        {brand ? `${brand} ${model}` : 'Não aplicável'}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500 text-[10px] block">Valor Pedido:</span>
                      <span className="font-mono font-bold text-white">
                        {desiredPrice ? `R$ ${desiredPrice}` : fipePrice || '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sticky Modal Footer with Step Navigation */}
          <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between gap-3 shrink-0">
            <div>
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  disabled={isSubmitting}
                  className="rounded-xl border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 text-xs font-semibold cursor-pointer h-11 px-4 flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="rounded-xl border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-900 text-xs font-semibold cursor-pointer h-11 px-4"
                >
                  Cancelar
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {currentStep < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNextStep}
                  className="bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-zinc-950 font-black rounded-xl text-xs h-11 px-6 shadow-[0_0_20px_rgba(201,164,76,0.25)] transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  <span>Próximo Passo</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => handleSubmit()}
                  disabled={isSubmitting || isUploadingImages}
                  className="bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-zinc-950 font-black rounded-xl text-xs h-11 px-7 shadow-[0_0_20px_rgba(201,164,76,0.3)] transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Cadastrando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Cadastrar Proposta</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
