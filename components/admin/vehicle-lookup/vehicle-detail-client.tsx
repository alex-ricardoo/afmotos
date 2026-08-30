'use client';

import React, { useState } from 'react';
import type { InternalVehicleConsultationDto } from '@/lib/vehicle-lookup/types';
import { VehicleDetailHeader } from './vehicle-detail-header';
import { VehicleLinkModal } from './vehicle-link-modal';
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

export function VehicleDetailClient({ dto, motorcycles }: VehicleDetailClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('summary');
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

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

      {/* Tabs Navigation */}
      <div className="border-b border-border/80 overflow-x-auto scrollbar-none">
        <div className="flex gap-1 min-w-max pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold rounded-t-xl transition-all border-b-2 ${
                  isActive
                    ? 'border-primary text-primary bg-primary/5 font-bold shadow-xs'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
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
