import { getAdminMotorcycles } from "@/lib/queries/motorcycles";
import { DataTable } from "@/components/admin/data-table";
import { columns } from "./columns";
import { buttonVariants } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata = {
  title: "Gerenciar Motos | AF Motos Admin",
};

export default async function AdminMotosPage() {
  const data = await getAdminMotorcycles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Estoque de Motos</h1>
        <Link href="/admin/motos/nova" className={buttonVariants()}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Moto
        </Link>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
}
