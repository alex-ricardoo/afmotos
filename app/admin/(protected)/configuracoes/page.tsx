import { getSettings } from '@/lib/actions/settings';
import { SettingsForm } from '@/components/admin/settings-form';

export const metadata = {
  title: 'Configurações | AF Motos Admin',
};

export default async function ConfiguracoesPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Configurações da Loja</h1>
      </div>

      <p className="text-muted-foreground">
        Gerencie as informações públicas e de contato da sua loja que aparecerão no site.
      </p>

      <SettingsForm initialData={settings} />
    </div>
  );
}
