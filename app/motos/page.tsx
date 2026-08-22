import { MotorcycleGrid } from "@/components/motorcycles/motorcycle-grid"
import { MotorcycleFilters } from "@/components/filters/motorcycle-filters"
import { getAllMotorcycles } from "@/lib/queries/motorcycles"

export const metadata = {
  title: 'Catálogo de Motos | AF Motos',
  description: 'Encontre a moto perfeita para você no nosso catálogo atualizado.',
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const motos = await getAllMotorcycles(searchParams)

  return (
    <div className="container px-4 md:px-6 mx-auto py-8">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight">Catálogo de Motos</h1>
        <p className="text-muted-foreground mt-2">
          Encontre a moto ideal para você. Mais de {motos.length} opções disponíveis.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="bg-muted/50 p-4 rounded-lg border">
            <h3 className="font-semibold mb-4 text-lg">Filtros</h3>
            <MotorcycleFilters />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Exibindo <strong>{motos.length}</strong> motos
            </div>
            {/* Sort Dropdown would go here */}
          </div>
          
          <MotorcycleGrid motorcycles={motos} />
        </main>
      </div>
    </div>
  )
}
