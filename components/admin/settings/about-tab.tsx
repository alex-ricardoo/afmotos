'use client';

import React from 'react';
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Info, Image as ImageIcon, MapPin, Plus, Trash2, GripVertical, Settings } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { SiteImageUploader } from './site-image-uploader';

interface AboutTabProps {
  form: UseFormReturn<any>;
}

export function AboutTab({ form }: AboutTabProps) {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'settings.about.differentials',
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
          <Info className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Sobre a Loja</h3>
          <p className="text-xs text-zinc-400">
            Gerencie o conteúdo institucional, foto da loja, diferenciais e localização da página /sobre.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <FormField
          control={form.control}
          name="settings.about.isPublished"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel className="text-base text-white">Página Publicada</FormLabel>
                <FormDescription className="text-zinc-400">
                  Deixe marcado para exibir a página /sobre no site.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="settings.about.heroTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">
                  Título da Hero <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Nossa História"
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
            name="settings.about.heroSubtitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">
                  Subtítulo da Hero
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Conheça a AF Motos"
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
            name="settings.about.description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">
                  Texto Principal <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Escreva sobre a loja..."
                    rows={4}
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
            name="settings.about.additionalText"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">
                  Texto Adicional (Opcional)
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Informações complementares..."
                    rows={2}
                    {...field}
                    value={field.value || ''}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 rounded-xl focus:border-amber-500 text-sm leading-relaxed p-3.5"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="pt-6 border-t border-zinc-800">
        <h4 className="text-md font-bold text-white flex items-center gap-2 mb-4">
          <ImageIcon className="w-4 h-4 text-amber-400" />
          Imagem da Loja
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="settings.about.storeImages"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">
                  Galeria de Imagens (até 5 fotos)
                </FormLabel>
                <FormControl>
                  <SiteImageUploader
                    images={field.value || []}
                    onImagesChange={field.onChange}
                    maxImages={5}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <div className="pt-6 border-t border-zinc-800">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-bold text-white flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-400" />
            Diferenciais
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                id: crypto.randomUUID(),
                title: 'Novo Diferencial',
                description: '',
                icon: 'CheckCircle',
                isActive: true,
                sortOrder: fields.length,
              })
            }
            className="border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>
        
        <div className="space-y-4">
          {fields.map((item, index) => (
            <div key={item.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex gap-4 items-start">
              <div className="mt-2 text-zinc-500 cursor-move">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`settings.about.differentials.${index}.title`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400 text-xs">Título</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`settings.about.differentials.${index}.icon`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400 text-xs">Ícone (Nome Lucide)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`settings.about.differentials.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel className="text-zinc-400 text-xs">Descrição</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          className="bg-zinc-950 border-zinc-800 text-zinc-100 h-9"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="mt-8 flex flex-col gap-2">
                <FormField
                  control={form.control}
                  name={`settings.about.differentials.${index}.isActive`}
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-amber-500"
                        />
                      </FormControl>
                      <FormLabel className="text-zinc-400 text-xs cursor-pointer">Ativo</FormLabel>
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-8 px-2"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {fields.length === 0 && (
            <p className="text-center text-zinc-500 text-sm py-4">
              Nenhum diferencial cadastrado.
            </p>
          )}
        </div>
      </div>

      <div className="pt-6 border-t border-zinc-800">
        <h4 className="text-md font-bold text-white flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-amber-400" />
          Localização & Mapa
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="settings.about.location.latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">
                  Latitude
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Ex: -23.55052"
                    {...field}
                    value={field.value || ''}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500 text-sm"
                  />
                </FormControl>
                <FormDescription className="text-xs text-zinc-500">
                  Preencha para habilitar o mapa interativo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="settings.about.location.longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">
                  Longitude
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Ex: -46.63330"
                    {...field}
                    value={field.value || ''}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 h-11 rounded-xl focus:border-amber-500 text-sm"
                  />
                </FormControl>
                <FormDescription className="text-xs text-zinc-500">
                  Preencha para habilitar o mapa interativo.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="settings.about.location.instructions"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel className="text-zinc-300 font-medium text-xs sm:text-sm">
                  Como Chegar (Instruções Adicionais)
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ponto de referência, dicas de estacionamento..."
                    rows={2}
                    {...field}
                    value={field.value || ''}
                    className="bg-zinc-950 border-zinc-800 text-zinc-100 rounded-xl focus:border-amber-500 text-sm leading-relaxed p-3.5"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>



    </div>
  );
}
