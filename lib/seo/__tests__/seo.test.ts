import { describe, it } from 'node:test';
import assert from 'node:assert';
import { getBaseSiteUrl, getCanonicalUrl, SEO_CONFIG } from '../config.ts';
import {
  formatMotorcycleTitle,
  formatMotorcycleDescription,
  safeJsonLdReplacer,
  ensureAbsoluteImageUrl,
} from '../utils.ts';
import { buildPageMetadata } from '../metadata.ts';
import { buildAutoDealerSchema } from '../schemas/auto-dealer.ts';
import { buildMotorcycleProductSchema } from '../schemas/product.ts';
import { buildBreadcrumbsSchema } from '../schemas/breadcrumbs.ts';
import { buildFaqSchema } from '../schemas/faq.ts';
import { buildVehicleHistoryServiceSchema } from '../schemas/vehicle-history.ts';

describe('SEO Centralized Configuration & Helpers', () => {
  it('resolves fallback site URL when environment variable is unset', () => {
    const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const base = getBaseSiteUrl();
    assert.strictEqual(base, SEO_CONFIG.defaultFallbackSiteUrl);

    if (originalEnv) process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
  });

  it('sanitizes trailing slashes on base site URL', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://meudominio.com.br///';
    const base = getBaseSiteUrl();
    assert.strictEqual(base, 'https://meudominio.com.br');
  });

  it('generates correct absolute canonical URLs', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://afmotos.com.br';
    assert.strictEqual(getCanonicalUrl(''), 'https://afmotos.com.br');
    assert.strictEqual(getCanonicalUrl('/'), 'https://afmotos.com.br');
    assert.strictEqual(getCanonicalUrl('/motos'), 'https://afmotos.com.br/motos');
    assert.strictEqual(
      getCanonicalUrl('motos/honda-cg-160'),
      'https://afmotos.com.br/motos/honda-cg-160',
    );
  });

  it('formats motorcycle title without duplicating store name', () => {
    const title = formatMotorcycleTitle({
      brand: 'Honda',
      model: 'CG 160 Start',
      version: 'ESD',
      year_model: 2024,
      location: 'Cabo de Santo Agostinho - PE',
    });
    assert.strictEqual(
      title,
      'Honda CG 160 Start ESD 2024 usada à venda em Cabo de Santo Agostinho - PE',
    );
  });

  it('formats motorcycle description with all available fields and location', () => {
    const desc = formatMotorcycleDescription(
      {
        brand: 'Yamaha',
        model: 'Fazer 250',
        year_model: 2023,
        mileage: 15000,
        color: 'Azul',
        price: 21900,
        location: 'Cabo de Santo Agostinho - PE',
      },
      'AF Motos',
    );
    assert.match(desc, /Yamaha Fazer 250 2023/);
    assert.match(desc, /15\.000 km/);
    assert.match(desc, /cor Azul/);
    assert.match(desc, /R\$ 21\.900,00/);
    assert.match(desc, /AF Motos/);
    assert.match(desc, /Cabo de Santo Agostinho - PE/);
  });

  it('ensures absolute image URL with fallback', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://afmotos.com.br';
    assert.strictEqual(
      ensureAbsoluteImageUrl('https://i.ibb.co/pic.jpg'),
      'https://i.ibb.co/pic.jpg',
    );
    assert.strictEqual(ensureAbsoluteImageUrl('/logo.jpg'), 'https://afmotos.com.br/logo.jpg');
    assert.strictEqual(ensureAbsoluteImageUrl(null), 'https://afmotos.com.br/logo.jpg');
  });

  it('sanitizes JSON-LD strings against script tags and HTML injection', () => {
    const unsafeData = {
      malicious: '</script><script>alert("xss")</script>',
      tag: '<b>Honda</b> & "Yamaha"',
    };
    const sanitized = safeJsonLdReplacer(unsafeData);
    assert.strictEqual(sanitized.includes('</script>'), false);
    assert.strictEqual(sanitized.includes('<script>'), false);
    assert.strictEqual(sanitized.includes('\\u003c/script\\u003e'), true);
    assert.strictEqual(sanitized.includes('\\u0026'), true);
  });
});

describe('Schema.org Builders', () => {
  it('builds valid AutoDealer schema with institutional data and opening hours', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://afmotos.com.br';
    const schema = buildAutoDealerSchema({
      siteName: 'AF Motos',
      phone: '5581988887777',
      email: 'contato@afmotos.com.br',
      detailedAddress: {
        street: 'Rua Milton Adolfo de Jesus',
        number: '68',
        neighborhood: 'São Francisco',
        city: 'Cabo de Santo Agostinho',
        state: 'PE',
        cep: '54350-655',
      },
      cnpj: '12.345.678/0001-90',
      socialLinks: [{ href: 'https://instagram.com/afmotospe' }],
    });

    assert.strictEqual(schema['@type'], 'AutoDealer');
    assert.strictEqual(schema.name, 'AF Motos');
    assert.strictEqual(schema.taxID, '12.345.678/0001-90');
    const address = schema.address as Record<string, unknown>;
    assert.strictEqual(address['@type'], 'PostalAddress');
    assert.strictEqual(address.postalCode, '54350-655');
    assert.strictEqual(address.addressLocality, 'Cabo de Santo Agostinho');
    assert.strictEqual(Array.isArray(schema.openingHoursSpecification), true);
    assert.strictEqual((schema.sameAs as string[])[0], 'https://instagram.com/afmotospe');
  });

  it('builds valid Product + Offer schema for active motorcycle', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://afmotos.com.br';
    const schema = buildMotorcycleProductSchema({
      slug: 'honda-cg-160-start-2024',
      brand: 'Honda',
      model: 'CG 160 Start',
      year_model: 2024,
      year_manufacture: 2023,
      price: 15500,
      images: [{ url: 'https://i.ibb.co/moto.jpg' }],
      status: 'AVAILABLE',
      siteName: 'AF Motos',
    });

    assert.strictEqual(schema['@type'], 'Product');
    assert.strictEqual(schema.name, 'Honda CG 160 Start 2024');
    assert.strictEqual(schema.category, 'Motorcycle');
    const offers = schema.offers as Record<string, unknown>;
    assert.strictEqual(offers['@type'], 'Offer');
    assert.strictEqual(offers.priceCurrency, 'BRL');
    assert.strictEqual(offers.price, '15500.00');
    assert.strictEqual(offers.availability, 'https://schema.org/InStock');
    assert.strictEqual(offers.itemCondition, 'https://schema.org/UsedCondition');
  });

  it('marks availability as OutOfStock for SOLD motorcycle in Product schema', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://afmotos.com.br';
    const schema = buildMotorcycleProductSchema({
      slug: 'honda-cg-160-vendida',
      brand: 'Honda',
      model: 'CG 160',
      price: 14000,
      status: 'SOLD',
    });

    const offers = schema.offers as Record<string, unknown>;
    assert.strictEqual(offers.availability, 'https://schema.org/OutOfStock');
  });

  it('builds valid BreadcrumbList schema with sequential positions', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://afmotos.com.br';
    const schema = buildBreadcrumbsSchema([
      { name: 'Início', path: '/' },
      { name: 'Motos Disponíveis', path: '/motos' },
      { name: 'Honda CG 160', path: '/motos/honda-cg-160' },
    ]);

    assert.strictEqual(schema['@type'], 'BreadcrumbList');
    const items = schema.itemListElement as Array<Record<string, unknown>>;
    assert.strictEqual(items.length, 3);
    assert.strictEqual(items[0].position, 1);
    assert.strictEqual(items[0].name, 'Início');
    assert.strictEqual(items[0].item, 'https://afmotos.com.br');
    assert.strictEqual(items[2].position, 3);
    assert.strictEqual(items[2].name, 'Honda CG 160');
    assert.strictEqual(items[2].item, 'https://afmotos.com.br/motos/honda-cg-160');
  });

  it('builds valid FAQPage schema', () => {
    const schema = buildFaqSchema([
      { question: 'Como funciona a avaliação?', answer: 'Avaliamos pela tabela FIPE.' },
      { question: 'Como recebo o pagamento?', answer: 'À vista via PIX.' },
    ]);

    assert.strictEqual(schema['@type'], 'FAQPage');
    const entities = schema.mainEntity as Array<{
      '@type': string;
      name: string;
      acceptedAnswer: { '@type': string; text: string };
    }>;
    assert.strictEqual(entities.length, 2);
    assert.strictEqual(entities[0]['@type'], 'Question');
    assert.strictEqual(entities[0].name, 'Como funciona a avaliação?');
    assert.strictEqual(entities[0].acceptedAnswer['@type'], 'Answer');
    assert.strictEqual(entities[0].acceptedAnswer.text, 'Avaliamos pela tabela FIPE.');
  });

  it('builds valid Vehicle History Service, Breadcrumb and FAQ schemas', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://afmotos.com.br';
    const schemas = buildVehicleHistoryServiceSchema({
      siteName: 'AF Motos',
      price: 39.99,
      faqs: [
        { question: 'O que consulta?', answer: 'Débitos e leilão.' },
      ],
    });

    assert.strictEqual(schemas.length, 3);
    const [service, breadcrumb, faq] = schemas;
    assert.strictEqual(service['@type'], 'Service');
    assert.strictEqual((service.offers as Record<string, unknown>).price, '39.99');
    assert.strictEqual(breadcrumb['@type'], 'BreadcrumbList');
    assert.strictEqual(faq['@type'], 'FAQPage');
  });
});

describe('Next.js PageMetadata Builder', () => {
  it('builds standard page metadata with canonical and openGraph tags', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://afmotos.com.br';
    const meta = buildPageMetadata({
      title: 'Motos Disponíveis | AF Motos',
      description: 'Confira as motos disponíveis na AF Motos.',
      path: '/motos',
    });

    assert.strictEqual(meta.title, 'Motos Disponíveis | AF Motos');
    assert.strictEqual(meta.description, 'Confira as motos disponíveis na AF Motos.');
    assert.strictEqual(meta.alternates?.canonical, 'https://afmotos.com.br/motos');
    const og = meta.openGraph as Record<string, unknown>;
    assert.strictEqual(og?.type, 'website');
    assert.strictEqual(og?.url, 'https://afmotos.com.br/motos');
    const tw = meta.twitter as Record<string, unknown>;
    assert.strictEqual(tw?.card, 'summary_large_image');
  });

  it('applies noindex when requested (e.g. for filtered catalog or sold bike)', () => {
    const meta = buildPageMetadata({
      title: 'Busca de Motos',
      description: 'Resultados filtrados.',
      path: '/motos',
      noIndex: true,
    });

    const robots = meta.robots as Record<string, unknown>;
    assert.strictEqual(robots?.index, false);
    assert.strictEqual(robots?.follow, true);
  });
});
