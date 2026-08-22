<!--
Sync Impact Report:
- Version change: 1.0.0 (Initial Ratification)
- Modified principles: N/A (Initial principles defined)
- Added sections: Core Principles (12 Principles), Architecture & Code Quality Guidelines, Technical Stack & Standards, Governance
- Removed sections: N/A
- Deferred items: None
-->

# AF Motos Constitution

## Core Principles

### I. Product First

O sistema MUST priorizar uma experiência simples, direta e intuitiva para três perfis principais: compradores, proprietários de motos e administradores. Qualquer funcionalidade ou fluxo de interface deve entregar valor claro a esses atores sem fricção desnecessária.

### II. Mobile First

A experiência pública MUST ser projetada primeiro para dispositivos móveis (celular), considerando que a maioria esmagadora do tráfego será originada de redes sociais como Instagram e WhatsApp. Interfaces responsivas, navegação ao alcance do polegar e rápido tempo de resposta mobile são mandatórios.

### III. Type Safety

O projeto MUST utilizar TypeScript estrito (`strict: true`), tipos compartilhados entre camadas e validação runtime rigorosa nas fronteiras de entrada de dados com Zod. Proibido o uso injustificado de `any` ou type casts inseguros.

### IV. Segurança

Credenciais privadas, chaves secretas de API e tokens de serviço NEVER podem ser expostos ao cliente/navegador. Operações privileged, mutações de dados administrativas e integrações pagas MUST ocorrer exclusivamente no lado do servidor (Server Actions / Route Handlers).

### V. Supabase como Fonte de Dados

A persistência de dados principal MUST utilizar PostgreSQL hospedado no Supabase. É proibido criar bancos de dados paralelos ou orquestradores de estado externos sem justificativa arquitetural explícita aprovada.

### VI. Componentização & Organização por Domínio

A base de código MUST ser estruturada em componentes reutilizáveis, coesos e desacoplados, organizando o código por áreas de responsabilidade/domínio (ex.: catálogo, locação, propostas, admin).

### VII. Integrações Desacopladas

APIs externas (especialmente consulta de placa/Veicular, integração com WhatsApp e provedores futuros) MUST possuir camadas de abstração (interfaces/adapters). O domínio da aplicação não pode depender diretamente de SDKs ou payloads proprietários de fornecedores específicos.

### VIII. UX Consistente

Componentes, tokens visuais, espaçamentos, tipografia e estados padrão de interface (loading, erro, vazio e sucesso) MUST seguir um sistema de design consistente em todas as telas e fluxos.

### IX. Performance & SEO

Imagens MUST ser otimizadas automaticamente (formatos modernos WebP/AVIF, lazy loading e dimensionamento correto). O carregamento inicial (LCP/FCP) deve ser prioridade máxima e todas as páginas públicas MUST cumprir as melhores práticas de SEO semântico e meta tags.

### X. Testabilidade

Regras de negócio cruciais e lógicas de cálculo/validação MUST ser isoladas e testáveis de forma independente da camada de interface ou renderização (testes unitários e de integração limpos).

### XI. Observabilidade

Eventos de negócio relevantes (ex.: visualização de moto, clique em botão do WhatsApp, envio de proposta de venda e solicitação de locação) MUST ser rastreáveis por métricas e logs estruturados para análise de conversão e produto.

### XII. Evolução Incremental

O MVP MUST focar na simplicidade e não implementar complexidades futuras desnecessárias (YAGNI). Contudo, a arquitetura MUST ser desenhada de forma extensível para suportar sem grandes refatorações futuras os módulos de consignação, locação, compra de motos, vendas e captação de leads.

## Architecture & Code Quality Guidelines

### Clean Code & Refatoração

- O código MUST ser limpo, autoexplicativo e expressivo, reduzindo a necessidade de comentários redundantes.
- Funções MUST ser pequenas, coesas e ter responsabilidade única (Single Responsibility Principle).
- Nomes de variáveis, funções e componentes devem refletir claramente o domínio em português/inglês padronizado.

### High-Level Design Patterns

- **Adapter / Gateway Pattern**: Para isolar integrações externas (consulta de placa, gateway de mensagens, storage).
- **Repository / Service Pattern**: Para separar a lógica de acesso a dados da lógica de apresentação e das regras de negócio.
- **Factory / Strategy Pattern**: Para lidar com variações de regras de negócio (ex.: diferentes tipos de propostas ou modalidades de locação).

## Technical Stack & Standards

- **Frontend / Framework**: Next.js App Router (React, Server Components, Server Actions).
- **Styling**: Tailwind CSS ou Vanilla CSS consistente seguindo Design System e tokens visuais.
- **Validação & Tipagem**: TypeScript Strict Mode + Zod Schema Validation.
- **Backend & Database**: Supabase (PostgreSQL, Row Level Security, Storage, Auth).

## Governance

1. Esta Constituição supersede quaisquer convenções ad-hoc ou decisões temporárias de desenvolvimento.
2. Qualquer alteração ou inclusão de novos princípios requer atualização formal deste documento, incremento da versão e registro no Sync Impact Report.
3. PRs e revisões de código devem atestar conformidade rigorosa com os 12 princípios constitucionais.

**Version**: 1.0.0 | **Ratified**: 2026-08-21 | **Last Amended**: 2026-08-21
