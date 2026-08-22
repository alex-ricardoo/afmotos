import { SellForm } from "@/components/forms/sell-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Venda Sua Moto | AF Motos",
  description: "Venda sua moto com segurança e rapidez. Preencha o formulário e receba uma avaliação.",
};

export default function VendaSuaMotoPage() {
  return (
    <div className="container mx-auto py-12 px-4 max-w-3xl">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold tracking-tight mb-4">Venda Sua Moto</h1>
        <p className="text-xl text-muted-foreground">
          Compramos sua moto com pagamento à vista e a melhor avaliação do mercado.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preencha os dados da sua moto</CardTitle>
          <CardDescription>
            Use a placa para preenchimento automático. Avaliaremos as informações e entraremos em contato.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SellForm />
        </CardContent>
      </Card>
    </div>
  );
}
