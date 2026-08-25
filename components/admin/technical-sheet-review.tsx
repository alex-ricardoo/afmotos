'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { CheckCircle2, Download, FileText, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  approveTechnicalSheetAction,
  createTechnicalSheetAction,
} from '@/lib/technical-sheet/actions';
import {
  technicalSheetStatusLabels,
  type MotorcycleTechnicalSheet,
} from '@/lib/technical-sheet/schema';

const TECHNICAL_SHEET_UI_TIMEOUT_MS = 150000;
const TECHNICAL_SHEET_PDF_TIMEOUT_MS = 90000;

type TechnicalSheetRecord = {
  id: string;
  motorcycle_id: string;
  schema_version: number;
  sheet_data: MotorcycleTechnicalSheet;
  status: keyof typeof technicalSheetStatusLabels;
  updated_at: string;
};

type Props = { motorcycleId: string; initialSheet: TechnicalSheetRecord | null };

type PendingAction = 'generate' | 'approve' | null;

export function TechnicalSheetReview({ motorcycleId, initialSheet }: Props) {
  const [sheet] = useState(initialSheet);
  const [isPending, startTransition] = useTransition();
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const status = sheet?.status as keyof typeof technicalSheetStatusLabels | undefined;
  const isWorking = isPending || pendingAction !== null;
  const isGenerating = pendingAction === 'generate';

  const run = (
    action: () => Promise<{ error?: string }>,
    success: string,
    actionType: Exclude<PendingAction, null>,
  ) => {
    if (isWorking) return;

    setElapsedSeconds(0);
    setPendingAction(actionType);
    startTransition(async () => {
      let timeoutId: number | undefined;
      const timeoutPromise = new Promise<{ timedOut: true }>((resolve) => {
        timeoutId = window.setTimeout(
          () => resolve({ timedOut: true }),
          TECHNICAL_SHEET_UI_TIMEOUT_MS,
        );
      });

      const actionPromise = action()
        .then((result) => ({ result }))
        .catch((error: unknown) => ({
          result: {
            error:
              error instanceof Error && error.message
                ? error.message
                : 'Não foi possível concluir a operação. Tente novamente.',
          },
        }));

      const outcome = await Promise.race([actionPromise, timeoutPromise]);
      if (timeoutId) window.clearTimeout(timeoutId);

      if ('timedOut' in outcome) {
        toast.error(
          'A consulta demorou mais que o esperado. Atualize a página em alguns instantes ou tente novamente.',
        );
        setElapsedSeconds(0);
        setPendingAction(null);
        return;
      }

      if (outcome.result?.error) toast.error(outcome.result.error);
      else {
        toast.success(success);
        window.location.reload();
      }
      setElapsedSeconds(0);
      setPendingAction(null);
    });
  };

  const downloadPdf = async () => {
    if (isDownloadingPdf) return;

    setIsDownloadingPdf(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), TECHNICAL_SHEET_PDF_TIMEOUT_MS);
    try {
      const response = await fetch(`/api/admin/motorcycles/${motorcycleId}/technical-sheet`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || 'Não foi possível baixar o PDF agora.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = resolvePdfFileName(response.headers.get('Content-Disposition'));
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Download do PDF iniciado.');
    } catch (error) {
      toast.error(
        error instanceof Error && error.name === 'AbortError'
          ? 'O PDF demorou mais que o esperado para gerar. Tente novamente.'
          : error instanceof Error && error.message
            ? error.message
            : 'Não foi possível baixar o PDF agora.',
      );
    } finally {
      window.clearTimeout(timeoutId);
      setIsDownloadingPdf(false);
    }
  };

  useEffect(() => {
    if (!isGenerating) return;

    const startedAt = Date.now();
    const interval = window.setInterval(
      () => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [isGenerating]);

  const progressStep = elapsedSeconds < 8 ? 1 : elapsedSeconds < 30 ? 2 : 3;

  if (!sheet)
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
        <h2 className="text-lg font-semibold">
          Ainda não existe uma ficha técnica para esta moto.
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A IA pesquisará automaticamente fontes técnicas oficiais para esta versão e ano.
        </p>
        {isGenerating ? (
          <GenerationProgress elapsedSeconds={elapsedSeconds} step={progressStep} />
        ) : (
          <Button
            className="mt-5"
            disabled={isWorking}
            onClick={() =>
              run(
                () => createTechnicalSheetAction(motorcycleId),
                'Ficha criada para revisão.',
                'generate',
              )
            }
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Gerar ficha técnica
          </Button>
        )}
      </div>
    );

  const data = sheet.sheet_data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
        <div>
          <p className="text-sm font-semibold">{technicalSheetStatusLabels[status || 'DRAFT']}</p>
          <p className="text-xs text-muted-foreground">
            Snapshot v{sheet.schema_version} · Atualizada em{' '}
            {new Date(sheet.updated_at).toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === 'APPROVED' ? (
            <>
              <Link
                className={buttonVariants({ variant: 'outline' })}
                href={`/api/admin/motorcycles/${motorcycleId}/technical-sheet?inline=1`}
                target="_blank"
              >
                <FileText className="mr-2 h-4 w-4" />
                Visualizar ficha
              </Link>
              <Button disabled={isDownloadingPdf} onClick={downloadPdf}>
                {isDownloadingPdf ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {isDownloadingPdf ? 'Baixando PDF...' : 'Baixar PDF'}
              </Button>
            </>
          ) : (
            <div className="flex flex-col items-end gap-2">
              <Button
                disabled={isWorking}
                onClick={() =>
                  run(() => approveTechnicalSheetAction(sheet.id), 'Ficha aprovada.', 'approve')
                }
              >
                {pendingAction === 'approve' ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                )}
                {pendingAction === 'approve' ? 'Aprovando...' : 'Aprovar ficha'}
              </Button>
              <span className="text-[11px] text-muted-foreground">
                O PDF aparece após a aprovação.
              </span>
            </div>
          )}
        </div>
      </div>
      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Atualizar especificações com IA
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          A IA pesquisará automaticamente fontes técnicas oficiais para esta versão e ano. Cada
          informação encontrada será acompanhada da fonte e ficará pendente de revisão.
        </p>
        {isGenerating ? (
          <GenerationProgress elapsedSeconds={elapsedSeconds} step={progressStep} />
        ) : (
          <Button
            className="mt-4"
            disabled={isWorking}
            onClick={() =>
              run(
                () => createTechnicalSheetAction(motorcycleId),
                'Nova ficha criada para revisão.',
                'generate',
              )
            }
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Gerar nova versão
          </Button>
        )}
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <ReviewSection title="Dados da unidade">
          <ReviewField
            label="Marca / modelo"
            value={`${data.identity.brand} ${data.identity.model}`}
          />
          <ReviewField label="Versão" value={data.identity.version} />
          <ReviewField
            label="Ano"
            value={`${data.identity.yearManufacture}/${data.identity.yearModel}`}
          />
          <ReviewField label="Cor" value={data.unitData.color} />
          <ReviewField
            label="Quilometragem"
            value={data.unitData.mileage === null ? null : `${data.unitData.mileage} km`}
          />
        </ReviewSection>
        <ReviewSection title="Motor e transmissão">
          <ReviewField
            label="Cilindrada"
            value={data.engine.displacementCc === null ? null : `${data.engine.displacementCc} cc`}
          />
          <ReviewField label="Combustível" value={data.engine.fuel} />
          <ReviewField label="Câmbio" value={data.engine.transmission} />
          {Object.entries(data.candidateEvidence).map(([field, evidence]) => (
            <details
              key={field}
              className="rounded-lg bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-200"
            >
              <summary className="cursor-pointer font-semibold">
                Informação encontrada: {field}
              </summary>
              <p className="mt-2">Fonte consultada: “{evidence}”</p>
            </details>
          ))}
        </ReviewSection>
      </div>
      <ReviewSection title="Destaques desta unidade">
        {data.highlights.length ? (
          data.highlights.map((highlight: string) => (
            <p key={highlight} className="text-sm text-foreground">
              • {highlight}
            </p>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nenhum destaque vinculado.</p>
        )}
      </ReviewSection>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <RefreshCw className="h-3.5 w-3.5" />
        Especificações não informadas permanecem ocultas no PDF.
      </div>
    </div>
  );
}

function resolvePdfFileName(contentDisposition: string | null) {
  const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1] || 'ficha-tecnica.pdf';
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-foreground">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
function ReviewField({ label, value }: { label: string; value: string | number | null }) {
  return value ? (
    <div className="flex justify-between gap-4 border-b border-border/60 py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  ) : null;
}

function GenerationProgress({ elapsedSeconds, step }: { elapsedSeconds: number; step: number }) {
  const steps = ['Identificando a moto', 'Pesquisando fontes', 'Organizando dados'];
  return (
    <div className="mx-auto mt-5 w-full max-w-2xl rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-left">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />A IA está pesquisando a ficha
          desta moto
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">{elapsedSeconds}s</span>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        {steps.map((label, index) => (
          <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className={`h-2 w-2 rounded-full ${index < step ? 'bg-amber-500' : 'bg-muted'}`}
            />
            {label}
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        A busca pode levar até alguns minutos. Não feche esta página.
      </p>
    </div>
  );
}
