'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Coins,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
  History,
  ShieldCheck,
  Plus,
  Minus,
  X,
  UserCheck,
  Check,
  Building2,
  Clock,
  ArrowRight,
  HelpCircle,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

export interface AdminUserCreditItem {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  balance: number;
  createdAt?: string;
}

export interface AdminLedgerItem {
  id: string;
  user_id: string;
  transaction_type: string;
  amount: number;
  description?: string | null;
  created_at: string;
  consultation_id?: string | null;
}

interface CreditManagerProps {
  users: AdminUserCreditItem[];
  initialLedger?: AdminLedgerItem[];
}

const PACKAGE_PRESETS = [
  { qty: 5, label: '5 un', name: 'Inicial', discount: '5% OFF', desc: 'Pacote Inicial (5 consultas) fechado via WhatsApp' },
  { qty: 15, label: '15 un', name: 'Lojista', discount: '8% OFF', desc: 'Pacote Lojista (15 consultas) fechado via WhatsApp', popular: true },
  { qty: 30, label: '30 un', name: 'Frotista', discount: '12% OFF', desc: 'Pacote Frotista (30 consultas) fechado via WhatsApp' },
  { qty: 50, label: '50 un', name: 'Enterprise', discount: '15% OFF', desc: 'Pacote Enterprise (50 consultas) fechado via WhatsApp' },
];

export function CreditManager({ users: initialUsers, initialLedger = [] }: CreditManagerProps) {
  const router = useRouter();
  const [usersList, setUsersList] = useState<AdminUserCreditItem[]>(initialUsers);
  const [ledgerList, setLedgerList] = useState<AdminLedgerItem[]>(initialLedger);

  // Form State
  const [clientSearch, setClientSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [action, setAction] = useState<'grant' | 'revoke'>('grant');
  const [amount, setAmount] = useState<number>(15);
  const [selectedPreset, setSelectedPreset] = useState<number | 'custom'>(15);
  const [description, setDescription] = useState<string>('Pacote Lojista (15 consultas) fechado via WhatsApp');
  const [loading, setLoading] = useState(false);

  // Filter lists state
  const [activeClientsSearch, setActiveClientsSearch] = useState('');
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'granted' | 'consumed' | 'reserved' | 'released' | 'revoked'>('all');
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Derived user maps & active list
  const userMap = useMemo(() => {
    return new Map(usersList.map((u) => [u.id, u]));
  }, [usersList]);

  const selectedUser = useMemo(() => {
    return usersList.find((u) => u.id === selectedUserId) || null;
  }, [usersList, selectedUserId]);

  const filteredSearchUsers = useMemo(() => {
    if (!clientSearch.trim()) {
      return usersList.slice(0, 6);
    }
    const term = clientSearch.toLowerCase().trim();
    return usersList.filter((u) => {
      const emailMatch = u.email.toLowerCase().includes(term);
      const nameMatch = u.name?.toLowerCase().includes(term);
      const idMatch = u.id.toLowerCase().includes(term);
      return emailMatch || nameMatch || idMatch;
    }).slice(0, 6);
  }, [usersList, clientSearch]);

  const activeBalances = useMemo(() => {
    return usersList
      .filter((u) => u.balance > 0)
      .sort((a, b) => b.balance - a.balance);
  }, [usersList]);

  const filteredActiveClients = useMemo(() => {
    if (!activeClientsSearch.trim()) return activeBalances;
    const term = activeClientsSearch.toLowerCase().trim();
    return activeBalances.filter((u) => {
      return (
        u.email.toLowerCase().includes(term) ||
        (u.name && u.name.toLowerCase().includes(term)) ||
        u.id.toLowerCase().includes(term)
      );
    });
  }, [activeBalances, activeClientsSearch]);

  const totalCirculatingCredits = useMemo(() => {
    return activeBalances.reduce((acc, curr) => acc + curr.balance, 0);
  }, [activeBalances]);

  // Handle Preset Click
  const handleSelectPreset = (presetQty: number) => {
    const preset = PACKAGE_PRESETS.find((p) => p.qty === presetQty);
    setSelectedPreset(presetQty);
    setAmount(presetQty);
    if (preset) {
      setDescription(action === 'grant' ? preset.desc : `Ajuste/estorno de ${presetQty} créditos`);
    }
  };

  // Handle Quick Select from Active Clients List
  const handleQuickSelectClient = (userId: string) => {
    setSelectedUserId(userId);
    setClientSearch('');
    // Scroll smoothly to form on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      document.getElementById('form-lancar-creditos')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Live Balance Simulation
  const projectedBalance = useMemo(() => {
    if (!selectedUser) return null;
    const current = selectedUser.balance;
    const diff = action === 'grant' ? amount : -amount;
    return Math.max(0, current + diff);
  }, [selectedUser, action, amount]);

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      toast.error('Selecione um cliente para prosseguir.');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Informe uma quantidade válida maior que 0.');
      return;
    }

    if (action === 'revoke' && amount > selectedUser.balance) {
      toast.warning(`O cliente possui apenas ${selectedUser.balance} crédito(s). O saldo será zerado.`);
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/credits/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          amount,
          action,
          description:
            description.trim() ||
            `Ajuste manual (${action === 'grant' ? 'concessão' : 'remoção'}) via painel administrativo`,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const newBalance = data.newBalance ?? (action === 'grant' ? selectedUser.balance + amount : Math.max(0, selectedUser.balance - amount));

        toast.success(
          `${action === 'grant' ? 'Concedidos' : 'Removidos'} ${amount} créditos para ${selectedUser.email}! Saldo atual: ${newBalance} un.`
        );

        // Optimistic UI Update
        setUsersList((prev) =>
          prev.map((u) => (u.id === selectedUser.id ? { ...u, balance: newBalance } : u))
        );

        // Add to local ledger
        const newLedgerEntry: AdminLedgerItem = {
          id: `local-${Date.now()}`,
          user_id: selectedUser.id,
          transaction_type: action === 'grant' ? 'granted' : 'revoked',
          amount,
          description: description.trim() || (action === 'grant' ? 'Créditos concedidos via painel' : 'Créditos removidos'),
          created_at: new Date().toISOString(),
        };
        setLedgerList((prev) => [newLedgerEntry, ...prev]);

        // Reset some form states
        setSelectedPreset(15);
        setAmount(15);
        setDescription('Pacote Lojista (15 consultas) fechado via WhatsApp');

        // Background server sync
        router.refresh();
      } else {
        toast.error(data.error || 'Erro ao processar operação.');
      }
    } catch (err) {
      toast.error('Falha de conexão com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Filtered Ledger Entries
  const filteredLedger = useMemo(() => {
    let list = ledgerList;

    if (ledgerFilter !== 'all') {
      list = list.filter((item) => {
        if (ledgerFilter === 'granted') return item.transaction_type === 'granted';
        if (ledgerFilter === 'consumed') return item.transaction_type === 'consumed';
        if (ledgerFilter === 'reserved') return item.transaction_type === 'reserved';
        if (ledgerFilter === 'released') return item.transaction_type === 'released';
        if (ledgerFilter === 'revoked') return item.transaction_type === 'revoked';
        return true;
      });
    }

    if (ledgerSearch.trim()) {
      const term = ledgerSearch.toLowerCase().trim();
      list = list.filter((item) => {
        const user = userMap.get(item.user_id);
        const email = user?.email.toLowerCase() || '';
        const desc = (item.description || '').toLowerCase();
        const txType = item.transaction_type.toLowerCase();
        return email.includes(term) || desc.includes(term) || txType.includes(term);
      });
    }

    return list;
  }, [ledgerList, ledgerFilter, ledgerSearch, userMap]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Header & KPI Cards */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-heading">
                Gestão de Créditos B2B
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/25">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>Parcerias & Lojistas</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Atribua créditos negociados via WhatsApp e monitore o consumo em tempo real com auditoria em ledger.
            </p>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: Circulating */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#141b2b] to-[#0d121e] border border-amber-500/30 p-4 sm:p-5 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Créditos em Circulação
                </span>
                <span className="text-2xl sm:text-3xl font-black text-amber-400 font-heading">
                  {totalCirculatingCredits}
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              Saldo pré-pago disponível para emissão imediata
            </p>
          </div>

          {/* Card 2: Active Clients */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#101c24] to-[#0b141b] border border-emerald-500/25 p-4 sm:p-5 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Clientes com Saldo
                </span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-heading">
                  {activeBalances.length}
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              Lojistas e parceiros prontos para consultar placas
            </p>
          </div>

          {/* Card 3: Audit Ledger */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#101826] to-[#0a0f19] border border-sky-500/25 p-4 sm:p-5 shadow-lg shadow-black/40">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] sm:text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Auditoria Imutável (Ledger)
                </span>
                <span className="text-2xl sm:text-3xl font-black text-sky-400 font-heading">
                  {ledgerList.length} registros
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2">
              Histórico rastreável com reserva e estorno atômicos
            </p>
          </div>
        </div>
      </div>

      {/* 2. Main Two-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Launch / Adjust Form */}
        <div id="form-lancar-creditos" className="lg:col-span-7 bg-[#0c121e] border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
          {/* Card Header */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">Lançar ou Ajustar Créditos</h2>
                <p className="text-xs text-zinc-400">Selecione o cliente e o pacote combinado</p>
              </div>
            </div>

            {/* Operation Selector Toggle */}
            <div className="inline-flex p-1 rounded-xl bg-zinc-900 border border-zinc-800">
              <button
                type="button"
                onClick={() => setAction('grant')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  action === 'grant'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Conceder (+)</span>
              </button>
              <button
                type="button"
                onClick={() => setAction('revoke')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  action === 'revoke'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Minus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Estornar (-)</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* STEP 1: Client Selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                1. Cliente Destinatário
              </label>

              {selectedUser ? (
                /* Selected Client Highlight Card */
                <div className="relative rounded-2xl p-4 bg-gradient-to-r from-amber-500/10 via-[#131b2e] to-[#0c121e] border-2 border-amber-500/40 flex items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 font-bold text-sm shrink-0">
                      {selectedUser.email.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white truncate">
                          {selectedUser.name || selectedUser.email}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black shrink-0">
                          {selectedUser.balance} {selectedUser.balance === 1 ? 'crédito' : 'créditos'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">{selectedUser.email}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedUserId('')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold shrink-0 cursor-pointer transition-colors"
                  >
                    Alterar
                  </button>
                </div>
              ) : (
                /* Interactive Search Box */
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Digite o e-mail, nome ou ID do cliente..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                    />
                    {clientSearch && (
                      <button
                        type="button"
                        onClick={() => setClientSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Matching results dropdown list */}
                  <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/70 divide-y divide-zinc-900 max-h-56 overflow-y-auto">
                    {filteredSearchUsers.length === 0 ? (
                      <div className="p-4 text-center text-xs text-zinc-500">
                        Nenhum cliente localizado com esse filtro.
                      </div>
                    ) : (
                      filteredSearchUsers.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => setSelectedUserId(u.id)}
                          className="p-2.5 sm:p-3 hover:bg-zinc-900/80 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 text-xs font-bold shrink-0">
                              {u.email.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-zinc-200 truncate">{u.email}</p>
                              {u.name && <p className="text-[10px] text-zinc-500 truncate">{u.name}</p>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
                              {u.balance} un
                            </span>
                            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded-lg border border-emerald-500/30 transition-colors">
                              Selecionar
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* STEP 2: Package Presets (1-Click Selection) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400">
                  2. Pacote / Quantidade
                </label>
                <span className="text-[11px] text-zinc-500">
                  {action === 'grant' ? 'Presets com desconto comercial' : 'Quantidade para estorno'}
                </span>
              </div>


              {/* Number Input if custom or manual override */}
              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1">
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={amount}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value));
                        setAmount(val);
                        setSelectedPreset('custom');
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                      placeholder="Quantidade de créditos..."
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs font-semibold">
                      consultas
                    </span>
                  </div>
                </div>


              </div>
            </div>



            {/* Live Balance Preview Box */}
            {selectedUser && projectedBalance !== null && (
              <div className="p-3.5 rounded-2xl bg-zinc-950/90 border border-zinc-800/90 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-zinc-400">Saldo Atual:</span>
                  <span className="font-bold text-zinc-200 font-mono">{selectedUser.balance}</span>
                  <span className="text-zinc-500">➔</span>
                  <span className="text-zinc-400">Após {action === 'grant' ? 'concessão' : 'estorno'}:</span>
                  <span className={`font-black font-mono text-sm ${action === 'grant' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {projectedBalance} un
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-black ${action === 'grant' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'}`}>
                  {action === 'grant' ? `+${amount}` : `-${amount}`}
                </span>
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading || !selectedUser}
              className="w-full min-h-[48px] py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processando Lançamento...</span>
                </>
              ) : (
                <>
                  <span>
                    Confirmar {action === 'grant' ? `Concessão de ${amount} Créditos` : `Estorno de ${amount} Créditos`}
                  </span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Active Clients List & Quick Action */}
        <div className="lg:col-span-5 bg-[#0c121e] border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Clientes com Saldo</h2>
                <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {activeBalances.length} ativos
                </span>
              </div>
              <p className="text-xs text-zinc-500">Parceiros com consultas prontas</p>
            </div>
          </div>

          {/* Quick filter in active clients */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar entre os ativos..."
              value={activeClientsSearch}
              onChange={(e) => setActiveClientsSearch(e.target.value)}
              className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* List */}
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {filteredActiveClients.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-xs space-y-2">
                <Coins className="w-8 h-8 mx-auto opacity-30 text-amber-400" />
                <p className="font-semibold text-zinc-400">
                  {activeBalances.length === 0 ? 'Nenhum cliente possui saldo no momento.' : 'Nenhum cliente ativo encontrado com esse filtro.'}
                </p>
                <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                  {activeBalances.length === 0
                    ? 'Ao fechar um pacote pelo WhatsApp, localize o cliente ao lado e clique em Conceder.'
                    : 'Tente buscar por outro termo.'}
                </p>
              </div>
            ) : (
              filteredActiveClients.map((u) => (
                <div
                  key={u.id}
                  className={`flex justify-between items-center p-3 rounded-2xl border transition-all ${
                    selectedUserId === u.id
                      ? 'bg-amber-500/15 border-amber-500/50 shadow-sm'
                      : 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800/80'
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-bold text-zinc-200 truncate">{u.name || u.email}</p>
                    <p className="text-[10px] text-zinc-400 truncate">{u.email}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-black text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                      {u.balance} un
                    </span>

                    <button
                      type="button"
                      onClick={() => handleQuickSelectClient(u.id)}
                      className="px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-bold transition-colors cursor-pointer border border-zinc-700"
                    >
                      Lançar +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Card: Ledger History Feed */}
      <div className="bg-[#0c121e] border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-xl space-y-5">
        {/* Ledger Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-amber-400" />
            <div>
              <h2 className="text-base font-bold text-white">Auditoria de Movimentações (Ledger)</h2>
              <p className="text-xs text-zinc-500">Histórico detalhado de concessões, consumos e reservas</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'granted', label: 'Concessões (+)' },
              { id: 'consumed', label: 'Consumos (-)' },
              { id: 'reserved', label: 'Reservas' },
              { id: 'released', label: 'Estornos' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLedgerFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  ledgerFilter === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-zinc-900/90 text-zinc-400 hover:text-white border border-zinc-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Search Input */}
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Filtrar movimentações por e-mail ou descrição..."
            value={ledgerSearch}
            onChange={(e) => setLedgerSearch(e.target.value)}
            className="w-full bg-zinc-900/80 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* MOBILE VIEW: Transaction Cards (sm:hidden) */}
        <div className="space-y-2.5 sm:hidden">
          {filteredLedger.length === 0 ? (
            <div className="text-center py-8 text-xs text-zinc-500">
              Nenhuma movimentação encontrada com esses filtros.
            </div>
          ) : (
            filteredLedger.map((entry) => {
              const isPositive = ['granted', 'released'].includes(entry.transaction_type);
              const user = userMap.get(entry.user_id);

              return (
                <div key={entry.id} className="p-3 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                        entry.transaction_type === 'granted'
                          ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                          : entry.transaction_type === 'revoked'
                          ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                          : entry.transaction_type === 'reserved'
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                          : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                      }`}
                    >
                      {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                      <span>{entry.transaction_type}</span>
                    </span>

                    <span className={`text-sm font-black font-mono ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isPositive ? `+${entry.amount}` : `-${entry.amount}`}
                    </span>
                  </div>

                  <div className="text-xs">
                    <p className="font-semibold text-zinc-200 truncate">{user?.email || entry.user_id}</p>
                    <p className="text-[11px] text-zinc-400">{entry.description || '—'}</p>
                  </div>

                  <div className="text-[10px] text-zinc-500 font-mono flex items-center justify-between pt-1 border-t border-zinc-800/50">
                    <span>{new Date(entry.created_at).toLocaleString('pt-BR')}</span>
                    {entry.consultation_id && (
                      <span className="text-zinc-400">Placa ID: {entry.consultation_id.slice(0, 8)}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP VIEW: High Density Table (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800/80 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Data / Hora</th>
                <th className="py-2.5 px-3">Cliente</th>
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Quantidade</th>
                <th className="py-2.5 px-3">Descrição / Motivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 text-zinc-300">
              {filteredLedger.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-zinc-500">
                    Nenhuma movimentação encontrada com esses filtros.
                  </td>
                </tr>
              ) : (
                filteredLedger.map((entry) => {
                  const isPositive = ['granted', 'released'].includes(entry.transaction_type);
                  const isNegative = ['revoked', 'consumed', 'reserved'].includes(entry.transaction_type);
                  const user = userMap.get(entry.user_id);

                  return (
                    <tr key={entry.id} className="hover:bg-zinc-900/50 transition-colors">
                      <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                        {new Date(entry.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-3 px-3 font-medium text-white max-w-[200px] truncate">
                        {user?.email || entry.user_id}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border ${
                            entry.transaction_type === 'granted'
                              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                              : entry.transaction_type === 'revoked'
                              ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                              : entry.transaction_type === 'reserved'
                              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                              : 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                          }`}
                        >
                          {isPositive && <ArrowUpRight className="w-3 h-3" />}
                          {isNegative && <ArrowDownLeft className="w-3 h-3" />}
                          <span>{entry.transaction_type}</span>
                        </span>
                      </td>
                      <td className="py-3 px-3 font-black font-mono text-sm">
                        <span className={isPositive ? 'text-emerald-400' : 'text-rose-400'}>
                          {isPositive ? `+${entry.amount}` : `-${entry.amount}`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-zinc-400 max-w-[320px] truncate">
                        {entry.description || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
