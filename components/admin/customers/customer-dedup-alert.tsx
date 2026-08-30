'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Info, ExternalLink } from 'lucide-react';
import { DuplicateCandidatesResult } from '@/lib/domain/customer-dedup';

interface CustomerDedupAlertProps {
  duplicates: DuplicateCandidatesResult | null;
  className?: string;
}

export function CustomerDedupAlert({ duplicates, className }: CustomerDedupAlertProps) {
  if (!duplicates) return null;

  const { cpfMatch, phoneMatches, emailMatches, hasExactCpfMatch, hasPhoneMatch, hasEmailMatch } =
    duplicates;

  if (!hasExactCpfMatch && !hasPhoneMatch && !hasEmailMatch) return null;

  return (
    <div className={`space-y-2.5 ${className || ''}`}>
      {/* 1. Alerta Crítico: CPF Duplicado */}
      {hasExactCpfMatch && cpfMatch && (
        <div className="flex items-start gap-3 p-3.5 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-200 text-xs animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-rose-300">
              CPF já cadastrado para o cliente &quot;{cpfMatch.full_name}&quot;
            </p>
            <p className="text-rose-200/80 leading-relaxed">
              O CPF é um identificador exclusivo. Para evitar cadastros duplicados, utilize o perfil existente ou atualize seus dados.
            </p>
            <Link
              href={`/admin/clientes/${cpfMatch.id}`}
              className="inline-flex items-center gap-1 font-bold text-white underline hover:text-rose-200 mt-1"
              target="_blank"
            >
              Abrir ficha de {cpfMatch.full_name} <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* 2. Alerta Médio: Telefone Duplicado (sem conflito de CPF) */}
      {!hasExactCpfMatch && hasPhoneMatch && phoneMatches.length > 0 && (
        <div className="flex items-start gap-3 p-3.5 bg-amber-950/40 border border-amber-800/60 rounded-xl text-amber-200 text-xs animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-amber-300">
              Telefone coincidente com &quot;{phoneMatches[0].full_name}&quot;
            </p>
            <p className="text-amber-200/80 leading-relaxed">
              Este número de telefone já consta em outro cadastro. Verifique se trata-se da mesma pessoa ou de um familiar antes de salvar.
            </p>
            <Link
              href={`/admin/clientes/${phoneMatches[0].id}`}
              className="inline-flex items-center gap-1 font-bold text-white underline hover:text-amber-200 mt-1"
              target="_blank"
            >
              Conferir cadastro existente <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* 3. Alerta Informativo: E-mail Duplicado (se não houver CPF nem telefone) */}
      {!hasExactCpfMatch && !hasPhoneMatch && hasEmailMatch && emailMatches.length > 0 && (
        <div className="flex items-start gap-3 p-3 bg-sky-950/30 border border-sky-800/50 rounded-xl text-sky-200 text-xs animate-in fade-in">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold text-sky-300">
              E-mail já utilizado por &quot;{emailMatches[0].full_name}&quot;
            </p>
            <p className="text-sky-200/80 text-[11px]">
              Aviso informativo: o mesmo e-mail foi localizado em outro registro.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
