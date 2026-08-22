import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { MapPinOff } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <MapPinOff className="w-16 h-16 text-muted-foreground mb-6" />
      <h2 className="text-3xl font-bold tracking-tight mb-2">Página não encontrada</h2>
      <p className="text-muted-foreground max-w-md mb-8">
        Desculpe, a página que você está procurando não existe ou foi movida. Talvez a moto que você
        procurava já tenha sido vendida.
      </p>
      <div className="flex gap-4">
        <Link href="/motos" className={buttonVariants({ variant: 'default' })}>
          Ver Estoque
        </Link>
        <Link href="/" className={buttonVariants({ variant: 'outline' })}>
          Página Inicial
        </Link>
      </div>
    </div>
  );
}
