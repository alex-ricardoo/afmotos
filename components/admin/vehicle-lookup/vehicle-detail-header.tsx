'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Link2, ExternalLink, FileSignature } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import type { InternalVehicleConsultationDto } from '@/lib/vehicle-lookup/types';
import { RiskBadge, ModeBadge, StatusBadge } from './consultation-badge';
import { PurchaseAgreementModal } from '@/components/admin/purchase-agreement-modal';
import { PurchaseAgreementPrepareInput } from '@/types/purchase-agreement';

interface VehicleDetailHeaderProps {
  dto: InternalVehicleConsultationDto;
  onOpenLinkModal: () => void;
}

export function VehicleDetailHeader({ dto, onOpenLinkModal }: VehicleDetailHeaderProps) {
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const initialData: Partial<PurchaseAgreementPrepareInput> = {
    vehicle_consultation_id: dto.id,
    motorcycle_id: dto.motorcycle_id || undefined,
    brand: dto.summary?.brand || dto.vehicle_data?.brand || '',
    model: dto.summary?.model || dto.vehicle_data?.model || '',
    version: dto.summary?.version || '',
    year_manufacture: dto.vehicle_data?.year_manufacture || new Date().getFullYear(),
    year_model: dto.vehicle_data?.year_model || new Date().getFullYear(),
    color: dto.summary?.color || dto.vehicle_data?.color || '',
    fuel: dto.vehicle_data?.fuel || 'Flex',
    license_plate: dto.plate_display || dto.plate_normalized,
    renavam: dto.vehicle_data?.renavam || '',
    chassi: dto.vehicle_data?.chassis || '',
    mileage: 0,
    fipe_price: dto.fipe?.price || 0,
    purchase_amount: dto.fipe?.price || 0,
    paid_amount: dto.fipe?.price || 0,
  };

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-7 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            href="/admin/consulta-placa"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Consultas
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-mono text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              {dto.plate_display}
            </h1>
            <span className="text-xl sm:text-2xl font-bold text-muted-foreground">•</span>
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {dto.summary.brand} {dto.summary.model}
            </h2>
            <RiskBadge level={dto.summary.risk_level} />
            <ModeBadge mode={dto.mode} isMock={dto.is_mock} />
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-2">
            <span>
              Versão: <strong className="text-foreground">{dto.summary.version}</strong>
            </span>
            <span>•</span>
            <span>
              Ano: <strong className="text-foreground">{dto.summary.year_fab_mod}</strong>
            </span>
            <span>•</span>
            <span>
              Cor: <strong className="text-foreground">{dto.summary.color}</strong>
            </span>
            <span>•</span>
            <span>
              Local: <strong className="text-foreground">{dto.summary.city_state}</strong>
            </span>
            <span>•</span>
            <span>
              Consultado em:{' '}
              <strong className="text-foreground">
                {new Date(dto.consulted_at).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </strong>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPurchaseModalOpen(true)}
            className="rounded-xl border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-semibold gap-1.5 h-10"
          >
            <FileSignature className="w-4 h-4 text-amber-400" />
            Gerar Contrato de Compra
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onOpenLinkModal}
            className="rounded-xl text-xs font-semibold gap-1.5 h-10"
          >
            <Link2 className="w-4 h-4" />
            Vincular
          </Button>

          <a
            href={`/api/admin/vehicle-lookup/${dto.id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            download={`historico-veicular_${dto.plate_normalized}_${dto.id}.pdf`}
            className={buttonVariants({
              className: 'rounded-xl text-xs font-semibold gap-1.5 h-10 shadow-xs',
            })}
          >
            <Download className="w-4 h-4" />
            Baixar Laudo PDF
          </a>
        </div>
      </div>

      <PurchaseAgreementModal
        open={isPurchaseModalOpen}
        onOpenChange={setIsPurchaseModalOpen}
        initialData={initialData}
      />
    </div>
  );
}
