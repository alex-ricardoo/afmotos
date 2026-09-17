export type LegalDocumentSlug = 'privacy_policy' | 'terms_of_use' | 'cookie_policy';

export type LegalDocumentVersionStatus = 'draft' | 'published' | 'archived';

export type AcceptanceSource =
  'signup' | 'login_reacceptance' | 'account_settings' | 'checkout' | 'oauth_completion';

export type PrivacyRequestType =
  | 'confirmation'
  | 'access'
  | 'correction'
  | 'anonymization_or_deletion'
  | 'portability'
  | 'sharing_info'
  | 'consent_revocation'
  | 'other';

export type PrivacyRequestStatus = 'pending' | 'in_analysis' | 'completed' | 'rejected';

export interface LegalDocument {
  id: string;
  slug: LegalDocumentSlug;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LegalDocumentVersion {
  id: string;
  document_id: string;
  version: string;
  title: string;
  summary: string | null;
  content_markdown: string;
  content_hash: string;
  status: LegalDocumentVersionStatus;
  published_at: string | null;
  effective_at: string | null;
  requires_reacceptance: boolean;
  created_by: string | null;
  published_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegalDocumentAcceptance {
  id: string;
  user_id: string;
  document_version_id: string;
  document_slug: LegalDocumentSlug;
  version: string;
  accepted_at: string;
  acceptance_source: AcceptanceSource;
  ip_hash: string | null;
  user_agent_category: string | null;
  locale: string;
  created_at: string;
}

export interface PrivacyRequest {
  id: string;
  user_id: string;
  protocol_number: string;
  request_type: PrivacyRequestType;
  status: PrivacyRequestStatus;
  details: string;
  contact_email: string;
  contact_phone: string | null;
  response_notes: string | null;
  handled_by: string | null;
  handled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublishedLegalDocumentDto {
  id: string;
  slug: LegalDocumentSlug;
  title: string;
  version: string;
  summary: string | null;
  contentMarkdown: string;
  contentHash: string;
  publishedAt: string;
  effectiveAt: string;
  lastUpdatedAt: string;
  institution: {
    siteName: string;
    cnpj: string | null;
    contactEmail: string | null;
    whatsappPhone: string;
    address: string | null;
  };
}

export interface UserComplianceStatus {
  isCompliant: boolean;
  missingVersions: Array<{
    id: string;
    slug: LegalDocumentSlug;
    title: string;
    version: string;
    summary: string | null;
  }>;
  acceptedVersions: Array<{
    id: string;
    slug: LegalDocumentSlug;
    version: string;
    acceptedAt: string;
    acceptanceSource: AcceptanceSource;
  }>;
}

export interface CookiePreferences {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
}
