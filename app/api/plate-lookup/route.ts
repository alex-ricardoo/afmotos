import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const plate = searchParams.get('plate');

  if (!plate || plate.length < 7) {
    return NextResponse.json({ error: 'Placa inválida' }, { status: 400 });
  }

  // TODO: Replace with actual external API integration
  // For MVP, we return a mock response
  const mockData = {
    brand: "Honda",
    model: "CG 160 Titan",
    year_manufacture: 2022,
    year_model: 2023,
    color: "Vermelha",
    engine_capacity: 160,
  };

  // Simulating network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  return NextResponse.json(mockData);
}
