'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PurchaseAgreementPrepareInput } from '@/types/purchase-agreement';
import {
  FileText,
  User,
  Bike,
  CircleDollarSign,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Download,
  Loader2,
  Truck,
  Edit3,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Tag,
  Key,
} from 'lucide-react';
import { toast } from 'sonner';

interface PurchaseAgreementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<PurchaseAgreementPrepareInput>;
  onSuccess?: (result: { agreement_id: string; agreement_number: string; pdf_url: string }) => void;
}

export function PurchaseAgreementModal({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: PurchaseAgreementModalProps) {
  const [formData, setFormData] = useState<Partial<PurchaseAgreementPrepareInput>>(() => ({
    brand: '',
    model: '',
    year_manufacture: new Date().getFullYear(),
    year_model: new Date().getFullYear(),
    license_plate: '',
    mileage: 0,
    purchase_amount: 0,
    paid_amount: 0,
    payment_status: 'PAID_FULL',
    payment_method: 'PIX',
    payment_date: new Date().toISOString().split('T')[0],
    is_full_discharge_confirmed: true,
    delivery_datetime: new Date().toISOString(),
    delivery_km: 0,
    keys_count: 2,
    has_manual: true,
    has_spare_key: true,
    documents_delivered: ['CRLV-e', 'ATPV-e Assinada'],
    accessories_delivered: [],
    transfer_deadline_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    ...initialData,
  }));

  const [showAllFields, setShowAllFields] = useState(false);
  const [confirmedAccurate, setConfirmedAccurate] = useState(true);
  const [confirmedPayment, setConfirmedPayment] = useState(true);
  const [confirmedDelivery, setConfirmedDelivery] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    agreement_id: string;
    agreement_number: string;
    pdf_url: string;
  } | null>(null);

  useEffect(() => {
    if (open && initialData) {
      setFormData((prev) => ({
        ...prev,
        ...initialData,
        purchase_amount: Number(initialData.purchase_amount || prev.purchase_amount || 0),
        paid_amount: Number(initialData.paid_amount || initialData.purchase_amount || prev.purchase_amount || 0),
        delivery_km: Number(initialData.delivery_km ?? initialData.mileage ?? prev.mileage ?? 0),
      }));
      setGeneratedResult(null);
      setConfirmedAccurate(true);
      setConfirmedPayment(true);
      setConfirmedDelivery(true);
      setShowAllFields(false);
    }
  }, [open, initialData]);

  const handleChange = (field: keyof PurchaseAgreementPrepareInput, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCpfChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 14);
    if (digits.length <= 11) {
      const masked = digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
      handleChange('seller_document', masked);
    } else {
      const masked = digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
      handleChange('seller_document', masked);
    }
  };

  const isCpfValid = Boolean(formData.seller_document && formData.seller_document.replace(/\D/g, '').length >= 11);
  const hasValidAddress = Boolean(
    formData.seller_address &&
    formData.seller_address.trim().length > 3 &&
    formData.seller_address !== 'Endereço a confirmar',
  );

  const isFormValid =
    formData.seller_name?.trim() &&
    isCpfValid &&
    formData.seller_phone?.trim() &&
    hasValidAddress &&
    formData.brand?.trim() &&
    formData.model?.trim() &&
    formData.license_plate?.trim() &&
    Number(formData.purchase_amount) > 0 &&
    confirmedAccurate &&
    confirmedPayment &&
    confirmedDelivery;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      toast.error('Preencha os campos obrigatórios (CPF/CNPJ e Endereço) para emitir o contrato.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/admin/purchase-agreements/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          purchase_amount: Number(formData.purchase_amount),
          paid_amount: Number(formData.paid_amount || formData.purchase_amount),
          year_manufacture: Number(formData.year_manufacture || new Date().getFullYear()),
          year_model: Number(formData.year_model || formData.year_manufacture || new Date().getFullYear()),
          mileage: Number(formData.mileage || 0),
          delivery_km: Number(formData.delivery_km ?? formData.mileage ?? 0),
          keys_count: Number(formData.keys_count || 1),
          confirmed_data_accurate: true,
          confirmed_payment_realized: true,
          confirmed_vehicle_received: true,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Falha ao gerar contrato de compra.');
      }

      setGeneratedResult(data);
      toast.success('Contrato de compra gerado com sucesso!');
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao processar contrato.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl lg:max-w-5xl max-h-[92vh] overflow-hidden flex flex-col p-0 bg-[#0c0c0e] border border-zinc-800 text-zinc-100 shadow-[0_25px_70px_rgba(0,0,0,0.95)] rounded-3xl">
        {/* Top Accent Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 shrink-0" />

        {/* Modal Header */}
        <DialogHeader className="px-6 py-4.5 border-b border-zinc-800/80 bg-zinc-950/80 shrink-0">
          <div className="flex items-center justify-between gap-4 pr-6">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-sm">
                <FileText className="size-5" />
              </div>
              <div className="min-w-0 space-y-0.5">
                <DialogTitle className="text-xl lg:text-2xl font-black text-white truncate">
                  Emitir Contrato de Compra de Motocicleta
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 flex items-center gap-2">
                  <span>Aquisição para estoque próprio da AF Motos</span>
                  <span>•</span>
                  <span>Cláusulas de posse, quitação e responsabilidade pré-entrega</span>
                </DialogDescription>
              </div>
            </div>

            <Badge
              variant="outline"
              className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-xl bg-amber-500/15 text-amber-400 border-amber-500/30 shrink-0"
            >
              Estoque Próprio
            </Badge>
          </div>
        </DialogHeader>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 scrollbar-thin">
          {generatedResult ? (
            <div className="space-y-6 py-10 text-center max-w-lg mx-auto">
              <div className="mx-auto flex size-20 items-center justify-center rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                <CheckCircle2 className="size-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-white">Contrato Emitido com Sucesso!</h3>
                <p className="text-sm text-zinc-400">
                  O documento foi gerado e assinado digitalmente sob o identificador:
                </p>
                <div className="inline-block px-4 py-1.5 rounded-xl bg-zinc-900 border border-amber-500/40 text-amber-400 font-mono font-bold text-base shadow-sm">
                  {generatedResult.agreement_number}
                </div>
              </div>

              <div className="flex flex-wrap justify-center gap-4 pt-6">
                <a
                  href={generatedResult.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-6 py-3 text-sm font-black text-zinc-950 hover:bg-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all cursor-pointer gap-2"
                >
                  <Download className="size-4" />
                  Visualizar / Baixar PDF Oficial
                </a>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl border-zinc-800 bg-zinc-900 px-5 py-3 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                  onClick={() => onOpenChange(false)}
                >
                  Fechar
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 2-COLUMN DESKTOP GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT COLUMN: RESUMO IMPORTADO (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  
                  {/* Card 1: Veículo & Placa */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4.5 space-y-3.5 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                        <Bike className="size-4" />
                        Motocicleta Adquirida
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        ✓ Importado
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="text-lg font-black text-white leading-tight">
                          {formData.brand} {formData.model}
                        </h4>
                        {formData.version && (
                          <p className="text-xs text-zinc-400">{formData.version}</p>
                        )}
                      </div>

                      {/* Mini Mercosul Badge & Info Row */}
                      <div className="flex items-center gap-3 pt-1">
                        <div className="border border-slate-700 bg-slate-900 px-3 py-1.5 rounded-lg text-center font-mono font-black text-sm text-zinc-100 uppercase tracking-wider shadow-inner">
                          <div className="text-[7px] text-blue-400 tracking-widest leading-none pb-0.5">BRASIL</div>
                          {formData.license_plate || 'SEM PLACA'}
                        </div>

                        <div className="text-xs text-zinc-300 space-y-0.5">
                          <div>Ano: <strong className="text-white">{formData.year_manufacture}/{formData.year_model}</strong></div>
                          <div>Hodômetro: <strong className="text-white">{formData.mileage} km</strong></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Vendedor */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4.5 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                        <User className="size-4" />
                        Vendedor (Proprietário)
                      </div>
                      <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        ✓ Importado
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[11px] text-zinc-500 block">Nome Completo</span>
                        <span className="font-bold text-white text-sm block truncate">{formData.seller_name}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
                          <span className="text-[10px] text-zinc-500 block">WhatsApp</span>
                          <span className="font-mono font-bold text-zinc-200">{formData.seller_phone}</span>
                        </div>
                        <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/80">
                          <span className="text-[10px] text-zinc-500 block">Cidade / UF</span>
                          <span className="font-semibold text-zinc-200 truncate block">Carpina / PE</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Valor da Aquisição */}
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/[0.06] p-4.5 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-400/80">
                        Valor Total de Aquisição
                      </span>
                      <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px]">
                        {formData.payment_method} • À Vista
                      </Badge>
                    </div>
                    <div className="text-2xl font-black text-amber-400 font-mono">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(formData.purchase_amount || 0))}
                    </div>
                  </div>

                  {/* Botão para abrir edição de campos importados */}
                  <button
                    type="button"
                    onClick={() => setShowAllFields(!showAllFields)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-zinc-800/80 bg-zinc-900/40 text-xs font-semibold text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 transition-all cursor-pointer"
                  >
                    <Edit3 className="size-3.5" />
                    <span>{showAllFields ? 'Ocultar campos avançados' : 'Editar dados da moto / vistoria'}</span>
                    {showAllFields ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                  </button>

                </div>

                {/* RIGHT COLUMN: QUALIFICAÇÃO & EMISSÃO (7 cols) */}
                <div className="lg:col-span-7 space-y-4">
                  
                  {/* Bloco 1: Campos Jurídicos Obrigatórios */}
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 pb-2 border-b border-zinc-800/80">
                      <AlertCircle className="size-4" />
                      Qualificação Jurídica do Vendedor
                    </div>

                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="seller_document" className="text-xs font-semibold text-zinc-200">
                          CPF ou CNPJ do Vendedor *
                        </Label>
                        <Input
                          id="seller_document"
                          value={formData.seller_document || ''}
                          onChange={(e) => handleCpfChange(e.target.value)}
                          placeholder="000.000.000-00"
                          required
                          className="h-10 bg-zinc-950 border-zinc-800 text-sm font-mono font-bold text-white focus:border-amber-500"
                        />
                        {!isCpfValid && (
                          <p className="text-[11px] text-amber-400/90 font-medium">Informe o CPF/CNPJ para qualificação no contrato.</p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="seller_rg" className="text-xs font-semibold text-zinc-200">
                          RG / Órgão Emissor
                        </Label>
                        <Input
                          id="seller_rg"
                          value={formData.seller_rg || ''}
                          onChange={(e) => handleChange('seller_rg', e.target.value)}
                          placeholder="Ex.: 0.000.000 SDS/PE"
                          className="h-10 bg-zinc-950 border-zinc-800 text-sm text-white"
                        />
                      </div>

                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="seller_address" className="text-xs font-semibold text-zinc-200">
                          Endereço Completo do Vendedor *
                        </Label>
                        <Input
                          id="seller_address"
                          value={formData.seller_address && formData.seller_address !== 'Endereço a confirmar' ? formData.seller_address : ''}
                          onChange={(e) => handleChange('seller_address', e.target.value)}
                          placeholder="Rua, Número, Bairro, Cidade/UF, CEP"
                          required
                          className="h-10 bg-zinc-950 border-zinc-800 text-sm text-white"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="purchase_amount" className="text-xs font-semibold text-zinc-200">
                          Valor de Compra Acordado (R$) *
                        </Label>
                        <Input
                          id="purchase_amount"
                          type="number"
                          step="0.01"
                          min="1"
                          value={formData.purchase_amount || ''}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            handleChange('purchase_amount', val);
                            handleChange('paid_amount', val);
                          }}
                          required
                          className="h-10 bg-zinc-950 border-zinc-800 text-sm font-black text-amber-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="payment_method" className="text-xs font-semibold text-zinc-200">
                          Forma de Pagamento *
                        </Label>
                        <Select
                          value={formData.payment_method || 'PIX'}
                          onValueChange={(val) => handleChange('payment_method', val)}
                        >
                          <SelectTrigger id="payment_method" className="h-10 bg-zinc-950 border-zinc-800 text-sm text-white">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                            <SelectItem value="PIX">PIX (À Vista)</SelectItem>
                            <SelectItem value="TED">Transferência TED</SelectItem>
                            <SelectItem value="DINHEIRO">Dinheiro (Espécie)</SelectItem>
                            <SelectItem value="CHEQUE">Cheque Compensado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Bloco 2: Seção Expansível Avançada */}
                  {showAllFields && (
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4.5 space-y-3.5 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400 pb-2 border-b border-zinc-800/80">
                        <Truck className="size-4" />
                        Vistoria de Entrada & Documentação
                      </div>

                      <div className="grid gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label htmlFor="delivery_km" className="text-xs text-zinc-300">KM na Entrega</Label>
                          <Input
                            id="delivery_km"
                            type="number"
                            value={formData.delivery_km ?? formData.mileage ?? 0}
                            onChange={(e) => handleChange('delivery_km', Number(e.target.value))}
                            className="h-9 bg-zinc-950 border-zinc-800 text-sm font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="renavam" className="text-xs text-zinc-300">RENAVAM</Label>
                          <Input
                            id="renavam"
                            value={formData.renavam || ''}
                            onChange={(e) => handleChange('renavam', e.target.value)}
                            placeholder="00000000000"
                            className="h-9 bg-zinc-950 border-zinc-800 text-sm font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="chassi" className="text-xs text-zinc-300">Chassi (VIN)</Label>
                          <Input
                            id="chassi"
                            value={formData.chassi || ''}
                            onChange={(e) => handleChange('chassi', e.target.value.toUpperCase())}
                            placeholder="9C2..."
                            className="h-9 bg-zinc-950 border-zinc-800 text-sm font-mono uppercase"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-zinc-300 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={Boolean(formData.has_manual)}
                            onCheckedChange={(c) => handleChange('has_manual', Boolean(c))}
                          />
                          Manual Entregue
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={Boolean(formData.has_spare_key)}
                            onCheckedChange={(c) => handleChange('has_spare_key', Boolean(c))}
                          />
                          Chave Reserva Entregue
                        </label>
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="apparent_condition_notes" className="text-xs text-zinc-300">Observações de Vistoria</Label>
                        <Textarea
                          id="apparent_condition_notes"
                          value={formData.apparent_condition_notes || ''}
                          onChange={(e) => handleChange('apparent_condition_notes', e.target.value)}
                          placeholder="Observações do estado físico da motocicleta..."
                          rows={2}
                          className="bg-zinc-950 border-zinc-800 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  {/* Bloco 3: Confirmação & Assinatura */}
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                      <ShieldCheck className="size-4" />
                      Confirmações de Segurança e Tradição
                    </div>

                    <div className="text-xs text-zinc-300">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <Checkbox
                          checked={confirmedAccurate && confirmedPayment && confirmedDelivery}
                          onCheckedChange={(c) => {
                            const val = Boolean(c);
                            setConfirmedAccurate(val);
                            setConfirmedPayment(val);
                            setConfirmedDelivery(val);
                          }}
                          className="mt-0.5"
                        />
                        <span className="leading-relaxed">
                          Confirmo a exatidão dos dados, o pagamento integral acordado e a tradição física do bem para posse e estoque próprio da AF Motos.
                        </span>
                      </label>
                    </div>
                  </div>

                </div>
              </div>

              {/* Modal Footer Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-zinc-800/80">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 px-5"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm h-11 px-6 flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.25)] transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Gerando Contrato...
                    </>
                  ) : (
                    <>
                      <FileText className="size-4" />
                      Emitir Contrato de Compra
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
