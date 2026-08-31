# Tasks & Execution Roadmap: Landing Page — Histórico Veicular

Este documento estrutura as tarefas de desenvolvimento divididas por fases lógicas e com critérios claros de conclusão e paralelismo.

---

## Fase 0 — Auditoria e Modelagem de Dados

- [x] **TASK-001**: Auditar e estender a tipagem de `site_settings` para acomodar `vehicleHistory`.  
  **Arquivos**: `types/site-settings.ts`  
  **Dependências**: Nenhuma  
  **Paralelo**: Sim  
  **Critério de Conclusão**: Interfaces `VehicleHistorySettings` e `VehicleHistoryPositioningMode` adicionadas e exportadas sem erros de tipagem.

- [x] **TASK-002**: Implementar o schema de validação Zod para configurações de histórico veicular com trava ética de preço.  
  **Arquivos**: `lib/settings/schema.ts`  
  **Dependências**: TASK-001  
  **Paralelo**: Não  
  **Critério de Conclusão**: Schema `vehicleHistorySettingsSchema` valida campos de preço, telefone, templates e bloqueia "mais barato do mercado" sem comprovação.

---

## Fase 1 — Painel Administrativo e Resolução de Configurações

- [x] **TASK-101**: Atualizar a resolução de configurações públicas para expor defaults de `vehicleHistory`.  
  **Arquivos**: `lib/site-settings.ts`, `lib/actions/settings.ts`  
  **Dependências**: TASK-001, TASK-002  
  **Paralelo**: Não  
  **Critério de Conclusão**: `resolvePublicSiteSettings()` retorna o objeto `vehicleHistory` sanitizado com fallback seguro e revalida a rota `/historico-veicular`.

- [x] **TASK-102**: Criar o componente de aba `VehicleHistoryTab` no painel administrativo de configurações.  
  **Arquivos**: `components/admin/settings/vehicle-history-tab.tsx`, `components/admin/settings-form.tsx`  
  **Dependências**: TASK-101  
  **Paralelo**: Não  
  **Critério de Conclusão**: Nova aba "Histórico Veicular" visível no painel `/admin/configuracoes`, permitindo edição, validação e salvamento de todos os campos.

---

## Fase 2 — Helper de WhatsApp e Validações de Placa

- [x] **TASK-201**: Implementar o helper de URL de WhatsApp específico para Histórico Veicular com interpolação de tags.  
  **Arquivos**: `lib/utils/whatsapp.ts`  
  **Dependências**: Nenhuma  
  **Paralelo**: Sim  
  **Critério de Conclusão**: Função `buildVehicleHistoryWhatsAppUrl()` gerando links `https://wa.me/55...` com sanitização, preço dinâmico e placas formatadas.

- [x] **TASK-202**: Escrever testes unitários para a validação de placa e geração de links de WhatsApp.  
  **Arquivos**: `lib/utils/__tests__/vehicle-history-whatsapp.test.ts`  
  **Dependências**: TASK-201  
  **Paralelo**: Não  
  **Critério de Conclusão**: Cobertura completa de casos com placa antiga, Mercosul, vazia, caracteres especiais e números de telefone com/sem DDI.

---

## Fase 3 — Hero Section, Placa Mercosul e Interatividade

- [x] **TASK-301**: Criar o componente de visualização e input da Placa Mercosul / Antiga.  
  **Arquivos**: `components/vehicle-history/mercosul-plate-input.tsx`  
  **Dependências**: TASK-201  
  **Paralelo**: Não  
  **Critério de Conclusão**: Input interativo estilizado com topo azul Mercosul, máscara automática, validação e mensagens de feedback acessíveis.

- [x] **TASK-302**: Criar a `VehicleHistoryHero` da landing page.  
  **Arquivos**: `components/vehicle-history/vehicle-history-hero.tsx`  
  **Dependências**: TASK-301  
  **Paralelo**: Não  
  **Critério de Conclusão**: Hero impactante, mobile-first, com badge de preço, título persuasivo, placa estelar e botões de ação para WhatsApp.

---

## Fase 4 — Componentes de Conteúdo e Conversão

- [x] **TASK-401**: Criar o bloco de benefícios "O que você pode consultar".  
  **Arquivos**: `components/vehicle-history/vehicle-history-benefits.tsx`  
  **Dependências**: Nenhuma  
  **Paralelo**: Sim  
  **Critério de Conclusão**: Grid responsivo de cards com ícones e ressalvas explícitas de disponibilidade das bases integradas.

- [x] **TASK-402**: Criar o bloco "Por que consultar antes de fechar negócio" e "Como funciona".  
  **Arquivos**: `components/vehicle-history/vehicle-history-reasons.tsx`, `components/vehicle-history/vehicle-history-how-it-works.tsx`  
  **Dependências**: Nenhuma  
  **Paralelo**: Sim  
  **Critério de Conclusão**: Seções com cards de segurança na compra e 4 passos ilustrados da jornada de atendimento assistido.

- [x] **TASK-403**: Criar o bloco de Preço e Oferta Comercial.  
  **Arquivos**: `components/vehicle-history/vehicle-history-pricing.tsx`  
  **Dependências**: TASK-101  
  **Paralelo**: Não  
  **Critério de Conclusão**: Card dourado premium com valor dinâmico, lista de itens inclusos e CTA de conversão.

- [x] **TASK-404**: Criar a seção de Mockup Ilustrativo do Relatório em HTML/CSS leve.  
  **Arquivos**: `components/vehicle-history/vehicle-history-report-mockup.tsx`  
  **Dependências**: Nenhuma  
  **Paralelo**: Sim  
  **Critério de Conclusão**: Demonstração visual limpa com dados fictícios e selo "Exemplo Ilustrativo".

- [x] **TASK-405**: Criar o bloco de Transparência, FAQ e CTA Final.  
  **Arquivos**: `components/vehicle-history/vehicle-history-disclaimer.tsx`, `components/vehicle-history/vehicle-history-faq.tsx`, `components/vehicle-history/vehicle-history-cta-final.tsx`  
  **Dependências**: TASK-201  
  **Paralelo**: Não  
  **Critério de Conclusão**: Accordion de FAQ acessível por teclado, aviso de não-substituição de vistoria física e botões de fechamento.

---

## Fase 5 — Montagem da Página Pública e Rota `/historico-veicular`

- [x] **TASK-501**: Montar a página Server Component `app/(public)/historico-veicular/page.tsx` integrando todos os blocos.  
  **Arquivos**: `app/(public)/historico-veicular/page.tsx`, `app/(public)/historico-veicular/loading.tsx`  
  **Dependências**: TASK-302, TASK-401, TASK-402, TASK-403, TASK-404, TASK-405  
  **Paralelo**: Não  
  **Critério de Conclusão**: Página pública 100% funcional na rota `/historico-veicular`, consumindo `getPublicSiteSettings()`.

- [x] **TASK-502**: Atualizar navegação do Header e Footer para incluir o link quando o serviço estiver ativo.  
  **Arquivos**: `components/layout/header.tsx`, `components/layout/footer.tsx`  
  **Dependências**: TASK-501  
  **Paralelo**: Não  
  **Critério de Conclusão**: Links "Histórico Veicular" visíveis no menu desktop/mobile e rodapé institucional.

---

## Fase 6 — SEO, Schemas JSON-LD e Sitemap

- [x] **TASK-601**: Implementar o gerador de JSON-LD Schema para a landing page.  
  **Arquivos**: `lib/seo/schemas/vehicle-history.ts`, `lib/seo/index.ts`, `lib/seo/__tests__/seo.test.ts`  
  **Dependências**: TASK-501  
  **Paralelo**: Não  
  **Critério de Conclusão**: Script `application/ld+json` injetando `Service`, `Offer`, `FAQPage` e `BreadcrumbList` validados.

- [x] **TASK-602**: Integrar a rota `/historico-veicular` ao gerador de sitemap dinâmico.  
  **Arquivos**: `app/sitemap.ts`  
  **Dependências**: TASK-501  
  **Paralelo**: Não  
  **Critério de Conclusão**: URL presente no `sitemap.xml` apenas quando `isEnabled === true`.

---

## Fase 7 — Validação de Segurança, Performance e Acessibilidade

- [x] **TASK-701**: Executar auditoria de rede e segurança para confirmar zero chamadas à API externa e zero persistência de placas digitadas.  
  **Arquivos**: Todo o projeto  
  **Dependências**: TASK-501  
  **Paralelo**: Não  
  **Critério de Conclusão**: Nenhuma requisição a APIs de terceiros e nenhum registro de placa em logs/banco na rota pública.

- [x] **TASK-702**: Executar validações de acessibilidade (WCAG 2.2 AA) e Core Web Vitals (LCP < 2.5s, CLS < 0.1).  
  **Arquivos**: `app/(public)/historico-veicular/page.tsx`  
  **Dependências**: TASK-501  
  **Paralelo**: Não  
  **Critério de Conclusão**: Alto contraste, navegação por teclado e tags semânticas completas.

---

## Fase 8 — Testes Finais e Documentação

- [x] **TASK-801**: Executar suite de testes automatizados e validação manual conforme o Quickstart.  
  **Arquivos**: `lib/utils/__tests__/*.test.ts`, `lib/seo/__tests__/*.test.ts`, `lib/vehicle-lookup/__tests__/*.test.ts`  
  **Dependências**: Todas as anteriores  
  **Paralelo**: Não  
  **Critério de Conclusão**: 100% dos testes passando (62/62) e TypeScript typecheck 100% limpo.
