'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { saveSettingsAction } from '@/lib/actions/settings';
import { toast } from 'sonner';
import { CONSTANTS } from '@/lib/utils/constants';
import {
  Store,
  Phone,
  MapPin,
  Clock,
  Share2,
  FileText,
  Search,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  Sparkles,
  Info,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { IdentityTab } from './settings/identity-tab';
import { ContactTab } from './settings/contact-tab';
import { AddressTab } from './settings/address-tab';
import { HoursTab } from './settings/hours-tab';
import { SocialTab } from './settings/social-tab';
import { ContentTab } from './settings/content-tab';
import { SeoTab } from './settings/seo-tab';
import { AboutTab } from './settings/about-tab';
import { aboutSettingsSchema } from '@/lib/settings/schema';

const settingsSchema = z.object({
  id: z.string().optional(),
  site_name: z.string().min(2, 'Nome da loja é obrigatório'),
  whatsapp_phone: z.string().min(10, 'WhatsApp é obrigatório'),
  contact_email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  address: z.string().optional().nullable(),
  settings: z.object({
    shortName: z.string().optional(),
    slogan: z.string().optional(),
    description: z.string().optional(),
    branding: z
      .object({
        logoProvider: z.enum(['local', 'imgbb', 'supabase']).optional(),
        logoUrl: z.string().optional().nullable(),
        logoPath: z.string().optional().nullable(),
        faviconProvider: z.enum(['local', 'imgbb', 'supabase']).optional(),
        faviconUrl: z.string().optional().nullable(),
        faviconPath: z.string().optional().nullable(),
      })
      .optional(),
    address: z
      .object({
        cep: z.string().optional(),
        street: z.string().optional(),
        number: z.string().optional(),
        complement: z.string().optional(),
        neighborhood: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        country: z.string().optional(),
        mapsUrl: z.string().optional().nullable(),
      })
      .optional(),
    socialLinks: z
      .object({
        instagram: z.string().optional().nullable(),
        facebook: z.string().optional().nullable(),
        tiktok: z.string().optional().nullable(),
        youtube: z.string().optional().nullable(),
      })
      .optional(),
    businessHours: z.record(z.string(), z.any()).optional(),
    publicContent: z
      .object({
        heroTitle: z.string().optional(),
        heroSubtitle: z.string().optional(),
        aboutText: z.string().optional(),
        footerText: z.string().optional(),
        whatsappMessage: z.string().optional(),
        commercialNotice: z.string().optional(),
      })
      .optional(),
    seo: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        ogImageUrl: z.string().optional().nullable(),
        canonicalUrl: z.string().optional().nullable(),
      })
      .optional(),
    about: aboutSettingsSchema.optional(),
    // Chaves legadas
    short_name: z.string().optional(),
    institutional_description: z.string().optional(),
    logo_path: z.string().optional(),
    favicon_path: z.string().optional(),
    instagram_url: z.string().optional(),
    facebook_url: z.string().optional(),
    tiktok_url: z.string().optional(),
    youtube_url: z.string().optional(),
  }),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
export type SiteSettingsFormValues = SettingsFormValues;

export interface SettingsFormProps {
  initialData?: any;
}

const TABS = [
  { id: 'identity', label: 'Identidade', icon: Store },
  { id: 'contact', label: 'Contato', icon: Phone },
  { id: 'address', label: 'Endereço & Maps', icon: MapPin },
  { id: 'hours', label: 'Horários', icon: Clock },
  { id: 'social', label: 'Redes Sociais', icon: Share2 },
  { id: 'content', label: 'Conteúdo', icon: FileText },
  { id: 'about', label: 'Sobre a Loja', icon: Info },
  { id: 'seo', label: 'SEO & Buscas', icon: Search },
] as const;

export function SettingsForm({ initialData }: SettingsFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['id']>('identity');
  const [loading, setLoading] = useState(false);

  const rawSettings = initialData?.settings || {};

  const defaultValues: SettingsFormValues = {
    id: initialData?.id || undefined,
    site_name: initialData?.site_name || CONSTANTS.STORE_NAME,
    whatsapp_phone: initialData?.whatsapp_phone || '',
    contact_email: initialData?.contact_email || '',
    address: initialData?.address || '',
    settings: {
      shortName: rawSettings.shortName || rawSettings.short_name || CONSTANTS.STORE_NAME,
      slogan: rawSettings.slogan || '',
      description: rawSettings.description || rawSettings.institutional_description || '',
      branding: {
        logoProvider: rawSettings.branding?.logoProvider || 'imgbb',
        logoUrl: rawSettings.branding?.logoUrl || rawSettings.logo_path || '',
        logoPath: rawSettings.branding?.logoPath || '',
        faviconProvider: rawSettings.branding?.faviconProvider || 'imgbb',
        faviconUrl: rawSettings.branding?.faviconUrl || rawSettings.favicon_path || '',
        faviconPath: rawSettings.branding?.faviconPath || '',
      },
      address: {
        cep: rawSettings.address?.cep || '',
        street: rawSettings.address?.street || '',
        number: rawSettings.address?.number || '',
        complement: rawSettings.address?.complement || '',
        neighborhood: rawSettings.address?.neighborhood || '',
        city: rawSettings.address?.city || '',
        state: rawSettings.address?.state || '',
        country: rawSettings.address?.country || 'Brasil',
        mapsUrl: rawSettings.address?.mapsUrl || '',
      },
      socialLinks: {
        instagram: rawSettings.socialLinks?.instagram || rawSettings.instagram_url || '',
        facebook: rawSettings.socialLinks?.facebook || rawSettings.facebook_url || '',
        tiktok: rawSettings.socialLinks?.tiktok || rawSettings.tiktok_url || '',
        youtube: rawSettings.socialLinks?.youtube || rawSettings.youtube_url || '',
      },
      businessHours: rawSettings.businessHours || {
        monday: { isOpen: true, periods: [{ opensAt: '08:00', closesAt: '18:00' }] },
        tuesday: { isOpen: true, periods: [{ opensAt: '08:00', closesAt: '18:00' }] },
        wednesday: { isOpen: true, periods: [{ opensAt: '08:00', closesAt: '18:00' }] },
        thursday: { isOpen: true, periods: [{ opensAt: '08:00', closesAt: '18:00' }] },
        friday: { isOpen: true, periods: [{ opensAt: '08:00', closesAt: '18:00' }] },
        saturday: { isOpen: true, periods: [{ opensAt: '08:00', closesAt: '13:00' }] },
        sunday: { isOpen: false, periods: [] },
      },
      publicContent: {
        heroTitle: rawSettings.publicContent?.heroTitle || '',
        heroSubtitle: rawSettings.publicContent?.heroSubtitle || '',
        aboutText: rawSettings.publicContent?.aboutText || '',
        footerText: rawSettings.publicContent?.footerText || '',
        whatsappMessage: rawSettings.publicContent?.whatsappMessage || '',
        commercialNotice: rawSettings.publicContent?.commercialNotice || '',
      },
      seo: {
        title: rawSettings.seo?.title || '',
        description: rawSettings.seo?.description || '',
        ogImageUrl: rawSettings.seo?.ogImageUrl || '',
        canonicalUrl: rawSettings.seo?.canonicalUrl || '',
      },
      about: rawSettings.about || {
        isPublished: false,
        heroTitle: '',
        heroSubtitle: '',
        description: '',
        additionalText: '',
        storeImage: {
          provider: 'supabase',
          url: '',
          isActive: true,
        },
        differentials: [],
        location: {
          mapsUrl: '',
          instructions: '',
        },
        seo: {
          title: '',
          description: '',
          ogImageUrl: '',
        },
      },
      // Compatibilidade legada
      short_name: rawSettings.short_name || rawSettings.shortName || '',
      institutional_description: rawSettings.institutional_description || rawSettings.description || '',
      logo_path: rawSettings.logo_path || rawSettings.branding?.logoUrl || '',
      favicon_path: rawSettings.favicon_path || rawSettings.branding?.faviconUrl || '',
      instagram_url: rawSettings.instagram_url || rawSettings.socialLinks?.instagram || '',
      facebook_url: rawSettings.facebook_url || rawSettings.socialLinks?.facebook || '',
      tiktok_url: rawSettings.tiktok_url || rawSettings.socialLinks?.tiktok || '',
      youtube_url: rawSettings.youtube_url || rawSettings.socialLinks?.youtube || '',
    },
  };

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema) as any,
    defaultValues,
  });

  const { isDirty } = form.formState;

  async function onSubmit(data: SettingsFormValues) {
    setLoading(true);

    try {
      // Monta texto plano do endereço se os campos estruturados existirem
      const addrObj = data.settings.address;
      let computedAddress = data.address;
      if (addrObj?.street || addrObj?.city) {
        const parts = [
          addrObj.street,
          addrObj.number,
          addrObj.complement,
          addrObj.neighborhood,
          addrObj.city && addrObj.state ? `${addrObj.city} - ${addrObj.state}` : addrObj.city,
          addrObj.cep,
        ].filter(Boolean);
        if (parts.length > 0) {
          computedAddress = parts.join(', ');
        }
      }

      // Sincroniza chaves legadas e novas
      const payload = {
        id: data.id,
        site_name: data.site_name,
        whatsapp_phone: data.whatsapp_phone,
        contact_email: data.contact_email || null,
        address: computedAddress || null,
        settings: {
          ...data.settings,
          short_name: data.settings.shortName,
          institutional_description: data.settings.description,
          logo_path: data.settings.branding?.logoUrl || data.settings.logo_path,
          favicon_path: data.settings.branding?.faviconUrl || data.settings.favicon_path,
          instagram_url: data.settings.socialLinks?.instagram,
          facebook_url: data.settings.socialLinks?.facebook,
          tiktok_url: data.settings.socialLinks?.tiktok,
          youtube_url: data.settings.socialLinks?.youtube,
        },
      };

      const result = await saveSettingsAction(payload as any);

      if (result.error) {
        toast.error('Erro ao salvar configurações', {
          description: result.error,
        });
      } else {
        toast.success('Configurações salvas com sucesso!');
        form.reset(data);
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
      {/* Barra de Abas / Navegação de Categorias */}
      <div className="bg-zinc-950/80 border border-zinc-800/80 rounded-2xl p-1.5 shadow-md backdrop-blur-md">
        <nav className="flex flex-wrap items-center gap-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex-1 min-w-[120px] sm:min-w-[130px] flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer select-none whitespace-nowrap',
                  isActive
                    ? 'bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] text-zinc-950 shadow-md shadow-amber-500/10 font-bold'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60',
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-zinc-950' : 'text-zinc-400')} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Formulário Principal */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-5 sm:p-8 shadow-xl backdrop-blur-xl">
            {activeTab === 'identity' && <IdentityTab form={form} />}
            {activeTab === 'contact' && <ContactTab form={form} />}
            {activeTab === 'address' && <AddressTab form={form} />}
            {activeTab === 'hours' && <HoursTab form={form} />}
            {activeTab === 'social' && <SocialTab form={form} />}
            {activeTab === 'content' && <ContentTab form={form} />}
            {activeTab === 'about' && <AboutTab form={form} />}
            {activeTab === 'seo' && <SeoTab form={form} />}
          </div>

          {/* Barra Fixa / Inferior de Ações */}
          <div className="sticky bottom-4 z-30 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              {isDirty ? (
                <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                  <Sparkles className="w-4 h-4" />
                  <span>Você possui alterações não salvas</span>
                </span>
              ) : (
                <span>Todas as configurações estão sincronizadas</span>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
                className="w-full sm:w-auto border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 h-11 px-5 rounded-xl cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span>Voltar</span>
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-zinc-950 font-extrabold px-7 h-11 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Salvar Configurações</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
