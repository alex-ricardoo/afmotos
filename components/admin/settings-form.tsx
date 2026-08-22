'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { saveSettingsAction } from '@/lib/actions/settings';
import { toast } from 'sonner';

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

  // Flatten the initial data from the DB so it matches the form schema
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
          description: result.error
        });
      } else {
        toast.success('Configurações salvas com sucesso');
        router.refresh();
      }
    } catch (error) {
      console.error(error);
      toast.error('Ocorreu um erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Identidade da Loja</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control as any}
                name="site_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Loja</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: AF Motos" {...field} />
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
                    <FormLabel>Nome Curto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: AF Motos" {...field} />
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
                    <FormLabel>Slogan</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Locações e vendas" {...field} />
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
                    <FormLabel>Descrição Institucional</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Escreva sobre a loja..." 
                        rows={4}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Contato e Endereço</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control as any}
                name="whatsapp_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 5511999999999" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail de Contato</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: contato@afmotos.com.br" {...field} />
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
                    <FormLabel>Endereço Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, Número, Bairro, Cidade - Estado" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Redes Sociais</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control as any}
                name="instagram_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instagram (URL)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://instagram.com/..." {...field} />
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
                    <FormLabel>Facebook (URL)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://facebook.com/..." {...field} />
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
                    <FormLabel>TikTok (URL)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://tiktok.com/..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#c9a44c] hover:bg-[#b8943c] text-black font-semibold" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
