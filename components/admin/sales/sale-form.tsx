'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Bike,
  DollarSign,
  User,
  Calendar,
  Phone,
  CheckCircle2,
  Sparkles,
  MapPin,
  Loader2,
  ShieldCheck,
  Printer,
  ChevronDown,
  ChevronUp,
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
import { Checkbox } from '@/components/ui/checkbox';
import { saleSchema, SaleFormValues } from '@/lib/validations/sale';
import { createSaleAction, updateSaleAction } from '@/lib/actions/sales';
import { SaleWithDetails } from '@/lib/queries/sales';
import {
  formatCpf,
  formatPhone,
  formatCep,
  formatRenavam,
  formatChassi,
  formatCurrency,
  cleanNumeric,
} from '@/lib/utils/formatters';

interface AvailableMotorcycle {
  id: string;
  brand: string;
  model: string;
  version: string | null;
  year_manufacture: number;
  year_model: number;
  price: number | null;
  fipe_price: number | null;
  status: string;
  license_plate: string | null;
  color: string | null;
  mileage: number | null;
  renavam?: string | null;
  chassi?: string | null;
  images?: Array<{
    id?: string;
    public_url?: string | null;
    display_url?: string | null;
    is_primary?: boolean;
    storage_path?: string | null;
  }>;
}

interface SaleFormProps {
  motorcycles: AvailableMotorcycle[];
  selectedMotorcycleId?: string;
  initialReceiptNumber?: string;
  initialSale?: SaleWithDetails | null;
}

const paymentMethods = [
  { value: 'PIX', label: 'PIX (À Vista)' },
  { value: 'CARTAO', label: 'Cartão de Crédito / Débito' },
  { value: 'DINHEIRO', label: 'Dinheiro em Espécie' },
  { value: 'TROCA', label: 'Moto / Veículo na Troca' },
  { value: 'TRANSFERENCIA', label: 'Transferência Bancária / TED' },
  { value: 'OUTRO', label: 'Outras Condições' },
];

const paymentStatuses = [
  { value: 'PAID', label: 'Quitado (Pago Integralmente)' },
  { value: 'PARTIAL', label: 'Parcial / Entrada Paga' },
  { value: 'PENDING', label: 'Pendente de Pagamento' },
];

const quickDeliveryTemplates = [
  {
    label: 'Entrega Técnica Completa',
    text: 'Entrega técnica realizada com sucesso. Manual do proprietário, chave reserva e termos de garantia foram conferidos e entregues ao comprador no ato.',
  },
  {
    label: 'Vistoria e Transferência',
    text: 'Veículo aprovado em vistoria mecânica e estética. Documentação de transferência entregue para transferência obrigatória em 30 dias (Art. 123 do CTB).',
  },
  {
    label: 'Moto na Troca',
    text: 'Veículo usado recebido como parte de pagamento mediante vistoria prévia e termo de quitação mútua.',
  },
];

export function SaleForm({
  motorcycles,
  selectedMotorcycleId,
  initialReceiptNumber = 'AFM-2026-0001',
  initialSale,
}: SaleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);
  const [showManualFiscal, setShowManualFiscal] = useState(false);
  const [successSale, setSuccessSale] = useState<{ id: string; receiptNumber: string } | null>(null);

  const isEditing = !!initialSale;
  const todayStr = new Date().toISOString().split('T')[0];
  const motoId = initialSale?.motorcycle_id || selectedMotorcycleId || '';
  const defaultMotorcycle = motorcycles.find((m) => m.id === motoId);

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema) as any,
    defaultValues: {
      motorcycle_id: motoId,
      renavam: initialSale?.renavam || defaultMotorcycle?.renavam || '',
      chassi: initialSale?.chassi || defaultMotorcycle?.chassi || '',
      delivery_km: initialSale?.delivery_km ?? defaultMotorcycle?.mileage ?? 0,
      sale_price: Number(initialSale?.sale_price ?? defaultMotorcycle?.price ?? 0),
      sale_date: initialSale?.sale_date ? initialSale.sale_date.split('T')[0] : todayStr,
      buyer_name: initialSale?.buyer_name || '',
      buyer_phone: initialSale?.buyer_phone || '',
      buyer_email: initialSale?.buyer_email || '',
      buyer_document: initialSale?.buyer_document || '',
      buyer_cep: initialSale?.buyer_cep || '',
      buyer_street: initialSale?.buyer_street || '',
      buyer_number: initialSale?.buyer_number || '',
      buyer_complement: initialSale?.buyer_complement || '',
      buyer_neighborhood: initialSale?.buyer_neighborhood || '',
      buyer_city: initialSale?.buyer_city || '',
      buyer_state: initialSale?.buyer_state || 'PE',
      buyer_address: initialSale?.buyer_address || '',
      payment_method: (initialSale?.payment_method as any) || 'PIX',
      payment_status: (initialSale?.payment_status as any) || 'PAID',
      amount_paid: Number(initialSale?.amount_paid ?? initialSale?.sale_price ?? defaultMotorcycle?.price ?? 0),
      entry_amount: Number(initialSale?.entry_amount ?? 0),
      financed_amount: 0,
      trade_amount: Number(initialSale?.trade_amount ?? 0),
      legal_terms_accepted: initialSale?.legal_terms_accepted ?? true,
      receipt_number: initialSale?.receipt_number || initialReceiptNumber,
      receipt_notes: initialSale?.receipt_notes || '',
      notes: initialSale?.notes || '',
    },
  });

  const selectedMotoId = form.watch('motorcycle_id');
  const selectedMoto = motorcycles.find((m) => m.id === selectedMotoId) || defaultMotorcycle;
  const salePrice = Number(form.watch('sale_price')) || 0;
  const entryAmount = Number(form.watch('entry_amount')) || 0;
  const tradeAmount = Number(form.watch('trade_amount')) || 0;

  const hasMotoFiscalInStock = Boolean(selectedMoto?.renavam && selectedMoto?.chassi);

  // Atualiza campos quando o veículo for alterado na criação
  const handleMotorcycleChange = (id: string | null) => {
    if (!id) return;
    form.setValue('motorcycle_id', id, { shouldValidate: true });
    const moto = motorcycles.find((m) => m.id === id);
    if (moto) {
      if (moto.price) {
        form.setValue('sale_price', Number(moto.price), { shouldValidate: true });
        form.setValue('amount_paid', Number(moto.price), { shouldValidate: true });
      }
      if (moto.renavam) {
        form.setValue('renavam', moto.renavam);
      }
      if (moto.chassi) {
        form.setValue('chassi', moto.chassi);
      }
      if (moto.mileage !== null && moto.mileage !== undefined) {
        form.setValue('delivery_km', moto.mileage);
      }
    }
  };

  // Busca CEP via API pública ViaCEP
  const handleCepLookup = async (val: string) => {
    const formatted = formatCep(val);
    form.setValue('buyer_cep', formatted);
    const clean = cleanNumeric(formatted);

    if (clean.length === 8) {
      setLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const data = await res.json();

        if (!data.erro) {
          if (data.logradouro) form.setValue('buyer_street', data.logradouro, { shouldValidate: true });
          if (data.bairro) form.setValue('buyer_neighborhood', data.bairro, { shouldValidate: true });
          if (data.localidade) form.setValue('buyer_city', data.localidade, { shouldValidate: true });
          if (data.uf) form.setValue('buyer_state', data.uf.toUpperCase(), { shouldValidate: true });
          toast.success('Endereço preenchido com sucesso pelo CEP!');
        } else {
          toast.error('CEP não localizado na base dos Correios.');
        }
      } catch {
        toast.error('Não foi possível consultar o CEP.');
      } finally {
        setLoadingCep(false);
      }
    }
  };

  async function onSubmit(data: SaleFormValues) {
    setLoading(true);
    try {
      if (isEditing && initialSale?.id) {
        const res = await updateSaleAction(initialSale.id, data);
        if (res?.error) {
          toast.error(res.error);
        } else if (res?.success) {
          toast.success('Registro de venda atualizado com sucesso!');
          router.push(`/admin/vendas/${initialSale.id}/recibo`);
          router.refresh();
        }
      } else {
        const res = await createSaleAction(data);
        if (res?.error) {
          toast.error(res.error);
        } else if (res?.success) {
          toast.success('Venda concluída e registrada com sucesso!');
          setSuccessSale({
            id: res.id,
            receiptNumber: res.receiptNumber || data.receipt_number || 'AFM-2026-0001',
          });
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Erro inesperado ao salvar a venda.');
    } finally {
      setLoading(false);
    }
  }

  // Se a venda foi concluída com sucesso, exibe tela de confirmação e atalhos imediatos
  if (successSale) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 animate-in fade-in-50 duration-300">
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -z-10" />
          
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold rounded-full mb-3">
            RECIBO OFICIAL: {successSale.receiptNumber}
          </span>

          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            Venda Registrada com Sucesso!
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto mb-8">
            O veículo foi marcado como vendido e o comprovante oficial A4 com todos os dados fiscais e contratuais está pronto para emissão.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              onClick={() => router.push(`/admin/vendas/${successSale.id}/recibo`)}
              className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-6 py-2.5 h-auto rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Imprimir Recibo Oficial A4
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push('/admin/vendas')}
              className="w-full sm:w-auto border-slate-700 hover:bg-slate-800 text-slate-200 px-6 py-2.5 h-auto rounded-xl cursor-pointer"
            >
              Ver Histórico de Vendas
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8 max-w-5xl mx-auto pb-20">
        
        {/* 1. SELEÇÃO & DADOS DO VEÍCULO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <Bike className="w-5 h-5 text-amber-500" />
                Identificação do Veículo
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing ? 'Motocicleta vinculada a este registro de venda.' : 'Selecione a motocicleta em estoque.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Se estiver editando: exibe card da moto selecionada de forma limpa */}
            {isEditing ? (
              <div className="md:col-span-2 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-16 sm:w-24 sm:h-20 relative rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-800">
                  {selectedMoto?.images && selectedMoto.images.length > 0 ? (
                    <Image
                      src={selectedMoto.images[0].display_url || selectedMoto.images[0].public_url || ''}
                      alt={selectedMoto.model}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Bike className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left min-w-0">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-white">
                      {selectedMoto
                        ? `${selectedMoto.brand} ${selectedMoto.model} ${selectedMoto.version || ''}`
                        : initialSale?.motorcycle
                        ? `${initialSale.motorcycle.brand} ${initialSale.motorcycle.model}`
                        : 'Motocicleta Vinculada'}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Veículo da Venda
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1.5 text-xs text-slate-400">
                    {selectedMoto && (
                      <>
                        <span>Ano: {selectedMoto.year_manufacture}/{selectedMoto.year_model}</span>
                        <span>•</span>
                        <span>Cor: {selectedMoto.color || 'Não informada'}</span>
                        <span>•</span>
                        <span>Placa: <strong className="text-slate-200">{selectedMoto.license_plate || 'Sem placa'}</strong></span>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-center sm:text-right shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Preço de Tabela</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-400 font-mono">
                    {formatCurrency(selectedMoto?.price || initialSale?.sale_price || 0)}
                  </span>
                </div>
              </div>
            ) : (
              /* Se for nova venda: exibe o select com lista de motos disponíveis */
              <FormField
                control={form.control}
                name="motorcycle_id"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-slate-300 font-medium">
                      Motocicleta em Estoque <span className="text-rose-500">*</span>
                    </FormLabel>
                    <Select onValueChange={handleMotorcycleChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500">
                          <SelectValue placeholder="Selecione a moto disponível..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 max-h-72">
                        {motorcycles.map((m) => (
                          <SelectItem key={m.id} value={m.id} className="py-2.5 cursor-pointer">
                            <span className="font-semibold text-white">
                              {m.brand} {m.model} {m.version || ''}
                            </span>{' '}
                            <span className="text-slate-400 text-xs">
                              ({m.year_manufacture}/{m.year_model})
                            </span>{' '}
                            {m.license_plate && (
                              <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[11px] text-amber-400 font-mono ml-1">
                                {m.license_plate}
                              </span>
                            )}{' '}
                            <span className="text-emerald-400 font-medium ml-2">
                              {formatCurrency(m.price)}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Card de Preview se nova venda e selecionada */}
            {!isEditing && selectedMoto && (
              <div className="md:col-span-2 bg-slate-950/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4">
                <div className="w-20 h-16 sm:w-24 sm:h-20 relative rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-slate-800">
                  {selectedMoto.images && selectedMoto.images.length > 0 ? (
                    <Image
                      src={selectedMoto.images[0].display_url || selectedMoto.images[0].public_url || ''}
                      alt={selectedMoto.model}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Bike className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left min-w-0">
                  <h3 className="text-base font-bold text-white">
                    {selectedMoto.brand} {selectedMoto.model} {selectedMoto.version || ''}
                  </h3>
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1 text-xs text-slate-400">
                    <span>Ano: {selectedMoto.year_manufacture}/{selectedMoto.year_model}</span>
                    <span>•</span>
                    <span>Cor: {selectedMoto.color || 'Não informada'}</span>
                    <span>•</span>
                    <span>Placa: <strong className="text-slate-200">{selectedMoto.license_plate || 'Sem placa'}</strong></span>
                  </div>
                </div>

                <div className="text-center sm:text-right shrink-0">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Preço de Tabela</span>
                  <span className="text-base sm:text-lg font-bold text-emerald-400">
                    {formatCurrency(selectedMoto.price)}
                  </span>
                </div>
              </div>
            )}

            {/* Bloco Inteligente de Dados Fiscais (Renavam & Chassi) */}
            {hasMotoFiscalInStock && !showManualFiscal ? (
              <div className="md:col-span-2 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Dados Fiscais Vinculados:</strong> Renavam{' '}
                    <span className="font-mono font-bold text-amber-400">{selectedMoto?.renavam}</span> • Chassi{' '}
                    <span className="font-mono font-bold text-amber-400">{selectedMoto?.chassi}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualFiscal(true)}
                  className="text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer text-xs shrink-0"
                >
                  Alterar nesta venda
                </button>
              </div>
            ) : (
              <>
                {/* Renavam */}
                <FormField
                  control={form.control}
                  name="renavam"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 font-medium flex items-center justify-between">
                        <span>Renavam</span>
                        <span className="text-xs text-slate-500 font-normal">11 dígitos</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          maxLength={11}
                          onChange={(e) => field.onChange(formatRenavam(e.target.value))}
                          placeholder="Ex: 01234567890"
                          className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl font-mono focus:border-amber-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Chassi */}
                <FormField
                  control={form.control}
                  name="chassi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-300 font-medium flex items-center justify-between">
                        <span>Chassi (VIN)</span>
                        <span className="text-xs text-slate-500 font-normal">17 caracteres</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          maxLength={17}
                          onChange={(e) => field.onChange(formatChassi(e.target.value))}
                          placeholder="Ex: 9C2JC4100ER000001"
                          className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl font-mono uppercase focus:border-amber-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* KM na Entrega */}
            <FormField
              control={form.control}
              name="delivery_km"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-slate-300 font-medium flex items-center justify-between">
                    <span>Quilometragem no Ato da Entrega (KM)</span>
                    <span className="text-xs text-slate-500 font-normal">Registrado no recibo de entrega física</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      placeholder="Ex: 14500"
                      className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl font-mono focus:border-amber-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* 2. DADOS DO COMPRADOR & ENDEREÇO */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" />
                Dados do Comprador & Endereço Completo
              </h2>
              <p className="text-xs text-slate-400">
                Informações cadastrais para identificação no recibo e termo de transferência.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Nome do Comprador */}
            <FormField
              control={form.control}
              name="buyer_name"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-slate-300 font-medium">
                    Nome Completo do Comprador <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Ex: Alex Ricardo da Silva"
                      className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* CPF */}
            <FormField
              control={form.control}
              name="buyer_document"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 font-medium">
                    CPF do Comprador <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      maxLength={14}
                      onChange={(e) => field.onChange(formatCpf(e.target.value))}
                      placeholder="000.000.000-00"
                      className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl font-mono focus:border-amber-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Telefone / WhatsApp */}
            <FormField
              control={form.control}
              name="buyer_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 font-medium flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-amber-500" />
                    Telefone / WhatsApp <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(formatPhone(e.target.value))}
                      placeholder="(11) 98765-4321"
                      className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl font-mono focus:border-amber-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sub-seção de Endereço */}
            <div className="md:col-span-2 pt-2 border-t border-slate-800/80">
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                Endereço de Faturamento & Residência
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3.5 sm:gap-4">
                {/* CEP */}
                <FormField
                  control={form.control}
                  name="buyer_cep"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2 md:col-span-2">
                      <FormLabel className="text-slate-300 text-xs font-medium flex items-center justify-between">
                        <span>CEP <span className="text-rose-500">*</span></span>
                        {loadingCep && <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />}
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => handleCepLookup(e.target.value)}
                          placeholder="00000-000"
                          maxLength={9}
                          className="bg-slate-950 border-slate-800 text-slate-200 h-11 rounded-xl font-mono focus:border-amber-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Logradouro */}
                <FormField
                  control={form.control}
                  name="buyer_street"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2 md:col-span-4">
                      <FormLabel className="text-slate-300 text-xs font-medium">
                        Rua / Logradouro <span className="text-rose-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="Ex: Av. Principal, Rua das Flores"
                          className="bg-slate-950 border-slate-800 text-slate-200 h-11 rounded-xl focus:border-amber-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Número */}
                <FormField
                  control={form.control}
                  name="buyer_number"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-1 md:col-span-2">
                      <FormLabel className="text-slate-300 text-xs font-medium">
                        Número <span className="text-rose-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="Ex: 120 ou S/N"
                          className="bg-slate-950 border-slate-800 text-slate-200 h-11 rounded-xl focus:border-amber-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Complemento */}
                <FormField
                  control={form.control}
                  name="buyer_complement"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-1 md:col-span-4">
                      <FormLabel className="text-slate-300 text-xs font-medium">Complemento (Opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="Apto, Casa 2, Bloco B"
                          className="bg-slate-950 border-slate-800 text-slate-200 h-11 rounded-xl focus:border-amber-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bairro */}
                <FormField
                  control={form.control}
                  name="buyer_neighborhood"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-1 md:col-span-2">
                      <FormLabel className="text-slate-300 text-xs font-medium">
                        Bairro <span className="text-rose-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="Ex: Centro"
                          className="bg-slate-950 border-slate-800 text-slate-200 h-11 rounded-xl focus:border-amber-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Cidade */}
                <FormField
                  control={form.control}
                  name="buyer_city"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-1 md:col-span-3">
                      <FormLabel className="text-slate-300 text-xs font-medium">
                        Cidade <span className="text-rose-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          placeholder="Ex: São Paulo"
                          className="bg-slate-950 border-slate-800 text-slate-200 h-11 rounded-xl focus:border-amber-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* UF */}
                <FormField
                  control={form.control}
                  name="buyer_state"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-1 md:col-span-1">
                      <FormLabel className="text-slate-300 text-xs font-medium">
                        UF <span className="text-rose-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase().slice(0, 2))}
                          placeholder="PE"
                          maxLength={2}
                          className="bg-slate-950 border-slate-800 text-slate-200 h-11 rounded-xl uppercase font-mono text-center focus:border-amber-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. CONDIÇÕES FINANCEIRAS & DISCRIMINAÇÃO DE VALORES (SEM FINANCIAMENTO) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-500" />
                Condições Financeiras & Discriminação de Valores
              </h2>
              <p className="text-xs text-slate-400">
                Defina o valor fechado, forma de pagamento, valores de entrada ou moto na troca.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {/* Valor Total da Venda */}
            <FormField
              control={form.control}
              name="sale_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 font-medium">
                    Valor Total da Venda (R$) <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : 0;
                        field.onChange(val);
                        form.setValue('amount_paid', val);
                      }}
                      placeholder="0.00"
                      className="bg-slate-950 border-slate-800 text-emerald-400 font-bold text-lg h-12 rounded-xl focus:border-amber-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Forma de Pagamento */}
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 font-medium">
                    Forma de Pagamento <span className="text-rose-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500">
                        <SelectValue placeholder="Selecione a forma..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      {paymentMethods.map((pm) => (
                        <SelectItem key={pm.value} value={pm.value} className="cursor-pointer">
                          {pm.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Data da Venda */}
            <FormField
              control={form.control}
              name="sale_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 font-medium flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    Data da Venda <span className="text-rose-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor de Entrada */}
            <FormField
              control={form.control}
              name="entry_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 text-xs font-medium">
                    Valor de Entrada (R$)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                      placeholder="0.00"
                      className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl font-mono focus:border-amber-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Valor na Troca */}
            <FormField
              control={form.control}
              name="trade_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 text-xs font-medium">
                    Valor Moto na Troca (R$)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={field.value ?? 0}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                      placeholder="0.00"
                      className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl font-mono focus:border-amber-500"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status de Quitação em Português */}
            <FormField
              control={form.control}
              name="payment_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 font-medium">
                    Situação de Quitação <span className="text-rose-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-200 h-12 rounded-xl focus:border-amber-500">
                        <SelectValue placeholder="Selecione a situação..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      {paymentStatuses.map((ps) => (
                        <SelectItem key={ps.value} value={ps.value} className="cursor-pointer">
                          {ps.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Resumo visual de discriminação sem financiamento */}
          <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
              <div>
                <span className="text-slate-500 block text-[11px]">Valor Venda</span>
                <span className="font-bold text-white text-sm font-mono">{formatCurrency(salePrice)}</span>
              </div>
              <span className="text-slate-600 font-bold">=</span>
              <div>
                <span className="text-slate-500 block text-[11px]">Entrada</span>
                <span className="font-medium text-slate-300 font-mono">{formatCurrency(entryAmount)}</span>
              </div>
              <span className="text-slate-600 font-bold">+</span>
              <div>
                <span className="text-slate-500 block text-[11px]">Moto na Troca</span>
                <span className="font-medium text-slate-300 font-mono">{formatCurrency(tradeAmount)}</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 px-3.5 py-1.5 rounded-lg text-left sm:text-right w-full sm:w-auto">
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Saldo em Aberto</span>
              <span className={`font-bold font-mono text-sm ${salePrice - (entryAmount + tradeAmount) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {formatCurrency(Math.max(0, salePrice - (entryAmount + tradeAmount)))}
              </span>
            </div>
          </div>
        </div>

        {/* 4. OBSERVAÇÕES COMERCIAIS & TERMOS LEGAIS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-sm">
              4
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                Observações Comerciais & Termos de Entrega
              </h2>
              <p className="text-xs text-slate-400">
                Termos impressos no recibo formalizando a entrega física e a responsabilidade de transferência.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Atalhos de Texto Padrão */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
                <Sparkles className="w-3 h-3 text-amber-400" /> Sugestões de texto rápido:
              </span>
              {quickDeliveryTemplates.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => form.setValue('receipt_notes', item.text)}
                  className="px-2.5 py-1 bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-[11px] text-slate-300 rounded-lg transition-colors cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Observações do Recibo */}
            <FormField
              control={form.control}
              name="receipt_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300 font-medium">
                    Observações de Entrega Técnica (Impresso no Recibo)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder="Ex: Veículo entregue revisado, com chave reserva e manual. Vistoria aprovada sem ressalvas..."
                      rows={3}
                      className="bg-slate-950 border-slate-800 text-slate-200 rounded-xl focus:border-amber-500 text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notas Internas da Loja */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-400 text-xs font-normal">
                    Anotações Internas da Loja (Opcional - Não sai no recibo)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value || ''}
                      placeholder="Ex: Venda indicada por parceiro ou detalhes internos..."
                      className="bg-slate-950 border-slate-800 text-slate-300 h-11 rounded-xl focus:border-slate-700"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Aceite dos Termos Legais */}
            <FormField
              control={form.control}
              name="legal_terms_accepted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 mt-1"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-semibold text-slate-200 cursor-pointer">
                      Aceite das Cláusulas Oficiais de Entrega e Responsabilidade CTB
                    </FormLabel>
                    <FormDescription className="text-xs text-slate-400 leading-relaxed">
                      O comprador declara aprovação na vistoria, assume obrigação de transferência junto ao DETRAN em 30 dias (Art. 123 do CTB) e responsabilidade por infrações a partir da entrega física.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Barra Inferior com Botão de Ação */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={loading}
            className="w-full sm:w-auto text-slate-400 hover:text-white cursor-pointer"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={loading || !selectedMotoId}
            className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-8 py-3.5 h-auto rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer text-sm sm:text-base"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isEditing ? 'Salvando Alterações no Recibo...' : 'Registrando Venda & Gerando Recibo...'}
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                {isEditing ? 'Salvar Alterações no Recibo' : 'Concluir Venda & Emitir Recibo Oficial'}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
