'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { createMotorcycleAction, updateMotorcycleAction } from '@/lib/actions/motorcycles';
import { PlateLookupField } from '@/components/forms/plate-lookup-field';
import { ImageUploader } from '@/components/gallery/image-uploader';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

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
import { Switch } from '@/components/ui/switch';
import {
  motorcycleStatusLabels,
  operationTypeLabels,
  ownershipTypeLabels,
} from '@/lib/utils/translations';

const fuelLabels: Record<string, string> = {
  gasolina: 'Gasolina',
  etanol: 'Etanol',
  flex: 'Flex',
  eletrico: 'Elétrico',
  diesel: 'Diesel',
};

const transmissionLabels: Record<string, string> = {
  manual: 'Manual',
  automatico: 'Automático',
  semiautomatico: 'Semiautomático',
  cvt: 'CVT',
};

const motorcycleSchema = z.object({
  brand: z.string().min(2, 'Marca é obrigatória'),
  model: z.string().min(2, 'Modelo é obrigatório'),
  version: z.string().optional(),
  year_manufacture: z.coerce
    .number()
    .min(1900, 'Ano de fabricação inválido')
    .max(new Date().getFullYear() + 1, 'Ano inválido'),
  year_model: z.coerce
    .number()
    .min(1900, 'Ano do modelo inválido')
    .max(new Date().getFullYear() + 1, 'Ano inválido'),
  mileage: z.coerce.number().optional(),
  engine_capacity: z.coerce.number().optional(),
  fuel: z.enum(['gasolina', 'etanol', 'flex', 'eletrico', 'diesel']).optional().or(z.literal('')),
  transmission: z
    .enum(['manual', 'automatico', 'semiautomatico', 'cvt'])
    .optional()
    .or(z.literal('')),
  color: z.string().optional(),
  price: z.coerce.number().optional(),
  description: z.string().optional(),
  ownership_type: z.enum(['OWNED', 'CONSIGNMENT']),
  operation_type: z.enum(['SALE', 'RENTAL', 'SALE_AND_RENTAL']),
  status: z.enum([
    'AVAILABLE',
    'RESERVED',
    'SOLD',
    'MAINTENANCE',
    'RENTED',
    'UNAVAILABLE',
    'HIDDEN',
  ]),
  featured: z.boolean().default(false),
  license_plate: z.string().optional(),
  location: z.string().optional(),
});

type MotorcycleFormValues = z.infer<typeof motorcycleSchema>;

interface MotorcycleFormProps {
  initialData?: any;
}

function normalizeOwnership(val?: string): 'OWNED' | 'CONSIGNMENT' {
  if (val === 'CONSIGNMENT') return 'CONSIGNMENT';
  return 'OWNED';
}

function normalizeOperation(val?: string): 'SALE' | 'RENTAL' | 'SALE_AND_RENTAL' {
  if (val === 'RENTAL') return 'RENTAL';
  if (val === 'BOTH' || val === 'SALE_AND_RENTAL') return 'SALE_AND_RENTAL';
  return 'SALE';
}

function normalizeFuel(val?: string): 'gasolina' | 'etanol' | 'flex' | 'eletrico' | 'diesel' {
  if (!val) return 'gasolina';
  const lower = val.toLowerCase();
  if (lower === 'etanol') return 'etanol';
  if (lower === 'flex') return 'flex';
  if (lower === 'eletrico') return 'eletrico';
  if (lower === 'diesel') return 'diesel';
  return 'gasolina';
}

function normalizeTransmission(val?: string): 'manual' | 'automatico' | 'semiautomatico' | 'cvt' {
  if (!val) return 'manual';
  const lower = val.toLowerCase();
  if (lower === 'automatico') return 'automatico';
  if (lower === 'semiautomatico') return 'semiautomatico';
  if (lower === 'cvt') return 'cvt';
  return 'manual';
}

import { MotorcycleImage } from '@/types/database';

export function MotorcycleForm({ initialData }: MotorcycleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [images, setImages] = useState<MotorcycleImage[]>(initialData?.images || []);

  const isEditing = !!initialData?.id;

  const handlePlateSuccess = (data: any) => {
    Object.keys(data).forEach((key) => {
      // @ts-ignore
      form.setValue(key as any, data[key]);
    });
  };

  const form = useForm<MotorcycleFormValues>({
    resolver: zodResolver(motorcycleSchema) as any,
    defaultValues: {
      brand: initialData?.brand || '',
      model: initialData?.model || '',
      version: initialData?.version || '',
      year_manufacture: initialData?.year_manufacture || new Date().getFullYear(),
      year_model: initialData?.year_model || new Date().getFullYear(),
      mileage: initialData?.mileage || 0,
      engine_capacity: initialData?.engine_capacity || 0,
      fuel: normalizeFuel(initialData?.fuel),
      transmission: normalizeTransmission(initialData?.transmission),
      color: initialData?.color || '',
      price: initialData?.price || 0,
      description: initialData?.description || '',
      ownership_type: normalizeOwnership(initialData?.ownership_type),
      operation_type: normalizeOperation(initialData?.operation_type),
      status: initialData?.status || 'AVAILABLE',
      featured: initialData?.featured || false,
      license_plate: initialData?.license_plate || '',
      location: initialData?.location || '',
    },
  });

  async function onSubmit(data: MotorcycleFormValues) {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      let result: any;
      if (isEditing) {
        result = await updateMotorcycleAction(initialData.id, data);
      } else {
        result = await createMotorcycleAction(data);
      }

      if (result?.error) {
        setErrorMsg(`Erro ao salvar: ${result.error}`);
        setLoading(false);
        return;
      }

      setSuccessMsg(
        isEditing ? 'Motocicleta atualizada com sucesso!' : 'Motocicleta cadastrada com sucesso! Redirecionando...',
      );

      setTimeout(() => {
        if (!isEditing && result?.id) {
          router.push(`/admin/motos/${result.id}/editar`);
        } else {
          router.push('/admin/motos');
        }
        router.refresh();
      }, 1500);
    } catch (error: any) {
      console.error(error);
      setErrorMsg('Não foi possível salvar a motocicleta. Verifique os campos e tente novamente.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-card p-4 rounded-lg border border-border shadow-sm">
        <p className="text-sm text-muted-foreground">
          <span className="text-destructive font-bold mr-1">*</span> Indica campos de preenchimento
          obrigatório.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-destructive/15 text-destructive border border-destructive p-4 rounded-md flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {successMsg && (
        <div className="bg-green-500/15 text-green-500 border border-green-500 p-4 rounded-md flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{successMsg}</p>
        </div>
      )}

      {!isEditing && (
        <div className="bg-card p-6 rounded-lg shadow-sm border border-border max-w-md">
          <h3 className="text-sm font-semibold mb-4 text-foreground">
            Busca por Placa{' '}
            <span className="text-xs font-normal text-muted-foreground">(Opcional)</span>
          </h3>
          <PlateLookupField onSuccess={handlePlateSuccess} />
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
          {/* SEÇÃO 1: IDENTIFICAÇÃO */}
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-6">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              Identificação
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control as any}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Marca <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Honda" {...field} className="bg-background" />
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
                    <FormLabel>
                      Modelo <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: CB 500F" {...field} className="bg-background" />
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
                    <FormLabel>
                      Versão{' '}
                      <span className="text-xs font-normal text-muted-foreground">(Opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: ABS"
                        {...field}
                        value={field.value || ''}
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="license_plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Placa{' '}
                      <span className="text-xs font-normal text-muted-foreground">(Opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="ABC-1234"
                        {...field}
                        value={field.value || ''}
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* SEÇÃO 2: ESPECIFICAÇÕES */}
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-6">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              Especificações Técnicas
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <FormField
                control={form.control as any}
                name="year_manufacture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Ano Fabricação <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="bg-background" />
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
                    <FormLabel>
                      Ano Modelo <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="bg-background" />
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
                    <FormLabel>
                      Quilometragem (km){' '}
                      <span className="text-xs font-normal text-muted-foreground">(Opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? 0}
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="engine_capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Cilindrada (cc){' '}
                      <span className="text-xs font-normal text-muted-foreground">(Opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? 0}
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="fuel"
                render={({ field }) => {
                  const currentVal = field.value || 'gasolina';
                  return (
                    <FormItem>
                      <FormLabel>
                        Combustível{' '}
                        <span className="text-xs font-normal text-muted-foreground">
                          (Opcional)
                        </span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={currentVal}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione...">
                              {fuelLabels[currentVal] || currentVal}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gasolina">Gasolina</SelectItem>
                          <SelectItem value="etanol">Etanol</SelectItem>
                          <SelectItem value="flex">Flex</SelectItem>
                          <SelectItem value="eletrico">Elétrico</SelectItem>
                          <SelectItem value="diesel">Diesel</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control as any}
                name="transmission"
                render={({ field }) => {
                  const currentVal = field.value || 'manual';
                  return (
                    <FormItem>
                      <FormLabel>
                        Câmbio{' '}
                        <span className="text-xs font-normal text-muted-foreground">
                          (Opcional)
                        </span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={currentVal}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione...">
                              {transmissionLabels[currentVal] || currentVal}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="automatico">Automático</SelectItem>
                          <SelectItem value="semiautomatico">Semiautomático</SelectItem>
                          <SelectItem value="cvt">CVT</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control as any}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Cor{' '}
                      <span className="text-xs font-normal text-muted-foreground">(Opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Preto"
                        {...field}
                        value={field.value || ''}
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* SEÇÃO 3: COMERCIAL */}
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-6">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              Comercial
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <FormField
                control={form.control as any}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Preço de Venda (R$){' '}
                      <span className="text-xs font-normal text-muted-foreground">(Opcional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        value={field.value ?? 0}
                        className="bg-background"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control as any}
                name="operation_type"
                render={({ field }) => {
                  const currentVal = field.value || 'SALE';
                  return (
                    <FormItem>
                      <FormLabel>
                        Tipo de Operação <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={currentVal}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione o tipo de operação">
                              {operationTypeLabels[
                                currentVal as keyof typeof operationTypeLabels
                              ] || currentVal}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SALE">{operationTypeLabels['SALE']}</SelectItem>
                          <SelectItem value="RENTAL">{operationTypeLabels['RENTAL']}</SelectItem>
                          <SelectItem value="SALE_AND_RENTAL">
                            {operationTypeLabels['SALE_AND_RENTAL']}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control as any}
                name="ownership_type"
                render={({ field }) => {
                  const currentVal = field.value || 'OWNED';
                  return (
                    <FormItem>
                      <FormLabel>
                        Tipo de Propriedade <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={currentVal}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione o tipo de propriedade">
                              {ownershipTypeLabels[
                                currentVal as keyof typeof ownershipTypeLabels
                              ] || currentVal}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="OWNED">{ownershipTypeLabels['OWNED']}</SelectItem>
                          <SelectItem value="CONSIGNMENT">
                            {ownershipTypeLabels['CONSIGNMENT']}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription className="text-xs text-muted-foreground">
                        Consignação é o nome interno usado para motos anunciadas para terceiros.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
            </div>
          </div>

          {/* SEÇÃO 4: DESCRIÇÃO */}
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-6">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              Descrição Comercial{' '}
              <span className="text-xs font-normal text-muted-foreground">(Opcional)</span>
            </h2>
            <FormField
              control={form.control as any}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva a motocicleta em detalhes para o anúncio..."
                      className="resize-none bg-background"
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

          {/* SEÇÃO 5: IMAGENS */}
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-6">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              Imagens <span className="text-xs font-normal text-muted-foreground">(Opcional)</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              Adicione fotos nítidas da motocicleta. A primeira foto será usada como capa.
            </p>
            <div className="bg-background p-4 border border-border rounded-md">
              <ImageUploader
                motorcycleId={initialData?.id}
                images={images}
                onImagesChange={setImages}
              />
            </div>
          </div>

          {/* SEÇÃO 6: PUBLICAÇÃO */}
          <div className="bg-card p-6 rounded-lg shadow-sm border border-border space-y-6">
            <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
              Publicação
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control as any}
                name="status"
                render={({ field }) => {
                  const currentVal = field.value || 'AVAILABLE';
                  return (
                    <FormItem>
                      <FormLabel>
                        Status de Visibilidade <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={currentVal}>
                        <FormControl>
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder="Selecione o status">
                              {motorcycleStatusLabels[
                                currentVal as keyof typeof motorcycleStatusLabels
                              ] || currentVal}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(motorcycleStatusLabels).map(([key, label]) => (
                            <SelectItem key={key} value={key}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control as any}
                name="featured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Moto em Destaque</FormLabel>
                      <FormDescription>
                        Exibir esta moto na seção principal do site.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {form.formState.isDirty && (
            <div className="bg-yellow-500/10 text-yellow-600 border border-yellow-500/30 p-3 rounded-md text-sm">
              Você tem alterações não salvas.
            </div>
          )}

          <div className="flex justify-end gap-4 sticky bottom-4 bg-card/80 backdrop-blur-sm p-4 border border-border rounded-lg shadow-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8"
              disabled={loading}
            >
              {loading
                ? isEditing
                  ? 'Salvando...'
                  : 'Cadastrando...'
                : isEditing
                  ? 'Salvar alterações'
                  : 'Cadastrar moto'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
