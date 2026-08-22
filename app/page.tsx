import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { MotorcycleGrid } from "@/components/motorcycles/motorcycle-grid"
import { getFeaturedMotorcycles } from "@/lib/queries/motorcycles"

export default async function HomePage() {
  const featuredMotos = await getFeaturedMotorcycles()

  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* Hero Section */}
      <section className="relative w-full py-24 md:py-32 lg:py-48 bg-zinc-950 text-zinc-50 overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 z-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-40"></div>
        <div className="container relative z-10 px-4 md:px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">
            A sua próxima moto está aqui
          </h1>
          <p className="text-lg md:text-xl text-zinc-300 max-w-[700px] mx-auto mb-8">
            Especialistas em compra, venda, consignação e aluguel de motocicletas premium.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/motos" className={buttonVariants({ size: "lg", className: "text-base font-semibold" })}>
              Ver Catálogo
            </Link>
            <Link href="/venda-sua-moto" className={buttonVariants({ size: "lg", variant: "outline", className: "text-base font-semibold bg-transparent text-white border-zinc-700 hover:bg-zinc-800 hover:text-white" })}>
              Vender Minha Moto
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Section */}
      <section className="container px-4 md:px-6 mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">Motos em Destaque</h2>
            <p className="text-muted-foreground">As melhores oportunidades selecionadas para você.</p>
          </div>
          <Link href="/motos" className={buttonVariants({ variant: "ghost", className: "hidden sm:flex group" })}>
            Ver todas <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        
        <MotorcycleGrid motorcycles={featuredMotos} emptyMessage="Nenhuma moto em destaque no momento." />
        
        <div className="mt-8 flex justify-center sm:hidden">
          <Link href="/motos" className={buttonVariants({ variant: "outline", className: "w-full" })}>
            Ver todas as motos
          </Link>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-muted py-16">
        <div className="container px-4 md:px-6 mx-auto">
          <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">Nossos Serviços</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-background p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold mb-3">Venda & Consignação</h3>
              <p className="text-muted-foreground mb-4">Venda sua moto com segurança ou deixe em consignação com nossa equipe especializada.</p>
              <Link href="/consignar-moto" className={buttonVariants({ variant: "link", className: "px-0" })}>
                Saiba mais <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="bg-background p-6 rounded-xl shadow-sm">
              <h3 className="text-xl font-bold mb-3">Aluguel</h3>
              <p className="text-muted-foreground mb-4">Motos revisadas prontas para sua viagem ou dia a dia. Planos diários e mensais.</p>
              <Link href="/aluguel" className={buttonVariants({ variant: "link", className: "px-0" })}>
                Ver opções <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
            <div className="bg-background p-6 rounded-xl shadow-sm sm:col-span-2 lg:col-span-1">
              <h3 className="text-xl font-bold mb-3">Consultoria</h3>
              <p className="text-muted-foreground mb-4">Atendimento personalizado para encontrar a moto ideal para seu perfil e necessidade.</p>
              <Link href="/contato" className={buttonVariants({ variant: "link", className: "px-0" })}>
                Fale conosco <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
