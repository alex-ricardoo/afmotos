'use client';

import React, { useState } from 'react';
import { useForm, useWatch, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Image from 'next/image';
import {
  Camera,
  Loader2,
  CheckCircle2,
  UploadCloud,
  X,
  User,
  Phone,
  Bike,
  MapPin,
  Calendar,
  Gauge,
  DollarSign,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { sellRequestSchema, SellRequestInput } from '@/lib/validations/sell-request';
import {
  createSellRequestAction,
  uploadPublicSellRequestImageAction,
  SellRequestImageItem,
} from '@/lib/actions/leads';
import { compressImageFiles, formatFileSize } from '@/lib/utils/image-compression';
import { PECityCombobox } from '@/components/forms/pe-city-combobox';
import { FipeBrandCombobox } from '@/components/forms/fipe-brand-combobox';
import { FipeModelCombobox } from '@/components/forms/fipe-model-combobox';
import { FipeModelDetail } from '@/lib/fipex/types';
import { formatPhoneForDisplay } from '@/lib/utils/whatsapp';

const MAX_PHOTOS = 5;
const currentYear = new Date().getFullYear();

export function AnunciarMotoForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // FIPE internal tracking
  const [fipeBrandId, setFipeBrandId] = useState<string | null>(null);
  const [fipeModelId, setFipeModelId] = useState<string | null>(null);
  const [fipeYearId, setFipeYearId] = useState<string | null>(null);
  const [fipeFuelId, setFipeFuelId] = useState<string | null>(null);
  const [fipeFuelName, setFipeFuelName] = useState<string | null>(null);

  const form = useForm<SellRequestInput>({
    resolver: zodResolver(sellRequestSchema) as unknown as Resolver<SellRequestInput>,
    defaultValues: {
      name: '',
      phone: '',
      brand: '',
      brand_id: null,
      model: '',
      model_id: null,
      year_manufacture: currentYear,
      year_model: currentYear,
      year_id: null,
      fuel_id: null,
      fuel_name: null,
      mileage: 0,
      desired_price: undefined,
      state: 'PE',
      city: '',
      notes: '',
    },
  });

  const selectedBrand = useWatch({ control: form.control, name: 'brand' });

  // Formatação dinâmica do WhatsApp enquanto o usuário digita
  const handlePhoneInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (val: string) => void,
  ) => {
    const rawDigits = e.target.value.replace(/\D/g, '').slice(0, 11);
    onChange(rawDigits);
  };

  // Handlers para seleção de marca e modelo com limpeza em cascata
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
      const firstYearFuel = detail.yearFuels[0];
      const modelYear = firstYearFuel.year || currentYear;
      const fuel = firstYearFuel.fuels?.[0];

      setFipeYearId(firstYearFuel.isZeroKm ? 'zero' : String(modelYear));
      setFipeFuelId(fuel?.id || null);
      setFipeFuelName(fuel?.name || null);

      form.setValue('year_model', modelYear, { shouldValidate: true });
      form.setValue('year_id', firstYearFuel.isZeroKm ? 'zero' : String(modelYear));
      form.setValue('fuel_id', fuel?.id || null);
      form.setValue('fuel_name', fuel?.name || null);

      // Auto-preencher ano fabricação se estiver no ano corrente
      if (form.getValues('year_manufacture') === currentYear) {
        form.setValue('year_manufacture', modelYear, { shouldValidate: true });
      }
    }
  };

  // Processamento, compressão e validação de arquivos para upload
  const processFiles = async (files: File[]) => {
    if (selectedFiles.length >= MAX_PHOTOS) {
      toast.error('Você já adicionou o limite de 5 fotos.');
      return;
    }

    const availableSlots = MAX_PHOTOS - selectedFiles.length;
    if (files.length > availableSlots) {
      toast.error(`Você pode adicionar no máximo mais ${availableSlots} foto(s).`);
    }

    const filesToAdd = files.slice(0, availableSlots);
    const validRawFiles: File[] = [];

    for (const file of filesToAdd) {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`A foto "${file.name}" ultrapassa o limite de 20MB.`);
        continue;
      }
      if (
        !['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/avif'].includes(
          file.type.toLowerCase()
        )
      ) {
        toast.error(`O arquivo "${file.name}" não é um formato suportado (use JPG, PNG ou WebP).`);
        continue;
      }
      validRawFiles.push(file);
    }

    if (validRawFiles.length === 0) return;

    try {
      const { files: compressedFiles, statsList } = await compressImageFiles(validRawFiles, {
        maxDimension: 1920,
        quality: 0.82,
        outputFormat: 'auto',
      });

      const newPreviews = compressedFiles.map((file) => URL.createObjectURL(file));

      setSelectedFiles((prev) => [...prev, ...compressedFiles]);
      setPreviews((prev) => [...prev, ...newPreviews]);

      toast.success(
        compressedFiles.length === 1
          ? '1 foto adicionada com sucesso!'
          : `${compressedFiles.length} fotos adicionadas com sucesso!`
      );
    } catch (err) {
      console.error('Erro na compressão:', err);
      const newPreviews = validRawFiles.map((file) => URL.createObjectURL(file));
      setSelectedFiles((prev) => [...prev, ...validRawFiles]);
      setPreviews((prev) => [...prev, ...newPreviews]);
      toast.success(
        validRawFiles.length === 1
          ? '1 foto adicionada com sucesso!'
          : `${validRawFiles.length} fotos adicionadas com sucesso!`
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processFiles(Array.from(e.target.files));
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (selectedFiles.length < MAX_PHOTOS && !loading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (selectedFiles.length >= MAX_PHOTOS || loading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => {
      if (prev[index]) {
        URL.revokeObjectURL(prev[index]);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  // Submissão do formulário
  async function onSubmit(data: SellRequestInput) {
    setLoading(true);
    try {
      const uploadedImages: SellRequestImageItem[] = [];

      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadResult = await uploadPublicSellRequestImageAction(formData);

        if (uploadResult.success && uploadResult.url) {
          uploadedImages.push({
            url: uploadResult.url,
            provider: uploadResult.image?.provider || 'supabase',
            storage_path: uploadResult.image?.storagePath || null,
            delete_url: uploadResult.image?.deleteUrl || null,
          });
        } else {
          console.warn('Aviso de falha parcial no upload de foto:', uploadResult.error);
        }
      }

      const result = await createSellRequestAction({
        name: data.name,
        phone: data.phone,
        brand: data.brand,
        brand_id: fipeBrandId || data.brand_id || null,
        model: data.model,
        model_id: fipeModelId || data.model_id || null,
        year_manufacture: data.year_manufacture,
        year_model: data.year_model,
        year_id: fipeYearId || data.year_id || null,
        fuel_id: fipeFuelId || data.fuel_id || null,
        fuel_name: fipeFuelName || data.fuel_name || null,
        mileage: data.mileage || 0,
        desired_price: data.desired_price || undefined,
        state: 'PE',
        city: data.city,
        notes: data.notes || undefined,
        images: uploadedImages,
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Recebemos os dados da sua moto. Vamos analisar e falar com você.');
        setSuccess(true);
        form.reset();
        setSelectedFiles([]);
        setPreviews([]);
      }
    } catch {
      toast.error('Não foi possível enviar agora. Verifique os campos e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-zinc-900/90 border border-emerald-500/40 text-zinc-100 p-8 sm:p-12 rounded-3xl text-center space-y-6 shadow-2xl backdrop-blur-xl animate-in fade-in duration-300">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-3">
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-heading tracking-tight">
            Proposta Enviada com Sucesso!
          </h3>
          <p className="text-sm sm:text-base text-zinc-300 max-w-lg mx-auto leading-relaxed">
            Recebemos as informações e fotos da sua moto. Nossa equipe analisará suas informações e entrará em contato com você via WhatsApp para te passar a melhor proposta.
          </p>
        </div>

        <div className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-800 max-w-md mx-auto text-xs text-zinc-400 flex items-start gap-3 text-left">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>
            Fique atento ao seu WhatsApp. Responderemos o mais breve possível em horário comercial.
          </span>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold px-8 h-12 rounded-xl cursor-pointer shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
            onClick={() => setSuccess(false)}
          >
            Enviar Outra Proposta
          </Button>
        </div>
      </div>
    );
  }

  const photosCount = selectedFiles.length;
  const isPhotosLimitReached = photosCount >= MAX_PHOTOS;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        {/* SEÇÃO 1: SEUS DADOS DE CONTATO */}
        <div className="space-y-5">
          <div className="flex items-center gap-2.5 pb-3 border-b border-amber-500/20">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <User className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">
              1. Seus Dados de Contato
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
                    Nome Completo *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Carlos Eduardo Silva"
                      {...field}
                      disabled={loading}
                      aria-required="true"
                      className="bg-zinc-950/80 border-zinc-800 focus:border-amber-500/50 h-12 rounded-xl text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-amber-500/50 transition-colors"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400 font-medium" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => {
                const formattedDisplay = formatPhoneForDisplay(field.value);
                return (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
                      WhatsApp com DDD *
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="(81) 98590-1175"
                          value={formattedDisplay}
                          disabled={loading}
                          aria-required="true"
                          onChange={(e) => handlePhoneInputChange(e, field.onChange)}
                          className="bg-zinc-950/80 border-zinc-800 focus:border-amber-500/50 h-12 rounded-xl text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-amber-500/50 transition-colors pr-10"
                        />
                        <Phone className="w-4 h-4 text-zinc-500 absolute right-3.5 top-4 pointer-events-none" />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-rose-400 font-medium" />
                  </FormItem>
                );
              }}
            />
          </div>
        </div>

        {/* SEÇÃO 2: DADOS DA MOTOCICLETA */}
        <div className="space-y-5 pt-2">
          <div className="flex items-center gap-2.5 pb-3 border-b border-amber-500/20">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bike className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">
              2. Dados da Motocicleta
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              control={form.control}
              name="brand"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
                    Marca *
                  </FormLabel>
                  <FormControl>
                    <FipeBrandCombobox
                      value={field.value}
                      brandId={fipeBrandId}
                      onSelect={handleBrandSelect}
                      error={!!fieldState.error}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400 font-medium" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
                    Modelo e Versão *
                  </FormLabel>
                  <FormControl>
                    <FipeModelCombobox
                      value={field.value}
                      brandId={fipeBrandId}
                      brandName={selectedBrand}
                      onSelect={handleModelSelect}
                      error={!!fieldState.error}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400 font-medium" />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FormField
              control={form.control}
              name="year_manufacture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
                    Ano Fab. *
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="2022"
                        min={1900}
                        max={currentYear + 1}
                        {...field}
                        disabled={loading}
                        className="bg-zinc-950/80 border-zinc-800 focus:border-amber-500/50 h-12 rounded-xl text-white focus-visible:ring-1 focus-visible:ring-amber-500/50 transition-colors pr-9 font-mono text-sm"
                      />
                      <Calendar className="w-4 h-4 text-zinc-500 absolute right-3 top-4 pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400 font-medium" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="year_model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
                    Ano Mod. *
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="2023"
                        min={1900}
                        max={currentYear + 2}
                        {...field}
                        disabled={loading}
                        className="bg-zinc-950/80 border-zinc-800 focus:border-amber-500/50 h-12 rounded-xl text-white focus-visible:ring-1 focus-visible:ring-amber-500/50 transition-colors pr-9 font-mono text-sm"
                      />
                      <Calendar className="w-4 h-4 text-zinc-500 absolute right-3 top-4 pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400 font-medium" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
                    KM Rodados *
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="Ex: 18000"
                        min={0}
                        max={500000}
                        {...field}
                        disabled={loading}
                        className="bg-zinc-950/80 border-zinc-800 focus:border-amber-500/50 h-12 rounded-xl text-white focus-visible:ring-1 focus-visible:ring-amber-500/50 transition-colors pr-9 font-mono text-sm"
                      />
                      <Gauge className="w-4 h-4 text-zinc-500 absolute right-3 top-4 pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400 font-medium" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="desired_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
                    Valor Pretendido (R$)
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="Ex: 28000"
                        min={0}
                        value={field.value ?? ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          field.onChange(val === '' ? undefined : Number(val));
                        }}
                        disabled={loading}
                        className="bg-zinc-950/80 border-zinc-800 focus:border-amber-500/50 h-12 rounded-xl text-white focus-visible:ring-1 focus-visible:ring-amber-500/50 transition-colors pr-9 font-mono text-sm"
                      />
                      <DollarSign className="w-4 h-4 text-zinc-500 absolute right-3 top-4 pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400 font-medium" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
                  Observações Gerais (Opcional)
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Conte sobre revisões na concessionária, pneus novos, escapamento esportivo ou acessórios inclusos..."
                    rows={3}
                    {...field}
                    value={field.value || ''}
                    disabled={loading}
                    className="bg-zinc-950/80 border-zinc-800 focus:border-amber-500/50 rounded-xl text-white placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-amber-500/50 transition-colors leading-relaxed text-sm"
                  />
                </FormControl>
                <FormMessage className="text-xs text-rose-400 font-medium" />
              </FormItem>
            )}
          />
        </div>

        {/* SEÇÃO 3: LOCALIZAÇÃO */}
        <div className="space-y-5 pt-2">
          <div className="flex items-center gap-2.5 pb-3 border-b border-amber-500/20">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">
              3. Localização
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-start">
            <div>
              <label className="text-xs font-bold uppercase text-zinc-300 tracking-wider block mb-2">
                Estado
              </label>
              <div className="h-12 px-4 rounded-xl bg-zinc-950/90 border border-zinc-800 text-white flex items-center justify-between text-sm font-medium">
                <span className="text-zinc-200">Pernambuco</span>
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black">
                  PE
                </span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-bold uppercase text-zinc-300 tracking-wider">
                      Cidade em Pernambuco *
                    </FormLabel>
                    <FormControl>
                      <PECityCombobox
                        value={field.value}
                        onChange={field.onChange}
                        error={!!fieldState.error}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage className="text-xs text-rose-400 font-medium" />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: FOTOS DA MOTO (DROPZONE INTERATIVO) */}
        <div className="space-y-5 pt-2">
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/20">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Camera className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-widest text-amber-400">
                4. Fotos da Moto
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
              {photosCount} de {MAX_PHOTOS} fotos adicionadas
            </span>
          </div>

          {/* Dropzone com suporte a Drag and Drop */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all duration-300 ${
              isPhotosLimitReached
                ? 'border-zinc-800 bg-zinc-950/40 opacity-70 cursor-not-allowed'
                : isDragging
                  ? 'border-amber-400 bg-amber-500/10 shadow-[0_0_25px_rgba(245,158,11,0.15)] scale-[1.01]'
                  : 'border-zinc-800 hover:border-amber-500/50 bg-zinc-950/60 hover:bg-zinc-950/90'
            }`}
          >
            <input
              type="file"
              id="moto-photos-input"
              multiple
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleFileChange}
              className="hidden"
              disabled={loading || isPhotosLimitReached}
            />

            {isPhotosLimitReached ? (
              <div className="flex flex-col items-center justify-center gap-2 py-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <p className="text-sm font-bold text-white">
                  Limite de 5 fotos atingido.
                </p>
                <p className="text-xs text-zinc-400">
                  Para trocar uma imagem, remova alguma das fotos adicionadas abaixo.
                </p>
              </div>
            ) : (
              <label
                htmlFor="moto-photos-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-3 py-2"
              >
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <span className="text-sm sm:text-base font-bold text-white block">
                    Arraste ou clique para selecionar as fotos
                  </span>
                  <span className="text-xs text-zinc-400 block">
                    Fotos da lateral, painel e motor valorizam a avaliação (JPG, PNG ou WebP até 20MB - otimização automática)
                  </span>
                </div>
              </label>
            )}
          </div>

          {/* Grid de Previews das Fotos */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 pt-2">
              {previews.map((previewUrl, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-square rounded-2xl overflow-hidden border border-amber-500/30 bg-zinc-950 shadow-md transition-all hover:border-amber-400"
                >
                  <Image
                    src={previewUrl}
                    alt={`Foto ${idx + 1} da moto`}
                    unoptimized
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/80 text-[10px] font-bold text-amber-400 border border-amber-500/30 backdrop-blur-xs z-10 font-mono">
                    #{idx + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    disabled={loading}
                    aria-label={`Remover foto ${idx + 1}`}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-md z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEÇÃO 5: SUBMISSÃO E AVISO LEGAL UNIFICADO */}
        <div className="space-y-4 pt-6 border-t border-zinc-800/80">
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-bold py-4 h-14 rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2.5 text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Enviando dados da moto...</span>
              </>
            ) : (
              <>
                <span>Enviar Dados da Minha Moto</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>

          {/* Microcopy Unificada */}
          <div className="p-4 bg-zinc-950/80 rounded-xl border border-zinc-800/80 flex items-start gap-3 text-xs text-zinc-400 leading-relaxed text-center sm:text-left">
            <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 mx-auto sm:mx-0" />
            <p>
              Seus dados estão seguros. O envio do formulário nos ajuda a analisar sua moto e te chamar no WhatsApp com a melhor proposta.
            </p>
          </div>
        </div>
      </form>
    </Form>
  );
}
