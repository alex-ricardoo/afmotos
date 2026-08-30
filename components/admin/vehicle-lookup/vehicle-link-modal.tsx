'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Link2, Loader2, Bike } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { linkVehicleConsultationAction } from '@/lib/actions/vehicle-lookup';

interface MotorcycleOption {
  id: string;
  brand: string;
  model: string;
  year_model: number;
  license_plate: string | null;
}

interface VehicleLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  consultationId: string;
  currentMotorcycleId: string | null;
  motorcycles: MotorcycleOption[];
}

export function VehicleLinkModal({
  isOpen,
  onClose,
  consultationId,
  currentMotorcycleId,
  motorcycles,
}: VehicleLinkModalProps) {
  const [selectedMotorcycleId, setSelectedMotorcycleId] = useState(currentMotorcycleId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const res = await linkVehicleConsultationAction({
        consultationId,
        motorcycleId: selectedMotorcycleId || null,
      });

      if (res.error) {
        toast.error(res.error);
        return;
      }

      toast.success('Vínculo atualizado com sucesso!');
      onClose();
    } catch (err: any) {
      toast.error('Erro ao atualizar vínculo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-card border border-border/80 shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
            <Link2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Vincular a Moto do Inventário</h3>
            <p className="text-xs text-muted-foreground">Associe este laudo a um veículo do estoque.</p>
          </div>
        </div>

        <div className="space-y-4 my-5">
          <div>
            <label className="text-xs font-semibold text-foreground mb-1.5 block">
              Selecione a motocicleta:
            </label>
            <select
              value={selectedMotorcycleId}
              onChange={(e) => setSelectedMotorcycleId(e.target.value)}
              className="w-full h-11 px-3 text-xs rounded-xl bg-background border border-input text-foreground focus:ring-1 focus:ring-primary"
            >
              <option value="">-- Nenhuma moto vinculada --</option>
              {motorcycles.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.brand} {m.model} ({m.year_model}) {m.license_plate ? `• Placa: ${m.license_plate}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-xl text-xs"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSubmitting}
            className="rounded-xl text-xs font-semibold gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
              </>
            ) : (
              'Salvar Vínculo'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
