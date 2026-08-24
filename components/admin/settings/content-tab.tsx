'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FileText, Layout, MessageSquare, AlertCircle } from 'lucide-react';
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

interface ContentTabProps {
  form: UseFormReturn<any>;
}

export function ContentTab({ form }: ContentTabProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Conteúdo Público & Textos do Site</h3>
          <p className="text-xs text-zinc-400">
            Personalize as mensagens institucionais, chamadas da Hero e avisos comerciais.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormField
          control={form.control}
          name="settings.publicContent.heroTitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm flex items-center gap-2">
                <Layout className="w-4 h-4 text-amber-400" />
                <span>Título Principal da Hero (Início)</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Encontre sua próxima moto"
                  {...field}
                  value={field.value || ''}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="settings.publicContent.heroSubtitle"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">
                Subtítulo da Hero
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Veja as motos disponíveis ou anuncie a sua com a AF Motos."
                  {...field}
                  value={field.value || ''}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="settings.publicContent.whatsappMessage"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span>Mensagem Padrão do WhatsApp (Botão Flutuante)</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Olá! Gostaria de falar com a equipe da AF Motos."
                  {...field}
                  value={field.value || ''}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500 text-sm"
                />
              </FormControl>
              <FormDescription className="text-[11px] text-zinc-500">
                Texto inicial que será preenchido quando o visitante clicar no botão de WhatsApp geral do site.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="settings.publicContent.aboutText"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">
                Texto Sobre a Concessionária
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva a história, seriedade e diferenciais da loja..."
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
          name="settings.publicContent.commercialNotice"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                <span>Aviso Comercial / Nota de Rodapé</span>
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Visitação e checagem de motos disponíveis com agendamento prévio."
                  {...field}
                  value={field.value || ''}
                  className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
