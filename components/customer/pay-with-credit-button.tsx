'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';

interface PayWithCreditButtonProps {
  consultationId: string;
  balance: number;
}

export function PayWithCreditButton({ consultationId, balance }: PayWithCreditButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePay = async () => {
    if (!confirm('Deseja usar 1 crédito do seu pacote para liberar esta consulta?')) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/cliente/consultas/${consultationId}/pay-with-credit`, {
        method: 'POST',
      });
      const data = await res.json();
      
      if (data.success) {
        // Redireciona para a página de consulta, onde o process-delivery fará o resto
        router.push(`/cliente/consultas/${consultationId}`);
      } else {
        alert(data.error || 'Erro ao usar crédito.');
        setLoading(false);
      }
    } catch (err) {
      alert('Erro inesperado.');
      setLoading(false);
    }
  };

  if (balance <= 0) return null;

  return (
    <div className="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Você possui {balance} {balance === 1 ? 'crédito' : 'créditos'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">Use seu pacote pré-pago sem custos adicionais.</p>
        </div>
        <Button 
          onClick={handlePay} 
          disabled={loading}
          className="bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Usar 1 Crédito'}
        </Button>
      </div>
    </div>
  );
}
