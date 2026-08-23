'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
  User,
  X,
  Sparkles,
  ChevronDown,
  MapPin,
  Image as ImageIcon
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { updateLeadStatus } from '@/lib/actions/leads';
import { ProposalViewModel } from '@/lib/admin/proposal-view-model';
import { proposalTypeLabels, proposalStatusLabels, proposalStatusStyles } from '@/lib/admin/proposal-labels';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
import { generateWhatsAppLink, generateProposalWhatsAppMessage } from '@/lib/utils/whatsapp';
import { ProposalDetail } from './proposal-detail-drawer';

interface Props {
  initialData: ProposalViewModel[];
}

export function AdminPropostasContacts({ initialData }: Props) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [activeType, setActiveType] = useState<string>('ALL');
  const [selectedProposal, setSelectedProposal] = useState<ProposalViewModel | null>(null);

  // Filter local data
  const filteredProposals = initialData.filter((item) => {
    const matchesStatus =
      activeStatus === 'ALL'
        ? true
        : activeStatus === 'NEW'
        ? item.status === 'NEW'
        : activeStatus === 'CONTACTED'
        ? item.status === 'CONTACTED' || item.status === 'QUALIFIED'
        : activeStatus === 'CONVERTED'
        ? item.status === 'CONVERTED'
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
      (item.motorcycle?.model && item.motorcycle.model.toLowerCase().includes(queryLower));

    return matchesStatus && matchesType && matchesSearch;
  });

  // Calculate statistics
  const totalContacts = initialData.length;
  const newCount = initialData.filter((i) => i.status === 'NEW').length;
  const inProgressCount = initialData.filter(
    (i) => i.status === 'CONTACTED' || i.status === 'QUALIFIED',
  ).length;
  const convertedCount = initialData.filter((i) => i.status === 'CONVERTED').length;

  const handleStatusChange = async (proposal: ProposalViewModel, newStatus: string) => {
    toast.promise(updateLeadStatus(proposal.id, newStatus, proposal.source, proposal.sourceId), {
      loading: 'Atualizando status...',
      success: () => {
        router.refresh();
        return 'Status atualizado com sucesso!';
      },
      error: 'Erro ao alterar status',
    });
  };

  const getTypeStyle = (type: string) => {
    switch (type) {
      case 'MOTORCYCLE_INTEREST':
        return { icon: Bike, className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' };
      case 'SELL_MOTORCYCLE':
        return { icon: Tag, className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' };
      case 'CONSIGNMENT':
        return { icon: KeyRound, className: 'bg-purple-500/15 text-purple-400 border-purple-500/30' };
      case 'RENTAL':
        return { icon: Calendar, className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' };
      default:
        return { icon: MessageSquare, className: 'bg-zinc-800 text-zinc-300 border-zinc-700' };
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse';
      case 'CONTACTED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'QUALIFIED':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'CONVERTED':
        return 'bg-[#c9a44c]/20 text-[#e3c56c] border-[#c9a44c]/40 font-bold';
      case 'CLOSED':
      case 'LOST':
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
      default:
        return 'bg-zinc-800 text-zinc-400 border-zinc-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Propostas e contatos
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Acompanhe quem entrou em contato e responda rapidamente.
          </p>
        </div>
      </div>

      {/* 2. Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card p-3.5 rounded-xl border border-border/60 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground block uppercase">
              Todos os contatos
            </span>
            <span className="text-xl font-bold text-foreground tabular-nums">{totalContacts}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-foreground">
            <MessageSquare className="w-5 h-5 text-[#c9a44c]" />
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-emerald-500/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-emerald-400 block uppercase">
              Novos
            </span>
            <span className="text-xl font-bold text-emerald-400 tabular-nums">{newCount}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-blue-500/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-blue-400 block uppercase">
              Em Atendimento
            </span>
            <span className="text-xl font-bold text-blue-400 tabular-nums">
              {inProgressCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card p-3.5 rounded-xl border border-[#c9a44c]/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-[#e3c56c] block uppercase">
              Convertidos
            </span>
            <span className="text-xl font-bold text-[#e3c56c] tabular-nums">
              {convertedCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-[#c9a44c]/10 flex items-center justify-center text-[#e3c56c]">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Toolbar (Search & Filter Tabs) */}
      <div className="bg-card p-4 rounded-2xl border border-border/80 shadow-xs space-y-4 overflow-hidden">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="text"
              placeholder="Buscar por nome, telefone, modelo ou mensagem..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-9 h-11 bg-background/50 border-border/60 focus:border-[#c9a44c] rounded-xl text-sm w-full"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
              className="h-10 px-3 rounded-xl bg-background border border-border/60 text-xs font-semibold text-foreground outline-none focus:border-[#c9a44c] w-full sm:w-auto shrink-0"
            >
              <option value="ALL">Todos os Tipos</option>
              {Object.entries(proposalTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>

            <div className="flex items-center justify-center gap-1 bg-background/60 p-1 rounded-xl border border-border/60 shrink-0">
              <Button
                type="button"
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={cn(
                  'flex-1 sm:flex-initial h-9 px-3.5 rounded-lg text-xs font-semibold gap-1.5 transition-all',
                  viewMode === 'grid' &&
                    'bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/40',
                )}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Cards</span>
              </Button>
              <Button
                type="button"
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className={cn(
                  'flex-1 sm:flex-initial h-9 px-3.5 rounded-lg text-xs font-semibold gap-1.5 transition-all',
                  viewMode === 'table' &&
                    'bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/40',
                )}
              >
                <List className="w-4 h-4" />
                <span>Tabela</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          {[
            { id: 'ALL', label: 'Todos os Contatos' },
            { id: 'NEW', label: 'Novos contatos' },
            { id: 'CONTACTED', label: 'Em atendimento' },
            { id: 'QUALIFIED', label: 'Qualificados' },
            { id: 'CONVERTED', label: 'Convertidos' },
            { id: 'CLOSED', label: 'Encerrados' },
          ].map((tab) => {
            const isActive = activeStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStatus(tab.id)}
                className={cn(
                  'px-3.5 py-1.5 rounded-lg font-bold whitespace-nowrap transition-all border',
                  isActive
                    ? 'bg-[#c9a44c] text-black border-[#c9a44c] shadow-xs'
                    : 'bg-background/40 text-muted-foreground border-border/40 hover:text-foreground hover:bg-secondary',
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Main Contact Showcase */}
      {filteredProposals.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
            <MessageSquare className="w-8 h-8 text-[#c9a44c]" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-foreground">Nenhum contato encontrado com esses filtros.</h3>
            <p className="text-xs text-muted-foreground">
              Ainda não há contatos por aqui. Quando alguém enviar uma solicitação, ela aparecerá nesta tela.
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
              className="rounded-xl font-semibold border-border"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* CARDS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProposals.map((proposal) => {
            const typeInfo = getTypeStyle(proposal.type);
            const TypeIcon = typeInfo.icon;
            
            return (
              <div
                key={proposal.id}
                className="group flex flex-col bg-card rounded-2xl border border-border/80 hover:border-[#c9a44c]/50 shadow-xs hover:shadow-[0_0_20px_rgba(201,164,76,0.12)] transition-all overflow-hidden cursor-pointer"
                onClick={(e) => {
                  // Previne abrir se clicar em botões/links
                  if ((e.target as HTMLElement).closest('button, a, select')) return;
                  setSelectedProposal(proposal);
                }}
              >
                {/* Imagem de Capa se houver */}
                {proposal.images && proposal.images.length > 0 && (
                  <div className="relative h-36 w-full bg-secondary/50 overflow-hidden border-b border-border/40">
                    <img 
                      src={proposal.images[0].url} 
                      alt="Foto enviada" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                    <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1.5 text-[10px] text-white font-bold border border-white/10">
                      <ImageIcon className="w-3 h-3" />
                      {proposal.images.length}
                    </div>
                  </div>
                )}
                
                <div className="p-4 flex flex-col flex-1 gap-4">
                  {/* Cabeçalho do Card */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 flex items-center gap-1.5 border-transparent bg-transparent pl-0',
                          typeInfo.className.split(' ')[1] // Pega só a cor do texto
                        )}
                      >
                        <TypeIcon className="w-3.5 h-3.5" />
                        <span>{proposal.typeLabel}</span>
                      </Badge>
                      
                      <Badge
                        variant="outline"
                        className={cn('text-[10px] font-bold px-2 py-0.5', getStatusStyle(proposal.status))}
                      >
                        {proposal.statusLabel}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(proposal.createdAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>

                    {/* Dados do Cliente */}
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-base text-foreground flex items-center gap-2 leading-tight">
                        <span>{proposal.name}</span>
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#c9a44c]" />
                          <span className="font-mono">{proposal.phone}</span>
                        </span>
                        {proposal.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate max-w-[120px]">{proposal.city}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Dados da Moto */}
                  {proposal.motorcycle?.brand && (
                    <div className="bg-secondary/40 p-2.5 rounded-xl border border-border/40 text-xs text-foreground space-y-1.5 mt-auto">
                      <div className="font-bold flex justify-between">
                        <span className="text-muted-foreground">Moto</span>
                        <span className="text-right truncate ml-2">
                          {proposal.motorcycle.brand} {proposal.motorcycle.model}
                        </span>
                      </div>
                      {proposal.motorcycle.year && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ano</span>
                          <span>{proposal.motorcycle.year}</span>
                        </div>
                      )}
                      {proposal.motorcycle.desiredPrice && (
                        <div className="flex justify-between font-bold">
                          <span className="text-muted-foreground font-normal">Valor desejado</span>
                          <span className="text-[#c9a44c]">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(proposal.motorcycle.desiredPrice)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mensagem Truncada */}
                  {!proposal.motorcycle?.brand && proposal.message && (
                    <div className="bg-secondary/30 p-2.5 rounded-xl border border-border/40 text-xs text-muted-foreground leading-relaxed line-clamp-3 italic mt-auto">
                      &quot;{proposal.message}&quot;
                    </div>
                  )}

                  {/* Botões Base */}
                  <div className="pt-2 border-t border-border/60 flex items-center gap-2">
                    <a
                      href={generateWhatsAppLink(proposal.phone, generateProposalWhatsAppMessage(proposal))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex-1 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-xl h-9 transition-all flex items-center justify-center gap-1.5 text-[11px] shadow-[0_0_10px_rgba(37,211,102,0.15)]"
                      )}
                    >
                      <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                      <span>Falar no WhatsApp</span>
                    </a>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={buttonVariants({
                          variant: 'outline',
                          size: 'sm',
                          className:
                            'h-9 px-2 rounded-xl border-border/60 text-xs font-semibold text-muted-foreground hover:text-foreground shrink-0 cursor-pointer',
                        })}
                      >
                        Status <ChevronDown className="w-3.5 h-3.5 ml-1" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuLabel className="text-xs">Alterar Status</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {Object.entries(proposalStatusLabels).map(([key, label]) => (
                          <DropdownMenuItem key={key} onClick={() => handleStatusChange(proposal, key)} className="text-xs">
                            <span className={cn(
                              "w-2 h-2 rounded-full mr-2", 
                              getStatusStyle(key).split(' ')[0] // Extrai a cor de background baseada na função
                            )} />
                            <span>{label}</span>
                          </DropdownMenuItem>
                        ))}
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
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/60 text-xs uppercase font-bold text-muted-foreground border-b border-border/60">
                <tr>
                  <th className="py-3.5 px-4 min-w-[120px]">Tipo</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Cliente</th>
                  <th className="py-3.5 px-4 min-w-[130px]">Contato</th>
                  <th className="py-3.5 px-4 min-w-[150px]">Moto Ref.</th>
                  <th className="py-3.5 px-4 min-w-[120px]">Status</th>
                  <th className="py-3.5 px-4 text-right min-w-[140px]">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredProposals.map((proposal) => {
                  const typeInfo = getTypeStyle(proposal.type);
                  const TypeIcon = typeInfo.icon;
                  
                  return (
                    <tr key={proposal.id} className="hover:bg-secondary/30 transition-colors group cursor-pointer" onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button, a, select')) return;
                      setSelectedProposal(proposal);
                    }}>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5', typeInfo.className)}>
                          {proposal.typeLabel}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-foreground truncate max-w-[150px]">{proposal.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {format(new Date(proposal.createdAt), 'dd/MM/yy', { locale: ptBR })}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-xs font-mono text-foreground">{proposal.phone}</div>
                        {proposal.city && <div className="text-[10px] text-muted-foreground truncate max-w-[120px]">{proposal.city}</div>}
                      </td>
                      <td className="py-3 px-4">
                        {proposal.motorcycle?.brand ? (
                          <div className="text-xs">
                            <span className="font-bold">{proposal.motorcycle.brand}</span> {proposal.motorcycle.model}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={cn('text-[10px] font-bold px-2 py-0.5', getStatusStyle(proposal.status))}>
                          {proposal.statusLabel}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className={buttonVariants({
                              variant: 'ghost',
                              size: 'sm',
                              className: 'h-8 px-2 text-xs cursor-pointer',
                            })}
                          >
                            Status <ChevronDown className="w-3 h-3 ml-1 opacity-50" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                             {Object.entries(proposalStatusLabels).map(([key, label]) => (
                               <DropdownMenuItem key={key} onClick={() => handleStatusChange(proposal, key)} className="text-xs">
                                 {label}
                               </DropdownMenuItem>
                             ))}
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <a
                          href={generateWhatsAppLink(proposal.phone, generateProposalWhatsAppMessage(proposal))}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "inline-flex items-center justify-center bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-xs h-8 px-3 rounded-lg gap-1.5 transition-colors"
                          )}
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

      {/* Contact Details Drawer / Modal */}
      <ProposalDetail 
        proposal={selectedProposal} 
        open={!!selectedProposal} 
        onOpenChange={(open) => !open && setSelectedProposal(null)} 
        typeBadgeClass={selectedProposal ? getTypeStyle(selectedProposal.type).className : ''}
      />
    </div>
  );
}
