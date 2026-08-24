import { getSettings } from '@/lib/actions/settings';
import { SettingsForm } from '@/components/admin/settings-form';
import Link from 'next/link';
import { Settings as SettingsIcon, Sliders } from 'lucide-react';

export const metadata = {
  title: 'Configurações da Loja | AF Motos Admin',
};

export default async function ConfiguracoesPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-2">
          <Link href="/admin" className="hover:text-amber-400 transition-colors">
            Admin
          </Link>
          <span>/</span>
          <span className="text-white font-medium">Configurações</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Configurações da Loja
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Gerencie a identidade visual, canais de contato e links públicos da AF Motos.
            </p>
          </div>
        </div>
      </div>

      <SettingsForm initialData={settings} />
    </div>
  );
}
