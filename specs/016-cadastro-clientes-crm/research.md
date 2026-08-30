# Research Notes: Cadastro e CRM de Clientes

**Feature**: 016-cadastro-clientes-crm
**Created**: 2026-08-29
**Status**: Complete

## Audit Summary

### Files Reviewed

| File/Directory | Purpose | Key Findings |
| --- | --- | --- |
| `app/admin/(protected)/layout.tsx` | Admin layout structure | Uses `AdminSidebar`, `AdminHeader`, `AdminBottomNav`. Dark theme `bg-[#08080a]`. Fixed sidebar 64w on lg+, bottom nav on mobile. |
| `components/admin/admin-sidebar.tsx` | Desktop navigation | Uses `lucide-react` icons. Navigation array with 7 items. Gold accent `#c9a44c`. "Clientes" should go after "Vendas" (Receipt icon) and before "Contatos & Propostas". |
| `components/admin/admin-bottom-nav.tsx` | Mobile dock | Shows 4 items + "Mais" sheet. Clientes should be added to the "Mais" sheet sidebar (via AdminSidebar). |
| `components/admin/sales/sale-form.tsx` | Sale registration form | 1162 lines. Uses `react-hook-form` + Zod. Buyer fields: buyer_name, buyer_phone, buyer_email, buyer_document (CPF), buyer_cep, buyer_street, etc. Uses ViaCEP lookup. No customer_id linkage today. |
| `lib/actions/sales.ts` | Server action for sales | `createSaleAction` inserts directly into `sales` table with buyer fields as flat text. No deduplication or client lookup. |
| `lib/validations/sale.ts` | Zod schema for sales | buyer_name required (min 2), buyer_phone required (min 8), buyer_document required (min 11), buyer_cep required (min 8). Email optional. |
| `lib/utils/formatters.ts` | Formatting utilities | Has `formatCpf`, `formatPhone`, `formatCep`, `cleanNumeric`. Missing: `normalizePhone`, `normalizeCpf`, `normalizeEmail`, `isValidCpf`, `maskCpf`. |
| `components/admin/proposal-detail-drawer.tsx` | Proposal detail | 1282 lines. Uses Sheet/Dialog pattern. Shows lead/sell_request details with name, phone, email. No customer_id linkage. |
| `supabase/migrations/00010_sales.sql` | Original sales table | buyer_name, buyer_phone, buyer_email only. No document/address. |
| `supabase/migrations/20260823000000_enhance_sales.sql` | Enhanced sales | Added buyer_document, buyer_address, payment_status, amount_paid. Uses `is_admin()` for RLS. |
| `supabase/migrations/20260823010000_enhance_sales_official_receipt.sql` | Receipt fields | Added buyer_cep, buyer_street, buyer_number, buyer_complement, buyer_neighborhood, buyer_city, buyer_state, renavam, chassi, delivery_km. |
| `supabase/migrations/00011_leads.sql` | Leads table | Has name, phone, email, type (6 types), status (6 states), motorcycle_id, metadata jsonb. No customer_id. |
| `supabase/migrations/00014_sell_requests.sql` | Sell requests | Has name, phone, email, lead_id FK. No customer_id. Has FIPE/pricing fields. |
| `supabase/migrations/00009_consignments.sql` | Consignments | References `motorcycle_owners(id)` as owner_id. No direct customer concept. |
| `supabase/migrations/00008_motorcycle_owners.sql` | Motorcycle owners | Separate table: name, phone, email, document. Indexes on phone/email. This is a proto-customer. |
| `supabase/migrations/00012_rentals.sql` | Rentals | Has customer_name, customer_phone, customer_email. No customer_id. |
| `supabase/migrations/20260823020000_create_rental_requests.sql` | Rental requests | Has name, phone, age, has_cnh_a. No customer_id. |
| `supabase/migrations/20260826000000_sale_agreements.sql` | Sale agreements | Has owner_cpf, owner_rg, owner_address, owner_phone. No customer FK. |
| `supabase/migrations/00017_rls_policies.sql` | Initial RLS | Early policies used `auth.role() = 'authenticated'` (any auth user = admin). |
| `supabase/migrations/00020_fix_is_admin.sql` | Admin function | Defines `public.is_admin()` — checks `admin_profiles` for `auth_user_id = auth.uid()` with role admin/super_admin and is_active = true. SECURITY DEFINER. |
| `types/database.ts` | TS types | 623 lines. All tables typed. Sale interface has all buyer_ fields. No customer concept. |

---

## Decision 1: Table Name — `customers` vs `clients`

### Decision
Use **`customers`** as the table name.

### Rationale
- The existing codebase already uses English for all table and column names: `sales`, `leads`, `rentals`, `consignments`, `motorcycle_owners`, `sell_requests`.
- `customers` follows the established English naming convention.
- In the `rentals` table, the project already uses `customer_name`, `customer_phone`, `customer_email` as column names — showing the team's natural association with the word "customer".
- The UI will display "Clientes" in Portuguese, consistent with the localized admin panel.

### Alternatives Considered
- `clients`: Valid English synonym but not used anywhere in the codebase. "Clients" often implies a professional-services relationship (lawyer→client), whereas "customers" fits retail/commerce better.

### Consequences
- All TS types, server actions, and DB migrations will use `customers` / `Customer`.
- UI labels will display "Clientes" in pt-BR.

---

## Decision 2: Relationship Model — FKs Específicas vs Tabela Relacional Genérica

### Decision
Use **Alternative A — FKs específicas por domínio** with a complementary aggregate query for the detail page timeline.

### Rationale
- The project currently has 6 domain tables that reference person data (sales, sell_requests, leads, consignments/motorcycle_owners, rentals, rental_requests). Each has a clear, singular relationship to a customer.
- FKs provide:
  - Strong referential integrity enforced by PostgreSQL.
  - Simple, efficient JOINs for each domain.
  - No polymorphic `entity_type` + `entity_id` that loses FK constraints.
  - Better TypeScript type safety — each table's type includes an explicit `customer_id?: string | null`.
- A generic `customer_relationships` table introduces complexity (entity_type enum, no FK enforcement on entity_id, complex queries) without proportional benefit for 6 known entity types.
- The timeline/history view on the detail page can be built by aggregating queries across the specific tables (UNION ALL or parallel queries) — this is simpler and more performant than a separate events table for the MVP.

### Specific FKs to Add

| Table | New Column | Nullable | Notes |
| --- | --- | --- | --- |
| `sales` | `customer_id uuid REFERENCES customers(id)` | YES | Buyer. Preserves buyer_ snapshot fields. |
| `sell_requests` | `customer_id uuid REFERENCES customers(id)` | YES | Seller/requester. Preserves name/phone/email. |
| `leads` | `customer_id uuid REFERENCES customers(id)` | YES | Contact/lead. Preserves name/phone/email. |
| `rentals` | `customer_id uuid REFERENCES customers(id)` | YES | Renter. Preserves customer_ snapshot fields. |
| `rental_requests` | `customer_id uuid REFERENCES customers(id)` | YES | Requester. Preserves name/phone. |
| `motorcycle_owners` | `customer_id uuid REFERENCES customers(id)` | YES | Owner. Preserves name/phone/email/document. |

### Alternatives Considered
- **Alternative B (Generic relationship table)**: Discarded due to loss of FK integrity, complex queries, and over-engineering for 6 known entities.
- **Hybrid approach**: Considered but the domain is well-defined enough that FKs alone suffice. The timeline view can aggregate at query time without a dedicated events table.

### Consequences
- 6 new nullable FK columns, each with an index.
- 6 ALTER TABLE migrations (idempotent).
- No new junction table.
- Timeline view built from UNION queries or parallel fetches.

---

## Decision 3: Deduplication Strategy

### Decision
Multi-level deduplication with CPF as hard block and phone/email as soft alerts.

### Rationale
- CPF is a unique national identifier — two different customers should never share it.
- Phone numbers can be shared (family, company), so a hard unique constraint would break legitimate use cases.
- Email is informational for this domain — many customers won't have one.

### Strategy

| Identifier | Behavior | Database Constraint |
| --- | --- | --- |
| CPF (normalized) | **Hard block**: If CPF exists, cannot create new customer. Show link to existing. | `CREATE UNIQUE INDEX idx_customers_cpf_unique ON customers(cpf_normalized) WHERE cpf_normalized IS NOT NULL` |
| Phone (normalized) | **Soft alert**: Show "Possível duplicata" with option to view existing or proceed. | `CREATE INDEX idx_customers_phone ON customers(phone_normalized)` (no unique) |
| Email (normalized) | **Informational warning**: Show "E-mail já cadastrado" without blocking. | `CREATE INDEX idx_customers_email ON customers(email_normalized) WHERE email_normalized IS NOT NULL` |
| Name only | **No deduplication**: Names are too ambiguous. | N/A |

### Service Implementation
A `findOrCreateCustomer` service will:
1. If CPF provided → search by `cpf_normalized`. If found → return existing (or error in manual flow).
2. If phone provided → search by `phone_normalized`. If found → return existing(s) for review.
3. If email provided → search by `email_normalized`. If found → add to candidates list.
4. Return candidates for admin review (manual flow) or auto-match (automated flow with high confidence).

### Consequences
- No two customers with the same valid CPF can exist.
- Phone-based alerts may surface false positives (family) — admin decides.
- Empty CPF/phone stored as NULL (not empty string) for proper index behavior.

---

## Decision 4: Snapshot Preservation in Sales

### Decision
Sales records will continue storing buyer_ snapshot fields independently. The `customer_id` FK is additive — it does NOT replace the snapshot.

### Rationale
- Receipts and contracts use the data as it was at the time of sale. If a customer changes address or phone later, past documents must not change.
- The existing `sale_form.tsx` and `createSaleAction` already write buyer_ fields to the `sales` table. This must continue.
- The `customer_id` enables navigating to the customer profile and aggregating history, but the snapshot remains the source of truth for that specific sale.

### Data Flow
1. Admin selects or creates customer → form pre-fills buyer_ fields from customer data.
2. Admin can edit buyer_ fields for that specific sale (snapshot).
3. On save, both `customer_id` and buyer_ snapshot fields are written.
4. Editing the customer profile later does NOT retroactively update sales.
5. An optional checkbox "Atualizar cadastro do cliente com estes dados" (unchecked by default) allows explicit sync-back — except for CPF, which is never silently updated.

### Consequences
- Slight data redundancy (buyer_ fields + customer record) — acceptable for historical integrity.
- Receipt PDF continues rendering from buyer_ snapshot fields, not from customers table.

---

## Decision 5: Customer Creation from Website Forms

### Decision
Create customers on form submission (not on admin qualification) when name + phone are available. Use `findOrCreateCustomer` service.

### Rationale
- `sell_requests` and `rental_requests` already require `name` and `phone` as NOT NULL. These are sufficient for customer creation.
- `leads` also require `name` and `phone` as NOT NULL.
- Creating at submission time is simpler and ensures every lead/request has a customer record for CRM purposes.
- The `findOrCreateCustomer` service handles deduplication, making this idempotent.

### Trigger Points

| Form/Table | When | Source Value |
| --- | --- | --- |
| sell_requests | On INSERT (via trigger or application code) | `website_sell_request` |
| rental_requests | On INSERT | `rental_registration` |
| leads (GENERAL_CONTACT, MOTORCYCLE_INTEREST) | On INSERT | `website_contact` |
| leads (SELL_MOTORCYCLE, CONSIGNMENT) | On INSERT, if no sell_request/consignment exists | `website_sell_request` or `website_consignment_request` |

### Implementation Approach
- Prefer application-level service call in the existing server action / API route handler that processes form submissions.
- Fall back to DB trigger only if application-level is not feasible (e.g., direct Supabase insert from client).
- For existing data: plan a one-time migration script (not auto-executed).

### Consequences
- Every form submission with name + phone produces a customer record.
- Customer's `source` reflects their first entry point (never overwritten).

---

## Decision 6: Timeline / History View

### Decision
Build the timeline from parallel queries to existing tables, aggregated and sorted client-side. No dedicated events table in MVP.

### Rationale
- Creating a `customer_events` table would require writing events from every module (sales, leads, requests, etc.), increasing coupling.
- The existing tables already have `created_at` timestamps that can serve as event dates.
- For the expected scale (~thousands of customers, ~tens of events per customer), parallel queries are fast enough.
- A dedicated events table can be introduced later if needed for richer activity tracking.

### Query Strategy
On the detail page, fetch in parallel:
1. `SELECT ... FROM sales WHERE customer_id = $1`
2. `SELECT ... FROM sell_requests WHERE customer_id = $1`
3. `SELECT ... FROM leads WHERE customer_id = $1`
4. `SELECT ... FROM rental_requests WHERE customer_id = $1`
5. `SELECT ... FROM rentals WHERE customer_id = $1`
6. `SELECT ... FROM motorcycle_owners WHERE customer_id = $1` (join to consignments if needed)

Merge results into a unified timeline sorted by date descending, with event type badges.

### Consequences
- No additional table to maintain.
- Timeline data is always fresh (no sync issues).
- Performance is acceptable for expected data volumes.

---

## Decision 7: Inactivation vs Deletion

### Decision
Use soft-delete (`is_active = false`) for all customers. Physical deletion only for customers with zero relationships (and even then, prefer soft-delete in MVP).

### Rationale
- Customers with vendas, propostas, or other vínculos must never be deleted — this would break FK references and historical data.
- Soft-delete preserves the data for audit and historical queries.
- Inactive customers are hidden from search-in-sale by default but visible with explicit filter.

### Consequences
- Listagem defaults to `is_active = true` filter.
- Admin can toggle filter to see inactive customers.
- Reactivation is a simple toggle.

---

## Decision 8: Required Fields — Email

### Decision
Email is **optional** in the customer registration form. Telephone is the only required contact field alongside full name.

### Rationale
- The user's domain context confirms that most motorcycle leads arrive via WhatsApp, not email.
- The existing `sell_requests`, `leads`, and `rental_requests` tables all have email as nullable.
- The sales form requires buyer_document (CPF), buyer_cep, and buyer address fields — but those are sale-specific requirements for receipts, not general customer requirements.
- Making email required at customer level would block legitimate customer creation for walk-in buyers who provide only a phone number.

### Consequences
- Email is nullable in `customers` table.
- The sales form may continue enforcing its own stricter rules (e.g., requiring CEP for receipts) independent of the customer entity.
- If a future module requires email, it can be enforced at that module's form level.

---

## Decision 9: `motorcycle_owners` and `customers` Relationship

### Decision
Add `customer_id` FK to `motorcycle_owners`. Do NOT merge the tables. Keep `motorcycle_owners` as a domain-specific entity for consignment contracts.

### Rationale
- `motorcycle_owners` exists specifically for consignment contracts with its own data model (name, phone, email, document).
- Merging it into `customers` would break the existing consignment workflow and FK relationships.
- Adding `customer_id` FK creates the link while preserving the existing structure.
- Over time, new consignment flows can create/link a customer and associate it via the motorcycle_owner record.

### Consequences
- Consignment history appears in the customer detail page by joining through `motorcycle_owners.customer_id → consignments.owner_id`.
- The `motorcycle_owners` table continues to serve its existing purpose.

---

## Decision 10: Search and Pagination Strategy

### Decision
Server-side search and pagination using Supabase query builder with `ilike` for text search and `range()` for pagination.

### Rationale
- Supabase's PostgREST supports `ilike` for case-insensitive LIKE queries.
- For the expected scale (< 10,000 customers), `ilike` with proper indexes is performant.
- Full-text search (tsvector) is over-engineering for this scale.
- Pagination via `range(from, to)` is well-supported.

### Search Query Pattern
```sql
WHERE (
  full_name ILIKE '%term%'
  OR phone_normalized LIKE '%digits%'
  OR email_normalized ILIKE '%term%'
  OR cpf_normalized LIKE '%digits%'
)
```

### Consequences
- Simple implementation using existing Supabase patterns.
- Accent-insensitive search can be added via `unaccent` extension if needed later.
- Performance is adequate for the expected data volume.
