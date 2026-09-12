'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { AuthForm } from './auth-form';
import { ShieldCheck } from 'lucide-react';
import { formatBrazilianPlate } from '@/lib/vehicle-lookup/plate';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plate?: string;
  onSuccess?: () => void;
}

export function AuthModal({ open, onOpenChange, plate, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const returnUrl = plate
    ? `/cliente/pagamento/nova?placa=${encodeURIComponent(plate)}`
    : '/cliente';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] bg-zinc-950 border border-zinc-800 text-zinc-100 p-6 sm:p-7 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
        <DialogHeader className="text-center space-y-2 pb-2">
          <div className="w-12 h-12 rounded-2xl bg-[#c9a44c]/10 border border-[#c9a44c]/20 text-[#c9a44c] flex items-center justify-center mx-auto mb-1">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-white tracking-tight">
            {mode === 'login' ? 'Entrar para Consultar' : 'Criar Conta para Consultar'}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            {plate ? (
              <span>
                Para acessar o laudo da placa{' '}
                <strong className="text-[#c9a44c] font-mono tracking-wider">
                  {formatBrazilianPlate(plate)}
                </strong>
                , entre na sua conta ou cadastre-se.
              </span>
            ) : (
              'Acesse sua conta para continuar sua consulta veicular com segurança.'
            )}
          </DialogDescription>
        </DialogHeader>

        {/* Tab switch */}
        <div className="flex bg-zinc-900/80 p-1 rounded-xl border border-zinc-800/80 text-xs font-semibold mb-2">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Já tenho conta
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-[#c9a44c] text-zinc-950 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Criar conta
          </button>
        </div>

        <AuthForm
          mode={mode}
          returnUrl={returnUrl}
          onSuccess={() => {
            onOpenChange(false);
            if (onSuccess) {
              onSuccess();
            }
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
