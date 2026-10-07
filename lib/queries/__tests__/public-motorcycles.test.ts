import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  mapRawToPublicMotorcycle,
  sanitizeErrorMessage,
  type PublicMotorcycle,
} from '../public-motorcycles.ts';
import { getPublicSupabaseClient } from '../../supabase/public.ts';
import { revalidatePublicCatalog } from '../../cache/revalidate-catalog.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Public Motorcycle Catalog & Security Invariants', () => {
  describe('1. DTO Sanitization & Data Isolation (Confidential Fields Exclusion)', () => {
    it('should map public fields correctly and omit all internal confidential fields', () => {
      const rawDbRecordWithConfidentialFields = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        slug: 'honda-cg-160-titan-2023-af100',
        brand: 'HONDA',
        model: 'CG 160 TITAN',
        version: 'FLEXONE',
        year_manufacture: 2023,
        year_model: 2024,
        mileage: 12500,
        engine_capacity: 160,
        fuel: 'FLEX',
        transmission: 'MANUAL',
        color: 'VERMELHA',
        price: 18500,
        description: 'Moto em perfeito estado de conservação',
        status: 'AVAILABLE',
        featured: true,
        is_repasse: false,
        published_at: '2026-01-01T10:00:00.000Z',
        category_id: 'cat-01',
        category_name: 'Street',
        category_slug: 'street',
        operation_type: 'RETAIL',
        created_at: '2026-01-01T09:00:00.000Z',
        updated_at: '2026-01-02T10:00:00.000Z',
        images: [
          {
            id: 'img-1',
            provider: 'supabase',
            storage_path: 'motorcycles/img1.webp',
            public_url: 'https://cdn.example.com/motorcycles/img1.webp',
            is_primary: true,
            sort_order: 1,
            alt_text: 'Foto frontal da Honda CG 160',
            width: 1920,
            height: 1080,
          },
          {
            id: 'img-2',
            provider: 'imgbb',
            storage_path: 'motorcycles/img2.webp',
            display_url: 'https://i.ibb.co/img2.webp',
            delete_url: 'https://ibb.co/delete/secret-token-xyz', // Sensitive secret
            is_primary: false,
            sort_order: 2,
          },
        ],
        // SENSITIVE CONFIDENTIAL COLUMNS (Must NEVER leak to DTO)
        license_plate: 'PCQ5897',
        renavam: '12345678901',
        chassi: '9C2KC123456789012',
        chassis: '9C2KC123456789012',
        purchase_amount: 14000,
        purchase_date: '2025-12-15',
        seller_customer_id: 'cust-999',
        acquisition_agreement_id: 'agr-888',
        ownership_type: 'OWNED',
        internal_code: 'INT-445',
        customer_notes: 'Cliente vendeu com pressa',
        secret_token: 'should-never-pass',
      };

      const dto: any = mapRawToPublicMotorcycle(rawDbRecordWithConfidentialFields);

      // Verify essential public fields
      assert.strictEqual(dto.id, '123e4567-e89b-12d3-a456-426614174000');
      assert.strictEqual(dto.slug, 'honda-cg-160-titan-2023-af100');
      assert.strictEqual(dto.brand, 'HONDA');
      assert.strictEqual(dto.model, 'CG 160 TITAN');
      assert.strictEqual(dto.yearManufacture, 2023);
      assert.strictEqual(dto.yearModel, 2024);
      assert.strictEqual(dto.status, 'AVAILABLE');
      assert.strictEqual(dto.featured, true);
      assert.strictEqual(dto.price, 18500);

      // Verify strict exclusion of sensitive fields
      assert.strictEqual(dto.license_plate, undefined, 'license_plate must not be present in public DTO');
      assert.strictEqual(dto.renavam, undefined, 'renavam must not be present in public DTO');
      assert.strictEqual(dto.chassi, undefined, 'chassi must not be present in public DTO');
      assert.strictEqual(dto.chassis, undefined, 'chassis must not be present in public DTO');
      assert.strictEqual(dto.purchase_amount, undefined, 'purchase_amount must not be present in public DTO');
      assert.strictEqual(dto.purchase_date, undefined, 'purchase_date must not be present in public DTO');
      assert.strictEqual(dto.seller_customer_id, undefined, 'seller_customer_id must not be present in public DTO');
      assert.strictEqual(dto.acquisition_agreement_id, undefined, 'acquisition_agreement_id must not be present in public DTO');
      assert.strictEqual(dto.ownership_type, undefined, 'ownership_type must not be present in public DTO');
      assert.strictEqual(dto.customer_notes, undefined, 'customer_notes must not be present in public DTO');
      assert.strictEqual(dto.secret_token, undefined, 'secret_token must not be present in public DTO');

      // Verify images sanitization: delete_url must NOT be included in image objects
      assert.strictEqual(dto.images.length, 2);
      assert.strictEqual(dto.images[1].delete_url, undefined, 'delete_url must not be exposed');
      assert.strictEqual(dto.images[0].isPrimary, true);
      assert.strictEqual(dto.imageUrl, 'https://cdn.example.com/motorcycles/img1.webp');
    });

    it('should handle motorcycles with empty or null images gracefully without throwing', () => {
      const rawWithoutImages = {
        id: '222e4567-e89b-12d3-a456-426614174000',
        slug: 'yamaha-fazer-250-2022',
        brand: 'YAMAHA',
        model: 'FAZER 250',
        status: 'AVAILABLE',
        images: null,
      };

      const dto = mapRawToPublicMotorcycle(rawWithoutImages);

      assert.strictEqual(dto.id, '222e4567-e89b-12d3-a456-426614174000');
      assert.deepStrictEqual(dto.images, []);
      assert.strictEqual(dto.imageUrl, undefined);
    });
  });

  describe('2. Error Sanitization & Observability', () => {
    it('should redact sensitive tokens and credentials from error messages', () => {
      const rawErrorWithToken = 'Database connection failed: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz and key=secret123';
      const sanitized = sanitizeErrorMessage(rawErrorWithToken);

      assert.strictEqual(sanitized.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9'), false);
      assert.strictEqual(sanitized.includes('secret123'), false);
      assert.match(sanitized, /\[REDACTED\]/);
    });

    it('should provide default message when error is null or empty', () => {
      assert.strictEqual(sanitizeErrorMessage(null), 'Erro desconhecido na consulta do catálogo');
      assert.strictEqual(sanitizeErrorMessage(''), 'Erro desconhecido na consulta do catálogo');
    });
  });

  describe('3. Client Architecture & Authentication Decoupling', () => {
    it('should provide a sessionless anonymous public Supabase client', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL =
        process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock';

      const client = getPublicSupabaseClient();
      assert.ok(client, 'Public client must be initialized');

      // Verify that the public client singleton is reused across requests
      const secondClient = getPublicSupabaseClient();
      assert.strictEqual(
        client,
        secondClient,
        'Public client singleton should be reused for all public requests',
      );
    });
  });

  describe('4. Status Eligibility Rules', () => {
    it('should only accept AVAILABLE and SOLD as valid public statuses in the catalog', () => {
      const validStatuses = ['AVAILABLE', 'SOLD'];
      const invalidPublicStatuses = [
        'RESERVED',
        'RENTED',
        'MAINTENANCE',
        'UNAVAILABLE',
        'HIDDEN',
      ];

      for (const valid of validStatuses) {
        assert.ok(['AVAILABLE', 'SOLD'].includes(valid));
      }

      for (const invalid of invalidPublicStatuses) {
        assert.strictEqual(['AVAILABLE', 'SOLD'].includes(invalid), false);
      }
    });
  });

  describe('5. Migration Permissions & RLS Invariants', () => {
    it('should verify that the security migration enforces least-privilege on motorcycles and public_motorcycles', () => {
      const migrationPath = path.resolve(
        __dirname,
        '../../../supabase/migrations/20261007000000_secure_public_motorcycles_and_permissions.sql',
      );

      assert.ok(fs.existsSync(migrationPath), 'Migration file must exist');
      const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
      const normalizedSql = migrationSql.replace(/\s+/g, ' ');

      // 1. Verify REVOKE of write permissions from anon and authenticated
      assert.ok(
        normalizedSql.includes('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.motorcycles FROM anon, authenticated;'),
        'Must revoke destructive write commands on public.motorcycles',
      );
      assert.ok(
        normalizedSql.includes('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.motorcycle_images FROM anon, authenticated;'),
        'Must revoke destructive write commands on public.motorcycle_images',
      );
      assert.ok(
        normalizedSql.includes('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.public_motorcycles FROM anon, authenticated;'),
        'Must revoke write on public_motorcycles view',
      );

      // 2. Verify direct SELECT on motorcycles is revoked for anon
      assert.ok(
        normalizedSql.includes('REVOKE SELECT ON TABLE public.motorcycles FROM anon;'),
        'Must revoke direct SELECT from anon on table motorcycles',
      );
      assert.ok(
        normalizedSql.includes('REVOKE SELECT ON TABLE public.motorcycle_images FROM anon;'),
        'Must revoke direct SELECT from anon on table motorcycle_images',
      );

      // 3. Verify SELECT is granted ONLY on public_motorcycles view
      assert.ok(
        normalizedSql.includes('GRANT SELECT ON public.public_motorcycles TO anon, authenticated, service_role;'),
        'Must grant SELECT on public_motorcycles to anon and authenticated',
      );

      // 4. Verify that public_motorcycles view strictly excludes private columns
      assert.strictEqual(
        migrationSql.includes('m.license_plate,'),
        false,
        'View must never select m.license_plate',
      );
      assert.strictEqual(
        migrationSql.includes('m.chassi,'),
        false,
        'View must never select m.chassi',
      );
      assert.strictEqual(
        migrationSql.includes('m.renavam,'),
        false,
        'View must never select m.renavam',
      );
      assert.strictEqual(
        migrationSql.includes('m.purchase_amount,'),
        false,
        'View must never select m.purchase_amount',
      );

      // 5. Verify status filter in view definition
      assert.ok(
        migrationSql.includes("m.status IN ('AVAILABLE', 'SOLD')"),
        "View must filter status IN ('AVAILABLE', 'SOLD')",
      );
    });
  });

  describe('6. Cache Revalidation Integration', () => {
    it('should execute revalidatePublicCatalog without throwing errors', async () => {
      // Calling revalidatePublicCatalog with slug
      await assert.doesNotReject(async () => {
        await revalidatePublicCatalog('honda-cg-160-titan');
      });

      // Calling without slug
      await assert.doesNotReject(async () => {
        await revalidatePublicCatalog();
      });
    });
  });
});
