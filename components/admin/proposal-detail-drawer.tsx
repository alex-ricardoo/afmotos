'use client';

import React, { useState, useSyncExternalStore, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ProposalViewModel,
  getStockRegistrationUrlFromProposal,
} from '@/lib/admin/proposal-view-model';
import {
  proposalTypeLabels,
  proposalStatusLabels,
  getProposalStatusLabel,
} from '@/lib/admin/proposal-labels';



import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  generateProposalWhatsAppMessage,
  generateWhatsAppLink,
  formatPhoneForDisplay,
} from '@/lib/utils/whatsapp';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { cn } from '@/lib/utils';
import { ImageFullscreen } from '@/components/gallery/image-fullscreen';
import {
  MapPin,
  Calendar,
  Bike,
  Tag,
  KeyRound,
  MessageSquare,
  Copy,
  Check,
  TrendingDown,
  TrendingUp,
  CheckCircle2,
  Sparkles,
  Eye,
  User,
  Phone,
  PlusCircle,
  Calculator,
  Percent,
  CircleDollarSign,
  FileSignature,
  ExternalLink,
  Download,
} from 'lucide-react';

import { toast } from 'sonner';

export function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === 'undefined') return () => {};
      const media = window.matchMedia(query);
      media.addEventListener('change', callback);
      return () => media.removeEventListener('change', callback);
    },
    [query],
  );

  const getSnapshot = () => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  };

  const getServerSnapshot = () => false;

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

import { CONSTANTS } from '@/lib/utils/constants';

interface ProposalDetailProps {
  proposal: ProposalViewModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeBadgeClass?: string;
  onStatusChange?: (proposal: ProposalViewModel, newStatus: string) => Promise<void> | void;
  siteName?: string;
}

function AgreementCommissionForm({ proposal }: { proposal: ProposalViewModel }) {
  const defaultValue = proposal.motorcycle?.desiredPrice ?? proposal.motorcycle?.fipePrice ?? 0;
  const [commissionPercentage, setCommissionPercentage] = useState(5);
  const [expectedSaleValue, setExpectedSaleValue] = useState(defaultValue);
  const [cpf, setCpf] = useState('');
  const [rg, setRg] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [agreementUrl, setAgreementUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const commissionValue = expectedSaleValue * (commissionPercentage / 100);
  const formattedCpf = cpf.replace(/\D/g, '');
  const isValid = Number.isFinite(expectedSaleValue) && expectedSaleValue > 0 && commissionPercentage >= 0 && commissionPercentage <= 100 && formattedCpf.length === 11 && rg.trim().length >= 2;

  const handleCpfChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    setCpf(
      digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2'),
    );
  };

  const handleRgChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    const masked = digits
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d{1,2})$/, '$1.$2.$3-$4');
    setRg(masked);
  };

  const handleGenerate = async () => {
    if (!isValid) {
      setError('Informe CPF, RG e valores válidos para gerar o contrato.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const targetSellRequestId =
        (proposal.metadata as Record<string, unknown> | null)?.sell_request_id ||
        proposal.sourceId ||
        proposal.id;

      const response = await fetch('/api/agreements/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sell_request_id: targetSellRequestId,
          owner_cpf: formattedCpf,
          owner_rg: rg.trim(),
          commission_percentage: Number(commissionPercentage),
          expected_sale_value: Number(expectedSaleValue),
        }),
      });

      const payload = await response.json();
      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error || 'Não foi possível gerar o acordo.');
      }

      setAgreementUrl(payload.pdf_url || null);
      setSuccessMessage('Acordo gerado com sucesso.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Não foi possível gerar o acordo.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="overflow-hidden border-emerald-500/20 bg-zinc-950/60 shadow-none">
      <CardHeader className="border-b border-emerald-500/10 bg-emerald-500/[0.03] pb-3">
        <CardTitle className="flex items-center gap-2 text-sm text-emerald-300">
          <Calculator className="size-4" />
          Calculadora de comissão
        </CardTitle>
        <CardDescription className="text-xs text-zinc-400">
          Defina os valores do anúncio antes de gerar o contrato.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="owner-cpf" className="flex items-center gap-1.5 text-xs">
              <User className="size-3.5 text-emerald-400" />
              CPF do proprietário da moto
            </Label>
            <Input
              id="owner-cpf"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(event) => handleCpfChange(event.target.value)}
              className="h-9"
              aria-describedby="owner-cpf-help"
            />
            <p id="owner-cpf-help" className="text-[11px] text-zinc-500">
              Necessário para identificar o responsável no contrato.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="owner-rg" className="flex items-center gap-1.5 text-xs">
              <FileSignature className="size-3.5 text-emerald-400" />
              RG do proprietário
            </Label>
            <Input id="owner-rg" placeholder="00.000.000-0" inputMode="numeric" maxLength={13} value={rg} onChange={(event) => handleRgChange(event.target.value)} className="h-9" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commission-percentage" className="flex items-center gap-1.5 text-xs">
              <Percent className="size-3.5 text-amber-400" />
              Comissão combinada
            </Label>
            <div className="relative">
              <Input
                id="commission-percentage"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={commissionPercentage}
                onChange={(event) => {
                  const normalized = event.target.value.replace(/^0+(?=\d)/, '');
                  setCommissionPercentage(Number(normalized || 0));
                }}
                className="pr-9"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-zinc-500">%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expected-sale-value" className="flex items-center gap-1.5 text-xs">
              <CircleDollarSign className="size-3.5 text-emerald-400" />
              Valor esperado de venda
            </Label>
            <div className="relative">
              <Input
                id="expected-sale-value"
                type="number"
                min={0}
                step={0.01}
                value={expectedSaleValue}
                onChange={(event) => setExpectedSaleValue(Number(event.target.value || 0))}
                className="pr-10"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-bold text-zinc-500">R$</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            <Calculator className="size-3" />
            Resumo automático
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-lg bg-zinc-950/60 p-3">
              <div className="text-[10px] uppercase tracking-wider text-zinc-500">Percentual</div>
              <div className="mt-1 text-lg font-black text-white">{commissionPercentage.toFixed(1)}%</div>
            </div>
            <div className="rounded-lg bg-amber-500/10 p-3">
              <div className="text-[10px] uppercase tracking-wider text-amber-400/70">Comissão em reais</div>
              <div className="mt-1 text-lg font-black text-amber-300">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commissionValue)}
              </div>
            </div>
            <div className="rounded-lg bg-emerald-500/10 p-3">
              <div className="text-[10px] uppercase tracking-wider text-emerald-400/70">Valor do anúncio</div>
              <div className="mt-1 text-lg font-black text-emerald-300">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(expectedSaleValue)}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={!isValid || isGenerating}
            className="h-9 flex-1 gap-2 bg-amber-500 font-bold text-zinc-950 hover:bg-amber-400"
          >
            <FileSignature className="size-4" />
            {isGenerating ? 'Gerando contrato...' : 'Gerar contrato'}
          </Button>
          {agreementUrl && (
            <>
              <a href={agreementUrl} target="_blank" rel="noreferrer" aria-label="Visualizar contrato" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                <ExternalLink className="size-3.5" />
                Visualizar
              </a>
              <a href={agreementUrl} download aria-label="Baixar contrato" className={buttonVariants({ variant: 'default', size: 'sm' })}>
                <Download className="size-3.5" />
                Baixar PDF
              </a>
            </>
          )}
        </div>

        {error && (
          <Alert className="border-red-500/30 bg-red-500/5 text-red-200">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="border-emerald-500/30 bg-emerald-500/5 text-emerald-200">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export function ProposalDetail({
  proposal,
  open,
  onOpenChange,
  onStatusChange,
  siteName,
}: ProposalDetailProps) {
  const storeName = siteName || CONSTANTS.STORE_NAME;
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('default');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [adminOfferPercent, setAdminOfferPercent] = useState<number>(85);
  const [adminCustomOffer, setAdminCustomOffer] = useState<number | null>(null);

  if (!proposal) return null;

  const typeLabel = proposalTypeLabels[proposal.type] || proposal.typeLabel;

  // Status Styling Configuration
  const statusConfig: Record<
    string,
    { label: string; bg: string; text: string; border: string; dot: string; line: string }
  > = {
    NEW: {
      label: getProposalStatusLabel('NEW', proposal.type),
      bg: 'bg-amber-500/15',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
      line: 'bg-amber-500',
    },
    CONTACTED: {
      label: getProposalStatusLabel('CONTACTED', proposal.type),
      bg: 'bg-blue-500/15',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      dot: 'bg-blue-400',
      line: 'bg-blue-500',
    },
    QUALIFIED: {
      label: getProposalStatusLabel('QUALIFIED', proposal.type),
      bg: 'bg-purple-500/15',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      dot: 'bg-purple-400',
      line: 'bg-purple-500',
    },
    CONVERTED: {
      label: getProposalStatusLabel('CONVERTED', proposal.type),
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400',
      line: 'bg-emerald-500',
    },
    CLOSED: {
      label: getProposalStatusLabel('CLOSED', proposal.type),
      bg: 'bg-zinc-800',
      text: 'text-zinc-400',
      border: 'border-zinc-700',
      dot: 'bg-zinc-500',
      line: 'bg-zinc-600',
    },
    LOST: {
      label: getProposalStatusLabel('LOST', proposal.type),
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      dot: 'bg-rose-400',
      line: 'bg-rose-500',
    },
  };

  // Type styling
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'MOTORCYCLE_INTEREST':
        return {
          icon: Bike,
          label: 'Interesse em Moto',
          className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        };
      case 'SELL_MOTORCYCLE':
        return {
          icon: Tag,
          label: 'Venda de Moto',
          className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        };
      case 'CONSIGNMENT':
        return {
          icon: KeyRound,
          label: 'Anunciar',
          className: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        };
      case 'RENTAL':
        return {
          icon: Calendar,
          label: 'Aluguel de Moto',
          className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        };
      default:
        return {
          icon: MessageSquare,
          label: 'Contato Geral',
          className: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        };
    }
  };

  const typeInfo = getTypeBadge(proposal.type);
  const TypeIcon = typeInfo.icon;
  const isConsignmentProposal = proposal.type === 'CONSIGNMENT';

  const currentStatusInfo = statusConfig[proposal.status] || statusConfig.NEW;

  // Calculador de valores da FIPE e simulação do administrador
  const desiredPrice = proposal.motorcycle?.desiredPrice || null;
  const fipePrice = proposal.motorcycle?.fipePrice || null;
  let fipeDiffPercent: number | null = null;
  if (desiredPrice && fipePrice && fipePrice > 0) {
    fipeDiffPercent = Number((((desiredPrice - fipePrice) / fipePrice) * 100).toFixed(1));
  }

  const simulatedOfferFromFipe = fipePrice ? (fipePrice * adminOfferPercent) / 100 : null;
  const effectiveAdminOffer =
    adminCustomOffer !== null
      ? adminCustomOffer
      : simulatedOfferFromFipe || proposal.motorcycle?.estimatedOffer || null;

  // Presets de resposta rápida no WhatsApp
  const getWhatsAppMessageByPreset = () => {
    const name = proposal.name ? proposal.name.trim() : 'Cliente';
    const moto = proposal.motorcycle?.brand
      ? `${proposal.motorcycle.brand} ${proposal.motorcycle.model || ''}`.trim()
      : '';

    switch (selectedPreset) {
      case 'offer': {
        const fipeText = fipePrice
          ? ` O valor de referência na Tabela FIPE é de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fipePrice)}.`
          : '';
        const offerText = effectiveAdminOffer
          ? ` Temos uma proposta inicial de compra no valor de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(effectiveAdminOffer)} à vista no PIX.`
          : '';
        return `Olá ${name}! Aqui é da equipe da ${storeName}. Analisamos a proposta para a sua moto${moto ? ` (${moto})` : ''}.${fipeText}${offerText} Gostaria de agendar um horário para você vir à loja para finalizarmos a avaliação e fecharmos negócio?`;
      }
      case 'photos':
        return `Olá ${name}, tudo bem? Aqui é da equipe da ${storeName}! Recebemos sua proposta sobre ${moto ? `a moto ${moto}` : 'sua moto'}. Você teria mais fotos e o documento dela para adiantarmos a avaliação?`;
      case 'visit':
        return `Olá ${name}! Tudo bem? Gostamos muito da proposta${moto ? ` para a moto ${moto}` : ''}. Gostaria de agendar um horário para você vir à nossa loja para finalizarmos a negociação?`;
      case 'counter':
        return `Olá ${name}! Tudo bem? Analisamos sua proposta${moto ? ` para ${moto}` : ''} com nossa equipe comercial e gostaríamos de apresentar uma proposta especial para você fechar negócio hoje.`;
      case 'default':
      default:
        return generateProposalWhatsAppMessage(proposal, storeName);
    }
  };

  const activeWhatsAppLink = generateWhatsAppLink(proposal.phone, getWhatsAppMessageByPreset());

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(proposal.phone.replace(/\D/g, ''));
    setCopiedPhone(true);
    toast.success('Telefone copiado!');
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleCopyMessage = () => {
    if (proposal.message) {
      navigator.clipboard.writeText(proposal.message);
      setCopiedMessage(true);
      toast.success('Mensagem copiada!');
      setTimeout(() => setCopiedMessage(false), 2000);
    }
  };

  const handleQuickStatusUpdate = async (newStatus: string) => {
    if (newStatus === proposal.status || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      if (onStatusChange) {
        await onStatusChange(proposal, newStatus);
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Main Rich Content Body
  const MainContent = (
    <div className="space-y-6">
      {/* 2-Column Responsive Grid on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (Customer & Motorcycle Data) - 7 cols on lg */}
        <div className="lg:col-span-7 space-y-5">
          {/* Card 1: Cliente & Contato */}
          <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 p-4.5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#c9a44c]" />
                Dados do Cliente
              </h4>
              <span className="text-[11px] text-zinc-500 font-mono">
                {format(new Date(proposal.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60 space-y-1">
                <span className="text-zinc-500 text-[11px] block">Nome do Cliente</span>
                <span className="font-bold text-white text-sm block truncate">{proposal.name}</span>
              </div>

              <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60 space-y-1">
                <span className="text-zinc-500 text-[11px] block">Telefone / WhatsApp</span>
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold font-mono text-zinc-100 text-sm">
                    {formatPhoneForDisplay(proposal.phone) || proposal.phone}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                    title="Copiar telefone"
                  >
                    {copiedPhone ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {proposal.email && (
                <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60 space-y-1">
                  <span className="text-zinc-500 text-[11px] block">E-mail</span>
                  <span className="font-semibold text-zinc-300 block truncate">
                    {proposal.email}
                  </span>
                </div>
              )}

              {(proposal.city || proposal.state) && (
                <div className="bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60 space-y-1">
                  <span className="text-zinc-500 text-[11px] block">Localização</span>
                  <span className="font-semibold text-zinc-300 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                    <span className="truncate">
                      {proposal.city}
                      {proposal.state ? ` - ${proposal.state}` : ''}
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Link para CRM de Clientes */}
            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">Vínculo na Carteira de Clientes:</span>
              <Link
                href={`/admin/clientes?q=${encodeURIComponent(proposal.phone || proposal.name)}`}
                target="_blank"
                className="inline-flex items-center justify-center h-7 px-2.5 rounded-lg border border-zinc-800 bg-zinc-900 text-xs text-[#e3c56c] hover:bg-zinc-800 gap-1.5 transition-colors font-medium"
              >
                <User className="w-3 h-3" />
                Ver Cliente no CRM
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </div>

          {/* Card: Dados de Aluguel (Se for proposta de aluguel) */}
          {(proposal.rental || proposal.type === 'RENTAL') && (
            <div className="bg-blue-950/30 rounded-2xl border border-blue-500/30 p-4.5 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-blue-500/30">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Detalhes do Aluguel
                </h4>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold px-2 py-0.5 border-blue-500/40 bg-blue-500/10 text-blue-300"
                >
                  Solicitação de Locação
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {proposal.rental?.desiredPlan && (
                  <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60 space-y-0.5">
                    <span className="text-zinc-500 text-[10px] block">Plano Desejado</span>
                    <span className="font-bold text-blue-400 font-heading text-sm block">
                      {proposal.rental.desiredPlan}
                    </span>
                  </div>
                )}

                {proposal.rental?.expectedStartDate && (
                  <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60 space-y-0.5">
                    <span className="text-zinc-500 text-[10px] block">Início Previsto</span>
                    <span className="font-bold text-zinc-200 font-mono text-sm block">
                      {proposal.rental.expectedStartDate.split('-').reverse().join('/')}
                    </span>
                  </div>
                )}

                {proposal.rental?.hasCnhA && (
                  <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60 space-y-0.5">
                    <span className="text-zinc-500 text-[10px] block">CNH Categoria A</span>
                    <span className="font-bold text-white block">{proposal.rental.hasCnhA}</span>
                  </div>
                )}

                {proposal.rental?.age != null && (
                  <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60 space-y-0.5">
                    <span className="text-zinc-500 text-[10px] block">Idade</span>
                    <span className="font-bold text-zinc-200 block">
                      {proposal.rental.age} anos
                    </span>
                  </div>
                )}

                {proposal.rental?.purposeOfUse && (
                  <div className="col-span-2 sm:col-span-2 bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/60 space-y-0.5">
                    <span className="text-zinc-500 text-[10px] block">Finalidade de Uso</span>
                    <span className="font-semibold text-zinc-200 block truncate">
                      {proposal.rental.purposeOfUse}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Aviso caso não haja moto selecionada para o aluguel */}
          {proposal.type === 'RENTAL' && !proposal.motorcycle?.brand && (
            <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/60 text-xs text-zinc-400 flex items-center gap-2 italic">
              <Bike className="w-4 h-4 text-zinc-500 shrink-0" />
              <span>Cliente ainda não selecionou uma moto específica.</span>
            </div>
          )}

          {/* Card 2: Dados da Moto & Análise Financeira */}
          {proposal.motorcycle && (proposal.motorcycle.brand || proposal.motorcycle.model) && (
            <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 p-4.5 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-zinc-800/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5 text-[#c9a44c]" />
                  Veículo Negociado
                </h4>
                <Badge
                  variant="outline"
                  className="text-[10px] font-bold px-2 py-0.5 border-zinc-700 bg-zinc-800 text-zinc-300"
                >
                  {proposal.motorcycle.brand}
                </Badge>
              </div>

              {/* Card Destaque: Moto Comprada -> Cadastrar no Estoque com 1 clique */}
              {proposal.status === 'CONVERTED' && (
                <div className="bg-gradient-to-br from-amber-500/20 via-zinc-900 to-zinc-950 p-4 rounded-2xl border border-amber-500/50 space-y-2.5 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500 text-zinc-950 flex items-center justify-center font-black">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                        Moto Pronta para o Estoque
                      </span>
                    </div>
                    <Badge className="bg-amber-500 text-zinc-950 font-black text-[10px]">
                      Ação Recomendada
                    </Badge>
                  </div>

                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Esta moto foi adquirida pela loja! Os dados cadastrais (marca, modelo, anos, cor, km e fotos) já estão prontos para serem integrados ao catálogo.
                  </p>

                  <Link
                    href={getStockRegistrationUrlFromProposal(proposal)}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-zinc-950 font-black rounded-xl h-10 shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 text-xs transition-all cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-zinc-950" />
                    <span>Cadastrar Moto no Estoque</span>
                  </Link>
                </div>
              )}


              {/* Motorcycle Title */}
              <div className="bg-zinc-950/60 p-3.5 rounded-xl border border-zinc-800/60 flex items-center justify-between">
                <div>
                  <span className="text-zinc-400 text-xs font-medium block">Modelo da Moto</span>
                  <span className="text-base font-extrabold text-white block mt-0.5">
                    {proposal.motorcycle.brand} {proposal.motorcycle.model}
                  </span>
                </div>
                {proposal.motorcycle.year && (
                  <div className="text-right">
                    <span className="text-zinc-500 text-[11px] block">Ano</span>
                    <span className="font-mono font-bold text-zinc-200 text-sm">
                      {proposal.motorcycle.year}
                    </span>
                  </div>
                )}
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                {proposal.motorcycle.mileage != null && (
                  <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/50">
                    <span className="text-zinc-500 text-[10px] block">KM Rodados</span>
                    <span className="font-mono font-bold text-zinc-200">
                      {new Intl.NumberFormat('pt-BR').format(proposal.motorcycle.mileage)} km
                    </span>
                  </div>
                )}

                {proposal.motorcycle.color && (
                  <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/50">
                    <span className="text-zinc-500 text-[10px] block">Cor</span>
                    <span className="font-semibold text-zinc-200">{proposal.motorcycle.color}</span>
                  </div>
                )}

                {proposal.motorcycle.version && (
                  <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-zinc-800/50">
                    <span className="text-zinc-500 text-[10px] block">Versão</span>
                    <span className="font-semibold text-zinc-200 truncate block">
                      {proposal.motorcycle.version}
                    </span>
                  </div>
                )}
              </div>

              {/* Financial Box: Desired vs FIPE vs Simulation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {desiredPrice != null && (
                  <div className="bg-[#c9a44c]/10 border border-[#c9a44c]/30 rounded-2xl p-3.5 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#e3c56c] block">
                      Expectativa do Cliente
                    </span>
                    <span className="text-xl font-black text-[#e3c56c] font-mono block">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(desiredPrice)}
                    </span>
                  </div>
                )}

                {fipePrice != null && (
                  <div className="bg-blue-500/10 border border-blue-500/25 rounded-2xl p-3.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 block">
                        Tabela FIPE
                      </span>
                      {fipeDiffPercent !== null && (
                        <span
                          className={cn(
                            'text-[10px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5',
                            fipeDiffPercent < 0
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : fipeDiffPercent > 0
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
                          )}
                        >
                          {fipeDiffPercent < 0 ? (
                            <>
                              <TrendingDown className="w-3 h-3" />
                              {Math.abs(fipeDiffPercent)}% abaixo
                            </>
                          ) : fipeDiffPercent > 0 ? (
                            <>
                              <TrendingUp className="w-3 h-3" />+{fipeDiffPercent}% acima
                            </>
                          ) : (
                            'Na FIPE'
                          )}
                        </span>
                      )}
                    </div>
                    <span className="text-xl font-black text-blue-300 font-mono block">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(fipePrice)}
                    </span>
                  </div>
                )}

                {/* Simulador de Oferta da Loja (FIPE) para o Lojista */}
                {proposal.type === 'SELL_MOTORCYCLE' &&
                  proposal.status !== 'CONVERTED' &&
                  fipePrice != null &&
                  fipePrice > 0 && (
                  <div className="sm:col-span-2 bg-gradient-to-br from-amber-500/15 via-zinc-900 to-zinc-950 p-4 rounded-2xl border border-amber-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Simulador de Proposta da {storeName}</span>
                      </span>
                      <span className="text-xs font-mono font-bold text-zinc-300">
                        FIPE:{' '}
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(fipePrice)}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] text-zinc-400 block font-semibold">
                        Selecione a porcentagem para ofertar ao cliente:
                      </span>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                        {[70, 75, 80, 85, 90, 95, 100].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => {
                              setAdminOfferPercent(pct);
                              setAdminCustomOffer(null);
                              setSelectedPreset('offer');
                            }}
                            className={cn(
                              'py-1.5 px-1 rounded-lg text-xs font-bold transition-all border text-center cursor-pointer',
                              adminOfferPercent === pct && adminCustomOffer === null
                                ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black shadow-sm scale-105'
                                : 'bg-zinc-950/80 text-zinc-300 border-zinc-800 hover:border-amber-500/50 hover:text-white',
                            )}
                          >
                            {pct}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-zinc-800/80">
                      <div>
                        <span className="text-[11px] text-zinc-400 block">
                          Valor Calculado da Oferta
                        </span>
                        <span className="text-2xl font-black text-amber-400 font-mono">
                          {effectiveAdminOffer != null
                            ? new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(effectiveAdminOffer)
                            : '—'}
                        </span>
                      </div>

                      <a
                        href={generateWhatsAppLink(proposal.phone, getWhatsAppMessageByPreset())}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setSelectedPreset('offer')}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.25)] transition-all cursor-pointer shrink-0"
                      >
                        <WhatsAppIcon className="w-4 h-4 fill-zinc-950" />
                        <span>Enviar Oferta ({adminOfferPercent}%) no WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {isConsignmentProposal && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4.5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-emerald-500/30">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5" />
                  Contrato & Comissão de Anúncio
                </h4>
                <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5">
                  {proposal.status === 'QUALIFIED' ? 'Anúncio aprovado' : 'Comissão de anúncio'}
                </Badge>
              </div>

              <AgreementCommissionForm proposal={proposal} />
            </div>
          )}

          {/* Card 3: Mensagem do Cliente */}
          {proposal.message && (
            <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 p-4.5 space-y-2 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-[#c9a44c]" />
                Observações / Mensagem do Cliente
              </h4>
              <p className="text-xs text-zinc-300 italic bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/60 leading-relaxed">
                &quot;{proposal.message}&quot;
              </p>
            </div>
          )}
        </div>

        {/* Right Column (Status Switcher, WhatsApp Presets & Photos) - 5 cols on lg */}
        <div className="lg:col-span-5 space-y-5">
          {/* Status Control Card */}
          <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 p-4.5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#c9a44c]" />
                Status do Lead
              </h4>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1',
                  currentStatusInfo.bg,
                  currentStatusInfo.text,
                  currentStatusInfo.border,
                )}
              >
                <span className={cn('w-1.5 h-1.5 rounded-full', currentStatusInfo.dot)} />
                {currentStatusInfo.label}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {Object.entries(proposalStatusLabels).map(([statusKey, statusName]) => {
                const isSelected = proposal.status === statusKey;
                const config = statusConfig[statusKey] || statusConfig.CLOSED;

                return (
                  <button
                    key={statusKey}
                    type="button"
                    disabled={isUpdatingStatus}
                    onClick={() => handleQuickStatusUpdate(statusKey)}
                    className={cn(
                      'p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 text-left cursor-pointer disabled:opacity-50',
                      isSelected
                        ? cn(
                            'bg-zinc-800/90 text-white shadow-xs',
                            config.border,
                            'ring-1 ring-white/20',
                          )
                        : 'bg-zinc-950/50 text-zinc-400 border-zinc-800/80 hover:bg-zinc-900 hover:text-white',
                    )}
                  >
                    <span
                      className={cn(
                        'w-2.5 h-2.5 rounded-full shrink-0',
                        config.dot,
                        isSelected && 'ring-2 ring-white/40',
                      )}
                    />
                    <span className="truncate">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* WhatsApp Direct Action & Message Templates */}
          <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 p-4.5 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
                {proposal.status === 'CONVERTED' ? 'Contato com o Vendedor' : 'Atendimento WhatsApp'}
              </h4>
              <span className="text-[10px] text-zinc-500">
                {proposal.status === 'CONVERTED' ? 'Canal direto' : 'Respostas rápidas'}
              </span>
            </div>

            {proposal.status === 'CONVERTED' ? (
              <div className="space-y-3">
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Moto comprada pela loja. O canal com o vendedor continua disponível para dúvidas ou comprovantes:</span>
                </div>

                <a
                  href={generateWhatsAppLink(
                    proposal.phone,
                    `Olá ${proposal.name}, tudo bem? Aqui é da ${storeName}! Entrando em contato sobre a compra da sua moto.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#20BD5A] active:scale-98 text-zinc-950 font-extrabold rounded-xl h-11 shadow-[0_0_20px_rgba(37,211,102,0.25)] flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
                >
                  <WhatsAppIcon className="w-5 h-5 fill-current" />
                  <span>Falar no WhatsApp com o Vendedor</span>
                </a>
              </div>
            ) : (
              <>
                {/* Template Selector */}
                <div className="space-y-1.5">
                  <span className="text-[11px] text-zinc-400 block font-medium">
                    Modelo da mensagem:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: 'offer', label: '💰 Oferta FIPE' },
                      { id: 'default', label: 'Padrão' },
                      { id: 'photos', label: 'Pedir fotos/doc' },
                      { id: 'visit', label: 'Agendar visita' },
                      { id: 'counter', label: 'Contraproposta' },
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setSelectedPreset(preset.id)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all text-center cursor-pointer',
                          selectedPreset === preset.id
                            ? 'bg-zinc-800 text-white border-[#c9a44c]/60'
                            : 'bg-zinc-950/60 text-zinc-400 border-zinc-800/60 hover:text-white',
                        )}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview of message */}
                <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/60 text-[11px] text-zinc-400 line-clamp-3 leading-relaxed">
                  &quot;{getWhatsAppMessageByPreset()}&quot;
                </div>

                {/* Big WhatsApp CTA */}
                <a
                  href={activeWhatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#25D366] hover:bg-[#20BD5A] active:scale-98 text-zinc-950 font-extrabold rounded-xl h-11 shadow-[0_0_20px_rgba(37,211,102,0.25)] flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
                >
                  <WhatsAppIcon className="w-5 h-5 fill-current" />
                  <span>Abrir WhatsApp com Cliente</span>
                </a>
              </>
            )}
          </div>

          {/* Photo Gallery */}
          {proposal.images && proposal.images.length > 0 && (
            <div className="bg-zinc-900/60 rounded-2xl border border-zinc-800/80 p-4.5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-[#c9a44c]" />
                  Fotos do Veículo ({proposal.images.length})
                </h4>
                <span className="text-[10px] text-zinc-500">Clique para ampliar</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {proposal.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedImageIndex(idx);
                      setIsFullscreenOpen(true);
                    }}
                    className="relative group aspect-square rounded-xl overflow-hidden border border-zinc-800/80 bg-zinc-950 cursor-zoom-in hover:border-[#c9a44c]/60 transition-all"
                  >
                    <img
                      src={img.url}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-hidden flex flex-col p-0 bg-[#0d0d10] border border-zinc-800 text-zinc-100 shadow-[0_25px_60px_rgba(0,0,0,0.9)] rounded-3xl">
            {/* Top Accent Line */}
            <div className={cn('h-1.5 w-full bg-gradient-to-r', currentStatusInfo.line)} />

            {/* Modal Header */}
            <DialogHeader className="px-6 py-4.5 border-b border-zinc-800/80 bg-zinc-950/80 shrink-0">
              <div className="flex items-center justify-between gap-4 pr-8">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#c9a44c] shrink-0 shadow-xs">
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <DialogTitle className="text-xl lg:text-2xl font-black text-white truncate">
                      {proposal.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-400 flex items-center gap-2">
                      <span>Proposta #{proposal.id.slice(0, 8)}</span>
                      <span>•</span>
                      <span>
                        Recebido em{' '}
                        {format(new Date(proposal.createdAt), "dd 'de' MMMM 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </DialogDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-xl flex items-center gap-1.5',
                      typeInfo.className,
                    )}
                  >
                    <TypeIcon className="w-3.5 h-3.5" />
                    <span>{typeLabel}</span>
                  </Badge>

                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1.5',
                      currentStatusInfo.bg,
                      currentStatusInfo.text,
                      currentStatusInfo.border,
                    )}
                  >
                    <span className={cn('w-2 h-2 rounded-full', currentStatusInfo.dot)} />
                    <span>{currentStatusInfo.label}</span>
                  </Badge>
                </div>
              </div>
            </DialogHeader>

            {/* Modal Body */}
            <div className="px-6 py-5 overflow-y-auto flex-1 scrollbar-thin">{MainContent}</div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-zinc-800/80 bg-zinc-950/80 flex items-center justify-between shrink-0">
              <div className="text-xs text-zinc-500 font-mono">
                {storeName} CRM • Atendimento ao Cliente
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl border-zinc-800 text-zinc-300 hover:text-white cursor-pointer px-4"
                >
                  Fechar
                </Button>
                <a
                  href={activeWhatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-zinc-950 font-bold text-xs h-9 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(37,211,102,0.2)] cursor-pointer"
                >
                  <WhatsAppIcon className="w-4 h-4 fill-current" />
                  <span>Falar no WhatsApp</span>
                </a>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {proposal.images && proposal.images.length > 0 && (
          <ImageFullscreen
            images={proposal.images.map((img, i) => ({ id: i.toString(), url: img.url }))}
            isOpen={isFullscreenOpen}
            onClose={() => setIsFullscreenOpen(false)}
            initialSlide={selectedImageIndex}
          />
        )}
      </>
    );
  }

  // Mobile Bottom Sheet
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] rounded-t-3xl bg-[#0d0d10] border-t border-zinc-800 p-0 text-zinc-100 flex flex-col overflow-hidden"
      >
        {/* Top Accent Line */}
        <div className={cn('h-1.5 w-full bg-gradient-to-r', currentStatusInfo.line)} />

        {/* Mobile Header */}
        <SheetHeader className="text-left border-b border-zinc-800/80 pb-3 p-4 pt-5 bg-zinc-950/80 shrink-0">
          <div className="flex items-center justify-between gap-3 pr-8">
            <div className="min-w-0">
              <SheetTitle className="text-lg font-bold truncate text-white">
                {proposal.name}
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-400">
                Recebido em{' '}
                {format(new Date(proposal.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
              </SheetDescription>
            </div>

            <Badge
              variant="outline"
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-lg whitespace-nowrap shrink-0',
                currentStatusInfo.bg,
                currentStatusInfo.text,
                currentStatusInfo.border,
              )}
            >
              {currentStatusInfo.label}
            </Badge>
          </div>
        </SheetHeader>

        {/* Mobile Body */}
        <div className="px-4 py-4 overflow-y-auto flex-1 space-y-4">{MainContent}</div>

        {/* Mobile Sticky Footer */}
        <SheetFooter className="border-t border-zinc-800/80 p-4 bg-zinc-950 shrink-0 flex flex-col gap-2">
          <a
            href={activeWhatsAppLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-zinc-950 font-bold rounded-xl h-12 shadow-[0_0_15px_rgba(37,211,102,0.2)] flex items-center justify-center gap-2 text-sm transition-colors cursor-pointer"
          >
            <WhatsAppIcon className="w-5 h-5 fill-current" />
            <span>Falar no WhatsApp</span>
          </a>

          <SheetClose
            className={buttonVariants({
              variant: 'outline',
              className:
                'w-full h-10 rounded-xl font-semibold border-zinc-800 text-zinc-400 cursor-pointer',
            })}
          >
            Fechar
          </SheetClose>
        </SheetFooter>
      </SheetContent>

      {proposal.images && proposal.images.length > 0 && (
        <ImageFullscreen
          images={proposal.images.map((img, i) => ({ id: i.toString(), url: img.url }))}
          isOpen={isFullscreenOpen}
          onClose={() => setIsFullscreenOpen(false)}
          initialSlide={selectedImageIndex}
        />
      )}
    </Sheet>
  );
}
