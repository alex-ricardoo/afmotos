'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Printer,
  ShieldCheck,
  FileText,
  Clock,
  Hash,
  MessageCircle,
  Mail,
  CheckCircle2,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPhoneForDisplay } from '@/lib/utils/whatsapp';

export interface LegalSection {
  id: string;
  title: string;
  content: React.ReactNode;
}

interface LegalDocumentViewProps {
  documentType: 'privacy' | 'terms';
  title: string;
  subtitle: string;
  version: string;
  lastUpdatedDate: string;
  contentHash: string;
  sections: LegalSection[];
  storeInfo: {
    siteName: string;
    cnpj?: string | null;
    contactEmail?: string | null;
    whatsappPhone?: string | null;
    address?: string | null;
  };
}

export function LegalDocumentView({
  documentType,
  title,
  subtitle,
  version,
  lastUpdatedDate,
  contentHash,
  sections,
  storeInfo,
}: LegalDocumentViewProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || '');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 180;
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = document.getElementById(sections[i].id);
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [sections]);

  const handlePrint = () => {
    window.print();
  };

  const isPrivacy = documentType === 'privacy';

  return (
    <div className="min-h-screen bg-[#050505] text-[#f4f4f2] selection:bg-[#c9a44c] selection:text-black">
      {/* Header Hero */}
      <header className="bg-gradient-to-b from-[#0e0e11] to-[#070709] border-b border-[#c9a44c]/20 py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#151515] border border-[#c9a44c]/30 text-xs font-bold text-[#e3c56c]">
              {isPrivacy ? (
                <ShieldCheck className="w-4 h-4 text-[#e3c56c]" />
              ) : (
                <FileText className="w-4 h-4 text-[#e3c56c]" />
              )}
              <span>
                {isPrivacy ? 'LGPD e Segurança da Informação' : 'Termos & Condições de Uso'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white font-heading">
              {title}
            </h1>

            <p className="text-base md:text-lg text-[#a6a6a1] max-w-3xl leading-relaxed">
              {subtitle}
            </p>

            {/* Document Metadata Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Última atualização: <strong>{lastUpdatedDate}</strong>
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  Versão vigente: <strong>v{version}</strong>
                </span>
              </span>

              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-zinc-800 font-mono text-[11px]"
                title={`SHA-256: ${contentHash}`}
              >
                <Hash className="w-3.5 h-3.5 text-[#c9a44c]" />
                <span>
                  SHA-256: {contentHash.slice(0, 8)}...{contentHash.slice(-8)}
                </span>
              </span>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-4 print:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="bg-[#151515] hover:bg-zinc-800 border-zinc-700 text-zinc-200 text-xs h-9 rounded-xl flex items-center gap-2 cursor-pointer transition-all"
              >
                <Printer className="w-3.5 h-3.5 text-amber-400" />
                <span>Imprimir Documento</span>
              </Button>

              <Link
                href={isPrivacy ? '/termos-de-uso' : '/politica-de-privacidade'}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-semibold transition-colors"
              >
                <span>{isPrivacy ? 'Ver Termos de Uso' : 'Ver Política de Privacidade'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body with Sidebar Layout */}
      <div className="container mx-auto px-4 md:px-6 py-10 md:py-14 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* DESKTOP STICKY TABLE OF CONTENTS (lg:col-span-4) */}
          <aside className="hidden lg:block lg:col-span-4 print:hidden">
            <div className="sticky top-24 space-y-6">
              <div className="p-5 rounded-2xl bg-[#0c0c0e] border border-[#c9a44c]/20 shadow-lg">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 mb-3.5 pb-2.5 border-b border-zinc-800/80">
                  <FileText className="w-4 h-4" />
                  <span>Índice do Documento</span>
                </div>
                <nav className="space-y-1 max-h-[65vh] overflow-y-auto pr-1 text-xs scrollbar-thin scrollbar-thumb-zinc-800">
                  {sections.map((section, idx) => {
                    const isActive = activeSection === section.id;
                    return (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className={`block py-1.5 px-2.5 rounded-lg transition-all text-left ${
                          isActive
                            ? 'bg-[#c9a44c]/15 text-amber-300 font-bold border-l-2 border-[#c9a44c]'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                        }`}
                      >
                        <span className="text-[11px] text-zinc-500 mr-1.5">{idx + 1}.</span>
                        {section.title}
                      </a>
                    );
                  })}
                </nav>
              </div>

              {/* Box de Contato & DPO */}
              <div className="p-4 rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 text-xs space-y-2.5">
                <span className="font-bold text-white text-xs block">
                  Dúvidas sobre seus dados?
                </span>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Entre em contato com nossa equipe ou abra uma solicitação formal pelo Portal do
                  Cliente.
                </p>
                <div className="pt-1 space-y-1.5 text-[11px]">
                  {storeInfo.whatsappPhone && (
                    <a
                      href={`https://wa.me/55${storeInfo.whatsappPhone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-emerald-400 hover:underline"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{formatPhoneForDisplay(storeInfo.whatsappPhone)}</span>
                    </a>
                  )}
                  {storeInfo.contactEmail && (
                    <a
                      href={`mailto:${storeInfo.contactEmail}`}
                      className="flex items-center gap-2 text-amber-400 hover:underline"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>{storeInfo.contactEmail}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT AREA (lg:col-span-8) */}
          <main className="lg:col-span-8 space-y-8">
            {/* Quick Summary Card */}
            <div className="p-6 rounded-3xl bg-[#0d0d10] border border-[#c9a44c]/25 space-y-3.5 text-sm leading-relaxed text-zinc-300 shadow-md">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Resumo da Nossa Conduta</span>
              </div>
              <p>
                A <strong>{storeInfo.siteName}</strong> preza pela máxima transparência, lealdade e
                segurança. Todas as informações coletadas possuem finalidades legítimas, bases
                legais explícitas sob a LGPD e são protegidas por rigorosas salvaguardas técnicas.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs text-zinc-300">
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>Criptografia HTTPS/TLS e armazenamento seguro no Supabase com RLS</span>
                </div>
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>Não comercializamos dados e não realizamos disparos de spam</span>
                </div>
              </div>
            </div>

            {/* SECTIONS */}
            <div className="space-y-6">
              {sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="p-6 sm:p-8 rounded-3xl bg-[#0e0e11] border border-zinc-800/80 hover:border-[#c9a44c]/30 transition-colors space-y-4 text-sm leading-relaxed text-zinc-300"
                >
                  <h2 className="text-lg sm:text-xl font-bold text-white font-heading flex items-start gap-2.5">
                    <span className="text-amber-400 font-mono text-sm sm:text-base pt-0.5">
                      {index + 1}.
                    </span>
                    <span>{section.title}</span>
                  </h2>
                  <div className="text-zinc-300 space-y-3 text-sm leading-relaxed">
                    {section.content}
                  </div>
                </section>
              ))}
            </div>

            {/* BOTTOM CALL TO ACTION / TITULAR RIGHTS */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#121217] via-[#0e0e11] to-[#09090c] border border-[#c9a44c]/30 space-y-4 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6 print:hidden">
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-base sm:text-lg font-bold text-white font-heading">
                  Quer exercer seus direitos de privacidade?
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Confirmação, acesso, correção ou eliminação de dados podem ser solicitados
                  formalmente com protocolo direto em seu perfil.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                <Link
                  href="/cliente/perfil"
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Solicitar Atendimento de Dados</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
