'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { saveSettingsAction } from '@/lib/actions/settings';
import { toast } from 'sonner';
import {
  Store,
  Phone,
  MapPin,
  Mail,
  Globe,
  Share2,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';

const settingsSchema = z.object({
  id: z.string().optional(),
  site_name: z.string().min(2, 'Nome da loja é obrigatório'),
  whatsapp_phone: z.string().min(10, 'WhatsApp é obrigatório'),
  contact_email: z.string().email('E-mail inválido'),
  address: z.string().optional(),
  short_name: z.string().optional(),
  slogan: z.string().optional(),
  institutional_description: z.string().optional(),
  logo_path: z.string().optional(),
  favicon_path: z.string().optional(),
  instagram_url: z.string().url('URL inválida').optional().or(z.literal('')),
  facebook_url: z.string().url('URL inválida').optional().or(z.literal('')),
  tiktok_url: z.string().url('URL inválida').optional().or(z.literal('')),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface SettingsFormProps {
  initialData?: any;
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const defaultValues: SettingsFormValues = {
    id: initialData?.id || undefined,
    site_name: initialData?.site_name || '',
    whatsapp_phone: initialData?.whatsapp_phone || '',
    contact_email: initialData?.contact_email || '',
    address: initialData?.address || '',
    short_name: initialData?.settings?.short_name || '',
    slogan: initialData?.settings?.slogan || '',
    institutional_description: initialData?.settings?.institutional_description || '',
    logo_path: initialData?.settings?.logo_path || '',
    favicon_path: initialData?.settings?.favicon_path || '',
    instagram_url: initialData?.settings?.instagram_url || '',
    facebook_url: initialData?.settings?.facebook_url || '',
    tiktok_url: initialData?.settings?.tiktok_url || '',
  };

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues,
  });

  async function onSubmit(data: SettingsFormValues) {
    setLoading(true);

    try {
      const result = await saveSettingsAction(data);

      if (result.error) {
        toast.error('Erro ao salvar configurações', {
          description: result.error,
        });
      } else {
        toast.success('Configurações salvas com sucesso!');
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error('Ocorreu um erro inesperado ao salvar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 pb-24">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
          
          {/* SEÇÃO 1: IDENTIDADE DA LOJA */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Identidade da Loja</h2>
                <p className="text-xs text-slate-400">
                  Defina o nome oficial, slogan e a história institucional da AF Motos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField
                control={form.control as any}
                name="site_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 font-medium text-xs sm:text-sm">
                      Nome Principal da Loja <span className="text-rose-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: AF Motos"
                        {...field}
                        className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="short_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 font-medium text-xs sm:text-sm">
                      Nome Abreviado
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: AF Motos"
                        {...field}
                        className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="slogan"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-slate-300 font-medium text-xs sm:text-sm">
                      Slogan Comercial
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Locações e Vendas de Motocicletas com Confiança"
                        {...field}
                        className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="institutional_description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-slate-300 font-medium text-xs sm:text-sm">
                      Descrição Institucional
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Apresente sua concessionária, diferenciais, tradição e atendimento..."
                        rows={4}
                        {...field}
                        className="bg-slate-950 border-slate-800 text-slate-200 rounded-xl focus:border-amber-500 text-sm leading-relaxed p-4"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* SEÇÃO 2: CONTATO & LOCALIZAÇÃO */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Canais de Contato & Localização</h2>
                <p className="text-xs text-slate-400">
                  Esses dados alimentam os botões de atendimento via WhatsApp e rodapé do site.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <FormField
                control={form.control as any}
                name="whatsapp_phone"
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 font-medium text-xs sm:text-sm">
                      Telefone / WhatsApp Comercial <span className="text-rose-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(11) 99999-9999"
                        {...fieldProps}
                        value={value || ''}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                          if (digits.length <= 10) {
                            onChange(digits.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3'));
                          } else {
                            onChange(digits.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3'));
                          }
                        }}
                        className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl font-mono focus:border-amber-500"
                      />
                    </FormControl>
                    <FormDescription className="text-[11px] text-slate-500">
                      Utilizado nos redirecionamentos para conversa do WhatsApp.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 font-medium text-xs sm:text-sm">
                      E-mail Oficial <span className="text-rose-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="contato@afmotos.com.br"
                        {...field}
                        className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-slate-300 font-medium text-xs sm:text-sm">
                      Endereço da Loja Física
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Av. Principal, 1000 - Bairro, Cidade - Estado"
                        {...field}
                        className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* SEÇÃO 3: REDES SOCIAIS */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Redes Sociais & Links Oficiais</h2>
                <p className="text-xs text-slate-400">
                  Links diretos exibidos no topo e rodapé da plataforma.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <FormField
                control={form.control as any}
                name="instagram_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 font-medium text-xs sm:text-sm">
                      Instagram URL
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://instagram.com/afmotos"
                        {...field}
                        className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500 text-xs"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="facebook_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 font-medium text-xs sm:text-sm">
                      Facebook URL
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://facebook.com/afmotos"
                        {...field}
                        className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500 text-xs"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control as any}
                name="tiktok_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300 font-medium text-xs sm:text-sm">
                      TikTok URL
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://tiktok.com/@afmotos"
                        {...field}
                        className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500 text-xs"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* BARRA DE AÇÕES INFERIOR */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="w-full sm:w-auto border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800 h-12 px-6 rounded-xl cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Voltar</span>
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-8 h-12 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Salvando Alterações...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Salvar Configurações da Loja</span>
                </>
              )}
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
}
