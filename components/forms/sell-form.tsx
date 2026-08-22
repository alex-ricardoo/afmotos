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

const sellSchema = z.object({
  name: z.string().min(2, 'Nome é obrigatório'),
  phone: z.string().min(10, 'Telefone é obrigatório'),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  brand: z.string().min(2, 'Marca é obrigatória'),
  model: z.string().min(2, 'Modelo é obrigatório'),
  year_manufacture: z.coerce.number().min(1900),
  year_model: z.coerce.number().min(1900),
  mileage: z.coerce.number().optional(),
  message: z.string().optional(),
});

type SellFormValues = z.infer<typeof sellSchema>;

export function SellForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const form = useForm<SellFormValues>({
    resolver: zodResolver(sellSchema) as any,
    defaultValues: {
      name: '',
      phone: '',
      email: '',
      brand: '',
      model: '',
      year_manufacture: new Date().getFullYear(),
      year_model: new Date().getFullYear(),
      mileage: 0,
      message: '',
    },
  });

  const handlePlateSuccess = (data: any) => {
    Object.keys(data).forEach((key) => {
      // @ts-ignore
      form.setValue(key as any, data[key]);
    });
  };

  async function onSubmit(data: SellFormValues) {
    setLoading(true);
    try {
      const result = await createLeadAction({
        type: 'SELL_MOTORCYCLE',
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
        },
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Sua proposta foi enviada com sucesso!');
        setSuccess(true);
      }
    } catch (error) {
      toast.error('Ocorreu um erro ao enviar sua proposta.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-lg text-center">
        <h3 className="text-xl font-semibold mb-2">Proposta Enviada!</h3>
        <p>
          Recebemos as informações da sua moto. Nossa equipe entrará em contato em breve para
          apresentar uma oferta.
        </p>
        <Button className="mt-4" variant="outline" onClick={() => setSuccess(false)}>
          Enviar outra moto
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-slate-50 p-6 rounded-lg border">
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

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Solicitação de Venda'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
