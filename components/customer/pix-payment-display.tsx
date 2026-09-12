'use client';

import { useState } from 'react';
import { Copy, Check, QrCode, RefreshCw, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface PixPaymentDisplayProps {
  qrCode?: string;
  qrCodeBase64?: string;
  onRefreshStatus?: () => void;
  isChecking?: boolean;
}

export function PixPaymentDisplay({
  qrCode,
  qrCodeBase64,
  onRefreshStatus,
  isChecking = false,
}: PixPaymentDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    if (!qrCode) return;
    try {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      toast.success('Código Pix Copia e Cola copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error('Não foi possível copiar automaticamente. Selecione e copie o código.');
    }
  };

  return (
    <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-center backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-center gap-2 text-amber-500 font-semibold mb-2">
        <QrCode className="h-5 w-5" />
        <span>Pagamento via Pix</span>
      </div>
      <p className="text-xs text-zinc-400 mb-6">
        Abra o app do seu banco, escolha Pix e escaneie o QR Code ou cole o código abaixo.
      </p>

      {/* QR Code Image */}
      {qrCodeBase64 && (
        <div className="mx-auto mb-6 flex h-60 w-60 items-center justify-center rounded-2xl bg-white p-3 shadow-md">
          <img
            src={`data:image/png;base64,${qrCodeBase64}`}
            alt="QR Code Pix"
            className="h-full w-full object-contain"
          />
        </div>
      )}

      {/* Copy & Paste Code */}
      {qrCode && (
        <div className="mb-6 space-y-2">
          <label className="text-xs font-medium text-zinc-300 block text-left">
            Código Pix Copia e Cola:
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              readOnly
              value={qrCode}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-2.5 pr-24 font-mono text-xs text-zinc-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              onClick={handleCopyCode}
              type="button"
              className="absolute right-1.5 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Expiration & Status Notice */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl bg-zinc-950/60 border border-zinc-800/80 p-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Clock className="h-4 w-4 text-amber-500 shrink-0" />
          <span>Este código expira em 30 minutos.</span>
        </div>

        {onRefreshStatus && (
          <button
            onClick={onRefreshStatus}
            disabled={isChecking}
            type="button"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Verificando...' : 'Atualizar Status'}
          </button>
        )}
      </div>
    </div>
  );
}
