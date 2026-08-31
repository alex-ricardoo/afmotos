'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileSignature, Download, CheckCircle2 } from 'lucide-react';
import { PurchaseAgreementModal } from '@/components/admin/purchase-agreement-modal';
import { PurchaseAgreementPrepareInput, MotorcyclePurchaseAgreementRecord } from '@/types/purchase-agreement';

interface MotorcyclePurchaseAgreementActionProps {
  motorcycle: {
    id: string;
    brand: string;
    model: string;
    version?: string | null;
    year_manufacture: number;
    year_model: number;
    color?: string | null;
    fuel?: string | null;
    license_plate?: string | null;
    renavam?: string | null;
    chassi?: string | null;
    mileage?: number | null;
    price?: number | null;
    fipe_price?: number | null;
    ownership_type?: string;
  };
  existingAgreement?: MotorcyclePurchaseAgreementRecord | null;
}

export function MotorcyclePurchaseAgreementAction({
  motorcycle,
  existingAgreement,
}: MotorcyclePurchaseAgreementActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentAgreement, setCurrentAgreement] = useState(existingAgreement);

  const initialData: Partial<PurchaseAgreementPrepareInput> = {
    motorcycle_id: motorcycle.id,
    brand: motorcycle.brand,
    model: motorcycle.model,
    version: motorcycle.version || '',
    year_manufacture: motorcycle.year_manufacture,
    year_model: motorcycle.year_model,
    color: motorcycle.color || '',
    fuel: motorcycle.fuel || 'Flex',
    license_plate: motorcycle.license_plate || '',
    renavam: motorcycle.renavam || '',
    chassi: motorcycle.chassi || '',
    mileage: motorcycle.mileage || 0,
    purchase_amount: motorcycle.price || motorcycle.fipe_price || 0,
    paid_amount: motorcycle.price || motorcycle.fipe_price || 0,
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {currentAgreement ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                const res = await fetch(`/api/admin/purchase-agreements/${currentAgreement.id}/pdf`);
                const data = await res.json();
                if (data.success && data.pdf_url) {
                  window.open(data.pdf_url, '_blank');
                }
              } catch (e) {
                console.error(e);
              }
            }}
            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs font-bold gap-1.5"
          >
            <CheckCircle2 className="size-3.5 text-emerald-400" />
            Contrato de Compra ({currentAgreement.agreement_number.slice(-6)})
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-bold gap-1.5"
          >
            <FileSignature className="size-3.5 text-amber-400" />
            Contrato de Compra
          </Button>
        )}
      </div>

      <PurchaseAgreementModal
        open={isOpen}
        onOpenChange={setIsOpen}
        initialData={initialData}
        onSuccess={(result) => {
          setCurrentAgreement({
            id: result.agreement_id,
            agreement_number: result.agreement_number,
          } as any);
        }}
      />
    </>
  );
}
