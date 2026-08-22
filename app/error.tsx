'use client';

import { useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled Global Error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <AlertCircle className="w-16 h-16 text-destructive mb-6" />
      <h2 className="text-3xl font-bold tracking-tight mb-2">Ops! Algo deu errado.</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Lamentamos, mas ocorreu um erro inesperado ao tentar carregar esta página. Nossa equipe já
        foi notificada.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()} variant="default">
          Tentar novamente
        </Button>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Voltar para o início
        </Link>
      </div>
    </div>
  );
}
