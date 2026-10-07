'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { deleteMotorcycleAction } from '@/lib/actions/motorcycles';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteMotorcycleButtonProps {
  motorcycleId: string;
  motorcycleTitle: string;
  licensePlate?: string | null;
  redirectTo?: string;
  variant?: 'outline' | 'destructive' | 'ghost';
  size?: 'sm' | 'default' | 'icon' | 'icon-sm';
  showLabel?: boolean;
}

export function DeleteMotorcycleButton({
  motorcycleId,
  motorcycleTitle,
  licensePlate,
  redirectTo = '/admin/motos',
  variant = 'outline',
  size = 'sm',
  showLabel = true,
}: DeleteMotorcycleButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const res = await deleteMotorcycleAction(motorcycleId);
      if (res?.error) {
        setError(res.error);
        toast.error(res.error);
      } else {
        toast.success(`Moto "${motorcycleTitle}" excluída com sucesso!`);
        setOpen(false);
        if (redirectTo) {
          router.push(redirectTo);
        }
        router.refresh();
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className="border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer font-bold gap-1.5"
        title="Excluir motocicleta"
      >
        <Trash2 className="w-4 h-4" />
        {showLabel && <span>Excluir Moto</span>}
      </Button>

      <Dialog open={open} onOpenChange={(val) => !val && !isPending && setOpen(false)}>
        <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 rounded-3xl p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Confirmar Exclusão da Moto
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400 pt-2 space-y-2">
              <p>
                Tem certeza de que deseja excluir permanentemente a motocicleta{' '}
                <strong className="text-white">{motorcycleTitle}</strong>?
              </p>
              {licensePlate && (
                <p className="text-xs font-mono text-zinc-400">
                  Placa: <span className="text-[#e3c56c] font-bold">{licensePlate}</span>
                </p>
              )}
              <p className="text-xs text-rose-400/80 bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5">
                Esta ação removerá as fotos, ficha técnica e dados cadastrais. Não poderá ser desfeita.
              </p>
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="flex-1 border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 rounded-xl cursor-pointer h-11"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl cursor-pointer h-11 flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Excluindo...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Excluir Definitivamente</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
