'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Edit2,
  X,
  Sparkles,
  MessageCircle,
  CreditCard,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Power,
  Coins,
  Search,
  LayoutGrid,
  List,
  Check,
  TrendingDown,
  Info,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MercadoPagoBrandIcon } from '@/components/customer/payment-brand-icons';

export interface AdminOfferItem {
  id: string;
  slug: string;
  name: string;
  shortLabel?: string | null;
  description?: string | null;
  packageType: string;
  creditsQuantity: number;
  priceCents: number;
  priceFormatted: string;
  unitPriceCents: number;
  unitPriceFormatted: string;
  referenceIndividualPriceCents: number;
  discountPercent: number | null;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
  contactOnly: boolean;
  requiresWhatsapp: boolean;
  validityDays?: number | null;
  benefits?: string[];
  createdAt: string;
  updatedAt: string;
}

const BENEFIT_PRESETS = [
  'Laudos veiculares completos',
  'Liberação imediata em 1 clique',
  'Sem taxa de cartão a cada placa',
  'Créditos sem data de expiração',
  'Prioridade no processamento',
  'Suporte prioritário via WhatsApp',
  'Faturamento PJ e emissão de NF',
];

export function CreditPackageOffersManager() {
  const [offers, setOffers] = useState<AdminOfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search, Filters & View Mode
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<
    'all' | 'active' | 'inactive' | 'featured' | 'mercadopago' | 'whatsapp'
  >('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<AdminOfferItem | null>(null);
  const [modalTab, setModalTab] = useState<'details' | 'pricing' | 'channel' | 'benefits'>(
    'details',
  );

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    shortLabel: '',
    description: '',
    packageType: 'standard',
    creditsQuantity: 10,
    priceReais: '299,00',
    referencePriceReais: '39,90',
    displayOrder: 1,
    isActive: true,
    isFeatured: false,
    contactOnly: false,
    requiresWhatsapp: false,
    validityDays: '',
    benefitsText: '',
  });

  const loadOffers = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/admin/credit-package-offers');
      const data = await res.json();
      if (res.ok && data.success) {
        setOffers(data.offers || []);
      } else {
        setErrorMsg(data.error || 'Falha ao carregar ofertas.');
      }
    } catch {
      setErrorMsg('Erro de conexão ao buscar ofertas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const res = await fetch('/api/admin/credit-package-offers');
        const data = await res.json();
        if (!active) return;
        if (res.ok && data.success) {
          setOffers(data.offers || []);
        } else {
          setErrorMsg(data.error || 'Falha ao carregar ofertas.');
        }
      } catch {
        if (active) setErrorMsg('Erro de conexão ao buscar ofertas.');
      } finally {
        if (active) setLoading(false);
      }
    }

    void init();

    return () => {
      active = false;
    };
  }, []);

  const handleOpenCreateModal = () => {
    setEditingOffer(null);
    setModalTab('details');
    setFormData({
      name: '',
      slug: '',
      shortLabel: '',
      description: '',
      packageType: 'standard',
      creditsQuantity: 10,
      priceReais: '299,00',
      referencePriceReais: '39,90',
      displayOrder: offers.length + 1,
      isActive: true,
      isFeatured: false,
      contactOnly: false,
      requiresWhatsapp: false,
      validityDays: '',
      benefitsText:
        'Consultas veiculares completas\nLiberação imediata no saldo\nCréditos sem data de expiração',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (offer: AdminOfferItem) => {
    setEditingOffer(offer);
    setModalTab('details');
    setFormData({
      name: offer.name,
      slug: offer.slug,
      shortLabel: offer.shortLabel || '',
      description: offer.description || '',
      packageType: offer.packageType || 'standard',
      creditsQuantity: offer.creditsQuantity,
      priceReais: (offer.priceCents / 100).toFixed(2).replace('.', ','),
      referencePriceReais: ((offer.referenceIndividualPriceCents || 3990) / 100)
        .toFixed(2)
        .replace('.', ','),
      displayOrder: offer.displayOrder,
      isActive: offer.isActive,
      isFeatured: offer.isFeatured,
      contactOnly: offer.contactOnly,
      requiresWhatsapp: offer.requiresWhatsapp,
      validityDays: offer.validityDays ? String(offer.validityDays) : '',
      benefitsText: (offer.benefits || []).join('\n'),
    });
    setIsModalOpen(true);
  };

  const parseReaisToCents = (valStr: string): number => {
    const clean = valStr.replace(/[^\d,]/g, '').replace(',', '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : Math.round(num * 100);
  };

  // Preview dinâmico de cálculo comercial no formulário
  const previewCalculation = useMemo(() => {
    const priceCents = formData.contactOnly ? 0 : parseReaisToCents(formData.priceReais);
    const refCents = parseReaisToCents(formData.referencePriceReais) || 3990;
    const qty = Number(formData.creditsQuantity) || 1;

    const unitPriceCents = qty > 0 ? Math.round(priceCents / qty) : 0;
    const totalRefCents = refCents * qty;
    let discount = 0;

    if (totalRefCents > priceCents && priceCents > 0) {
      discount = Math.round(((totalRefCents - priceCents) / totalRefCents) * 10000) / 100;
    }

    return {
      unitPriceCents,
      unitPriceFormatted: (unitPriceCents / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      discountPercent: discount > 0 ? `${discount}% OFF` : 'Sem desconto',
      discountNum: discount,
      savingsFormatted: Math.max(0, (totalRefCents - priceCents) / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      isBelowFloor: unitPriceCents < 3000 && !formData.contactOnly,
    };
  }, [formData]);

  // Estatísticas Rápidas Executivas
  const stats = useMemo(() => {
    const total = offers.length;
    const active = offers.filter((o) => o.isActive).length;
    const featured = offers.filter((o) => o.isFeatured).length;
    const mpCount = offers.filter((o) => !o.contactOnly).length;
    const waCount = offers.filter((o) => o.contactOnly).length;

    return { total, active, featured, mpCount, waCount };
  }, [offers]);

  // Filtragem e Busca
  const filteredOffers = useMemo(() => {
    return offers
      .filter((off) => {
        const matchesSearch =
          searchTerm.trim() === '' ||
          off.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          off.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (off.shortLabel && off.shortLabel.toLowerCase().includes(searchTerm.toLowerCase()));

        if (!matchesSearch) return false;

        if (activeFilter === 'active') return off.isActive;
        if (activeFilter === 'inactive') return !off.isActive;
        if (activeFilter === 'featured') return off.isFeatured;
        if (activeFilter === 'mercadopago') return !off.contactOnly;
        if (activeFilter === 'whatsapp') return off.contactOnly;

        return true;
      })
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [offers, searchTerm, activeFilter]);

  const handleToggleActive = async (offer: AdminOfferItem) => {
    try {
      setActionLoading(offer.id);
      const res = await fetch(`/api/admin/credit-package-offers/${offer.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !offer.isActive }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Oferta "${offer.name}" ${!offer.isActive ? 'ativada' : 'desativada'}.`);
        await loadOffers();
      } else {
        setErrorMsg(data.error || 'Falha ao alterar status da oferta.');
      }
    } catch {
      setErrorMsg('Erro de comunicação ao alterar status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddBenefitPreset = (preset: string) => {
    const current = formData.benefitsText
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);
    if (!current.includes(preset)) {
      setFormData((prev) => ({
        ...prev,
        benefitsText: current.length > 0 ? `${prev.benefitsText}\n${preset}` : preset,
      }));
    }
  };

  const handleSaveOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setActionLoading('saving');

    const priceCents = formData.contactOnly ? 0 : parseReaisToCents(formData.priceReais);
    const refCents = parseReaisToCents(formData.referencePriceReais) || 3990;
    const benefits = formData.benefitsText
      .split('\n')
      .map((b) => b.trim())
      .filter(Boolean);

    const payload = {
      name: formData.name.trim(),
      slug: formData.slug.trim().toLowerCase(),
      short_label: formData.shortLabel.trim() || null,
      description: formData.description.trim() || null,
      package_type: formData.packageType,
      credits_quantity: Number(formData.creditsQuantity),
      price_cents: priceCents,
      reference_individual_price_cents: refCents,
      display_order: Number(formData.displayOrder) || 0,
      is_active: formData.isActive,
      is_featured: formData.isFeatured,
      contact_only: formData.contactOnly,
      requires_whatsapp: formData.contactOnly ? true : formData.requiresWhatsapp,
      validity_days: formData.validityDays ? Number(formData.validityDays) : null,
      benefits,
    };

    try {
      const url = editingOffer
        ? `/api/admin/credit-package-offers/${editingOffer.id}`
        : '/api/admin/credit-package-offers';
      const method = editingOffer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(
          editingOffer
            ? `Pacote "${formData.name}" atualizado com sucesso!`
            : `Pacote "${formData.name}" criado com sucesso!`,
        );
        setIsModalOpen(false);
        await loadOffers();
      } else {
        setErrorMsg(data.error || 'Falha ao salvar oferta comercial.');
      }
    } catch {
      setErrorMsg('Erro de comunicação ao salvar oferta.');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ------------------------------------------------------------- */}
      {/* 1. EXECUTIVE HEADER & ACTIONS                                 */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-2xl relative overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#c9a44c]/10 blur-3xl pointer-events-none rounded-full" />

        <div className="space-y-2 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#c9a44c]/15 text-[#e3c56c] border border-[#c9a44c]/30">
            <Coins className="w-3.5 h-3.5 text-[#e3c56c]" />
            <span>Motor de Precificação B2B • Consultas Veiculares</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Catálogo Comercial de Pacotes
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Configure pacotes de créditos com precificação dinâmica, integração direta com Mercado
            Pago Checkout Pro ou direcionamento para atendimento comercial via WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 shrink-0 self-start md:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={loadOffers}
            disabled={loading}
            className="border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs h-10 px-4 rounded-xl cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreateModal}
            className="bg-[#c9a44c] hover:bg-[#b48d3c] text-zinc-950 font-black text-xs sm:text-sm h-10 px-5 rounded-xl shadow-lg shadow-amber-950/40 cursor-pointer transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nova Oferta de Pacote
          </Button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. EXECUTIVE METRICS KPI BAR                                  */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Pacotes */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Total de Pacotes</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white">{stats.total}</span>
            <span className="text-[11px] text-zinc-500 font-medium">cadastrados</span>
          </div>
        </div>

        {/* Ativos na Vitrine */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Ativos na Vitrine</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400">{stats.active}</span>
            <span className="text-[11px] text-zinc-500 font-medium">visíveis aos clientes</span>
          </div>
        </div>

        {/* Destaque Visual */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Pacotes em Destaque</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-[#e3c56c]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-[#e3c56c]">{stats.featured}</span>
            <span className="text-[11px] text-zinc-500 font-medium">com selo Mais Popular</span>
          </div>
        </div>

        {/* Canais de Venda */}
        <div className="p-4 sm:p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Canais de Checkout</span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <CreditCard className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="inline-flex items-center gap-1 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              {stats.mpCount} MP Pro
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              {stats.waCount} WhatsApp
            </span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. ALERTS / TOASTS                                            */}
      {/* ------------------------------------------------------------- */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-400 hover:text-rose-200 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-400 hover:text-emerald-200 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. SEARCH, FILTERS & VIEW MODE CONTROLS                      */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
        {/* Barra de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, slug ou categoria..."
            className="w-full pl-10 pr-8 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder:text-zinc-500 focus:border-[#c9a44c] focus:outline-hidden"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtros em Pills e Seletor de Visualização */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-zinc-800 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => setActiveFilter('active')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === 'active'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Ativos ({stats.active})
            </button>
            <button
              onClick={() => setActiveFilter('featured')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeFilter === 'featured'
                  ? 'bg-amber-500/20 text-[#e3c56c] border border-amber-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Destaques ({stats.featured})
            </button>
            <button
              onClick={() => setActiveFilter('mercadopago')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer hidden sm:block ${
                activeFilter === 'mercadopago'
                  ? 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mercado Pago ({stats.mpCount})
            </button>
          </div>

          {/* Modo de Visualização */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-900 border border-zinc-800">
            <button
              onClick={() => setViewMode('table')}
              title="Visualização em Tabela"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Visualização em Cards"
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. OFFERS LISTING (TABLE OR CARDS VIEW)                       */}
      {/* ------------------------------------------------------------- */}
      {filteredOffers.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mx-auto">
            <Coins className="w-7 h-7 text-zinc-600" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Nenhuma oferta encontrada</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {searchTerm || activeFilter !== 'all'
                ? 'Nenhum pacote corresponde aos filtros de busca aplicados.'
                : 'Você ainda não possui ofertas comerciais de pacotes cadastradas.'}
            </p>
          </div>
          <Button
            onClick={handleOpenCreateModal}
            className="bg-[#c9a44c] hover:bg-[#b48d3c] text-zinc-950 font-bold text-xs"
          >
            <Plus className="w-4 h-4 mr-1" />
            Cadastrar Primeiro Pacote
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/90 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/90 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800 text-[10px]">
                <tr>
                  <th className="py-4 px-5">Ordem & Pacote</th>
                  <th className="py-4 px-4">Volume</th>
                  <th className="py-4 px-4">Preço do Pacote</th>
                  <th className="py-4 px-4">Valor / Consulta</th>
                  <th className="py-4 px-4">Desconto</th>
                  <th className="py-4 px-4">Canal</th>
                  <th className="py-4 px-4 text-center">Status</th>
                  <th className="py-4 px-5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {filteredOffers.map((off) => (
                  <tr key={off.id} className="hover:bg-zinc-900/40 transition-colors group">
                    {/* Ordem e Nome */}
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[11px] font-mono font-bold text-zinc-400 shrink-0">
                          {off.displayOrder}
                        </span>
                        <div className="space-y-0.5">
                          <div className="font-extrabold text-white flex items-center gap-2">
                            <span>{off.name}</span>
                            {off.isFeatured && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/15 text-[#f5d77f] border border-[#c9a44c]/40">
                                <Sparkles className="w-2.5 h-2.5 fill-current" />
                                Mais Popular
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                            <span>{off.slug}</span>
                            {off.shortLabel && (
                              <>
                                <span>•</span>
                                <span className="text-zinc-400 font-sans">{off.shortLabel}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Quantidade */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs font-black text-white">
                        {off.creditsQuantity} consultas
                      </span>
                    </td>

                    {/* Preço Total */}
                    <td className="py-4 px-4">
                      <div
                        className={`text-sm font-black ${
                          off.contactOnly ? 'text-emerald-400' : 'text-[#e3c56c]'
                        }`}
                      >
                        {off.priceFormatted}
                      </div>
                    </td>

                    {/* Valor por Consulta */}
                    <td className="py-4 px-4">
                      <div className="text-xs font-semibold text-zinc-200">
                        {off.unitPriceFormatted}
                      </div>
                    </td>

                    {/* Desconto */}
                    <td className="py-4 px-4">
                      {off.discountPercent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <TrendingDown className="w-3 h-3" />
                          {off.discountPercent}% OFF
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-xs">-</span>
                      )}
                    </td>

                    {/* Canal de Pagamento */}
                    <td className="py-4 px-4">
                      {off.contactOnly ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-950/70 border border-emerald-800/80 text-emerald-300">
                          <MessageCircle className="w-3 h-3 fill-current" />
                          WhatsApp
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-sky-950/70 border border-sky-800/80 text-sky-300">
                          <MercadoPagoBrandIcon className="w-3 h-3" />
                          Mercado Pago
                        </span>
                      )}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(off)}
                        disabled={actionLoading === off.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black cursor-pointer transition-all ${
                          off.isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        {off.isActive ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>

                    {/* Ações */}
                    <td className="py-4 px-5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditModal(off)}
                        className="h-8 px-3 border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:text-white text-zinc-300 text-xs rounded-xl cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOffers.map((off) => (
            <div
              key={off.id}
              className={`p-6 rounded-3xl border relative flex flex-col justify-between space-y-5 transition-all ${
                off.isFeatured
                  ? 'bg-gradient-to-b from-zinc-900 via-zinc-950 to-zinc-950 border-[#c9a44c] shadow-[0_10px_35px_rgba(201,164,76,0.15)] ring-1 ring-[#c9a44c]/40'
                  : 'bg-zinc-950/90 border-zinc-800/90 shadow-xl'
              }`}
            >
              {/* Topo do Card */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300">
                    {off.shortLabel || `Ordem #${off.displayOrder}`}
                  </span>
                  {off.discountPercent && (
                    <span className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {off.discountPercent}% OFF
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">{off.name}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                    {off.description || 'Pacote de consultas veiculares na AF Motos.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-black text-white">
                      {off.creditsQuantity} consultas
                    </span>
                    <span className="text-xs text-zinc-400">{off.unitPriceFormatted}/un</span>
                  </div>
                  <div className="text-xl font-black text-[#e3c56c]">{off.priceFormatted}</div>
                </div>

                {/* Benefícios */}
                {off.benefits && off.benefits.length > 0 && (
                  <ul className="space-y-1.5 text-xs text-zinc-400">
                    {off.benefits.slice(0, 3).map((b, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Botões do Card */}
              <div className="pt-3 border-t border-zinc-900 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleActive(off)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
                    off.isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                  }`}
                >
                  <Power className="w-3 h-3" />
                  {off.isActive ? 'Ativo na Loja' : 'Inativo'}
                </button>

                <Button
                  size="sm"
                  onClick={() => handleOpenEditModal(off)}
                  className="bg-[#c9a44c] hover:bg-[#b48d3c] text-zinc-950 font-bold text-xs rounded-xl"
                >
                  <Edit2 className="w-3.5 h-3.5 mr-1" />
                  Editar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. ENTERPRISE CREATION & EDITING MODAL                        */}
      {/* ------------------------------------------------------------- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-zinc-950/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-zinc-800/80 bg-zinc-900/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#c9a44c]/15 border border-[#c9a44c]/30 flex items-center justify-center text-[#e3c56c]">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-white">
                    {editingOffer ? 'Editar Oferta Comercial' : 'Criar Nova Oferta de Pacote'}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Defina preços, quantidade de consultas, canal de venda e diferenciais.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center border-b border-zinc-800/80 px-6 bg-zinc-900/20 text-xs font-bold shrink-0 overflow-x-auto">
              <button
                type="button"
                onClick={() => setModalTab('details')}
                className={`py-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  modalTab === 'details'
                    ? 'border-[#c9a44c] text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                1. Vitrine & Identificação
              </button>
              <button
                type="button"
                onClick={() => setModalTab('pricing')}
                className={`py-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  modalTab === 'pricing'
                    ? 'border-[#c9a44c] text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                2. Preço & Simulação
              </button>
              <button
                type="button"
                onClick={() => setModalTab('channel')}
                className={`py-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  modalTab === 'channel'
                    ? 'border-[#c9a44c] text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                3. Canal & Regras
              </button>
              <button
                type="button"
                onClick={() => setModalTab('benefits')}
                className={`py-3 px-3 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                  modalTab === 'benefits'
                    ? 'border-[#c9a44c] text-white'
                    : 'border-transparent text-zinc-400 hover:text-zinc-200'
                }`}
              >
                4. Benefícios ({formData.benefitsText.split('\n').filter(Boolean).length})
              </button>
            </div>

            {/* Modal Body / Scrollable Form */}
            <form
              onSubmit={handleSaveOffer}
              className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5"
            >
              {/* TAB 1: IDENTIFICAÇÃO */}
              {modalTab === 'details' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">
                        Nome Comercial da Oferta *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            name,
                            slug:
                              prev.slug ||
                              name
                                .toLowerCase()
                                .replace(/[^\w\s-]/g, '')
                                .replace(/[\s_-]+/g, '-'),
                          }));
                        }}
                        placeholder="Ex: Pacote Lojista & Revenda"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#c9a44c] focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">
                        Identificador Slug (URL) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        placeholder="ex: pacote-lojista-15"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:border-[#c9a44c] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">Tipo de Pacote</label>
                      <select
                        value={formData.packageType}
                        onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#c9a44c] focus:outline-hidden"
                      >
                        <option value="standard">Padrão / Geral</option>
                        <option value="agency">Agência / Despachante</option>
                        <option value="reseller">Lojista / Revenda</option>
                        <option value="fleet">Frotista / Leilão</option>
                        <option value="custom">Personalizado PJ</option>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">Badge / Tag Visual</label>
                      <input
                        type="text"
                        value={formData.shortLabel}
                        onChange={(e) => setFormData({ ...formData, shortLabel: e.target.value })}
                        placeholder="Ex: Mais Popular"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#c9a44c] focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">Ordem de Exibição</label>
                      <input
                        type="number"
                        value={formData.displayOrder}
                        onChange={(e) =>
                          setFormData({ ...formData, displayOrder: Number(e.target.value) })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#c9a44c] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300">
                      Tagline / Subtítulo Curto
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: O pacote preferido de revendas e corretores de motos."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#c9a44c] focus:outline-hidden"
                    />
                  </div>

                  {/* Toggles de Visibilidade */}
                  <div className="p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-white">
                          Ativo na Loja / Vitrine
                        </span>
                        <p className="text-[11px] text-zinc-400">
                          Disponibilizar este pacote para compra pelos clientes cadastrados.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 rounded-sm accent-[#c9a44c]"
                      />
                    </div>

                    <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-[#e3c56c] flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" />
                          Destaque Visual (Mais Popular)
                        </span>
                        <p className="text-[11px] text-zinc-400">
                          Recebe borda dourada iluminada e selo superior em destaque.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                        className="w-4 h-4 rounded-sm accent-[#c9a44c]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PREÇO & SIMULAÇÃO */}
              {modalTab === 'pricing' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">Qtd Consultas *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        value={formData.creditsQuantity}
                        onChange={(e) =>
                          setFormData({ ...formData, creditsQuantity: Number(e.target.value) })
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#c9a44c] focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">
                        Preço Total do Pacote (R$) *
                      </label>
                      <input
                        type="text"
                        disabled={formData.contactOnly}
                        value={formData.contactOnly ? 'Sob Consulta' : formData.priceReais}
                        onChange={(e) => setFormData({ ...formData, priceReais: e.target.value })}
                        placeholder="Ex: 510,00"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#c9a44c] focus:outline-hidden disabled:opacity-40"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-zinc-300">
                        Preço Ref. Avulsa (R$)
                      </label>
                      <input
                        type="text"
                        value={formData.referencePriceReais}
                        onChange={(e) =>
                          setFormData({ ...formData, referencePriceReais: e.target.value })
                        }
                        placeholder="Ex: 39,90"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 focus:border-[#c9a44c] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Simulador Interativo */}
                  <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-black text-white">
                        Simulador Financeiro em Tempo Real
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-1">
                        <span className="text-[11px] text-zinc-400">Valor Unitário</span>
                        <div className="text-base font-black text-white">
                          {formData.contactOnly
                            ? 'Sob Consulta'
                            : previewCalculation.unitPriceFormatted}
                        </div>
                        <span className="text-[10px] text-zinc-500">por placa consultada</span>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-1">
                        <span className="text-[11px] text-zinc-400">Desconto Calculado</span>
                        <div className="text-base font-black text-emerald-400">
                          {formData.contactOnly
                            ? 'Personalizado PJ'
                            : previewCalculation.discountPercent}
                        </div>
                        <span className="text-[10px] text-emerald-500">sobre o valor avulso</span>
                      </div>

                      <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800/80 space-y-1">
                        <span className="text-[11px] text-zinc-400">Economia do Cliente</span>
                        <div className="text-base font-black text-[#e3c56c]">
                          {formData.contactOnly
                            ? 'Sob Medida'
                            : previewCalculation.savingsFormatted}
                        </div>
                        <span className="text-[10px] text-zinc-500">em relação ao avulso</span>
                      </div>
                    </div>

                    {previewCalculation.isBelowFloor && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 flex items-center gap-2">
                        <Info className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>
                          Atenção: O valor unitário está abaixo do piso recomendado de R$ 30,00 da
                          API Brasil.
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: CANAL & REGRAS */}
              {modalTab === 'channel' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300">
                      Canal de Fechamento / Checkout
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Opção Mercado Pago */}
                      <div
                        onClick={() =>
                          setFormData({ ...formData, contactOnly: false, requiresWhatsapp: false })
                        }
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          !formData.contactOnly
                            ? 'bg-sky-500/10 border-sky-500/40 shadow-md ring-1 ring-sky-500/30'
                            : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <CreditCard className="w-4 h-4 text-sky-400" />
                          <span className="text-xs font-black text-white">
                            Mercado Pago Checkout Pro
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Pagamento online automático via Pix, Cartão em até 12x ou Boleto, com
                          liberação instantânea no saldo.
                        </p>
                      </div>

                      {/* Opção WhatsApp */}
                      <div
                        onClick={() =>
                          setFormData({ ...formData, contactOnly: true, requiresWhatsapp: true })
                        }
                        className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                          formData.contactOnly
                            ? 'bg-emerald-500/10 border-emerald-500/40 shadow-md ring-1 ring-emerald-500/30'
                            : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <MessageCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-black text-white">
                            WhatsApp Comercial (PJ)
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          Direciona para negociação sob medida de grandes frotas, cotação por volume
                          e faturamento PJ direto.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-bold text-zinc-300">
                      Prazo de Validade dos Créditos (dias)
                    </label>
                    <input
                      type="number"
                      value={formData.validityDays}
                      onChange={(e) => setFormData({ ...formData, validityDays: e.target.value })}
                      placeholder="Deixe em branco para créditos vitalícios (sem expiração)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#c9a44c] focus:outline-hidden"
                    />
                    <p className="text-[11px] text-zinc-500">
                      Por padrão, os créditos da AF Motos não expiram.
                    </p>
                  </div>
                </div>
              )}

              {/* TAB 4: BENEFÍCIOS */}
              {modalTab === 'benefits' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-zinc-300">
                      Benefícios Exibidos no Card (1 por linha)
                    </label>
                    <textarea
                      rows={5}
                      value={formData.benefitsText}
                      onChange={(e) => setFormData({ ...formData, benefitsText: e.target.value })}
                      placeholder="Ex:&#10;15 laudos veiculares completos&#10;Liberação imediata em 1 clique&#10;Créditos sem data de expiração"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#c9a44c] focus:outline-hidden font-mono"
                    />
                  </div>

                  {/* Sugestões Rápidas de Presets */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-zinc-400">
                      Clique para adicionar sugestões:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {BENEFIT_PRESETS.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleAddBenefitPreset(preset)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3 text-[#c9a44c]" />
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                <div className="text-[11px] text-zinc-500">
                  {editingOffer ? `ID: ${editingOffer.id.substring(0, 8)}...` : 'Novo cadastro B2B'}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsModalOpen(false)}
                    className="border-zinc-800 text-zinc-300 hover:text-white text-xs h-9 px-4 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={actionLoading === 'saving'}
                    className="bg-[#c9a44c] hover:bg-[#b48d3c] text-zinc-950 font-black text-xs h-9 px-5 rounded-xl cursor-pointer transition-transform active:scale-95 shadow-md"
                  >
                    {actionLoading === 'saving' ? 'Salvando...' : 'Salvar Oferta'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
