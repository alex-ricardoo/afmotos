'use client';

import React, { useState, useRef, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  DollarSign,
  Sparkles,
  FileText,
  MessageCircle,
  CheckCircle2,
  Check,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  Globe,
  Flame,
  Save,
} from 'lucide-react';

import { vehicleHistorySettingsSchema } from '@/lib/settings/schema';
import { saveVehicleHistorySettingsAction } from '@/lib/actions/settings';
import { SiteSettingsRecord } from '@/types/site-settings';
import { getVehicleHistorySettings } from '@/lib/site-settings';
import { VehicleHistoryPricingCard } from '@/components/admin/settings/vehicle-history-pricing-card';

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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type FormValues = z.infer<typeof vehicleHistorySettingsSchema>;

interface VehicleHistorySettingsWizardProps {
  initialSettings?: SiteSettingsRecord | null;
}

const WIZARD_STEPS = [
  {
    id: 1,
    label: 'Ativação & Preço',
    icon: DollarSign,
    description: 'Valores, margem e status',
  },
  {
    id: 2,
    label: 'Posicionamento',
    icon: Sparkles,
    description: 'Estratégia comercial & CDC',
  },
  {
    id: 3,
    label: 'Página de Vendas',
    icon: FileText,
    description: 'Hero, subtítulo e legal',
  },
  {
    id: 4,
    label: 'WhatsApp & Tags',
    icon: MessageCircle,
    description: 'Atendimento e mensagens',
  },
] as const;

export function VehicleHistorySettingsWizard({
  initialSettings,
}: VehicleHistorySettingsWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isPending, startTransition] = useTransition();

  const siteName = initialSettings?.site_name || 'AF Veículos PE';
  const resolvedDefaults = getVehicleHistorySettings(initialSettings);

  const form = useForm<FormValues>({
    resolver: zodResolver(vehicleHistorySettingsSchema) as any,
    defaultValues: {
      isEnabled: resolvedDefaults.isEnabled,
      price: resolvedDefaults.price,
      currency: resolvedDefaults.currency,
      priceLabel: resolvedDefaults.priceLabel,
      positioningMode: resolvedDefaults.positioningMode,
      customPositioningText: resolvedDefaults.customPositioningText || '',
      claimEvidenceText: resolvedDefaults.claimEvidenceText || '',
      claimEvidenceDate: resolvedDefaults.claimEvidenceDate || '',
      whatsappPhoneOverride: resolvedDefaults.whatsappPhoneOverride || '',
      whatsappMessageTemplate: resolvedDefaults.whatsappMessageTemplate,
      heroTitle: resolvedDefaults.heroTitle,
      heroSubtitle: resolvedDefaults.heroSubtitle,
      disclaimerText: resolvedDefaults.disclaimerText,
      isPublishedInNav: resolvedDefaults.isPublishedInNav,
    },
  });

  const watchedValues = form.watch();
  const positioningMode = watchedValues.positioningMode || 'COMPETITIVE';
  const whatsappTemplateRef = useRef<HTMLTextAreaElement | null>(null);

  // Metadados tarifários (custo API Brasil e motivo)
  const [pricingMeta, setPricingMeta] = useState<{
    apiBrasilLiveCost: number;
    changeReason: string;
  }>({
    apiBrasilLiveCost: 30,
    changeReason: '',
  });

  // Inserir tag dinâmica no cursor do textarea da mensagem
  const handleInsertTag = (tag: string) => {
    const currentText = form.getValues('whatsappMessageTemplate') || '';
    const textarea = whatsappTemplateRef.current;
    if (!textarea) {
      form.setValue('whatsappMessageTemplate', `${currentText} ${tag}`, {
        shouldDirty: true,
      });
      return;
    }

    const start = textarea.selectionStart ?? currentText.length;
    const end = textarea.selectionEnd ?? currentText.length;
    const newText = currentText.substring(0, start) + tag + currentText.substring(end);

    form.setValue('whatsappMessageTemplate', newText, {
      shouldDirty: true,
      shouldValidate: true,
    });

    setTimeout(() => {
      textarea.focus();
      const newPos = start + tag.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 50);
  };

  const handleNextStep = async () => {
    // Validação parcial por etapa
    let fieldsToValidate: (keyof FormValues)[] = [];
    if (currentStep === 1) {
      fieldsToValidate = ['isEnabled', 'price', 'isPublishedInNav'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['priceLabel', 'positioningMode'];
      if (positioningMode === 'CUSTOM') {
        fieldsToValidate.push('customPositioningText');
      }
      if (positioningMode === 'CHEAPEST_MARKET') {
        fieldsToValidate.push('claimEvidenceText', 'claimEvidenceDate');
      }
    } else if (currentStep === 3) {
      fieldsToValidate = ['heroTitle', 'heroSubtitle', 'disclaimerText'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error('Revise os campos obrigatórios antes de avançar.');
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      const res = await saveVehicleHistorySettingsAction(data, pricingMeta);
      if (res?.error) {
        toast.error('Erro ao salvar configurações', {
          description: res.error,
        });
      } else {
        toast.success('Configurações do Histórico Veicular salvas com sucesso!');
        form.reset(data);
        router.refresh();
      }
    });
  };

  // Simulação do texto do WhatsApp
  const simulatedMessage = (
    watchedValues.whatsappMessageTemplate ||
    'Olá! Quero solicitar o Histórico Veicular do veículo com placa {PLATE}.'
  )
    .replace('{PLATE}', 'BRA2E19')
    .replace(
      '{PRICE}',
      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        watchedValues.price || 39.9,
      ),
    )
    .replace('{SITE_NAME}', siteName);

  return (
    <div className="space-y-6">
      {/* Resumo Rápido Superior (Cards com métricas ativas) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Status */}
        <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Status do Serviço
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`w-2 h-2 rounded-full ${
                  watchedValues.isEnabled
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : 'bg-rose-400'
                }`}
              />
              <span className="text-sm font-extrabold text-white">
                {watchedValues.isEnabled ? 'Ativo na Loja' : 'Serviço Pausado'}
              </span>
            </div>
          </div>
          <span
            className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
              watchedValues.isEnabled
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}
          >
            {watchedValues.isEnabled ? 'Online' : 'Offline'}
          </span>
        </div>

        {/* Preço Público */}
        <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Preço ao Consumidor
            </span>
            <span className="text-lg font-black text-amber-400 font-mono mt-0.5 block">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                watchedValues.price || 39.9,
              )}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>

        {/* Menu & Rodapé */}
        <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Visibilidade no Menu
            </span>
            <span className="text-sm font-bold text-white mt-1 block">
              {watchedValues.isPublishedInNav ? 'Exibido na Navbar' : 'Apenas Link Direto'}
            </span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300 flex items-center justify-center">
            <Globe className="w-4 h-4" />
          </div>
        </div>

        {/* Link Rápido para a Landing Page */}
        <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div>
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Landing Page Pública
            </span>
            <Link
              href="/historico-veicular"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1 mt-1"
            >
              <span>/historico-veicular</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <Link
            href="/historico-veicular"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold transition-all border border-amber-500/30 flex items-center gap-1.5"
          >
            <span>Ver Página</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* STEPPER WIZARD SUPERIOR (DESIGN MODERNO & MOBILE FIRST) */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-3 sm:p-4 shadow-xl">
        {/* Mobile: Progresso compacto */}
        <div className="sm:hidden space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <span>Etapa {currentStep} de 4:</span>
              <span className="text-white font-semibold">
                {WIZARD_STEPS[currentStep - 1].label}
              </span>
            </span>
            <span className="text-zinc-400 font-mono">
              {Math.round((currentStep / 4) * 100)}%
            </span>
          </div>
          <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-zinc-800">
            <div
              className="bg-gradient-to-r from-amber-500 to-amber-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Desktop: Stepper completo com ícones */}
        <div className="hidden sm:grid grid-cols-4 gap-2.5">
          {WIZARD_STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.id < currentStep;
            const isCurrent = step.id === currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all text-left border cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                    : isCompleted
                      ? 'bg-zinc-950/60 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                      : 'bg-zinc-950/30 border-transparent text-zinc-500 hover:text-zinc-400'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    isCurrent
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                      : isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-white truncate">{step.label}</div>
                  <div className="text-[11px] text-zinc-400 truncate">{step.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* FORMULÁRIO PRINCIPAL */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* ============================================================ */}
          {/* ETAPA 1: ATIVAÇÃO & PRECIFICAÇÃO OFICIAL */}
          {/* ============================================================ */}
          {currentStep === 1 && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Ativação do Serviço & Precificação Oficial
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Controle a visibilidade da página pública e ajuste os preços cobrados por
                      consulta.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400">
                  Passo 1/4
                </span>
              </div>

              {/* Switches de Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-sm">
                      <div className="space-y-0.5 pr-4">
                        <FormLabel className="text-sm font-bold text-white">
                          Serviço Ativo
                        </FormLabel>
                        <FormDescription className="text-zinc-400 text-xs">
                          Habilita a página pública (/historico-veicular) e fluxo de compras.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? true}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-amber-500"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isPublishedInNav"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-sm">
                      <div className="space-y-0.5 pr-4">
                        <FormLabel className="text-sm font-bold text-white">
                          Exibir no Menu & Rodapé
                        </FormLabel>
                        <FormDescription className="text-zinc-400 text-xs">
                          Exibe o link &quot;Histórico Veicular&quot; na barra de navegação pública.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? true}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-amber-500"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Bloco de Precificação e Custo com Versionamento e Margem */}
              <div className="pt-2">
                <VehicleHistoryPricingCard
                  showStandaloneSaveButton={false}
                  onPriceUpdated={(newPrice) => {
                    form.setValue('price', newPrice, {
                      shouldDirty: true,
                      shouldValidate: true,
                    });
                  }}
                  onValuesChange={(data) => {
                    setPricingMeta({
                      apiBrasilLiveCost: data.liveCost,
                      changeReason: data.changeReason,
                    });
                    if (data.publicPrice > 0) {
                      form.setValue('price', data.publicPrice, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* ETAPA 2: POSICIONAMENTO COMERCIAL & FRASES */}
          {/* ============================================================ */}
          {currentStep === 2 && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Posicionamento Comercial & Frases de Apoio
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Defina os gatilhos de conversão e a estratégia de preço em conformidade com o
                      CDC e CONAR.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400">
                  Passo 2/4
                </span>
              </div>

              {/* Preview Dinâmico do Selo */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-zinc-950 to-zinc-950 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Prévia do Destaque Comercial na Página
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      É assim que o selo e o preço aparecerão nos cards de venda
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20">
                    <Sparkles className="w-3.5 h-3.5" />
                    {positioningMode === 'CUSTOM'
                      ? watchedValues.customPositioningText || 'Condição Especial'
                      : positioningMode === 'CHEAPEST_MARKET'
                        ? 'Mais Barato do Mercado'
                        : positioningMode === 'REGIONAL_BEST'
                          ? 'Melhor Preço da Região'
                          : positioningMode === 'SPECIAL_OFFER'
                            ? 'Oferta Especial'
                            : 'Preço Competitivo'}
                  </span>
                  <span className="text-sm font-black text-amber-400 font-mono">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      watchedValues.price || 39.9,
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Texto de Apoio ao Preço */}
                <FormField
                  control={form.control}
                  name="priceLabel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-200 font-medium text-xs uppercase tracking-wider">
                        Texto de Apoio ao Preço
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Consulta completa por R$ 39,99"
                          {...field}
                          value={field.value || ''}
                          className="bg-zinc-950 border-zinc-800 text-white focus:border-amber-500"
                        />
                      </FormControl>
                      <FormDescription className="text-zinc-400 text-xs">
                        Frase curta de destaque exibida ao lado do preço principal.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Modo de Posicionamento */}
                <FormField
                  control={form.control}
                  name="positioningMode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-200 font-medium text-xs uppercase tracking-wider">
                        Estratégia de Posicionamento
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'COMPETITIVE'}>
                        <FormControl>
                          <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white focus:border-amber-500">
                            <SelectValue placeholder="Selecione o posicionamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                          <SelectItem value="COMPETITIVE">Preço acessível / competitivo</SelectItem>
                          <SelectItem value="REGIONAL_BEST">
                            Um dos melhores preços da região
                          </SelectItem>
                          <SelectItem value="SPECIAL_OFFER">Oferta especial por tempo limitado</SelectItem>
                          <SelectItem value="CHEAPEST_MARKET">
                            Mais barato do mercado (exige comprovação)
                          </SelectItem>
                          <SelectItem value="CUSTOM">Texto personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-zinc-400 text-xs">
                        Define a comunicação estratégica de marketing e vendas.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Campo Seletivo: Texto Personalizado */}
              {positioningMode === 'CUSTOM' && (
                <FormField
                  control={form.control}
                  name="customPositioningText"
                  render={({ field }) => (
                    <FormItem className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 animate-in fade-in-50">
                      <FormLabel className="text-white font-medium text-xs uppercase tracking-wider">
                        Texto Personalizado de Posicionamento *
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Condição exclusiva para clientes do site"
                          {...field}
                          value={field.value || ''}
                          className="bg-zinc-900 border-zinc-700 text-white focus:border-amber-500"
                        />
                      </FormControl>
                      <FormDescription className="text-zinc-400 text-xs">
                        Frase personalizada que substituirá o selo padrão na landing page.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Campo Seletivo: Conformidade Legal CDC / CONAR */}
              {positioningMode === 'CHEAPEST_MARKET' && (
                <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-4 animate-in fade-in-50">
                  <div className="flex items-center gap-2.5 text-amber-400 text-sm font-bold">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <span>Exigência Legal (CDC / CONAR) para Publicidade Comparativa</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Para anunciar legalmente que o valor é o &quot;mais barato do mercado&quot;, o
                    Código de Defesa do Consumidor e o Conselho Nacional de Autorregulamentação
                    Publicitária exigem que a empresa mantenha registro da fonte e data da pesquisa
                    para fins de auditoria.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <FormField
                      control={form.control}
                      name="claimEvidenceText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-zinc-200 font-semibold">
                            Fonte da Pesquisa / Metodologia *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Amostragem de 5 plataformas em PE"
                              {...field}
                              value={field.value || ''}
                              className="bg-zinc-950 border-zinc-800 text-white text-xs focus:border-amber-500"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="claimEvidenceDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-zinc-200 font-semibold">
                            Data da Pesquisa (AAAA-MM-DD) *
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              value={field.value || ''}
                              className="bg-zinc-950 border-zinc-800 text-white text-xs focus:border-amber-500"
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
          )}

          {/* ============================================================ */}
          {/* ETAPA 3: TEXTOS DA LANDING PAGE & APRESENTAÇÃO */}
          {/* ============================================================ */}
          {currentStep === 3 && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Textos da Landing Page & Conformidade
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Personalize as frases de impacto da Hero e os avisos legais para os clientes.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400">
                  Passo 3/4
                </span>
              </div>

              {/* Visual Mockup da Hero */}
              <div className="p-5 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-2">
                  <span>Prévia da Seção Hero Pública</span>
                  <span className="text-amber-400 font-mono">/historico-veicular</span>
                </div>
                <div className="space-y-2 py-1">
                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                    {watchedValues.heroTitle ||
                      'Vai comprar, vender ou avaliar um veículo? Consulte o histórico veicular.'}
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-3xl">
                    {watchedValues.heroSubtitle ||
                      'Com apenas a placa, obtenha o laudo oficial para motos, carros, caminhões e utilitários em todo o território nacional.'}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* Título Principal */}
                <FormField
                  control={form.control}
                  name="heroTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-200 font-medium text-xs uppercase tracking-wider">
                        Título Principal da Hero
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Vai comprar, vender ou avaliar um veículo? Consulte o histórico veicular."
                          {...field}
                          value={field.value || ''}
                          className="bg-zinc-950 border-zinc-800 text-white focus:border-amber-500 font-semibold"
                        />
                      </FormControl>
                      <FormDescription className="text-zinc-400 text-xs">
                        Frase principal exibida em destaque no topo da página de vendas.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Subtítulo da Hero */}
                <FormField
                  control={form.control}
                  name="heroSubtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-200 font-medium text-xs uppercase tracking-wider">
                        Subtítulo Explicativo da Hero
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Ex: Com apenas a placa, obtenha o laudo oficial para motos, carros, caminhões e utilitários em todo o território nacional..."
                          {...field}
                          value={field.value || ''}
                          className="bg-zinc-950 border-zinc-800 text-white focus:border-amber-500 leading-relaxed"
                        />
                      </FormControl>
                      <FormDescription className="text-zinc-400 text-xs">
                        Explicação de como funciona o serviço e por que o laudo é essencial.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Texto Legal de Limitações / Disclaimer */}
                <FormField
                  control={form.control}
                  name="disclaimerText"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2 mb-1">
                        <FormLabel className="text-zinc-200 font-medium text-xs uppercase tracking-wider flex items-center gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                          <span>Texto Legal de Transparência & Limitações (Disclaimer)</span>
                        </FormLabel>
                      </div>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Ex: O relatório reúne informações disponibilizadas pelas bases consultadas na data da consulta. Ele ajuda na análise de procedência, mas não substitui vistoria mecânica presencial..."
                          {...field}
                          value={field.value || ''}
                          className="bg-zinc-950 border-zinc-800 text-white focus:border-amber-500 leading-relaxed text-xs"
                        />
                      </FormControl>
                      <FormDescription className="text-zinc-400 text-xs">
                        Exibido na seção de transparência ao final da página para resguardo jurídico
                        da loja.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* ETAPA 4: INTEGRAÇÃO WHATSAPP & TAGS DINÂMICAS */}
          {/* ============================================================ */}
          {currentStep === 4 && (
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6 animate-in fade-in-50 duration-200">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      Integração WhatsApp & Mensagens Automáticas
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Configure o número receptor e personalize o modelo de mensagem que o cliente
                      envia ao consultar.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-400">
                  Passo 4/4
                </span>
              </div>

              {/* Telefone Exclusivo */}
              <FormField
                control={form.control}
                name="whatsappPhoneOverride"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-zinc-200 font-medium text-xs uppercase tracking-wider">
                      WhatsApp Exclusivo para Consultas (Opcional)
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 81985901175 (deixe em branco para usar o número principal da loja)"
                        {...field}
                        value={field.value || ''}
                        className="bg-zinc-950 border-zinc-800 text-white font-mono focus:border-amber-500"
                      />
                    </FormControl>
                    <FormDescription className="text-zinc-400 text-xs">
                      Se informado, os botões de compra e consulta direcionarão para este número
                      específico.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Template da Mensagem com Botões de Tags */}
              <FormField
                control={form.control}
                name="whatsappMessageTemplate"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <FormLabel className="text-zinc-200 font-medium text-xs uppercase tracking-wider">
                        Template da Mensagem com Placa
                      </FormLabel>

                      {/* Botões de Inserção Rápida de Tags */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] text-zinc-400 font-semibold mr-1">
                          Inserir tag:
                        </span>
                        <button
                          type="button"
                          onClick={() => handleInsertTag('{PLATE}')}
                          className="px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-mono font-bold transition-all cursor-pointer"
                          title="Substitui pela placa digitada pelo cliente"
                        >
                          + &#123;PLATE&#125;
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertTag('{PRICE}')}
                          className="px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-mono font-bold transition-all cursor-pointer"
                          title="Substitui pelo preço da consulta configurado"
                        >
                          + &#123;PRICE&#125;
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInsertTag('{SITE_NAME}')}
                          className="px-2 py-0.5 rounded-md bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] font-mono font-bold transition-all cursor-pointer"
                          title="Substitui pelo nome da loja"
                        >
                          + &#123;SITE_NAME&#125;
                        </button>
                      </div>
                    </div>

                    <FormControl>
                      <Textarea
                        ref={(node) => {
                          whatsappTemplateRef.current = node;
                          field.ref(node);
                        }}
                        rows={4}
                        placeholder="Olá! Quero solicitar o Histórico Veicular do veículo com placa {PLATE}. Vi a consulta por {PRICE} no site da {SITE_NAME}..."
                        value={field.value || ''}
                        onChange={field.onChange}
                        className="bg-zinc-950 border-zinc-800 text-white font-mono text-xs focus:border-amber-500 leading-relaxed"
                      />
                    </FormControl>
                    <FormDescription className="text-zinc-400 text-xs">
                      Clique nos botões acima para incluir dinamicamente a placa, o preço e o nome da
                      loja no texto da mensagem enviada pelo cliente.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Simulador de Balão do WhatsApp */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Simulador do WhatsApp (Como o lojista receberá)</span>
                  </span>
                  <span className="text-[10px] text-zinc-500">Exemplo com placa fictícia BRA2E19</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#005c4b]/30 border border-[#005c4b]/50 text-white text-xs leading-relaxed max-w-lg ml-auto shadow-md">
                  <p>{simulatedMessage}</p>
                  <div className="text-right text-[10px] text-zinc-400 mt-1.5 font-mono">
                    14:32 ✓✓
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* BARRA DE AÇÃO INFERIOR (NAVEGAÇÃO ENTRE ETAPAS & SALVAR) */}
          {/* ============================================================ */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between pt-3 border-t border-zinc-800/80 gap-4">
            {/* Lado Esquerdo: Botão Voltar + Indicador de Alterações */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button
                type="button"
                variant="outline"
                disabled={currentStep === 1 || isPending}
                onClick={handlePrevStep}
                className="w-full sm:w-auto border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800 h-12 px-6 rounded-xl cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                <span>Voltar Etapa</span>
              </Button>

              {form.formState.isDirty && (
                <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium bg-amber-500/10 border border-amber-500/20 px-3 py-2 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Alterações pendentes</span>
                </span>
              )}
            </div>

            {/* Lado Direito: Ações */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              {/* Etapas 1, 2 e 3: Ação Primária é AVANÇAR */}
              {currentStep < 4 ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => form.handleSubmit(onSubmit)()}
                    disabled={isPending}
                    className="w-full sm:w-auto border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:bg-zinc-900 h-12 px-5 rounded-xl text-xs font-semibold cursor-pointer"
                    title="Salva as alterações feitas até aqui sem precisar ir até o último passo"
                  >
                    {isPending ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Save className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
                    )}
                    <span>Salvar Alterações</span>
                  </Button>

                  <Button
                    type="button"
                    onClick={handleNextStep}
                    className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-extrabold h-12 px-7 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer text-sm transition-all"
                  >
                    <span>Avançar para {WIZARD_STEPS[currentStep].label}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                /* Etapa 4 (Final): Ação Primária é SALVAR TUDO */
                <Button
                  type="submit"
                  disabled={isPending}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-black px-9 h-12 rounded-xl shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base transition-all"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Salvando Configurações...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Salvar Todas as Configurações</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
