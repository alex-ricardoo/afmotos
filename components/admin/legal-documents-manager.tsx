'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  FileText,
  AlertCircle,
  PlusCircle,
  Eye,
  Layers,
  MessageSquare,
  Building,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  adminCreateDraftVersionAction,
  adminPublishVersionAction,
  adminUpdatePrivacyRequestAction,
} from '@/lib/legal/actions';
import {
  LegalDocumentSlug,
  PrivacyRequest,
  PrivacyRequestStatus,
  PublishedLegalDocumentDto,
} from '@/lib/legal/types';

interface LegalDocumentsManagerProps {
  termsDoc: PublishedLegalDocumentDto;
  privacyDoc: PublishedLegalDocumentDto;
  privacyRequests: PrivacyRequest[];
  storeSettings: {
    site_name?: string;
    cnpj?: string | null;
    contact_email?: string | null;
    whatsapp_phone?: string | null;
    address?: string | null;
  };
}

export function LegalDocumentsManager({
  termsDoc,
  privacyDoc,
  privacyRequests: initialRequests,
  storeSettings,
}: LegalDocumentsManagerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'new-draft' | 'requests' | 'settings'>(
    'overview',
  );
  const [privacyRequests, setPrivacyRequests] = useState<PrivacyRequest[]>(initialRequests);
  const [isPending, startTransition] = useTransition();

  // Draft form state
  const [docSlug, setDocSlug] = useState<LegalDocumentSlug>('privacy_policy');
  const [versionNumber, setVersionNumber] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [contentMarkdown, setContentMarkdown] = useState('');
  const [requiresReacceptance, setRequiresReacceptance] = useState(false);

  // Publish Modal State
  const [publishingVersionId, setPublishingVersionId] = useState<string | null>(null);
  const [confirmationWord, setConfirmationWord] = useState('');

  // Request response state
  const [selectedRequest, setSelectedRequest] = useState<PrivacyRequest | null>(null);
  const [responseNotes, setResponseNotes] = useState('');
  const [newStatus, setNewStatus] = useState<PrivacyRequestStatus>('completed');

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const res = await adminCreateDraftVersionAction({
        documentSlug: docSlug,
        version: versionNumber,
        title: docTitle,
        summary,
        contentMarkdown,
        requiresReacceptance,
      });

      if (!res.success) {
        toast.error(res.error || 'Erro ao criar rascunho.');
      } else {
        toast.success(`Rascunho criado com sucesso! ID: ${res.data?.versionId}`);
        setPublishingVersionId(res.data?.versionId || null);
        setActiveTab('overview');
      }
    });
  };

  const handlePublish = () => {
    if (!publishingVersionId) return;

    startTransition(async () => {
      const res = await adminPublishVersionAction({
        versionId: publishingVersionId,
        confirmationWord,
      });

      if (!res.success) {
        toast.error(res.error || 'Erro ao homologar publicação.');
      } else {
        toast.success('Versão publicada com sucesso!');
        setPublishingVersionId(null);
        setConfirmationWord('');
        window.location.reload();
      }
    });
  };

  const handleUpdatePrivacyRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;

    startTransition(async () => {
      const res = await adminUpdatePrivacyRequestAction({
        requestId: selectedRequest.id,
        status: newStatus,
        responseNotes,
      });

      if (!res.success) {
        toast.error(res.error || 'Erro ao atualizar solicitação.');
      } else {
        toast.success('Solicitação atualizada com sucesso!');
        setPrivacyRequests((prev) =>
          prev.map((r) =>
            r.id === selectedRequest.id
              ? { ...r, status: newStatus, response_notes: responseNotes }
              : r,
          ),
        );
        setSelectedRequest(null);
        setResponseNotes('');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('overview')}
          className="text-xs h-9 rounded-xl flex items-center gap-1.5"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Versões Vigentes</span>
        </Button>

        <Button
          variant={activeTab === 'new-draft' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('new-draft')}
          className="text-xs h-9 rounded-xl flex items-center gap-1.5"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Novo Rascunho</span>
        </Button>

        <Button
          variant={activeTab === 'requests' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('requests')}
          className="text-xs h-9 rounded-xl flex items-center gap-1.5 relative"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Solicitações LGPD</span>
          {privacyRequests.filter((r) => r.status === 'pending').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </Button>

        <Button
          variant={activeTab === 'settings' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('settings')}
          className="text-xs h-9 rounded-xl flex items-center gap-1.5"
        >
          <Building className="w-3.5 h-3.5" />
          <span>Dados Empresariais & DPO</span>
        </Button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Política */}
          <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#c9a44c]" />
                <span>Política de Privacidade</span>
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                v{privacyDoc.version}
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {privacyDoc.summary ||
                'Diretrizes oficiais de tratamento de dados pessoais conforme a LGPD.'}
            </p>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1 text-[11px] font-mono text-zinc-400">
              <p>
                Status: <strong className="text-emerald-400">Publicado (Imutável)</strong>
              </p>
              <p>
                Última atualização: {new Date(privacyDoc.lastUpdatedAt).toLocaleDateString('pt-BR')}
              </p>
              <p className="truncate" title={privacyDoc.contentHash}>
                Hash SHA-256: {privacyDoc.contentHash.slice(0, 16)}...
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                href="/politica-de-privacidade"
                target="_blank"
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Ver página pública</span>
                <Eye className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card Termos */}
          <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#c9a44c]" />
                <span>Termos de Uso</span>
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                v{termsDoc.version}
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              {termsDoc.summary ||
                'Regras contratuais de uso da plataforma, créditos e relatórios veiculares.'}
            </p>

            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-1 text-[11px] font-mono text-zinc-400">
              <p>
                Status: <strong className="text-emerald-400">Publicado (Imutável)</strong>
              </p>
              <p>
                Última atualização: {new Date(termsDoc.lastUpdatedAt).toLocaleDateString('pt-BR')}
              </p>
              <p className="truncate" title={termsDoc.contentHash}>
                Hash SHA-256: {termsDoc.contentHash.slice(0, 16)}...
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                href="/termos-de-uso"
                target="_blank"
                className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Ver página pública</span>
                <Eye className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NOVO RASCUNHO */}
      {activeTab === 'new-draft' && (
        <form
          onSubmit={handleCreateDraft}
          className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-4"
        >
          <h3 className="text-base font-bold text-white font-heading">
            Criar Nova Versão (Rascunho)
          </h3>
          <p className="text-xs text-zinc-400">
            Documentos publicados não podem ser alterados diretamente. Redija um rascunho com a nova
            versão semântica e homologue a publicação quando estiver pronto.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-zinc-300 font-semibold">Documento Alvo</Label>
              <select
                value={docSlug}
                onChange={(e) => setDocSlug(e.target.value as LegalDocumentSlug)}
                className="w-full mt-1.5 h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100"
              >
                <option value="privacy_policy">Política de Privacidade</option>
                <option value="terms_of_use">Termos de Uso</option>
              </select>
            </div>

            <div>
              <Label className="text-xs text-zinc-300 font-semibold">Nova Versão (ex: 1.1.0)</Label>
              <Input
                required
                placeholder="1.1.0"
                value={versionNumber}
                onChange={(e) => setVersionNumber(e.target.value)}
                className="mt-1.5 bg-zinc-900 border-zinc-800 text-xs text-zinc-100 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-xs text-zinc-300 font-semibold">Título Formal</Label>
              <Input
                required
                placeholder="Política de Privacidade e Proteção de Dados"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="mt-1.5 bg-zinc-900 border-zinc-800 text-xs text-zinc-100 rounded-xl"
              />
            </div>
          </div>

          <div>
            <Label className="text-xs text-zinc-300 font-semibold">Resumo das Modificações</Label>
            <Input
              placeholder="Descreva brevemente o que mudou nesta versão..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="mt-1.5 bg-zinc-900 border-zinc-800 text-xs text-zinc-100 rounded-xl"
            />
          </div>

          <div>
            <Label className="text-xs text-zinc-300 font-semibold">Conteúdo em Markdown</Label>
            <Textarea
              required
              rows={12}
              placeholder="# Título do Documento&#10;&#10;Escreva o conteúdo legal completo em Markdown..."
              value={contentMarkdown}
              onChange={(e) => setContentMarkdown(e.target.value)}
              className="mt-1.5 bg-zinc-900 border-zinc-800 text-xs text-zinc-100 rounded-xl font-mono leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-2.5 pt-2">
            <Checkbox
              id="requires_reacceptance_chk"
              checked={requiresReacceptance}
              onCheckedChange={(checked) => setRequiresReacceptance(Boolean(checked))}
              className="border-zinc-700 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
            />
            <Label
              htmlFor="requires_reacceptance_chk"
              className="text-xs text-zinc-300 cursor-pointer"
            >
              Exigir novo aceite obrigatório dos usuários existentes após a publicação desta versão
            </Label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <Button
              type="submit"
              disabled={isPending}
              className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              {isPending ? 'Salvando...' : 'Salvar Rascunho'}
            </Button>
          </div>
        </form>
      )}

      {/* TAB 3: SOLICITAÇÕES LGPD */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-4">
            <h3 className="text-base font-bold text-white font-heading">
              Protocolos LGPD de Titulares
            </h3>
            <p className="text-xs text-zinc-400">
              Solicitações formais de acesso, retificação ou exclusão registradas pelos clientes
              através do portal.
            </p>

            {privacyRequests.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                Nenhum protocolo LGPD registrado até o momento.
              </div>
            ) : (
              <div className="space-y-3">
                {privacyRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white">
                          {req.protocol_number}
                        </span>
                        <span className="px-2 py-0.5 rounded-full border text-[10px] font-bold bg-amber-500/10 text-amber-400 border-amber-500/30">
                          {req.status}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(req);
                          setResponseNotes(req.response_notes || '');
                          setNewStatus(req.status);
                        }}
                        className="text-xs h-7 rounded-lg"
                      >
                        Responder / Atualizar
                      </Button>
                    </div>

                    <p className="text-zinc-300">
                      <strong>Tipo:</strong> {req.request_type} &bull; <strong>Contato:</strong>{' '}
                      {req.contact_email}
                    </p>
                    <p className="text-zinc-400 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 text-[11px]">
                      {req.details}
                    </p>
                    {req.response_notes && (
                      <p className="text-emerald-400 text-[11px]">
                        <strong>Parecer gravado:</strong> {req.response_notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DADOS EMPRESARIAIS & DPO */}
      {activeTab === 'settings' && (
        <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-heading">
              Configurações Institucionais e Encarregado (DPO)
            </h3>
            <Link
              href="/admin/configuracoes"
              className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>Editar em Configurações Globais</span>
              <Settings className="w-3.5 h-3.5" />
            </Link>
          </div>
          <p className="text-xs text-zinc-400">
            Estes dados são injetados automaticamente nos templates da Política de Privacidade e dos
            Termos de Uso.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-zinc-500 font-bold block">Nome Comercial</span>
              <span className="text-white font-semibold">
                {storeSettings.site_name || 'AF Motos'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-zinc-500 font-bold block">CNPJ Cadastrado</span>
              <span className="text-white font-semibold">
                {storeSettings.cnpj || '[Não preenchido]'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-zinc-500 font-bold block">E-mail de Contato / DPO</span>
              <span className="text-white font-semibold">
                {storeSettings.contact_email || '[Não preenchido]'}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1">
              <span className="text-zinc-500 font-bold block">WhatsApp Oficial</span>
              <span className="text-white font-semibold">
                {storeSettings.whatsapp_phone || '[Não preenchido]'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE RESPOSTA LGPD */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-900 border border-zinc-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              Atender Protocolo: {selectedRequest.protocol_number}
            </h3>

            <form onSubmit={handleUpdatePrivacyRequest} className="space-y-4">
              <div>
                <Label className="text-xs text-zinc-300 font-semibold">Novo Status</Label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as PrivacyRequestStatus)}
                  className="w-full mt-1.5 h-10 px-3 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-100"
                >
                  <option value="in_analysis">Em análise</option>
                  <option value="completed">Concluído</option>
                  <option value="rejected">Não acolhido</option>
                </select>
              </div>

              <div>
                <Label className="text-xs text-zinc-300 font-semibold">
                  Parecer / Resposta ao Titular
                </Label>
                <Textarea
                  required
                  rows={4}
                  placeholder="Escreva o parecer detalhado que será exibido ao cliente..."
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  className="mt-1.5 bg-zinc-950 border-zinc-800 text-xs text-zinc-100 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSelectedRequest(null)}
                  disabled={isPending}
                  className="text-xs text-zinc-400"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md"
                >
                  {isPending ? 'Salvando...' : 'Salvar Resposta'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE PUBLICAÇÃO REFORÇADA */}
      {publishingVersionId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-zinc-950 border border-amber-500/40 p-6 space-y-4 shadow-2xl">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                <span>Confirmar Publicação Oficial</span>
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Ao publicar, esta versão se tornará vigente e <strong>imutável</strong>. Seu hash
                SHA-256 será gerado e a versão anterior será congelada e arquivada.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300">
              Digite a palavra <strong>PUBLICAR</strong> para homologar:
            </div>

            <Input
              placeholder="PUBLICAR"
              value={confirmationWord}
              onChange={(e) => setConfirmationWord(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-xs text-zinc-100 rounded-xl font-mono text-center tracking-widest uppercase font-bold"
            />

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPublishingVersionId(null)}
                disabled={isPending}
                className="text-xs text-zinc-400"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handlePublish}
                disabled={isPending || confirmationWord !== 'PUBLICAR'}
                className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md"
              >
                {isPending ? 'Publicando...' : 'Homologar e Publicar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
