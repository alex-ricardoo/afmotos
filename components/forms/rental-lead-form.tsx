'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createRentalRequestAction } from '@/lib/actions/rental-requests';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';
import { cn } from '@/lib/utils';

const rentalSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  phone: z.string().min(14, 'Telefone inválido'),
  age: z.coerce.number().min(18, 'A idade mínima é 18 anos').max(70, 'A idade máxima permitida é 70 anos'),
  has_cnh_a: z.enum(['Sim', 'Provisória', 'Não']),
  purpose_of_use: z.string().min(1, 'Selecione a finalidade de uso'),
  motorcycle_id: z.string().optional(),
  desired_plan: z.string().min(1, 'Selecione o plano desejado'),
  expected_start_date: z.string().min(1, 'Selecione a data prevista'),
});

type RentalFormValues = z.infer<typeof rentalSchema>;

export interface RentalLeadFormProps {
  defaultMotorcycleId?: string;
  availableMotorcycles: { id: string; brand: string; model: string; version?: string | null }[];
  whatsappPhone: string;
}

const CNH_OPTIONS = ['Sim', 'Provisória', 'Não'];
const PURPOSE_OPTIONS = ['Entregas / Aplicativo', 'Deslocamento para Trabalho', 'Uso Pessoal / Passeio'];
const PLAN_OPTIONS = ['Semanal', 'Quinzenal', 'Mensal', 'Diária', 'Personalizado'];

export function RentalLeadForm({ defaultMotorcycleId, availableMotorcycles, whatsappPhone }: RentalLeadFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<RentalFormValues>({
    resolver: zodResolver(rentalSchema) as any,
    defaultValues: {
      name: '',
      phone: '(81) 9',
      age: '' as any,
      has_cnh_a: undefined,
      purpose_of_use: '',
      motorcycle_id: defaultMotorcycleId || '',
      desired_plan: '',
      expected_start_date: '',
    },
  });

  // Update form if defaultMotorcycleId changes
  useEffect(() => {
    if (defaultMotorcycleId) {
      form.setValue('motorcycle_id', defaultMotorcycleId);
    }
  }, [defaultMotorcycleId, form]);

  const [submittedData, setSubmittedData] = useState<{
    name: string;
    phone: string;
    age: number;
    has_cnh_a: string;
    purpose_of_use: string;
    desired_plan: string;
    expected_start_date: string;
    motoName: string;
  } | null>(null);

  async function onSubmit(data: RentalFormValues) {
    setLoading(true);
    try {
      const result = await createRentalRequestAction({
        ...data,
        motorcycle_id: data.motorcycle_id === 'none' ? '' : data.motorcycle_id
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('Proposta enviada com sucesso!');

        let motoName = 'Ainda não decidi';
        if (data.motorcycle_id && data.motorcycle_id !== 'none') {
          const m = availableMotorcycles.find(x => x.id === data.motorcycle_id);
          if (m) motoName = `${m.brand} ${m.model} ${m.version || ''}`.trim();
        }

        setSubmittedData({
          name: data.name,
          phone: data.phone,
          age: data.age,
          has_cnh_a: data.has_cnh_a,
          purpose_of_use: data.purpose_of_use,
          desired_plan: data.desired_plan,
          expected_start_date: data.expected_start_date,
          motoName,
        });

        setSuccess(true);
        form.reset();
      }
    } catch (error) {
      toast.error('Não foi possível enviar agora. Verifique os campos e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    const waMessage = submittedData
      ? `Olá AF Motos! Gostaria de falar sobre minha proposta de aluguel enviada pelo site.\n\n*Nome:* ${submittedData.name}\n*Plano:* ${submittedData.desired_plan}\n*Início:* ${submittedData.expected_start_date.split('-').reverse().join('/')}\n*Moto:* ${submittedData.motoName}`
      : 'Olá! Enviei uma proposta de aluguel pelo site da AF Motos.';
    
    const waUrl = generateWhatsAppLink(whatsappPhone, waMessage);

    return (
      <div className="bg-[#151515] border border-[#c9a44c]/30 text-[#f4f4f2] p-8 sm:p-10 rounded-3xl text-center space-y-6 shadow-[0_0_30px_rgba(201,164,76,0.1)]">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/40">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-2 max-w-lg mx-auto">
          <h3 className="text-2xl font-black text-white font-heading">
            Proposta enviada com sucesso!
          </h3>
          <p className="text-base text-zinc-300 leading-relaxed font-medium">
            Recebemos seu interesse em alugar uma moto. Nossa equipe analisará as informações e entrará em contato para confirmar os detalhes.
          </p>
          <p className="text-xs text-[#a6a6a1] leading-relaxed pt-1">
            Guarde seu telefone disponível. Podemos entrar em contato para confirmar a moto, o plano e as condições do aluguel.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <Button
            className="w-full sm:flex-1 bg-[#c9a44c] hover:bg-[#e3c56c] text-[#050505] font-extrabold h-12 rounded-xl cursor-pointer transition-all shadow-md"
            onClick={() => {
              setSuccess(false);
              setSubmittedData(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Voltar para as motos
          </Button>

          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:flex-1 border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold h-12 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors cursor-pointer"
          >
            <span>Falar no WhatsApp (Opcional)</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
        {/* Contato Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white font-heading border-b border-[#c9a44c]/20 pb-2">1. Seus Dados</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Carlos Silva" {...field} className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]" />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">WhatsApp com DDD *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: (81) 99999-9999" 
                      value={field.value}
                      onChange={(e) => {
                        let v = e.target.value.replace(/\D/g, '');
                        let formatted = v;
                        if (v.length > 0) {
                          if (v.length <= 2) formatted = `(${v}`;
                          else if (v.length <= 7) formatted = `(${v.slice(0, 2)}) ${v.slice(2)}`;
                          else formatted = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7, 11)}`;
                        }
                        field.onChange(formatted);
                      }}
                      className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]" 
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">Idade *</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Sua idade em anos" {...field} className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]" />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Qualificação Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white font-heading border-b border-[#c9a44c]/20 pb-2">2. Perfil e Uso</h3>
          
          <FormField
            control={form.control as any}
            name="has_cnh_a"
            render={({ field }) => (
              <FormItem className="space-y-2">
                <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">Possui CNH Categoria A? *</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {CNH_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => field.onChange(opt)}
                      className={cn(
                        "px-4 py-2 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3c56c]",
                        field.value === opt 
                          ? "bg-[#c9a44c] border-[#c9a44c] text-black" 
                          : "bg-[#0d0d0d] border-[#c9a44c]/20 text-zinc-300 hover:border-[#c9a44c]/50"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="purpose_of_use"
            render={({ field }) => (
              <FormItem className="space-y-2 pt-2">
                <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">Finalidade de Uso *</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {PURPOSE_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => field.onChange(opt)}
                      className={cn(
                        "px-4 py-2 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3c56c]",
                        field.value === opt 
                          ? "bg-[#c9a44c] border-[#c9a44c] text-black" 
                          : "bg-[#0d0d0d] border-[#c9a44c]/20 text-zinc-300 hover:border-[#c9a44c]/50"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />
        </div>

        {/* Detalhes da Locação Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white font-heading border-b border-[#c9a44c]/20 pb-2">3. Detalhes do Aluguel</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control as any}
              name="motorcycle_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">Moto Selecionada</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full h-11 bg-[#0d0d0d] border-[#c9a44c]/20 text-sm font-medium rounded-xl text-[#f4f4f2] focus-visible:border-[#e3c56c]">
                        <SelectValue placeholder="Selecione ou deixe em aberto">
                          {field.value === 'none' 
                            ? 'Ainda não decidi' 
                            : availableMotorcycles.find(m => m.id === field.value) 
                              ? `${availableMotorcycles.find(m => m.id === field.value)?.brand} ${availableMotorcycles.find(m => m.id === field.value)?.model} ${availableMotorcycles.find(m => m.id === field.value)?.version || ''}`
                              : 'Selecione ou deixe em aberto'
                          }
                        </SelectValue>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-[#151515] border-[#c9a44c]/30 text-white max-h-[250px]">
                      <SelectItem value="none">Ainda não decidi</SelectItem>
                      {availableMotorcycles.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.brand} {m.model} {m.version || ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="expected_start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">Data Prevista de Início *</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c] [color-scheme:dark]" 
                      min={new Date().toISOString().split('T')[0]} 
                    />
                  </FormControl>
                  <FormMessage className="text-xs text-rose-400" />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control as any}
            name="desired_plan"
            render={({ field }) => (
              <FormItem className="space-y-2 pt-2">
                <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">Plano Desejado *</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {PLAN_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => field.onChange(opt)}
                      className={cn(
                        "px-4 py-2 rounded-xl border text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e3c56c]",
                        field.value === opt 
                          ? "bg-[#c9a44c] border-[#c9a44c] text-black" 
                          : "bg-[#0d0d0d] border-[#c9a44c]/20 text-zinc-300 hover:border-[#c9a44c]/50"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />
        </div>

        <div className="pt-6">
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c9a44c] hover:bg-[#e3c56c] text-[#050505] font-black h-14 rounded-xl shadow-[0_0_20px_rgba(201,164,76,0.3)] transition-all flex items-center justify-center gap-2 text-base cursor-pointer disabled:opacity-50"
          >
            {loading ? (
               <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
               <span>Enviar Proposta de Aluguel</span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
