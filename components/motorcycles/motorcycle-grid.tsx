import { MotorcycleCard, MotorcycleCardProps } from "./motorcycle-card"

interface MotorcycleGridProps {
  motorcycles: MotorcycleCardProps['motorcycle'][]
  emptyMessage?: string
}

export function MotorcycleGrid({ 
  motorcycles, 
  emptyMessage = "Nenhuma moto encontrada." 
}: MotorcycleGridProps) {
  if (motorcycles.length === 0) {
    return (
      <div className="w-full py-12 text-center text-muted-foreground">
        <p className="text-lg">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {motorcycles.map((moto) => (
        <MotorcycleCard key={moto.id} motorcycle={moto} />
      ))}
    </div>
  )
}
