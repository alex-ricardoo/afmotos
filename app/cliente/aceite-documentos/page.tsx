import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/actions/settings';
import { getUserComplianceStatus } from '@/lib/legal/queries';
import { DocumentAcceptanceFlow } from '@/components/customer/document-acceptance-flow';

export const metadata = {
  title: 'Atualização de Termos e Privacidade | AF Motos',
  description: 'Confirmação de aceite da Política de Privacidade e dos Termos de Uso vigentes.',
};

interface AceiteDocumentosPageProps {
  searchParams: Promise<{
    returnUrl?: string;
  }>;
}

export default async function AceiteDocumentosPage({ searchParams }: AceiteDocumentosPageProps) {
  const resolvedParams = await searchParams;
  const returnUrl = resolvedParams.returnUrl || '/cliente';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/cliente/login?returnUrl=${encodeURIComponent('/cliente/aceite-documentos')}`);
  }

  const compliance = await getUserComplianceStatus(user.id);

  // If already compliant, redirect back to returnUrl
  if (compliance.isCompliant) {
    redirect(returnUrl);
  }

  const settings = await getSettings();
  const siteName = settings?.site_name || 'AF Motos';

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <DocumentAcceptanceFlow
        missingDocuments={compliance.missingVersions}
        returnUrl={returnUrl}
        siteName={siteName}
      />
    </div>
  );
}
