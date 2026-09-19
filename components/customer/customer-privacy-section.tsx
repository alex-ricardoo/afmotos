'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  FileText,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  Loader2,
  MessageSquare,
  Cookie,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createPrivacyRequestAction } from '@/lib/legal/actions';
import {
  PrivacyRequest,
  PrivacyRequestType,
  UserComplianceStatus,
  PublishedLegalDocumentDto,
} from '@/lib/legal/types';

interface CustomerPrivacySectionProps {
  compliance: UserComplianceStatus;
  termsDoc: PublishedLegalDocumentDto;
  privacyDoc: PublishedLegalDocumentDto;
  requests: PrivacyRequest[];
  userEmail: string;
}

const REQUEST_TYPE_LABELS: Record<PrivacyRequestType, string> = {
  confirmation: 'Confirmação da existência de tratamento',
  access: 'Acesso aos meus dados pessoais',
  correction: 'Correção de dados incompletos ou inexatos',
  anonymization_or_deletion: 'Anonimização, bloqueio ou eliminação',
  portability: 'Portabilidade de dados',
  sharing_info: 'Informações sobre compartilhamento com terceiros',
  consent_revocation: 'Revogação de consentimento',
  other: 'Outra solicitação relacionada à privacidade',
};

const STATUS_BADGES: Record<string, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pendente', bg: 'bg-amber-500/10', text: 'text-amber-400 border-amber-500/30' },
  in_analysis: {
    label: 'Em análise',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400 border-blue-500/30',
  },
  completed: {
    label: 'Concluído',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400 border-emerald-500/30',
  },
  rejected: { label: 'Não acolhido', bg: 'bg-red-500/10', text: 'text-red-400 border-red-500/30' },
};

export function CustomerPrivacySection({
  compliance,
  termsDoc,
  privacyDoc,
  requests: initialRequests,
  userEmail,
}: CustomerPrivacySectionProps) {
  const [requests, setRequests] = useState<PrivacyRequest[]>(initialRequests);
  const [showModal, setShowModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Form State
  const [requestType, setRequestType] = useState<PrivacyRequestType>('access');
  const [details, setDetails] = useState('');
  const [contactEmail, setContactEmail] = useState(userEmail || '');
  const [contactPhone, setContactPhone] = useState('');

  const termsAcceptance = compliance.acceptedVersions.find((a) => a.slug === 'terms_of_use');
  const privacyAcceptance = compliance.acceptedVersions.find((a) => a.slug === 'privacy_policy');

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();

    if (!details.trim() || details.trim().length < 10) {
      toast.error('Por favor, detalhe sua solicitação com pelo menos 10 caracteres.');
      return;
    }

    startTransition(async () => {
      const res = await createPrivacyRequestAction({
        requestType,
        details,
        contactEmail,
        contactPhone,
      });

      if (!res.success) {
        toast.error(res.error || 'Erro ao registrar solicitação.');
      } else {
        toast.success(`Solicitação registrada com sucesso! Protocolo: ${res.data?.protocolNumber}`);
        setShowModal(false);
        setDetails('');

        // Prepend optimistic request
        const newReq: PrivacyRequest = {
          id: Math.random().toString(),
          user_id: '',
          protocol_number: res.data?.protocolNumber || 'LGPD-NOVO',
          request_type: requestType,
          status: 'pending',
          details: details.trim(),
          contact_email: contactEmail,
          contact_phone: contactPhone || null,
          response_notes: null,
          handled_by: null,
          handled_at: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setRequests((prev) => [newReq, ...prev]);
      }
    });
  };

  return (
    <div className="space-y-6 pt-2">
      {/* 1. DOCUMENTOS ACEITOS & VIGENTES */}
      <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-lg space-y-5">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-heading">
                Documentos Legais & Aceites Registrados
              </h2>
              <p className="text-xs text-zinc-400">
                Histórico auditável de concordância contratual e privacidade
              </p>
            </div>
          </div>

          <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Auditoria Conforme</span>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Termos de Uso */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>Termos de Uso</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                Vigente: v{termsDoc.version}
              </span>
            </div>

            <div className="text-xs space-y-1 text-zinc-400">
              {termsAcceptance ? (
                <p className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Aceito na versão <strong>v{termsAcceptance.version}</strong> em{' '}
                    {new Date(termsAcceptance.acceptedAt).toLocaleDateString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </p>
              ) : (
                <p className="text-amber-400">Aceite pendente da versão vigente.</p>
              )}
            </div>

            <div className="pt-1">
              <Link
                href="/termos-de-uso"
                target="_blank"
                className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
              >
                <span>Ler documento integral</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Card Política de Privacidade */}
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Política de Privacidade</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-amber-400 border border-zinc-700">
                Vigente: v{privacyDoc.version}
              </span>
            </div>

            <div className="text-xs space-y-1 text-zinc-400">
              {privacyAcceptance ? (
                <p className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Aceito na versão <strong>v{privacyAcceptance.version}</strong> em{' '}
                    {new Date(privacyAcceptance.acceptedAt).toLocaleDateString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </p>
              ) : (
                <p className="text-amber-400">Aceite pendente da versão vigente.</p>
              )}
            </div>

            <div className="pt-1">
              <Link
                href="/politica-de-privacidade"
                target="_blank"
                className="inline-flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
              >
                <span>Ler documento integral</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 2. SOLICITAÇÕES DE DIREITOS LGPD (Art. 18) */}
      <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-lg space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
          <div>
            <h2 className="text-base font-bold text-white font-heading flex items-center gap-2">
              <span>Seus Direitos como Titular de Dados</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                Art. 18 LGPD
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Solicite confirmação, acesso, correção ou anonimização de suas informações pessoais
            </p>
          </div>

          <Button
            onClick={() => setShowModal(true)}
            size="sm"
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-9 rounded-xl shadow-md cursor-pointer inline-flex items-center gap-1.5 self-start sm:self-auto"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Solicitar Atendimento sobre Meus Dados</span>
          </Button>
        </div>

        {/* Lista de Solicitações Anteriores */}
        {requests.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <ShieldCheck className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="text-xs text-zinc-400">
              Você ainda não possui solicitações de direitos registradas.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => {
              const badge = STATUS_BADGES[req.status] || STATUS_BADGES.pending;
              return (
                <div
                  key={req.id}
                  className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 space-y-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-xs">
                        {req.protocol_number}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${badge.bg} ${badge.text}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <span className="text-[11px] text-zinc-500">
                      {new Date(req.created_at).toLocaleDateString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <p className="text-zinc-300 text-xs">
                    <strong>Tipo:</strong>{' '}
                    {REQUEST_TYPE_LABELS[req.request_type] || req.request_type}
                  </p>
                  <p className="text-zinc-400 text-[11px] bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800">
                    {req.details}
                  </p>

                  {req.response_notes && (
                    <div className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs space-y-1">
                      <span className="font-bold flex items-center gap-1 text-[11px] text-amber-400">
                        <MessageSquare className="w-3 h-3" />
                        <span>Resposta do Encarregado de Dados:</span>
                      </span>
                      <p className="text-zinc-300 text-xs leading-relaxed">{req.response_notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. INFORMATIVO DE COOKIES & PRIVACIDADE TÉCNICA */}
      <div className="p-5 rounded-3xl bg-zinc-900/40 border border-zinc-800/80 text-xs space-y-2 text-zinc-400">
        <div className="flex items-center gap-2 text-white font-bold text-xs">
          <Cookie className="w-4 h-4 text-amber-400" />
          <span>Política Técnica de Cookies & Sessão</span>
        </div>
        <p className="leading-relaxed text-[11px]">
          A AF Veículos PE opera estritamente com cookies essenciais de autenticação e proteção contra
          CSRF (Supabase Auth). Não implementamos rastreadores de publicidade, Meta Pixel ou scripts
          invasivos de terceiros. Se ferramentas de análise forem integradas no futuro, você poderá
          optar por habilitá-las diretamente nesta central.
        </p>
      </div>

      {/* MODAL DE SOLICITAÇÃO LGPD */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#0e0e11] border border-[#c9a44c]/30 p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white font-heading">
                Solicitar Atendimento sobre Meus Dados
              </h3>
              <p className="text-xs text-zinc-400">
                Seu pedido será registrado formalmente e acompanhado pelo nosso Encarregado de
                Proteção de Dados (DPO).
              </p>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <Label className="text-xs text-zinc-300 font-semibold">Tipo de Solicitação</Label>
                <select
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as PrivacyRequestType)}
                  className="w-full mt-1.5 h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 focus:outline-none focus:border-amber-400/80"
                >
                  {Object.entries(REQUEST_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label className="text-xs text-zinc-300 font-semibold">
                  Detalhes do Pedido <span className="text-amber-400">*</span>
                </Label>
                <Textarea
                  required
                  rows={4}
                  placeholder="Descreva o que você gostaria de solicitar ou consultar sobre seus dados..."
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="mt-1.5 bg-zinc-900 border-zinc-800 text-xs text-zinc-100 rounded-xl placeholder:text-zinc-500 focus:border-amber-400/80"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">Mínimo 10 caracteres</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-zinc-300 font-semibold">
                    E-mail para Resposta
                  </Label>
                  <Input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="mt-1.5 bg-zinc-900 border-zinc-800 text-xs text-zinc-100 rounded-xl"
                  />
                </div>
                <div>
                  <Label className="text-xs text-zinc-300 font-semibold">
                    Telefone / WhatsApp (Opcional)
                  </Label>
                  <Input
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="mt-1.5 bg-zinc-900 border-zinc-800 text-xs text-zinc-100 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/80">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowModal(false)}
                  disabled={isPending}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs rounded-xl shadow-md"
                >
                  {isPending ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enviando...</span>
                    </span>
                  ) : (
                    <span>Registrar Solicitação</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
