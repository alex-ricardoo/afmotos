'use client';

import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, Gavel, FileCheck, CheckCircle2, Loader2 } from 'lucide-react';

interface LoadingStepperProps {
  plateDisplay: string;
}

export function LoadingStepper({ plateDisplay }: LoadingStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    { label: 'Buscando cadastro no Senatran & DETRAN', icon: Database },
    { label: 'Checando gravames, alienações e Renajud', icon: ShieldCheck },
    { label: 'Varrendo histórico de leilão & seguradoras', icon: Gavel },
    { label: 'Consolidando laudo oficial e snapshot', icon: FileCheck },
  ];

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(1), 600);
    const timer2 = setTimeout(() => setCurrentStep(2), 1200);
    const timer3 = setTimeout(() => setCurrentStep(3), 1800);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-xl max-w-lg mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-1">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Processando Consulta
        </div>
        <h3 className="text-xl font-bold text-foreground">
          Consultando Placa <span className="font-mono text-primary">{plateDisplay}</span>
        </h3>
        <p className="text-xs text-muted-foreground">
          Integrando bases governamentais e privadas em tempo real...
        </p>
      </div>

      <div className="space-y-3 pt-2">
        {steps.map((step, idx) => {
          const isDone = currentStep > idx;
          const isCurrent = currentStep === idx;
          const isPending = currentStep < idx;
          const Icon = step.icon;

          return (
            <div
              key={idx}
              className={`flex items-center gap-3.5 p-3 rounded-xl border transition-all duration-300 ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isCurrent
                  ? 'bg-primary/10 border-primary/40 text-primary shadow-xs'
                  : 'bg-muted/20 border-border/40 text-muted-foreground opacity-50'
              }`}
            >
              <div className="flex-shrink-0">
                {isDone ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : isCurrent ? (
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                ) : (
                  <Icon className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              <span className={`text-xs font-semibold ${isCurrent ? 'text-foreground font-bold' : ''}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
