import React from 'react';
import Link from 'next/link';
import { ChevronRight, FileSearch, Settings2, Sliders } from 'lucide-react';
import { getSettings } from '@/lib/actions/settings';
import { VehicleHistorySettingsWizard } from '@/components/admin/vehicle-history/vehicle-history-settings-wizard';

export const metadata = {
  title: 'Configuração & Preço do Histórico Veicular | Painel Administrativo',
  description:
    'Gerencie valores de consulta, margem de lucro, estratégias comerciais e textos da página de histórico veicular.',
};

export default async function HistoricoVeicularConfiguracoesPage() {
  const settings = await getSettings();
  const siteName = settings?.site_name || 'AF Motos';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb de Navegação */}
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Link href="/admin" className="hover:text-[#c9a44c] transition-colors">
          Admin
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-zinc-400">Histórico Veicular</span>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
        <span className="text-white font-semibold">Configuração & Preço</span>
      </div>

      {/* Cabeçalho da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
              <span>Histórico Veicular</span>
              <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Configurações & Tarifas
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Defina preços de venda, margem sobre a API Brasil, conformidade jurídica (CDC/CONAR)
              e mensagens para a {siteName}.
            </p>
          </div>
        </div>
      </div>

      {/* Formulário Wizard em Etapas */}
      <VehicleHistorySettingsWizard initialSettings={settings} />
    </div>
  );
}
