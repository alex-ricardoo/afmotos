'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { customRentalSchema, CustomRentalInput } from '@/lib/validations/lead';
import { createLeadAction } from '@/lib/actions/leads';

const DURATION_OPTIONS = [
  { label: '1 mês', value: '1_mes' },
  { label: '2 meses', value: '2_meses' },
  { label: '3 meses', value: '3_meses' },
  { label: '6 meses', value: '6_meses' },
  { label: '12 meses (1 ano)', value: '12_meses' },
  { label: 'Outro período personalizado', value: 'outro_periodo' },
];

export function CustomRentalForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<CustomRentalInput>({
    resolver: zodResolver(customRentalSchema) as any,
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      duration: '',
      start_date: '',
      preferred_model: '',
      message: '',
    },
  });

  async function onSubmit(data: CustomRentalInput) {
    setLoading(true);
    try {
      const durationLabel =
        DURATION_OPTIONS.find((opt) => opt.value === data.duration)?.label || data.duration;

      const result = await createLeadAction({
        type: 'RENTAL',
        name: data.name,
        phone: data.phone,
        email: data.email || undefined,
        message: data.message || undefined,
        metadata: {
          custom_plan: true,
          duration: durationLabel,
          start_date: data.start_date || undefined,
          preferred_model: data.preferred_model || undefined,
        },
      });

      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success(
          'Recebemos sua solicitação. Vamos falar com você para montar uma condição personalizada.',
        );
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
    return (
      <div className="bg-[#151515] border border-emerald-500/40 text-[#f4f4f2] p-6 sm:p-8 rounded-2xl text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-white font-heading">
          Solicitação de Plano Recebida!
        </h3>
        <p className="text-sm text-[#a6a6a1] max-w-md mx-auto leading-relaxed">
          Recebemos o seu interesse em locação. Vamos verificar a disponibilidade de motos e entrar
          em contato pelo WhatsApp para apresentar uma proposta sob medida.
        </p>
        <div className="pt-2">
          <Button
            className="bg-[#c9a44c] hover:bg-[#e3c56c] text-black font-bold h-10 px-6 rounded-xl cursor-pointer"
            onClick={() => setSuccess(false)}
          >
            Nova Solicitação
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control as any}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                  Seu Nome *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: João Souza"
                    {...field}
                    className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]"
                  />
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
                <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                  WhatsApp com DDD *
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: (11) 99999-9999"
                    {...field}
                    className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]"
                  />
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control as any}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                  Período Pretendido *
                </FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full h-11 bg-[#0d0d0d] border-[#c9a44c]/20 text-sm font-medium rounded-xl text-[#f4f4f2] focus-visible:border-[#e3c56c]">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-[#151515] border-[#c9a44c]/30 text-white">
                    {DURATION_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
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
            name="preferred_model"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                  Modelo ou cilindrada pretendida
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 150cc, 160cc, Scooter..."
                    {...field}
                    className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]"
                  />
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control as any}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                  Previsão de Início
                </FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    {...field}
                    className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]"
                  />
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                  E-mail (opcional)
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="seuemail@exemplo.com"
                    {...field}
                    className="bg-[#0d0d0d] border-[#c9a44c]/20 h-11 rounded-xl text-white focus-visible:border-[#e3c56c]"
                  />
                </FormControl>
                <FormMessage className="text-xs text-rose-400" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control as any}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs font-bold uppercase text-[#b8bcc2]">
                Mensagem ou necessidade específica
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Conte para que tipo de uso você precisa da moto, percurso diário aproximado..."
                  rows={3}
                  {...field}
                  className="bg-[#0d0d0d] border-[#c9a44c]/20 rounded-xl text-white focus-visible:border-[#e3c56c]"
                />
              </FormControl>
              <FormMessage className="text-xs text-rose-400" />
            </FormItem>
          )}
        />

        <div className="pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#c9a44c] hover:bg-[#e3c56c] text-[#050505] font-black h-12 rounded-xl shadow-[0_0_20px_rgba(201,164,76,0.3)] transition-all flex items-center justify-center gap-2 text-sm cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando solicitação...</span>
              </>
            ) : (
              <span>Solicitar plano personalizado</span>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
