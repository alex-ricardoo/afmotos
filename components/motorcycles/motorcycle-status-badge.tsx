import { Badge } from "@/components/ui/badge"

export type MotorcycleStatus = 
  | 'AVAILABLE' 
  | 'RESERVED' 
  | 'SOLD' 
  | 'RENTED' 
  | 'MAINTENANCE' 
  | 'UNAVAILABLE' 
  | 'HIDDEN'

interface StatusBadgeProps {
  status: MotorcycleStatus
  className?: string
}

const statusConfig: Record<MotorcycleStatus, { label: string, variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  AVAILABLE: { label: 'Disponível', variant: 'default' },
  RESERVED: { label: 'Reservada', variant: 'secondary' },
  SOLD: { label: 'Vendida', variant: 'outline' },
  RENTED: { label: 'Alugada', variant: 'secondary' },
  MAINTENANCE: { label: 'Em Manutenção', variant: 'outline' },
  UNAVAILABLE: { label: 'Indisponível', variant: 'destructive' },
  HIDDEN: { label: 'Oculta', variant: 'outline' },
}

export function MotorcycleStatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: 'default' }
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  )
}
