'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { createMotorcycleAction, updateMotorcycleAction } from '@/lib/actions/motorcycles';
import { PlateLookupField } from '@/components/forms/plate-lookup-field';
import { ImageUploader } from '@/components/gallery/image-uploader';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const motorcycleSchema = z.object({
  brand: z.string().min(2, 'Marca é obrigatória'),
  model: z.string().min(2, 'Modelo é obrigatório'),
  version: z.string().optional(),
  year_manufacture: z.coerce
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  year_model: z.coerce
    .number()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  mileage: z.coerce.number().optional(),
  engine_capacity: z.coerce.number().optional(),
  fuel: z.string().optional(),
  transmission: z.string().optional(),
  color: z.string().optional(),
  price: z.coerce.number().optional(),
  description: z.string().optional(),
  ownership_type: z.enum(['OWN', 'CONSIGNMENT']),
  operation_type: z.enum(['SALE', 'RENTAL', 'BOTH']),
  status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'MAINTENANCE', 'RENTED', 'HIDDEN']),
  featured: z.boolean().default(false),
  license_plate: z.string().optional(),
  location: z.string().optional(),
  daily_rate: z.coerce.number().optional(),
  weekly_rate: z.coerce.number().optional(),
  monthly_rate: z.coerce.number().optional(),
});

type MotorcycleFormValues = z.infer<typeof motorcycleSchema>;

interface MotorcycleFormProps {
  initialData?: any;
}

export function MotorcycleForm({ initialData }: MotorcycleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<{ url: string; path: string }[]>(initialData?.images || []);

  const handlePlateSuccess = (data: any) => {
    Object.keys(data).forEach((key) => {
      // @ts-ignore
      form.setValue(key as any, data[key]);
    });
  };

  const handleImageUpload = (url: string, path: string) => {
    setImages((prev) => [...prev, { url, path }]);
  };

  const handleImageDelete = (path: string) => {
    setImages((prev) => prev.filter((img) => img.path !== path));
  };

  const form = useForm<MotorcycleFormValues>({
    resolver: zodResolver(motorcycleSchema) as any,
    defaultValues: initialData || {
      brand: '',
      model: '',
      version: '',
      year_manufacture: new Date().getFullYear(),
      year_model: new Date().getFullYear(),
      mileage: 0,
      engine_capacity: 0,
      fuel: 'Gasolina',
      transmission: 'Manual',
      color: '',
      price: 0,
      description: '',
      ownership_type: 'OWN',
      operation_type: 'SALE',
      status: 'AVAILABLE',
      featured: false,
      license_plate: '',
      location: '',
      daily_rate: 0,
      weekly_rate: 0,
      monthly_rate: 0,
    },
  });

  async function onSubmit(data: MotorcycleFormValues) {
    setLoading(true);

    try {
      const dataWithImages = { ...data, images };

      if (initialData?.id) {
        await updateMotorcycleAction(initialData.id, dataWithImages);
      } else {
        await createMotorcycleAction(dataWithImages);
      }

      router.push('/admin/motos');
      router.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-sm border max-w-md">
        <PlateLookupField onSuccess={handlePlateSuccess} />
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Dados Básicos</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                      <Input placeholder="Ex: CB 500F" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versão</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: ABS" {...field} value={field.value || ''} />
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
                      <Input type="number" {...field} value={field.value || 0} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control as any}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a motocicleta em detalhes..."
                      className="resize-none"
                      rows={5}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Status e Valores</h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control as any}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} value={field.value || 0} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Disponível</SelectItem>
                        <SelectItem value="RESERVED">Reservada</SelectItem>
                        <SelectItem value="SOLD">Vendida</SelectItem>
                        <SelectItem value="MAINTENANCE">Manutenção</SelectItem>
                        <SelectItem value="RENTED">Alugada</SelectItem>
                        <SelectItem value="HIDDEN">Oculta</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="ownership_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Propriedade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="OWN">Própria</SelectItem>
                        <SelectItem value="CONSIGNMENT">Consignação</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 border-b pb-2">Fotos da Motocicleta</h2>
            <div className="bg-slate-50 p-4 border rounded-md">
              <ImageUploader
                onUpload={handleImageUpload}
                onDelete={handleImageDelete}
                images={images}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" className="bg-[#c9a44c] hover:bg-[#b8943c] text-black font-semibold" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
