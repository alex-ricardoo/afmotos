import { MotorcycleForm } from "@/components/admin/motorcycle-form";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export const metadata = {
  title: "Nova Moto | AF Motos Admin",
};

export default function NovaMotoPage() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/admin/motos" className={buttonVariants({ variant: "ghost", size: "icon" })}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">Adicionar Nova Moto</h1>
      </div>

      <MotorcycleForm />
    </div>
  );
}
