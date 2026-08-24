'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Globe, Search, Share2 } from 'lucide-react';
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

import { CONSTANTS } from '@/lib/utils/constants';

interface SeoTabProps {
  form: UseFormReturn<any>;
}

export function SeoTab({ form }: SeoTabProps) {
  const currentSiteName = form.watch('site_name') || CONSTANTS.STORE_NAME;
  const metaTitle = form.watch('settings.seo.title') || currentSiteName;
  const metaDescription =
    form.watch('settings.seo.description') ||
    form.watch('settings.description') ||
    `Encontre motos selecionadas para compra ou anúncio na ${currentSiteName}.`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
          <Search className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">SEO & Otimização para Buscadores</h3>
          <p className="text-xs text-zinc-400">
            Configure títulos, descrições meta e imagem de compartilhamento para Google e redes sociais.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormField
          control={form.control}
          name="settings.seo.title"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">
                Título Padrão (Meta Title)
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="AF Motos | Compra e Venda de Motos"
                  {...field}
                  value={field.value || ''}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500 text-sm"
                />
              </FormControl>
              <FormDescription className="text-[11px] text-zinc-500">
                Título exibido nos resultados de busca do Google e na aba do navegador.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="settings.seo.description"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">
                Descrição Meta (Meta Description)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva sua loja em até 160 caracteres para os resultados de busca..."
                  rows={3}
                  {...field}
                  value={field.value || ''}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 rounded-xl focus:border-amber-500 text-sm leading-relaxed p-3.5"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="settings.seo.ogImageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-amber-400" />
                <span>Imagem Open Graph (URL)</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="https://..."
                  {...field}
                  value={field.value || ''}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500 text-sm"
                />
              </FormControl>
              <FormDescription className="text-[11px] text-zinc-500">
                Imagem exibida ao compartilhar o link do site no WhatsApp / Facebook.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="settings.seo.canonicalUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-amber-400" />
                <span>URL Canônica Base</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="https://aflocacoesevendas.com.br"
                  {...field}
                  value={field.value || ''}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500 text-sm"
                />
              </FormControl>
              <FormDescription className="text-[11px] text-zinc-500">
                Domínio principal de produção do site.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Preview no Google */}
      <div className="bg-zinc-950/70 border border-zinc-800 p-5 rounded-2xl space-y-2">
        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
          Preview de Busca (Google Snippet)
        </span>
        <div className="space-y-1">
          <span className="text-xs text-emerald-400 font-mono block">https://aflocacoesevendas.com.br</span>
          <h4 className="text-base text-[#8ab4f8] font-medium hover:underline cursor-pointer">
            {metaTitle}
          </h4>
          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
            {metaDescription}
          </p>
        </div>
      </div>
    </div>
  );
}
