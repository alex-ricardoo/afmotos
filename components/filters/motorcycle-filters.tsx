'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function MotorcycleFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get('q') || '')

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(name, value)
      } else {
        params.delete(name)
      }
      return params.toString()
    },
    [searchParams]
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/motos?${createQueryString('q', search)}`)
  }

  const clearFilters = () => {
    setSearch('')
    router.push('/motos')
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="search">Buscar</Label>
          <div className="flex gap-2">
            <Input 
              id="search" 
              placeholder="Marca, modelo..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit">Ir</Button>
          </div>
        </div>
      </form>
      
      <div className="space-y-4">
        {/* Placeholder for more filters (brand, price, year, etc) */}
        <div className="space-y-2">
          <Label>Marca</Label>
          <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
            <option value="">Todas</option>
            <option value="honda">Honda</option>
            <option value="yamaha">Yamaha</option>
            <option value="bmw">BMW</option>
          </select>
        </div>
      </div>
      
      <Button variant="outline" className="w-full" onClick={clearFilters}>
        Limpar Filtros
      </Button>
    </div>
  )
}
