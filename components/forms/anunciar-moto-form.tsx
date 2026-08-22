'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Camera, Loader2, CheckCircle2, UploadCloud, X } from 'lucide-react';
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
import { createSellRequestAction, uploadPublicSellRequestImageAction } from '@/lib/actions/leads';

export function AnunciarMotoForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);

  const form = useForm<SellRequestInput>({
    resolver: zodResolver(sellRequestSchema) as any,
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      brand: '',
      model: '',
      year_manufacture: new Date().getFullYear(),
      year_model: new Date().getFullYear(),
      mileage: 0,
      desired_price: 0,
      notes: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);

    if (selectedFiles.length + files.length > 5) {
      toast.error('Você pode enviar no máximo 5 fotos da moto.');
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`A imagem ${file.name} ultrapassa o limite de 5MB.`);
        continue;
      }
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
        toast.error(`O arquivo ${file.name} não é um formato de imagem suportado.`);
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
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  async function onSubmit(data: SellRequestInput) {
    setLoading(true);
    try {
      const uploadedUrls: string[] = [];

      // Upload de fotos selecionadas via Server Action centralizada (ImgBB + Fallback Supabase)
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        const uploadResult = await uploadPublicSellRequestImageAction(formData);

        if (uploadResult.success && uploadResult.url) {
          uploadedUrls.push(uploadResult.url);
        } else {
          console.warn('Aviso de falha parcial no upload de foto da proposta:', uploadResult.error);
        }
      }

      const result = await createSellRequestAction({
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        brand: data.brand,
        model: data.model,
        year_manufacture: data.year_manufacture,
        year_model: data.year_model,
        mileage: data.mileage || undefined,
        desired_price: data.desired_price || undefined,
        notes: data.notes || undefined,
        images: uploadedUrls,
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
    } catch (error) {
      toast.error('Não foi possível enviar agora. Verifique os campos e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-[#151515] border border-emerald-500/40 text-[#f4f4f2] p-8 sm:p-10 rounded-3xl text-center space-y-4 shadow-lg">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h3 className="text-2xl font-black text-white font-heading">
          Informações Enviadas com Sucesso!
        </h3>
        <p className="text-sm sm:text-base text-[#a6a6a1] max-w-lg mx-auto leading-relaxed">
          Recebemos os dados e as fotos da sua moto. Nossa equipe vai analisar as informações e
          entrar em contato diretamente pelo seu WhatsApp para conversar sobre as condições do
          anúncio.
        </p>
        <div className="pt-4">
          <Button
            className="bg-[#c9a44c] hover:bg-[#e3c56c] text-[#050505] font-extrabold px-8 h-12 rounded-xl cursor-pointer"
            onClick={() => setSuccess(false)}
          >
            Enviar Outra Moto
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
        {/* Seção 1: Dados de Contato */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#e3c56c] pb-2 border-b border-[#c9a44c]/20">
            1. Seus Dados de Contato
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                    Seu Nome *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Carlos Silva"
                      {...field}
                      className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                    WhatsApp com DDD *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: (11) 99999-9999"
                      {...field}
                      className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control as any}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                  E-mail (opcional)
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="seuemail@exemplo.com"
                    type="email"
                    {...field}
                    className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]"
                  />
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />
        </div>

        {/* Seção 2: Dados da Moto */}
        <div className="space-y-4 pt-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#e3c56c] pb-2 border-b border-[#c9a44c]/20">
            2. Informações da Motocicleta
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                    Marca *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Honda, Yamaha, BMW..."
                      {...field}
                      className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                    Modelo e Versão *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: CB 500F ABS, MT-07..."
                      {...field}
                      className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FormField
              control={form.control as any}
              name="year_manufacture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                    Ano Fab. *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="2022"
                      {...field}
                      className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="year_model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                    Ano Mod. *
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="2023"
                      {...field}
                      className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="mileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                    KM Rodados
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ex: 18000"
                      {...field}
                      className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="desired_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                    Valor Pretendido (R$)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ex: 28000"
                      {...field}
                      className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]"
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control as any}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                  Observações sobre o estado da moto
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Conte sobre acessórios, manutenções recentes, pneus, histórico..."
                    rows={3}
                    {...field}
                    className="bg-[#0d0d0d] border-[#c9a44c]/20 rounded-xl text-white focus-visible:border-[#e3c56c]"
                  />
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />
        </div>

        {/* Seção 3: Upload de Fotos */}
        <div className="space-y-3 pt-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-[#e3c56c] pb-2 border-b border-[#c9a44c]/20">
            3. Fotos da Moto (Até 5 imagens)
          </h3>

          <div className="border-2 border-dashed border-[#c9a44c]/30 hover:border-[#e3c56c] rounded-2xl p-6 text-center bg-[#0d0d0d] transition-colors">
            <input
              type="file"
              id="moto-photos"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
              disabled={loading || selectedFiles.length >= 5}
            />
            <label
              htmlFor="moto-photos"
              className="cursor-pointer flex flex-col items-center justify-center gap-2"
            >
              <UploadCloud className="w-10 h-10 text-[#c9a44c]" />
              <span className="text-sm font-bold text-white">
                Clique para selecionar fotos da moto
              </span>
              <span className="text-xs text-[#a6a6a1]">
                Formatos JPG, PNG ou WebP (Máx: 5MB por foto, até 5 imagens)
              </span>
            </label>
          </div>

          {/* Previews de Imagens */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 pt-2">
              {previews.map((previewUrl, idx) => (
                <div
                  key={idx}
                  className="relative aspect-square rounded-xl overflow-hidden border border-[#c9a44c]/40 bg-[#050505]"
                >
                  <img
                    src={previewUrl}
                    alt={`Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/80 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Botão de Envio com Prevenção de Duplo Clique */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c9a44c] hover:bg-[#e3c56c] text-[#050505] font-black h-13 rounded-xl shadow-[0_0_20px_rgba(201,164,76,0.3)] transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Enviando dados da moto...</span>
              </>
            ) : (
              <span>Enviar dados da minha moto</span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
