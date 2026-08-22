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
import { PlateLookupField } from './plate-lookup-field';

const consignmentSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  phone: z.string().min(10, 'Telefone é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  brand: z.string().min(2, 'Marca é obrigatória'),
  model: z.string().min(2, 'Modelo é obrigatório'),
  year_manufacture: z.coerce.number().min(1900),
  year_model: z.coerce.number().min(1900),
  mileage: z.coerce.number().optional(),
  desired_price: z.coerce.number().optional(),
  message: z.string().optional(),
});

type ConsignmentFormValues = z.infer<typeof consignmentSchema>;

export function ConsignmentForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<ConsignmentFormValues>({
    resolver: zodResolver(consignmentSchema) as any,
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      brand: '',
      model: '',
      year_manufacture: new Date().getFullYear(),
      year_model: new Date().getFullYear(),
      mileage: 0,
      desired_price: 0,
      message: '',
    },
  });

  const handlePlateSuccess = (data: any) => {
    Object.keys(data).forEach((key) => {
      // @ts-ignore
      form.setValue(key as any, data[key]);
    });
  };

  async function onSubmit(data: ConsignmentFormValues) {
    setLoading(true);
    try {
      const result = await createLeadAction({
        type: 'CONSIGNMENT',
        name: data.name,
        phone: data.phone,
        email: data.email,
        message: data.message,
        metadata: {
          brand: data.brand,
          model: data.model,
          year_manufacture: data.year_manufacture,
          year_model: data.year_model,
          mileage: data.mileage,
          desired_price: data.desired_price,
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
        <h3 className="text-xl font-bold text-white">Informações Enviadas!</h3>
        <p className="text-sm text-[#a6a6a1]">
          Recebemos as informações da sua moto. Vamos analisar os dados e entrar em contato com você
          pelo WhatsApp para combinar os detalhes do anúncio.
        </p>
        <Button
          className="mt-4 bg-[#c9a44c] hover:bg-[#e3c56c] text-black font-bold"
          onClick={() => setSuccess(false)}
        >
          Enviar outra moto
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-[#151515] p-6 rounded-2xl border border-[#c9a44c]/20 shadow-sm">
        <PlateLookupField onSuccess={handlePlateSuccess} />
      </div>

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
              <h3 className="font-semibold text-lg border-b pb-2">Dados da Moto</h3>
            </div>

            <FormField
              control={form.control as any}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Honda" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: CG 160 Titan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="year_manufacture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano Fabricação</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="year_model"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano Modelo</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control as any}
              name="mileage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quilometragem</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="desired_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Desejado (R$)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} value={field.value || 0} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="message"
              render={({ field }) => (
                <FormItem className="col-span-1 md:col-span-2">
                  <FormLabel>Observações adicionais</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detalhes sobre estado de conservação, acessórios, etc."
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
            {loading ? 'Enviando...' : 'Enviar Dados para Anúncio'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
