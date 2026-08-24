'use client';

import React, { useRef, useState } from 'react';
import Image from 'next/image';
import { UseFormReturn } from 'react-hook-form';
import { Store, Upload, Trash2, Loader2, Sparkles, Image as ImageIcon } from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { uploadSiteBrandingAction } from '@/lib/actions/settings';
import { compressImage } from '@/lib/utils/image-compression';

interface IdentityTabProps {
  form: UseFormReturn<any>;
}

export function IdentityTab({ form }: IdentityTabProps) {
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const logoUrl = form.watch('settings.branding.logoUrl') || form.watch('settings.logo_path');
  const faviconUrl = form.watch('settings.branding.faviconUrl') || form.watch('settings.favicon_path');

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'favicon',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'logo') setUploadingLogo(true);
    else setUploadingFavicon(true);

    try {
      let fileToUpload = file;
      if (type === 'logo') {
        const { file: compressed } = await compressImage(file, {
          maxDimension: 800,
          quality: 0.90,
          preserveTransparency: true,
          outputFormat: 'auto',
        });
        fileToUpload = compressed;
      } else if (type === 'favicon') {
        const { file: compressed } = await compressImage(file, {
          maxDimension: 128,
          quality: 0.95,
          preserveTransparency: true,
          outputFormat: 'auto',
        });
        fileToUpload = compressed;
      }

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('type', type);

      const res = await uploadSiteBrandingAction(formData);

      if (!res.success || !res.url) {
        toast.error(res.error || `Erro ao carregar ${type}`);
      } else {
        if (type === 'logo') {
          form.setValue('settings.branding.logoUrl', res.url, { shouldDirty: true });
          form.setValue('settings.branding.logoProvider', res.provider || 'imgbb', {
            shouldDirty: true,
          });
          form.setValue('settings.logo_path', res.url, { shouldDirty: true });
          toast.success('Logotipo da loja atualizado com sucesso!');
        } else {
          form.setValue('settings.branding.faviconUrl', res.url, { shouldDirty: true });
          form.setValue('settings.branding.faviconProvider', res.provider || 'imgbb', {
            shouldDirty: true,
          });
          form.setValue('settings.favicon_path', res.url, { shouldDirty: true });
          toast.success('Favicon atualizado com sucesso!');
        }
      }
    } catch (err: any) {
      toast.error('Falha de conexão no upload.');
      console.error(err);
    } finally {
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingFavicon(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeLogo = () => {
    form.setValue('settings.branding.logoUrl', '', { shouldDirty: true });
    form.setValue('settings.logo_path', '', { shouldDirty: true });
    toast.info('Logotipo removido. O site utilizará a logo padrão.');
  };

  const removeFavicon = () => {
    form.setValue('settings.branding.faviconUrl', '', { shouldDirty: true });
    form.setValue('settings.favicon_path', '', { shouldDirty: true });
    toast.info('Favicon removido.');
  };

  return (
    <div className="space-y-6">
      {/* Header da Seção */}
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
          <Store className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Identidade da Loja & Marca</h3>
          <p className="text-xs text-zinc-400">
            Configure o nome oficial, logotipo, slogan e identidade visual da sua loja.
          </p>
        </div>
      </div>

      {/* Upload de Logotipo e Favicon */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-zinc-950/60 p-5 rounded-2xl border border-zinc-800/80">
        {/* LOGO */}
        <div className="space-y-3">
          <FormLabel className="text-zinc-300 font-semibold text-xs sm:text-sm flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-400" />
            <span>Logotipo Principal da Loja</span>
          </FormLabel>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Preview Box */}
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-zinc-900 border-2 border-amber-500/30 flex items-center justify-center shrink-0 shadow-md">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt="Preview da Logo"
                  fill
                  className="object-contain p-1"
                  unoptimized
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-zinc-600">
                  <Store className="w-8 h-8 opacity-40 text-amber-500/40" />
                  <span className="text-[10px] mt-1 text-zinc-500">Padrão</span>
                </div>
              )}
            </div>

            {/* Ações */}
            <div className="space-y-2 flex-1 w-full sm:w-auto">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'logo')}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingLogo}
                  onClick={() => logoInputRef.current?.click()}
                  className="border-amber-500/30 bg-zinc-900 text-amber-400 hover:bg-amber-500/10 cursor-pointer h-9"
                >
                  {uploadingLogo ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      <span>{logoUrl ? 'Alterar Logo' : 'Enviar Logo'}</span>
                    </>
                  )}
                </Button>

                {logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeLogo}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 cursor-pointer h-9"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    <span>Remover</span>
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-zinc-500">
                Formatos recomendados: PNG ou WebP com fundo transparente (quadrada ou circular).
              </p>
            </div>
          </div>
        </div>

        {/* FAVICON */}
        <div className="space-y-3">
          <FormLabel className="text-zinc-300 font-semibold text-xs sm:text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Ícone do Navegador (Favicon)</span>
          </FormLabel>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Preview Box */}
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0 shadow-sm">
              {faviconUrl ? (
                <Image
                  src={faviconUrl}
                  alt="Favicon"
                  fill
                  className="object-contain p-1.5"
                  unoptimized
                />
              ) : (
                <span className="text-[10px] text-zinc-500">32x32</span>
              )}
            </div>

            {/* Ações */}
            <div className="space-y-2 flex-1 w-full sm:w-auto">
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/png,image/x-icon,image/svg+xml"
                className="hidden"
                onChange={(e) => handleFileUpload(e, 'favicon')}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingFavicon}
                  onClick={() => faviconInputRef.current?.click()}
                  className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 cursor-pointer h-9"
                >
                  {uploadingFavicon ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      <span>{faviconUrl ? 'Alterar Favicon' : 'Enviar Favicon'}</span>
                    </>
                  )}
                </Button>

                {faviconUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFavicon}
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 cursor-pointer h-9"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    <span>Remover</span>
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-zinc-500">
                Ícone pequeno (PNG ou ICO) exibido na aba do navegador.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Campos de Nome e Slogan */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormField
          control={form.control}
          name="site_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">
                Nome Principal da Loja <span className="text-rose-500">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: AF Motos"
                  {...field}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="settings.shortName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">
                Nome Abreviado (Exibição Compacta)
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: AF Motos"
                  {...field}
                  value={field.value || ''}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="settings.slogan"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">
                Slogan Comercial
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Compra e venda de motos com confiança"
                  {...field}
                  value={field.value || ''}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="settings.description"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">
                Descrição Institucional Curta
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Apresente sua concessionária, diferenciais, tradição e atendimento..."
                  rows={3}
                  {...field}
                  value={field.value || ''}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 rounded-xl focus:border-amber-500 text-sm leading-relaxed p-3.5"
                />
              </FormControl>
              <FormDescription className="text-[11px] text-zinc-500">
                Texto exibido no rodapé e em cartões institucionais do site público.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
