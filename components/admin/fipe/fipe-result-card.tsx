'use client';
import { useState } from 'react';
import { FipeQuote, FipeExpandedResult } from '@/lib/fipex/types';
import { formatFipeCurrency, formatModelYear } from '@/lib/domain/fipe-price';
import {
  Bookmark,
  Check,
  Calendar,
  Fuel,
  Hash,
  Clock,
  Link as LinkIcon,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Calculator,
  Share2,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

interface FipeResultCardProps {
  quote: FipeQuote;
  expanded?: FipeExpandedResult | null;
  onSave?: () => void;
  onOpenLinker?: () => void;
  onRequery?: () => void;
  isSaving?: boolean;
  isSaved?: boolean;
  savedId?: string | null;
}

export function FipeResultCard({
  quote,
  expanded,
  onSave,
  onOpenLinker,
  onRequery,
  isSaving = false,
  isSaved = false,
  savedId,
}: FipeResultCardProps) {
  const analytics = expanded?.analytics;
  const [margin, setMargin] = useState<number>(0.80); // Default 80%

  const suggestedPrice = quote.priceReais * margin;

  const handleShare = async () => {
    const text = `*Consulta FIPE - AF Motos*\n🏍️ *${quote.brandName} ${quote.modelName}*\nAno: ${formatModelYear(quote.year, quote.isZeroKm)}\nFIPE: ${formatFipeCurrency(quote.priceReais)}\nSugestão de Compra (${Math.round(margin * 100)}%): ${formatFipeCurrency(suggestedPrice)}\nRef: ${quote.referenceLabel}`;
    
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Resumo copiado para a área de transferência!');
    } catch (err) {
      toast.error('Não foi possível copiar o texto.');
    }
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-md space-y-6">
      {/* Ações Rápidas Topo (Desktop) - escondidas no mobile a favor da Bottom Action Bar */}
      <div className="hidden sm:flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#c9a44c]/15 text-[#e3c56c] border border-[#c9a44c]/30">
              <Sparkles className="h-3 w-3" />
              Tabela FIPE
            </span>
            <span className="text-xs text-muted-foreground">
              {quote.vehicleTypeLabel || 'Motocicleta'}
            </span>
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            {quote.brandName} {quote.modelName}
          </h2>
          {quote.versionName && (
            <p className="text-sm text-muted-foreground">{quote.versionName}</p>
          )}
        </div>

        {/* Requery Action - Desktop */}
        <div className="flex items-center gap-2 shrink-0">
          {onRequery && (
            <button
              onClick={onRequery}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-border/80 bg-secondary/50 text-foreground hover:bg-secondary hover:text-foreground transition-colors cursor-pointer"
              title="Atualizar cotação"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Atualizar</span>
            </button>
          )}
        </div>
      </div>

      {/* Cabeçalho Mobile */}
      <div className="sm:hidden border-b border-border/60 pb-4">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-500 border border-amber-500/30">
            <Hash className="h-3 w-3" />
            {quote.fipeCode}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-secondary text-muted-foreground border border-border/50">
            <Calendar className="h-3 w-3" />
            Ref: {quote.referenceLabel}
          </span>
        </div>

        <h2 className="text-xl font-black tracking-tight text-foreground leading-tight">
          {quote.brandName} {quote.modelName}
        </h2>
        {quote.versionName && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{quote.versionName}</p>
        )}
      </div>

      {/* Bloco de Preço em Destaque */}
      <div className="rounded-xl bg-gradient-to-br from-background via-secondary/20 to-background border border-border/80 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Valor Oficial FIPE
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold text-amber-500 tracking-tight mt-1">
            {formatFipeCurrency(quote.priceReais)}
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
            <span>
              Mês de referência: <strong className="text-foreground">{quote.referenceLabel}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Calculadora Rápida de Margem de Negociação */}
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="h-4 w-4 text-amber-500" />
          <h3 className="text-sm font-bold text-foreground">Calculadora de Negociação</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          {[0.70, 0.80, 0.90].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => setMargin(pct)}
              className={`flex-1 min-w-[60px] min-h-[44px] px-2 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                margin === pct
                  ? 'bg-amber-500 border-amber-500 text-zinc-950 shadow-sm'
                  : 'bg-background border-border text-muted-foreground hover:border-amber-500/50'
              }`}
            >
              {Math.round(pct * 100)}%
            </button>
          ))}
          
          <div className="relative flex-1 min-w-[90px]">
            <input
              type="number"
              inputMode="numeric"
              min="1"
              max="200"
              value={Math.round(margin * 100)}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (val > 0) setMargin(val / 100);
              }}
              className="w-full min-h-[44px] pl-3 pr-7 py-1.5 text-center text-sm font-bold rounded-lg border border-border bg-background text-foreground focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
              %
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-background/50 rounded-lg border border-border/50">
          <span className="text-xs font-semibold text-muted-foreground">
            Sugestão para Compra ({(margin * 100).toFixed(0)}%)
          </span>
          <span className="text-lg font-black text-amber-500">
            {formatFipeCurrency(suggestedPrice)}
          </span>
        </div>
      </div>

      {/* Grid de Especificações Técnicas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/60 bg-secondary/30 p-3.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Calendar className="h-3.5 w-3.5 text-[#c9a44c]" />
            <span>Ano Modelo</span>
          </div>
          <p className="text-sm font-semibold text-foreground">
            {formatModelYear(quote.year, quote.isZeroKm)}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-secondary/30 p-3.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Fuel className="h-3.5 w-3.5 text-[#c9a44c]" />
            <span>Combustível</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{quote.fuelName || 'Gasolina'}</p>
        </div>

        <div className="rounded-xl border border-border/60 bg-secondary/30 p-3.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Hash className="h-3.5 w-3.5 text-[#c9a44c]" />
            <span>Código FIPE</span>
          </div>
          <p className="text-sm font-mono font-semibold text-foreground">
            {quote.fipeCode || 'Não informado'}
          </p>
        </div>

        <div className="rounded-xl border border-border/60 bg-secondary/30 p-3.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <Clock className="h-3.5 w-3.5 text-[#c9a44c]" />
            <span>Provedor</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{quote.providerLabel}</p>
        </div>
      </div>

      {/* Analytics Adicionais (se retornados pela API) */}
      {analytics && (
        <div className="rounded-xl border border-border/60 bg-secondary/20 p-4 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Métricas de Mercado & Desvalorização
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            {analytics.changeFromPreviousMonthPct !== null && (
              <div>
                <span className="text-muted-foreground">Variação mensal</span>
                <div className="flex items-center gap-1 font-semibold text-sm mt-0.5">
                  {analytics.changeFromPreviousMonthPct >= 0 ? (
                    <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
                  )}
                  <span
                    className={
                      analytics.changeFromPreviousMonthPct >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }
                  >
                    {analytics.changeFromPreviousMonthPct.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}

            {analytics.annualDepreciationRate !== null && (
              <div>
                <span className="text-muted-foreground">Depreciação anual</span>
                <div className="font-semibold text-sm text-foreground mt-0.5">
                  {analytics.annualDepreciationRate.toFixed(2)}%
                </div>
              </div>
            )}

            {analytics.valueRetentionPct !== null && (
              <div>
                <span className="text-muted-foreground">Retenção de valor</span>
                <div className="font-semibold text-sm text-[#e3c56c] mt-0.5">
                  {analytics.valueRetentionPct.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action Bar (Mobile First) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-border/60">
        {onSave && (
          <button
            onClick={onSave}
            disabled={isSaving || isSaved}
            type="button"
            className={`w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm ${
              isSaved
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-secondary border border-border text-foreground hover:border-border/80'
            } disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {isSaved ? (
              <>
                <Check className="h-4 w-4" />
                <span>Salvo no Histórico</span>
              </>
            ) : isSaving ? (
              <span>Salvando...</span>
            ) : (
              <>
                <Bookmark className="h-4 w-4" />
                <span>Salvar Histórico</span>
              </>
            )}
          </button>
        )}

        {onOpenLinker && (
          <button
            onClick={onOpenLinker}
            type="button"
            className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <LinkIcon className="h-4 w-4" />
            <span>Vincular Estoque</span>
          </button>
        )}

        <button
          onClick={handleShare}
          type="button"
          className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background text-foreground hover:bg-secondary text-xs font-bold transition-all cursor-pointer shadow-sm"
        >
          <Copy className="h-4 w-4" />
          <span>Copiar Resumo</span>
        </button>
      </div>
    </div>
  );
}
