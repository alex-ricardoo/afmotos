'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface VehicleRevokeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  plateDisplay: string;
}

export function VehicleRevokeModal({
  isOpen,
  onClose,
  onConfirm,
  plateDisplay,
}: VehicleRevokeModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRevoke = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm(reason);
      setReason('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-rose-600 mb-1">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Ação Irreversível</span>
          </div>
          <DialogTitle className="text-lg font-bold">
            Revogar Acesso ao Laudo ({plateDisplay})
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            O link compartilhado deixará de funcionar imediatamente para qualquer pessoa que o possua. Nenhuma nova visualização ou download de PDF será permitido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="revoke-reason" className="text-xs font-medium">
              Motivo da Revogação (Opcional):
            </Label>
            <Textarea
              id="revoke-reason"
              placeholder="Ex: Negociação com cliente encerrada, link enviado incorretamente..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="text-xs resize-none"
              disabled={isSubmitting}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRevoke}
            disabled={isSubmitting}
            className="gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Revogando...
              </>
            ) : (
              'Confirmar Revogação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
