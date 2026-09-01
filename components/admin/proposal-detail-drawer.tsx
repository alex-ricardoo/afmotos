'use client';

import React, { useState, useSyncExternalStore, useCallback, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  PlusCircle,
  Calculator,
  Percent,
  CircleDollarSign,
  FileSignature,
  ExternalLink,
  Download,
  FileCheck,
  FileText,
  History,
  ArrowUpRight,
} from 'lucide-react';

import { toast } from 'sonner';
import { PurchaseAgreementModal } from '@/components/admin/purchase-agreement-modal';
import { preparePurchaseAgreementFromProposal } from '@/lib/actions/purchase-agreements';
import { PurchaseAgreementPrepareInput } from '@/types/purchase-agreement';
import { CONSTANTS } from '@/lib/utils/constants';
import { CommissionCard } from '@/components/admin/commission-card';

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

interface ProposalDetailProps {
  proposal: ProposalViewModel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  typeBadgeClass?: string;
  onStatusChange?: (proposal: ProposalViewModel, newStatus: string) => Promise<void> | void;
  siteName?: string;
}

// -------------------------------------------------------------
// Componente Principal: ProposalDetail
// -------------------------------------------------------------
export function ProposalDetail({
  proposal,
  open,
  onOpenChange,
  onStatusChange,
  siteName,
}: ProposalDetailProps) {
  const storeName = siteName || CONSTANTS.STORE_NAME;
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const [activeTab, setActiveTab] = useState<'atendimento' | 'contratos' | 'historico'>('atendimento');
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('default');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [adminOfferPercent, setAdminOfferPercent] = useState<number>(85);
  const [adminCustomOffer, setAdminCustomOffer] = useState<number | null>(null);

  // Contract tab state
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseInitialData, setPurchaseInitialData] = useState<Partial<PurchaseAgreementPrepareInput> | undefined>(undefined);
  const [isLoadingPurchaseData, setIsLoadingPurchaseData] = useState(false);
  const [customPurchaseAmount, setCustomPurchaseAmount] = useState<number>(0);

  // Sincronizar valor de compra negociado quando proposal mudar
  useEffect(() => {
    if (proposal) {
      setCustomPurchaseAmount(proposal.motorcycle?.desiredPrice ?? proposal.motorcycle?.fipePrice ?? 0);
    }
  }, [proposal?.id, proposal?.motorcycle?.desiredPrice, proposal?.motorcycle?.fipePrice]);

  // Editable WhatsApp message
  const [customMessage, setCustomMessage] = useState<string>('');

  // Calculador de valores FIPE e Simulação
  const desiredPrice = proposal?.motorcycle?.desiredPrice || null;
  const fipePrice = proposal?.motorcycle?.fipePrice || null;
  let fipeDiffPercent: number | null = null;
  if (desiredPrice && fipePrice && fipePrice > 0) {
    fipeDiffPercent = Number((((desiredPrice - fipePrice) / fipePrice) * 100).toFixed(1));
  }

  const simulatedOfferFromFipe = fipePrice ? (fipePrice * adminOfferPercent) / 100 : null;
  const effectiveAdminOffer =
    adminCustomOffer !== null
      ? adminCustomOffer
      : simulatedOfferFromFipe || proposal?.motorcycle?.estimatedOffer || null;

  // Gerador de mensagem WhatsApp por preset
  const getPresetBaseMessage = useCallback((presetKey: string) => {
    if (!proposal) return '';
    const name = proposal.name ? proposal.name.trim() : 'Cliente';
    const moto = proposal.motorcycle?.brand
      ? `${proposal.motorcycle.brand} ${proposal.motorcycle.model || ''}`.trim()
      : '';

    switch (presetKey) {
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
  }, [proposal, fipePrice, effectiveAdminOffer, storeName]);

  // Inicializar e atualizar mensagem quando muda preset
  useEffect(() => {
    if (!proposal) return;
    setCustomMessage(getPresetBaseMessage(selectedPreset));
  }, [selectedPreset, proposal?.id, adminOfferPercent, adminCustomOffer, getPresetBaseMessage]);

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
      line: 'from-amber-500 via-amber-400 to-amber-600',
    },
    CONTACTED: {
      label: getProposalStatusLabel('CONTACTED', proposal.type),
      bg: 'bg-blue-500/15',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      dot: 'bg-blue-400',
      line: 'from-blue-500 via-cyan-400 to-blue-600',
    },
    QUALIFIED: {
      label: getProposalStatusLabel('QUALIFIED', proposal.type),
      bg: 'bg-purple-500/15',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      dot: 'bg-purple-400',
      line: 'from-purple-500 via-fuchsia-400 to-purple-600',
    },
    CONVERTED: {
      label: getProposalStatusLabel('CONVERTED', proposal.type),
      bg: 'bg-emerald-500/15',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400',
      line: 'from-emerald-500 via-teal-400 to-emerald-600',
    },
    CLOSED: {
      label: getProposalStatusLabel('CLOSED', proposal.type),
      bg: 'bg-zinc-800',
      text: 'text-zinc-400',
      border: 'border-zinc-700',
      dot: 'bg-zinc-500',
      line: 'from-zinc-700 via-zinc-600 to-zinc-800',
    },
    LOST: {
      label: getProposalStatusLabel('LOST', proposal.type),
      bg: 'bg-rose-500/15',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      dot: 'bg-rose-400',
      line: 'from-rose-500 via-red-400 to-rose-600',
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
          label: 'Anunciar com a Loja',
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
  const currentStatusInfo = statusConfig[proposal.status] || statusConfig.NEW;

  const activeWhatsAppLink = generateWhatsAppLink(
    proposal.phone,
    customMessage || getPresetBaseMessage(selectedPreset),
  );

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
        toast.success(`Status atualizado para ${statusConfig[newStatus]?.label || newStatus}`);
      }
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleOpenPurchaseAgreement = async () => {
    if (!proposal) return;
    setIsLoadingPurchaseData(true);
    const finalPrice =
      customPurchaseAmount > 0
        ? customPurchaseAmount
        : proposal.motorcycle?.desiredPrice || proposal.motorcycle?.fipePrice || 0;

    try {
      const targetId =
        (proposal.metadata as Record<string, unknown> | null)?.sell_request_id ||
        proposal.sourceId ||
        proposal.id;
      const res = await preparePurchaseAgreementFromProposal(String(targetId));
      if (res.success && res.data) {
        setPurchaseInitialData({
          ...res.data,
          purchase_amount: finalPrice,
          paid_amount: finalPrice,
        });
      } else {
        setPurchaseInitialData({
          seller_name: proposal.name,
          seller_phone: proposal.phone,
          seller_email: proposal.email || '',
          brand: proposal.motorcycle?.brand || '',
          model: proposal.motorcycle?.model || '',
          version: proposal.motorcycle?.version || '',
          year_manufacture:
            proposal.motorcycle?.yearManufacture ||
            proposal.motorcycle?.year ||
            new Date().getFullYear(),
          year_model:
            proposal.motorcycle?.yearModel ||
            proposal.motorcycle?.year ||
            new Date().getFullYear(),
          color: proposal.motorcycle?.color || '',
          license_plate: proposal.motorcycle?.licensePlate || '',
          mileage: proposal.motorcycle?.mileage || 0,
          purchase_amount: finalPrice,
          paid_amount: finalPrice,
        });
      }
      setIsPurchaseModalOpen(true);
    } catch {
      setIsPurchaseModalOpen(true);
    } finally {
      setIsLoadingPurchaseData(false);
    }
  };

  // Pipeline Status Steps
  const statusSteps = [
    { key: 'NEW', label: 'Novo Lead', shortLabel: 'Novo' },
    { key: 'CONTACTED', label: 'Em Atendimento', shortLabel: 'Atendimento' },
    { key: 'QUALIFIED', label: 'Qualificado / Oferta', shortLabel: 'Qualificado' },
    { key: 'CONVERTED', label: 'Convertido / Fechado', shortLabel: 'Convertido' },
    { key: 'LOST', label: 'Perdido / Recusado', shortLabel: 'Perdido' },
    { key: 'CLOSED', label: 'Encerrado', shortLabel: 'Encerrado' },
  ];

  // -------------------------------------------------------------
  // Conteúdo das Abas
  // -------------------------------------------------------------

  // Aba 1: Atendimento & Negociação (Visual 2 Colunas 50/50)
  const TabAtendimentoContent = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      {/* Coluna Esquerda: Dados do Cliente, Veículo, Comparativo FIPE & Fotos */}
      <div className="space-y-4">
        {/* Card Cliente */}
        <div className="bg-zinc-900/70 rounded-2xl border border-zinc-800/80 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#c9a44c]" />
              Dados do Cliente
            </h4>
            <Link
              href={`/admin/clientes?q=${encodeURIComponent(proposal.phone || proposal.name)}`}
              target="_blank"
              className="inline-flex items-center gap-1 text-[11px] text-[#e3c56c] hover:underline font-semibold"
            >
              <span>Ver no CRM</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/60">
              <span className="text-zinc-500 text-[10px] block uppercase font-semibold">Nome</span>
              <span className="font-bold text-white text-sm block truncate mt-0.5">{proposal.name}</span>
            </div>

            <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/60">
              <span className="text-zinc-500 text-[10px] block uppercase font-semibold">Telefone / WhatsApp</span>
              <div className="flex items-center justify-between gap-1 mt-0.5">
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
              <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/60 sm:col-span-2">
                <span className="text-zinc-500 text-[10px] block uppercase font-semibold">E-mail</span>
                <span className="font-semibold text-zinc-300 block truncate mt-0.5">{proposal.email}</span>
              </div>
            )}

            {(proposal.city || proposal.state) && (
              <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/60 sm:col-span-2">
                <span className="text-zinc-500 text-[10px] block uppercase font-semibold">Localização</span>
                <span className="font-semibold text-zinc-300 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="truncate">
                    {proposal.city}
                    {proposal.state ? ` - ${proposal.state}` : ''}
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Card Veículo & Comparativo Financeiro */}
        {proposal.motorcycle && (proposal.motorcycle.brand || proposal.motorcycle.model) && (
          <div className="bg-zinc-900/70 rounded-2xl border border-zinc-800/80 p-4 space-y-3.5 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5 text-[#c9a44c]" />
                Veículo Negociado
              </h4>
              <Badge variant="outline" className="text-[10px] font-bold border-zinc-700 bg-zinc-800 text-zinc-300">
                {proposal.motorcycle.brand}
              </Badge>
            </div>

            {/* Informações da moto */}
            <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Modelo</span>
                <span className="text-sm font-extrabold text-white block mt-0.5">
                  {proposal.motorcycle.brand} {proposal.motorcycle.model}
                </span>
              </div>
              <div className="flex items-center gap-2 text-right">
                {proposal.motorcycle.year && (
                  <div className="bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
                    <span className="text-[9px] text-zinc-500 uppercase block font-mono">Ano</span>
                    <span className="font-mono font-bold text-zinc-200 text-xs">{proposal.motorcycle.year}</span>
                  </div>
                )}
                {proposal.motorcycle.mileage != null && (
                  <div className="bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
                    <span className="text-[9px] text-zinc-500 uppercase block font-mono">KM</span>
                    <span className="font-mono font-bold text-zinc-200 text-xs">
                      {new Intl.NumberFormat('pt-BR').format(proposal.motorcycle.mileage)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Comparativo Visual Direto: Expectativa vs FIPE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {desiredPrice != null && (
                <div className="bg-[#c9a44c]/10 border border-[#c9a44c]/30 rounded-xl p-3 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#e3c56c] block">
                    Expectativa do Cliente
                  </span>
                  <span className="text-lg font-black text-[#e3c56c] font-mono block">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(desiredPrice)}
                  </span>
                </div>
              )}

              {fipePrice != null && (
                <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-3 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                      Tabela FIPE
                    </span>
                    {fipeDiffPercent !== null && (
                      <span
                        className={cn(
                          'text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5',
                          fipeDiffPercent < 0
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : fipeDiffPercent > 0
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
                        )}
                      >
                        {fipeDiffPercent < 0 ? (
                          <>
                            <TrendingDown className="w-2.5 h-2.5" />
                            {Math.abs(fipeDiffPercent)}% abaixo
                          </>
                        ) : fipeDiffPercent > 0 ? (
                          <>
                            <TrendingUp className="w-2.5 h-2.5" />+{fipeDiffPercent}% acima
                          </>
                        ) : (
                          'Na FIPE'
                        )}
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-black text-blue-300 font-mono block">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fipePrice)}
                  </span>
                </div>
              )}
            </div>

            {/* Simulador de Oferta da Loja (% FIPE) */}
            {proposal.type === 'SELL_MOTORCYCLE' &&
              proposal.status !== 'CONVERTED' &&
              fipePrice != null &&
              fipePrice > 0 && (
                <div className="bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-950 p-3.5 rounded-xl border border-amber-500/30 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Simulador de Oferta ({adminOfferPercent}% FIPE)</span>
                    </span>
                    <span className="text-xs font-mono font-black text-amber-300">
                      {effectiveAdminOffer != null
                        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(effectiveAdminOffer)
                        : '—'}
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
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
                          'py-1 rounded-md text-[11px] font-bold transition-all border text-center cursor-pointer',
                          adminOfferPercent === pct && adminCustomOffer === null
                            ? 'bg-amber-500 text-zinc-950 border-amber-400 font-black shadow-xs'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700',
                        )}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              )}

            {/* Miniatura de Fotos do Veículo */}
            {proposal.images && proposal.images.length > 0 && (
              <div className="pt-2 border-t border-zinc-800/60">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#c9a44c]" />
                    Fotos do Veículo
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono border-zinc-800 text-zinc-400">
                    {proposal.images.length} {proposal.images.length === 1 ? 'foto' : 'fotos'}
                  </Badge>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {proposal.images.slice(0, 4).map((img, idx) => {
                    const hasMore = idx === 3 && proposal.images.length > 4;

                    return (
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
                          alt={img.altText || `Foto ${idx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {hasMore ? (
                          <div className="absolute inset-0 bg-black/75 flex items-center justify-center font-bold text-xs text-white">
                            +{proposal.images.length - 3}
                          </div>
                        ) : (
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            <Eye className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Coluna Direita: Pipeline de Status & Atendimento WhatsApp */}
      <div className="space-y-4">
        {/* Status do Lead: Stepper de Etapas */}
        <div className="bg-zinc-900/70 rounded-2xl border border-zinc-800/80 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#c9a44c]" />
              Pipeline de Status do Lead
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

          {/* Stepper / Grid de seleção rápida */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {statusSteps.map((step) => {
              const isSelected = proposal.status === step.key;
              const config = statusConfig[step.key] || statusConfig.CLOSED;

              return (
                <button
                  key={step.key}
                  type="button"
                  disabled={isUpdatingStatus}
                  onClick={() => handleQuickStatusUpdate(step.key)}
                  className={cn(
                    'p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 text-left cursor-pointer disabled:opacity-50',
                    isSelected
                      ? cn(
                          'bg-zinc-800/90 text-white shadow-xs',
                          config.border,
                          'ring-1 ring-white/20',
                        )
                      : 'bg-zinc-950/60 text-zinc-400 border-zinc-800/80 hover:bg-zinc-900 hover:text-white',
                  )}
                >
                  <span
                    className={cn(
                      'w-2 h-2 rounded-full shrink-0',
                      config.dot,
                      isSelected && 'ring-2 ring-white/40',
                    )}
                  />
                  <span className="truncate text-[11px]">{config.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Atendimento WhatsApp & Chips de Respostas Rápidas */}
        <div className="bg-zinc-900/70 rounded-2xl border border-zinc-800/80 p-4 space-y-3.5 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <WhatsAppIcon className="w-3.5 h-3.5 fill-[#25D366]" />
              Atendimento WhatsApp
            </h4>
            <span className="text-[10px] text-zinc-500 font-medium">
              Modelos Rápidos & Mensagem
            </span>
          </div>

          {/* Chips de Modelos Rápidos */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-zinc-400 font-medium block">
              Selecione o modelo rápido:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'offer', label: '💰 Oferta FIPE' },
                { id: 'default', label: '✨ Padrão' },
                { id: 'photos', label: '📷 Pedir Fotos' },
                { id: 'visit', label: '📍 Agendar Visita' },
                { id: 'counter', label: '🤝 Contraproposta' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPreset(preset.id)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer',
                    selectedPreset === preset.id
                      ? 'bg-zinc-800 text-white border-[#c9a44c]/60 shadow-xs'
                      : 'bg-zinc-950/60 text-zinc-400 border-zinc-800/60 hover:text-white hover:border-zinc-700',
                  )}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Preview da Mensagem Editável */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-zinc-400 font-medium">
                Mensagem a ser enviada (editável):
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(customMessage);
                  toast.success('Mensagem copiada para a área de transferência!');
                }}
                className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                Copiar
              </button>
            </div>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              className="bg-zinc-950/80 border-zinc-800 text-xs text-zinc-200 resize-none focus:border-[#25D366]/50 rounded-xl leading-relaxed"
              placeholder="Digite ou personalize a mensagem aqui..."
            />
          </div>

          {/* ÚNICO BOTÃO DE AÇÃO PRIMÁRIO */}
          <a
            href={activeWhatsAppLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20BD5A] active:scale-[0.99] text-zinc-950 font-black rounded-xl h-11 shadow-[0_0_20px_rgba(37,211,102,0.25)] flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
          >
            <WhatsAppIcon className="w-5 h-5 fill-current" />
            <span>Enviar Mensagem via WhatsApp</span>
            <ArrowUpRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );

  // Aba 2: Contratos & Fechamento
  const TabContratosContent = (
    <div className="space-y-5">
      {proposal.type === 'CONSIGNMENT' ? (
        /* Painel Unificado de Consignação: Comissão & Contrato PDF */
        <div className="bg-zinc-900/70 border border-emerald-500/20 rounded-2xl p-5 shadow-xs">
          <CommissionCard proposal={proposal} />
        </div>
      ) : (
        /* Formulário de Compra para Estoque Próprio */
        <div className="bg-zinc-900/70 border border-amber-500/20 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-amber-500/10">
            <div>
              <h4 className="text-sm font-black text-amber-300 flex items-center gap-2">
                <FileSignature className="size-4" />
                Contrato de Compra e Aquisição pela Loja
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Formalize a compra direta para o estoque da AF Motos, gerando o instrumento com quitação e termos de transferência.
              </p>
            </div>
            <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
              Estoque Próprio
            </Badge>
          </div>

          {/* Resumo da Moto e Vendedor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/60 space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase font-semibold">Vendedor</span>
              <span className="font-bold text-white text-sm block truncate">{proposal.name}</span>
              <span className="font-mono text-zinc-400 block">{formatPhoneForDisplay(proposal.phone) || proposal.phone}</span>
            </div>

            <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/60 space-y-1">
              <span className="text-zinc-500 text-[10px] uppercase font-semibold">Veículo Negociado</span>
              <span className="font-bold text-white text-sm block truncate">
                {proposal.motorcycle?.brand || ''} {proposal.motorcycle?.model || 'Não especificado'}
              </span>
              <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                {proposal.motorcycle?.year && <span>Ano {proposal.motorcycle.year}</span>}
                {proposal.motorcycle?.mileage != null && (
                  <span>• {new Intl.NumberFormat('pt-BR').format(proposal.motorcycle.mileage)} km</span>
                )}
              </div>
            </div>
          </div>

          {/* Campo Editável de Valor de Compra Negociado */}
          <div className="space-y-2 bg-zinc-950/70 p-4 rounded-xl border border-zinc-800/80">
            <Label htmlFor="custom-purchase-amount" className="flex items-center justify-between text-xs text-zinc-300 font-bold">
              <span className="flex items-center gap-1.5 text-amber-300">
                <CircleDollarSign className="size-4 text-amber-400" />
                Valor de Compra Acordado (R$)
              </span>
              {desiredPrice != null && (
                <span className="text-[11px] text-zinc-400 font-normal">
                  Expectativa cliente: <strong className="text-zinc-200">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(desiredPrice)}</strong>
                </span>
              )}
            </Label>
            <div className="relative">
              <Input
                id="custom-purchase-amount"
                type="number"
                min={0}
                step={0.01}
                value={customPurchaseAmount || ''}
                onChange={(e) => setCustomPurchaseAmount(Number(e.target.value || 0))}
                className="h-11 pr-10 bg-zinc-900/90 border-zinc-700 font-mono font-black text-amber-300 text-lg focus:border-amber-500/50 rounded-xl"
                placeholder="0,00"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-xs font-bold text-zinc-400">
                R$
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Você pode ajustar o valor final acordado nesta proposta antes de gerar o contrato oficial.
            </p>
          </div>

          {/* Botão de Ação para Compra */}
          <Button
            type="button"
            onClick={handleOpenPurchaseAgreement}
            disabled={isLoadingPurchaseData || customPurchaseAmount <= 0}
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs h-11 rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all cursor-pointer disabled:opacity-50"
          >
            <FileCheck className="size-4" />
            {isLoadingPurchaseData ? 'Carregando dados...' : `Gerar Contrato de Compra (${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(customPurchaseAmount)})`}
          </Button>

          {/* Se a proposta já foi concluída/comprada, atalho para catálogo */}
          {proposal.status === 'CONVERTED' && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="size-4 text-emerald-400" />
                  <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">
                    Moto Comprada & Concluída
                  </span>
                </div>
                <Badge className="bg-emerald-500 text-zinc-950 font-black text-[10px]">
                  Estoque Pronto
                </Badge>
              </div>
              <p className="text-xs text-zinc-300">
                Os dados cadastrais e fotos desta negociação estão prontos para inclusão imediata no catálogo de motos.
              </p>
              <Link
                href={getStockRegistrationUrlFromProposal(proposal)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black rounded-xl h-10 flex items-center justify-center gap-2 text-xs transition-all cursor-pointer"
              >
                <PlusCircle className="size-4" />
                <span>Cadastrar no Estoque da Loja</span>
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Aba 3: Mensagem & Histórico
  const TabHistoricoContent = (
    <div className="space-y-4">
      {/* Mensagem Original Enviada pelo Cliente */}
      {proposal.message ? (
        <div className="bg-zinc-900/70 rounded-2xl border border-zinc-800/80 p-4 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#c9a44c]" />
              Mensagem Original do Cliente
            </h4>
            <button
              type="button"
              onClick={handleCopyMessage}
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {copiedMessage ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copiedMessage ? 'Copiada' : 'Copiar'}</span>
            </button>
          </div>
          <p className="text-xs text-zinc-200 italic bg-zinc-950/70 p-3.5 rounded-xl border border-zinc-800/60 leading-relaxed">
            &quot;{proposal.message}&quot;
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900/40 p-4 rounded-2xl border border-zinc-800/60 text-xs text-zinc-400 italic flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-500" />
          <span>Nenhuma mensagem adicional de texto foi incluída no formulário.</span>
        </div>
      )}

      {/* Dados de Locação se aplicável */}
      {(proposal.rental || proposal.type === 'RENTAL') && (
        <div className="bg-blue-950/30 rounded-2xl border border-blue-500/30 p-4 space-y-3 shadow-xs">
          <div className="flex items-center justify-between pb-2 border-b border-blue-500/30">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              Detalhes da Solicitação de Aluguel
            </h4>
            <Badge variant="outline" className="text-[10px] font-bold border-blue-500/40 bg-blue-500/10 text-blue-300">
              Locação
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            {proposal.rental?.desiredPlan && (
              <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-zinc-500 text-[10px] block uppercase font-semibold">Plano Desejado</span>
                <span className="font-bold text-blue-400 text-sm block mt-0.5">{proposal.rental.desiredPlan}</span>
              </div>
            )}
            {proposal.rental?.expectedStartDate && (
              <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-zinc-500 text-[10px] block uppercase font-semibold">Início Previsto</span>
                <span className="font-bold text-zinc-200 font-mono text-sm block mt-0.5">
                  {proposal.rental.expectedStartDate.split('-').reverse().join('/')}
                </span>
              </div>
            )}
            {proposal.rental?.hasCnhA && (
              <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-zinc-500 text-[10px] block uppercase font-semibold">CNH Categoria A</span>
                <span className="font-bold text-white block mt-0.5">{proposal.rental.hasCnhA}</span>
              </div>
            )}
            {proposal.rental?.age != null && (
              <div className="bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-zinc-500 text-[10px] block uppercase font-semibold">Idade</span>
                <span className="font-bold text-zinc-200 block mt-0.5">{proposal.rental.age} anos</span>
              </div>
            )}
            {proposal.rental?.purposeOfUse && (
              <div className="col-span-2 bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-zinc-500 text-[10px] block uppercase font-semibold">Finalidade de Uso</span>
                <span className="font-semibold text-zinc-200 block truncate mt-0.5">{proposal.rental.purposeOfUse}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Linha do Tempo & Histórico */}
      <div className="bg-zinc-900/70 rounded-2xl border border-zinc-800/80 p-4 space-y-3.5 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5 pb-2 border-b border-zinc-800/60">
          <History className="w-3.5 h-3.5 text-[#c9a44c]" />
          Linha do Tempo do Lead
        </h4>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-800">
          {/* Evento 1: Criação */}
          <div className="relative">
            <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-zinc-950" />
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-white block">Proposta Criada no Site</span>
              <span className="text-[11px] text-zinc-400 block font-mono">
                {format(new Date(proposal.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </span>
              <span className="text-[11px] text-zinc-500 block">
                Canal de Origem: {typeLabel} ({proposal.source})
              </span>
            </div>
          </div>

          {/* Evento 2: Status Atual */}
          <div className="relative">
            <div className={cn('absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-zinc-950', currentStatusInfo.dot)} />
            <div className="text-xs space-y-0.5">
              <span className="font-bold text-white block">Status Vigente: {currentStatusInfo.label}</span>
              <span className="text-[11px] text-zinc-400 block">
                Acompanhamento e registro em tempo real pelo painel CRM da AF Motos.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // -------------------------------------------------------------
  // Render Desktop Dialog
  // -------------------------------------------------------------
  if (isDesktop) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-4xl lg:max-w-5xl max-h-[85vh] overflow-hidden flex flex-col p-0 bg-[#0d0d10] border border-zinc-800 text-zinc-100 shadow-[0_25px_60px_rgba(0,0,0,0.9)] rounded-3xl">
            {/* Top Accent Line */}
            <div className={cn('h-1.5 w-full bg-gradient-to-r shrink-0', currentStatusInfo.line)} />

            {/* Modal Header Fixo */}
            <DialogHeader className="px-6 pt-4 pb-3 border-b border-zinc-800/80 bg-zinc-950/90 shrink-0">
              <div className="flex items-center justify-between gap-4 pr-8">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#c9a44c] shrink-0 shadow-xs">
                    <TypeIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <DialogTitle className="text-xl font-black text-white truncate">
                      {proposal.name}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-zinc-400 flex items-center gap-2">
                      <span className="font-mono text-zinc-300 font-bold">#{proposal.id.slice(0, 8)}</span>
                      <span>•</span>
                      <span>
                        Recebido em{' '}
                        {format(new Date(proposal.createdAt), "dd/MM/yyyy 'às' HH:mm", {
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

              {/* Sub-header de Abas Elegante */}
              <div className="pt-3">
                <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-zinc-900/90 border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setActiveTab('atendimento')}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer',
                      activeTab === 'atendimento'
                        ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40',
                    )}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>1. Atendimento & Negociação</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('contratos')}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer',
                      activeTab === 'contratos'
                        ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40',
                    )}
                  >
                    {proposal.type === 'CONSIGNMENT' ? (
                      <>
                        <Calculator className="w-3.5 h-3.5 text-emerald-400" />
                        <span>2. Contrato & Comissão</span>
                      </>
                    ) : (
                      <>
                        <FileSignature className="w-3.5 h-3.5 text-amber-400" />
                        <span>2. Contrato de Compra</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('historico')}
                    className={cn(
                      'flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer',
                      activeTab === 'historico'
                        ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40',
                    )}
                  >
                    <History className="w-3.5 h-3.5 text-blue-400" />
                    <span>3. Mensagem & Histórico</span>
                  </button>
                </div>
              </div>
            </DialogHeader>

            {/* Modal Body com Scroll Suave Contido */}
            <div className="px-6 py-5 overflow-y-auto flex-1 scrollbar-thin">
              {activeTab === 'atendimento' && TabAtendimentoContent}
              {activeTab === 'contratos' && TabContratosContent}
              {activeTab === 'historico' && TabHistoricoContent}
            </div>

            {/* Modal Footer Limpo */}
            <div className="px-6 py-3.5 border-t border-zinc-800/80 bg-zinc-950/90 flex items-center justify-between shrink-0">
              <div className="text-xs text-zinc-500 font-mono">
                {storeName} CRM • Proposta #{proposal.id.slice(0, 8)}
              </div>

              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="rounded-xl border-zinc-800 text-zinc-300 hover:text-white cursor-pointer px-5 h-9 font-bold"
                >
                  Fechar
                </Button>
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

        <PurchaseAgreementModal
          open={isPurchaseModalOpen}
          onOpenChange={setIsPurchaseModalOpen}
          initialData={purchaseInitialData}
        />
      </>
    );
  }

  // -------------------------------------------------------------
  // Render Mobile Bottom Sheet
  // -------------------------------------------------------------
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92vh] rounded-t-3xl bg-[#0d0d10] border-t border-zinc-800 p-0 text-zinc-100 flex flex-col overflow-hidden"
      >
        {/* Top Accent Line */}
        <div className={cn('h-1.5 w-full bg-gradient-to-r shrink-0', currentStatusInfo.line)} />

        {/* Mobile Header Fixo */}
        <SheetHeader className="text-left border-b border-zinc-800/80 pb-3 p-4 pt-4 bg-zinc-950/90 shrink-0">
          <div className="flex items-center justify-between gap-3 pr-8">
            <div className="min-w-0">
              <SheetTitle className="text-lg font-bold truncate text-white">
                {proposal.name}
              </SheetTitle>
              <SheetDescription className="text-xs text-zinc-400 font-mono">
                #{proposal.id.slice(0, 8)} • {format(new Date(proposal.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
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

          {/* Abas Mobile */}
          <div className="pt-2">
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-zinc-900/90 border border-zinc-800">
              <button
                type="button"
                onClick={() => setActiveTab('atendimento')}
                className={cn(
                  'py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center',
                  activeTab === 'atendimento'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200',
                )}
              >
                1. Atendimento
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('contratos')}
                className={cn(
                  'py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center',
                  activeTab === 'contratos'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200',
                )}
              >
                {proposal.type === 'CONSIGNMENT' ? '2. Comissão' : '2. Compra'}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('historico')}
                className={cn(
                  'py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all text-center',
                  activeTab === 'historico'
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200',
                )}
              >
                3. Mensagem
              </button>
            </div>
          </div>
        </SheetHeader>

        {/* Mobile Body */}
        <div className="px-4 py-4 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'atendimento' && TabAtendimentoContent}
          {activeTab === 'contratos' && TabContratosContent}
          {activeTab === 'historico' && TabHistoricoContent}
        </div>

        {/* Mobile Footer Limpo */}
        <SheetFooter className="border-t border-zinc-800/80 p-3 bg-zinc-950 shrink-0 flex items-center justify-between">
          <div className="text-[11px] text-zinc-500 font-mono">
            {storeName} CRM • #{proposal.id.slice(0, 8)}
          </div>
          <SheetClose
            className={buttonVariants({
              variant: 'outline',
              size: 'sm',
              className: 'rounded-xl border-zinc-800 text-zinc-400 hover:text-white px-4 h-8 text-xs font-semibold',
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

      <PurchaseAgreementModal
        open={isPurchaseModalOpen}
        onOpenChange={setIsPurchaseModalOpen}
        initialData={purchaseInitialData}
      />
    </Sheet>
  );
}
