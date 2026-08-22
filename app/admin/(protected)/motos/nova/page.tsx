import { MotorcycleForm } from '@/components/admin/motorcycle-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

export const metadata = {
  title: 'Nova Moto | AF Motos Admin',
};

export default function NovaMotoPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-2 mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/admin" className="hover:text-primary transition-colors">
            Admin
          </Link>
          <span>/</span>
          <Link href="/admin/motos" className="hover:text-primary transition-colors">
            Motos
          </Link>
          <span>/</span>
          <span className="text-foreground">Nova moto</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/motos"
            className={buttonVariants({ variant: 'outline', size: 'icon' })}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Cadastrar motocicleta
            </h1>
            <p className="text-muted-foreground mt-1">
              Preencha os dados abaixo para criar um novo anúncio.
            </p>
          </div>
        </div>
      </div>

      <MotorcycleForm />
    </div>
  );
}
