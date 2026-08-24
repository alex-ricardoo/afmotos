'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { SiteSettingsFormValues } from '@/components/admin/settings-form';
import { CheckCircle2, AlertCircle, Share2, HelpCircle } from 'lucide-react';
import {
  InstagramIcon,
  FacebookIcon,
  TikTokIcon,
  YouTubeIcon,
} from '@/components/icons/social-icons';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

interface SocialTabProps {
  form: UseFormReturn<SiteSettingsFormValues>;
}

export function SocialTab({ form }: SocialTabProps) {
  const isHttps = (val?: string | null) => {
    if (!val) return false;
    return val.startsWith('https://');
  };

  const instagramUrl = form.watch('settings.socialLinks.instagram');
  const facebookUrl = form.watch('settings.socialLinks.facebook');
  const tiktokUrl = form.watch('settings.socialLinks.tiktok');
  const youtubeUrl = form.watch('settings.socialLinks.youtube');

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[#e3c56c]" />
          <span>Redes Sociais & Canais Oficiais</span>
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Links exibidos dinamicamente no rodapé e canais de divulgação da sua loja. Somente links com HTTPS válidos serão exibidos para os visitantes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Instagram */}
        <div className="rounded-2xl p-4 bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center border border-pink-500/20">
                <InstagramIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Instagram</h4>
                <span className="text-[11px] text-zinc-400">Perfil oficial da loja</span>
              </div>
            </div>
            {isHttps(instagramUrl) ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> Ativo
              </span>
            ) : instagramUrl ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <AlertCircle className="w-3 h-3" /> Requer HTTPS
              </span>
            ) : null}
          </div>

          <FormField
            control={form.control}
            name="settings.socialLinks.instagram"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="https://instagram.com/afmotospe"
                    className="bg-zinc-950 border-zinc-800 text-xs font-mono"
                  />
                </FormControl>
                <FormDescription className="text-[11px] text-zinc-500">
                  Ex: https://instagram.com/afmotospe
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Facebook */}
        <div className="rounded-2xl p-4 bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <FacebookIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Facebook</h4>
                <span className="text-[11px] text-zinc-400">Página oficial</span>
              </div>
            </div>
            {isHttps(facebookUrl) ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> Ativo
              </span>
            ) : facebookUrl ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <AlertCircle className="w-3 h-3" /> Requer HTTPS
              </span>
            ) : null}
          </div>

          <FormField
            control={form.control}
            name="settings.socialLinks.facebook"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="https://facebook.com/afmotos"
                    className="bg-zinc-950 border-zinc-800 text-xs font-mono"
                  />
                </FormControl>
                <FormDescription className="text-[11px] text-zinc-500">
                  Ex: https://facebook.com/afmotos
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* TikTok */}
        <div className="rounded-2xl p-4 bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-zinc-800 text-zinc-300 flex items-center justify-center border border-zinc-700">
                <TikTokIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">TikTok</h4>
                <span className="text-[11px] text-zinc-400">Vídeos e novidades</span>
              </div>
            </div>
            {isHttps(tiktokUrl) ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> Ativo
              </span>
            ) : tiktokUrl ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <AlertCircle className="w-3 h-3" /> Requer HTTPS
              </span>
            ) : null}
          </div>

          <FormField
            control={form.control}
            name="settings.socialLinks.tiktok"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="https://tiktok.com/@afmotos"
                    className="bg-zinc-950 border-zinc-800 text-xs font-mono"
                  />
                </FormControl>
                <FormDescription className="text-[11px] text-zinc-500">
                  Ex: https://tiktok.com/@afmotos
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* YouTube */}
        <div className="rounded-2xl p-4 bg-zinc-900/60 border border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center border border-red-500/20">
                <YouTubeIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">YouTube</h4>
                <span className="text-[11px] text-zinc-400">Canal de vídeos</span>
              </div>
            </div>
            {isHttps(youtubeUrl) ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-3 h-3" /> Ativo
              </span>
            ) : youtubeUrl ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <AlertCircle className="w-3 h-3" /> Requer HTTPS
              </span>
            ) : null}
          </div>

          <FormField
            control={form.control}
            name="settings.socialLinks.youtube"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    {...field}
                    value={field.value || ''}
                    placeholder="https://youtube.com/@afmotos"
                    className="bg-zinc-950 border-zinc-800 text-xs font-mono"
                  />
                </FormControl>
                <FormDescription className="text-[11px] text-zinc-500">
                  Ex: https://youtube.com/@afmotos
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      {/* Nota de boas práticas */}
      <div className="rounded-2xl p-4 bg-zinc-950/60 border border-zinc-800/80 flex items-start gap-3">
        <HelpCircle className="w-4 h-4 text-[#c9a44c] shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-400 space-y-1">
          <p className="font-semibold text-zinc-300">Regras de Exibição das Redes Sociais</p>
          <p>
            Links em branco ou com protocolos não seguros (ex: http://) serão automaticamente ignorados na renderização do rodapé para manter a segurança dos clientes.
          </p>
        </div>
      </div>
    </div>
  );
}
