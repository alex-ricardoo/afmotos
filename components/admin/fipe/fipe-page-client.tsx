'use client';

import { useState } from 'react';
import { FipeExpandedResult, FipeQuote } from '@/lib/fipex/types';
import { FipeConsultationWithMotorcycle } from '@/lib/queries/fipe-consultations';
import { FipeSearchForm } from './fipe-search-form';
import { FipeResultCard } from './fipe-result-card';
import { FipeMotorcycleLinker, MotorcycleForLinker } from './fipe-motorcycle-linker';
import { FipePriceComparison } from './fipe-price-comparison';
import { FipeHistorySection } from './fipe-history-section';
import {
  saveFipeConsultation,
  updateFipeConsultationNotes,
  linkFipeConsultationToMotorcycle,
  deleteFipeConsultation,
} from '@/lib/actions/fipe-consultations';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

interface FipePageClientProps {
  initialMotorcycles: MotorcycleForLinker[];
  initialConsultations: FipeConsultationWithMotorcycle[];
}

export function FipePageClient({ initialMotorcycles, initialConsultations }: FipePageClientProps) {
  // Estado da cotação ativa
  const [activeExpanded, setActiveExpanded] = useState<FipeExpandedResult | null>(null);
  const [activeQuote, setActiveQuote] = useState<FipeQuote | null>(null);
  const [queryPayload, setQueryPayload] = useState<Record<string, unknown> | null>(null);

  // Estado de persistência e vínculo da cotação ativa
  const [savedConsultationId, setSavedConsultationId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [linkedMotorcycleId, setLinkedMotorcycleId] = useState<string | null>(null);

  // Estado do Modal de Vinculação
  const [isLinkerOpen, setIsLinkerOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  // Lista de histórico local sincronizada com Server Actions
  const [historyList, setHistoryList] =
    useState<FipeConsultationWithMotorcycle[]>(initialConsultations);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Tab State for Mobile-First layout
  const [activeTab, setActiveTab] = useState<'search' | 'history'>('search');

  const handleSearchResult = (expanded: FipeExpandedResult, quote: FipeQuote) => {
    setActiveExpanded(expanded);
    setActiveQuote(quote);
    setIsSaved(false);
    setSavedConsultationId(null);
    setLinkedMotorcycleId(null);
    setActiveTab('search'); // Garante que volta para a aba de pesquisa
  };

  const handleClearForm = () => {
    setActiveExpanded(null);
    setActiveQuote(null);
    setIsSaved(false);
    setSavedConsultationId(null);
    setLinkedMotorcycleId(null);
    setQueryPayload(null);
  };

  // Handler para Salvar Consulta
  const handleSaveConsultation = async () => {
    if (!activeQuote) return;

    setIsSaving(true);
    try {
      const res = await saveFipeConsultation({
        quote: activeQuote,
        queryPayload: queryPayload || {},
        motorcycleId: linkedMotorcycleId,
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      if (res.data) {
        setSavedConsultationId(res.data.id);
        setIsSaved(true);
        toast.success('Consulta salva no histórico com sucesso!');

        // Adicionar localmente ao histórico
        const linkedMoto = initialMotorcycles.find((m) => m.id === linkedMotorcycleId);
        const newItem: FipeConsultationWithMotorcycle = {
          id: res.data.id,
          created_by: 'current-user',
          motorcycle_id: linkedMotorcycleId,
          provider: activeQuote.provider,
          provider_label: activeQuote.providerLabel,
          vehicle_type_id: activeQuote.vehicleTypeId,
          vehicle_type_label: activeQuote.vehicleTypeLabel,
          brand_id: activeQuote.brandId,
          brand_name: activeQuote.brandName,
          model_id: activeQuote.modelId,
          model_name: activeQuote.modelName,
          version_name: activeQuote.versionName,
          model_year: activeQuote.year,
          is_zero_km: activeQuote.isZeroKm,
          fuel_id: activeQuote.fuelId,
          fuel_name: activeQuote.fuelName,
          fuel_acronym: activeQuote.fuelAcronym,
          reference_period_id: activeQuote.referencePeriodId,
          reference_month: activeQuote.referenceMonth,
          reference_year: activeQuote.referenceYear,
          reference_label: activeQuote.referenceLabel,
          fipe_code: activeQuote.fipeCode,
          fipe_price: activeQuote.priceReais,
          currency: 'BRL',
          query_payload: (queryPayload as unknown as import('@/types/database').Json) || {},
          response_snapshot:
            (activeQuote.rawResponse as unknown as import('@/types/database').Json) || {},
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          motorcycles: linkedMoto
            ? {
                id: linkedMoto.id,
                brand: linkedMoto.brand,
                model: linkedMoto.model,
                year_model: linkedMoto.year_model,
                price: linkedMoto.price,
                status: linkedMoto.status,
              }
            : null,
        };

        setHistoryList((prev) => [newItem, ...prev]);
      }
    } catch {
      toast.error('Erro inesperado ao salvar a consulta.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler para Vincular Motocicleta
  const handleLinkMotorcycle = async (motorcycleId: string) => {
    setLinkedMotorcycleId(motorcycleId);

    // Se já estiver salva, atualiza no banco
    if (savedConsultationId) {
      setIsLinking(true);
      try {
        const res = await linkFipeConsultationToMotorcycle(savedConsultationId, motorcycleId);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success('Consulta vinculada à motocicleta com sucesso!');
          setHistoryList((prev) =>
            prev.map((item) => {
              if (item.id === savedConsultationId) {
                const moto = initialMotorcycles.find((m) => m.id === motorcycleId);
                return {
                  ...item,
                  motorcycle_id: motorcycleId,
                  motorcycles: moto
                    ? {
                        id: moto.id,
                        brand: moto.brand,
                        model: moto.model,
                        year_model: moto.year_model,
                        price: moto.price,
                        status: moto.status,
                      }
                    : null,
                };
              }
              return item;
            }),
          );
        }
      } catch {
        toast.error('Erro ao atualizar o vínculo no banco de dados.');
      } finally {
        setIsLinking(false);
      }
    } else {
      toast.info('Motocicleta selecionada para o comparativo.');
    }
  };

  // Handler para Abrir Consulta do Histórico no Card Principal
  const handleOpenHistoricalConsultation = (item: FipeConsultationWithMotorcycle) => {
    const quote: FipeQuote = {
      provider: 'fipex',
      providerLabel: 'fipeX',
      vehicleTypeId: item.vehicle_type_id,
      vehicleTypeLabel: item.vehicle_type_label || 'Motocicletas',
      brandId: item.brand_id || '',
      brandName: item.brand_name,
      modelId: item.model_id || '',
      modelName: item.model_name,
      modelSlug: '',
      versionName: item.version_name,
      year: item.model_year,
      isZeroKm: item.is_zero_km,
      fuelId: item.fuel_id || '',
      fuelName: item.fuel_name || 'Gasolina',
      fuelAcronym: item.fuel_acronym || 'g',
      referencePeriodId: item.reference_period_id || '',
      referenceMonth: item.reference_month || 1,
      referenceYear: item.reference_year || new Date().getFullYear(),
      referenceLabel: item.reference_label || '',
      fipeCode: item.fipe_code,
      priceReais: item.fipe_price || 0,
      currency: 'BRL',
      rawResponse: item.response_snapshot,
    };

    setActiveQuote(quote);
    setActiveExpanded(null);
    setSavedConsultationId(item.id);
    setIsSaved(true);
    setLinkedMotorcycleId(item.motorcycle_id);

    // Scroll suave até o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info(`Consulta de ${item.brand_name} ${item.model_name} carregada.`);
  };

  // Handler para Reconsultar a partir do Histórico (US4)
  const handleRequery = (item: FipeConsultationWithMotorcycle) => {
    const payload = item.query_payload as Record<string, unknown>;
    setQueryPayload(payload);
    setActiveTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info(`Parâmetros de ${item.brand_name} ${item.model_name} carregados no formulário.`);
  };

  // Handler para Atualizar Notas
  const handleUpdateNotes = async (id: string, notes: string) => {
    try {
      const res = await updateFipeConsultationNotes(id, notes);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setHistoryList((prev) => prev.map((c) => (c.id === id ? { ...c, notes } : c)));
      toast.success('Nota atualizada com sucesso.');
    } catch {
      toast.error('Erro ao atualizar nota.');
    }
  };

  // Handler para Excluir Consulta
  const handleDeleteConsultation = async (id: string) => {
    if (!confirm('Deseja realmente remover esta consulta do histórico?')) return;

    setIsDeletingId(id);
    try {
      const res = await deleteFipeConsultation(id);
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setHistoryList((prev) => prev.filter((c) => c.id !== id));
      if (savedConsultationId === id) {
        setSavedConsultationId(null);
        setIsSaved(false);
      }
      toast.success('Consulta removida do histórico.');
    } catch {
      toast.error('Erro ao excluir consulta.');
    } finally {
      setIsDeletingId(null);
    }
  };

  const selectedLinkedMoto = initialMotorcycles.find((m) => m.id === linkedMotorcycleId);

  return (
    <div className="space-y-6 max-w-md mx-auto sm:max-w-xl md:max-w-3xl lg:max-w-7xl pb-12">
      {/* Header Compacto da Página */}
      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <span>FIPE</span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/30">
              FipeX
            </span>
          </h1>
        </div>
      </div>

      {/* Segmented Control (Tabs) */}
      <div className="flex p-1 bg-secondary/50 rounded-xl border border-border/50">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'search'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          🔍 Nova Consulta
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
            activeTab === 'history'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          📑 Histórico ({historyList.length})
        </button>
      </div>

      {/* Area de Conteudo */}
      <div>
        {activeTab === 'search' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-300">
            {/* Coluna do Formulário */}
            <div className="lg:col-span-5 space-y-6">
              <FipeSearchForm
                onResult={handleSearchResult}
                onClear={handleClearForm}
                initialPayload={queryPayload}
              />
            </div>

            {/* Coluna do Resultado da Cotação */}
            <div className="lg:col-span-7 space-y-6">
              {activeQuote ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
                  <FipeResultCard
                    quote={activeQuote}
                    expanded={activeExpanded}
                    onSave={handleSaveConsultation}
                    onOpenLinker={() => setIsLinkerOpen(true)}
                    onRequery={() =>
                      handleRequery({
                        ...activeQuote,
                        query_payload: queryPayload || {},
                      } as unknown as FipeConsultationWithMotorcycle)
                    }
                    isSaving={isSaving}
                    isSaved={isSaved}
                    savedId={savedConsultationId}
                  />

                  {/* Comparativo de Preço se houver moto vinculada */}
                  {selectedLinkedMoto && (
                    <div className="animate-in fade-in duration-300">
                      <FipePriceComparison
                        advertisedPrice={selectedLinkedMoto.price}
                        fipePrice={activeQuote.priceReais}
                        motorcycleTitle={`${selectedLinkedMoto.brand} ${selectedLinkedMoto.model} (${selectedLinkedMoto.year_model})`}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden lg:flex rounded-2xl border border-dashed border-border/80 bg-secondary/10 p-12 text-center space-y-3 flex-col items-center justify-center min-h-[380px]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/60 text-muted-foreground border border-border/60">
                    <Search className="h-6 w-6 opacity-60" />
                  </div>
                  <h3 className="font-bold text-base text-foreground">Nenhuma cotação ativa</h3>
                  <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                    Selecione o tipo, marca, modelo, ano e combustível no formulário ao lado para
                    consultar a cotação oficial de referência FIPE.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="animate-in fade-in duration-300">
            <FipeHistorySection
              consultations={historyList}
              onOpenConsultation={handleOpenHistoricalConsultation}
              onRequery={handleRequery}
              onDelete={handleDeleteConsultation}
              onUpdateNotes={handleUpdateNotes}
              isDeletingId={isDeletingId}
            />
          </div>
        )}
      </div>

      {/* Modal de Vinculação com Moto */}
      {activeQuote && (
        <FipeMotorcycleLinker
          motorcycles={initialMotorcycles}
          quote={activeQuote}
          linkedMotorcycleId={linkedMotorcycleId}
          isOpen={isLinkerOpen}
          onClose={() => setIsLinkerOpen(false)}
          onLink={handleLinkMotorcycle}
          isLinking={isLinking}
        />
      )}

    </div>
  );
}
