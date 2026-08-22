import { notFound } from "next/navigation";
import { getMotorcycleBySlug } from "@/lib/queries/motorcycles";
import { ImageCarousel } from "@/components/gallery/image-carousel";
import { MotorcycleSpecs } from "@/components/motorcycles/motorcycle-specs";
import { WhatsAppCTA } from "@/components/motorcycles/whatsapp-cta";
import { formatCurrency } from "@/lib/utils/format";
import { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const moto = await getMotorcycleBySlug(slug);

  if (!moto) {
    return { title: "Moto não encontrada" };
  }

  const title = `${moto.brand} ${moto.model} ${moto.year_model} | AF Motos`;
  const description = moto.description 
    ? moto.description.substring(0, 160) 
    : `Confira a moto ${moto.brand} ${moto.model} na AF Motos. Excelente estado e as melhores condições.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      // images: moto.images?.[0] ? [moto.images[0].url] : [],
    },
  };
}

export default async function MotorcycleDetailPage({ params }: Props) {
  const { slug } = await params;
  const moto = await getMotorcycleBySlug(slug);

  if (!moto) {
    notFound();
  }

  const images = moto.images?.length > 0 ? moto.images : [];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Gallery & Description */}
        <div className="lg:col-span-2 space-y-8">
          <ImageCarousel images={images} />
          
          <div className="hidden lg:block">
            <MotorcycleSpecs motorcycle={moto} />
          </div>
        </div>

        {/* Right Column: Key Info & CTA */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {moto.brand} {moto.model}
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              {moto.version}
            </p>
          </div>

          <div className="text-4xl font-bold text-primary">
            {moto.price ? formatCurrency(moto.price) : "Consulte"}
          </div>

          <WhatsAppCTA motorcycle={moto} />

          <div className="lg:hidden mt-8">
            <MotorcycleSpecs motorcycle={moto} />
          </div>
        </div>

      </div>
    </main>
  );
}
