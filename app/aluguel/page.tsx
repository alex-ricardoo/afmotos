import { RentalForm } from "@/components/forms/rental-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Aluguel de Motos | AF Motos",
  description: "Alugue uma moto com as melhores condições. Diárias, semanais ou mensais.",
};

export default function AluguelPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Aluguel de Motos</h1>
        <p className="text-xl text-muted-foreground">
          A moto ideal para o seu dia a dia ou trabalho, com planos flexíveis.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitar Orçamento de Aluguel</CardTitle>
          <CardDescription>
            Preencha seus dados e o período desejado. Nossa equipe entrará em contato com as melhores opções.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RentalForm />
        </CardContent>
      </Card>
    </div>
  );
}
