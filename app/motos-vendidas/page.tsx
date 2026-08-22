import { getSoldMotorcycles } from "@/lib/queries/motorcycles";
import { MotorcycleGrid } from "@/components/motorcycles/motorcycle-grid";

export const metadata = {
  title: "Motos Vendidas | AF Motos",
  description: "Confira o histórico de motos vendidas pela AF Motos.",
};

export default async function MotosVendidasPage() {
  const motorcycles = await getSoldMotorcycles();

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Motos Vendidas</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Nosso histórico de sucesso. Estas motos já encontraram novos donos, mas mostram o padrão de qualidade que oferecemos.
        </p>
      </div>

      <MotorcycleGrid motorcycles={motorcycles} />
    </div>
  );
}
