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
  Info,
  ShieldCheck,
  Calendar,
  Gauge,
  DollarSign,
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

  // Upload e gerenciamento de fotos (limite rígido de 5 fotos)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    if (selectedFiles.length >= MAX_PHOTOS) {
      toast.error('Você já adicionou o limite de 5 fotos.');
      return;
    }

    const availableSlots = MAX_PHOTOS - selectedFiles.length;
    if (files.length > availableSlots) {
      toast.error(`Você pode adicionar mais no máximo ${availableSlots} foto(s).`);
    }

    const filesToAdd = files.slice(0, availableSlots);
    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of filesToAdd) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`A foto "${file.name}" ultrapassa o limite de 5MB.`);
        continue;
      }
      if (
        !['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type.toLowerCase())
      ) {
        toast.error(`O arquivo "${file.name}" não é um formato suportado (use JPG, PNG ou WebP).`);
        continue;
      }
      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setPreviews((prev) => [...prev, ...newPreviews]);
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

      // 1. Upload das fotos selecionadas via Server Action centralizada (ImgBB + fallback Supabase)
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
          console.warn('Aviso de falha parcial no upload de foto da proposta:', uploadResult.error);
        }
      }

      // 2. Persistir proposta no banco via Server Action com cotação FIPE em segundo plano
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
      <div className="bg-[#151515] border border-emerald-500/40 text-[#f4f4f2] p-8 sm:p-10 rounded-3xl text-center space-y-5 shadow-2xl animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl sm:text-3xl font-black text-white font-heading">
            Informações Enviadas com Sucesso!
          </h3>
          <p className="text-sm sm:text-base text-[#a6a6a1] max-w-lg mx-auto leading-relaxed">
            Recebemos os dados da sua moto. Nossa equipe vai analisar as informações e entrar em
            contato com você pelo WhatsApp para alinhar todos os detalhes.
          </p>
        </div>

        <div className="p-4 bg-[#0a0a0a] rounded-2xl border border-[#252525] max-w-md mx-auto text-xs text-[#888] flex items-center gap-2.5 text-left">
          <Info className="w-4 h-4 text-[#e3c56c] shrink-0" />
          <span>
            Fique atento ao seu WhatsApp. Responderemos assim que analisarmos a sua proposta.
          </span>
        </div>

        <div className="pt-2">
          <Button
            type="button"
            className="bg-[#c9a44c] hover:bg-[#e3c56c] text-[#050505] font-extrabold px-8 h-12 rounded-xl cursor-pointer shadow-[0_0_15px_rgba(201,164,76,0.25)] transition-all"
            onClick={() => setSuccess(false)}
          >
            Enviar Outra Moto
          </Button>
        </div>
      </div>
    );
  }

  const photosCount = selectedFiles.length;
  const isPhotosLimitReached = photosCount >= MAX_PHOTOS;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* SEÇÃO 1: SEUS DADOS */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#c9a44c]/20">
            <User className="w-4 h-4 text-[#e3c56c]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#e3c56c]">
              1. Seus Dados de Contato
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                    Nome Completo *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Carlos Eduardo Silva"
                      {...field}
                      disabled={loading}
                      aria-required="true"
                      className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white placeholder:text-[#555] focus-visible:border-[#e3c56c]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400" />
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
                    <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
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
                          className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white placeholder:text-[#555] focus-visible:border-[#e3c56c]"
                        />
                        <Phone className="w-4 h-4 text-[#a6a6a1] absolute right-3.5 top-3.5 pointer-events-none" />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs text-rose-400" />
                  </FormItem>
                );
              }}
            />
          </div>
        </div>

        {/* SEÇÃO 2: SUA MOTO */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-2 border-b border-[#c9a44c]/20">
            <Bike className="w-4 h-4 text-[#e3c56c]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#e3c56c]">
              2. Sua Moto
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="brand"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
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
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="model"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
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
                  <FormMessage className="text-xs text-rose-400" />
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
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                    Ano Fabricação *
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
                        className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]"
                      />
                      <Calendar className="w-3.5 h-3.5 text-[#a6a6a1] absolute right-3 top-3.5 pointer-events-none" />
                    </div>
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
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                    Ano Modelo *
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
                        className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]"
                      />
                      <Calendar className="w-3.5 h-3.5 text-[#a6a6a1] absolute right-3 top-3.5 pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="mileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                    Quilometragem (KM) *
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
                        className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]"
                      />
                      <Gauge className="w-3.5 h-3.5 text-[#a6a6a1] absolute right-3 top-3.5 pointer-events-none" />
                    </div>
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
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
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
                        className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]"
                      />
                      <DollarSign className="w-3.5 h-3.5 text-[#a6a6a1] absolute right-3 top-3.5 pointer-events-none" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                  Observações sobre o estado da moto (Opcional)
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Conte sobre revisões, acessórios instalados, estado dos pneus, documentação..."
                    rows={3}
                    {...field}
                    value={field.value || ''}
                    disabled={loading}
                    className="bg-[#0d0d0d] border-[#c9a44c]/20 rounded-xl text-white placeholder:text-[#555] focus-visible:border-[#e3c56c]"
                  />
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />
        </div>

        {/* SEÇÃO 3: ONDE VOCÊ ESTÁ */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 pb-2 border-b border-[#c9a44c]/20">
            <MapPin className="w-4 h-4 text-[#e3c56c]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#e3c56c]">
              3. Onde você está
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div>
              <label className="text-xs font-bold uppercase text-[#b8bcc2] block mb-2">
                Estado
              </label>
              <div className="h-11 px-3.5 rounded-xl bg-[#111] border border-[#333] text-white flex items-center justify-between text-sm font-medium">
                <span>Pernambuco</span>
                <span className="px-2 py-0.5 rounded-md bg-[#222] text-[#e3c56c] text-xs font-black">
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
                    <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
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
                    <FormMessage className="text-xs text-rose-400" />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* SEÇÃO 4: FOTOS DA MOTO */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#c9a44c]/20">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#e3c56c]" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#e3c56c]">
                4. Fotos da Moto
              </h3>
            </div>
            <span className="text-xs font-bold text-[#e3c56c] bg-[#1a1a1a] px-2.5 py-1 rounded-full border border-[#c9a44c]/30">
              {photosCount} de {MAX_PHOTOS} fotos
            </span>
          </div>

          {/* Dropzone / Seletor de Arquivos */}
          <div
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              isPhotosLimitReached
                ? 'border-[#333] bg-[#0a0a0a] opacity-70 cursor-not-allowed'
                : 'border-[#c9a44c]/30 hover:border-[#e3c56c] bg-[#0d0d0d] hover:bg-[#121212]'
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
              <div className="flex flex-col items-center justify-center gap-1.5 py-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <p className="text-sm font-bold text-white">
                  Você já adicionou o limite de 5 fotos.
                </p>
                <p className="text-xs text-[#888]">
                  Para adicionar outra foto, remova uma das imagens abaixo.
                </p>
              </div>
            ) : (
              <label
                htmlFor="moto-photos-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <UploadCloud className="w-10 h-10 text-[#c9a44c] animate-pulse" />
                <span className="text-sm font-bold text-white">
                  Clique aqui para selecionar as fotos da sua moto
                </span>
                <span className="text-xs text-[#a6a6a1]">
                  Formatos JPG, PNG ou WebP (Máx. 5MB cada, até 5 fotos)
                </span>
              </label>
            )}
          </div>

          {/* Grid de Previews com Botão de Exclusão */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
              {previews.map((previewUrl, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-[#c9a44c]/40 bg-[#050505] shadow-md"
                >
                  <Image
                    src={previewUrl}
                    alt={`Foto ${idx + 1} da moto`}
                    unoptimized
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] font-bold text-white backdrop-blur-xs z-10">
                    #{idx + 1}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    disabled={loading}
                    aria-label={`Remover foto ${idx + 1}`}
                    className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer shadow-sm z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SEÇÃO 5: ENVIO E AVISO TRANSPARENTE */}
        <div className="space-y-4 pt-4 border-t border-[#c9a44c]/20">
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c9a44c] hover:bg-[#e3c56c] text-[#050505] font-black h-14 rounded-xl shadow-[0_0_25px_rgba(201,164,76,0.35)] transition-all flex items-center justify-center gap-2.5 text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Enviando informações...</span>
              </>
            ) : (
              <span>Enviar dados da minha moto</span>
            )}
          </Button>

          <div className="p-3.5 bg-[#0a0a0a] rounded-xl border border-[#252525] flex items-start gap-2.5 text-xs text-[#888] leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-[#e3c56c] shrink-0 mt-0.5" />
            <p>
              O envio não garante a venda da moto. O preço e as condições serão combinados
              diretamente com a equipe da AF Motos via WhatsApp.
            </p>
          </div>
        </div>
      </form>
    </Form>
  );
}
