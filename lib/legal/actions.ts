'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  calculateContentHash,
  hashClientIp,
  categorizeUserAgent,
  generateProtocolNumber,
} from './crypto';
import {
  AcceptanceSource,
  PrivacyRequestType,
  PrivacyRequestStatus,
  LegalDocumentSlug,
} from './types';

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server action to record acceptance of legal document versions for the current user.
 * Idempotent: duplicates are ignored without error.
 */
export async function recordDocumentAcceptanceAction(payload: {
  documentVersionIds: string[];
  acceptanceSource: AcceptanceSource;
}): Promise<ActionResult<{ acceptedCount: number }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuário não autenticado.' };
  }

  if (!payload.documentVersionIds || payload.documentVersionIds.length === 0) {
    return { success: false, error: 'Nenhuma versão informada para aceite.' };
  }

  const headerList = await headers();
  const forwardedFor = headerList.get('x-forwarded-for');
  const realIp = headerList.get('x-real-ip');
  const clientIp = forwardedFor || realIp || null;
  const ipHash = hashClientIp(clientIp);

  const userAgent = headerList.get('user-agent');
  const userAgentCategory = categorizeUserAgent(userAgent);
  const locale = headerList.get('accept-language')?.split(',')[0] || 'pt-BR';

  const adminClient = createAdminClient();

  // Fetch version details to confirm they exist and get document slug
  const { data: versions, error: versionsError } = await adminClient
    .from('legal_document_versions')
    .select('id, version, legal_documents!inner(slug)')
    .in('id', payload.documentVersionIds);

  if (versionsError || !versions || versions.length === 0) {
    console.error('[recordDocumentAcceptanceAction] versions lookup error:', versionsError);
    return { success: false, error: 'Versões não encontradas para registro.' };
  }

  type VersionQueryResult = {
    id: string;
    version: string;
    legal_documents: { slug: string } | { slug: string }[];
  };

  const insertRows = (versions as unknown as VersionQueryResult[]).map((v) => {
    const slug = Array.isArray(v.legal_documents)
      ? v.legal_documents[0]?.slug
      : v.legal_documents?.slug;
    return {
      user_id: user.id,
      document_version_id: v.id,
      document_slug: slug || 'unknown',
      version: v.version,
      acceptance_source: payload.acceptanceSource,
      ip_hash: ipHash,
      user_agent_category: userAgentCategory,
      locale,
    };
  });

  const { error: insertError } = await adminClient
    .from('legal_document_acceptances')
    .upsert(insertRows, {
      onConflict: 'user_id, document_version_id',
      ignoreDuplicates: true,
    });

  if (insertError) {
    console.error('[recordDocumentAcceptanceAction] insert error:', insertError);
    return { success: false, error: 'Erro ao registrar aceite no banco de dados.' };
  }

  console.info('[LEGAL_DOCUMENTS] legal_document.acceptance_recorded', {
    userIdMasked: `${user.id.slice(0, 4)}...${user.id.slice(-4)}`,
    acceptanceSource: payload.acceptanceSource,
    versionsCount: insertRows.length,
    timestamp: new Date().toISOString(),
  });

  revalidatePath('/cliente');
  revalidatePath('/cliente/perfil');
  return { success: true, data: { acceptedCount: insertRows.length } };
}

/**
 * Server action for a customer to create a formal LGPD privacy request.
 */
export async function createPrivacyRequestAction(payload: {
  requestType: PrivacyRequestType;
  details: string;
  contactEmail: string;
  contactPhone?: string;
}): Promise<ActionResult<{ protocolNumber: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Você precisa estar logado para abrir uma solicitação.' };
  }

  if (!payload.details || payload.details.trim().length < 10) {
    return {
      success: false,
      error: 'Por favor, descreva sua solicitação com mais detalhes (mínimo 10 caracteres).',
    };
  }

  if (!payload.contactEmail || !payload.contactEmail.includes('@')) {
    return { success: false, error: 'Informe um e-mail válido para resposta.' };
  }

  const protocolNumber = generateProtocolNumber();
  const adminClient = createAdminClient();

  const { error } = await adminClient.from('privacy_requests').insert({
    user_id: user.id,
    protocol_number: protocolNumber,
    request_type: payload.requestType,
    status: 'pending',
    details: payload.details.trim(),
    contact_email: payload.contactEmail.trim().toLowerCase(),
    contact_phone: payload.contactPhone?.trim() || null,
  });

  if (error) {
    console.error('[createPrivacyRequestAction] insert error:', error);
    return { success: false, error: 'Não foi possível registrar a solicitação. Tente novamente.' };
  }

  console.info('[LEGAL_DOCUMENTS] legal_document.privacy_request_created', {
    protocolNumber,
    requestType: payload.requestType,
    userIdMasked: `${user.id.slice(0, 4)}...${user.id.slice(-4)}`,
    timestamp: new Date().toISOString(),
  });

  revalidatePath('/cliente/perfil');
  return { success: true, data: { protocolNumber } };
}

/**
 * Server action for active admin to update status and respond to an LGPD privacy request.
 */
export async function adminUpdatePrivacyRequestAction(payload: {
  requestId: string;
  status: PrivacyRequestStatus;
  responseNotes: string;
}): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Não autorizado.' };
  }

  // Validate active admin
  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('id, role, is_active')
    .eq('auth_user_id', user.id)
    .eq('is_active', true)
    .in('role', ['admin', 'super_admin'])
    .maybeSingle();

  if (!adminProfile) {
    return { success: false, error: 'Acesso restrito a administradores ativos.' };
  }

  const adminClient = createAdminClient();
  const { error } = await adminClient
    .from('privacy_requests')
    .update({
      status: payload.status,
      response_notes: payload.responseNotes?.trim() || null,
      handled_by: user.id,
      handled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', payload.requestId);

  if (error) {
    console.error('[adminUpdatePrivacyRequestAction] error:', error);
    return { success: false, error: error.message };
  }

  console.info('[LEGAL_DOCUMENTS] legal_document.privacy_request_status_updated', {
    requestIdMasked: `${payload.requestId.slice(0, 4)}...`,
    status: payload.status,
    adminIdMasked: `${user.id.slice(0, 4)}...`,
    timestamp: new Date().toISOString(),
  });

  revalidatePath('/admin/configuracoes/documentos-legais');
  return { success: true };
}

/**
 * Server action for active admin to publish a legal document version.
 */
export async function adminPublishVersionAction(payload: {
  versionId: string;
  confirmationWord: string;
}): Promise<ActionResult<{ contentHash: string }>> {
  if (payload.confirmationWord !== 'PUBLICAR') {
    return { success: false, error: 'Digite a palavra exata "PUBLICAR" para confirmar.' };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Não autorizado.' };
  }

  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('id, role, is_active')
    .eq('auth_user_id', user.id)
    .eq('is_active', true)
    .in('role', ['admin', 'super_admin'])
    .maybeSingle();

  if (!adminProfile) {
    return { success: false, error: 'Acesso restrito a administradores ativos.' };
  }

  const adminClient = createAdminClient();

  // 1. Fetch draft version
  const { data: versionRow, error: fetchError } = await adminClient
    .from('legal_document_versions')
    .select('id, document_id, version, content_markdown, status')
    .eq('id', payload.versionId)
    .maybeSingle();

  if (fetchError || !versionRow) {
    return { success: false, error: 'Versão não encontrada.' };
  }

  if (versionRow.status === 'published') {
    return { success: false, error: 'Esta versão já se encontra publicada e é imutável.' };
  }

  // 2. Compute SHA-256 hash
  const contentHash = calculateContentHash(versionRow.content_markdown);
  const now = new Date().toISOString();

  // 3. Archive previously published versions of this document
  await adminClient
    .from('legal_document_versions')
    .update({ status: 'archived', updated_at: now })
    .eq('document_id', versionRow.document_id)
    .eq('status', 'published');

  // 4. Set target version as published
  const { error: pubError } = await adminClient
    .from('legal_document_versions')
    .update({
      status: 'published',
      content_hash: contentHash,
      published_at: now,
      effective_at: now,
      published_by: user.id,
      updated_at: now,
    })
    .eq('id', payload.versionId);

  if (pubError) {
    console.error('[adminPublishVersionAction] error:', pubError);
    return { success: false, error: 'Erro ao publicar versão.' };
  }

  console.info('[LEGAL_DOCUMENTS] legal_document.version_published', {
    versionIdMasked: `${payload.versionId.slice(0, 4)}...`,
    contentHashShort: contentHash.slice(0, 8),
    adminIdMasked: `${user.id.slice(0, 4)}...`,
    timestamp: now,
  });

  revalidatePath('/politica-de-privacidade');
  revalidatePath('/termos-de-uso');
  revalidatePath('/admin/configuracoes/documentos-legais');
  return { success: true, data: { contentHash } };
}

/**
 * Server action for active admin to create a new draft version.
 */
export async function adminCreateDraftVersionAction(payload: {
  documentSlug: LegalDocumentSlug;
  version: string;
  title: string;
  summary?: string;
  contentMarkdown: string;
  requiresReacceptance: boolean;
}): Promise<ActionResult<{ versionId: string }>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Não autorizado.' };
  }

  const { data: adminProfile } = await supabase
    .from('admin_profiles')
    .select('id, role, is_active')
    .eq('auth_user_id', user.id)
    .eq('is_active', true)
    .in('role', ['admin', 'super_admin'])
    .maybeSingle();

  if (!adminProfile) {
    return { success: false, error: 'Acesso restrito a administradores ativos.' };
  }

  if (!payload.version || !/^\d+\.\d+(\.\d+)?$/.test(payload.version.trim())) {
    return { success: false, error: 'Informe um número de versão válido (ex: 1.1.0).' };
  }

  if (!payload.title || payload.title.trim().length < 3) {
    return { success: false, error: 'Título do documento obrigatório.' };
  }

  if (!payload.contentMarkdown || payload.contentMarkdown.trim().length < 50) {
    return { success: false, error: 'Conteúdo do documento muito curto.' };
  }

  const adminClient = createAdminClient();

  // Find document
  const { data: doc, error: docError } = await adminClient
    .from('legal_documents')
    .select('id')
    .eq('slug', payload.documentSlug)
    .maybeSingle();

  if (docError || !doc) {
    return { success: false, error: 'Documento base não encontrado.' };
  }

  const contentHash = calculateContentHash(payload.contentMarkdown);

  const { data: newVersion, error: insertError } = await adminClient
    .from('legal_document_versions')
    .insert({
      document_id: doc.id,
      version: payload.version.trim(),
      title: payload.title.trim(),
      summary: payload.summary?.trim() || null,
      content_markdown: payload.contentMarkdown.trim(),
      content_hash: contentHash,
      status: 'draft',
      requires_reacceptance: Boolean(payload.requiresReacceptance),
      created_by: user.id,
    })
    .select('id')
    .single();

  if (insertError) {
    if (insertError.message?.includes('duplicate key') || insertError.code === '23505') {
      return { success: false, error: 'Já existe uma versão com este número para este documento.' };
    }
    console.error('[adminCreateDraftVersionAction] error:', insertError);
    return { success: false, error: insertError.message };
  }

  console.info('[LEGAL_DOCUMENTS] legal_document.draft_created', {
    versionIdMasked: `${newVersion.id.slice(0, 4)}...`,
    slug: payload.documentSlug,
    version: payload.version,
    adminIdMasked: `${user.id.slice(0, 4)}...`,
    timestamp: new Date().toISOString(),
  });

  revalidatePath('/admin/configuracoes/documentos-legais');
  return { success: true, data: { versionId: newVersion.id } };
}
