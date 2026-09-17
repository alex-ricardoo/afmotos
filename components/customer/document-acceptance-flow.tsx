'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  LogOut,
  ExternalLink,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { recordDocumentAcceptanceAction } from '@/lib/legal/actions';
import { logoutCustomer } from '@/lib/customer/actions';

interface MissingDocument {
  id: string;
  slug: string;
  title: string;
  version: string;
  summary: string | null;
}

interface DocumentAcceptanceFlowProps {
  missingDocuments: MissingDocument[];
  returnUrl: string;
  siteName: string;
}

export function DocumentAcceptanceFlow({
  missingDocuments,
  returnUrl,
  siteName,
}: DocumentAcceptanceFlowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [acceptedSlugs, setAcceptedSlugs] = useState<Record<string, boolean>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleAccept = (slug: string) => {
    setAcceptedSlugs((prev) => ({
      ...prev,
      [slug]: !prev[slug],
    }));
  };

  const acceptedCount = missingDocuments.filter((doc) => Boolean(acceptedSlugs[doc.slug])).length;
  const totalCount = missingDocuments.length;
  const allAccepted = totalCount > 0 && acceptedCount === totalCount;
  const progressPercent = totalCount > 0 ? (acceptedCount / totalCount) * 100 : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!allAccepted) {
      setErrorMsg('Por favor, assinale a concordância com os documentos listados para continuar.');
      toast.error('É obrigatório concordar com os documentos legais.');
      return;
    }

    startTransition(async () => {
      const versionIds = missingDocuments.map((doc) => doc.id);
      const res = await recordDocumentAcceptanceAction({
        documentVersionIds: versionIds,
        acceptanceSource: 'login_reacceptance',
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Erro ao registrar aceite. Tente novamente.');
        toast.error(res.error || 'Erro ao salvar aceites.');
      } else {
        toast.success('Aceite registrado com sucesso!');
        router.push(returnUrl || '/cliente');
        router.refresh();
      }
    });
  };

  return (
    <div className="w-full max-w-lg mx-auto p-5 sm:p-7 rounded-3xl bg-[#0e0e12]/95 border border-zinc-800/80 shadow-[0_10px_40px_rgba(0,0,0,0.7)] backdrop-blur-xl space-y-6 text-zinc-100">
      {/* Header com Emblema Dourado */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#c9a44c]/20 via-[#c9a44c]/10 to-transparent border border-[#c9a44c]/40 text-[#e3c56c] flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(201,164,76,0.2)]">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Concluir Acesso à Conta
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-sm mx-auto mt-1.5">
            Para sua segurança e conformidade com a LGPD, confirme o aceite dos documentos legais da{' '}
            <strong className="text-zinc-200 font-semibold">{siteName}</strong>.
          </p>
        </div>

        {/* Barra de Progresso Mobile-Friendly */}
        <div className="pt-1.5 space-y-1.5 max-w-xs mx-auto">
          <div className="flex items-center justify-between text-[11px] font-medium">
            <span className="text-zinc-400">Progresso do Aceite</span>
            <span className={allAccepted ? 'text-amber-400 font-bold' : 'text-zinc-400'}>
              {acceptedCount} de {totalCount} confirmados
            </span>
          </div>
          <div className="h-1.5 w-full bg-zinc-800/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Lista de Documentos Interativos (Touch-First) */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {missingDocuments.map((doc) => {
          const isTerms = doc.slug === 'terms_of_use';
          const linkHref = isTerms ? '/termos-de-uso' : '/politica-de-privacidade';
          const isChecked = Boolean(acceptedSlugs[doc.slug]);

          return (
            <div
              key={doc.id}
              onClick={() => toggleAccept(doc.slug)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-[0.99] ${
                isChecked
                  ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_20px_rgba(201,164,76,0.1)]'
                  : 'bg-zinc-900/50 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/80'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <Checkbox
                  id={`check_${doc.slug}`}
                  checked={isChecked}
                  onCheckedChange={() => toggleAccept(doc.slug)}
                  disabled={isPending}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 w-5 h-5 rounded-md border-zinc-700 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500 data-[state=checked]:text-black shrink-0 cursor-pointer"
                />

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs sm:text-sm font-bold text-white leading-snug">
                      {doc.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800/80 text-amber-400 border border-zinc-700 shrink-0">
                      v{doc.version}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    {doc.summary ||
                      'Diretrizes oficiais e responsabilidades mútuas de utilização dos serviços.'}
                  </p>

                  <div className="pt-1 flex items-center justify-between">
                    <Link
                      href={linkHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-[11px] text-amber-400 hover:text-amber-300 underline underline-offset-2 font-medium transition-colors cursor-pointer"
                    >
                      <span>Ler documento completo</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    {isChecked && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                        <Check className="w-3 h-3" />
                        <span>Confirmado</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Ações de Envio Mobile-Friendly */}
        <div className="pt-2 space-y-2.5">
          <Button
            type="submit"
            disabled={isPending || !allAccepted}
            className="w-full h-12 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Registrando aceite seguro...</span>
              </span>
            ) : allAccepted ? (
              <span className="flex items-center gap-2">
                <span>Confirmar e Acessar Minha Conta</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            ) : (
              <span>Selecione os documentos acima para continuar</span>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => logoutCustomer()}
            disabled={isPending}
            className="w-full text-xs text-zinc-400 hover:text-zinc-200 h-9 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-900/50 rounded-xl transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair da conta e decidir depois</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
