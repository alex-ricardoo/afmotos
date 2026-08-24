# Tasks: OCR Inteligente para Cadastro de Motos com Google Gemini

**Feature**: `012-motorcycle-ocr-gemini`  
**Input**: Design documents from `specs/012-motorcycle-ocr-gemini/`  
**Status**: Completed  

---

## Phase 1: Setup (Shared Infrastructure & Types)

**Purpose**: Definição de variáveis de ambiente, schemas Zod e normalizadores de dados veiculares.

- [x] T001 [P] Atualizar documentação de variáveis de ambiente em [.env.example](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/.env.example) adicionando `GEMINI_API_KEY=`
- [x] T002 [P] Implementar schemas Zod e TypeScript types do OCR veicular (`MotorcycleOcrResultSchema`, `OcrConfidenceSchema`, `MotorcycleOcrResult`) em [lib/ocr/schemas.ts](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/lib/ocr/schemas.ts)
- [x] T003 [P] Implementar funções utilitárias de normalização e sanitização de dados veiculares (`normalizePlate`, `normalizeRenavam`, `normalizeChassi`, `normalizeYear`, `normalizeEngineCapacity`, `normalizeFuel`) em [lib/ocr/normalizers.ts](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/lib/ocr/normalizers.ts)

---

## Phase 2: Foundational (Core OCR Engine & Server Route Handler)

**Purpose**: Serviço server-side do Google Gemini e endpoint de API protegido com validação de sessão e controle de acesso.

- [x] T004 Implementar o serviço de integração com Google Gemini REST API com suporte a imagem base64, prompt otimizado para documentos brasileiros (CRLV/CRV), structured JSON output e tratamento de timeout em [lib/ocr/gemini.ts](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/lib/ocr/gemini.ts)
- [x] T005 Implementar o Route Handler protegido `POST /api/admin/motorcycles/ocr` com verificação de autenticação de administrador (`admin_profiles` / `is_admin()`), validação de multipart/form-data (máx 10 MB, tipos JPEG/PNG/WebP), chamada ao Gemini e resposta sanitizada em [app/api/admin/motorcycles/ocr/route.ts](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/app/api/admin/motorcycles/ocr/route.ts)

**Checkpoint**: Camada de processamento e backend do OCR totalmente funcional e protegida.

---

## Phase 3: User Story 1 - Leitura e Preenchimento Automático via Foto/Anexo (Priority: P1) 🎯 MVP

**Goal**: Permitir ao administrador tirar foto do documento com a câmera traseira do celular ou anexar imagem no computador e preencher automaticamente os campos cadastrais do formulário sob demanda.

**Independent Test**: Acessar `/admin/motos/nova`, anexar um CRLV/CRV de exemplo, clicar em "Ler documento" e constatar o preenchimento automático dos dados no formulário sem salvar a moto no banco de dados.

### Implementation for User Story 1

- [x] T006 [US1] Criar o componente de interface de captura e upload de documento veicular com preview de imagem, suporte a `capture="environment"`, botão de disparo de OCR e estados de progresso/erro em [components/admin/motorcycle-document-ocr.tsx](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/admin/motorcycle-document-ocr.tsx)
- [x] T007 [US1] Integrar o componente de OCR no topo do Passo 1 (Ficha Técnica & Identificação) do formulário de motocicletas em [components/admin/motorcycle-form.tsx](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/admin/motorcycle-form.tsx)
- [x] T008 [US1] Implementar a injeção automática dos valores normalizados extraídos nos campos do formulário (Marca, Modelo, Versão, Ano Fab, Ano Mod, Placa, RENAVAM, Chassi, Cor, Combustível, Cilindrada) em [components/admin/motorcycle-form.tsx](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/admin/motorcycle-form.tsx)

**Checkpoint**: MVP concluído — leitura de documento e preenchimento funcional no formulário de nova moto.

---

## Phase 4: User Story 2 - Revisão Humana, Incertezas e Prevenção de Conflitos (Priority: P2)

**Goal**: Destacar visualmente campos preenchidos por IA, alertar sobre valores de baixa confiança/ilegiveis e solicitar confirmação do usuário antes de sobrescrever dados digitados manualmente.

**Independent Test**: Digitar previamente valores no formulário, acionar o OCR com dados diferentes e confirmar que o diálogo de conflitos permite escolher entre substituir ou manter os valores manuais.

### Implementation for User Story 2

- [x] T009 [P] [US2] Criar componente modal de resolução de conflitos para exibir campos divergentes e opções de substituição em [components/admin/motorcycle-ocr-conflict-modal.tsx](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/admin/motorcycle-ocr-conflict-modal.tsx)
- [x] T010 [US2] Adicionar rastreamento de campos preenchidos por IA e sinalizações visuais (badges sutis e alertas de baixa confiança/warnings) nos inputs correspondentes em [components/admin/motorcycle-form.tsx](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/admin/motorcycle-form.tsx)
- [x] T011 [US2] Conectar a detecção de conflitos de preenchimento manual ao modal de confirmação no formulário em [components/admin/motorcycle-form.tsx](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/admin/motorcycle-form.tsx)

**Checkpoint**: Revisão humana transparente com proteção contra perda de dados manuais e sinalização de confiança.

---

## Phase 5: User Story 3 - Isolamento Estrito do Documento e Privacidade (Priority: P3)

**Goal**: Garantir que a imagem do documento seja estritamente temporária no servidor, nunca seja persistida como foto da moto e não apareça no catálogo público nem em logs sensíveis.

**Independent Test**: Executar o fluxo completo de OCR, cadastrar a motocicleta com fotos reais da galeria no Passo 4 e validar que a imagem do documento não consta em `motorcycle_images` nem na vitrine pública.

### Implementation for User Story 3

- [x] T012 [US3] Auditar e assegurar que o fluxo de upload de fotos de motocicletas no Passo 4 permaneça 100% isolado do documento veicular de leitura em [components/admin/motorcycle-form.tsx](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/components/admin/motorcycle-form.tsx)
- [x] T013 [US3] Garantir que nenhum dado pessoal de proprietário (CPF/RG) ou imagem temporária seja armazenada ou logada na ação de persistência em [lib/actions/motorcycles.ts](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/lib/actions/motorcycles.ts)

**Checkpoint**: Conformidade total de segurança e privacidade documental.

---

## Phase 6: Polish & Quality Assurance

**Purpose**: Verificação de compilação, validação de tipos, linting e testes do fluxo completo.

- [x] T014 [P] Executar testes de validação estática e tipagem (`npm run typecheck` e `npm run lint`) corrigindo eventuais apontamentos
- [x] T015 Executar build de produção (`npm run build`) para assegurar integridade de pacotes e rotas
- [x] T016 Executar o checklist de validação manual documentado em [specs/012-motorcycle-ocr-gemini/quickstart.md](file:///c:/Users/Alexr/OneDrive/Ambiente%20de%20Trabalho/www/af-motos/specs/012-motorcycle-ocr-gemini/quickstart.md)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Sem dependências, inicia imediatamente.
- **Phase 2 (Foundational)**: Depende da Phase 1 (schemas e normalizadores).
- **Phase 3 (User Story 1 - MVP)**: Depende da Phase 2 (Route Handler e serviço Gemini prontos).
- **Phase 4 (User Story 2)**: Depende da Phase 3 (componente de OCR integrado).
- **Phase 5 (User Story 3)**: Depende das fases 3 e 4.
- **Phase 6 (Polish)**: Depende da conclusão das fases anteriores.

### Parallel Opportunities

- **Phase 1**: `T001`, `T002` e `T003` podem ser criados em paralelo (arquivos independentes).
- **Phase 4**: `T009` (modal de conflitos) pode ser desenvolvido em paralelo com a estrutura base.
- **Phase 6**: `T014` (typecheck/lint) pode ser executado em paralelo.

---

## Implementation Strategy (MVP First)

1. **Sprint 1 (Fundação & MVP)**: Executar Phase 1, Phase 2 e Phase 3.
2. **Validação do MVP**: Testar upload/câmera e preenchimento de campos em `/admin/motos/nova`.
3. **Sprint 2 (Refinamento & Confiança)**: Executar Phase 4 e Phase 5 (conflitos, badges visuais e validação de privacidade).
4. **Sprint 3 (Finalização)**: Executar Phase 6 (`typecheck`, `lint`, `build` e `quickstart`).
