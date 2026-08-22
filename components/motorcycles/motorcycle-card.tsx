import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { MotorcycleStatusBadge, MotorcycleStatus } from "./motorcycle-status-badge"
import { formatCurrency } from "@/lib/utils/format"

export interface MotorcycleCardProps {
  motorcycle: {
    id: string
    slug: string
    brand: string
    model: string
    version?: string | null
    year_manufacture: number
    year_model: number
    price: number | null
    mileage: number | null
    engine_capacity: number | null
    status: string
    image_url?: string
  }
}

export function MotorcycleCard({ motorcycle }: MotorcycleCardProps) {
  return (
    <Link href={`/motos/${motorcycle.slug}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer h-full flex flex-col">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {motorcycle.image_url ? (
            <Image
              src={motorcycle.image_url}
              alt={`${motorcycle.brand} ${motorcycle.model}`}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Sem Imagem
            </div>
          )}
          <div className="absolute top-2 right-2">
            <MotorcycleStatusBadge status={motorcycle.status as MotorcycleStatus} />
          </div>
        </div>
        
        <CardContent className="p-4 flex-1">
          <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold mb-1">
            {motorcycle.brand}
          </div>
          <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2">
            {motorcycle.model} {motorcycle.version}
          </h3>
          
          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>{motorcycle.year_manufacture}/{motorcycle.year_model}</span>
            <span>•</span>
            <span>{motorcycle.mileage ? `${motorcycle.mileage.toLocaleString('pt-BR')} km` : '0 km'}</span>
            {motorcycle.engine_capacity && (
              <>
                <span>•</span>
                <span>{motorcycle.engine_capacity}cc</span>
              </>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="p-4 pt-0">
          <div className="text-xl font-bold text-primary">
            {motorcycle.price ? formatCurrency(motorcycle.price) : 'Consulte'}
          </div>
        </CardFooter>
      </Card>
    </Link>
  )
}
