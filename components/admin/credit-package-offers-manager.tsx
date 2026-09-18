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
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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

export function CreditPackageOffersManager() {
  const [offers, setOffers] = useState<AdminOfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<AdminOfferItem | null>(null);

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
    displayOrder: 0,
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
    init();
    return () => {
      active = false;
    };
  }, []);

  const handleOpenCreateModal = () => {
    setEditingOffer(null);
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
      benefitsText: 'Consultas veiculares completas\nLiberação imediata no saldo\nSem expiração',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (offer: AdminOfferItem) => {
    setEditingOffer(offer);
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

  // Preview dinâmico de desconto e preço unitário
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
      unitPriceFormatted: (unitPriceCents / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
      discountPercent: discount > 0 ? `${discount}% OFF` : 'Sem desconto',
      savingsFormatted: Math.max(0, (totalRefCents - priceCents) / 100).toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }),
    };
  }, [formData]);

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
        setSuccessMsg(`Oferta ${!offer.isActive ? 'ativada' : 'desativada'} com sucesso.`);
        await loadOffers();
      } else {
        setErrorMsg(data.error || 'Falha ao alterar status.');
      }
    } catch {
      setErrorMsg('Erro de comunicação.');
    } finally {
      setActionLoading(null);
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
          editingOffer ? 'Oferta atualizada com sucesso!' : 'Oferta criada com sucesso!',
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
    <div className="space-y-6">
      {/* Header com Ação Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-[#c9a44c]" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Catálogo Comercial de Pacotes B2B
            </h1>
          </div>
          <p className="text-xs text-zinc-400 pt-0.5">
            Gerencie pacotes online (Mercado Pago) e pacotes sob medida direcionados ao WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadOffers}
            disabled={loading}
            className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreateModal}
            className="bg-[#c9a44c] hover:bg-[#b48d3c] text-zinc-950 font-bold text-xs"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nova Oferta de Pacote
          </Button>
        </div>
      </div>

      {/* Alertas */}
      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabela de Ofertas */}
      <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-900/90 text-zinc-400 font-bold uppercase tracking-wider border-b border-zinc-800 text-[10px]">
              <tr>
                <th className="py-3 px-4">Ordem / Nome</th>
                <th className="py-3 px-4">Créditos</th>
                <th className="py-3 px-4">Preço Pacote</th>
                <th className="py-3 px-4">Valor / Consulta</th>
                <th className="py-3 px-4">Desconto</th>
                <th className="py-3 px-4">Canal</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {offers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-zinc-500">
                    {loading ? 'Carregando ofertas...' : 'Nenhuma oferta cadastrada no momento.'}
                  </td>
                </tr>
              ) : (
                offers.map((off) => (
                  <tr key={off.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] font-mono text-zinc-400">
                          {off.displayOrder}
                        </span>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            {off.name}
                            {off.isFeatured && (
                              <Sparkles className="w-3 h-3 text-[#c9a44c] shrink-0" />
                            )}
                          </div>
                          <div className="text-[10px] font-mono text-zinc-500">{off.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-black text-white">{off.creditsQuantity} un</td>
                    <td className="py-3.5 px-4 font-bold text-[#e3c56c]">{off.priceFormatted}</td>
                    <td className="py-3.5 px-4 text-zinc-300">{off.unitPriceFormatted}</td>
                    <td className="py-3.5 px-4">
                      {off.discountPercent ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          {off.discountPercent}% OFF
                        </span>
                      ) : (
                        <span className="text-zinc-600 text-[10px]">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {off.contactOnly ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/60 border border-emerald-800/80 text-emerald-300">
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-950/60 border border-blue-800/80 text-blue-300">
                          <CreditCard className="w-3 h-3" />
                          Mercado Pago
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(off)}
                        disabled={actionLoading === off.id}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all ${
                          off.isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-zinc-300'
                        }`}
                      >
                        <Power className="w-2.5 h-2.5" />
                        {off.isActive ? 'Ativo' : 'Inativo'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEditModal(off)}
                        className="h-7 px-2 text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-xl rounded-3xl border border-zinc-800 bg-zinc-950 p-5 sm:p-7 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base sm:text-lg font-black text-white">
                {editingOffer ? 'Editar Oferta Comercial' : 'Criar Nova Oferta de Pacote'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOffer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300">Nome da Oferta *</label>
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
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#c9a44c] outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300">Slug Kebab-Case *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="ex: pacote-lojista-15"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white font-mono focus:border-[#c9a44c] outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300">Qtd Consultas *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={formData.creditsQuantity}
                    onChange={(e) =>
                      setFormData({ ...formData, creditsQuantity: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#c9a44c] outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300">
                    Preço do Pacote (R$) *
                  </label>
                  <input
                    type="text"
                    disabled={formData.contactOnly}
                    value={formData.contactOnly ? 'Sob Consulta' : formData.priceReais}
                    onChange={(e) => setFormData({ ...formData, priceReais: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#c9a44c] outline-hidden disabled:opacity-50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300">Ref. Avulsa (R$)</label>
                  <input
                    type="text"
                    value={formData.referencePriceReais}
                    onChange={(e) =>
                      setFormData({ ...formData, referencePriceReais: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 focus:border-[#c9a44c] outline-hidden"
                  />
                </div>
              </div>

              {/* Preview Dinâmico de Cálculo Comercial */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs flex items-center justify-between text-zinc-300">
                <span>
                  Valor por laudo:{' '}
                  <strong className="text-white">{previewCalculation.unitPriceFormatted}</strong>
                </span>
                <span>
                  Desconto:{' '}
                  <strong className="text-emerald-400">{previewCalculation.discountPercent}</strong>
                </span>
                <span>
                  Economia cliente:{' '}
                  <strong className="text-[#e3c56c]">{previewCalculation.savingsFormatted}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300">Badge / Tag Visual</label>
                  <input
                    type="text"
                    value={formData.shortLabel}
                    onChange={(e) => setFormData({ ...formData, shortLabel: e.target.value })}
                    placeholder="Ex: Mais Recomendado"
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#c9a44c] outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-zinc-300">Ordem de Exibição</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) =>
                      setFormData({ ...formData, displayOrder: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#c9a44c] outline-hidden"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-zinc-300">
                  Benefícios (1 por linha)
                </label>
                <textarea
                  rows={3}
                  value={formData.benefitsText}
                  onChange={(e) => setFormData({ ...formData, benefitsText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:border-[#c9a44c] outline-hidden"
                />
              </div>

              {/* Opções de Canal e Exibição */}
              <div className="pt-2 border-t border-zinc-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formData.contactOnly}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData({
                        ...formData,
                        contactOnly: checked,
                        requiresWhatsapp: checked ? true : formData.requiresWhatsapp,
                      });
                    }}
                    className="rounded-sm bg-zinc-900 border-zinc-700 text-[#c9a44c]"
                  />
                  <span>Exclusivo WhatsApp</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                    className="rounded-sm bg-zinc-900 border-zinc-700 text-[#c9a44c]"
                  />
                  <span>Destaque Visual</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded-sm bg-zinc-900 border-zinc-700 text-[#c9a44c]"
                  />
                  <span>Ativo na Vitrine</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-zinc-800">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="border-zinc-800 text-zinc-300"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={actionLoading === 'saving'}
                  className="bg-[#c9a44c] hover:bg-[#b48d3c] text-zinc-950 font-bold"
                >
                  {actionLoading === 'saving' ? 'Salvando...' : 'Salvar Oferta'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
