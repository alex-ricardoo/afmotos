'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  LayoutGrid,
  List,
  Filter,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  Clock,
  CheckCircle2,
  Bike,
  Tag,
  KeyRound,
  FileText,
  User,
  ExternalLink,
  ChevronDown,
  X,
  Sparkles,
} from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/whatsapp-icon';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { leadTypeLabels, leadStatusLabels } from '@/lib/utils/translations';
import { updateLeadStatus } from '@/lib/actions/leads';
import { generateWhatsAppLink } from '@/lib/utils/whatsapp';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface LeadContact {
  id: string;
  type:
    | 'MOTORCYCLE_INTEREST'
    | 'SELL_MOTORCYCLE'
    | 'CONSIGNMENT'
    | 'RENTAL'
    | 'MOTORCYCLE_REQUEST'
    | 'GENERAL_CONTACT'
    | string;
  name: string;
  phone: string;
  email?: string | null;
  message?: string | null;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST' | 'CLOSED' | string;
  metadata?: any;
  created_at: string;
}

interface Props {
  initialData: LeadContact[];
}

export function AdminPropostasContacts({ initialData }: Props) {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatus, setActiveStatus] = useState<string>('ALL');
  const [activeType, setActiveType] = useState<string>('ALL');
  const [selectedContact, setSelectedContact] = useState<LeadContact | null>(null);

  // Filter contacts locally
  const filteredContacts = initialData.filter((item) => {
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
      (item.message && item.message.toLowerCase().includes(queryLower));

    return matchesStatus && matchesType && matchesSearch;
  });

  // Calculate statistics
  const totalContacts = initialData.length;
  const newCount = initialData.filter((i) => i.status === 'NEW').length;
  const inProgressCount = initialData.filter(
    (i) => i.status === 'CONTACTED' || i.status === 'QUALIFIED',
  ).length;
  const convertedCount = initialData.filter((i) => i.status === 'CONVERTED').length;

  const handleStatusChange = async (id: string, newStatus: string) => {
    toast.promise(updateLeadStatus(id, newStatus), {
      loading: 'Atualizando status do contato...',
      success: (res) => {
        if (res.error) throw new Error(res.error);
        router.refresh();
        return 'Status atualizado com sucesso!';
      },
      error: (err) => err.message || 'Erro ao alterar status',
    });
  };

  const getTypeBadgeDetails = (type: string) => {
    switch (type) {
      case 'MOTORCYCLE_INTEREST':
        return {
          label: 'Interesse em Moto',
          icon: Bike,
          className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        };
      case 'SELL_MOTORCYCLE':
        return {
          label: 'Venda de Moto',
          icon: Tag,
          className: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        };
      case 'CONSIGNMENT':
        return {
          label: 'Anúncio / Consignação',
          icon: KeyRound,
          className: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        };
      case 'RENTAL':
        return {
          label: 'Aluguel de Moto',
          icon: Calendar,
          className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        };
      default:
        return {
          label: 'Contato Geral',
          icon: MessageSquare,
          className: 'bg-zinc-800 text-zinc-300 border-zinc-700',
        };
    }
  };

  const getStatusBadgeDetails = (status: string) => {
    switch (status) {
      case 'NEW':
        return {
          label: 'Novo (Não lido)',
          className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 animate-pulse',
        };
      case 'CONTACTED':
        return {
          label: 'Em Atendimento',
          className: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
        };
      case 'QUALIFIED':
        return {
          label: 'Proposta Enviada',
          className: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
        };
      case 'CONVERTED':
        return {
          label: 'Negócio Fechado',
          className: 'bg-[#c9a44c]/20 text-[#e3c56c] border-[#c9a44c]/40 font-bold',
        };
      case 'CLOSED':
      case 'LOST':
        return {
          label: 'Encerrado',
          className: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        };
      default:
        return {
          label: status,
          className: 'bg-zinc-800 text-zinc-400 border-zinc-700',
        };
    }
  };

  const getWhatsAppMessage = (contact: LeadContact) => {
    const typeLabel = leadTypeLabels[contact.type as keyof typeof leadTypeLabels] || 'seu contato';
    return `Olá ${contact.name}! Sou da equipe AF Motos. Vi sua mensagem referente a ${typeLabel.toLowerCase()}. Como podemos te ajudar?`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-heading">
            Contatos & Propostas de Clientes
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Acompanhe mensagens de interessados, propostas de troca e solicitações de orçamento.
          </p>
        </div>
      </div>

      {/* 2. Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card p-3.5 rounded-xl border border-border/60 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-muted-foreground block uppercase">
              Total de Contatos
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
              Novos (Pendente)
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
              Negócios Fechados
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
              placeholder="Buscar por nome do cliente, telefone ou mensagem..."
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
              <option value="MOTORCYCLE_INTEREST">Interesse em Moto</option>
              <option value="SELL_MOTORCYCLE">Venda de Moto</option>
              <option value="CONSIGNMENT">Anúncio / Consignação</option>
              <option value="RENTAL">Aluguel de Moto</option>
              <option value="GENERAL_CONTACT">Contato Geral</option>
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
            { id: 'NEW', label: 'Novos (Não Lidos)' },
            { id: 'CONTACTED', label: 'Em Atendimento' },
            { id: 'CONVERTED', label: 'Negócios Fechados' },
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
      {filteredContacts.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-secondary mx-auto flex items-center justify-center text-muted-foreground">
            <MessageSquare className="w-8 h-8 text-[#c9a44c]" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h3 className="text-lg font-bold text-foreground">Nenhum contato encontrado</h3>
            <p className="text-xs text-muted-foreground">
              Não encontramos nenhuma mensagem ou proposta correspondente aos filtros atuais.
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredContacts.map((contact) => {
            const typeInfo = getTypeBadgeDetails(contact.type);
            const statusInfo = getStatusBadgeDetails(contact.status);
            const TypeIcon = typeInfo.icon;
            const whatsappLink = generateWhatsAppLink(
              contact.phone,
              getWhatsAppMessage(contact),
            );

            return (
              <div
                key={contact.id}
                className="bg-card rounded-2xl border border-border/80 hover:border-[#c9a44c]/50 p-5 shadow-xs hover:shadow-[0_0_20px_rgba(201,164,76,0.12)] transition-all flex flex-col justify-between space-y-4"
              >
                {/* Header: Type Badge & Status */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 flex items-center gap-1.5',
                        typeInfo.className,
                      )}
                    >
                      <TypeIcon className="w-3.5 h-3.5" />
                      <span>{typeInfo.label}</span>
                    </Badge>

                    <Badge
                      variant="outline"
                      className={cn('text-[10px] font-bold px-2 py-0.5', statusInfo.className)}
                    >
                      {statusInfo.label}
                    </Badge>
                  </div>

                  {/* Client Info */}
                  <div>
                    <h3 className="font-extrabold text-lg text-foreground flex items-center gap-2">
                      <User className="w-4 h-4 text-[#c9a44c]" />
                      <span>{contact.name}</span>
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-[#c9a44c]" />
                        <span className="font-mono">{contact.phone}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {format(new Date(contact.created_at), "dd/MM 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Message Quote Box */}
                  {contact.message && (
                    <div className="bg-secondary/50 p-3 rounded-xl border border-border/60 text-xs text-muted-foreground leading-relaxed line-clamp-3 italic">
                      &quot;{contact.message}&quot;
                    </div>
                  )}

                  {/* Metadata Chips if present */}
                  {contact.metadata && Object.keys(contact.metadata).length > 0 && (
                    <div className="bg-background/80 p-2.5 rounded-xl border border-border/40 text-[11px] text-foreground space-y-1">
                      {contact.metadata.brand && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Moto:</span>
                          <span className="font-bold">
                            {contact.metadata.brand} {contact.metadata.model}
                          </span>
                        </div>
                      )}
                      {contact.metadata.year_model && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ano:</span>
                          <span className="font-bold">{contact.metadata.year_model}</span>
                        </div>
                      )}
                      {contact.metadata.price && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Valor sugerido:</span>
                          <span className="font-bold text-[#e3c56c]">
                            R$ {Number(contact.metadata.price).toLocaleString('pt-BR')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-border/60 flex items-center gap-2">
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ size: 'sm' }),
                      'flex-1 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-xl h-10 shadow-[0_0_12px_rgba(37,211,102,0.2)] transition-all flex items-center justify-center gap-1.5 text-xs',
                    )}
                  >
                    <WhatsAppIcon className="w-4 h-4 fill-current" />
                    <span>Falar no WhatsApp</span>
                  </a>

                  {/* Status Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-10 px-2.5 rounded-xl border-border/60 text-xs font-semibold text-muted-foreground hover:text-foreground"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      }
                    />
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuGroup>
                        <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleStatusChange(contact.id, 'NEW')}>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                        <span>Novo (Não lido)</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(contact.id, 'CONTACTED')}
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-400 mr-2" />
                        <span>Em Atendimento</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(contact.id, 'CONVERTED')}
                      >
                        <span className="w-2 h-2 rounded-full bg-[#c9a44c] mr-2" />
                        <span>Negócio Fechado</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleStatusChange(contact.id, 'CLOSED')}>
                        <span className="w-2 h-2 rounded-full bg-zinc-500 mr-2" />
                        <span>Encerrar</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* View Details Modal Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedContact(contact)}
                    className="h-10 w-10 p-0 rounded-xl border border-border/60 text-muted-foreground hover:bg-secondary hover:text-foreground shrink-0"
                    title="Ver detalhes completos"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
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
                  <th className="py-3.5 px-4">Tipo</th>
                  <th className="py-3.5 px-4">Cliente</th>
                  <th className="py-3.5 px-4">Telefone</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Data</th>
                  <th className="py-3.5 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredContacts.map((contact) => {
                  const typeInfo = getTypeBadgeDetails(contact.type);
                  const statusInfo = getStatusBadgeDetails(contact.status);
                  const whatsappLink = generateWhatsAppLink(
                    contact.phone,
                    getWhatsAppMessage(contact),
                  );

                  return (
                    <tr key={contact.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-bold uppercase tracking-wider px-2 py-0.5',
                            typeInfo.className,
                          )}
                        >
                          {typeInfo.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground">{contact.name}</td>
                      <td className="py-3 px-4 text-xs font-mono text-muted-foreground">
                        {contact.phone}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-bold px-2 py-0.5', statusInfo.className)}
                        >
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {format(new Date(contact.created_at), 'dd/MM/yyyy HH:mm', {
                          locale: ptBR,
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ size: 'sm' }),
                            'bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold text-xs h-8 px-3 rounded-lg gap-1.5',
                          )}
                        >
                          <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                          <span>WhatsApp</span>
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

      {/* Contact Details Full Dialog */}
      <Dialog open={!!selectedContact} onOpenChange={(open) => !open && setSelectedContact(null)}>
        {selectedContact && (
          <DialogContent className="max-w-md bg-[#151515] border-[#c9a44c]/30 text-[#f4f4f2]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white flex items-center justify-between">
                <span>{selectedContact.name}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    'text-[10px] uppercase font-bold',
                    getTypeBadgeDetails(selectedContact.type).className,
                  )}
                >
                  {getTypeBadgeDetails(selectedContact.type).label}
                </Badge>
              </DialogTitle>
              <DialogDescription className="text-xs text-[#a6a6a1]">
                Recebido em{' '}
                {format(new Date(selectedContact.created_at), "dd/MM/yyyy 'às' HH:mm", {
                  locale: ptBR,
                })}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="space-y-1 bg-[#0d0d0d] p-3 rounded-xl border border-[#c9a44c]/20 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#a6a6a1]">Telefone:</span>
                  <span className="font-mono font-bold text-white">{selectedContact.phone}</span>
                </div>
                {selectedContact.email && (
                  <div className="flex justify-between">
                    <span className="text-[#a6a6a1]">E-mail:</span>
                    <span className="font-bold text-white">{selectedContact.email}</span>
                  </div>
                )}
              </div>

              {selectedContact.message && (
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#e3c56c]">
                    Mensagem Enviada
                  </span>
                  <div className="bg-[#0d0d0d] p-3.5 rounded-xl border border-[#c9a44c]/20 text-xs text-white leading-relaxed">
                    {selectedContact.message}
                  </div>
                </div>
              )}

              {selectedContact.metadata && Object.keys(selectedContact.metadata).length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#e3c56c]">
                    Dados Adicionais
                  </span>
                  <div className="bg-[#0d0d0d] p-3.5 rounded-xl border border-[#c9a44c]/20 text-xs space-y-1.5">
                    {Object.entries(selectedContact.metadata).map(([key, val]) => (
                      <div key={key} className="flex justify-between border-b border-white/5 pb-1">
                        <span className="text-[#a6a6a1] capitalize">
                          {key.replace('_', ' ')}:
                        </span>
                        <span className="font-bold text-white">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center gap-2">
              <a
                href={generateWhatsAppLink(
                  selectedContact.phone,
                  getWhatsAppMessage(selectedContact),
                )}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'flex-1 bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold rounded-xl h-12 shadow-[0_0_15px_rgba(37,211,102,0.2)] flex items-center justify-center gap-2',
                )}
              >
                <WhatsAppIcon className="w-5 h-5 fill-current" />
                <span>Conversar no WhatsApp</span>
              </a>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
