# Runbook: Operação e Manutenção do Módulo Financeiro de Histórico Veicular

**Feature Directory**: `specs/037-vehicle-history-financial-accountant-reports`  
**Audience**: Operações, Suporte Técnico, Administradores e Engenharia  

---

## 1. Monitoramento de Incidentes Comuns

### 1.1 Alerta: "Saldo Insuficiente na API Brasil (HTTP 402)"
- **Sintoma**: O card "Falhas Permanentes" aumenta, consultas falham com código `APIBRASIL_INSUFFICIENT_CREDITS` e o laudo não é entregue.
- **Impacto Financeiro**: **Nenhum crédito é consumido** na API Brasil. O custo dessas consultas é gravado como `not_incurred` (R$ 0,00). O cliente que pagou no Mercado Pago entra na fila de estorno automático ou reprocessamento manual.
- **Ação Operacional**:
  1. O administrador deve acessar o painel da API Brasil ([https://app.apibrasil.io](https://app.apibrasil.io)) e efetuar a recarga de créditos.
  2. Após a recarga confirmada, acessar a rota `/admin/pagamentos-consultas` e acionar o botão **"Reprocessar Pendentes"** para entregar os laudos aos clientes.

### 1.2 Discrepância entre Gateway e Faturamento Líquido
- **Sintoma**: A receita líquida na Central de Relatórios diverge do saldo disponível na conta Mercado Pago.
- **Causas Frequentes**:
  1. **Tarifas de Gateway**: A receita bruta exibida é o valor pago pelo cliente (`transaction_amount`). As taxas de intermediação do Mercado Pago (ex.: taxa de cartão de crédito) dependem do plano contratado da conta comercial. O relatório foca na receita bruta aprovada e estornos confirmados.
  2. **Estornos Pendentes**: Estornos solicitados que ainda aguardam confirmação do Mercado Pago aparecem no card "Estornos Pendentes" e só reduzem a receita líquida após confirmação definitiva pelo webhook.
- **Ação**: Verificar a aba "Pagamentos e Estornos" e filtrar por `status = 'pending'` para auditar transações em conciliação.

### 1.3 Consultas por Crédito B2B sem Custo de Gateway
- **Sintoma**: Aumentou o número de consultas concluídas, mas a receita Mercado Pago não subiu na mesma proporção.
- **Causa**: Consultas originadas de pacotes B2B (`payment_coverage_type = 'platform_credit'`) consomem créditos previamente negociados e não geram transações individuais no Mercado Pago.
- **Ação**: Acessar a aba "Pacotes e Créditos" para auditar o saldo de créditos do cliente parceiro e o valor comercial do pacote negociado.

---

## 2. Auditoria e Validação de Segurança

### 2.1 Verificação de Vazamento de Segredos
Para garantir que nenhuma chave privada está sendo exposta em relatórios ou APIs públicas, execute periodicamente:
```bash
# Verifica se APIBRASIL_TOKEN aparece em arquivos client-side ou respostas
git grep "APIBRASIL_TOKEN" -- app/ components/
```

### 2.2 Auditoria de Alterações de Tarifas
Para inspecionar quem alterou o preço de venda ou custo da API Brasil:
```sql
SELECT 
    v.effective_from,
    v.effective_to,
    v.public_price_cents / 100.0 AS public_price_reais,
    v.apibrasil_live_cost_cents / 100.0 AS apibrasil_cost_reais,
    v.change_reason,
    p.name AS admin_name,
    p.email AS admin_email
FROM public.vehicle_history_pricing_versions v
JOIN public.admin_profiles p ON p.auth_user_id = v.created_by
ORDER BY v.created_at DESC;
```

---

## 3. Procedimento de Fechamento Anual com o Contador

1. **Passo 1**: Em 1º de Janeiro do ano seguinte (ou no fechamento mensal/anual), o Administrador acessa `/admin/relatorios?tab=historico-veicular`.
2. **Passo 2**: Clica na sub-aba **"Informe Anual do Contador"** e seleciona o ano encerrado (ex.: `2026`).
3. **Passo 3**: Clica em **"Exportar CSV Anual"** e salva o arquivo com o nome `informe-anual-historico-veicular-2026.csv`.
4. **Passo 4**: Envia o CSV e o resumo anual ao escritório de contabilidade com a notificação padrão:
   > *"Prezado contador, segue o relatório gerencial de vendas e custos operacionais do serviço de Histórico Veicular referente ao exercício 2026. Os valores representam o faturamento bruto aprovado em gateway, estornos processados e custos diretos de fornecedores de dados veiculares para apoio à conciliação e apuração contábil."*
