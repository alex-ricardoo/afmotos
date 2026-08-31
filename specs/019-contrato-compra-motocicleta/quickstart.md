# Quickstart & Developer Guide: Contrato de Compra de Motocicleta

**Feature Directory**: `specs/019-contrato-compra-motocicleta`  
**Date**: 2026-08-31  

---

## 1. Visão Geral

Este guia orienta os desenvolvedores sobre como testar, inspecionar e validar o fluxo de geração de **Contrato de Compra de Motocicleta pela AF Motos** em ambiente local de desenvolvimento.

---

## 2. Testando a Renderização do PDF Localmente

Para validar a renderização do PDF com fidelidade visual antes da persistência no Storage:

### 2.1 Exemplo de Payload para Geração (`POST /api/admin/purchase-agreements/generate`)

```json
{
  "seller_name": "Carlos Eduardo da Silva",
  "seller_document": "12345678909",
  "seller_rg": "7654321 SDS/PE",
  "seller_phone": "81999887766",
  "seller_email": "carlos.silva@email.com",
  "seller_address": "Rua das Laranjeiras, 450, Centro, Carpina - PE, CEP 55815-000",
  "brand": "Yamaha",
  "model": "Fazer FZ25",
  "version": "ABS",
  "year_manufacture": 2023,
  "year_model": 2024,
  "color": "Azul Metálico",
  "fuel": "Gasolina",
  "engine_capacity": 250,
  "license_plate": "BRA2E19",
  "renavam": "01234567890",
  "chassi": "9C6KG0110P0000000",
  "engine_number": "G3E1E0000000",
  "mileage": 12500,
  "purchase_amount": 19500.00,
  "paid_amount": 19500.00,
  "payment_status": "PAID_FULL",
  "payment_method": "PIX",
  "payment_date": "2026-08-31",
  "is_full_discharge_confirmed": true,
  "delivery_datetime": "2026-08-31T14:30:00-03:00",
  "delivery_km": 12500,
  "keys_count": 2,
  "has_manual": true,
  "has_spare_key": true,
  "documents_delivered": ["CRLV-e 2026", "ATPV-e Assinada"],
  "accessories_delivered": ["Baú 45L", "Suporte Celular"],
  "apparent_condition_notes": "Pneu traseiro novo, revisões em dia.",
  "transfer_deadline_date": "2026-09-30",
  "confirmed_data_accurate": true,
  "confirmed_payment_realized": true,
  "confirmed_vehicle_received": true
}
```

---

## 3. Checklist de Validação Visual no PDF

Ao gerar o PDF de teste, verifique os seguintes pontos de paridade visual:

- [ ] **Cabeçalho**: Logotipo da AF Motos alinhado à esquerda com nome da loja e dados institucionais em `site_settings`.
- [ ] **CNPJ**: Se preenchido, aparece no cabeçalho; se ausente, não deixa linha em branco ou "Não informado".
- [ ] **Placa Mercosul**: No canto superior direito, com a tarja azul `BRASIL` no topo e caracteres `BRA2E19` perfeitamente centralizados no corpo branco.
- [ ] **Faixa Dourada/Laranja**: Divisória sob o cabeçalho (`#d97706`) e barra lateral esquerda nos títulos de seção.
- [ ] **Grid de Dados**: Cards com fundo `#f8fafc` e bordas `#e2e8f0`, com labels em cinza maiúsculo e valores em negrito.
- [ ] **Quadro Financeiro**: Destaque para o valor total de aquisição, forma de pagamento e declaração expressa de quitação integral.
- [ ] **Cláusulas Jurídicas**: Texto justificado, legível e organizado por tópicos numerados.
- [ ] **Assinaturas**: Linhas horizontais com nomes e qualificações da AF Motos e do Vendedor, acompanhados de espaço para duas testemunhas.
- [ ] **Rodapé**: Local, data de emissão e código interno do contrato.
