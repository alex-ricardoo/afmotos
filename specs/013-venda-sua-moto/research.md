# Research & Architectural Decisions: Venda sua Moto para a AF Motos

**Feature**: `013-venda-sua-moto`  
**Date**: 2026-08-23  
**Status**: Completed

## 1. Auditoria do Estado Atual do Sistema

| Área | Arquivo | Estado Atual | Reutilizar | Alterar / Criar |
|---|---|---|:---:|:---:|
| **Página Pública** | `app/(public)/anunciar-sua-moto/page.tsx` | Foco comercial em anúncio / intermediação para encontrar comprador. | ❌ (Manter intacto para o propósito de anúncio) | Nenhuma alteração |
| **Nova Rota** | `app/(public)/venda-sua-moto/page.tsx` | Continha apenas redirect temporário (`redirect('/anunciar-sua-moto')`). | ❌ | **Substituir** por página completa com Hero próprio, Stepper, Simulador FIPE e Trust Bar |
| **Home Page** | `app/(public)/page.tsx` | Card "Venda sua Moto pra Nós" apontava para `/anunciar-sua-moto`. | ❌ | **Alterar** `href` para `/venda-sua-moto` |
| **Formulário** | `components/forms/anunciar-moto-form.tsx` | Formulário monolítico com FIPE em background silencioso. | ⚠️ Componentes auxiliares (`FipeBrandCombobox`, `FipeModelCombobox`, `PECityCombobox`) | **Criar** `components/forms/venda-moto-form/` com Wizard modular em etapas e Simulador FIPE interativo |
| **Validação** | `lib/validations/sell-request.ts` | Validação Zod com campos básicos de moto e proprietário. | ✅ Estrutura e helpers de municípios de PE | **Estender** para suportar `offer_percentage`, `estimated_offer`, e dados FIPE explícitos |
| **Server Actions** | `lib/actions/leads.ts` (`createSellRequestAction`) | Persiste em `sell_requests`, `sell_request_images` e `leads`. | ✅ Orquestração de tabelas e upload com ImgBB/Supabase fallback | **Atualizar** para receber e recalcular no servidor a simulação (`estimated_offer`), validar FIPE e gravar colunas dedicadas |
| **Banco de Dados** | `public.sell_requests` | Possui campos FIPE, contato, dados da moto e status. | ✅ Tabela existente | **Adicionar** colunas tipadas `offer_percentage` e `estimated_offer` com CHECK constraint |
| **Fotos** | `public.sell_request_images` | Tabela já modelada com chave estrangeira `sell_request_id`. | ✅ Total reutilização | Nenhuma alteração estrutural necessária |
| **CRM Admin** | `components/admin/admin-propostas-contacts.tsx` & `proposal-detail-drawer.tsx` | Agregação unificada via `ProposalViewModel`. | ✅ Visualização e mutação de status | **Enriquecer** gaveta de detalhes para exibir destaque do simulador, FIPE e expectativa |

---

## 2. Decisões Arquiteturais e de Negócio

### Decisão 1: Diferenciação Comercial e de Linguagem
- **Decision**: A rota `/venda-sua-moto` terá identidade comercial 100% voltada à **compra direta pela loja**, com mensagens de pagamento seguro, avaliação transparente e atendimento direto.
- **Rationale**: `/anunciar-sua-moto` tem conotação de consignação/intermediação. Na compra direta, o cliente quer velocidade e liquidez imediata. A linguagem precisa ser objetiva e responsável: não promete 100% da FIPE nem aprovação garantida sem vistoria.
- **Alternatives Considered**: Manter uma única página com abas. Rejeitado para evitar confusão de intenção no funil de marketing e SEO.

### Decisão 2: Arquitetura do Wizard / Stepper (Mobile vs Desktop)
- **Decision**: 
  - **No Mobile**: Stepper horizontal compacto com barra de progresso, navegação passo a passo (Etapa 1: Moto -> Etapa 2: FIPE & Simulador -> Etapa 3: Contato -> Etapa 4: Fotos -> Etapa 5: Revisão) e botões fixos ao alcance do polegar.
  - **No Desktop**: Layout em 2 colunas com formulário à esquerda e Card de Resumo Fixo (Sticky) à direita, atualizado em tempo real conforme cada campo é preenchido.
- **Rationale**: Alinhamento estrito com os princípios constitucionais `Product First` e `Mobile First`, eliminando scroll excessivo e mantendo clareza total dos valores.

### Decisão 3: Simulador de Proposta e Consulta FIPE
- **Decision**:
  - A consulta FIPE será acionada assim que Marca, Modelo e Ano forem selecionados.
  - O simulador apresentará seletor de percentuais configuráveis (`70%`, `75%`, `80%`, `85%`, `90%`, `95%`, `100%`) com default em `85%` ou `90%`.
  - Fórmula no cliente e servidor: `estimated_offer = round((fipe_price * offer_percentage) / 100, 2)`.
  - Campo opcional `desired_price` (expectativa do proprietário) mantido estritamente isolado da simulação matemática.
  - Exibição mandatória do disclaimer legal: *"Esta é uma estimativa inicial com base no valor FIPE. A proposta final será definida após a análise da moto e da documentação pela AF Motos."*
- **Rationale**: Transparência sem gerar passivo jurídico ou expectativa de compra garantida.

### Decisão 4: Persistência de Dados e Idempotência no Banco
- **Decision**:
  - Adicionar colunas tipadas `offer_percentage numeric(5,2)` e `estimated_offer numeric(12,2)` na tabela `public.sell_requests`.
  - Salvar no JSONB `motorcycle_data` o bloco detalhado `offer_simulation`.
  - A Server Action recalcula obrigatoriamente a fórmula no servidor para prevenir manipulação de dados no cliente.
  - Forçar `status = 'NEW'` no insert do servidor.
  - Sincronizar criação na tabela `public.leads` com tipo `SELL_MOTORCYCLE` e metadados completos.
- **Rationale**: Garante integridade de dados para queries analíticas, filtros futuros e preserva conformidade com o CRM atual.

### Decisão 5: Estratégia de Upload de Fotos e Segurança RLS
- **Decision**:
  - Reutilizar `uploadPublicSellRequestImageAction` conectada ao orquestrador central de uploads (`lib/uploads/index.ts`).
  - Fotos são salvas em `public.sell_request_images` com vínculo direto a `sell_requests.id`.
  - RLS: inserção pública permitida com `CHECK (true)` e consulta restrita a usuários autenticados (`auth.role() = 'authenticated'`).
- **Rationale**: Protege privacidade do usuário e evita exposição pública de placas ou fotos de propostas não aprovadas.

---

## 3. Riscos e Mitigações

| Risco | Impacto | Mitigação |
|---|:---:|---|
| **API FIPE fora do ar ou lenta** | Médio | Manter fallback imediato para "Digitar manualmente", permitindo que o usuário avance e informe sua expectativa de valor sem bloqueio. |
| **Envio duplicado por múltiplos cliques** | Baixo | Desabilitação de botões com feedback de carregamento (`Loader2`) e verificação de envio em andamento no estado do React Hook Form. |
| **Imagens pesadas que atrasam a submissão** | Médio | Validação de tamanho no cliente (máx 5MB), upload assíncrono durante a etapa de fotos ou envio paralelo seguro com retry. |
