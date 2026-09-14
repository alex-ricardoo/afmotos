'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  DollarSign,
  TrendingUp,
  History,
  AlertCircle,
  CheckCircle2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import {
  getVehicleHistoryPricingAdminDataAction,
  updateVehicleHistoryPricingAction,
} from '@/lib/actions/pricing';
import {
  type VehicleHistoryPricingConfig,
  type VehicleHistoryPricingVersionRecord,
} from '@/lib/settings/pricing-service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface VehicleHistoryPricingCardProps {
  onPriceUpdated?: (newPrice: number) => void;
}

export function VehicleHistoryPricingCard({ onPriceUpdated }: VehicleHistoryPricingCardProps) {
  const [config, setConfig] = useState<VehicleHistoryPricingConfig | null>(null);
  const [versions, setVersions] = useState<VehicleHistoryPricingVersionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [sellingPrice, setSellingPrice] = useState('39.90');
  const [liveCost, setLiveCost] = useState('30.00');
  const [changeReason, setChangeReason] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  );

  const refreshData = async () => {
    setLoading(true);
    const res = await getVehicleHistoryPricingAdminDataAction();
    if (res.success && res.config) {
      setConfig(res.config);
      setVersions(res.versions || []);
      setSellingPrice((res.config.publicPriceCents / 100).toFixed(2));
      setLiveCost((res.config.apiBrasilLiveCostCents / 100).toFixed(2));
    }
    setLoading(false);
  };

  useEffect(() => {
    let ignore = false;
    getVehicleHistoryPricingAdminDataAction().then((res) => {
      if (ignore) return;
      if (res.success && res.config) {
        setConfig(res.config);
        setVersions(res.versions || []);
        setSellingPrice((res.config.publicPriceCents / 100).toFixed(2));
        setLiveCost((res.config.apiBrasilLiveCostCents / 100).toFixed(2));
      }
      setLoading(false);
    });
    return () => {
      ignore = true;
    };
  }, []);

  const numSelling = parseFloat(sellingPrice) || 0;
  const numCost = parseFloat(liveCost) || 0;
  const estimatedMargin = numSelling - numCost;
  const estimatedMarginPct = numSelling > 0 ? Math.round((estimatedMargin / numSelling) * 100) : 0;

  const handleOpenConfirm = (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    setFeedback(null);

    if (numSelling <= 0) {
      setFeedback({ type: 'error', message: 'Preço de venda deve ser maior que zero.' });
      return;
    }
    if (numCost < 0) {
      setFeedback({ type: 'error', message: 'Custo da API Brasil não pode ser negativo.' });
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmUpdate = () => {
    startTransition(async () => {
      const res = await updateVehicleHistoryPricingAction({
        publicPrice: numSelling,
        apiBrasilLiveCost: numCost,
        changeReason: changeReason.trim() || undefined,
      });

      if (res.success) {
        setFeedback({
          type: 'success',
          message: 'Nova versão de precificação e custo ativada com sucesso!',
        });
        setIsConfirmOpen(false);
        setChangeReason('');
        await refreshData();
        if (onPriceUpdated) {
          onPriceUpdated(numSelling);
        }
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Erro ao atualizar tabela de preços.',
        });
        setIsConfirmOpen(false);
      }
    });
  };

  const formatBrl = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
      cents / 100,
    );
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d);
    } catch {
      return iso;
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-6">
      {/* Header com indicador de versão ativa */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#c9a44c]" />
          <h4 className="text-base font-bold text-white tracking-wide">
            Precificação e Custo do Histórico Veicular
          </h4>
        </div>
        {config && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
            <Lock className="w-3.5 h-3.5" />
            Vigente desde {formatDate(config.effectiveFrom)}
          </span>
        )}
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Grid de Inputs e Margem em Tempo Real */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Preço de Venda */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Preço de Venda da Consulta (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0.01"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="49.90"
              disabled={loading || isPending}
              className="bg-zinc-950 border-zinc-800 text-white font-mono text-base font-bold focus:border-[#c9a44c]"
            />
            <p className="text-[11px] text-zinc-400">
              Valor cobrado ao cliente por consulta avulsa no Mercado Pago.
            </p>
          </div>

          {/* Custo Provedor API Brasil */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Custo por Consulta Live API Brasil (R$)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={liveCost}
              onChange={(e) => setLiveCost(e.target.value)}
              placeholder="30.00"
              disabled={loading || isPending}
              className="bg-zinc-950 border-zinc-800 text-white font-mono text-base font-bold focus:border-[#c9a44c]"
            />
            <p className="text-[11px] text-zinc-400">
              Tarifa debitada da conta API Brasil em novas chamadas ao vivo.
            </p>
          </div>

          {/* Card de Margem Bruta Estimada */}
          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
              <span>Margem Bruta Estimada</span>
              <TrendingUp
                className={`w-4 h-4 ${estimatedMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
              />
            </div>
            <div className="my-1">
              <span
                className={`text-2xl font-black font-mono ${
                  estimatedMargin >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  estimatedMargin,
                )}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-zinc-500">
              <span>Rentabilidade:</span>
              <span className="font-bold text-zinc-300">{estimatedMarginPct}% por venda</span>
            </div>
          </div>
        </div>

        {/* Motivo Opcional e Botão de Ação */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4 pt-2">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-medium text-zinc-400">
              Motivo da alteração tarifária (opcional para auditoria)
            </label>
            <Input
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Ex: Reajuste contratual do provedor API Brasil"
              disabled={loading || isPending}
              className="bg-zinc-950 border-zinc-800 text-xs text-white"
            />
          </div>

          <Button
            type="button"
            onClick={handleOpenConfirm}
            disabled={loading || isPending}
            className="bg-[#c9a44c] hover:bg-[#d8b35a] text-black font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer h-10 shrink-0"
          >
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Salvando...
              </>
            ) : (
              'Salvar Nova Versão de Tarifas'
            )}
          </Button>
        </div>
      </div>

      {/* Histórico de Versões de Precificação */}
      <div className="space-y-3 pt-4 border-t border-zinc-800/80">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-zinc-400" />
          <h5 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
            Histórico Auditado de Precificação
          </h5>
        </div>

        {versions.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">Nenhuma alteração registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/80">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-900/60 border-b border-zinc-800 text-zinc-400 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">Vigência</th>
                  <th className="py-2.5 px-3">Preço Venda</th>
                  <th className="py-2.5 px-3">Custo API Brasil</th>
                  <th className="py-2.5 px-3">Margem</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Alterado Por</th>
                  <th className="py-2.5 px-3">Motivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
                {versions.map((ver) => {
                  const marginCents = ver.public_price_cents - ver.apibrasil_live_cost_cents;
                  return (
                    <tr key={ver.id} className="hover:bg-zinc-900/30 transition-colors">
                      <td className="py-2.5 px-3 whitespace-nowrap text-zinc-400 font-mono text-[11px]">
                        {formatDate(ver.effective_from)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white">
                        {formatBrl(ver.public_price_cents)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-amber-400">
                        {formatBrl(ver.apibrasil_live_cost_cents)}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-emerald-400">
                        {formatBrl(marginCents)}
                      </td>
                      <td className="py-2.5 px-3">
                        {ver.is_active ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Vigente
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium text-zinc-400 bg-zinc-800">
                            Encerrada
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-zinc-400">
                        {ver.admin_name || ver.admin_email || 'Sistema'}
                      </td>
                      <td
                        className="py-2.5 px-3 text-zinc-400 truncate max-w-xs"
                        title={ver.change_reason || ''}
                      >
                        {ver.change_reason || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Confirmação Reforçada */}
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-5 h-5" /> Confirmar Alteração de Tarifas
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Esta ação criará uma nova versão imutável. As novas consultas utilizarão estes
              valores, enquanto consultas já realizadas no passado preservarão seus custos
              originais.
            </DialogDescription>
          </DialogHeader>

          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-zinc-400">Novo Preço ao Cliente:</span>
              <span className="font-bold text-white">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  numSelling,
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-400">Novo Custo API Brasil:</span>
              <span className="font-bold text-amber-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  numCost,
                )}
              </span>
            </div>
            <div className="flex justify-between border-t border-zinc-800 pt-2 font-bold">
              <span className="text-zinc-300">Nova Margem Estimada:</span>
              <span className="text-emerald-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  estimatedMargin,
                )}{' '}
                ({estimatedMarginPct}%)
              </span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsConfirmOpen(false)}
              className="border-zinc-800 text-zinc-300 hover:bg-zinc-900"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirmUpdate}
              disabled={isPending}
              className="bg-[#c9a44c] hover:bg-[#d8b35a] text-black font-extrabold"
            >
              {isPending ? 'Gravando...' : 'Confirmar e Ativar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
