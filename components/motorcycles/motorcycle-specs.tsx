import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";

interface MotorcycleSpecsProps {
  motorcycle: any;
}

export function MotorcycleSpecs({ motorcycle }: MotorcycleSpecsProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Moto</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-6 text-sm">
            <div>
              <dt className="text-muted-foreground font-medium">Marca</dt>
              <dd className="font-semibold text-lg">{motorcycle.brand}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">Modelo</dt>
              <dd className="font-semibold text-lg">{motorcycle.model}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">Ano</dt>
              <dd className="font-semibold text-lg">
                {motorcycle.year_manufacture} / {motorcycle.year_model}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground font-medium">Quilometragem</dt>
              <dd className="font-semibold text-lg">
                {motorcycle.mileage ? `${motorcycle.mileage.toLocaleString("pt-BR")} km` : "0 km"}
              </dd>
            </div>
            {motorcycle.engine_capacity && (
              <div>
                <dt className="text-muted-foreground font-medium">Cilindradas</dt>
                <dd className="font-semibold text-lg">{motorcycle.engine_capacity} cc</dd>
              </div>
            )}
            {motorcycle.color && (
              <div>
                <dt className="text-muted-foreground font-medium">Cor</dt>
                <dd className="font-semibold text-lg">{motorcycle.color}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {motorcycle.description && (
        <Card>
          <CardHeader>
            <CardTitle>Descrição do Vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none text-muted-foreground">
              {motorcycle.description.split('\n').map((paragraph: string, idx: number) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
