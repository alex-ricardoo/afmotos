# Research & Technical Audit: Contrato de Compra de Motocicleta pela AF Motos

**Feature Directory**: `specs/019-contrato-compra-motocicleta`  
**Date**: 2026-08-31  
**Status**: Completed  

---

## 1. Auditoria do Contrato Existente e Subsistema de PDF

### 1.1 Mapeamento de Arquivos e Bibliotecas

| Componente / Função | Arquivo Atual | Biblioteca / Mecanismo | Observações |
|---|---|---|---|
| **Motor de Renderização PDF** | `app/api/agreements/generate/route.ts` | `@react-pdf/renderer` (`renderToBuffer`) | Executado exclusivamente no servidor em Node.js runtime. Não roda no browser. |
| **Template de Acordo Existente** | `lib/agreements/pdf.tsx` (`AgreementSalePDF`) | React PDF Components (`Document`, `Page`, `View`, `Text`, `Image`, `StyleSheet`) | Contrato de comissão/intermediação (1 página A4, layout com faixa dourada `#d97706`, fundo escuro `#0f172a`, cards `#f8fafc`). |
| **Emblema Placa Mercosul** | `lib/pdf/mercosul-plate-badge.tsx` (`MercosulPlateBadge`) | React PDF Component customizado | Renderiza placa padrão Mercosul (topo azul `#003399` com "BRASIL", corpo branco com borda escura `#0f172a` e placa centralizada). Largura padrão 96px, font 10.5pt. |
| **Recibo de Venda Existente** | `lib/pdf/sale-receipt.tsx` (`SaleReceiptPDF`) | React PDF Components | Template oficial de entrega para venda da AF Motos ao comprador final. Estrutura similar com grid 3 colunas e termos de garantia de 90 dias. |
| **Carregamento de Logotipo** | `app/api/agreements/generate/route.ts` (`getCurrentLogoDataUri`) | `lib/site-settings.ts` (`getSiteLogo`) + Data URI Base64 | Lê arquivo local em `public/` ou faz fetch de URL externa sem cache (`no-store`), convertendo para Base64 para evitar erros de renderização no `@react-pdf/renderer`. |
| **Dados Institucionais da Loja** | `lib/queries/settings.ts` (`getSiteSettings`) | Tabela `site_settings` + `CONSTANTS` fallback | Obtém `site_name`, `address`, `whatsapp_phone`, `contact_email`, `cnpj`. |
| **Armazenamento e Assinatura de Links** | Supabase Storage (`agreements` bucket) | `supabase.storage.from('agreements').upload` e `createSignedUrl` | Bucket privado com validade de 3600 segundos (1 hora). Bloqueia acesso anônimo. |
| **Identificadores de Documento** | `sale_agreements.id` / `sell_request.id` | UUID + Prefixo interno | Exibido no cabeçalho ou rodapé como código interno de autenticidade. |

### 1.2 Regras Visuais Mandatórias Identificadas para Reaproveitamento Literal

1. **Faixa Dourada / Laranja Institucional**:
   - Linha divisória de cabeçalho: `borderBottomWidth: 2`, `borderBottomColor: '#d97706'`, `paddingBottom: 10`, `marginBottom: 12`.
   - Borda lateral esquerda dos títulos de seção: `borderLeftWidth: 4`, `borderLeftColor: '#d97706'`, `backgroundColor: '#f8fafc'`, `paddingVertical: 5`, `paddingHorizontal: 8`.
2. **Logotipo da Loja**:
   - Caixa com cantos arredondados: `width: 48`, `height: 48`, `borderRadius: 8`, `backgroundColor: '#0f172a'`, `borderWidth: 1.2`, `borderColor: '#d97706'`, texto "AF" em dourado `#fbbf24`. Se houver imagem configurada, renderiza `Image` com `objectFit: 'contain'`.
3. **Placa Mercosul no Topo Direito**:
   - Se `vehiclePlate` estiver preenchida, invoca `<MercosulPlateBadge plate={vehiclePlate} width={96} fontSize={10.5} />`.
   - Se não houver placa, renderiza badge escuro (`backgroundColor: '#0f172a'`, `borderColor: '#d97706'`) com texto de identificação do contrato.
4. **Tratamento de CNPJ e Dados Omissos**:
   - Se `cnpj` não estiver cadastrado em `site_settings`, a linha é totalmente suprimida (não exibir "CNPJ: Não informado" ou placeholder vazio).
   - Se campos como endereço ou RG estiverem em branco, utilizar fallbacks elegantes ("Não informado").
5. **Tipografia & Cores**:
   - Família tipográfica: `Helvetica` e `Helvetica-Bold`.
   - Cores primárias: Slate escuro `#0f172a`, Amber/Gold `#d97706` e `#fbbf24`, Texto secundário `#475569` e `#64748b`, Fundo de cards `#f8fafc`, Bordas `#e2e8f0`.

---

## 2. Auditoria do Fluxo de Compra de Motocicleta no Sistema

### 2.1 Estado Atual das Tabelas e Entidades Relevantes

| Tabela | Existência no Banco | Campos Úteis Existentes | Lacunas Identificadas |
|---|---|---|---|
| `motorcycles` | Sim (`00004_motorcycles.sql`) | `id`, `brand`, `model`, `version`, `year_manufacture`, `year_model`, `mileage`, `engine_capacity`, `fuel`, `color`, `price`, `fipe_price`, `license_plate`, `renavam`, `chassi`, `ownership_type` (`'OWNED'`, `'CONSIGNMENT'`), `status` (`'AVAILABLE'`, `'SOLD'`, etc.) | Não possui campos de histórico de compra (`purchase_price`, `purchase_date`, `seller_customer_id`, `acquisition_agreement_id`). Atualmente a moto é apenas cadastrada diretamente no estoque. |
| `motorcycle_owners` | Sim (`00008_motorcycle_owners.sql`) | `id`, `name`, `phone`, `email`, `document`, `notes` | Tabela legada e simples, não integrada aos novos fluxos. |
| `customers` | Sim (`20260830000000_create_customers.sql`) | `id`, `full_name`, `phone`, `phone_normalized`, `email`, `cpf`, `cpf_normalized`, `rg`, `birth_date`, `cep`, `street`, `number`, `neighborhood`, `city`, `state`, `source`, `is_active` | Módulo CRM completo criado na Spec 016. É o local canônico para referenciar vendedores (pessoas físicas ou jurídicas). |
| `sell_requests` | Sim (`00014_sell_requests.sql`, `20260822193000_enhance_sell_request_form.sql`) | `id`, `customer_id`, `request_kind` (`'ANNOUNCEMENT'`, `'DIRECT_SALE'`), `name`, `phone`, `license_plate`, `brand`, `model`, `year_manufacture`, `year_model`, `color`, `mileage`, `desired_price`, `fipe_price`, `fipe_code`, `offer_percentage`, `estimated_offer`, `offered_amount`, `accepted_amount`, `status` | Representa solicitações públicas de "Venda sua moto" e propostas manuais de compra direta. Perfeito para originação de compras. |
| `sale_agreements` | Sim (`20260826000000_sale_agreements.sql`) | `id`, `sell_request_id`, `owner_cpf`, `owner_rg`, `owner_address`, `commission_percentage`, `commission_value`, `expected_sale_value`, `pdf_url`, `status` | Específico para intermediação/comissão de anúncios (`request_kind = 'ANNOUNCEMENT'`). **Não deve ser misturado com contratos de compra própria**. |
| `sales` | Sim (`00010_sales.sql`, `20260823000000_enhance_sales.sql`) | `id`, `motorcycle_id`, `customer_id`, `sale_price`, `sale_date`, `buyer_name`, `buyer_document`, `payment_method`, `payment_status`, `delivery_km`, `receipt_number` | Representa vendas da AF Motos para compradores finais (saída de estoque). |
| `vehicle_plate_consultations` | Sim (`20260830100000_create_vehicle_plate_consultations.sql`) | `id`, `plate_normalized`, `brand`, `model`, `risk_level`, `raw_response`, `created_at` | Histórico veicular oficial (Spec 018). Pode ser vinculado ao contrato de compra como comprovante técnico. |
| `expenses` | Sim (`20260824200000_create_expenses.sql`) | `id`, `motorcycle_id`, `category_id`, `amount`, `expense_date`, `description` | Módulo financeiro (Spec 015). Registra custos de aquisição e reparos vinculados à moto. |

### 2.2 Pontos de Entrada Administrativos Recomendados

Para evitar duplicação de processos e oferecer fluidez operacional máxima, o fluxo de geração do Contrato de Compra deve estar acessível em 3 locais estratégicos do painel:

1. **Na Central de Propostas (`/admin/propostas`)**:
   - No drawer de detalhes da proposta (`proposal-detail-drawer.tsx`), quando a proposta for do tipo "Venda Direta / Compra pela Loja" (`request_kind = 'DIRECT_SALE'` ou proposta negociada para aquisição).
   - Botão de ação primária: **"Gerar Contrato de Compra"** abrindo o modal/drawer de formalização.
2. **No Cadastro / Edição de Moto de Estoque Próprio (`/admin/motos/[id]`)**:
   - Na aba ou cabeçalho de ações da motocicleta quando `ownership_type = 'OWNED'`.
   - Permite formalizar a compra de motos cadastradas manualmente no estoque, vinculando um vendedor do módulo de clientes.
3. **No Módulo de Clientes / CRM (`/admin/clientes/[id]`)**:
   - Na aba de histórico e negociações do cliente, permitindo iniciar uma compra de veículo associada ao perfil do cliente.

---

## 3. Pesquisa Jurídica e Operacional: Aquisição de Veículos no Brasil

### 3.1 Legislação Aplicável e Conceitos Jurídicos

1. **Código Civil Brasileiro (Lei nº 10.406/2002)**:
   - *Art. 481 e seguintes (Compra e Venda)*: A compra e venda se aperfeiçoa com o acordo de vontades sobre a coisa e o preço.
   - *Art. 1.267 (Tradição)*: A propriedade de coisa móvel (incluindo veículos automotores) transfere-se entre particulares pela **tradição** (entrega física da coisa).
   - *Art. 441 e seguintes (Vícios Redibitórios / Evicção)*: O alienante responde pelos vícios ocultos da coisa existente ao tempo da alienação e pela perda da posse/propriedade por decisão judicial ou impedimento anterior (evicção - Art. 447).
2. **Código de Trânsito Brasileiro (Lei nº 9.503/1997 - CTB)**:
   - *Art. 123, § 1º*: No caso de transferência de propriedade, o prazo para o proprietário adotar as providências necessárias à efetivação da expedição do novo Certificado de Registro de Veículo é de **30 (trinta) dias**.
   - *Art. 134 (Comunicação de Venda)*: No caso de transferência de propriedade, o proprietário antigo deverá encaminhar ao órgão executivo de trânsito do Estado ou do Distrito Federal, no prazo de **60 (sessenta) dias** (redação pela Lei nº 14.071/2020), cópia autenticada do comprovante de transferência de propriedade (ou via digital - ATPV-e).
3. **Resoluções do CONTRAN e Sistema Renave / ATPV-e**:
   - A autorização para transferência eletrônica de propriedade de veículo (ATPV-e) e o Registro Nacional de Veículos em Estoque (RENAVE) para lojistas estabelecem regras específicas de entrada em estoque e guarda temporária para revenda.
4. **Responsabilidade por Infrações e Débitos Anteriores vs Posteriores**:
   - Débitos tributários (IPVA), taxas de licenciamento e multas por infrações com data/hora de cometimento **anteriores à entrega física da posse** são de responsabilidade do vendedor alienante.
   - A guarda, custódia e infrações cometidas **após a entrega física** recaem sobre a compradora (AF Motos), desde que devidamente documentada a data e hora da tradição.

### 3.2 Linguagem Contratual Cuidadosa e Proporcional

O contrato não deve emitir declarações absolutas e juridicamente nulas como "a loja nunca responderá por nada" ou "o vendedor renuncia a todos os seus direitos".  
Em vez disso, a redação deve estabelecer equilíbrio probatório claro:
- Delimitação exata da data e hora da **entrega física (tradição)**.
- Declaração expressa do vendedor quanto à inexistência ou discriminação de débitos, multas, financiamentos ou gravames.
- Compromisso mútuo e cooperação para assinatura da ATPV-e / transferência documental dentro do prazo legal.
- Discriminação exata do status financeiro da compra (quitação integral mediante comprovação de pagamento vs retenção para quitação de débitos anteriores).

---

## 4. Decisões Arquiteturais

### 4.1 Criação de Entidade Dedicada: `motorcycle_purchase_agreements`
- **Justificativa**: `sale_agreements` é semanticamente restrita a intermediações e comissões de anúncios de terceiros. A compra de moto pela loja possui campos financeiros, legais e de responsabilidade completamente distintos (preço pago pela loja, quitação concedida pelo vendedor, termo de vistoria de entrada, declaração de restrições, etc.).
- **Tabela**: `motorcycle_purchase_agreements` com chave estrangeira para `motorcycles(id)` (opcional na fase de proposta), `customers(id)` / `sell_requests(id)`, `vehicle_plate_consultations(id)` e `contract_snapshot jsonb` imutável.

### 4.2 Arquitetura de Componentes Compartilhados de PDF
Para garantir **paridade visual de 100%** e eliminar duplicação de código, os blocos estruturais do PDF serão organizados de forma modular:
- `lib/pdf/contract-header.tsx`: Cabeçalho institucional com logo, dados da loja em `site_settings` e `MercosulPlateBadge`.
- `lib/pdf/contract-section.tsx`: Contêiner de seção com a faixa dourada (`#d97706`) e título em caixa alta.
- `lib/pdf/contract-grid.tsx`: Grid de cards com labels em cinza e valores em negrito.
- `lib/pdf/contract-signatures.tsx`: Bloco de assinaturas com linhas, nomes e papéis das partes.
- `lib/pdf/contract-footer.tsx`: Rodapé com paginação, data, local e código interno do documento.
- `lib/pdf/purchase-agreement.tsx`: O documento principal de Compra e Venda de Motocicleta.

### 4.3 Idempotência e Snapshot Histórico Imutável
- Na emissão do contrato, é gerado um payload integral `contract_snapshot jsonb` gravado na linha da tabela `motorcycle_purchase_agreements`.
- O PDF é renderizado a partir desse snapshot.
- Se o cadastro da moto, cliente ou loja for alterado futuramente, o contrato emitido permanece inalterado e pode ser reimpresso com fidelidade histórica absoluta.
- Prevenção contra duplo clique via trava no client e restrição única condicional no banco de dados.
