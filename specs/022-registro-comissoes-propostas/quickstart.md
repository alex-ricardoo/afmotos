# Quickstart & Guia de Validação: Comissões por Proposta

**Feature**: `022-registro-comissoes-propostas`  
**Date**: 2026-08-31

---

## 1. Visão Rápida dos Fluxos

Este guia orienta a validação ponta a ponta dos novos fluxos de comissão por proposta na AF Motos.

```text
1. Proposta Criada (Site ou Manual)
   └── Administrador define comissão (ex: 5% sobre R$ 20.000 = R$ 1.000 previsto)
       Status: `draft` / `proposed` | Elegível: NÃO

2. Formalização de Contrato PDF
   └── Acordo emitido para o proprietário da moto
       Status: `proposed` | Elegível: NÃO

3. Venda Concretizada do Veículo de Terceiro
   └── Venda registrada no módulo /admin/vendas
       Status: `confirmed` | Elegível: SIM (Competência)
       Receita AF Motos: R$ 1.000,00 | Volume Terceiros: R$ 20.000,00

4. Baixa e Recebimento da Comissão
   └── Administrador registra recebimento (PIX / Dinheiro / Transferência)
       Status: `received` | Elegível: SIM (Caixa e Competência)

5. Proposta Cancelada ou Perdida
   └── Proposta marcada como Perdida/Cancelada
       Status: `cancelled` | Elegível: NÃO (Removida dos relatórios)
```

---

## 2. Roteiro de Testes Manuais

### Teste 1: Registro e Edição com Auditoria
1. Acesse o painel administrativo em `/admin/propostas`.
2. Abra uma proposta de anúncio/consignação.
3. No card de **Comissão da AF Motos**, defina modalidade "Percentual", informe `6%` e clique em salvar.
4. Verifique se o valor previsto calculado é exibido com precisão em BRL.
5. Edite para `5%`, preencha o motivo "Ajuste na negociação de balcão" e salve.
6. Abra o **Histórico de Alterações** e confirme o registro do snapshot anterior (6%) e atual (5%) com autor e data.

### Teste 2: Emissão de Acordo em PDF
1. No drawer da proposta, gere o contrato de consignação em PDF.
2. Verifique se o status da comissão é mantido em `proposed` e o link do documento é vinculado.
3. Acesse a Central de Relatórios (`/admin/relatorios`) no período e confirme que esta comissão **NÃO** compõe a receita.

### Teste 3: Conclusão da Venda e Elegibilidade
1. Registre a venda da motocicleta no sistema.
2. Retorne à proposta e verifique que o status da comissão mudou para `confirmed`, o valor final de venda foi sincronizado e o badge **Elegível para Relatórios** está ativo.
3. Abra a Central de Relatórios em **Regime de Competência** e ateste que a receita de comissão consta na linha correta.

### Teste 4: Baixa de Recebimento
1. No card da comissão confirmada, clique em **Registrar Recebimento**.
2. Selecione forma de pagamento "PIX", data de hoje e salve.
3. Verifique a transição para `received` e confira a inclusão do valor no **Regime de Caixa**.

### Teste 5: Cancelamento e Proteção Contra Receita Fantasma
1. Abra uma proposta em andamento com comissão e mude o status do lead para `LOST` (Perdido).
2. Verifique que a comissão assumiu o status `cancelled` e o indicador de elegibilidade foi desativado (`eligible_for_reports = false`).
3. Gere o relatório do mês e comprove a ausência de qualquer receita decorrente desta proposta.
