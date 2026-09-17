import { createClient } from '@/lib/supabase/server';
import { getSettings } from '@/lib/actions/settings';
import {
  PublishedLegalDocumentDto,
  UserComplianceStatus,
  PrivacyRequest,
  LegalDocumentSlug,
} from './types';
import { getDefaultDocumentDefinition, renderLegalTemplate } from './default-documents';

/**
 * Retrieves the published legal document version with fallback to code-defined default.
 */
export async function getPublishedDocument(
  slug: LegalDocumentSlug,
): Promise<PublishedLegalDocumentDto> {
  const settings = await getSettings();
  const defaultDoc = getDefaultDocumentDefinition(
    slug === 'privacy_policy' ? 'privacy_policy' : 'terms_of_use',
    settings ?? undefined,
  );

  try {
    const supabase = await createClient();

    // Query published version from DB
    const { data, error } = await supabase
      .from('legal_documents')
      .select(
        `
        id,
        slug,
        name,
        legal_document_versions!inner (
          id,
          version,
          title,
          summary,
          content_markdown,
          content_hash,
          status,
          published_at,
          effective_at,
          updated_at
        )
      `,
      )
      .eq('slug', slug)
      .eq('legal_document_versions.status', 'published')
      .order('published_at', { referencedTable: 'legal_document_versions', ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data || !data.legal_document_versions?.[0]) {
      return defaultDoc;
    }

    const versionRow = data.legal_document_versions[0];
    const rawMarkdown = versionRow.content_markdown;

    // Render variables if template markers exist
    const renderedMarkdown = renderLegalTemplate(rawMarkdown, {
      siteName: settings?.site_name || defaultDoc.institution.siteName,
      cnpj: settings?.cnpj || defaultDoc.institution.cnpj,
      contactEmail: settings?.contact_email || defaultDoc.institution.contactEmail,
      whatsappPhone: settings?.whatsapp_phone || defaultDoc.institution.whatsappPhone,
      address: settings?.address || defaultDoc.institution.address,
      version: versionRow.version,
      lastUpdatedDate: new Date(
        versionRow.updated_at || versionRow.published_at,
      ).toLocaleDateString('pt-BR'),
      contentHash: versionRow.content_hash,
    });

    return {
      id: versionRow.id,
      slug: data.slug as LegalDocumentSlug,
      title: versionRow.title,
      version: versionRow.version,
      summary: versionRow.summary,
      contentMarkdown: renderedMarkdown,
      contentHash: versionRow.content_hash,
      publishedAt: versionRow.published_at || defaultDoc.publishedAt,
      effectiveAt: versionRow.effective_at || defaultDoc.effectiveAt,
      lastUpdatedAt: versionRow.updated_at || versionRow.published_at || defaultDoc.lastUpdatedAt,
      institution: {
        siteName: settings?.site_name || defaultDoc.institution.siteName,
        cnpj: settings?.cnpj || defaultDoc.institution.cnpj,
        contactEmail: settings?.contact_email || defaultDoc.institution.contactEmail,
        whatsappPhone: settings?.whatsapp_phone || defaultDoc.institution.whatsappPhone,
        address: settings?.address || defaultDoc.institution.address,
      },
    };
  } catch (err) {
    console.warn('[getPublishedDocument] Database read failed, using default:', err);
    return defaultDoc;
  }
}

/**
 * Checks whether an authenticated user has accepted the published versions of required legal documents.
 */
export async function getUserComplianceStatus(userId: string): Promise<UserComplianceStatus> {
  if (!userId) {
    return {
      isCompliant: false,
      missingVersions: [],
      acceptedVersions: [],
    };
  }

  try {
    const supabase = await createClient();

    // 1. Fetch currently published versions for terms and privacy
    const { data: activeDocs, error: docsError } = await supabase
      .from('legal_documents')
      .select(
        `
        id,
        slug,
        legal_document_versions!inner (
          id,
          version,
          title,
          summary,
          status,
          requires_reacceptance
        )
      `,
      )
      .in('slug', ['privacy_policy', 'terms_of_use'])
      .eq('legal_document_versions.status', 'published');

    if (docsError || !activeDocs || activeDocs.length === 0) {
      // If no published versions are in DB yet, assume compliant to avoid blocking users
      return {
        isCompliant: true,
        missingVersions: [],
        acceptedVersions: [],
      };
    }

    // 2. Fetch user's recorded acceptances
    const { data: acceptances, error: acceptancesError } = await supabase
      .from('legal_document_acceptances')
      .select('id, document_version_id, document_slug, version, accepted_at, acceptance_source')
      .eq('user_id', userId);

    if (acceptancesError) {
      console.warn('[getUserComplianceStatus] acceptances error:', acceptancesError);
      return {
        isCompliant: true,
        missingVersions: [],
        acceptedVersions: [],
      };
    }

    const acceptedVersionIdSet = new Set((acceptances || []).map((a) => a.document_version_id));
    const missingVersions: UserComplianceStatus['missingVersions'] = [];

    for (const doc of activeDocs) {
      const activeVersion = doc.legal_document_versions?.[0];
      if (activeVersion && !acceptedVersionIdSet.has(activeVersion.id)) {
        missingVersions.push({
          id: activeVersion.id,
          slug: doc.slug as LegalDocumentSlug,
          title: activeVersion.title,
          version: activeVersion.version,
          summary: activeVersion.summary,
        });
      }
    }

    const acceptedList = (acceptances || []).map((a) => ({
      id: a.id,
      slug: a.document_slug as LegalDocumentSlug,
      version: a.version,
      acceptedAt: a.accepted_at,
      acceptanceSource: a.acceptance_source,
    }));

    return {
      isCompliant: missingVersions.length === 0,
      missingVersions,
      acceptedVersions: acceptedList,
    };
  } catch (err) {
    console.error('[getUserComplianceStatus] unexpected error:', err);
    return {
      isCompliant: true,
      missingVersions: [],
      acceptedVersions: [],
    };
  }
}

/**
 * Retrieves privacy requests opened by the authenticated customer.
 */
export async function getCustomerPrivacyRequests(userId: string): Promise<PrivacyRequest[]> {
  if (!userId) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('privacy_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getCustomerPrivacyRequests] error:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[getCustomerPrivacyRequests] error:', err);
    return [];
  }
}

/**
 * Retrieves all privacy requests for admin oversight.
 */
export async function getAdminPrivacyRequests(): Promise<PrivacyRequest[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('privacy_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getAdminPrivacyRequests] error:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[getAdminPrivacyRequests] error:', err);
    return [];
  }
}
