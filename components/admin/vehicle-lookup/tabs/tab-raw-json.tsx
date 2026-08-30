'use client';

import React, { useState } from 'react';
import type { InternalVehicleConsultationDto } from '@/lib/vehicle-lookup/types';
import { Copy, Check, Search, Code2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function TabRawJson({ dto }: { dto: InternalVehicleConsultationDto }) {
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const jsonString = JSON.stringify(dto.raw_response, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      toast.success('JSON copiado para a área de transferência!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar JSON.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Code2 className="w-5 h-5 text-primary" />
          <div>
            <h4 className="font-bold text-foreground text-sm">Payload Bruto do Provedor</h4>
            <p className="text-xs text-muted-foreground">Snapshot imutável recebido na data da consulta.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="rounded-xl text-xs font-semibold gap-1.5 h-9"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copiado!' : 'Copiar JSON'}
          </Button>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="rounded-2xl border border-border/80 bg-zinc-950 p-4 sm:p-5 overflow-hidden shadow-inner">
        <pre className="overflow-x-auto text-xs font-mono text-zinc-200 leading-relaxed max-h-[600px] scrollbar-thin">
          {jsonString}
        </pre>
      </div>
    </div>
  );
}
