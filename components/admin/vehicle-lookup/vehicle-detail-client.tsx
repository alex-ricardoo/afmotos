'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { InternalVehicleConsultationDto } from '@/lib/vehicle-lookup/types';
import type { AdminVehicleShareDetailsDto } from '@/lib/vehicle-lookup/share-types';
import { VehicleDetailHeader } from './vehicle-detail-header';
import { VehicleLinkModal } from './vehicle-link-modal';
import { VehicleShareCard } from './vehicle-share-card';
import { TabSummary } from './tabs/tab-summary';
import { TabVehicleData } from './tabs/tab-vehicle-data';
import { TabDebts } from './tabs/tab-debts';
import { TabRestrictions } from './tabs/tab-restrictions';
import { TabHistory } from './tabs/tab-history';
import { TabFipePricing } from './tabs/tab-fipe-pricing';
import { TabAdsMileage } from './tabs/tab-ads-mileage';
import { TabTechnicalSpecs } from './tabs/tab-technical-specs';
import { TabRawJson } from './tabs/tab-raw-json';
import {
  ShieldCheck,
  FileSpreadsheet,
  DollarSign,
  Lock,
  History,
  Tag,
  Gauge,
  Cpu,
  Code2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface VehicleDetailClientProps {
  dto: InternalVehicleConsultationDto;
  motorcycles: Array<{
    id: string;
    brand: string;
    model: string;
    year_model: number;
    license_plate: string | null;
  }>;
  initialShareDetails?: AdminVehicleShareDetailsDto;
}

type TabKey =
  | 'summary'
  | 'vehicle'
  | 'debts'
  | 'restrictions'
  | 'history'
  | 'fipe'
  | 'ads'
  | 'technical'
  | 'json';

export function VehicleDetailClient({
  dto,
  motorcycles,
  initialShareDetails = { hasActiveShare: false },
}: VehicleDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  // Desktop horizontal scroll support for tabs
  const tabsContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = useCallback(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  }, []);

  useEffect(() => {
    const el = tabsContainerRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [checkScroll]);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = tabsContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === 'left' ? -260 : 260;
    el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0) {
      const el = tabsContainerRef.current;
      if (!el) return;
      el.scrollLeft += e.deltaY;
    }
  };

  const tabs: Array<{ key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'summary', label: 'Resumo & Riscos', icon: ShieldCheck },
    { key: 'vehicle', label: 'Dados do Veículo', icon: FileSpreadsheet },
    { key: 'debts', label: 'Situação & Débitos', icon: DollarSign },
    { key: 'restrictions', label: 'Restrições & Gravames', icon: Lock },
    { key: 'history', label: 'Histórico & Donos', icon: History },
    { key: 'fipe', label: 'Preço & FIPE', icon: Tag },
    { key: 'ads', label: 'Anúncios & Km', icon: Gauge },
    { key: 'technical', label: 'Dados Técnicos', icon: Cpu },
    { key: 'json', label: 'JSON Técnico', icon: Code2 },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <VehicleDetailHeader dto={dto} onOpenLinkModal={() => setIsLinkModalOpen(true)} />

      {/* Share Management Card */}
      <VehicleShareCard
        consultationId={dto.id}
        plateDisplay={dto.plate_display}
        consultationStatus={dto.status}
        initialShareDetails={initialShareDetails}
      />

      {/* Tabs Navigation with Desktop & Mobile Scroll Controls */}
      <div className="relative group border-b border-border/80">
        {/* Left Scroll Button (Desktop) */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 z-10 hidden sm:flex items-center">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              className="h-9 px-2 rounded-lg bg-card/95 hover:bg-muted text-foreground border border-border/80 shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Rolar opções para esquerda"
              title="Rolar abas para esquerda"
            >
              <ChevronLeft className="w-4 h-4 text-primary" />
            </button>
          </div>
        )}

        {/* Scrollable Tabs Track */}
        <div
          ref={tabsContainerRef}
          onWheel={handleWheel}
          className="overflow-x-auto scrollbar-none scroll-smooth px-1"
        >
          <div className="flex gap-1 min-w-max pb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={(e) => {
                    setActiveTab(tab.key);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  }}
                  className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer shrink-0 ${
                    isActive
                      ? 'border-primary text-primary bg-primary/5 font-bold shadow-xs'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Scroll Button (Desktop) */}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 z-10 hidden sm:flex items-center">
            <button
              type="button"
              onClick={() => handleScroll('right')}
              className="h-9 px-2 rounded-lg bg-card/95 hover:bg-muted text-foreground border border-border/80 shadow-md flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
              aria-label="Rolar opções para direita"
              title="Rolar abas para direita"
            >
              <ChevronRight className="w-4 h-4 text-primary" />
            </button>
          </div>
        )}
      </div>

      {/* Active Tab Content */}
      <div className="animate-in fade-in duration-150">
        {activeTab === 'summary' && <TabSummary dto={dto} />}
        {activeTab === 'vehicle' && <TabVehicleData dto={dto} />}
        {activeTab === 'debts' && <TabDebts dto={dto} />}
        {activeTab === 'restrictions' && <TabRestrictions dto={dto} />}
        {activeTab === 'history' && <TabHistory dto={dto} />}
        {activeTab === 'fipe' && <TabFipePricing dto={dto} />}
        {activeTab === 'ads' && <TabAdsMileage dto={dto} />}
        {activeTab === 'technical' && <TabTechnicalSpecs dto={dto} />}
        {activeTab === 'json' && <TabRawJson dto={dto} />}
      </div>

      {/* Link Modal */}
      <VehicleLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        consultationId={dto.id}
        currentMotorcycleId={dto.motorcycle_id}
        motorcycles={motorcycles}
      />
    </div>
  );
}
