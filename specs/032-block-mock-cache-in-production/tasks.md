# Checklist de Tarefas: Hotfix Bloqueio de Cache Mock em Produção

---

## Fase 1: Motor de Elegibilidade de Cache
- [x] 1.1 Criar `lib/vehicle-delivery/cache-eligibility.ts` com a função pura `isCacheEntryEligibleForPaidProduction`.
- [x] 1.2 Atualizar `findExistingConsultation` em `lib/vehicle-lookup/service.ts` para suportar busca estritamente live (`{ requireLiveOnly?: boolean }`).
- [x] 1.3 Corrigir a ordenação SQL em `findExistingConsultation` para garantir que `live` venha antes de `mock` caso ambos existam.

## Fase 2: Integração com Worker de Entrega & Auditoria
- [x] 2.1 Modificar `executeSingleDeliveryJob` em `lib/vehicle-delivery/delivery-service.ts` para usar `isCacheEntryEligibleForPaidProduction`.
- [x] 2.2 Registrar evento estruturado `vehicle_delivery.cache_rejected` com `reasonCode: 'MOCK_CACHE_IN_PRODUCTION'` e IDs mascarados.
- [x] 2.3 Gravar auditoria `cache_mock_rejected_in_production` na tabela `consultation_audit_logs`.
- [x] 2.4 Bloquear execução de fixture mock em produção paga se `config.mode === 'mock'`, emitindo `APIBRASIL_MOCK_MODE_IN_PRODUCTION` e disparando estorno.

## Fase 3: UI e Proteção de Laudo Oficial
- [x] 3.1 Atualizar `components/customer/customer-vehicle-detail.tsx` para condicionar "Laudo Oficial Emitido" e "Base Senatran" a `dto.is_mock === false`.
- [x] 3.2 Exibir badge "Dados de demonstração (Ambiente de Teste)" quando `dto.is_mock === true`.
- [x] 3.3 Atualizar `app/api/cliente/consultas/[id]/pdf/route.ts` para bloquear geração de "Laudo Oficial" em produção quando for mock.

## Fase 4: Rotina de Recuperação da Consulta Afetada
- [x] 4.1 Criar script seguro `scripts/reprocess-mocked-paid-consultation.ts`.
- [x] 4.2 Testar o fluxo de recuperação com transação de teste e suíte automatizada.

## Fase 5: Testes Unitários e Validação Rigorosa
- [x] 5.1 Criar `lib/vehicle-delivery/__tests__/mock-cache-blocking.test.ts`.
- [x] 5.2 Rodar `npm test` garantindo que todos os testes passem (232 testes OK).
- [x] 5.3 Executar `npm run typecheck` (zero erros).
- [x] 5.4 Executar `npm run lint`.
- [x] 5.5 Executar `npm run build` (build Turbopack otimizado com sucesso).
