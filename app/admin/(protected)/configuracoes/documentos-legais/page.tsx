import React from 'react';
import Link from 'next/link';
import { Scale } from 'lucide-react';
import { getSettings } from '@/lib/actions/settings';
import { getPublishedDocument, getAdminPrivacyRequests } from '@/lib/legal/queries';
import { LegalDocumentsManager } from '@/components/admin/legal-documents-manager';

export const metadata = {
  title: 'Documentos Legais & LGPD | Painel Admin | AF Veículos PE',
  description: 'Gestão de versões, imutabilidade SHA-256 e solicitações LGPD de titulares.',
};

export default async function AdminDocumentosLegaisPage() {
  const [settings, termsDoc, privacyDoc, privacyRequests] = await Promise.all([
    getSettings(),
    getPublishedDocument('terms_of_use'),
    getPublishedDocument('privacy_policy'),
    getAdminPrivacyRequests(),
  ]);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Breadcrumbs & Header */}
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
          <Link href="/admin" className="hover:text-amber-400 transition-colors">
            Admin
          </Link>
          <span>/</span>
          <Link href="/admin/configuracoes" className="hover:text-amber-400 transition-colors">
            Configurações
          </Link>
          <span>/</span>
          <span className="text-white font-medium">Documentos Legais & LGPD</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 shadow-sm">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white font-heading">
              Documentos Legais & LGPD
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
              Gestão de versões imutáveis, publicação assistida com SHA-256 e atendimento a
              titulares.
            </p>
          </div>
        </div>
      </div>

      <LegalDocumentsManager
        termsDoc={termsDoc}
        privacyDoc={privacyDoc}
        privacyRequests={privacyRequests}
        storeSettings={{
          site_name: settings?.site_name,
          cnpj: settings?.cnpj,
          contact_email: settings?.contact_email,
          whatsapp_phone: settings?.whatsapp_phone,
          address: settings?.address,
        }}
      />
    </div>
  );
}
