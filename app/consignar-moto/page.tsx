import { ConsignmentForm } from "@/components/forms/consignment-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Consignar Moto | AF Motos",
  description: "Deixe a venda da sua moto conosco. Preencha o formulário para consignação.",
};

export default function ConsignarMotoPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Consignar Sua Moto</h1>
        <p className="text-xl text-muted-foreground">
          Nós vendemos sua moto por você. Mais segurança e o melhor preço de mercado.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preencha os dados da sua moto</CardTitle>
          <CardDescription>
            Use a placa para preenchimento automático. Avaliaremos as informações para propor a consignação.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConsignmentForm />
        </CardContent>
      </Card>
    </div>
  );
}
