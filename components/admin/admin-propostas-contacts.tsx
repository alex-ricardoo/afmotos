'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  LayoutGrid,
  List,
  MessageSquare,
  Phone,
  Clock,
  CheckCircle2,
  Bike,
  Tag,
  KeyRound,
  Calendar,
  X,
  Sparkles,
  ChevronDown,
  MapPin,
  Image as ImageIcon,
  Copy,
  Check,
  PlusCircle,
  Plus,
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ManualProposalModal } from './manual-proposal-modal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { updateLeadStatus } from '@/lib/actions/leads';
import {
  ProposalViewModel,
  getStockRegistrationUrlFromProposal,
} from '@/lib/admin/proposal-view-model';
import {
  proposalTypeLabels,
  proposalStatusLabels,
  getProposalStatusLabel,
} from '@/lib/admin/proposal-labels';


import { format, isToday, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import {
  generateWhatsAppLink,
  generateProposalWhatsAppMessage,
  formatPhoneForDisplay,
} from '@/lib/utils/whatsapp';
import { ProposalDetail } from './proposal-detail-drawer';
import { CONSTANTS } from '@/lib/utils/constants';

interface Props {
  initialData: ProposalViewModel[];
  siteName?: string;
}

export function AdminPropostasContacts({ initialData, siteName }: Props) {
  const storeName = siteName || CONSTANTS.STORE_NAME;
  const router = useRouter();
  const searchParams = useSearchParams();
  const proposalIdParam = searchParams.get('id') || searchParams.get('proposalId');
  const sellRequestIdParam = searchParams.get('sellRequestId');
  const searchParam = searchParams.get('search');

  const [proposals, setProposals] = useState<ProposalViewModel[]>(initialData);
  const [prevInitialData, setPrevInitialData] = useState<ProposalViewModel[]>(initialData);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [activeType, setActiveType] = useState<string>('ALL');
  const [selectedProposal, setSelectedProposal] = useState<ProposalViewModel | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Sync state if initialData changes during server revalidation
  if (initialData !== prevInitialData) {
    setPrevInitialData(initialData);
    setProposals(initialData);
  }

  // Auto-select proposal from URL query parameters (id, sellRequestId, etc.)
  useEffect(() => {
    if (proposalIdParam || sellRequestIdParam) {
      const match = proposals.find(
        (p) =>
          p.id === proposalIdParam ||
          p.sourceId === proposalIdParam ||
          p.sourceId === sellRequestIdParam ||
          (p.metadata as any)?.sell_request_id === sellRequestIdParam ||
          (p.metadata as any)?.sellRequestId === sellRequestIdParam ||
          (p.metadata as any)?.lead_id === proposalIdParam,
      );
      if (match) {
        setSelectedProposal(match);
      }
    } else if (searchParam) {
      setSearchQuery(searchParam);
    }
  }, [proposalIdParam, sellRequestIdParam, searchParam, proposals]);

  // Filter local data
  const filteredProposals = proposals.filter((item) => {
    const matchesStatus =
      activeStatus === 'ALL'
        ? true
        : activeStatus === 'NEW'
          ? item.status === 'NEW'
          : activeStatus === 'CONTACTED'
            ? item.status === 'CONTACTED'
            : activeStatus === 'QUALIFIED'
              ? item.status === 'QUALIFIED'
              : activeStatus === 'CONVERTED'
                ? item.status === 'CONVERTED'
                : activeStatus === 'CLOSED'
                  ? item.status === 'CLOSED' || item.status === 'LOST'
                  : item.status === activeStatus;

    const matchesType = activeType === 'ALL' ? true : item.type === activeType;

    const queryLower = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !queryLower ||
      item.name.toLowerCase().includes(queryLower) ||
      item.phone.includes(queryLower) ||
      (item.email && item.email.toLowerCase().includes(queryLower)) ||
      (item.message && item.message.toLowerCase().includes(queryLower)) ||
      (item.motorcycle?.brand && item.motorcycle.brand.toLowerCase().includes(queryLower)) ||
      (item.motorcycle?.model && item.motorcycle.model.toLowerCase().includes(queryLower)) ||
      (item.city && item.city.toLowerCase().includes(queryLower)) ||
      (item.rental?.desiredPlan && item.rental.desiredPlan.toLowerCase().includes(queryLower)) ||
      (item.rental?.purposeOfUse && item.rental.purposeOfUse.toLowerCase().includes(queryLower)) ||
      (item.rental?.hasCnhA && item.rental.hasCnhA.toLowerCase().includes(queryLower));

    return matchesStatus && matchesType && matchesSearch;
  });

  // Calculate statistics
  const totalContacts = proposals.length;
  const newCount = proposals.filter((i) => i.status === 'NEW').length;
  const contactedCount = proposals.filter((i) => i.status === 'CONTACTED').length;
  const qualifiedCount = proposals.filter((i) => i.status === 'QUALIFIED').length;
  const convertedCount = proposals.filter((i) => i.status === 'CONVERTED').length;
  const closedCount = proposals.filter((i) => i.status === 'CLOSED' || i.status === 'LOST').length;

  const handleStatusChange = async (proposal: ProposalViewModel, newStatus: string) => {
    const typedStatus = newStatus as keyof typeof proposalStatusLabels;
    const statusLabel = getProposalStatusLabel(typedStatus, proposal.type);
    const previousProposals = [...proposals];
    setProposals((prev) =>
      prev.map((p) =>
        p.id === proposal.id
          ? {
              ...p,
              status: typedStatus,
              statusLabel,
            }
          : p,
      ),
    );

    if (selectedProposal && selectedProposal.id === proposal.id) {
      setSelectedProposal({
        ...selectedProposal,
        status: typedStatus,
        statusLabel,
      });
    }

    try {
      const res = await updateLeadStatus(
        proposal.id,
        newStatus,
        proposal.source,
        proposal.sourceId,
      );
      if (res?.error) {
        throw new Error(res.error);
      }
      toast.success(`Status alterado para "${statusLabel}"`);
      router.refresh();
    } catch (err: unknown) {
      setProposals(previousProposals);
      toast.error('Erro ao alterar status: ' + ((err as Error)?.message || 'Tente novamente'));
    }
  };

  const handleCopyPhone = (e: React.MouseEvent, id: string, phone: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone.replace(/\D/g, ''));
    setCopiedPhoneId(id);
    toast.success('Telefone copiado!');
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  const getTypeStyle = (type: string) => {
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

  const getStatusConfig = (status: string, type?: string) => {
    const label = getProposalStatusLabel(status, type);
    switch (status) {
      case 'NEW':
        return {
          label,
          badgeClass: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold',
          cardBorder: 'border-emerald-500/35 hover:border-emerald-400',
          cardGlow: 'hover:shadow-[0_12px_35px_rgba(16,185,129,0.15)]',
          topLine: 'from-emerald-500 via-teal-400 to-emerald-500',
          dot: 'bg-emerald-400 animate-pulse',
        };
      case 'CONTACTED':
        return {
          label,
          badgeClass: 'bg-blue-500/20 text-blue-400 border-blue-500/40 font-bold',
          cardBorder: 'border-blue-500/30 hover:border-blue-400',
          cardGlow: 'hover:shadow-[0_12px_35px_rgba(59,130,246,0.12)]',
          topLine: 'from-blue-500 via-cyan-400 to-blue-500',
          dot: 'bg-blue-400',
        };
      case 'QUALIFIED':
        return {
          label,
          badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold',
          cardBorder: 'border-purple-500/30 hover:border-purple-400',
          cardGlow: 'hover:shadow-[0_12px_35px_rgba(168,85,247,0.12)]',
          topLine: 'from-purple-500 via-pink-400 to-purple-500',
          dot: 'bg-purple-400',
        };
      case 'CONVERTED':
        return {
          label,
          badgeClass: 'bg-[#c9a44c]/25 text-[#f5d77f] border-[#c9a44c]/50 font-bold',
          cardBorder: 'border-[#c9a44c]/40 hover:border-[#c9a44c]',
          cardGlow: 'hover:shadow-[0_12px_35px_rgba(201,164,76,0.18)]',
          topLine: 'from-[#c9a44c] via-amber-300 to-[#c9a44c]',
          dot: 'bg-[#e3c56c]',
        };
      case 'LOST':
        return {
          label,
          badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/30 font-semibold',
          cardBorder: 'border-rose-500/20 hover:border-rose-500/40',
          cardGlow: '',
          topLine: 'from-rose-500 to-red-400',
          dot: 'bg-rose-400',
        };
      case 'CLOSED':
      default:
        return {
          label,
          badgeClass: 'bg-zinc-800 text-zinc-400 border-zinc-700 font-medium',
          cardBorder: 'border-zinc-800/80 hover:border-zinc-700',
          cardGlow: '',
          topLine: 'from-zinc-700 to-zinc-800',
          dot: 'bg-zinc-500',
        };
    }
  };

  const formatRelativeDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isToday(date)) {
        return `Hoje às ${format(date, 'HH:mm', { locale: ptBR })}`;
      }
      if (isYesterday(date)) {
        return `Ontem às ${format(date, 'HH:mm', { locale: ptBR })}`;
      }
      return format(date, "dd/MM 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Propostas & Leads
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#c9a44c]/15 text-[#e3c56c] border border-[#c9a44c]/30">
              <Sparkles className="w-3 h-3" /> CRM {storeName}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Gestão inteligente de clientes interessados em comprar, vender ou alugar motos com
            contato direto no WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            onClick={() => setIsManualModalOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-[#e3c56c] via-[#c9a44c] to-[#b48d3c] hover:opacity-95 text-zinc-950 font-extrabold rounded-xl px-5 h-11 shadow-[0_0_20px_rgba(201,164,76,0.25)] transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer active:scale-95 text-sm"
          >
            <Plus className="h-5 w-5 stroke-[2.5]" />
            <span>Cadastrar Nova Proposta</span>
          </Button>
        </div>
      </div>

      {/* 2. Quick Metrics Bar (Clickable to Filter) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Contatos */}
        <button
          type="button"
          onClick={() => setActiveStatus('ALL')}
          className={cn(
            'bg-zinc-950/70 p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer',
            activeStatus === 'ALL'
              ? 'border-white/30 bg-zinc-900 shadow-md ring-1 ring-white/20'
              : 'border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60',
          )}
        >
          <div>
            <span className="text-[11px] font-bold text-zinc-400 block uppercase tracking-wider">
              Total de Contatos
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white tabular-nums mt-0.5 block">
              {totalContacts}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-zinc-900 flex items-center justify-center text-[#c9a44c] border border-zinc-800 shadow-xs">
            <MessageSquare className="w-5 h-5" />
          </div>
        </button>

        {/* Novos Leads */}
        <button
          type="button"
          onClick={() => setActiveStatus('NEW')}
          className={cn(
            'bg-zinc-950/70 p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer',
            activeStatus === 'NEW'
              ? 'border-emerald-500/60 bg-emerald-950/30 shadow-md ring-1 ring-emerald-500/40'
              : 'border-emerald-500/25 hover:border-emerald-500/40 hover:bg-emerald-950/15',
          )}
        >
          <div>
            <span className="text-[11px] font-bold text-emerald-400 block uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Novos Leads
            </span>
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums mt-0.5 block">
              {newCount}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-xs">
            <Sparkles className="w-5 h-5" />
          </div>
        </button>

        {/* Em Atendimento */}
        <button
          type="button"
          onClick={() => setActiveStatus('CONTACTED')}
          className={cn(
            'bg-zinc-950/70 p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer',
            activeStatus === 'CONTACTED'
              ? 'border-blue-500/60 bg-blue-950/30 shadow-md ring-1 ring-blue-500/40'
              : 'border-blue-500/25 hover:border-blue-500/40 hover:bg-blue-950/15',
          )}
        >
          <div>
            <span className="text-[11px] font-bold text-blue-400 block uppercase tracking-wider">
              Em Atendimento
            </span>
            <span className="text-2xl sm:text-3xl font-black text-blue-400 tabular-nums mt-0.5 block">
              {contactedCount}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-xs">
            <Clock className="w-5 h-5" />
          </div>
        </button>

        {/* Convertidos */}
        <button
          type="button"
          onClick={() => setActiveStatus('CONVERTED')}
          className={cn(
            'bg-zinc-950/70 p-4 rounded-2xl border transition-all text-left flex items-center justify-between cursor-pointer',
            activeStatus === 'CONVERTED'
              ? 'border-[#c9a44c]/60 bg-amber-950/30 shadow-md ring-1 ring-[#c9a44c]/40'
              : 'border-[#c9a44c]/25 hover:border-[#c9a44c]/40 hover:bg-amber-950/15',
          )}
        >
          <div>
            <span className="text-[11px] font-bold text-[#e3c56c] block uppercase tracking-wider">
              Convertidos
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[#e3c56c] tabular-nums mt-0.5 block">
              {convertedCount}
            </span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 flex items-center justify-center text-[#e3c56c] border border-amber-500/20 shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </button>
      </div>

      {/* 3. Toolbar (Search, Filter Tabs & View Mode) */}
      <div className="bg-zinc-950/80 p-4 rounded-3xl border border-zinc-800/80 shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por cliente, telefone, moto, cidade ou mensagem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9 h-11 bg-zinc-900/90 border-zinc-800 focus:border-[#c9a44c] focus:ring-1 focus:ring-[#c9a44c]/30 rounded-xl text-sm w-full text-white placeholder:text-zinc-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Selector & View Toggle */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
            <select
              value={activeType}
              onChange={(e) => setActiveType(e.target.value)}
              className="h-11 px-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-semibold text-zinc-200 outline-none focus:border-[#c9a44c] w-full sm:w-auto shrink-0 cursor-pointer"
            >
              <option value="ALL">Todos os Tipos de Solicitação</option>
              {Object.entries(proposalTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <div className="flex items-center justify-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex-1 sm:flex-initial h-9 px-3.5 rounded-lg text-xs font-bold gap-1.5 transition-all cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-[#c9a44c] text-zinc-950 shadow-xs hover:bg-[#e3c56c]'
                    : 'text-zinc-400 hover:text-white',
                )}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Cards</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex-1 sm:flex-initial h-9 px-3.5 rounded-lg text-xs font-bold gap-1.5 transition-all cursor-pointer',
                  viewMode === 'table'
                    ? 'bg-[#c9a44c] text-zinc-950 shadow-xs hover:bg-[#e3c56c]'
                    : 'text-zinc-400 hover:text-white',
                )}
              >
                <List className="w-4 h-4" />
                <span>Tabela</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Status Filter Badges Tabs with Dynamic Counts */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'ALL', label: 'Todos os Contatos', count: totalContacts },
            { id: 'NEW', label: 'Novos Leads', count: newCount, highlight: newCount > 0 },
            { id: 'CONTACTED', label: 'Em atendimento', count: contactedCount },
            { id: 'QUALIFIED', label: 'Qualificados', count: qualifiedCount },
            { id: 'CONVERTED', label: 'Convertidos', count: convertedCount },
            { id: 'CLOSED', label: 'Encerrados', count: closedCount },
          ].map((tab) => {
            const isActive = activeStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStatus(tab.id)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border text-xs flex items-center gap-2 cursor-pointer',
                  isActive
                    ? 'bg-[#c9a44c] text-zinc-950 border-[#c9a44c] shadow-xs'
                    : 'bg-zinc-900/70 text-zinc-400 border-zinc-800/80 hover:text-white hover:bg-zinc-800',
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
                    isActive
                      ? 'bg-zinc-950 text-white'
                      : tab.highlight
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-zinc-800 text-zinc-400',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Main Contact Showcase */}
      {filteredProposals.length === 0 ? (
        <div className="bg-zinc-950/70 rounded-3xl border border-zinc-800 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 mx-auto flex items-center justify-center text-zinc-500 border border-zinc-800 shadow-xs">
            <MessageSquare className="w-8 h-8 text-[#c9a44c]" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-white">Nenhum contato encontrado</h3>
            <p className="text-xs text-zinc-400">
              Não encontramos solicitações com os filtros selecionados no momento.
            </p>
          </div>
          {(searchQuery || activeStatus !== 'ALL' || activeType !== 'ALL') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setActiveStatus('ALL');
                setActiveType('ALL');
              }}
              className="rounded-xl font-semibold border-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProposals.map((proposal) => {
            const isRental = proposal.source === 'rental_request' || proposal.type === 'RENTAL';
            const typeInfo = getTypeStyle(proposal.type);
            const TypeIcon = typeInfo.icon;
            const statusConfig = getStatusConfig(proposal.status, proposal.type);
            const isCopied = copiedPhoneId === proposal.id;

            // FIPE delta
            const desired = proposal.motorcycle?.desiredPrice;
            const fipe = proposal.motorcycle?.fipePrice;
            let fipeDiff: number | null = null;
            if (desired && fipe && fipe > 0) {
              fipeDiff = Number((((desired - fipe) / fipe) * 100).toFixed(0));
            }

            return (
              <div
                key={proposal.id}
                className={cn(
                  'group flex flex-col bg-zinc-950/80 rounded-3xl border transition-all duration-300 overflow-hidden cursor-pointer relative shadow-sm',
                  statusConfig.cardBorder,
                  statusConfig.cardGlow,
                )}
                onClick={(e) => {
                  if ((e.target as HTMLElement).closest('button, a, select')) return;
                  setSelectedProposal(proposal);
                }}
              >
                {/* Top Colored Accent Stripe */}
                <div
                  className={cn('h-1.5 w-full bg-gradient-to-r shrink-0', statusConfig.topLine)}
                />

                {/* Cover Image (if available) */}
                {proposal.images && proposal.images.length > 0 && (
                  <div className={cn(
                    "relative h-38 w-full overflow-hidden border-b border-zinc-900 shrink-0",
                    proposal.images[0].url.includes('/logo.') || proposal.images[0].provider === 'system'
                      ? "bg-zinc-950 flex items-center justify-center p-4"
                      : "bg-zinc-900"
                  )}>
                    <img
                      src={proposal.images[0].url}
                      alt="Foto da moto"
                      className={cn(
                        "transition-transform duration-500",
                        proposal.images[0].url.includes('/logo.') || proposal.images[0].provider === 'system'
                          ? "w-full h-full object-contain max-h-28 opacity-90 group-hover:scale-105"
                          : "w-full h-full object-cover group-hover:scale-105"
                      )}
                    />
                    <div className="absolute top-2.5 right-2.5 bg-black/80 backdrop-blur-sm px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-[11px] text-white font-bold border border-white/10 shadow-sm">
                      <ImageIcon className="w-3.5 h-3.5 text-[#c9a44c]" />
                      <span>
                        {proposal.images[0].url.includes('/logo.') || proposal.images[0].provider === 'system'
                          ? 'Logo Padrão'
                          : `${proposal.images.length} fotos`}
                      </span>
                    </div>
                  </div>
                )}

                {/* Card Main Body */}
                <div className="p-4 sm:p-4.5 flex flex-col flex-1 gap-3.5">
                  {/* Row 1: Type Badge & Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg flex items-center gap-1.5 border',
                        typeInfo.className,
                      )}
                    >
                      <TypeIcon className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[130px]">{typeInfo.label}</span>
                    </Badge>

                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] px-2 py-0.5 rounded-lg flex items-center gap-1 shrink-0',
                        statusConfig.badgeClass,
                      )}
                    >
                      <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dot)} />
                      <span>{statusConfig.label}</span>
                    </Badge>
                  </div>

                  {/* Row 2: Customer Name & Timestamp */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-extrabold text-base text-white group-hover:text-[#e3c56c] transition-colors truncate">
                        {proposal.name}
                      </h3>
                      <span className="text-[11px] text-zinc-500 font-mono flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatRelativeDate(proposal.createdAt)}
                      </span>
                    </div>

                    {/* Contact Pills (Phone & City) */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <button
                        type="button"
                        onClick={(e) => handleCopyPhone(e, proposal.id, proposal.phone)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-mono text-zinc-300 transition-colors cursor-pointer"
                        title="Clique para copiar o telefone"
                      >
                        <Phone className="w-3 h-3 text-[#c9a44c]" />
                        <span>{formatPhoneForDisplay(proposal.phone) || proposal.phone}</span>
                        {isCopied ? (
                          <Check className="w-3 h-3 text-emerald-400 ml-0.5" />
                        ) : (
                          <Copy className="w-2.5 h-2.5 text-zinc-500 opacity-60 ml-0.5" />
                        )}
                      </button>

                      {proposal.city && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900/60 border border-zinc-800/60 text-[11px] text-zinc-400">
                          <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                          <span className="truncate max-w-[110px]">{proposal.city}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Rental or Motorcycle Info Card */}
                  {proposal.rental ? (
                    <div className="bg-blue-950/20 p-3 rounded-2xl border border-blue-500/25 text-xs text-zinc-200 space-y-1.5 mt-auto">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-blue-400 font-bold">Plano</span>
                        <span className="font-extrabold text-white">
                          {proposal.rental.desiredPlan || 'Não informado'}
                        </span>
                      </div>
                      {proposal.rental.expectedStartDate && (
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-zinc-400">Início previsto</span>
                          <span className="font-mono text-zinc-300">
                            {proposal.rental.expectedStartDate.split('-').reverse().join('/')}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">CNH A / Idade</span>
                        <span className="text-zinc-300">
                          {proposal.rental.hasCnhA || '-'}{' '}
                          {proposal.rental.age ? `• ${proposal.rental.age} anos` : ''}
                        </span>
                      </div>
                      {proposal.motorcycle?.brand ? (
                        <div className="flex justify-between items-center pt-1 border-t border-blue-500/20 text-[11px]">
                          <span className="text-zinc-400">Moto</span>
                          <span className="font-bold text-[#e3c56c] truncate max-w-[130px]">
                            {proposal.motorcycle.brand} {proposal.motorcycle.model}
                          </span>
                        </div>
                      ) : (
                        <div className="pt-1 border-t border-blue-500/20 text-[10px] text-zinc-400 italic">
                          Cliente ainda não selecionou uma moto específica.
                        </div>
                      )}
                    </div>
                  ) : proposal.motorcycle?.brand ? (
                    <div className="bg-zinc-900/70 p-3 rounded-2xl border border-zinc-800/80 text-xs text-zinc-200 space-y-1.5 mt-auto">
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400 font-medium text-[11px]">Moto</span>
                        <span className="font-extrabold text-white text-right truncate ml-2">
                          {proposal.motorcycle.brand} {proposal.motorcycle.model}
                        </span>
                      </div>

                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-zinc-400">Ano / Km</span>
                        <span className="font-mono text-zinc-300">
                          {proposal.motorcycle.year || '-'}{' '}
                          {proposal.motorcycle.mileage != null
                            ? `• ${new Intl.NumberFormat('pt-BR').format(proposal.motorcycle.mileage)} km`
                            : ''}
                        </span>
                      </div>

                      {/* Desired Price & FIPE Comparison */}
                      {proposal.motorcycle.desiredPrice != null && (
                        <div className="flex justify-between items-center pt-1 border-t border-zinc-800/60">
                          <span className="text-zinc-400 text-[11px]">Valor pedido</span>
                          <div className="text-right">
                            <span className="text-[#e3c56c] font-black font-mono text-sm block">
                              {new Intl.NumberFormat('pt-BR', {
                                style: 'currency',
                                currency: 'BRL',
                              }).format(proposal.motorcycle.desiredPrice)}
                            </span>
                            {fipeDiff !== null && (
                              <span
                                className={cn(
                                  'text-[9px] font-extrabold block',
                                  fipeDiff < 0 ? 'text-emerald-400' : 'text-zinc-400',
                                )}
                              >
                                {fipeDiff < 0
                                  ? `${Math.abs(fipeDiff)}% abaixo da FIPE`
                                  : fipeDiff > 0
                                    ? `+${fipeDiff}% acima FIPE`
                                    : 'Preço na FIPE'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : proposal.message ? (
                    <div className="bg-zinc-900/50 p-3 rounded-2xl border border-zinc-800/60 text-xs text-zinc-300 line-clamp-3 leading-relaxed italic mt-auto">
                      &quot;{proposal.message}&quot;
                    </div>
                  ) : null}

                  {/* Row 4: Action Footer (WhatsApp Button / Cadastrar no Estoque + Status Dropdown) */}
                  <div className="pt-2.5 border-t border-zinc-900/90 flex items-center gap-2 mt-auto">
                    {proposal.status === 'CONVERTED' ? (
                      <>
                        <Link
                          href={getStockRegistrationUrlFromProposal(proposal)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 active:scale-95 text-zinc-950 font-black rounded-xl h-10 transition-all flex items-center justify-center gap-1.5 text-xs shadow-[0_0_15px_rgba(245,158,11,0.25)] cursor-pointer"
                        >
                          <PlusCircle className="w-4 h-4 text-zinc-950 shrink-0" />
                          <span className="truncate">Cadastrar no Estoque</span>
                        </Link>

                        <a
                          href={generateWhatsAppLink(
                            proposal.phone,
                            generateProposalWhatsAppMessage(proposal),
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title="Falar no WhatsApp com o cliente"
                          className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-emerald-400 hover:text-emerald-300 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                        >
                          <WhatsAppIcon className="w-4 h-4 fill-current" />
                        </a>
                      </>
                    ) : (
                      <a
                        href={generateWhatsAppLink(
                          proposal.phone,
                          generateProposalWhatsAppMessage(proposal),
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-[#25D366] hover:bg-[#20BD5A] active:scale-95 text-zinc-950 font-extrabold rounded-xl h-10 transition-all flex items-center justify-center gap-1.5 text-xs shadow-[0_0_15px_rgba(37,211,102,0.2)] cursor-pointer"
                      >
                        <WhatsAppIcon className="w-4 h-4 fill-current" />
                        <span>Falar no WhatsApp</span>
                      </a>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={buttonVariants({
                          variant: 'outline',
                          size: 'sm',
                          className:
                            'h-10 px-2.5 rounded-xl border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 shrink-0 cursor-pointer gap-1',
                        })}
                      >
                        <span className={cn('w-2 h-2 rounded-full', statusConfig.dot)} />
                        <span>Status</span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 bg-zinc-950 border-zinc-800 text-zinc-200"
                      >
                        <DropdownMenuLabel className="text-xs text-zinc-400">
                          Alterar Status
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        {Object.entries(proposalStatusLabels).map(([key]) => {
                          const label = getProposalStatusLabel(key, proposal.type);
                          const config = getStatusConfig(key, proposal.type);
                          const isCurrent = proposal.status === key;

                          return (
                            <DropdownMenuItem
                              key={key}
                              onClick={() => handleStatusChange(proposal, key)}
                              className={cn(
                                'text-xs cursor-pointer flex items-center justify-between',
                                isCurrent && 'bg-zinc-900 text-white font-bold',
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className={cn('w-2 h-2 rounded-full', config.dot)} />
                                <span>{label}</span>
                              </div>
                              {isCurrent && <Check className="w-3 h-3 text-[#c9a44c]" />}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* COMPACT TABLE VIEW */
        <div className="bg-zinc-950/80 rounded-3xl border border-zinc-800/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-900/80 text-xs uppercase font-bold text-zinc-400 border-b border-zinc-800">
                <tr>
                  <th className="py-3.5 px-4 min-w-[130px]">Tipo</th>
                  <th className="py-3.5 px-4 min-w-[160px]">Cliente</th>
                  <th className="py-3.5 px-4 min-w-[140px]">Contato</th>
                  <th className="py-3.5 px-4 min-w-[170px]">Veículo</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Valor</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Status</th>
                  <th className="py-3.5 px-4 text-right min-w-[160px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {filteredProposals.map((proposal) => {
                  const typeInfo = getTypeStyle(proposal.type);
                  const TypeIcon = typeInfo.icon;
                  const statusConfig = getStatusConfig(proposal.status, proposal.type);

                  return (
                    <tr
                      key={proposal.id}
                      onClick={() => setSelectedProposal(proposal)}
                      className="hover:bg-zinc-900/50 transition-colors group cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 w-fit',
                            typeInfo.className,
                          )}
                        >
                          <TypeIcon className="w-3 h-3" />
                          <span>{typeInfo.label}</span>
                        </Badge>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs group-hover:text-[#e3c56c] transition-colors">
                          {proposal.name}
                        </div>
                        <div className="text-[11px] text-zinc-400 flex items-center gap-1 font-mono mt-0.5">
                          <Clock className="w-3 h-3 text-zinc-500" />
                          {formatRelativeDate(proposal.createdAt)}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-xs font-mono text-zinc-200">
                          {formatPhoneForDisplay(proposal.phone) || proposal.phone}
                        </div>
                        {proposal.city && (
                          <div className="text-[10px] text-zinc-400 truncate max-w-[130px]">
                            {proposal.city}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {proposal.motorcycle?.brand ? (
                          <div className="text-xs">
                            <span className="font-bold text-white">
                              {proposal.motorcycle.brand}
                            </span>{' '}
                            <span className="text-zinc-300">{proposal.motorcycle.model}</span>
                            {proposal.motorcycle.year && (
                              <span className="text-zinc-500 font-mono text-[10px] block">
                                Ano {proposal.motorcycle.year}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-zinc-500">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {proposal.motorcycle?.desiredPrice != null ? (
                          <span className="text-[#e3c56c] font-bold font-mono text-xs">
                            {new Intl.NumberFormat('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            }).format(proposal.motorcycle.desiredPrice)}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-500">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 w-fit',
                            statusConfig.badgeClass,
                          )}
                        >
                          <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dot)} />
                          <span>{statusConfig.label}</span>
                        </Badge>
                      </td>

                      <td
                        className="py-3 px-4 text-right space-x-2 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {proposal.status === 'CONVERTED' && (
                          <Link
                            href={getStockRegistrationUrlFromProposal(proposal)}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs h-8 px-2.5 rounded-xl gap-1 shadow-sm transition-colors cursor-pointer"
                            title="Cadastrar moto no estoque"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Estoque</span>
                          </Link>
                        )}

                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className={buttonVariants({
                              variant: 'ghost',
                              size: 'sm',
                              className:
                                'h-8 px-2 text-xs text-zinc-300 hover:text-white cursor-pointer gap-1',
                            })}
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full', statusConfig.dot)} />
                            <span>Status</span>
                            <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="bg-zinc-950 border-zinc-800 text-zinc-200"
                          >
                            {Object.entries(proposalStatusLabels).map(([key]) => {
                              const label = getProposalStatusLabel(key, proposal.type);
                              const config = getStatusConfig(key, proposal.type);
                              return (
                                <DropdownMenuItem
                                  key={key}
                                  onClick={() => handleStatusChange(proposal, key)}
                                  className="text-xs cursor-pointer flex items-center gap-2"
                                >
                                  <span className={cn('w-2 h-2 rounded-full', config.dot)} />
                                  <span>{label}</span>
                                </DropdownMenuItem>
                              );
                            })}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <a
                          href={generateWhatsAppLink(
                            proposal.phone,
                            generateProposalWhatsAppMessage(proposal),
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center bg-[#25D366] hover:bg-[#20BD5A] text-zinc-950 font-bold text-xs h-8 px-3 rounded-xl gap-1.5 transition-colors cursor-pointer"
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                          <span>Falar</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. Contact Details Modal / Drawer */}
      <ProposalDetail
        proposal={selectedProposal}
        open={!!selectedProposal}
        onOpenChange={(open) => !open && setSelectedProposal(null)}
        onStatusChange={handleStatusChange}
        siteName={storeName}
      />

      {/* 6. Manual Proposal Modal */}
      <ManualProposalModal
        open={isManualModalOpen}
        onOpenChange={setIsManualModalOpen}
        onSuccess={() => router.refresh()}
        siteName={storeName}
      />
    </div>
  );
}
