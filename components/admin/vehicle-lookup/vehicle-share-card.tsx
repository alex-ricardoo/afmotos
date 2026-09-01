'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Share2,
  ShieldCheck,
  Eye,
  Download,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Ban,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  createVehicleReportShareAction,
  revokeVehicleReportShareAction,
} from '@/lib/actions/vehicle-share';
import type { AdminVehicleShareDetailsDto } from '@/lib/vehicle-lookup/share-types';
import { VehicleShareModal } from './vehicle-share-modal';
import { VehicleRevokeModal } from './vehicle-revoke-modal';

interface VehicleShareCardProps {
  consultationId: string;
  plateDisplay: string;
  consultationStatus: string;
  initialShareDetails?: AdminVehicleShareDetailsDto;
  storeName?: string;
}

export function VehicleShareCard({
  consultationId,
  plateDisplay,
  consultationStatus,
  initialShareDetails,
  storeName = 'AF Motos',
}: VehicleShareCardProps) {
  const [details, setDetails] = useState<AdminVehicleShareDetailsDto>(
    initialShareDetails || { hasActiveShare: false }
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [modalShareUrl, setModalShareUrl] = useState<string | null>(null);
  const [isRevokeModalOpen, setIsRevokeModalOpen] = useState(false);

  const canShare = consultationStatus === 'COMPLETED';

  const handleGenerateShare = async (forceRevokeExisting = false) => {
    if (!canShare) {
      toast.error('Apenas consultas concluídas podem ser compartilhadas.');
      return;
    }

    try {
      setIsGenerating(true);
      const res = await createVehicleReportShareAction({
        consultationId,
        forceRevokeExisting,
      });

      if (!res.success) {
        if (res.hasActiveShareConflict) {
          const confirmRevoke = window.confirm(
            'Esta consulta já possui um link público ativo. Deseja revogar o link anterior e gerar um novo?'
          );
          if (confirmRevoke) {
            await handleGenerateShare(true);
          }
          return;
        }
        toast.error(res.error || 'Erro ao gerar link.');
        return;
      }

      if (res.data) {
        setModalShareUrl(res.data.share_url);
        setDetails({
          hasActiveShare: true,
          activeShare: {
            id: res.data.share_id,
            status: 'active',
            createdAt: res.data.created_at,
            lastAccessedAt: null,
            accessCount: 0,
            lastPdfDownloadAt: null,
            pdfDownloadCount: 0,
            lastPrintAt: null,
            printCount: 0,
          },
        });
        toast.success('Novo link seguro gerado com sucesso!');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Falha ao processar solicitação.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmRevocation = async (reason: string) => {
    if (!details.activeShare?.id) return;

    const res = await revokeVehicleReportShareAction({
      shareId: details.activeShare.id,
      consultationId,
      reason,
    });

    if (!res.success) {
      toast.error(res.error || 'Erro ao revogar o link.');
      return;
    }

    setDetails({
      hasActiveShare: false,
      latestRevocation: {
        revokedAt: new Date().toISOString(),
        reason: reason || 'Revogado manualmente',
      },
    });

    toast.success('Link de compartilhamento revogado imediatamente.');
  };

  return (
    <>
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Share2 className="h-4 w-4" />
              </div>
              <CardTitle className="text-sm font-semibold">Compartilhamento com Cliente</CardTitle>
            </div>

            {details.hasActiveShare ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1 text-[11px]">
                <ShieldCheck className="h-3 w-3" />
                Link Ativo
              </Badge>
            ) : details.latestRevocation ? (
              <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 gap-1 text-[11px]">
                <Ban className="h-3 w-3" />
                Revogado
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-muted text-muted-foreground text-[11px]">
                Sem Link Ativo
              </Badge>
            )}
          </div>
          <CardDescription className="text-xs">
            Gere links criptografados temporários ou públicos para envio direto a compradores via WhatsApp.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 text-xs pt-0">
          {details.hasActiveShare && details.activeShare ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/40">
                <div className="space-y-0.5">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Eye className="h-3 w-3" /> Acessos
                  </span>
                  <span className="font-semibold text-sm">{details.activeShare.accessCount}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Download className="h-3 w-3" /> Downloads PDF
                  </span>
                  <span className="font-semibold text-sm">{details.activeShare.pdfDownloadCount}</span>
                </div>
                <div className="space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Criado em
                  </span>
                  <span className="font-medium text-[11px] text-muted-foreground">
                    {new Date(details.activeShare.createdAt).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {details.activeShare.lastAccessedAt && (
                <p className="text-[11px] text-muted-foreground italic">
                  Último acesso pelo cliente em{' '}
                  {new Date(details.activeShare.lastAccessedAt).toLocaleString('pt-BR')}.
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateShare(true)}
                  disabled={isGenerating}
                  className="gap-1.5 text-xs h-8"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Gerar Novo Link
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsRevokeModalOpen(true)}
                  disabled={isGenerating}
                  className="gap-1.5 text-xs h-8 ml-auto"
                >
                  <Ban className="h-3.5 w-3.5" />
                  Revogar Link
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {details.latestRevocation && (
                <div className="rounded-lg border border-border/60 bg-muted/30 p-2.5 text-[11px] text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1 font-medium text-foreground">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    Último link revogado em{' '}
                    {new Date(details.latestRevocation.revokedAt).toLocaleString('pt-BR')}
                  </div>
                  {details.latestRevocation.reason && (
                    <p className="text-[11px]">Motivo: {details.latestRevocation.reason}</p>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-muted-foreground leading-tight">
                  {canShare
                    ? `O cliente receberá uma página limpa com a identidade da ${storeName} sem ver custos internos ou dados brutos.`
                    : 'Aguardando conclusão da consulta veicular para liberação de compartilhamento.'}
                </p>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => handleGenerateShare(false)}
                  disabled={isGenerating || !canShare}
                  className="gap-1.5 text-xs shrink-0"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Gerar Link de Visualização
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {modalShareUrl && (
        <VehicleShareModal
          isOpen={Boolean(modalShareUrl)}
          onClose={() => setModalShareUrl(null)}
          shareUrl={modalShareUrl}
          plateDisplay={plateDisplay}
        />
      )}

      {isRevokeModalOpen && (
        <VehicleRevokeModal
          isOpen={isRevokeModalOpen}
          onClose={() => setIsRevokeModalOpen(false)}
          onConfirm={handleConfirmRevocation}
          plateDisplay={plateDisplay}
        />
      )}
    </>
  );
}
