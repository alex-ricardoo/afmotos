'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import {
  Bike,
  DollarSign,
  User,
  FileText,
  Calendar,
  CreditCard,
  Phone,
  Mail,
  FileCheck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  MapPin,
  Lock,
  Search,
  Loader2,
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
import { saleSchema, SaleFormValues } from '@/lib/validations/sale';
import { createSaleAction } from '@/lib/actions/sales';

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
}

const formatCurrency = (value: number | string) => {
  const clean = String(value).replace(/\D/g, '');
  if (!clean) return '';
  const num = Number(clean) / 100;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
};

// Máscara brasileira de telefone / WhatsApp: (81) 98272-6402
const formatPhoneBR = (val: string) => {
  const clean = val.replace(/\D/g, '');
  if (clean.length <= 2) return clean ? `(${clean}` : '';
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
};

// Máscara de CPF / CNPJ: 000.000.000-00 ou 00.000.000/0000-00
const formatDocumentBR = (val: string) => {
  const clean = val.replace(/\D/g, '');
  if (clean.length <= 11) {
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return clean
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
};

// Máscara de CEP: 00000-000
const formatCepBR = (val: string) => {
  const clean = val.replace(/\D/g, '').slice(0, 8);
  if (clean.length > 5) {
    return `${clean.slice(0, 5)}-${clean.slice(5)}`;
  }
  return clean;
};

const paymentMethods = [
  { value: 'PIX', label: 'PIX' },
  { value: 'DINHEIRO', label: 'Dinheiro (Espécie)' },
  { value: 'TRANSFERENCIA', label: 'Transferência Bancária / TED' },
  { value: 'CARTAO', label: 'Cartão de Crédito / Débito' },
  { value: 'FINANCIAMENTO', label: 'Financiamento Bancário' },
  { value: 'OUTRO', label: 'Outro' },
];

const paymentStatuses = [
  { value: 'PAID', label: 'Pago Integralmente' },
  { value: 'PARTIAL', label: 'Entrada / Parcial' },
  { value: 'PENDING', label: 'Pendente' },
];

export function SaleForm({
  motorcycles,
  selectedMotorcycleId,
  initialReceiptNumber = 'AFM-2026-0001',
}: SaleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // Endereço detalhado
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  const defaultMotorcycle = motorcycles.find((m) => m.id === selectedMotorcycleId);

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleSchema) as any,
    defaultValues: {
      motorcycle_id: selectedMotorcycleId || '',
      sale_price: defaultMotorcycle?.price || 0,
      sale_date: todayStr,
      buyer_name: '',
      buyer_phone: '',
      buyer_email: '',
      buyer_document: '',
      buyer_address: '',
      payment_method: 'PIX',
      payment_status: 'PAID',
      amount_paid: defaultMotorcycle?.price || 0,
      receipt_number: initialReceiptNumber,
      receipt_notes: '',
      notes: '',
    },
  });

  const selectedMotoId = form.watch('motorcycle_id');
  const selectedMoto = motorcycles.find((m) => m.id === selectedMotoId);

  const handleMotorcycleChange = (id: string | null) => {
    if (!id) return;
    form.setValue('motorcycle_id', id, { shouldValidate: true });
    const moto = motorcycles.find((m) => m.id === id);
    if (moto && moto.price) {
      form.setValue('sale_price', Number(moto.price), { shouldValidate: true });
      form.setValue('amount_paid', Number(moto.price), { shouldValidate: true });
    }
  };

  // Monta a string final do endereço no formulário
  const updateCombinedAddress = (
    c = cep,
    l = logradouro,
    n = numero,
    comp = complemento,
    b = bairro,
    cid = cidade,
    uf = estado,
  ) => {
    const parts: string[] = [];
    if (l) parts.push(n ? `${l}, ${n}` : l);
    if (comp) parts.push(comp);
    if (b) parts.push(b);
    if (cid && uf) parts.push(`${cid} - ${uf}`);
    else if (cid) parts.push(cid);
    if (c) parts.push(`CEP: ${c}`);

    const combined = parts.join(' - ');
    form.setValue('buyer_address', combined);
  };

  // Busca CEP via API ViaCEP
  const handleCepChange = async (val: string) => {
    const formatted = formatCepBR(val);
    setCep(formatted);
    const cleanCep = formatted.replace(/\D/g, '');

    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();

        if (data && !data.erro) {
          const newLogradouro = data.logradouro || '';
          const newBairro = data.bairro || '';
          const newCidade = data.localidade || '';
          const newEstado = data.uf || '';

          setLogradouro(newLogradouro);
          setBairro(newBairro);
          setCidade(newCidade);
          setEstado(newEstado);

          updateCombinedAddress(
            formatted,
            newLogradouro,
            numero,
            complemento,
            newBairro,
            newCidade,
            newEstado,
          );
          toast.success(`Endereço localizado: ${newCidade}/${newEstado}`);
        } else {
          toast.error('CEP não localizado');
        }
      } catch (err) {
        console.error('Erro ao consultar CEP:', err);
        toast.error('Erro ao buscar o CEP');
      } finally {
        setLoadingCep(false);
      }
    } else {
      updateCombinedAddress(formatted, logradouro, numero, complemento, bairro, cidade, estado);
    }
  };

  async function onSubmit(data: SaleFormValues) {
    setLoading(true);

    try {
      // Monta o endereço final unificado
      const addressParts: string[] = [];
      if (logradouro) addressParts.push(numero ? `${logradouro}, ${numero}` : logradouro);
      if (complemento) addressParts.push(complemento);
      if (bairro) addressParts.push(bairro);
      if (cidade && estado) addressParts.push(`${cidade} - ${estado}`);
      else if (cidade) addressParts.push(cidade);
      if (cep) addressParts.push(`CEP: ${cep}`);

      const finalAddress =
        addressParts.length > 0 ? addressParts.join(' - ') : data.buyer_address || null;

      const payload: SaleFormValues = {
        ...data,
        buyer_address: finalAddress,
        receipt_number: initialReceiptNumber,
      };

      const result = await createSaleAction(payload);

      if (result.error) {
        toast.error(result.error);
        setLoading(false);
        return;
      }

      toast.success('Venda cadastrada com sucesso!');
      router.push('/admin/vendas');
      router.refresh();
    } catch (error) {
      console.error('Error submitting sale:', error);
      toast.error('Ocorreu um erro ao registrar a venda. Tente novamente.');
      setLoading(false);
    }
  }

  const primaryImage =
    selectedMoto?.images?.find((img) => img.is_primary)?.public_url ||
    selectedMoto?.images?.find((img) => img.is_primary)?.display_url ||
    selectedMoto?.images?.[0]?.public_url ||
    selectedMoto?.images?.[0]?.display_url;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit as any)}
        className="space-y-8 max-w-4xl mx-auto pb-24"
      >
        {/* 1. SELEÇÃO DO VEÍCULO */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border">
            <Bike className="w-5 h-5 text-[#c9a44c]" />
            <h2 className="text-lg font-bold text-foreground">1. Veículo Negociado</h2>
          </div>

          <FormField
            control={form.control as any}
            name="motorcycle_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Selecione a Motocicleta do Estoque <span className="text-destructive">*</span>
                </FormLabel>
                <Select value={field.value} onValueChange={handleMotorcycleChange}>
                  <FormControl>
                    <SelectTrigger className="h-12 bg-background rounded-xl">
                      <SelectValue placeholder="Escolha uma moto disponível...">
                        {selectedMoto
                          ? `${selectedMoto.brand} ${selectedMoto.model} ${selectedMoto.version || ''} (${selectedMoto.year_model})`
                          : undefined}
                      </SelectValue>
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-card border-border">
                    {motorcycles.map((moto) => (
                      <SelectItem key={moto.id} value={moto.id} className="py-2.5">
                        <span className="font-semibold text-foreground">
                          {moto.brand} {moto.model} {moto.version || ''}
                        </span>
                        {' - '}
                        <span className="text-muted-foreground font-mono text-xs">
                          {moto.year_model}
                        </span>
                        {' - '}
                        <span className="text-amber-500 font-bold text-xs">
                          {formatCurrency(moto.price || 0)}
                        </span>
                        {moto.license_plate && (
                          <span className="text-muted-foreground text-[11px] ml-2">
                            ({moto.license_plate})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Preview do veículo selecionado */}
          {selectedMoto && (
            <div className="bg-muted/40 border border-border/70 rounded-xl p-4 flex flex-col sm:flex-row items-center gap-4 animate-in fade-in duration-200">
              {primaryImage ? (
                <div className="relative w-32 h-24 rounded-xl overflow-hidden shrink-0 border border-border bg-black/20 shadow-xs">
                  <Image
                    src={primaryImage}
                    alt={`${selectedMoto.brand} ${selectedMoto.model}`}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-32 h-24 rounded-xl border border-border bg-muted flex flex-col items-center justify-center shrink-0 text-muted-foreground">
                  <Bike className="w-8 h-8 opacity-40" />
                  <span className="text-[10px] mt-1">Sem foto</span>
                </div>
              )}
              <div className="flex-1 space-y-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h3 className="font-bold text-base text-foreground">
                    {selectedMoto.brand} {selectedMoto.model} {selectedMoto.version || ''}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    {selectedMoto.year_manufacture}/{selectedMoto.year_model}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {selectedMoto.color && <span>Cor: {selectedMoto.color}</span>}
                  {selectedMoto.license_plate && (
                    <span>
                      Placa:{' '}
                      <strong className="text-foreground">{selectedMoto.license_plate}</strong>
                    </span>
                  )}
                  {selectedMoto.fipe_price && (
                    <span>Tabela FIPE: {formatCurrency(selectedMoto.fipe_price)}</span>
                  )}
                </div>
              </div>
              <div className="text-center sm:text-right shrink-0">
                <span className="text-xs text-muted-foreground block">Preço no Estoque</span>
                <span className="text-lg font-bold text-foreground">
                  {formatCurrency(selectedMoto.price || 0)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2. DADOS FINANCEIROS & NEGOCIAÇÃO */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border">
            <DollarSign className="w-5 h-5 text-[#c9a44c]" />
            <h2 className="text-lg font-bold text-foreground">
              2. Valores & Condições de Pagamento
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              control={form.control as any}
              name="sale_price"
              render={({ field: { onChange, value, ...fieldProps } }) => (
                <FormItem>
                  <FormLabel>
                    Valor Final da Venda <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...fieldProps}
                      value={
                        value !== undefined && value !== null && value !== ''
                          ? formatCurrency(value)
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        const numVal = val ? Number(val) / 100 : 0;
                        onChange(numVal);
                        if (form.getValues('payment_status') === 'PAID') {
                          form.setValue('amount_paid', numVal);
                        }
                      }}
                      placeholder="R$ 0,00"
                      className="bg-background h-13 rounded-xl text-lg font-bold text-amber-500"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Valor negociado e acordado com o cliente.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="sale_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Data da Venda <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} className="bg-background h-13 rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Forma de Pagamento Principal <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="h-12 bg-background rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-border">
                      {paymentMethods.map((pm) => (
                        <SelectItem key={pm.value} value={pm.value}>
                          {pm.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="payment_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status do Pagamento</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      field.onChange(val);
                      if (val === 'PAID') {
                        form.setValue('amount_paid', form.getValues('sale_price'));
                      }
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="h-12 bg-background rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-card border-border">
                      {paymentStatuses.map((ps) => (
                        <SelectItem key={ps.value} value={ps.value}>
                          {ps.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="amount_paid"
              render={({ field: { onChange, value, ...fieldProps } }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Valor Recebido / Entrada</FormLabel>
                  <FormControl>
                    <Input
                      {...fieldProps}
                      value={
                        value !== undefined && value !== null && value !== ''
                          ? formatCurrency(value)
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        onChange(val ? Number(val) / 100 : 0);
                      }}
                      placeholder="R$ 0,00"
                      className="bg-background h-12 rounded-xl font-semibold"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Para vendas pagas integralmente, preencha com o mesmo valor final.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* 3. DADOS DO COMPRADOR */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border">
            <User className="w-5 h-5 text-[#c9a44c]" />
            <h2 className="text-lg font-bold text-foreground">3. Identificação do Comprador</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField
              control={form.control as any}
              name="buyer_name"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Nome Completo do Comprador</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: João da Silva"
                      {...field}
                      value={field.value || ''}
                      className="bg-background h-12 rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="buyer_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone / WhatsApp (Brasil)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="(81) 98272-6402"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(formatPhoneBR(e.target.value))}
                      className="bg-background h-12 rounded-xl font-mono"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Ex: (81) 98272-6402 com DDD.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="buyer_document"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF / CNPJ (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="000.000.000-00"
                      {...field}
                      value={field.value || ''}
                      onChange={(e) => field.onChange(formatDocumentBR(e.target.value))}
                      className="bg-background h-12 rounded-xl font-mono"
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Impresso no Recibo de Venda / Repasse.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="buyer_email"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>E-mail (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="cliente@email.com"
                      {...field}
                      value={field.value || ''}
                      className="bg-background h-12 rounded-xl"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Seção Estruturada de Endereço com Busca por CEP */}
          <div className="pt-3 border-t border-border/60 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-foreground">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>Endereço do Comprador</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              {/* CEP */}
              <div className="sm:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>CEP</span>
                  {loadingCep && (
                    <span className="text-[11px] text-amber-500 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
                    </span>
                  )}
                </label>
                <div className="relative">
                  <Input
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    className="bg-background h-11 rounded-xl font-mono text-xs sm:text-sm pr-9"
                  />
                  <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Logradouro / Rua */}
              <div className="sm:col-span-8 space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Rua / Avenida</label>
                <Input
                  placeholder="Rua das Flores"
                  value={logradouro}
                  onChange={(e) => {
                    setLogradouro(e.target.value);
                    updateCombinedAddress(
                      cep,
                      e.target.value,
                      numero,
                      complemento,
                      bairro,
                      cidade,
                      estado,
                    );
                  }}
                  className="bg-background h-11 rounded-xl text-xs sm:text-sm"
                />
              </div>

              {/* Número */}
              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Número</label>
                <Input
                  placeholder="Ex: 123"
                  value={numero}
                  onChange={(e) => {
                    setNumero(e.target.value);
                    updateCombinedAddress(
                      cep,
                      logradouro,
                      e.target.value,
                      complemento,
                      bairro,
                      cidade,
                      estado,
                    );
                  }}
                  className="bg-background h-11 rounded-xl text-xs sm:text-sm"
                />
              </div>

              {/* Complemento */}
              <div className="sm:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Complemento</label>
                <Input
                  placeholder="Apto 101, Bloco B"
                  value={complemento}
                  onChange={(e) => {
                    setComplemento(e.target.value);
                    updateCombinedAddress(
                      cep,
                      logradouro,
                      numero,
                      e.target.value,
                      bairro,
                      cidade,
                      estado,
                    );
                  }}
                  className="bg-background h-11 rounded-xl text-xs sm:text-sm"
                />
              </div>

              {/* Bairro */}
              <div className="sm:col-span-5 space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Bairro</label>
                <Input
                  placeholder="Centro"
                  value={bairro}
                  onChange={(e) => {
                    setBairro(e.target.value);
                    updateCombinedAddress(
                      cep,
                      logradouro,
                      numero,
                      complemento,
                      e.target.value,
                      cidade,
                      estado,
                    );
                  }}
                  className="bg-background h-11 rounded-xl text-xs sm:text-sm"
                />
              </div>

              {/* Cidade */}
              <div className="sm:col-span-8 space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Cidade</label>
                <Input
                  placeholder="Recife"
                  value={cidade}
                  onChange={(e) => {
                    setCidade(e.target.value);
                    updateCombinedAddress(
                      cep,
                      logradouro,
                      numero,
                      complemento,
                      bairro,
                      e.target.value,
                      estado,
                    );
                  }}
                  className="bg-background h-11 rounded-xl text-xs sm:text-sm"
                />
              </div>

              {/* Estado */}
              <div className="sm:col-span-4 space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Estado (UF)</label>
                <Input
                  placeholder="PE"
                  maxLength={2}
                  value={estado}
                  onChange={(e) => {
                    setEstado(e.target.value.toUpperCase());
                    updateCombinedAddress(
                      cep,
                      logradouro,
                      numero,
                      complemento,
                      bairro,
                      cidade,
                      e.target.value.toUpperCase(),
                    );
                  }}
                  className="bg-background h-11 rounded-xl text-xs sm:text-sm uppercase font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 4. OBSERVAÇÕES & RECIBO */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-2 border-b border-border">
            <FileText className="w-5 h-5 text-[#c9a44c]" />
            <h2 className="text-lg font-bold text-foreground">4. Documentação & Recibo</h2>
          </div>

          <div className="space-y-4">
            <FormField
              control={form.control as any}
              name="receipt_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <span>Número do Recibo (Automático e Bloqueado)</span>
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                  </FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        readOnly
                        value={field.value || initialReceiptNumber}
                        className="bg-muted/70 h-12 rounded-xl font-mono font-bold text-amber-500 border-dashed cursor-not-allowed pl-10"
                      />
                      <Lock className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </FormControl>
                  <FormDescription className="text-xs">
                    Código sequencial exclusivo e imutável gerado para este documento.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="receipt_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações Impressas no Recibo PDF</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Veículo entregue revisado, com chave reserva e manual. Garantia de 90 dias para motor e câmbio..."
                      className="bg-background rounded-xl min-h-[90px] resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Este texto aparecerá no corpo do documento PDF assinado.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control as any}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Anotações Internas (Não visíveis no recibo)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Anotações confidenciais da loja sobre a negociação..."
                      className="bg-background rounded-xl min-h-[70px] resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Floating action bar */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-md border-t border-zinc-800/80 py-3 px-4 md:px-8 flex items-center justify-end gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
            className="h-10 px-4 rounded-xl text-xs sm:text-sm font-medium border-border/80 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            Cancelar
          </Button>

          <Button
            type="submit"
            disabled={loading}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold h-10 px-5 rounded-xl active:scale-95 transition-all text-xs sm:text-sm cursor-pointer shadow-xs"
          >
            {loading ? 'Salvando...' : 'Salvar Venda'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
