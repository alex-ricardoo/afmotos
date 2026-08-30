'use client';

import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import {
  User,
  Phone,
  MapPin,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Search,
  Sparkles,
  Mail,
  MessageCircle,
  FileText,
  Check,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  customerCreateSchema,
  CustomerFormValues,
} from '@/lib/validations/customer';
import {
  createCustomerAction,
  updateCustomerAction,
  checkDuplicatesAction,
} from '@/lib/actions/customers';
import { Customer, CustomerSource } from '@/types/customer';
import {
  formatCpf,
  formatPhone,
  formatCep,
  cleanNumeric,
} from '@/lib/utils/customer-normalizers';
import { sourceConfig } from './customer-source-badge';
import { CustomerDedupAlert } from './customer-dedup-alert';
import { cn } from '@/lib/utils';

const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

const genderLabels: Record<string, string> = {
  prefer_not_to_say: 'Não informado',
  male: 'Masculino',
  female: 'Feminino',
  other: 'Outro',
};

const WIZARD_STEPS = [
  {
    id: 1,
    title: 'Identificação',
    shortLabel: 'Dados Pessoais',
    description: 'Nome, CPF, nascimento e origem',
    icon: User,
  },
  {
    id: 2,
    title: 'Contatos',
    shortLabel: 'Comunicação',
    description: 'WhatsApp, e-mail e telefones',
    icon: Phone,
  },
  {
    id: 3,
    title: 'Endereço',
    shortLabel: 'Localização',
    description: 'CEP e endereço completo',
    icon: MapPin,
  },
  {
    id: 4,
    title: 'Observações & Revisão',
    shortLabel: 'Finalização',
    description: 'Anotações comerciais e resumo',
    icon: Sparkles,
  },
];

interface CustomerFormProps {
  initialCustomer?: Customer | null;
  onSuccess?: (customer: Customer) => void;
  onCancel?: () => void;
}

export function CustomerForm({
  initialCustomer,
  onSuccess,
  onCancel,
}: CustomerFormProps) {
  const router = useRouter();
  const isEditing = !!initialCustomer;
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // Duplication Pre-Check State
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null);

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerCreateSchema) as any,
    defaultValues: {
      full_name: initialCustomer?.full_name || '',
      cpf: initialCustomer?.cpf ? formatCpf(initialCustomer.cpf) : '',
      rg: initialCustomer?.rg || '',
      phone: initialCustomer?.phone ? formatPhone(initialCustomer.phone) : '',
      email: initialCustomer?.email || '',
      whatsapp: initialCustomer?.whatsapp ? formatPhone(initialCustomer.whatsapp) : '',
      birth_date: initialCustomer?.birth_date || '',
      gender: (initialCustomer?.gender as any) || 'prefer_not_to_say',
      cep: initialCustomer?.cep ? formatCep(initialCustomer.cep) : '',
      street: initialCustomer?.street || '',
      number: initialCustomer?.number || '',
      complement: initialCustomer?.complement || '',
      neighborhood: initialCustomer?.neighborhood || '',
      city: initialCustomer?.city || 'Recife',
      state: initialCustomer?.state || 'PE',
      notes: initialCustomer?.notes || '',
      source_detail: initialCustomer?.source_detail || '',
      source: initialCustomer?.source || 'manual',
      is_active: initialCustomer?.is_active ?? true,
    },
    mode: 'onChange',
  });

  const watchedCpf = form.watch('cpf');
  const watchedPhone = form.watch('phone');
  const watchedEmail = form.watch('email');
  const watchedName = form.watch('full_name');
  const watchedCity = form.watch('city');
  const watchedState = form.watch('state');
  const watchedStreet = form.watch('street');
  const watchedNumber = form.watch('number');
  const watchedSource = form.watch('source');

  // Debounced duplicate detection
  useEffect(() => {
    const cleanCpf = cleanNumeric(watchedCpf || '');
    const cleanPh = cleanNumeric(watchedPhone || '');
    const cleanEm = watchedEmail?.trim() || '';

    if (cleanCpf.length < 11 && cleanPh.length < 10 && cleanEm.length < 5) {
      setDuplicateWarning(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await checkDuplicatesAction({
          cpf: cleanCpf.length === 11 ? cleanCpf : undefined,
          phone: cleanPh.length >= 10 ? cleanPh : undefined,
          email: cleanEm.includes('@') ? cleanEm : undefined,
          excludeId: initialCustomer?.id,
        });

        if (result.hasExactCpfMatch || result.hasPhoneMatch || result.hasEmailMatch) {
          setDuplicateWarning(result);
        } else {
          setDuplicateWarning(null);
        }
      } catch (err) {
        console.error('Error checking duplicate:', err);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [watchedCpf, watchedPhone, watchedEmail, initialCustomer?.id]);

  // ViaCEP Auto Lookup
  const handleCepBlur = async () => {
    const rawCep = form.getValues('cep');
    const numericCep = cleanNumeric(rawCep || '');

    if (numericCep.length !== 8) return;

    setLoadingCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${numericCep}/json/`);
      const data = await res.json();

      if (!data.erro) {
        if (data.logradouro) form.setValue('street', data.logradouro, { shouldValidate: true });
        if (data.bairro) form.setValue('neighborhood', data.bairro, { shouldValidate: true });
        if (data.localidade) form.setValue('city', data.localidade, { shouldValidate: true });
        if (data.uf) form.setValue('state', data.uf, { shouldValidate: true });
        toast.success(`Endereço carregado: ${data.localidade}/${data.uf}`);
      } else {
        toast.error('CEP não encontrado na base dos Correios.');
      }
    } catch (err) {
      toast.error('Falha ao consultar o CEP online.');
    } finally {
      setLoadingCep(false);
    }
  };

  // Step Validation logic before advancing
  const handleNextStep = async () => {
    let fieldsToValidate: (keyof CustomerFormValues)[] = [];

    if (currentStep === 1) {
      fieldsToValidate = ['full_name', 'cpf', 'birth_date', 'gender', 'source'];
    } else if (currentStep === 2) {
      fieldsToValidate = ['phone', 'email', 'whatsapp'];
    } else if (currentStep === 3) {
      fieldsToValidate = ['cep', 'street', 'number', 'neighborhood', 'city', 'state'];
    }

    const isValid = await form.trigger(fieldsToValidate as any);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast.error('Por favor, verifique os campos destacados antes de avançar.');
    }
  };

  const handlePrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit Handler
  const onSubmit: SubmitHandler<CustomerFormValues> = async (data) => {
    if (currentStep !== 4) {
      return;
    }
    setLoading(true);
    try {
      if (isEditing && initialCustomer) {
        const res = await updateCustomerAction(initialCustomer.id, data);
        if (res?.error) {
          toast.error(res.error);
        } else if (res?.success) {
          toast.success('Cliente atualizado com sucesso!');
          router.push(`/admin/clientes/${initialCustomer.id}`);
          router.refresh();
        }
      } else {
        const res = await createCustomerAction(data);
        if (res?.error) {
          toast.error(res.error);
        } else if (res?.success && res.id) {
          toast.success('Cliente cadastrado com sucesso!');
          if (onSuccess) {
            onSuccess({ ...data, id: res.id } as any);
          } else {
            router.push(`/admin/clientes/${res.id}`);
            router.refresh();
          }
        }
      }
    } catch (err: any) {
      toast.error('Ocorreu um erro ao salvar o cliente.');
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = ((currentStep - 1) / (WIZARD_STEPS.length - 1)) * 100;

  return (
    <div className="space-y-6">
      {/* 1. Header do Wizard com Barra de Progresso */}
      <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-4 sm:p-6 shadow-sm">
        {/* Step Progress Top Bar */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#c9a44c]">
              Etapa {currentStep} de {WIZARD_STEPS.length}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {WIZARD_STEPS[currentStep - 1].title}
            </h2>
          </div>
          <span className="text-xs text-zinc-400 hidden sm:inline-block">
            {WIZARD_STEPS[currentStep - 1].description}
          </span>
        </div>

        {/* Barra de Progresso Suave */}
        <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] transition-all duration-300 rounded-full shadow-[0_0_10px_rgba(201,164,76,0.5)]"
            style={{ width: `${Math.max(progressPercentage, 10)}%` }}
          />
        </div>

        {/* Indicadores Visuais de Etapa */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {WIZARD_STEPS.map((step) => {
            const Icon = step.icon;
            const isCurrent = step.id === currentStep;
            const isCompleted = step.id < currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={async () => {
                  if (step.id < currentStep) {
                    setCurrentStep(step.id);
                  } else if (step.id > currentStep) {
                    await handleNextStep();
                  }
                }}
                className={cn(
                  'flex items-center gap-2.5 p-2.5 sm:p-3 rounded-2xl border text-left transition-all cursor-pointer select-none',
                  isCurrent &&
                    'bg-[#c9a44c]/10 border-[#c9a44c] text-white shadow-[0_0_15px_rgba(201,164,76,0.15)] ring-1 ring-[#c9a44c]/30',
                  isCompleted &&
                    'bg-zinc-900/60 border-zinc-700/80 text-zinc-300 hover:border-zinc-600',
                  !isCurrent &&
                    !isCompleted &&
                    'bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:border-zinc-800',
                )}
              >
                <div
                  className={cn(
                    'w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                    isCurrent && 'bg-[#c9a44c] text-zinc-950 font-bold',
                    isCompleted && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
                    !isCurrent && !isCompleted && 'bg-zinc-900 text-zinc-600 border border-zinc-800',
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 stroke-[3]" />
                  ) : (
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  )}
                </div>

                <div className="overflow-hidden min-w-0">
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase tracking-wider block truncate',
                      isCurrent ? 'text-[#e3c56c]' : isCompleted ? 'text-zinc-400' : 'text-zinc-600',
                    )}
                  >
                    Passo {step.id}
                  </span>
                  <span
                    className={cn(
                      'text-xs font-bold block truncate',
                      isCurrent ? 'text-white' : isCompleted ? 'text-zinc-300' : 'text-zinc-500',
                    )}
                  >
                    {step.shortLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerta de Duplicidade em Tempo Real */}
      <CustomerDedupAlert duplicates={duplicateWarning} />

      {/* Formulário Principal */}
      <Form {...form}>
        <form
          onSubmit={(e) => {
            if (currentStep < 4) {
              e.preventDefault();
              e.stopPropagation();
              handleNextStep();
              return;
            }
            form.handleSubmit(onSubmit)(e);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
              e.preventDefault();
              if (currentStep < 4) {
                handleNextStep();
              }
            }
          }}
          className="space-y-6"
        >
          {/* =========================================================================
              PASSO 1: IDENTIFICAÇÃO & DADOS BÁSICOS
             ========================================================================= */}
          {currentStep === 1 && (
            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm animate-in fade-in duration-200">
              <div className="border-b border-zinc-800/80 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-[#c9a44c]" />
                  Identificação Pessoal
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Informe o nome e os dados de identificação civil do cliente.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Nome Completo */}
                <FormField
                  control={form.control as any}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        Nome Completo <span className="text-rose-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Digite o nome completo do cliente"
                          {...field}
                          className="h-11 bg-[#09090b] border-zinc-800 focus:border-[#c9a44c] text-sm text-white rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CPF */}
                <FormField
                  control={form.control as any}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        CPF (Opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000.000.000-00"
                          maxLength={14}
                          {...field}
                          onChange={(e) => field.onChange(formatCpf(e.target.value))}
                          className="h-11 bg-[#09090b] border-zinc-800 focus:border-[#c9a44c] text-sm text-white font-mono rounded-xl"
                        />
                      </FormControl>
                      <FormDescription className="text-[11px] text-zinc-500">
                        Utilizado para recibos de compra e venda e contratos.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* RG */}
                <FormField
                  control={form.control as any}
                  name="rg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        RG / Documento de Identidade
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: 8.912.345 SDS/PE"
                          {...field}
                          className="h-11 bg-[#09090b] border-zinc-800 focus:border-[#c9a44c] text-sm text-white rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Data de Nascimento */}
                <FormField
                  control={form.control as any}
                  name="birth_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        Data de Nascimento
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          className="h-11 bg-[#09090b] border-zinc-800 focus:border-[#c9a44c] text-sm text-white rounded-xl block [color-scheme:dark]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Sexo */}
                <FormField
                  control={form.control as any}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        Sexo
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(val) => field.onChange(val || 'prefer_not_to_say')}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 bg-[#09090b] border-zinc-800 text-sm text-white rounded-xl focus:border-[#c9a44c]">
                            <SelectValue placeholder="Selecione o sexo">
                              {genderLabels[field.value] || 'Selecione o sexo'}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                          <SelectItem value="prefer_not_to_say">Não informado</SelectItem>
                          <SelectItem value="male">Masculino</SelectItem>
                          <SelectItem value="female">Feminino</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Origem do Cadastro */}
                <FormField
                  control={form.control as any}
                  name="source"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        Canal / Origem do Cliente
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(val) => field.onChange(val || 'manual')}
                        disabled={isEditing}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 bg-[#09090b] border-zinc-800 text-sm text-white rounded-xl focus:border-[#c9a44c]">
                            <SelectValue placeholder="Origem do cliente">
                              {sourceConfig[field.value as CustomerSource]?.label || 'Origem do cliente'}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs">
                          {Object.entries(sourceConfig).map(([key, cfg]) => (
                            <SelectItem key={key} value={key}>
                              {cfg.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isEditing && (
                        <FormDescription className="text-[11px] text-amber-400/80">
                          A origem inicial do cliente é imutável para preservar o histórico de aquisição.
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* =========================================================================
              PASSO 2: CONTATOS & COMUNICAÇÃO
             ========================================================================= */}
          {currentStep === 2 && (
            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm animate-in fade-in duration-200">
              <div className="border-b border-zinc-800/80 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#c9a44c]" />
                  Canais de Comunicação
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Telefones e e-mail para envio de propostas, recibos e contato comercial.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Telefone Principal / WhatsApp */}
                <FormField
                  control={form.control as any}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        Telefone Principal / WhatsApp <span className="text-rose-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="(81) 99999-9999"
                            maxLength={15}
                            {...field}
                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                            className="h-11 bg-[#09090b] border-zinc-800 focus:border-[#c9a44c] text-sm text-white font-mono rounded-xl pl-9"
                          />
                          <Phone className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5 pointer-events-none" />
                        </div>
                      </FormControl>
                      <FormDescription className="text-[11px] text-zinc-500">
                        Número padrão para envio de mensagens automáticas.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* WhatsApp Secundário */}
                <FormField
                  control={form.control as any}
                  name="whatsapp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        WhatsApp Secundário / Recado (Opcional)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="(81) 98888-8888"
                            maxLength={15}
                            {...field}
                            onChange={(e) => field.onChange(formatPhone(e.target.value))}
                            className="h-11 bg-[#09090b] border-zinc-800 focus:border-[#c9a44c] text-sm text-white font-mono rounded-xl pl-9"
                          />
                          <MessageCircle className="w-4 h-4 text-emerald-500/70 absolute left-3 top-3.5 pointer-events-none" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* E-mail */}
                <FormField
                  control={form.control as any}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        E-mail (Opcional)
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="email"
                            placeholder="cliente@email.com"
                            {...field}
                            className="h-11 bg-[#09090b] border-zinc-800 focus:border-[#c9a44c] text-sm text-white rounded-xl pl-9"
                          />
                          <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5 pointer-events-none" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* =========================================================================
              PASSO 3: ENDEREÇO & LOCALIZAÇÃO
             ========================================================================= */}
          {currentStep === 3 && (
            <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm animate-in fade-in duration-200">
              <div className="border-b border-zinc-800/80 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#c9a44c]" />
                  Endereço Residencial / Comercial
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Digite o CEP para preenchimento automático do endereço via Correios.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* CEP com Busca Automática */}
                <FormField
                  control={form.control as any}
                  name="cep"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-1">
                      <FormLabel className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center justify-between">
                        <span>CEP</span>
                        {loadingCep && (
                          <span className="inline-flex items-center text-[10px] text-[#e3c56c] font-normal gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
                          </span>
                        )}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="00000-000"
                            maxLength={9}
                            {...field}
                            onChange={(e) => field.onChange(formatCep(e.target.value))}
                            onBlur={handleCepBlur}
                            className="h-11 bg-[#09090b] border-zinc-800 focus:border-[#c9a44c] text-sm text-white font-mono rounded-xl pl-9"
                          />
                          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3.5 pointer-events-none" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Logradouro */}
                <FormField
                  control={form.control as any}
                  name="street"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        Rua / Avenida / Logradouro
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Avenida Caxangá"
                          {...field}
                          className="h-11 bg-[#09090b] border-zinc-800 focus:border-[#c9a44c] text-sm text-white rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Número */}
                <FormField
                  control={form.control as any}
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        Número
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: 120 ou S/N"
                          {...field}
                          className="h-11 bg-[#09090b] border-zinc-800 focus:border-[#c9a44c] text-sm text-white rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Complemento */}
                <FormField
                  control={form.control as any}
                  name="complement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        Complemento (Opcional)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Apto 302, Bloco B"
                          {...field}
                          className="h-11 bg-[#09090b] border-zinc-800 focus:border-[#c9a44c] text-sm text-white rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bairro */}
                <FormField
                  control={form.control as any}
                  name="neighborhood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        Bairro
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Madalena"
                          {...field}
                          className="h-11 bg-[#09090b] border-zinc-800 focus:border-[#c9a44c] text-sm text-white rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cidade */}
                <FormField
                  control={form.control as any}
                  name="city"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        Cidade
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Recife"
                          {...field}
                          className="h-11 bg-[#09090b] border-zinc-800 focus:border-[#c9a44c] text-sm text-white rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Estado UF */}
                <FormField
                  control={form.control as any}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                        UF (Estado)
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(val) => field.onChange(val || 'PE')}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 bg-[#09090b] border-zinc-800 text-sm text-white rounded-xl focus:border-[#c9a44c]">
                            <SelectValue placeholder="UF">{field.value || 'UF'}</SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-zinc-900 border-zinc-800 text-white text-xs max-h-56">
                          {BRAZILIAN_STATES.map((st) => (
                            <SelectItem key={st} value={st}>
                              {st}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* =========================================================================
              PASSO 4: OBSERVAÇÕES & REVISÃO GERAL
             ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Bloco de Dados Adicionais */}
              <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm">
                <div className="border-b border-zinc-800/80 pb-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#c9a44c]" />
                    Observações Comerciais & Status
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Informações complementares e anotações internas da equipe de atendimento.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Detalhe da Origem */}
                  <FormField
                    control={form.control as any}
                    name="source_detail"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                          Detalhe da Origem / Indicação (Opcional)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Indicado por cliente antigo, anúncio no Instagram, passagem na loja"
                            {...field}
                            className="h-11 bg-[#09090b] border-zinc-800 focus:border-[#c9a44c] text-sm text-white rounded-xl"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Observações Comerciais */}
                  <FormField
                    control={form.control as any}
                    name="notes"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                          Anotações Comerciais da Loja (Visível apenas para administradores)
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Ex: Cliente tem interesse em motos trail de 250cc a 300cc; prefere pagamento via financiamento bancário..."
                            rows={3}
                            {...field}
                            className="bg-[#09090b] border-zinc-800 focus:border-[#c9a44c] text-sm text-white rounded-xl resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Status Ativo / Inativo */}
                  <FormField
                    control={form.control as any}
                    name="is_active"
                    render={({ field }) => (
                      <div className="sm:col-span-2 flex items-center justify-between p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                        <div className="space-y-0.5">
                          <span className="text-sm font-bold text-white block">
                            Cadastro Ativo na Carteira
                          </span>
                          <span className="text-xs text-zinc-400 block">
                            Clientes inativos não aparecem em buscas rápidas de vendas e contatos rotineiros.
                          </span>
                        </div>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </div>
                    )}
                  />
                </div>
              </div>

              {/* Card Elegante de Revisão Geral */}
              <div className="bg-gradient-to-br from-zinc-950 via-[#0d0d11] to-zinc-950 border border-[#c9a44c]/30 rounded-3xl p-5 sm:p-6 space-y-4 shadow-md">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                  <h4 className="text-sm font-bold text-[#e3c56c] flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#c9a44c]" />
                    Revisão Cadastral
                  </h4>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    {watchedSource ? sourceConfig[watchedSource]?.label : 'Manual'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-zinc-500 text-[11px] block">Cliente</span>
                    <span className="font-bold text-white block truncate text-sm">
                      {watchedName || 'Nome não informado'}
                    </span>
                    <span className="text-zinc-400 font-mono block">
                      {watchedCpf ? formatCpf(watchedCpf) : 'CPF não informado'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-zinc-500 text-[11px] block">Contato Principal</span>
                    <span className="font-bold text-emerald-400 font-mono block text-sm">
                      {watchedPhone || 'Telefone não informado'}
                    </span>
                    <span className="text-zinc-400 block truncate">
                      {watchedEmail || 'E-mail não informado'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-zinc-500 text-[11px] block">Localidade</span>
                    <span className="font-bold text-zinc-200 block truncate">
                      {watchedCity ? `${watchedCity}/${watchedState || 'PE'}` : 'Não informada'}
                    </span>
                    <span className="text-zinc-400 block truncate text-[11px]">
                      {watchedStreet ? `${watchedStreet}, ${watchedNumber || 'S/N'}` : 'Endereço pendente'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================================================
              BARRA DE AÇÕES INFERIOR (NAVEGAÇÃO DO WIZARD)
             ========================================================================= */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-zinc-800/80">
            <div>
              {currentStep > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePrevStep}
                  className="w-full sm:w-auto h-11 border-zinc-800 bg-[#09090b] text-zinc-300 hover:text-white rounded-xl gap-2 font-semibold text-xs px-5 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Passo Anterior
                </Button>
              ) : onCancel ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onCancel}
                  className="w-full sm:w-auto h-11 text-zinc-400 hover:text-white text-xs px-4"
                >
                  Cancelar
                </Button>
              ) : (
                <Link
                  href="/admin/clientes"
                  className="inline-flex items-center justify-center w-full sm:w-auto h-11 px-4 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
                >
                  Voltar à Lista
                </Link>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {currentStep < 4 ? (
                <Button
                  key={`wizard-step-next-btn-${currentStep}`}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNextStep();
                  }}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-zinc-950 font-black rounded-xl px-6 h-11 shadow-[0_0_20px_rgba(201,164,76,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-xs"
                >
                  <span>Próximo Passo</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </Button>
              ) : (
                <Button
                  key="wizard-step-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-zinc-950 font-black rounded-xl px-7 h-11 shadow-[0_0_25px_rgba(201,164,76,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 text-xs"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-zinc-950" />
                      <span>{isEditing ? 'Atualizando...' : 'Salvando Cadastro...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3] text-zinc-950" />
                      <span>{isEditing ? 'Salvar Alterações' : 'Concluir Cadastro do Cliente'}</span>
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
