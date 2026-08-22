import { createClient } from "@/lib/supabase/server"

export async function getFeaturedMotorcycles() {
  const supabase = await createClient()
  
  // No Supabase, as motos precisam estar com status AVAILABLE e featured = true
  const { data, error } = await supabase
    .from('motorcycles')
    .select(`
      id,
      slug,
      brand,
      model,
      version,
      year_manufacture,
      year_model,
      price,
      mileage,
      engine_capacity,
      status
    `)
    .eq('featured', true)
    .neq('status', 'HIDDEN')
    .order('created_at', { ascending: false })
    .limit(4)

  if (error) {
    console.error("Error fetching featured motorcycles:", error)
    return []
  }

  // Se não houver data, retorna array vazio
  if (!data) return []
  
  // Por enquanto retornamos sem as imagens até termos o módulo de imagens pronto
  return data.map(moto => ({
    ...moto,
    image_url: undefined // TODO: Buscar a imagem primária de motorcycle_images
  }))
}

export async function getAllMotorcycles(searchParams?: any) {
  const supabase = await createClient()
  
  let query = supabase
    .from('motorcycles')
    .select(`
      id,
      slug,
      brand,
      model,
      version,
      year_manufacture,
      year_model,
      price,
      mileage,
      engine_capacity,
      status
    `)
    .neq('status', 'HIDDEN')
    
  // TODO: Add filters from searchParams
    
  query = query.order('created_at', { ascending: false })

  const { data, error } = await query

  if (error) {
    console.error("Error fetching motorcycles:", error)
    return []
  }

  return data?.map(moto => ({
    ...moto,
    image_url: undefined
  })) || []
}

export async function getMotorcycleBySlug(slug: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('motorcycles')
    .select(`*`)
    .eq('slug', slug)
    .single()

  if (error) {
    console.error("Error fetching motorcycle by slug:", error)
    return null
  }

  // TODO: Fetch images from motorcycle_images table

  return {
    ...data,
    images: [] // placeholder for now
  }
}

export async function getAdminMotorcycles() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('motorcycles')
    .select(`*`)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching admin motorcycles:", error)
    return []
  }

  return data || []
}

export async function getMotorcycleById(id: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('motorcycles')
    .select(`*`)
    .eq('id', id)
    .single()

  if (error) {
    console.error("Error fetching motorcycle by ID:", error)
    return null
  }

  return data
}

export async function getSoldMotorcycles() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('motorcycles')
    .select(`
      id,
      slug,
      brand,
      model,
      version,
      year_manufacture,
      year_model,
      price,
      mileage,
      engine_capacity,
      status
    `)
    .eq('status', 'SOLD')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error("Error fetching sold motorcycles:", error)
    return []
  }

  return data?.map(moto => ({
    ...moto,
    image_url: undefined
  })) || []
}


