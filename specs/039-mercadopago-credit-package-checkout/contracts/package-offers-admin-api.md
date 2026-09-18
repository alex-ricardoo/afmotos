# Contract: Package Offers Admin API

## 1. Listagem de Ofertas Administrativas

`GET /api/admin/credit-package-offers`

**Autenticação**: Requer sessão com perfil administrativo ativo (`is_active = true` e `role IN ('admin', 'super_admin')`).

### Resposta de Sucesso (200 OK)

```json
{
  "success": true,
  "offers": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "slug": "pacote-inicial-5",
      "name": "Pacote Inicial",
      "shortLabel": "Autônomo",
      "description": "Ideal para quem compra ou vende veículos com frequência moderada.",
      "packageType": "standard",
      "creditsQuantity": 5,
      "priceCents": 18000,
      "priceFormatted": "R$ 180,00",
      "unitPriceCents": 3600,
      "unitPriceFormatted": "R$ 36,00",
      "referenceIndividualPriceCents": 3990,
      "discountPercent": 9.77,
      "isActive": true,
      "isFeatured": false,
      "displayOrder": 1,
      "contactOnly": false,
      "requiresWhatsapp": false,
      "validityDays": null,
      "createdAt": "2026-09-17T12:00:00Z",
      "updatedAt": "2026-09-17T12:00:00Z"
    },
    {
      "id": "550e8400-e29b-41d4-a716-446655440003",
      "slug": "pacote-customizado-50",
      "name": "Volume Customizado",
      "shortLabel": "Sob Medida PJ",
      "description": "Condição sob medida para leilões, concessionárias e grandes frotas.",
      "packageType": "custom",
      "creditsQuantity": 50,
      "priceCents": 0,
      "priceFormatted": "Sob Consulta",
      "unitPriceCents": 0,
      "unitPriceFormatted": "Sob Consulta",
      "referenceIndividualPriceCents": 3990,
      "discountPercent": null,
      "isActive": true,
      "isFeatured": false,
      "displayOrder": 4,
      "contactOnly": true,
      "requiresWhatsapp": true,
      "validityDays": null,
      "createdAt": "2026-09-17T12:00:00Z",
      "updatedAt": "2026-09-17T12:00:00Z"
    }
  ]
}
```

---

## 2. Criação de Oferta Administrativa

`POST /api/admin/credit-package-offers`

### Request Body

```json
{
  "name": "Pacote Especial Fim de Ano",
  "slug": "pacote-especial-fim-de-ano",
  "shortLabel": "Promocional",
  "description": "20 consultas veiculares com desconto exclusivo.",
  "packageType": "standard",
  "creditsQuantity": 20,
  "priceCents": 60000,
  "referenceIndividualPriceCents": 3990,
  "isActive": true,
  "isFeatured": true,
  "displayOrder": 2,
  "contactOnly": false,
  "requiresWhatsapp": false,
  "validityDays": 180
}
```

### Validações
- `name`: string de 3 a 100 caracteres.
- `slug`: formato kebab-case único.
- `creditsQuantity`: inteiro > 0.
- `priceCents`: inteiro > 0 quando `contactOnly = false`.
- `contactOnly = true` exige `requiresWhatsapp = true`.

### Resposta de Sucesso (201 Created)

```json
{
  "success": true,
  "message": "Oferta de pacote comercial criada com sucesso.",
  "offerId": "650e8400-e29b-41d4-a716-446655440099"
}
```

---

## 3. Edição de Oferta Administrativa

`PUT /api/admin/credit-package-offers/[id]`

Permite atualizar campos comerciais para vendas futuras sem afetar pedidos históricos já emitidos.
