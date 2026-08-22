'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { createLeadAction } from '@/lib/actions/leads';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const rentalSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  phone: z.string().min(10, 'Telefone é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  duration: z.string().min(1, 'Duração é obrigatória'),
  message: z.string().optional(),
});

type RentalFormValues = z.infer<typeof rentalSchema>;

export function RentalForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<RentalFormValues>({
    resolver: zodResolver(rentalSchema) as any,
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      duration: '',
      message: '',
    },
  });

  async function onSubmit(data: RentalFormValues) {
    setLoading(true);
    try {
      const result = await createLeadAction({
        type: 'RENTAL',
        name: data.name,
        phone: data.phone,
        email: data.email,
        message: data.message,
        metadata: {
          duration: data.duration,
        },
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Recebemos suas informações. Vamos analisar e falar com você pelo WhatsApp.');
        setSuccess(true);
      }
    } catch (error) {
      toast.error('Não foi possível enviar agora. Verifique os campos e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-emerald-950/40 border border-emerald-500/30 text-[#f4f4f2] p-6 rounded-2xl text-center space-y-3">
        <h3 className="text-xl font-bold text-white">Solicitação Enviada!</h3>
        <p className="text-sm text-[#a6a6a1]">
          Recebemos o seu interesse em aluguel. Vamos verificar a disponibilidade e entrar em
          contato com você pelo WhatsApp para apresentar as opções.
        </p>
        <Button
          className="mt-4 bg-[#c9a44c] hover:bg-[#e3c56c] text-black font-bold"
          onClick={() => setSuccess(false)}
        >
          Nova Solicitação
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4 col-span-1 md:col-span-2">
            <h3 className="font-semibold text-lg border-b pb-2">Seus Dados</h3>
          </div>

          <FormField
            control={form.control as any}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Seu nome" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone / WhatsApp</FormLabel>
                <FormControl>
                  <Input placeholder="(00) 00000-0000" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control as any}
            name="email"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>E-mail (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="seu@email.com" type="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4 col-span-1 md:col-span-2 mt-4">
            <h3 className="font-semibold text-lg border-b pb-2">Detalhes do Aluguel</h3>
          </div>

          <FormField
            control={form.control as any}
            name="duration"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Período de Aluguel Desejado</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="DIARIA">Diária</SelectItem>
                    <SelectItem value="SEMANAL">Semanal</SelectItem>
                    <SelectItem value="QUINZENAL">Quinzenal</SelectItem>
                    <SelectItem value="MENSAL">Mensal</SelectItem>
                    <SelectItem value="OUTRO">Outro (especificar nas observações)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="message"
            render={({ field }) => (
              <FormItem className="col-span-1 md:col-span-2">
                <FormLabel>Observações adicionais / Preferências de Moto</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ex: Gostaria de uma moto 160cc para trabalho..."
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-[#c9a44c] hover:bg-[#e3c56c] text-black font-extrabold h-12 rounded-xl shadow-sm cursor-pointer"
          size="lg"
          disabled={loading}
        >
          {loading ? 'Enviando...' : 'Consultar Disponibilidade de Aluguel'}
        </Button>
      </form>
    </Form>
  );
}
