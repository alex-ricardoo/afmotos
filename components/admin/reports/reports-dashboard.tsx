'use client';

import React, { useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Bike,
  Users,
  Building,
  Download,
  RotateCcw,
} from 'lucide-react';
import {
  OverviewReportData,
  SalesReportData,
  FinancialReportData,
  InventoryReportData,
  CustomersReportData,
  ReportDateRange,
} from '@/lib/reports/types';
import { cn } from '@/lib/utils';
import { ReportPeriodFilter } from './report-period-filter';
import { ReportExportDialog } from './report-export-dialog';
import { OverviewTab } from './tabs/overview-tab';
import { SalesTab } from './tabs/sales-tab';
import { FinancialTab } from './tabs/financial-tab';
import { InventoryTab } from './tabs/inventory-tab';
import { CustomersTab } from './tabs/customers-tab';
import { AccountantTab } from './tabs/accountant-tab';

interface ReportsDashboardProps {
  overviewData: OverviewReportData;
  salesData: SalesReportData;
  financialData: FinancialReportData;
  inventoryData: InventoryReportData;
  customersData: CustomersReportData;
  dateRange: ReportDateRange;
}

const TABS = [
  { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
  { id: 'sales', label: 'Vendas', icon: Receipt },
  { id: 'financial', label: 'Financeiro', icon: Wallet },
  { id: 'inventory', label: 'Estoque', icon: Bike },
  { id: 'customers', label: 'Clientes & Comercial', icon: Users },
  { id: 'accountant', label: 'Contador', icon: Building },
];

export function ReportsDashboard({
  overviewData,
  salesData,
  financialData,
  inventoryData,
  customersData,
  dateRange,
}: ReportsDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeTab = searchParams.get('tab') || 'overview';
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleRefresh = () => {
    router.refresh();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 1. Header com Título, Seletor de Período e Ações */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-900/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Central de Relatórios
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#c9a44c]/20 text-[#e3c56c] border border-[#c9a44c]/40">
              Gerencial
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Acompanhe faturamento, despesas, margem, giro de estoque e exportações contábeis.
          </p>
        </div>

        {/* Global Period Filter & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <ReportPeriodFilter currentDateRange={dateRange} />

          <button
            onClick={handleRefresh}
            title="Atualizar dados do relatório"
            className="p-2.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 shadow-xs transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsExportDialogOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#c9a44c] hover:bg-[#d8b35a] text-black font-extrabold text-xs shadow-md transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* 2. Barra de Navegação por Abas (Horizontal Scrollable on Mobile) */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 overflow-x-auto no-scrollbar select-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0',
                isActive
                  ? 'bg-gradient-to-r from-[#c9a44c]/20 to-[#c9a44c]/10 text-white border border-[#c9a44c]/40 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50',
              )}
            >
              <Icon
                className={cn('w-4 h-4 transition-colors', isActive ? 'text-[#e3c56c]' : 'text-zinc-500')}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Conteúdo da Aba Ativa */}
      <div>
        {activeTab === 'overview' && <OverviewTab data={overviewData} />}
        {activeTab === 'sales' && <SalesTab data={salesData} />}
        {activeTab === 'financial' && <FinancialTab data={financialData} />}
        {activeTab === 'inventory' && <InventoryTab data={inventoryData} />}
        {activeTab === 'customers' && <CustomersTab data={customersData} />}
        {activeTab === 'accountant' && <AccountantTab dateRange={dateRange} />}
      </div>

      {/* 4. Modal de Exportação Global */}
      <ReportExportDialog
        dateRange={dateRange}
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />
    </div>
  );
}
