'use client';

import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ShieldAlert, FileSearch, Sparkles, MessageCircle, AlertTriangle } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VehicleHistoryTabProps {
  form: UseFormReturn<any>;
}

export function VehicleHistoryTab({ form }: VehicleHistoryTabProps) {
  const positioningMode = form.watch('settings.vehicleHistory.positioningMode') || 'COMPETITIVE';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
          <FileSearch className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Histórico Veicular / Consulta Cautelar</h3>
          <p className="text-xs text-zinc-400">
            Configure a landing page pública (/historico-veicular), valores, mensagens de WhatsApp e posicionamento de preço.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Status Switches */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="settings.vehicleHistory.isEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel className="text-base text-white">Serviço Ativo</FormLabel>
                  <FormDescription className="text-zinc-400 text-xs">
                    Habilita a landing page pública e conversão para o WhatsApp.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="settings.vehicleHistory.isPublishedInNav"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel className="text-base text-white">Exibir no Menu e Rodapé</FormLabel>
                  <FormDescription className="text-zinc-400 text-xs">
                    Mostra o link &quot;Histórico Veicular&quot; na navegação do site.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Pricing Block */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
          <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> Precificação e Posicionamento Comercial
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="settings.vehicleHistory.price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Preço da Consulta (R$)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="39.99"
                      {...field}
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      className="bg-zinc-950 border-zinc-800 text-white"
                    />
                  </FormControl>
                  <FormDescription className="text-zinc-400 text-xs">
                    Valor cobrado por cada relatório veicular.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="settings.vehicleHistory.priceLabel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Texto de Apoio ao Preço</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Consulta completa por R$ 39,99"
                      {...field}
                      className="bg-zinc-950 border-zinc-800 text-white"
                    />
                  </FormControl>
                  <FormDescription className="text-zinc-400 text-xs">
                    Frase curta de destaque exibida ao lado do preço.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <FormField
              control={form.control}
              name="settings.vehicleHistory.positioningMode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Modo de Posicionamento</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || 'COMPETITIVE'}>
                    <FormControl>
                      <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                        <SelectValue placeholder="Selecione o posicionamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="COMPETITIVE">Preço acessível / competitivo</SelectItem>
                      <SelectItem value="REGIONAL_BEST">Um dos melhores preços da região</SelectItem>
                      <SelectItem value="SPECIAL_OFFER">Oferta especial</SelectItem>
                      <SelectItem value="CHEAPEST_MARKET">Mais barato do mercado (exige comprovação)</SelectItem>
                      <SelectItem value="CUSTOM">Texto personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-zinc-400 text-xs">
                    Estratégia comercial e jurídica de comunicação.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {positioningMode === 'CUSTOM' && (
              <FormField
                control={form.control}
                name="settings.vehicleHistory.customPositioningText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white">Texto Personalizado</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Condição especial por tempo limitado"
                        {...field}
                        value={field.value || ''}
                        className="bg-zinc-950 border-zinc-800 text-white"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {positioningMode === 'CHEAPEST_MARKET' && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3 mt-3">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Exigência Legal (CDC/CONAR) para Publicidade Comparativa</span>
              </div>
              <p className="text-xs text-zinc-300">
                Para afirmar publicamente que possui o &quot;mais barato do mercado&quot;, é obrigatório registrar a fonte da pesquisa e a data de realização para evitar autuações.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="settings.vehicleHistory.claimEvidenceText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-zinc-200">Fonte da Pesquisa / Escopo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Comparativo de 5 serviços na RMR em Cabo de Santo Agostinho"
                          {...field}
                          value={field.value || ''}
                          className="bg-zinc-950 border-zinc-800 text-white text-xs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="settings.vehicleHistory.claimEvidenceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-zinc-200">Data da Pesquisa (AAAA-MM-DD)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value || ''}
                          className="bg-zinc-950 border-zinc-800 text-white text-xs"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp Configuration Block */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
          <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> Integração com WhatsApp
          </h4>

          <FormField
            control={form.control}
            name="settings.vehicleHistory.whatsappPhoneOverride"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">WhatsApp Exclusivo para Laudos (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 81985901175 (deixe em branco para usar o número principal da loja)"
                    {...field}
                    value={field.value || ''}
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </FormControl>
                <FormDescription className="text-zinc-400 text-xs">
                  Se preenchido, os cliques na landing page abrirão este número específico.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="settings.vehicleHistory.whatsappMessageTemplate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Template da Mensagem com Placa</FormLabel>
                <FormControl>
                  <Textarea
                    rows={3}
                    placeholder="Olá! Quero solicitar o Histórico Veicular da moto com placa {PLATE}. Vi a consulta por {PRICE} no site da {SITE_NAME} e gostaria de saber como pagar e receber o relatório."
                    {...field}
                    value={field.value || ''}
                    className="bg-zinc-950 border-zinc-800 text-white"
                  />
                </FormControl>
                <FormDescription className="text-zinc-400 text-xs">
                  Tags suportadas: <code className="text-amber-400 font-mono">&#123;PLATE&#125;</code>,{' '}
                  <code className="text-amber-400 font-mono">&#123;PRICE&#125;</code>,{' '}
                  <code className="text-amber-400 font-mono">&#123;SITE_NAME&#125;</code>.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Text and Copywriting Block */}
        <div className="p-5 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
          <h4 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" /> Textos da Landing Page
          </h4>

          <div className="grid grid-cols-1 gap-4">
            <FormField
              control={form.control}
              name="settings.vehicleHistory.heroTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Título Principal da Hero</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Antes de comprar uma moto, consulte o histórico veicular."
                      {...field}
                      value={field.value || ''}
                      className="bg-zinc-950 border-zinc-800 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="settings.vehicleHistory.heroSubtitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Subtítulo da Hero</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Com apenas a placa, você recebe um relatório completo para analisar restrições, leilão, roubo/furto, gravames, débitos, recall e muito mais."
                      {...field}
                      value={field.value || ''}
                      className="bg-zinc-950 border-zinc-800 text-white"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="settings.vehicleHistory.disclaimerText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white">Texto Legal de Limitações e Transparência</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="O relatório reúne informações disponibilizadas pelas bases consultadas na data da consulta. Ele ajuda na análise do veículo, mas não substitui vistoria mecânica, conferência de documentos ou avaliação física."
                      {...field}
                      value={field.value || ''}
                      className="bg-zinc-950 border-zinc-800 text-white"
                    />
                  </FormControl>
                  <FormDescription className="text-zinc-400 text-xs">
                    Exibido na seção de transparência para proteção jurídica da loja.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
