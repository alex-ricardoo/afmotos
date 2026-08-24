'use client';

import React from 'react';
import { Bike, User, Camera, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StepItem {
  number: number;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const VENDA_MOTO_STEPS: StepItem[] = [
  { number: 1, label: 'Dados da Moto', shortLabel: 'Moto', icon: Bike },
  { number: 2, label: 'Seus Dados', shortLabel: 'Contato', icon: User },
  { number: 3, label: 'Fotos Reais', shortLabel: 'Fotos', icon: Camera },
  { number: 4, label: 'Revisão & Envio', shortLabel: 'Revisão', icon: CheckSquare },
];

interface VendaMotoStepperProps {
  currentStep: number;
  onStepClick?: (step: number) => void;
  maxStepReached: number;
}

export function VendaMotoStepper({
  currentStep,
  onStepClick,
  maxStepReached,
}: VendaMotoStepperProps) {
  const totalSteps = VENDA_MOTO_STEPS.length;
  const progressPercentage = ((currentStep - 1) / (totalSteps - 1)) * 100;

  return (
    <div className="w-full space-y-4">
      {/* Mobile Compact Stepper Indicator */}
      <div className="md:hidden space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-amber-400 uppercase tracking-wider">
            Etapa {currentStep} de {totalSteps}
          </span>
          <span className="text-zinc-300 font-bold">
            {VENDA_MOTO_STEPS[currentStep - 1]?.label}
          </span>
        </div>
        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/50">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 transition-all duration-300 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.5)]"
            style={{ width: `${Math.max(progressPercentage, 15)}%` }}
          />
        </div>
      </div>

      {/* Desktop Stepper Timeline */}
      <div className="hidden md:block relative">
        {/* Progress Background Line */}
        <div className="absolute top-6 left-[10%] right-[10%] h-0.5 bg-zinc-800 z-0" />
        {/* Active Animated Gradient Progress Line */}
        <div
          className="absolute top-6 left-[10%] h-0.5 bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500 z-0 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
          style={{ width: `${(progressPercentage * 80) / 100}%` }}
        />

        <div className="grid grid-cols-4 gap-3 relative z-10">
          {VENDA_MOTO_STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = step.number < currentStep;
            const isCurrent = step.number === currentStep;
            const isAccessible = step.number <= maxStepReached;

            return (
              <button
                key={step.number}
                type="button"
                disabled={!isAccessible}
                onClick={() => isAccessible && onStepClick?.(step.number)}
                className={cn(
                  'flex flex-col items-center text-center group transition-all duration-200 outline-none select-none',
                  isAccessible ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
                )}
              >
                {/* Stepper Node Circle */}
                <div
                  className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-all duration-300 mb-2.5 relative border',
                    isCurrent &&
                      'bg-amber-500 text-zinc-950 border-amber-400 scale-110 shadow-[0_0_20px_rgba(245,158,11,0.4)]',
                    isCompleted &&
                      'bg-zinc-900 text-amber-400 border-amber-500/50 hover:border-amber-400 hover:scale-105',
                    !isCurrent && !isCompleted && 'bg-zinc-900/90 text-zinc-500 border-zinc-800',
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span
                    className={cn(
                      'absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center border',
                      isCurrent
                        ? 'bg-zinc-950 text-amber-400 border-amber-400'
                        : isCompleted
                          ? 'bg-amber-500 text-zinc-950 border-amber-400'
                          : 'bg-zinc-800 text-zinc-400 border-zinc-700',
                    )}
                  >
                    {step.number}
                  </span>
                </div>

                {/* Step Labels */}
                <span
                  className={cn(
                    'text-xs font-bold transition-colors block font-heading',
                    isCurrent && 'text-amber-400 font-extrabold',
                    isCompleted && 'text-zinc-200 group-hover:text-amber-400',
                    !isCurrent && !isCompleted && 'text-zinc-500',
                  )}
                >
                  {step.label}
                </span>
                <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mt-0.5">
                  Etapa 0{step.number}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
